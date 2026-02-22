// cacheModels/InterviewTurn.js
class InterviewTurn {
  constructor({
    sessionId,
    question,
    idealAnswer,
    candidateAnswer,
    evaluation = null, // can be an object like {score: 5, feedback: 'good'}
    topic,
    phase,
    depthLevel,
    createdAt = new Date(),
  }) {
    this.sessionId = sessionId;
    this.question = question;
    this.idealAnswer = idealAnswer;
    this.candidateAnswer = candidateAnswer;
    this.evaluation = evaluation;
    this.topic = topic;
    this.phase = phase;
    this.depthLevel = depthLevel;
    this.createdAt = createdAt;
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = InterviewTurn;