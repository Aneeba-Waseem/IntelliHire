from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.resume_routes import router as resume_router
from app.api.stt_controller import router as stt_router
from app.api.chatModel.qna_routes import router as qna_router
from app.api.chatModel.groq_routes import router as groq_router
from app.api.chatModel import qna_routes

app = FastAPI(title="IntelliHire AI")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Mistral once at startup
@app.on_event("startup")
async def startup_event():
    print("🚀 Server starting...")
    qna_routes.load_model_once()
    print("✅ Server ready")

# Routers
app.include_router(resume_router, prefix="/api/resumes")
app.include_router(stt_router, prefix="/api/stt")
app.include_router(qna_router, prefix="/api/chatModel/qna")
app.include_router(groq_router, prefix="/api/chatModel/groq")

@app.get("/")
async def root():
    return {"message": "IntelliHire AI running"}