from cache.redis_Client import get_all_resumes, update_resume, set_batch_status
from matching.text_builder import build_resume_text
from matching.matcher import match_resume_to_jd  # your scoring fn

def match_batch(batch_id: str, jd_text: str):
    set_batch_status(batch_id, "matching")

    profiles = get_all_resumes(batch_id)  # parsed profiles already

    for profile in profiles:
        parsed = profile["parsed_resume"]   # already structured dict
        resume_text = build_resume_text(parsed)

        result = match_resume_to_jd(jd_text, resume_text)  # {"score":x,"is_shortlisted":y}

        profile["matching"]["score"] = round(result["score"], 4)
        profile["matching"]["is_shortlisted"] = bool(result["is_shortlisted"])
        profile["status"] = "matched"

        update_resume(batch_id, profile)

    set_batch_status(batch_id, "matched")
