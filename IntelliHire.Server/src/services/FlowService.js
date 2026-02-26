// services/FlowService.js
import InterviewState from "../cacheModels/InterviewState.js";
import InterviewTurnRepository from "../repositories/InterviewTurnRepository.js";
import InterviewSessionRepository from "../repositories/InterviewSessionRepository.js";
import TransitionEngine from "../engine/TransitionEngine.js";

export default class FlowService {
  constructor({ aiClient, sessionRepo, turnRepo }) {
    this.transitionEngine = new TransitionEngine();
    this.aiClient = aiClient;
    this.sessionRepo = sessionRepo || new InterviewSessionRepository();
    this.turnRepo = turnRepo || new InterviewTurnRepository();
  }

  /** ------------------ AI Operations ------------------ */

  async createContextFromKeywords(keywords) {
    if (!keywords || keywords.length === 0) {
      throw new Error("Keywords are required");
    }
    return await this.aiClient.generateContext(keywords);
  }

  async convertToInterviewStyle(question) {
    if (!question) {
      throw new Error("Question is required");
    }
    return await this.aiClient.convertQuestion(question);
  }

  /** ------------------ Session Operations ------------------ */

  async createSession({ candidateId, jobId, initialState = {} }) {
    const session = await this.sessionRepo.create({
      candidateId,
      jobId,
      initialState,
    });
    return session;
  }

  async findSessionById(sessionId) {
    return await this.sessionRepo.findById(sessionId);
  }

  async updateSessionState(sessionId, newState) {
    const session = await this.sessionRepo.updateState(
      sessionId,
      new InterviewState(newState)
    );
    if (!session) throw new Error("Session not found");
    return session;
  }

  async endSession(sessionId) {
    const session = await this.sessionRepo.endSession(sessionId);
    if (!session) throw new Error("Session not found");
    return session;
  }

  async getAllSessions() {
    return await this.sessionRepo.all();
  }

  /** ------------------ Turn Operations ------------------ */

  async addInterviewTurn(sessionId, { question, answer, evaluation }) {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new Error("Session not found");

    const turn = await this.turnRepo.create({
      sessionId,
      question,
      idealAnswer: answer,
      evaluation,
      createdAt: new Date(),
    });

    return turn;
  }

  async getSessionTurns(sessionId) {
    return await this.turnRepo.findBySessionId(sessionId);
  }

  /* =====================================================
     1️⃣ START INTERVIEW
  ===================================================== */

  async startInterview({ candidateId, jobId, candidateType }) {
    const initialState = new InterviewState({
      phase: "rapport",
      candidateType,
      topicsCovered: [],
      currentTopic: null,
      depthLevel: 1,
      lastResponseQuality: null,
      stuckCount: 0,
    });

    const session = await this.sessionRepo.create({
      candidateId,
      jobId,
      initialState,
    });

    return {
      session,
      greeting: "Welcome! Let's begin the interview.",
    };
  }

  /* =====================================================
     2️⃣ RUN FULL INTERVIEW LOOP
  ===================================================== */

  async runInterview({
    candidateId,
    jobId,
    candidateType,
    keywords,
    availableTopics,
    getCandidateAnswer,   // async (question) => answer
    evaluateAnswer,       // async (question, answer) => evaluation
    generateQuestion,     // async ({ context, topic, difficulty }) => rawQuestion
  }) {
    /* ---------- START ---------- */

    const { session } = await this.startInterview({
      candidateId,
      jobId,
      candidateType,
    });

    const sessionId = session.id;
    let state = new InterviewState(session.state);

    // Set first topic
    state.currentTopic = availableTopics[0];
    await this.sessionRepo.updateState(sessionId, state);

    let safetyCounter = 0;

    /* ---------- LOOP ---------- */

    while (state.phase !== "close" && safetyCounter < 50) {
      safetyCounter++;

      /* 1️⃣ Generate Context */
      const context =
        await this.createContextFromKeywords(keywords);

      /* 2️⃣ Decide Difficulty */
      const difficulty =
        state.depthLevel <= 1
          ? "easy"
          : state.depthLevel === 2
          ? "medium"
          : "hard";

      /* 3️⃣ Generate Technical Question */
      const rawQuestion = await generateQuestion({
        context,
        topic: state.currentTopic,
        difficulty,
        action: this.transitionEngine.decideNextAction(state),
      });

      /* 4️⃣ Convert to Conversational Style */
      const conversationalQuestion =
        await this.convertToInterviewStyle(rawQuestion);

      /* 5️⃣ Get Candidate Response */
      const candidateAnswer =
        await getCandidateAnswer(conversationalQuestion);

      /* 6️⃣ Evaluate Response */
      const evaluation =
        await evaluateAnswer(
          conversationalQuestion,
          candidateAnswer
        );

      /* 7️⃣ Count Turns in Current Phase */
      const turns =
        await this.turnRepo.findBySessionId(sessionId);

      const totalTurnsInPhase = turns.filter(
        (t) => t.phase === state.phase
      ).length;

      /* 8️⃣ Apply Transition Engine */
      const { updatedState } =
        this.transitionEngine.apply({
          state,
          evaluation,
          totalTurnsInPhase,
          availableTopics,
        });

      state = updatedState;

      /* 9️⃣ Save Turn */
      await this.turnRepo.create({
        sessionId,
        question: conversationalQuestion,
        candidateAnswer,
        evaluation,
        topic: state.currentTopic,
        phase: state.phase,
        depthLevel: state.depthLevel,
        createdAt: new Date(),
      });

      /* 🔟 Persist Updated State */
      await this.sessionRepo.updateState(sessionId, state);
    }

    /* ---------- CLOSE ---------- */

    return await this.closeInterview(sessionId);
  }

  /* =====================================================
     3️⃣ CLOSE INTERVIEW
  ===================================================== */

  async closeInterview(sessionId) {
    const session =
      await this.sessionRepo.findById(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    await this.sessionRepo.endSession(sessionId);

    const turns =
      await this.turnRepo.findBySessionId(sessionId);

    const report = this.generateFinalReport(turns);

    return {
      message:
        "Thank you for participating in the interview. We will get back to you soon.",
      report,
    };
  }

  /* =====================================================
     REPORT GENERATION
  ===================================================== */

  generateFinalReport(turns) {
    const totalQuestions = turns.length;

    const strongAnswers = turns.filter(
      (t) => t.evaluation?.quality === "strong"
    ).length;

    const weakAnswers = turns.filter(
      (t) => t.evaluation?.quality === "weak"
    ).length;

    const okAnswers = turns.filter(
      (t) => t.evaluation?.quality === "ok"
    ).length;

    const score =
      strongAnswers * 2 + okAnswers * 1;

    let overallRating = "Average";

    if (score >= totalQuestions * 1.5)
      overallRating = "Excellent";
    else if (score >= totalQuestions)
      overallRating = "Good";
    else if (weakAnswers > strongAnswers)
      overallRating = "Needs Improvement";

    return {
      totalQuestions,
      strongAnswers,
      okAnswers,
      weakAnswers,
      overallRating,
    };
  }

}