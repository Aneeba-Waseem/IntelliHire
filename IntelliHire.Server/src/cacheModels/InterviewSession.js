// cacheModels/InterviewSession.js
import InterviewState from "./InterviewState.js";

export default class InterviewSession {
  constructor({
    id,
    candidateId,
    jobId,
    state = {},
    startedAt = null,
    endedAt = null,
    topicsListed = [], // ✅ NEW: store topics listed by the system
  }) {
    this.id = id;
    this.candidateId = candidateId;
    this.jobId = jobId;
    this.topicsListed = topicsListed;
    this.state =
      state instanceof InterviewState
        ? state
        : new InterviewState(state);
    this.startedAt = startedAt ? new Date(startedAt) : new Date();
    this.endedAt = endedAt ? new Date(endedAt) : null;
  }

  endSession() {
    this.endedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      candidateId: this.candidateId,
      jobId: this.jobId,
      topicsListed: this.topicsListed,
      state: this.state.toJSON(),
      startedAt: this.startedAt.toISOString(),
      endedAt: this.endedAt ? this.endedAt.toISOString() : null,
    };
  }

  static fromJSON(json) {
    return new InterviewSession({
      ...json,
      startedAt: new Date(json.startedAt),
      endedAt: json.endedAt ? new Date(json.endedAt) : null,
      state: new InterviewState(json.state),
    });
  }
}