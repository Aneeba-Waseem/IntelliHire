/**
 * TransitionEngine.js
 *
 * Unchanged logic from original — handles phase transitions,
 * depth adjustments, and topic switching.
 * Included here for completeness so every changed file is in one place.
 */

class TransitionEngine {
  apply({ state, evaluation, totalTurnsInPhase, availableTopics }) {
    if (evaluation?.quality) {
      state.lastResponseQuality = evaluation.quality;
      state.stuckCount = evaluation.quality === "weak" ? state.stuckCount + 1 : 0;
    }

    console.log("TransitionEngine.apply() — before:", {
      phase:               state.phase,
      currentTopic:        state.currentTopic,
      depthLevel:          state.depthLevel,
      stuckCount:          state.stuckCount,
      lastResponseQuality: state.lastResponseQuality,
    });

    this.handlePhaseTransitions(state, totalTurnsInPhase);
    this.handleDepthAdjustments(state);
    this.handleTopicSwitch(state, availableTopics);

    // Safety net
    if (!state.currentTopic) {
      console.warn("Topic is null after transitions — setting to 'general'");
      state.currentTopic = "general";
    }

    console.log("TransitionEngine.apply() — after:", {
      phase:        state.phase,
      currentTopic: state.currentTopic,
      depthLevel:   state.depthLevel,
      stuckCount:   state.stuckCount,
    });

    const nextAction = this.decideNextAction(state);
    return { updatedState: state, nextAction };
  }

  handlePhaseTransitions(state, totalTurnsInPhase) {
    const originalTopic = state.currentTopic;

    if (state.phase === "rapport" && totalTurnsInPhase >= 2) {
      state.phase      = "baseline";
      state.depthLevel = 1;
    } else if (state.phase === "baseline" && state.lastResponseQuality === "ok") {
      state.phase      = "depth";
      state.depthLevel = 2;
    } else if (state.phase === "depth" && state.stuckCount >= 2) {
      state.depthLevel = Math.max(1, state.depthLevel - 1);
    }

    if (!state.currentTopic && originalTopic) {
      state.currentTopic = originalTopic;
    }
  }

  handleDepthAdjustments(state) {
    if (state.phase !== "depth") return;

    if (state.lastResponseQuality === "ok") {
      state.depthLevel += 1;
    } else if (state.lastResponseQuality === "weak") {
      state.depthLevel = Math.max(1, state.depthLevel - 1);
    }
  }

  handleTopicSwitch(state, availableTopics = []) {
    const maxDepth = 4;
    if (state.depthLevel < maxDepth) return;

    state.topicsCovered = state.topicsCovered || [];
    state.topicsCovered.push(state.currentTopic);

    const nextTopic = availableTopics.find((t) => !state.topicsCovered.includes(t));

    if (nextTopic) {
      console.log(`Switching topic: ${state.currentTopic} → ${nextTopic}`);
      state.currentTopic = nextTopic;
      state.depthLevel   = 1;
    } else {
      console.log("No more topics — transitioning to close");
      state.phase = "close";
    }
  }

  decideNextAction(state) {
    switch (state.phase) {
      case "rapport":   return "light_question";
      case "baseline":  return "assess_fundamentals";
      case "depth":
        if (state.stuckCount >= 2)                        return "simplify_or_hint";
        if (state.lastResponseQuality === "ok")       return "probe_deeper";
        return "continue_depth";
      case "close":     return "wrap_up";
      default:          return "continue";
    }
  }
}

export default TransitionEngine;