// cacheModels/InterviewState.js
export default class InterviewState {
  constructor({
    phase = "rapport",
    candidateType = "fresher",
    topicsCovered = [],
    currentTopic = null,
    depthLevel = 1,
    lastResponseQuality = null, // weak | ok | strong
    stuckCount = 0,
    lastAction = null,          // "asked_question" | "received_answer"
    currentTurnId = null,       // ✅ store only id
  } = {}) {
    this.phase = phase;
    this.candidateType = candidateType;
    this.topicsCovered = topicsCovered;
    this.currentTopic = currentTopic;
    this.depthLevel = depthLevel;
    this.lastResponseQuality = lastResponseQuality;
    this.stuckCount = stuckCount;
    this.lastAction = lastAction;
    this.currentTurnId = currentTurnId;
  }

  toJSON() {
    return { ...this };
  }

  clone() {
    return new InterviewState(this.toJSON());
  }
}