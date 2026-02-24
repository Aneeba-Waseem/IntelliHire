// cacheRepositories/InterviewSessionRepository.js
import crypto from "crypto";
import InterviewSession from "../cacheModels/InterviewSession.js";
import InterviewState from "../cacheModels/InterviewState.js";

export default class InterviewSessionRepository {
  constructor(sessionCache = []) {
    this.cache = sessionCache; // in-memory array or Redis hash
  }

  async create({ candidateId, jobId, initialState = {} }) {
    const session = new InterviewSession({
      id: crypto.randomUUID(),
      candidateId,
      jobId,
      state: new InterviewState(initialState),
    });

    this.cache.push(session);
    return session;
  }

  async findById(sessionId) {
    const data = this.cache.find((s) => s.id === sessionId);
    if (!data) return null;

    return new InterviewSession({
      ...data,
      state: new InterviewState(data.state),
    });
  }

  async updateState(sessionId, newState) {
    const session = this.cache.find((s) => s.id === sessionId);
    if (!session) return null;

    session.state =
      newState instanceof InterviewState
        ? newState
        : new InterviewState(newState);
    return session;
  }

  async endSession(sessionId) {
    const session = this.cache.find((s) => s.id === sessionId);
    if (!session) return null;

    session.endSession();
    return session;
  }

  // optional: return all sessions (useful for cache flushing or debugging)
  async all() {
    return this.cache;
  }
}