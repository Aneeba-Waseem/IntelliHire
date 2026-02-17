from glob import glob

from matching.pipeline import process_resume_batch

jd_text = """
Job Role:
Supply Chain Manager

Domains:
Supply Chain Management,
Logistics & Operations,
Procurement,
Inventory Control,
Demand Forecasting,
Vendor Management,
Process Optimization,
Data-Driven Decision Making,
ERP Systems,
Sustainability in Supply Chain

Tech Stack:
SAP ERP,
Oracle SCM,
MS Excel (Advanced),
Power BI,
Tableau,
Python (for analytics and forecasting),
SQL,
Microsoft Dynamics 365,
Warehouse Management Systems (WMS),
Transportation Management Systems (TMS),
Data Visualization Tools

Requirements:
Bachelor’s degree in Supply Chain Management, Business Administration, Industrial Engineering, or a related field
0–2 years of experience in supply chain operations, logistics, or procurement
Strong analytical skills with the ability to interpret and use data for decision-making
Knowledge of demand planning, inventory management, and procurement processes
Basic understanding of ERP and supply chain automation tools
Excellent organizational and time management abilities
Strong communication and negotiation skills with vendors and internal teams
Ability to work collaboratively across departments to improve efficiency
Exposure to sustainability practices or green supply chain initiatives is a plus
Proficiency in using dashboards and visualization tools for reporting and insights

Year of experience: 0–2 years.
"""

resume_files = glob ("resumes/*.pdf")
print("RESUME FILES:", resume_files)
print("COUNT:", len(resume_files))

profiles = process_resume_batch(resume_files, jd_text)

# CACHE now contains all profiles keyed by resume_id
print(profiles)
print()
print()
