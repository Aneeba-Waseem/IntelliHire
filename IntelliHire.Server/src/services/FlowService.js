// services/FlowService.js
import InterviewState from "../cacheModels/InterviewState.js";
import InterviewTurnRepository from "../repositories/InterviewTurnRepository.js";
import InterviewSessionRepository from "../repositories/InterviewSessionRepository.js";

export default class FlowService {
  constructor({ aiClient, sessionRepo, turnRepo }) {
    this.aiClient = aiClient;
    this.sessionRepo = sessionRepo || new InterviewSessionRepository();
    this.turnRepo = turnRepo || new InterviewTurnRepository();
  }

  /** ------------------ AI Operations ------------------ */

  async createContextFromKeywords(keywords) {
    if (!keywords || keywords.length === 0) {
      throw new Error("Keywords are required");
    }
    return await this.aiClient.generateContext(keywords);
  }

  async convertToInterviewStyle(question) {
    if (!question) {
      throw new Error("Question is required");
    }
    return await this.aiClient.convertQuestion(question);
  }

  /** ------------------ Session Operations ------------------ */

  async createSession({ candidateId, jobId, initialState = {} }) {
    const session = await this.sessionRepo.create({
      candidateId,
      jobId,
      initialState,
    });
    return session;
  }

  async findSessionById(sessionId) {
    return await this.sessionRepo.findById(sessionId);
  }

  async updateSessionState(sessionId, newState) {
    const session = await this.sessionRepo.updateState(
      sessionId,
      new InterviewState(newState)
    );
    if (!session) throw new Error("Session not found");
    return session;
  }

  async endSession(sessionId) {
    const session = await this.sessionRepo.endSession(sessionId);
    if (!session) throw new Error("Session not found");
    return session;
  }

  async getAllSessions() {
    return await this.sessionRepo.all();
  }

  /** ------------------ Turn Operations ------------------ */

  async addInterviewTurn(sessionId, { question, answer, evaluation }) {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new Error("Session not found");

    const turn = await this.turnRepo.create({
      sessionId,
      question,
      idealAnswer: answer,
      evaluation,
      createdAt: new Date(),
    });

    return turn;
  }

  async getSessionTurns(sessionId) {
    return await this.turnRepo.findBySessionId(sessionId);
  }
}