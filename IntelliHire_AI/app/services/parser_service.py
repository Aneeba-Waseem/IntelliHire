from ..parser.resume_parser import parse_resume
from ..models.resume_profile import create_resume_profile
from ..cache.redis_Client import save_resume

def parse_and_store(file_path: str, batch_id: str):
    try:
        print("Parsing:", file_path)

        parsed = parse_resume(file_path)

        # Correct call
        profile = create_resume_profile(parsed)

        print("Saving resume:", profile["resume_id"])
        save_resume(batch_id, profile)

    except Exception as e:
        print("Error parsing file:", file_path, e)
def parse_and_store(file_path: str, batch_id: str):
    try:
        print("Parsing:", file_path)

        parsed = parse_resume(file_path)

        # This already creates unique resume_id
        profile = create_resume_profile(parsed)

        print("Saving:", profile["resume_id"])
        save_resume(batch_id, profile)

    except Exception as e:
        print("Error:", e)
