from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.resume_routes import router

app = FastAPI()

# CORS settings
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

# Routes
app.include_router(router, prefix="/api/resumes")
