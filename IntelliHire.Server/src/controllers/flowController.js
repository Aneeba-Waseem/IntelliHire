// controllers/FlowController.js

import TransitionEngine from "../engine/TransitionEngine.js";
import InterviewState from "../cacheModels/InterviewState.js";

export default class FlowController {
  constructor({ flowService, aiClient }) {
    this.flowService = flowService;
    this.aiClient = aiClient;
    this.engine = new TransitionEngine();
  }

  /** ---------------------------------------------------
   * START INTERVIEW
   * --------------------------------------------------- */
  async startInterview({ candidateId, jobId, topics, candidateType }) {
    const initialState = new InterviewState({
      phase: "rapport",
      candidateType,
      topicsCovered: [],
      currentTopic: topics[0],
      depthLevel: 1,
      lastResponseQuality: null,
      stuckCount: 0,
    });

    const session = await this.flowService.createSession({
      candidateId,
      jobId,
      initialState,
    });

    const firstQuestion = await this.aiClient.generateQuestion({
      phase: "rapport",
      topic: topics[0],
      depthLevel: 1,
      action: "light_question",
      candidateType,
    });

    return {
      sessionId: session.id,
      question: firstQuestion,
    };
  }

  /** ---------------------------------------------------
   * HANDLE ANSWER (Main Interview Loop)
   * --------------------------------------------------- */
  async handleAnswer({ sessionId, answer, availableTopics }) {
    // 1️⃣ Load session
    const session = await this.flowService.findSessionById(sessionId);
    if (!session) throw new Error("Session not found");

    let state = new InterviewState(session.state);

    // 2️⃣ Evaluate answer using AI
    const evaluation = await this.aiClient.evaluateAnswer({
      question: state.previousQuestion,
      answer,
      topic: state.currentTopic,
      depthLevel: state.depthLevel,
    });

    // 3️⃣ Count turns in this phase
    const turns = await this.flowService.getSessionTurns(sessionId);
    const totalTurnsInPhase = turns.filter(
      (t) => t.phase === state.phase
    ).length;

    // 4️⃣ Apply transition engine
    const { updatedState, nextAction } = this.engine.apply({
      state,
      evaluation,
      totalTurnsInPhase,
      availableTopics,
    });

    // 5️⃣ Persist updated state
    await this.flowService.updateSessionState(
      sessionId,
      updatedState
    );

    // 6️⃣ If phase = close → end interview
    if (updatedState.phase === "close") {
      await this.flowService.endSession(sessionId);

      return {
        finished: true,
        message: "Interview completed successfully.",
      };
    }

    // 7️⃣ Generate next question
    const nextQuestion = await this.aiClient.generateQuestion({
      phase: updatedState.phase,
      topic: updatedState.currentTopic,
      depthLevel: updatedState.depthLevel,
      action: nextAction,
      candidateType: updatedState.candidateType,
    });

    // 8️⃣ Save turn
    await this.flowService.addInterviewTurn(sessionId, {
      question: state.previousQuestion,
      answer,
      evaluation,
    });

    // 9️⃣ Update previous question in state
    updatedState.previousQuestion = nextQuestion;
    await this.flowService.updateSessionState(
      sessionId,
      updatedState
    );

    return {
      finished: false,
      question: nextQuestion,
      evaluationSummary: evaluation.summary,
      phase: updatedState.phase,
      topic: updatedState.currentTopic,
      depthLevel: updatedState.depthLevel,
    };
  }
}