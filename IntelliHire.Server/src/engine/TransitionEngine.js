// engine/TransitionEngine.js

class TransitionEngine {
  apply({ state, evaluation, totalTurnsInPhase, availableTopics }) {
    // 1️⃣ Update last response quality
    if (evaluation) {
      state.lastResponseQuality = evaluation.quality;

      if (evaluation.quality === "weak") {
        state.stuckCount += 1;
      } else {
        state.stuckCount = 0;
      }
    }

    // 2️⃣ Phase Transitions
    this.handlePhaseTransitions(state, totalTurnsInPhase);

    // 3️⃣ Depth adjustments
    this.handleDepthAdjustments(state);

    // 4️⃣ Topic switching logic
    this.handleTopicSwitch(state, availableTopics);

    // 5️⃣ Decide next action for LLM
    const nextAction = this.decideNextAction(state);

    return {
      updatedState: state,
      nextAction,
    };
  }

  handlePhaseTransitions(state, totalTurnsInPhase) {
    if (state.phase === "rapport" && totalTurnsInPhase >= 2) {
      state.phase = "baseline";
      state.depthLevel = 1;
      return;
    }

    if (state.phase === "baseline" && state.lastResponseQuality === "strong") {
      state.phase = "depth";
      state.depthLevel = 2;
      return;
    }

    if (state.phase === "depth" && state.stuckCount >= 2) {
      state.depthLevel = Math.max(1, state.depthLevel - 1);
    }
  }

  handleDepthAdjustments(state) {
    if (state.phase !== "depth") return;

    if (state.lastResponseQuality === "strong") {
      state.depthLevel += 1;
    }

    if (state.lastResponseQuality === "weak") {
      state.depthLevel = Math.max(1, state.depthLevel - 1);
    }
  }

  handleTopicSwitch(state, availableTopics) {
    const maxDepth = 4;

    if (state.depthLevel >= maxDepth) {
      state.topicsCovered.push(state.currentTopic);

      const nextTopic = availableTopics.find(
        (t) => !state.topicsCovered.includes(t)
      );

      if (nextTopic) {
        state.currentTopic = nextTopic;
        state.depthLevel = 1;
      } else {
        state.phase = "close";
      }
    }
  }

  decideNextAction(state) {
    if (state.phase === "rapport") {
      return "light_question";
    }

    if (state.phase === "baseline") {
      return "assess_fundamentals";
    }

    if (state.phase === "depth") {
      if (state.stuckCount >= 2) {
        return "simplify_or_hint";
      }

      if (state.lastResponseQuality === "strong") {
        return "probe_deeper";
      }

      return "continue_depth";
    }

    if (state.phase === "close") {
      return "wrap_up";
    }

    return "continue";
  }
}

module.exports = TransitionEngine;