# from uuid import uuid4
# from typing import Dict


# def create_resume_profile(
#     parsed_resume: Dict,
#     match_score: float,
#     is_shortlisted: bool
# ) -> Dict:
#     """
#     Creates a standardized resume profile object.

#     Args:
#         parsed_resume (dict): Output from resume parser
#         match_score (float): JDresume similarity score
#         is_shortlisted (bool): AI shortlist decision

#     Returns:
#         dict: Resume profile
#     """

#     return {
#         "resume_id": str(uuid4()),
#         "parsed_resume": parsed_resume,
#         "matching": {
#             "score": round(match_score, 4),
#             "is_shortlisted": is_shortlisted
#         }
#     }

from uuid import uuid4
from typing import Dict

def create_resume_profile(parsed_resume: Dict) -> Dict:
    """
    Creates a standardized resume profile object for caching.

    Args:
        parsed_resume (dict): Output from resume parser

    Returns:
        dict: Resume profile ready to store in cache
    """

    return {
        "resume_id": str(uuid4()),           # unique id per resume
        "parsed_resume": {
            "name": parsed_resume.get("name"),
            "contact_info": parsed_resume.get("contact_info"),
            "github_link": parsed_resume.get("github_link"),
            "linkedin": parsed_resume.get("linkedin"),
            "qualification": parsed_resume.get("qualification"),
            "university": parsed_resume.get("university"),
            "experience": parsed_resume.get("experience"),
            "projects": parsed_resume.get("projects"),
            "coursework_keywords": parsed_resume.get("coursework_keywords"),
            "skills_summary": parsed_resume.get("skills_summary")
        },
        "matching": {
            "score": None,                   # To be calculated later
            "is_shortlisted": None           # To be decided later
        },
        "status": "parsed"                    # 'parsed', 'matched', or 'saved'
    }

