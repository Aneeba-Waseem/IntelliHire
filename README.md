# AI Technical Interviewer

An AI-powered real-time technical interview platform that conducts automated voice-based interviews, evaluates candidate responses using large language models, and generates structured performance reports for recruiters. The system uses WebRTC for live audio communication, Deepgram for speech-to-text and text-to-speech, and fine-tuned Mistral 7B and Qwen2 7B Instruct models for question generation and evaluation.

## Overview

This system simulates a real technical interview conducted entirely by an AI interviewer. Candidates participate in a live audio-only interview session where questions are spoken and simultaneously displayed as subtitles for clarity. Candidates respond verbally, and their answers are processed in real time. The system generates a well-structured report at the end of the interview.

## Key Features

### Real-time AI Interview
- Fully live interview system using WebRTC audio streaming
- AI-generated dynamic questions using fine-tuned Mistral 7B
- Adaptive conversational flow with follow-up question handling

### Speech Understanding Pipeline
- Deepgram STT for real-time speech-to-text conversion
- Subtitle rendering for AI-generated questions
- Deepgram TTS for AI interviewer voice responses

### Intelligent Evaluation System
- Qwen2 7B Instruct evaluates candidate responses
- Evaluation dimensions:
  - Technical correctness
  - Conceptual understanding
  - Relevance to the question

### Resume-Aware Questioning (RAG System)
- Resume parsing and embedding-based matching
- Context-aware question generation based on candidate profile

### Recruiter Dashboard
- Final interview report generation
- Domain-wise performance breakdown
- Downloadable structured reports (PDF/JSON)

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

## Interview Workflow
1. Recruiter uploadsthe job description and resumes in batch or standalone
2. Resume is parsed and embedded using RAG system
3. Recruiter schedules the interview.
4. Once the interview starts, Mistral 7B generates contextual interview question  
5. Question is spoken via TTS and shown as subtitles  
6. Candidate responds verbally (audio-only input)  
7. Deepgram STT converts speech to text in real time  
8. System detects clarification requests or uncertainty  
9. Qwen2 evaluates the response based on:
   - correctness  
   - understanding  
   - relevance    
10. Process repeats for next questions  
11. Final structured report is generated for recruiter  

## Cloud Infrastructure (Azure)

The system is deployed on Microsoft Azure using:

- **Azure App Service** → React frontend deployment  
- **Azure Container Apps (ACA)** → AI microservices  
- **Azure PostgreSQL** → structured data storage  
- **Azure Redis Cache** → session management and real-time state handling  
- **Azure Blob Storage** → interview recordings and generated reports  

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

### Infrastructure
- Microsoft Azure App Service
- Azure Container Apps
- Azure PostgreSQL
- Azure Redis
- Azure Blob Storage


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
