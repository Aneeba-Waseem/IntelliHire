export default class InterviewState {
  constructor(data = {}) {
    this.phase               = data.phase ?? "rapport";
    this.candidateType       = data.candidateType ?? "fresher";
    this.topicsCovered       = data.topicsCovered ?? [];
    this.currentTopic        = data.currentTopic ?? null;
    this.depthLevel          = data.depthLevel ?? 1;
    this.lastResponseQuality = data.lastResponseQuality ?? null;
    this.stuckCount          = data.stuckCount ?? 0;
    this.lastAction          = data.lastAction ?? null;
    this.currentTurnId       = data.currentTurnId ?? null;
  }

  toJSON() {
    return { ...this };
  }

  clone() {
    return new InterviewState(this.toJSON());
  }
}