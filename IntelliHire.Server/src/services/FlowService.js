import InterviewState from "../cacheModels/InterviewState.js";
import InterviewTurnRepository from "../repositories/InterviewTurnRepository.js";
import InterviewSessionRepository from "../repositories/InterviewSessionRepository.js";
import InterviewEvaluationRepository from "../repositories/InterviewEvaluationRepository.js";
import TransitionEngine from "../engine/TransitionEngine.js";
import AIClient from "../AI/AIClient.js";
import { redisClient } from "../config/redisClient.js";

export default class FlowService {
  constructor({ aiClient = new AIClient(), sessionRepo, turnRepo }) {
    this.aiClient = aiClient;
    this.transitionEngine = new TransitionEngine();
    this.sessionRepo = sessionRepo || new InterviewSessionRepository();
    this.turnRepo = turnRepo || new InterviewTurnRepository();
    this.evalRepo = new InterviewEvaluationRepository();

  }

  async getTopicsForJob() {
  try {
    const candidateId = 1; // In real scenario, get this from auth context or session
    const data = await redisClient.get(`job:${candidateId}:step1`);

    if (!data) {
      console.warn("No job step1 found for user:", candidateId);
      return ["general"];
    }

    const jobData = JSON.parse(data);

    const techStack = jobData.techStack || [];
    const domains = jobData.domains || [];

    const topics = [...techStack, ...domains]
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
  async startInterview({ candidateId, jobId, candidateType }) {
    try {
      // ✅ Validate inputs
      if (!candidateId || !jobId) {
        throw new Error("candidateId and jobId are required");
      }

      const state = new InterviewState({
        phase: "rapport",
        candidateType: candidateType || "generic",
        topicsCovered: [],
        currentTopic: "Binary Search Tree in DSA", // or randomize
        depthLevel: 1,
        lastResponseQuality: null,
        stuckCount: 0,
        lastAction: null,
        currentTurnId: null,
      });

      // ✅ Create session in Redis
      const session = await this.sessionRepo.create({
        candidateId,
        jobId,
        initialState: state,
        topicsListed: await this.getTopicsForJob(),
      });
      console.log("all tpoics in session repo " + JSON.stringify(session.topicsListed));

      console.log("Session created:", session.id);
      await this.evalRepo.initSession(session.id);
      // ✅ Generate first question and create first turn
      let conversationalQuestion;
      try {
        conversationalQuestion = await this.generateNextQuestion({
          sessionId: session.id,
          state,
        });
      } catch (err) {
        console.error("Error generating first question:", err.message);
        // Fallback question
        conversationalQuestion =
          "Tell me about your experience with database design.";
      }

      // ✅ Persist updated state (now includes currentTurnId from generateNextQuestion)
      await this.sessionRepo.updateState(session.id, state);

      return {
        sessionId: session.id,
        greeting: "Welcome! Let's begin the interview.",
        question: conversationalQuestion,
        phase: state.phase,
      };
    } catch (err) {
      console.error("startInterview error:", err.message);
      throw err;
    }
  }

  /* =====================================================
     SUBMIT ANSWER
  ===================================================== */
  async submitAnswer({ sessionId, candidateAnswer }) {
    try {
      // ✅ Validate inputs
      if (!sessionId || !candidateAnswer) {
        throw new Error("sessionId and candidateAnswer are required");
      }

      // ✅ Fetch session
      const session = await this.sessionRepo.findById(sessionId);
      if (!session) throw new Error("Session not found");

      const state = new InterviewState(session.state);

      // ✅ Get current turn (with fallback)
      let turn = null;

      if (state.currentTurnId) {
        turn = await this.turnRepo.findById(state.currentTurnId);
      }

      // Fallback: get latest turn
      if (!turn) {
        console.warn(
          "state.currentTurnId not found, falling back to latest turn"
        );
        turn = await this.turnRepo.findLatestBySessionId(sessionId);
      }

      if (!turn) {
        throw new Error("No active turn found for this session");
      }

      console.log("Processing answer for turn:", turn.id);

      // ✅ Get all turns to calculate turn index
      const turns = await this.turnRepo.findBySessionId(sessionId);
      const turnIndex = Math.max(0, turns.length - 1);

      // ✅ Evaluate answer using AIClient
      const evaluation = await this.aiClient.evaluateAnswer({
        interview_id: sessionId,
        question_id: turn.id,
        domain: turn.topic || state.currentTopic || "technical",
        question: turn.question,
        answer: candidateAnswer,
        ideal_answer: turn.idealAnswer || "",
        turn_index: turnIndex,
      });
      console.log("In flow Service current state " + JSON.stringify(state));
      console.log("Done with Evaluation received:", evaluation);

      // ✅ Update turn with answer + evaluation
      await this.evalRepo.appendQuestion(sessionId, {
        questionId: turn.id,
        question: turn.question,
        idealAnswer: turn.idealAnswer,
        candidateAnswer,
        response_quality: evaluation.response_quality,
        question_score: evaluation.question_score,
        dimensions: evaluation.delta || {},   // if available
        notes: evaluation.notes || [],
        feedback: evaluation.feedback || "",
        topic: turn.topic,
        phase: turn.phase,
        depthLevel: turn.depthLevel,
        timestamp: new Date().toISOString(),
      });

      console.log("Turn updated with evaluation:", evaluation.response_quality);

      // ✅ Update state with quality feedback
      state.lastResponseQuality = evaluation.response_quality || "ok";
      // state.lastAction = "received_answer";

      // ✅ Calculate turns in current phase
      const totalTurnsInPhase = turns.filter((t) => t.phase === state.phase)
        .length;

      // ✅ Apply transition logic
      const { updatedState } = this.transitionEngine.apply({
        state,
        evaluation: { quality: state.lastResponseQuality },
        totalTurnsInPhase,
        availableTopics: [],
      });

      console.log("State transitioned to phase:", updatedState.phase);

      // ✅ Persist updated state
      await this.sessionRepo.updateState(sessionId, updatedState);

      // ✅ Check if interview should close
      if (updatedState.phase === "close") {
        console.log("Interview transitioning to close phase");
        const report = await this.generateFinalReport(sessionId);
        await this.sessionRepo.endSession(sessionId);

        return {
          done: true,
          report,
          message: "Thank you for participating in this interview!",
        };
      }

      // ✅ Generate next question
      let nextQuestion;
      try {
        nextQuestion = await this.generateNextQuestion({
          sessionId,
          state: updatedState,
        });
      } catch (err) {
        console.error("Error generating next question:", err.message);
        // Fallback question
        nextQuestion = `Let's continue. Tell me more about ${updatedState.currentTopic}`;
      }

      // ✅ Persist final state
      await this.sessionRepo.updateState(sessionId, updatedState);

      return {
        done: false,
        question: nextQuestion,
        phase: updatedState.phase,
      };
    } catch (err) {
      console.error("submitAnswer error:", err.message);
      throw err;
    }
  }

  /* =====================================================
     GENERATE NEXT QUESTION
  ===================================================== */
  async generateNextQuestion({ sessionId, state }) {
    try {
      // ✅ Validate inputs
      if (!state) throw new Error("State is required");

      console.log("Generating next question for topic:", state.currentTopic);

      // ✅ Decide context based on last action
      let context = "general";

      if (
        state.lastAction === "probe_deeper" ||
        state.lastAction === "simplify_or_hint"
      ) {
        // Reuse previous ideal answer for context
        const prevTurn = state.currentTurnId
          ? await this.turnRepo.findById(state.currentTurnId)
          : null;

        context = prevTurn?.idealAnswer || state.currentTopic || "general";
      } else {
        // Generate fresh context from AI
        try {
          context = await this.aiClient.generateContext(state.currentTopic);
        } catch (err) {
          console.warn("Error generating context, using topic:", err.message);
          context = state.currentTopic || "general";
        }
      }

      // ✅ Generate Q&A
      const qna = await this.aiClient.generateQuestion({
        context,
        difficulty: this._getDifficultyString(state.depthLevel),
      });

      if (!qna || !qna.question) {
        throw new Error("AIClient returned invalid Q&A");
      }
      console.log(context);
      console.log(qna);
      console.log("Q&A generated:", qna.question.substring(0, 50));

      // ✅ Convert to conversational
      const conversational = await this.aiClient.convertQuestion(qna.question);

      // ✅ Create new turn in Redis
      const newTurn = await this.turnRepo.create({
        sessionId,
        question: qna.question,
        idealAnswer: qna.ideal_answer,
        candidateAnswer: null,
        evaluation: null,
        topic: state.currentTopic,
        phase: state.phase,
        depthLevel: state.depthLevel,
      });

      console.log("New turn created:", newTurn.id);

      // ✅ Update state to point to new turn
      state.currentTurnId = newTurn.id;
      state.lastAction = "asked_question";

      return conversational;
    } catch (err) {
      console.error("generateNextQuestion error:", err.message);
      // Return a safe fallback question
      return `Tell me about ${state?.currentTopic || "your experience"}`;
    }
  }

  async getDetailedReport(req, res) {
    const { sessionId } = req.params;
    const data = await this.flowService.evalRepo.getBySessionId(sessionId);

    return res.json({
      success: true,
      data,
    });
  }
  /* =====================================================
     GENERATE FINAL REPORT
  ===================================================== */
  async generateFinalReport(sessionId) {
    try {
      // ✅ Fetch all turns for this session
      const turns = await this.turnRepo.findBySessionId(sessionId);

      if (!turns || turns.length === 0) {
        return {
          totalQuestions: 0,
          strongAnswers: 0,
          okAnswers: 0,
          weakAnswers: 0,
          overallRating: "No Data",
          message: "No questions were asked",
        };
      }

      const totalQuestions = turns.length;

      // ✅ Count responses by quality (use response_quality from evaluator)
      const strongAnswers = turns.filter(
        (t) => t.evaluation?.response_quality === "strong"
      ).length;
      const okAnswers = turns.filter(
        (t) => t.evaluation?.response_quality === "ok"
      ).length;
      const weakAnswers = turns.filter(
        (t) => t.evaluation?.response_quality === "weak"
      ).length;

      // ✅ Calculate score
      const score = strongAnswers * 2 + okAnswers;

      // ✅ Determine rating
      let overallRating = "Average";
      if (score >= totalQuestions * 1.5) {
        overallRating = "Excellent";
      } else if (score >= totalQuestions) {
        overallRating = "Good";
      } else if (weakAnswers > strongAnswers) {
        overallRating = "Needs Improvement";
      }

      console.log("Final report:", {
        totalQuestions,
        overallRating,
        strongAnswers,
        okAnswers,
        weakAnswers,
      });

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
        strongAnswers: 0,
        okAnswers: 0,
        weakAnswers: 0,
        overallRating: "Error",
        message: `Error generating report: ${err.message}`,
      };
    }
  }

  /* =====================================================
     HELPER: Convert depth level to difficulty string
  ===================================================== */
  _getDifficultyString(depthLevel) {
    if (depthLevel === 1) return "easy";
    if (depthLevel === 2) return "medium";
    if (depthLevel >= 3) return "hard";
    return "easy";
  }

  /* =====================================================
     BONUS: Get session progress
  ===================================================== */
  async getSessionProgress(sessionId) {
    try {
      const session = await this.sessionRepo.findById(sessionId);
      if (!session) throw new Error("Session not found");

      const turns = await this.turnRepo.findBySessionId(sessionId);

      const answeredTurns = turns.filter((t) => t.candidateAnswer).length;
      const totalTurns = turns.length;

      return {
        sessionId,
        phase: session.state.phase,
        totalQuestions: totalTurns,
        answeredQuestions: answeredTurns,
        currentTopic: session.state.currentTopic,
        progress: totalTurns > 0 ? (answeredTurns / totalTurns) * 100 : 0,
      };
    } catch (err) {
      console.error("getSessionProgress error:", err.message);
      throw err;
    }
  }
}