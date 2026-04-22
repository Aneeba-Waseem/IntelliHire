import os
import json
import re
import time
import hashlib
import fitz
from docx import Document
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

CACHE_DIR = ".resume_cache"
os.makedirs(CACHE_DIR, exist_ok=True)


# -------------------------------
# File Readers (unchanged)
# -------------------------------
def read_pdf_with_links(path: str) -> str:
    doc = fitz.open(path)
    content = []
    for page in doc:
        text = page.get_text("text")
        links = page.get_links()
        urls = [link.get("uri") for link in links if link.get("uri")]
        if urls:
            text += "\n\n[EXTRACTED LINKS]\n" + "\n".join(urls)
        content.append(text)
    return "\n\n".join(content)

def read_docx(path: str) -> str:
    document = Document(path)
    return "\n".join([para.text for para in document.paragraphs])

def read_txt(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def load_resume_text(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return read_pdf_with_links(path)
    elif ext == ".docx":
        return read_docx(path)
    elif ext == ".txt":
        return read_txt(path)
    else:
        raise ValueError(f"Unsupported resume format: {ext}")


# -------------------------------
# Cache Helpers
# -------------------------------
def _cache_key(path: str) -> str:
    """Hash file content so cache invalidates if the file changes."""
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

def _cache_path(key: str) -> str:
    return os.path.join(CACHE_DIR, f"{key}.json")

def _load_cache(key: str) -> dict | None:
    cp = _cache_path(key)
    if os.path.exists(cp):
        with open(cp, "r") as f:
            return json.load(f)
    return None

def _save_cache(key: str, data: dict):
    with open(_cache_path(key), "w") as f:
        json.dump(data, f, indent=2)


# -------------------------------
# Retry with Exponential Backoff
# -------------------------------
def _invoke_with_retry(llm, prompt_text: str, max_retries: int = 4) -> str:
    """
    Retries on 429 with exponential backoff.
    Delays: 10s → 20s → 40s → 80s
    """
    delay = 10
    for attempt in range(max_retries):
        try:
            response = llm.invoke(prompt_text)
            return response.content
        except Exception as e:
            err = str(e).lower()
            is_rate_limit = "429" in err or "quota" in err or "resource_exhausted" in err
            if is_rate_limit and attempt < max_retries - 1:
                print(f"[Rate limit] Attempt {attempt + 1} hit 429. Waiting {delay}s...")
                time.sleep(delay)
                delay *= 2
            else:
                raise


# -------------------------------
# JSON Parser
# -------------------------------
def safe_json_parse(text: str) -> dict:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("No JSON object found in LLM response")
    return json.loads(match.group())


# -------------------------------
# Main Parser
# -------------------------------
def parse_resume(path: str) -> dict:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Resume not found: {path}")

    # --- Cache check ---
    key = _cache_key(path)
    cached = _load_cache(key)
    if cached:
        print(f"[Cache hit] Returning cached result for {os.path.basename(path)}")
        return cached

    resume_text = load_resume_text(path)

    if not os.getenv("GOOGLE_API_KEY"):
        raise ValueError("GOOGLE_API_KEY not found.")

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)

    prompt = PromptTemplate(
        input_variables=["resume"],
        template="""
You are an expert resume parser.

IMPORTANT:
- Use exact URLs found in the resume text or under [EXTRACTED LINKS]
- Do NOT infer or fabricate GitHub or LinkedIn URLs
- If no explicit URL exists, return null

Extract:
- Full name
- Contact info (email, phone)
- GitHub link
- LinkedIn link
- Highest qualification
- University
- Experience (chronological, label technical vs non-technical)
- Projects (name, description, tech stack)
- Coursework keywords
- Technical skills summary
- Extracurricular / leadership experience

Rules:
- Preserve chronological order
- Output ONLY a JSON object
- Use exactly these keys:
{{
  "name", "contact_info", "github_link", "linkedin",
  "qualification", "university", "experience", "projects",
  "coursework_keywords", "skills_summary", "extracurricular"
}}
- Set missing fields to null

Resume:
{resume}

JSON:
"""
    )

    raw = _invoke_with_retry(llm, prompt.format(resume=resume_text))
    result = safe_json_parse(raw)

    # --- Save to cache ---
    _save_cache(key, result)
    print(f"[Cached] Saved result for {os.path.basename(path)}")

    return result