from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Resume routes
from api.resume_routes import router as resume_router

# STT routes
from api.stt_controller import router as stt_router


app = FastAPI()

# CORS
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modules
app.include_router(resume_router, prefix="/api/resumes")
app.include_router(stt_router, prefix="/api/stt")


@app.get("/")

@app.on_event("startup")
async def startup_event():
    print("IntelliHire AI server started")