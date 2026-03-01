import Redis from "ioredis";

const redis = new Redis();

export default class InterviewEvaluationRepository {
  _key(sessionId) {
    return `interview:evaluation:${sessionId}`;
  }

  async initSession(sessionId) {
    const key = this._key(sessionId);
    const exists = await redis.exists(key);
    if (!exists) {
      await redis.set(
        key,
        JSON.stringify({
          sessionId,
          questions: [],
        })
      );
    }
  }

  async appendQuestion(sessionId, data) {
    const key = this._key(sessionId);
    const raw = await redis.get(key);
    const obj = raw ? JSON.parse(raw) : { sessionId, questions: [] };

    obj.questions.push(data);

    await redis.set(key, JSON.stringify(obj));
  }

  async getBySessionId(sessionId) {
    const raw = await redis.get(this._key(sessionId));
    return raw ? JSON.parse(raw) : null;
  }
}