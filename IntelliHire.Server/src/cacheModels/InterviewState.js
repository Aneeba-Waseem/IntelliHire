// cacheModels/InterviewState.js
class InterviewState {
  constructor({
    phase = "rapport",          // rapport | baseline | depth | close
    candidateType = "fresher", // fresher | experienced
    topicsCovered = [],
    currentTopic = null,
    depthLevel = 1,
    lastResponseQuality = null, // weak | ok | strong
    stuckCount = 0,
  } = {}) {
    this.phase = phase;
    this.candidateType = candidateType;
    this.topicsCovered = topicsCovered;
    this.currentTopic = currentTopic;
    this.depthLevel = depthLevel;
    this.lastResponseQuality = lastResponseQuality;
    this.stuckCount = stuckCount;
  }

  toJSON() {
    return { ...this };
  }

  clone() {
    return new InterviewState(this.toJSON());
  }
}

module.exports = InterviewState;