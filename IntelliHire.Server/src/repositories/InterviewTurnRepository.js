// cacheRepositories/InterviewTurnRepository.js
import crypto from "crypto";
import InterviewTurn from "../cacheModels/InterviewTurn.js";
import { getRedisClient } from "../config/redisClient.js";

const redisClient = getRedisClient();

export default class InterviewTurnRepository {
  constructor() {
    // No in-memory cache - Redis is the source of truth
  }

  /* =====================================================
     CREATE TURN
  ===================================================== */
  async create(turnData) {
    const turn = new InterviewTurn({
      id: crypto.randomUUID(),
      ...turnData,
      createdAt: new Date(),
    });

    const turnKey = `turn:${turn.id}`;
    const sessionTurnsKey = `session:${turn.sessionId}:turns`;

    // Save turn data
    await redisClient.set(turnKey, JSON.stringify(turn.toJSON()));

    // Add turn ID to session's turns list (for ordering)
    await redisClient.lPush(sessionTurnsKey, turn.id);

    return turn;
  }

  /* =====================================================
     FIND ALL TURNS FOR SESSION
  ===================================================== */
  async findBySessionId(sessionId) {
    const sessionTurnsKey = `session:${sessionId}:turns`;
    
    // Get all turn IDs for this session (in order)
    const turnIds = await redisClient.lRange(sessionTurnsKey, 0, -1);
    
    if (!turnIds || turnIds.length === 0) return [];

    // Fetch all turns
    const turns = [];
    for (const turnId of turnIds) {
      const raw = await redisClient.get(`turn:${turnId}`);
      if (raw) {
        turns.push(InterviewTurn.fromJSON(JSON.parse(raw)));
      }
    }

    return turns.reverse(); // lRange returns newest first, so reverse
  }

  /* =====================================================
     FIND TURN BY ID
  ===================================================== */
  async findById(turnId) {
    const raw = await redisClient.get(`turn:${turnId}`);
    if (!raw) return null;
    return InterviewTurn.fromJSON(JSON.parse(raw));
  }

  /* =====================================================
     FIND LATEST TURN (important for safety)
  ===================================================== */
  async findLatestBySessionId(sessionId) {
    const sessionTurnsKey = `session:${sessionId}:turns`;
    
    // Get the most recent turn ID (index 0 in lRange)
    const turnIds = await redisClient.lRange(sessionTurnsKey, 0, 0);
    
    if (!turnIds || turnIds.length === 0) return null;

    const raw = await redisClient.get(`turn:${turnIds[0]}`);
    if (!raw) return null;
    
    return InterviewTurn.fromJSON(JSON.parse(raw));
  }

  /* =====================================================
     UPDATE TURN (candidateAnswer / evaluation)
  ===================================================== */
  async updateById(turnId, patchData) {
    const turn = await this.findById(turnId);
    if (!turn) return null;

    // Update only provided fields
    if (patchData.candidateAnswer !== undefined) {
      turn.candidateAnswer = patchData.candidateAnswer;
    }
    if (patchData.evaluation !== undefined) {
      turn.evaluation = patchData.evaluation;
    }
    if (patchData.topic !== undefined) {
      turn.topic = patchData.topic;
    }
    if (patchData.phase !== undefined) {
      turn.phase = patchData.phase;
    }
    if (patchData.depthLevel !== undefined) {
      turn.depthLevel = patchData.depthLevel;
    }

    // Save updated turn
    await redisClient.set(`turn:${turnId}`, JSON.stringify(turn.toJSON()));

    return turn;
  }

  /* =====================================================
     DELETE SESSION TURNS (cleanup)
  ===================================================== */
  async deleteBySessionId(sessionId) {
    const sessionTurnsKey = `session:${sessionId}:turns`;
    
    // Get all turn IDs
    const turnIds = await redisClient.lRange(sessionTurnsKey, 0, -1);
    
    // Delete each turn
    for (const turnId of turnIds) {
      await redisClient.del(`turn:${turnId}`);
    }
    
    // Delete the session turns list
    await redisClient.del(sessionTurnsKey);
  }

  /* =====================================================
     DEBUG: Get all turns
  ===================================================== */
  async all() {
    // Get all turn keys from Redis
    const keys = await redisClient.keys("turn:*");
    const turns = [];
    
    for (const key of keys) {
      const raw = await redisClient.get(key);
      if (raw) {
        turns.push(InterviewTurn.fromJSON(JSON.parse(raw)));
      }
    }
    
    return turns;
  }


}
