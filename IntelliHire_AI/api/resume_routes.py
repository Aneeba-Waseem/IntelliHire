from fastapi import APIRouter, UploadFile, File
import os, uuid, threading
from services.batch_worker import process_batch
from cache.redis_Client import get_batch_status, get_all_resumes

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)



@router.post("/upload")
async def upload_resumes(files: list[UploadFile] = File(...)):
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

    if status == "parsed":
        profiles = get_all_resumes(batch_id)
        return {"status": "parsed", "profiles": profiles}

    return {"status": status}
