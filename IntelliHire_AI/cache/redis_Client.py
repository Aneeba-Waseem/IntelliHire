import redis
import json

r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

def save_resume(batch_id: str, resume_profile: dict):
    r.hset(batch_id, resume_profile["resume_id"], json.dumps(resume_profile))

def get_all_resumes(batch_id: str):
    return [json.loads(v) for v in r.hvals(batch_id)]

def set_batch_status(batch_id: str, status: str):
    r.set(f"{batch_id}_status", status)

def get_batch_status(batch_id: str):
    return r.get(f"{batch_id}_status") or "unknown"
