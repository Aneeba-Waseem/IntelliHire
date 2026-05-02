import Redis from "ioredis";

const redis = new Redis();

export default class InterviewEvaluationRepository {
  _key(sessionId) {
    return `evaluation:${sessionId}`;
  }

  async initSession(sessionId, interviewId) {
    const key = this._key(sessionId);
    
    const exists = await redis.exists(key);

    if (!exists) {
      await redis.set(
        key,
        JSON.stringify({
          sessionId,
        interviewId,
          questions: [],
          createdAt: new Date().toISOString(),
        })
      );
    }
  }

  async appendQuestion(sessionId, payload) {
    const key = this._key(sessionId);
    const raw = await redis.get(key);

    const obj = raw
      ? JSON.parse(raw)
      : { sessionId, questions: [], createdAt: new Date().toISOString() };

    // Normalize structure (this is the important part)
    const questionEntry = {
      questionId: payload.questionId,
      domain: payload.domain,
      topic: payload.topic,
      question_text: payload.question_text,
      candidate_answer: payload.candidate_answer,
      ideal_answer: payload.ideal_answer,
      phase: payload.phase,
      depthLevel: payload.depthLevel,
      timestamp: payload.timestamp || new Date().toISOString(),
      evaluation_output: payload.evaluation_output,
    };

    obj.questions.push(questionEntry);

    await redis.set(key, JSON.stringify(obj));
  }

  async getBySessionId(sessionId) {
    const raw = await redis.get(this._key(sessionId));
    return raw ? JSON.parse(raw) : null;
  }

 async clearSession(sessionId) {
  return redis.del(this._key(sessionId));
}
}