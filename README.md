# IntelliHire: AI-Powered Interview Platform

## Project Overview

IntelliHire is an AI-powered platform designed to streamline and automate the hiring process through intelligent technical interviews.
The system simulates a real interviewer by leveraging speech-to-text and text-to-speech technologies, creating an interactive and engaging
interview experience. IntelliHire evaluates technical competency, generates structured reports that help recruiters make fair, data-driven, and efficient hiring decisions.


Sprint 1 -- Implemented Features

-   **Frontend pages**: Optimized UI (landing page, auth page, interview interface, HR dashboard).
-   **Resume Parser (v1)**: Extracts key candidate details and skills.
-   **Dynamic Question Generation**: Domain specific question generation.
-   **Question Generation Dataset** (Domain-Specific):
     Designed and created a dataset from scratch, consisting of 3,176 technical questions spanning multiple computer science and software engineering domains.
     The dataset is used for training and fine-tuning the LLM to generate relevant, role-specific interview questions.
     ### Covered Domains
     - Object-Oriented Programming (OOP)
     - Data Structures & Algorithms (DSA)
     - Databases
     - Operating Systems (OS)
     - Computer Networks
     - Machine Learning (ML)
     - Deep Learning (DL)
     - Computer Vision (CV)
     - Large Language Models (LLMs)
     - System Design
     - DevOps
     - Web Development
     - Mobile App Development
     - Software Engineering

    
## Technology Stack

### Core Application
- **Frontend**: React.js 

### AI & Data Processing
- **AI Module**: Fine-tuned Large Language Model (LLM)
- **Resume Parsing**: Python, LangChain
- **Vector Database**: FAISS (local)

### Audio Processing
- **Speech-to-Text & Text-to-Speech**: ElevenLabs

### Dev
- **Version Control**: Git, GitHub

## Setup Instructions

``` bash
git clone https://github.com/org/intellihire.git
cd intellihire
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Future Enhancements

- Integration of standalone modules
- Further iteration on fine tuning of model
