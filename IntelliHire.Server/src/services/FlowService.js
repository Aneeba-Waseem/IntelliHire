import InterviewState from "../cacheModels/InterviewState.js";
import InterviewTurnRepository from "../repositories/InterviewTurnRepository.js";
import InterviewSessionRepository from "../repositories/InterviewSessionRepository.js";
import InterviewEvaluationRepository from "../repositories/InterviewEvaluationRepository.js";
import TransitionEngine from "../engine/TransitionEngine.js";
import AIClient from "../AI/AIClient.js";
import JobClient from "./JobClient.js";
import QuestionQueueService from "./QuestionQueueService.js";

/**
 * FlowService.js  (optimised)
 *
 * KEY CHANGES vs original:
 *
 *  1. QuestionQueue + FallbackQueue  (via QuestionQueueService)
 *     - On startInterview the fallback queue is seeded with 10 pre-generated Qs.
 *     - After every submitted answer a NEW question is generated in the background
 *       and pushed onto the questionQueue so the next dequeue is instant.
 *
 *  2. Conversational LLM layer  (aiClient.analyzeWithConversationalLLM)
 *     - When an answer is finalised the ConvLLM decides:
 *         "further_explanation" → send a follow-up to the candidate (no flow submit yet)
 *         "submit"              → evaluate, transition, dequeue next question
 *     - This replaces the previous direct evaluate-on-every-answer path.
 *
 *  3. sendQuestion helper   — dequeues the next Q and sends it over the wire.
 *     - If questionQueue is empty it falls back to fallbackQueue automatically
 *       (handled transparently by QuestionQueueService.dequeue).
 */
export default class FlowService {
  constructor({
    aiClient    = new AIClient(),
    sessionRepo,
    turnRepo,
    jobClient   = new JobClient(),
    queueService,
  } = {}) {
    this.aiClient         = aiClient;
    this.transitionEngine = new TransitionEngine();
    this.sessionRepo      = sessionRepo  || new InterviewSessionRepository();
    this.turnRepo         = turnRepo     || new InterviewTurnRepository();
    this.evalRepo         = new InterviewEvaluationRepository();
    this.jobClient        = jobClient;
    this.queueService     = queueService || new QuestionQueueService();
  }

  /* =====================================================
     TOPICS FOR JOB
  ===================================================== */
  async getTopicsForJob(token) {
    try {
      const jobData = await this.jobClient.getJobStep1(token);
      if (!jobData || Object.keys(jobData).length === 0) return ["general"];

      const topics = [ ...(jobData.domains || []), ...(jobData.techStack || [])]
        .map((t) => String(t).trim())
        .filter(Boolean);

      return topics.length ? topics : ["general"];
    } catch (err) {
      console.error("getTopicsForJob error:", err.message);
      return ["general"];
    }
  }

  /* =====================================================
     START INTERVIEW
  ===================================================== */
  async startInterview({ candidateId, jobId, candidateType, token }) {
    if (!candidateId || !jobId) throw new Error("candidateId and jobId are required");

    // 1. Build initial state
    const state = new InterviewState({
      phase:               "rapport",
      candidateType:       candidateType || "generic",
      topicsCovered:       [],
      currentTopic:        null,
      depthLevel:          1,
      lastResponseQuality: null,
      stuckCount:          0,
      lastAction:          null,
      currentTurnId:       null,
    });

    // 2. Fetch topics
    const topics       = await this.getTopicsForJob(token);
    state.currentTopic = topics[0];
    console.log("Topics:", topics, "→ initial topic:", state.currentTopic);

    // 3. Create session
    const session = await this.sessionRepo.create({
      candidateId,
      jobId,
      initialState: state,
      topicsListed: topics,
    });
    console.log("Session created:", session.id);
    await this.evalRepo.initSession(session.id);

    // 4. Seed fallback queue (10 pre-generated questions for this job role)
    await this.queueService.initSession(
      session.id,
      topics,
    );
    console.log("Fallback queue seeded:", this.queueService.lengths(session.id));

    // 5. Generate first question and push to questionQueue
    await this._generateAndEnqueue(session.id, state);

    // 6. Dequeue the first question (from questionQueue)
    const firstItem = this.queueService.dequeue(session.id);
    if (!firstItem) throw new Error("Queue empty immediately after seeding — this should not happen");

    // 7. Create the first turn in the repo so we have a currentTurnId
    const firstTurn = await this.turnRepo.create({
      sessionId:   session.id,
      question:    firstItem.question,
      idealAnswer: firstItem.idealAnswer,
      topic:       firstItem.topic  || state.currentTopic,
      phase:       firstItem.phase  || state.phase,
      depthLevel:  state.depthLevel,
    });

    state.currentTurnId = firstTurn.id;
    state.lastAction    = "asked_question";
    await this.sessionRepo.updateState(session.id, state);

    // 8. Convert to conversational format for the candidate
    const conversational = await this.aiClient.convertQuestion(firstItem.question);

    // 9. Fire-and-forget: pre-generate the NEXT question now so it is ready
    this._generateAndEnqueue(session.id, state).catch((err) =>
      console.warn("[prefetch] Failed to pre-generate next question:", err.message)
    );

    return {
      sessionId: session.id,
      greeting:  "Welcome! Let's begin the interview.",
      question:  conversational,
      phase:     state.phase,
    };
  }

  /* =====================================================
     SUBMIT ANSWER
     ─────────────────────────────────────────────────────
     Flow (matches the diagram):
       1. Finalise answer text
       2. Pass through Conversational LLM
            ├─ "further_explanation"  → return follow-up question, NO evalRepo write
            └─ "submit"
                 ├─ Evaluate answer (evalRepo)
                 ├─ Transition state
                 ├─ Check close phase
                 └─ Dequeue next question
  ===================================================== */
  async submitAnswer({ sessionId, candidateAnswer }) {
    if (!sessionId || !candidateAnswer) {
      throw new Error("sessionId and candidateAnswer are required");
    }

    // ── Load session & state ──────────────────────────────────────────────
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const state = new InterviewState(session.state);
    console.log("submitAnswer — state:", {
      phase:         state.phase,
      currentTopic:  state.currentTopic,
      currentTurnId: state.currentTurnId,
    });

    // ── Locate the current turn ──────────────────────────────────────────
    let turn = state.currentTurnId
      ? await this.turnRepo.findById(state.currentTurnId)
      : null;

    if (!turn) {
      console.warn("Falling back to latest turn");
      turn = await this.turnRepo.findLatestBySessionId(sessionId);
    }

    if (!turn) throw new Error("No active turn found for this session");

    /* ──────────────────────────────────────────────────────────────────────
       STEP A  →  Conversational LLM decides: probe or submit
    ────────────────────────────────────────────────────────────────────── */
    const { decision, followUpText } = await this.aiClient.analyzeWithConversationalLLM({
      question: turn.question,
      answer:   candidateAnswer,
    });

    /* ──────────────────────────────────────────────────────────────────────
       PATH A1  →  "further_explanation"
       The LLM wants the candidate to elaborate.  We do NOT evaluate yet.
       We create a follow-up turn so the next submitAnswer knows the context.
    ────────────────────────────────────────────────────────────────────── */
    if (decision === "further_explanation") {
      console.log("[ConvLLM] Requesting further explanation from candidate");

      // Store what the candidate said so far as a partial answer on the turn
      await this.turnRepo.update(turn.id, { partialAnswer: candidateAnswer });

      // Create a new turn for the follow-up exchange
      const followUpTurn = await this.turnRepo.create({
        sessionId:   sessionId,
        question:    followUpText,
        idealAnswer: turn.idealAnswer, // same ideal — still on the same concept
        topic:       turn.topic  || state.currentTopic,
        phase:       turn.phase  || state.phase,
        depthLevel:  state.depthLevel,
        isFollowUp:  true,
      });

      state.currentTurnId = followUpTurn.id;
      state.lastAction    = "follow_up";
      await this.sessionRepo.updateState(sessionId, state);

      return {
        done:     false,
        question: followUpText,
        phase:    state.phase,
        isFollowUp: true,
      };
    }

    /* ──────────────────────────────────────────────────────────────────────
       PATH A2  →  "submit"
       Evaluate, transition, dequeue next.
    ────────────────────────────────────────────────────────────────────── */

    // ── Evaluate ──────────────────────────────────────────────────────────
    const turns      = await this.turnRepo.findBySessionId(sessionId);
    const turnIndex  = Math.max(0, turns.length - 1);

    const evaluation = await this.aiClient.evaluateAnswer({
      interview_id: sessionId,
      question_id:  turn.id,
      domain:       turn.topic || state.currentTopic || "technical",
      question:     turn.question,
      answer:       candidateAnswer,
      ideal_answer: turn.idealAnswer || "",
      turn_index:   turnIndex,
    });

    console.log("Evaluation:", evaluation);

    // ── Persist evaluation ────────────────────────────────────────────────
    await this.evalRepo.appendQuestion(sessionId, {
      questionId:       turn.id,
      question:         turn.question,
      idealAnswer:      turn.idealAnswer,
      candidateAnswer,
      response_quality: evaluation.response_quality,
      question_score:   evaluation.question_score,
      dimensions:       evaluation.delta  || {},
      notes:            evaluation.notes  || [],
      feedback:         evaluation.feedback || "",
      topic:            turn.topic,
      phase:            turn.phase,
      depthLevel:       turn.depthLevel,
      timestamp:        new Date().toISOString(),
    });

    // ── Transition ───────────────────────────────────────────────────────
    state.lastResponseQuality = evaluation.response_quality || "ok";

    const turnsInPhase = turns.filter((t) => t.phase === state.phase).length;

    const { updatedState } = this.transitionEngine.apply({
      state,
      evaluation:         { quality: state.lastResponseQuality },
      totalTurnsInPhase:  turnsInPhase,
      availableTopics:    session.topicsListed || [],
    });

    // Safety: preserve topic if transition cleared it
    if (!updatedState.currentTopic && state.currentTopic) {
      updatedState.currentTopic = state.currentTopic;
    }

    await this.sessionRepo.updateState(sessionId, updatedState);

    // ── Close phase? ──────────────────────────────────────────────────────
    if (updatedState.phase === "close") {
      console.log("Interview moving to close phase");
      const report = await this.generateFinalReport(sessionId);
      await this.sessionRepo.endSession(sessionId);
      this.queueService.destroy(sessionId);

      return {
        done:    true,
        report,
        message: "Thank you for participating in this interview!",
      };
    }

    // ── Dequeue next question ─────────────────────────────────────────────
    const nextItem = this.queueService.dequeue(sessionId);
    let   nextQuestion;

    if (nextItem) {
      // We have a pre-generated question ready — fast path
      console.log(`[Queue] Dequeued next question (source=${nextItem.source})`);

      const nextTurn = await this.turnRepo.create({
        sessionId,
        question:    nextItem.question,
        idealAnswer: nextItem.idealAnswer,
        topic:       nextItem.topic || updatedState.currentTopic,
        phase:       updatedState.phase,
        depthLevel:  updatedState.depthLevel,
      });

      updatedState.currentTurnId = nextTurn.id;
      updatedState.lastAction    = "asked_question";
      await this.sessionRepo.updateState(sessionId, updatedState);

      nextQuestion = await this.aiClient.convertQuestion(nextItem.question);
    } else {
      // Both queues empty — generate on the fly (should be rare)
      console.warn("[Queue] Both queues empty, generating on-the-fly");
      const result = await this.generateNextQuestion({ sessionId, state: updatedState });
      nextQuestion  = result.question;
      await this.sessionRepo.updateState(sessionId, result.updatedState);
      updatedState.currentTurnId = result.updatedState.currentTurnId;
    }

    // ── Pre-fetch: enqueue the question AFTER next so queue stays warm ────
    this._generateAndEnqueue(sessionId, updatedState).catch((err) =>
      console.warn("[prefetch] Failed:", err.message)
    );

    return {
      done:     false,
      question: nextQuestion,
      phase:    updatedState.phase,
    };
  }

  /* =====================================================
     GENERATE NEXT QUESTION  (unchanged API, used as fallback)
  ===================================================== */
  async generateNextQuestion({ sessionId, state }) {
    if (!state) throw new Error("State is required");

    if (!state.currentTopic) {
      console.warn("No currentTopic, defaulting to general");
      state.currentTopic = "general";
    }

    let context = "general";

    if (
      state.lastAction === "probe_deeper" ||
      state.lastAction === "simplify_or_hint"
    ) {
      const prevTurn = state.currentTurnId
        ? await this.turnRepo.findById(state.currentTurnId)
        : null;
      context = prevTurn?.idealAnswer || state.currentTopic || "general";
    } else {
      try {
        context = await this.aiClient.generateContext(state.currentTopic);
      } catch {
        context = state.currentTopic || "general";
      }
    }

    const qna = await this.aiClient.generateQuestion({
      context,
      difficulty: this._getDifficultyString(state.depthLevel),
    });

    if (!qna?.question) throw new Error("AIClient returned invalid Q&A");

    const conversational = await this.aiClient.convertQuestion(qna.question);

    const newTurn = await this.turnRepo.create({
      sessionId,
      question:    qna.question,
      idealAnswer: qna.ideal_answer,
      topic:       state.currentTopic,
      phase:       state.phase,
      depthLevel:  state.depthLevel,
    });

    state.currentTurnId = newTurn.id;
    state.lastAction    = "asked_question";

    return { question: conversational, updatedState: state };
  }

  /* =====================================================
     GENERATE FINAL REPORT
  ===================================================== */
  async generateFinalReport(sessionId) {
    try {
      const turns = await this.turnRepo.findBySessionId(sessionId);

      if (!turns || turns.length === 0) {
        return {
          totalQuestions: 0,
          strongAnswers:  0,
          okAnswers:      0,
          weakAnswers:    0,
          overallRating:  "No Data",
          message:        "No questions were asked",
        };
      }

      const totalQuestions = turns.length;
      const strongAnswers  = turns.filter((t) => t.evaluation?.response_quality === "strong").length;
      const okAnswers      = turns.filter((t) => t.evaluation?.response_quality === "ok").length;
      const weakAnswers    = turns.filter((t) => t.evaluation?.response_quality === "weak").length;
      const score          = strongAnswers * 2 + okAnswers;

      let overallRating = "Average";
      if (score >= totalQuestions * 1.5)     overallRating = "Excellent";
      else if (score >= totalQuestions)       overallRating = "Good";
      else if (weakAnswers > strongAnswers)   overallRating = "Needs Improvement";

      return {
        totalQuestions,
        strongAnswers,
        okAnswers,
        weakAnswers,
        overallRating,
        score,
        message: `Interview completed: ${overallRating}`,
      };
    } catch (err) {
      console.error("generateFinalReport error:", err.message);
      return {
        totalQuestions: 0,
        strongAnswers:  0,
        okAnswers:      0,
        weakAnswers:    0,
        overallRating:  "Error",
        message:        `Error generating report: ${err.message}`,
      };
    }
  }

  /* =====================================================
     GET SESSION PROGRESS
  ===================================================== */
  async getSessionProgress(sessionId) {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const turns         = await this.turnRepo.findBySessionId(sessionId);
    const answeredTurns = turns.filter((t) => t.candidateAnswer).length;

    return {
      sessionId,
      phase:           session.state.phase,
      totalQuestions:  turns.length,
      answeredQuestions: answeredTurns,
      currentTopic:    session.state.currentTopic,
      progress:        turns.length > 0 ? (answeredTurns / turns.length) * 100 : 0,
      queueLengths:    this.queueService.lengths(sessionId),
    };
  }

  /* =====================================================
     PRIVATE HELPERS
  ===================================================== */

  /**
   * Generate one question and push it onto the questionQueue.
   * Fire-and-forget safe: never throws to the caller.
   */
  async _generateAndEnqueue(sessionId, state) {
    try {
      const topic      = state.currentTopic || "general";
      const difficulty = this._getDifficultyString(state.depthLevel);

      const context = await this.aiClient.generateContext(topic).catch(() => topic);

      const qna = await this.aiClient.generateQuestion({ context, difficulty });
      if (!qna?.question) return;

      this.queueService.enqueue(sessionId, {
        question:    qna.question,
        idealAnswer: qna.ideal_answer || "",
        topic,
        phase:       state.phase,
      });

      console.log(
        `[prefetch] Enqueued AI question. ` +
        `Queue lengths: ${JSON.stringify(this.queueService.lengths(sessionId))}`
      );
    } catch (err) {
      console.error("[_generateAndEnqueue] error:", err.message);
    }
  }

  _getDifficultyString(depthLevel) {
    if (depthLevel === 1) return "easy";
    if (depthLevel === 2) return "medium";
    if (depthLevel >= 3)  return "hard";
    return "easy";
  }
}