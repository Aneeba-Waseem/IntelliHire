// cacheModels/InterviewSession.js
const InterviewState = require("./InterviewState");

class InterviewSession {
  constructor({
    id,
    candidateId,
    jobId,
    state = new InterviewState(),
    startedAt = new Date(),
    endedAt = null,
  }) {
    this.id = id;
    this.candidateId = candidateId;
    this.jobId = jobId;
    this.state = state; // InterviewState instance
    this.startedAt = startedAt;
    this.endedAt = endedAt;
    this.turns = []; // store InterviewTurn instances
  }

  addTurn(turn) {
    this.turns.push(turn);
  }

  endSession() {
    this.endedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      candidateId: this.candidateId,
      jobId: this.jobId,
      state: this.state.toJSON(),
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      turns: this.turns.map((t) => t.toJSON()),
    };
  }
}

module.exports = InterviewSession;