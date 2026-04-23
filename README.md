# AI Technical Interviewer

An AI-powered real-time technical interview platform that conducts automated video and audio based interviews, evaluates candidate responses using large language models, and generates structured performance reports for recruiters. The system uses WebRTC for live audio communication, Deepgram for speech-to-text and text-to-speech, and fine-tuned Mistral 7B and Qwen2 7B Instruct models for question generation and evaluation.

## Overview

This system simulates a real technical interview conducted entirely by an AI interviewer. Candidates participate in a live audio-only interview session where questions are spoken and simultaneously displayed as subtitles for clarity. Candidates respond verbally, and their answers are processed in real time. The system generates a well-structured report at the end of the interview.

## Key Features

### Interview Scheduling

* The HR manager provides the job description, required domains, tech stack, and other job requirements.
* A batch of resumes is uploaded, and the system evaluates and scores them against the job description.
* HR reviews the results and can add additional candidates to the shortlisted pool if needed.
* Interviews are then scheduled for shortlisted candidates, who can join at the designated time.

### Real-time AI Interview
- Fully live interview system using WebRTC audio streaming
- AI-generated dynamic questions using fine-tuned Mistral 7B
- Adaptive conversational flow with follow-up question handling

### Speech Understanding Pipeline
- Deepgram STT for real-time speech-to-text conversion
- Subtitle rendering for AI-generated questions
- Deepgram TTS for AI interviewer voice responses

### Resume and Domain Aware Questioning (RAG System)
- Resume parsing and embedding-based matching
- Context-aware question generation based on candidate profile and job description

### Conversational Analysis
- gpt-oss-20b analyses the candidate's response to determine its routing.
- Three types are responses are entertained:
  - Normal speech
  - Request for clarification (eg: Can you repeat the question?)
  - Unability to answer (eg: I don't know)
  
### Evaluation System
- Qwen2 7B Instruct evaluates candidate responses
- Evaluation dimensions:
  - Technical correctness
  - Conceptual understanding
  - Relevance to the question

### Report Generation

* The system uses **Qwen2 7B Instruct** to evaluate candidates and generate insights.
* Based on the evaluation, it automatically produces two types of reports: a **summary report** and a **detailed report**.
* The summary provides a quick overview of candidate performance, while the detailed report includes in-depth scoring and analysis.
* HR can review both formats and download them for record-keeping or further decision-making.

### Recruiter Dashboard
- Final interview report generation
- Domain-wise performance breakdown
- Downloadable structured reports (PDF)

## System Architecture

The system follows a distributed microservices architecture:

### Frontend (React)
- Real-time interview UI
- WebRTC audio handling
- Subtitle rendering system

### Backend (Node.js)
- WebSocket communication layer
- Session management
- Real-time event coordination

### AI Services (Python)
- **Mistral 7B (fine-tuned)** → Question generation engine
- **Qwen2 7B Instruct** → Response evaluation engine
- RAG pipeline for resume parsing and matching

### Real-time Communication
- WebRTC → audio streaming
- WebSockets → signaling and orchestration

### Data Storage
- PostgreSQL
- Redis Cache

## Interview Workflow
1. Recruiter uploadsthe job description and resumes in batch or standalone
2. Resume is parsed and embedded using RAG system
3. Recruiter schedules the interview
4. On scheduling, each candidate receives an auto-generated email containing basic rules and a one-time link of the interview
5. Once the interview starts, Mistral 7B generates contextual interview question  
6. Question is spoken via TTS and shown as subtitles  
7. Candidate responds verbally (audio-only input)  
8. Deepgram STT converts speech to text in real time  
9. System detects clarification requests or uncertainty  
10. Qwen2 evaluates the response based on:
   - correctness  
   - understanding  
   - relevance    
11. Process repeats for next questions  
12. Final structured report is generated for recruiter  

## Deployment
The system is deployed on Vercel.

## Tech Stack

### Frontend
- React.js
- WebRTC APIs
- WebSockets

### Backend
- Node.js
- Express.js
- WebSocket server

### AI / ML
- Fine-tuned **Mistral 7B** (question generation)
- **Qwen2 7B Instruct** (evaluation engine)
- Retrieval-Augmented Generation (RAG) for resume understanding
- Deepgram STT + TTS

### Database
- PostgreSQL

## Output System

### Recruiter View
- Final interview score
- Skill-wise performance breakdown
- Strengths and weaknesses analysis
- Downloadable detailed report

### Candidate View
- Live AI interview interaction
- Voice-only responses
- Subtitle-assisted question display

## Design Principles

- **Fair Evaluation** → candidates cannot see scoring during interview  
- **Low Latency System** → WebRTC + streaming-based architecture  
- **Context-Aware Interviewing** → resume-based adaptive questioning  
- **Scalable Microservices** → separated AI, backend, and frontend services  

## Project Info

Final Year Design Project (FYDP)  
Built for academic evaluation and industry-grade AI interview simulation.
