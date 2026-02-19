from fastapi import APIRouter, UploadFile, File
import os, uuid, threading
from services.batch_worker import process_batch
from cache.redis_Client import get_batch_status, get_all_resumes
from cache.redis_Client import update_shortlist_status
from services.matching_service import match_batch
from cache.redis_Client import get_batch_status, get_all_resumes
from pydantic import BaseModel  
from fastapi import Form
from fastapi import Body

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)



@router.post("/upload")
async def upload_resumes(files: list[UploadFile] = File(...) ,  batch_id: str | None = Form(None)):
    if not batch_id:
        batch_id = str(uuid.uuid4())
    file_paths = []

    for file in files:
        path = os.path.join(UPLOAD_DIR, f"{batch_id}_{file.filename}")
        with open(path, "wb") as f:
            f.write(await file.read())
        file_paths.append(path)

    print("Upload received. Batch:", batch_id)

    threading.Thread(
        target=process_batch,
        args=(file_paths, batch_id),
        daemon=True
    ).start()

    return {"status": "processing", "batch_id": batch_id}

@router.get("/status/{batch_id}")
def check_status(batch_id: str):
    status = get_batch_status(batch_id)

    if status in ["parsed", "matched"]:
        profiles = get_all_resumes(batch_id)
        return {"status": status, "profiles": profiles}

    return {"status": status}



class MatchRequest(BaseModel):
    jd_text: str


@router.post("/match/{batch_id}")
def start_matching(batch_id: str, req: MatchRequest):
    # Start background matching (same async style as parsing)
    threading.Thread(
        target=match_batch,
        args=(batch_id, req.jd_text),
        daemon=True
    ).start()

    return {"status": "matching", "batch_id": batch_id}

# get profiles by batchId
@router.get("/profiles/{batch_id}")
def get_profiles(batch_id: str):
    profiles = get_all_resumes(batch_id)
    status = get_batch_status(batch_id)
    return {"status": status, "profiles": profiles}


@router.post("/shortlist/{batch_id}")
def update_shortlist(batch_id: str, data: dict = Body(...)):
    resume_id = data.get("resume_id")
    is_shortlisted = data.get("is_shortlisted")

    update_shortlist_status(batch_id, resume_id, is_shortlisted)
