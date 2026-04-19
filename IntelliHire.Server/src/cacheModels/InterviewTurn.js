// cacheModels/InterviewTurn.js
export default class InterviewTurn {
  constructor({
    id = null,
    sessionId,
    question,
    idealAnswer = null,
    candidateAnswer = null,
    evaluation = null,
    topic = null,
    phase = null,
    depthLevel = 1,
    createdAt = null,
    isSystem = false, // ✅ NEW: flag to identify system-generated turns
  }) {
    this.id = id;
    this.sessionId = sessionId;
    this.question = question;
    this.idealAnswer = idealAnswer;
    this.candidateAnswer = candidateAnswer;
    // Handle evaluation properly
    this.evaluation = evaluation
      ? typeof evaluation === "object" && !Array.isArray(evaluation)
        ? evaluation
        : null
      : null;
    this.topic = topic;
    this.phase = phase;
    this.depthLevel = depthLevel;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.isSystem = isSystem;
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      question: this.question,
      idealAnswer: this.idealAnswer,
      candidateAnswer: this.candidateAnswer,
      evaluation: this.evaluation || null,
      topic: this.topic,
      phase: this.phase,
      depthLevel: this.depthLevel,
      createdAt: this.createdAt.toISOString(),
      isSystem: this.isSystem,
    };
  }

  static fromJSON(json) {
    return new InterviewTurn({
      ...json,
      createdAt: new Date(json.createdAt),
    });
  }
}