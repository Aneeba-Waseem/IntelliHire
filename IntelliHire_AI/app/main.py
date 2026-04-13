from logging import getLogger

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Existing routers
from app.api.resume_routes import router as resume_router
# from app.api.stt_controller import router as stt_router
from app.api.chatModel.qna_routes import router as qna_router
from app.api.chatModel.groq_routes import router as groq_router
from app.api.chatModel import qna_routes
from app.api import evaluator_routes as evaluator_router

# New routers (WebRTC + TTS)
from app.api.webrtc_controller import router as webrtc_router
from app.realtime.STT.deepgram_manager import init_deepgram_manager, get_deepgram_manager

from dotenv import load_dotenv
import os

# Load env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
logger = getLogger(__name__)

app = FastAPI(title="IntelliHire AI")

# CORS (merged for frontend + WebRTC testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "*"  # allow WebRTC testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup
@app.on_event("startup")
async def startup_event():
    print("🚀 Server starting...")
    qna_routes.load_model_once()
    print("✅ Server ready")
    """Initialize Deepgram manager on app startup."""
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        raise ValueError("DEEPGRAM_API_KEY environment variable not set")
    
    manager = init_deepgram_manager(api_key=api_key)
    logger.info("✅ Deepgram manager initialized")
    
# ======================
# Routers
# ======================

app.include_router(resume_router, prefix="/api/resumes")
app.include_router(qna_router, prefix="/api/chatModel/qna")
app.include_router(groq_router, prefix="/api/chatModel/groq")
app.include_router(evaluator_router.router, prefix="/api/evaluator")
app.include_router(webrtc_router, prefix="/api/webrtc")
# app.include_router(tts_router, prefix="/api/tts")

# Root
@app.get("/")
async def root():
    return {"status": "IntelliHire AI running"}

@app.on_event("shutdown")
async def shutdown():
    """Clean up all Deepgram sessions on app shutdown."""
    try:
        manager = get_deepgram_manager()
        await manager.close_all_sessions()
        logger.info("✅ All Deepgram sessions closed")
    except RuntimeError:
        logger.warning("⚠️ Deepgram manager was not initialized")