// cacheRepositories/InterviewSessionRepository.js
import crypto from "crypto";
import InterviewSession from "../cacheModels/InterviewSession.js";
import InterviewState from "../cacheModels/InterviewState.js";
import { redisClient } from "../config/redisClient.js";

export default class InterviewSessionRepository {
  /* =====================================================
     CREATE
  ===================================================== */
  async create({ candidateId, jobId, initialState = {}, topicsListed = [] }) {
    const session = new InterviewSession({
      id: crypto.randomUUID(),
      candidateId,
      jobId,
      state: new InterviewState(initialState),
      topicsListed,
    });

    const sessionKey = `session:${session.id}`;

    // Save session data with expiration (e.g., 24 hours)
    await redisClient.set(
      sessionKey,
      JSON.stringify(session.toJSON()),
      "EX",
      86400 // 24 hours in seconds
    );

    // Index session by candidateId for quick lookup
    await redisClient.lPush(
      `candidate:${candidateId}:sessions`,
      session.id
    );

    return session;
  }

  /* =====================================================
     FIND BY ID
  ===================================================== */
  async findById(sessionId) {
    const raw = await redisClient.get(`session:${sessionId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return InterviewSession.fromJSON(data);
  }

  /* =====================================================
     FIND BY CANDIDATE ID
  ===================================================== */
  async findByCandidate(candidateId) {
    const sessionIds = await redisClient.lRange(
      `candidate:${candidateId}:sessions`,
      0,
      -1
    );

    if (!sessionIds || sessionIds.length === 0) return [];

    const sessions = [];
    for (const sessionId of sessionIds) {
      const session = await this.findById(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /* =====================================================
     UPDATE STATE
  ===================================================== */
  async updateState(sessionId, newState) {
    const session = await this.findById(sessionId);
    if (!session) return null;

    session.state =
      newState instanceof InterviewState
        ? newState
        : new InterviewState(newState);

    await redisClient.set(
      `session:${sessionId}`,
      JSON.stringify(session.toJSON()),
      "EX",
      86400 // Refresh TTL
    );

    return session;
  }

  /* =====================================================
     END SESSION
  ===================================================== */
  async endSession(sessionId) {
    const session = await this.findById(sessionId);
    if (!session) return null;

    session.endSession();

    await redisClient.set(
      `session:${sessionId}`,
      JSON.stringify(session.toJSON()),
      "EX",
      86400
    );

    return session;
  }

  /* =====================================================
     DELETE SESSION
  ===================================================== */
  async delete(sessionId) {
    const session = await this.findById(sessionId);
    if (!session) return;

    await redisClient.del(`session:${sessionId}`);

    // Remove from candidate's session list
    await redisClient.lRem(
      `candidate:${session.candidateId}:sessions`,
      0,
      sessionId
    );
  }

  /* =====================================================
     DELETE ALL SESSIONS FOR CANDIDATE (cleanup)
  ===================================================== */
  async deleteByCandidate(candidateId) {
    const sessionIds = await redisClient.lRange(
      `candidate:${candidateId}:sessions`,
      0,
      -1
    );

    for (const sessionId of sessionIds) {
      await this.delete(sessionId);
    }
  }

  /* =====================================================
     DEBUG: Get all sessions
  ===================================================== */
  async all() {
    const keys = await redisClient.keys("session:*");
    const sessions = [];

    for (const key of keys) {
      const raw = await redisClient.get(key);
      if (raw) {
        sessions.push(InterviewSession.fromJSON(JSON.parse(raw)));
      }
    }

    return sessions;
  }

  async getJob(jobId) {
    const jobCache = await redisClient.get(`job:${jobId}`);
    if (!jobCache) return null;
    return JSON.parse(jobCache);
  } 
    async incrementTurns(sessionId) {
  const key = `session:${sessionId}`;

  const raw = await redisClient.get(key);
  if (!raw) return null;

  const session = JSON.parse(raw);
  session.turnsCount = (session.turnsCount || 0) + 1;

  await redisClient.set(key, JSON.stringify(session), "EX", 86400);
}
}