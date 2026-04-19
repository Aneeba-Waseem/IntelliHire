import InterviewState from "../cacheModels/InterviewState.js";
import InterviewTurnRepository from "../repositories/InterviewTurnRepository.js";
import InterviewSessionRepository from "../repositories/InterviewSessionRepository.js";
import InterviewEvaluationRepository from "../repositories/InterviewEvaluationRepository.js";
import TransitionEngine from "../engine/TransitionEngine.js";
import AIClient from "../AI/AIClient.js";
import JobClient from "./JobClient.js";
import QuestionQueueService from "./QuestionQueueService.js";

export default class FlowService {
  constructor({
    aiClient = new AIClient(),
    sessionRepo,
    turnRepo,
    jobClient = new JobClient(),
    queueService,
  } = {}) {
    this.aiClient = aiClient;
    this.transitionEngine = new TransitionEngine();
    this.sessionRepo = sessionRepo || new InterviewSessionRepository();
    this.turnRepo = turnRepo || new InterviewTurnRepository();
    this.evalRepo = new InterviewEvaluationRepository();
    this.jobClient = jobClient;
    this.queueService = queueService || new QuestionQueueService();
  }

  followUps = 0; // simple counter to prevent infinite follow-ups
  

  /* =====================================================
     TOPICS
  ===================================================== */
  async getTopicsForJob(token) {
    try {
      const jobData = await this.jobClient.getJobStep1(token);
      if (!jobData || Object.keys(jobData).length === 0) return ["general"];

      const topics = [...(jobData.domains || []), ...(jobData.techStack || [])]
        .map((t) => String(t).trim())
        .filter(Boolean);

      return topics.length ? topics : ["general"];
    } catch (err) {
      console.error("getTopicsForJob error:", err.message);
      return ["general"];
    }
  }

  /* =====================================================
     START INTERVIEW (FIXED)
  ===================================================== */
//   async startInterview({ candidateId, jobId, candidateType, token }) {
//   if (!candidateId || !jobId)
//     throw new Error("candidateId and jobId are required");

//   const state = new InterviewState({
//     phase: "rapport",
//     candidateType: candidateType || "generic",
//     topicsCovered: [],
//     currentTopic: null,
//     depthLevel: 1,
//     lastResponseQuality: null,
//     stuckCount: 0,
//     lastAction: "awaiting_first_answer",
//     currentTurnId: null,
//   });

//   const topics = await this.getTopicsForJob(token);
//   state.currentTopic = topics[0];

//   const session = await this.sessionRepo.create({
//     candidateId,
//     jobId,
//     initialState: state,
//     topicsListed: topics,
//   });

//   await this.evalRepo.initSession(session.id);
//   await this.queueService.initSession(session.id, topics);

//   // 🔥 CREATE SYSTEM TURN (IMPORTANT FIX)
//   const systemTurn = await this.turnRepo.create({
//     sessionId: session.id,
//     question: "SYSTEM_GREETING",
//     idealAnswer: null,
//     topic: state.currentTopic,
//     phase: state.phase,
//     depthLevel: 0,
//     isSystem: true,
//   });

//   state.currentTurnId = systemTurn.id;
//   state.lastAction = "awaiting_first_answer";

//   await this.sessionRepo.updateState(session.id, state);

//   // pre-generate first real question
//   this._generateAndEnqueue(session.id, { ...state }).catch(() => {});

//   return {
//     sessionId: session.id,
//     greeting: "Hi, Welcome! Kindly introduce yourself.",
//     question: null,
//     phase: state.phase,
//   };
// }

  /* =====================================================
     SUBMIT ANSWER (FIXED FLOW)
  ===================================================== */
//   async submitAnswer({ sessionId, candidateAnswer }) {
//   try {
//     /* =====================================================
//        VALIDATION
//     ===================================================== */
//     if (!sessionId || typeof sessionId !== "string") {
//       throw new Error("Invalid sessionId");
//     }

//     if (!candidateAnswer || typeof candidateAnswer !== "string") {
//       throw new Error("Invalid candidateAnswer");
//     }

//     const trimmedAnswer = candidateAnswer.trim();
//     if (!trimmedAnswer) {
//       throw new Error("Answer cannot be empty");
//     }

//     /* =====================================================
//        LOAD SESSION + STATE
//     ===================================================== */
//     const session = await this.sessionRepo.findById(sessionId);
//     if (!session) throw new Error("Session not found");

//     const state = new InterviewState(session.state);

//     /* =====================================================
//        LOAD CURRENT TURN
//     ===================================================== */
//     let turn = state.currentTurnId
//       ? await this.turnRepo.findById(state.currentTurnId)
//       : null;

//     if (!turn) {
//       turn = await this.turnRepo.findLatestBySessionId(sessionId);
//     }

//     if (!turn) {
//       throw new Error("No active turn found");
//     }
//     console.log(turn);

//     /* =====================================================
//        CASE 0: SYSTEM TURN → FIRST REAL QUESTION INIT
//        (THIS FIXES YOUR GREETING BUG)
//     ===================================================== */
//     if (turn.isSystem) {
//       console.log(` System turn detected → initializing first question`);

//       let item = this.queueService.dequeue(sessionId);

//       if (!item) {
//         await this._generateAndEnqueue(sessionId, { ...state });
//         item = this.queueService.dequeue(sessionId);
//       }

//       if (!item) {
//         throw new Error("Failed to generate first question");
//       }

//       const firstTurn = await this.turnRepo.create({
//         sessionId,
//         question: item.question,
//         idealAnswer: item.idealAnswer,
//         topic: item.topic || state.currentTopic,
//         phase: state.phase,
//         depthLevel: state.depthLevel,
//       });

//       console.log(` First question initialized: ${item.question}`);

//       state.currentTurnId = firstTurn.id;
//       state.lastAction = "asked_question";

//       await this.sessionRepo.updateState(sessionId, state);

//       this._generateAndEnqueue(sessionId, { ...state }).catch((err) =>
//         console.warn("[prefetch] first question failed:", err.message)
//       );

//       return {
//         done: false,
//         question: item.question,
//         phase: state.phase,
//       };
//     }

//     /* =====================================================
//        CASE 1: FOLLOW-UP LOGIC
//     ===================================================== */
//     const { decision, followUpText } =
//       await this.aiClient.analyzeWithConversationalLLM({
//         question: turn.question,
//         answer: trimmedAnswer,
//       });

//      /* =====================================================
//        CASE 1: CLARIFICATION REQUEST (NO EVALUATION)
//     ===================================================== */
//     if (decision === "clarification_request") {
//       const followUpTurn = await this.turnRepo.create({
//         sessionId,
//         question: followUpText,
//         idealAnswer: turn.idealAnswer,
//         topic: turn.topic || state.currentTopic,
//         phase: state.phase,
//         depthLevel: state.depthLevel,
//         isFollowUp: true,
//       });

//       state.currentTurnId = followUpTurn.id;
//       state.lastAction = "clarification_request";

//       await this.sessionRepo.updateState(sessionId, state);

//       return {
//         done: false,
//         question: followUpText,
//         isFollowUp: true,
//         phase: state.phase,
//         skipEvaluation: true,
//       };
//     }

//     /* =====================================================
//        CASE 2: FOLLOW-UP LOGIC (PARTIAL ANSWERS)
//     ===================================================== */
//     if (decision === "further_explanation" && this.followUps % 3 === 0) {
//       this.followUps += 1;

//       const followUpTurn = await this.turnRepo.create({
//         sessionId,
//         question: followUpText,
//         idealAnswer: turn.idealAnswer,
//         topic: turn.topic || state.currentTopic,
//         phase: state.phase,
//         depthLevel: state.depthLevel,
//         isFollowUp: true,
//       });

//       state.currentTurnId = followUpTurn.id;
//       state.lastAction = "follow_up";

//       await this.sessionRepo.updateState(sessionId, state);

//       return {
//         done: false,
//         question: followUpText,
//         isFollowUp: true,
//         phase: state.phase,
//         skipEvaluation: true,
//       };
//     }

//     /* =====================================================
//        CASE 2: EVALUATION
//     ===================================================== */
    
//     const turns = await this.turnRepo.findBySessionId(sessionId);

//     const evaluation = await this.aiClient.evaluateAnswer({
//       interview_id: sessionId,
//       question_id: turn.id,
//       domain: turn.topic || state.currentTopic,
//       question: turn.question,
//       answer: trimmedAnswer,
//       ideal_answer: turn.idealAnswer,
//       turn_index: Math.max(0, turns.length - 1),
//     });

//     await this.evalRepo.appendQuestion(sessionId, {
//       questionId: turn.id,
//       question: turn.question,
//       idealAnswer: turn.idealAnswer,
//       candidateAnswer: trimmedAnswer,
//       response_quality: evaluation.response_quality,
//       question_score: evaluation.question_score,
//       dimensions: evaluation.delta || {},
//       notes: evaluation.notes || [],
//       feedback: evaluation.feedback || "",
//       topic: turn.topic,
//       phase: turn.phase,
//       depthLevel: turn.depthLevel,
//       timestamp: new Date().toISOString(),
//     });

//     state.lastResponseQuality = evaluation.response_quality;

//     const { updatedState } = this.transitionEngine.apply({
//       state,
//       evaluation: { quality: state.lastResponseQuality },
//       totalTurnsInPhase: turns.length,
//       availableTopics: session.topicsListed || [],
//       totalTurnsOverall: session.turnsCount || 0,  
//     });

//     await this.sessionRepo.updateState(sessionId, updatedState);
  
//     /* =====================================================
//        CASE 3: INTERVIEW COMPLETE
//     ===================================================== */
//     if (updatedState.phase === "close") {
//       const report = await this.generateFinalReport(sessionId);

//       await this.sessionRepo.endSession(sessionId);
//       this.queueService.destroy(sessionId);

//       return {
//         done: true,
//         report,
//       };
//     }

//     /* =====================================================
//        CASE 4: NEXT QUESTION
//     ===================================================== */
//     let nextItem = this.queueService.dequeue(sessionId);

//     let nextQuestion;

//     if (nextItem) {
//       const nextTurn = await this.turnRepo.create({
//         sessionId,
//         question: nextItem.question,
//         idealAnswer: nextItem.idealAnswer,
//         topic: nextItem.topic || updatedState.currentTopic,
//         phase: updatedState.phase,
//         depthLevel: updatedState.depthLevel,
//       });

//       await this.sessionRepo.incrementTurns(sessionId);

//       updatedState.currentTurnId = nextTurn.id;
//       updatedState.lastAction = "asked_question";

//       await this.sessionRepo.updateState(sessionId, updatedState);

//       nextQuestion = nextItem.question;
//     } else {
//       const result = await this.generateNextQuestion({
//         sessionId,
//         state: updatedState,
//       });

//       nextQuestion = result.question;

//       await this.sessionRepo.updateState(sessionId, result.updatedState);
//     }

//     /* =====================================================
//        PREFETCH NEXT
//     ===================================================== */
//     this._generateAndEnqueue(sessionId, { ...updatedState }).catch((err) =>
//       console.warn("[prefetch] failed:", err.message)
//     );

//     /* =====================================================
//        RESPONSE
//     ===================================================== */
//     return {
//       done: false,
//       question: nextQuestion,
//       phase: updatedState.phase,
//     };

//   } catch (err) {
//     console.error(`[submitAnswer] error:`, err.message);

//     if (err.message.includes("not found")) {
//       throw new Error("Interview session not found");
//     }

//     if (err.message.includes("No active turn")) {
//       throw new Error("No active question available");
//     }

//     throw err;
//   }
// }

async startInterview({ candidateId, jobId, candidateType, token }) {
  if (!candidateId || !jobId)
    throw new Error("candidateId and jobId are required");

  const state = new InterviewState({
    phase: "rapport",
    candidateType: candidateType || "generic",
    topicsCovered: [],
    currentTopic: null,
    depthLevel: 1,
    lastResponseQuality: null,
    stuckCount: 0,
    lastAction: "awaiting_first_answer",
    currentTurnId: null,
  });

  /* =========================================
     1. LOAD TOPICS
  ========================================= */
  const topics = await this.getTopicsForJob(token);
  state.currentTopic = topics[0];

  /* =========================================
     2. CREATE SESSION
  ========================================= */
  const session = await this.sessionRepo.create({
    candidateId,
    jobId,
    initialState: state,
    topicsListed: topics,
  });

  await this.evalRepo.initSession(session.id);
  await this.queueService.initSession(session.id, topics);

  /* =========================================
     3. CREATE SYSTEM TURN
  ========================================= */
  const systemTurn = await this.turnRepo.create({
    sessionId: session.id,
    question: "SYSTEM_GREETING",
    idealAnswer: null,
    topic: state.currentTopic,
    phase: state.phase,
    depthLevel: 0,
    isSystem: true,
  });

  state.currentTurnId = systemTurn.id;
  state.lastAction = "awaiting_first_answer";

  await this.sessionRepo.updateState(session.id, state);

  /* =========================================
     4. 🔥 PREFETCH FIRST QUESTION (NON-BLOCKING)
  ========================================= */
  setImmediate(() => {
    this._generateAndEnqueue(session.id, { ...state })
      .then(() => {
        console.log("✅ First question prefetched");
      })
      .catch((err) => {
        console.error("❌ Prefetch failed:", err.message);
      });
  });

  /* =========================================
     5. RETURN GREETING (INSTANT → TTS)
  ========================================= */
  return {
    sessionId: session.id,
    greeting: "Hi, welcome! Kindly introduce yourself.",
    question: null,
    phase: state.phase,
  };
}

async submitAnswer({ sessionId, candidateAnswer }) {
  const session = await this.sessionRepo.findById(sessionId);
  const state = new InterviewState(session.state);

  const turn = await this.turnRepo.findById(state.currentTurnId);

  /* ===============================
     1. GET NEXT QUESTION FAST
  =============================== */
  let nextItem = this.queueService.dequeue(sessionId);

  if (!nextItem) {
    this._generateAndEnqueue(sessionId, state); // async
    nextItem = { question: "Give me a second..." };
  }

  /* ===============================
     2. STORE NEXT TURN
  =============================== */
  const nextTurn = await this.turnRepo.create({
    sessionId,
    question: nextItem.question,
    idealAnswer: nextItem.idealAnswer,
    topic: nextItem.topic,
    phase: state.phase,
    depthLevel: state.depthLevel,
  });

  state.currentTurnId = nextTurn.id;
  await this.sessionRepo.updateState(sessionId, state);

  /* ===============================
     3. FIRE BACKGROUND PROCESS
  =============================== */
  this._processAnswerInBackground({
    sessionId,
    turn,
    answer: candidateAnswer,
    state,
    session,
  });

  /* ===============================
     4. RETURN IMMEDIATELY
  =============================== */
  return {
    done: false,
    question: nextItem.question,
    phase: state.phase,
  };
}

// Background processing of answer (for next QA and evaluation)

async _processAnswerInBackground({
  sessionId,
  turn,
  answer,
  state,
  session,
}) {
  try {
    if (turn.isSystem) {
  console.log("⏭ Skipping evaluation for system turn");

  // Still prefetch next question
  this._generateAndEnqueue(sessionId, state);
  return;
}
    /* =========================================
       1. CONVERSATIONAL ANALYSIS
    ========================================= */
    const { decision, followUpText } =
      await this.aiClient.analyzeWithConversationalLLM({
        question: turn.question,
        answer,
      });

    /* =========================================
       2. HANDLE FOLLOW-UP
    ========================================= */
    /* =====================================================
       CASE 1: CLARIFICATION REQUEST (NO EVALUATION)
    ===================================================== */
    if (decision === "clarification_request") {
      const followUpTurn = await this.turnRepo.create({
        sessionId,
        question: followUpText,
        idealAnswer: turn.idealAnswer,
        topic: turn.topic || state.currentTopic,
        phase: state.phase,
        depthLevel: state.depthLevel,
        isFollowUp: true,
      });

      state.currentTurnId = followUpTurn.id;
      state.lastAction = "clarification_request";
      turn.isSystem = true; // Mark original turn as system to skip evaluation

      await this.sessionRepo.updateState(sessionId, state);

      return {
        done: false,
        question: followUpText,
        isFollowUp: true,
        phase: state.phase,
        skipEvaluation: true,
      };
    }

    /* =====================================================
       CASE 2: FOLLOW-UP LOGIC (PARTIAL ANSWERS)
    ===================================================== */
    if (decision === "further_explanation" && this.followUps % 3 === 0) {
      this.followUps += 1;

      const followUpTurn = await this.turnRepo.create({
        sessionId,
        question: followUpText,
        idealAnswer: turn.idealAnswer,
        topic: turn.topic || state.currentTopic,
        phase: state.phase,
        depthLevel: state.depthLevel,
        isFollowUp: true,
      });

      state.currentTurnId = followUpTurn.id;
      state.lastAction = "follow_up";

      await this.sessionRepo.updateState(sessionId, state);

      return {
        done: false,
        question: followUpText,
        isFollowUp: true,
        phase: state.phase,
        skipEvaluation: true,
      };
    }
        if (turn.isSystem) {
  console.log("⏭ Skipping evaluation for system turn");

  // Still prefetch next question
  this._generateAndEnqueue(sessionId, state);
  return;
}

    /* =========================================
       3. EVALUATION
    ========================================= */
    const turns = await this.turnRepo.findBySessionId(sessionId);

    const evaluation = await this.aiClient.evaluateAnswer({
      interview_id: sessionId,
      question_id: turn.id,
      domain: turn.topic,
      question: turn.question,
      answer,
      ideal_answer: turn.idealAnswer,
      turn_index: turns.length - 1,
    });

    await this.evalRepo.appendQuestion(sessionId, {
      questionId: turn.id,
      domain: turn.topic,
      question_text: turn.question,
      candidate_answer: answer,
      ideal_answer: turn.idealAnswer,
      topic: turn.topic,
      phase: turn.phase,
      depthLevel: turn.depthLevel,
      timestamp: new Date().toISOString(),
      evaluation_output: evaluation
    });

    state.lastResponseQuality = evaluation.response_quality;

    /* =========================================
       4. TRANSITION
    ========================================= */
    const { updatedState } = this.transitionEngine.apply({
      state,
      evaluation: { quality: state.lastResponseQuality },
      totalTurnsInPhase: turns.length,
      availableTopics: session.topicsListed || [],
      totalTurnsOverall: session.turnsCount || 0,
    });

    await this.sessionRepo.updateState(sessionId, updatedState);

    /* =========================================
       5. PREFETCH NEXT QUESTION
    ========================================= */
    this._generateAndEnqueue(sessionId, { ...updatedState });

  } catch (err) {
    console.error("[BG PROCESS ERROR]", err);
  }
}
  /* =====================================================
     GENERATE QUESTION FALLBACK
  ===================================================== */
  async generateNextQuestion({ sessionId, state }) {
  if (!state.currentTopic) {
    state.currentTopic = "general";
  }

  let context = "general";

  try {
    context = await this.aiClient.generateContext(state.currentTopic);
  } catch {
    context = state.currentTopic;
  }

  const qna = await this.aiClient.generateQuestion({
    context,
    difficulty: this._getDifficultyString(state.depthLevel),
  });

  if (!qna?.question) throw new Error("Invalid QNA");

  // ✅ CONVERT HERE
  const conversational = await this.aiClient.convertQuestion(qna.question);

  const newTurn = await this.turnRepo.create({
    sessionId,
    question: conversational, // store conversational
    idealAnswer: qna.ideal_answer,
    topic: state.currentTopic,
    phase: state.phase,
    depthLevel: state.depthLevel,
  });

  state.currentTurnId = newTurn.id;
  state.lastAction = "asked_question";

  return { question: conversational, updatedState: state };
}

    /* =====================================================
     GENERATE and enqueue
  ===================================================== */
async _generateAndEnqueue(sessionId, state) {
  try {
    const topic = state.currentTopic || "general";

    const context = await this.aiClient
      .generateContext(topic)
      .catch(() => topic);

    const qna = await this.aiClient.generateQuestion({
      context,
      difficulty: this._getDifficultyString(state.depthLevel),
    });

    if (!qna?.question) return;

    // ✅ CONVERT HERE (ONLY PLACE IN SYSTEM)
    const conversational = await this.aiClient.convertQuestion(qna.question);

    console.log(`[Prefetch] Generated question for session ${sessionId}: ${qna.question} \n Ideal answer: ${qna.ideal_answer}`); 
      

    this.queueService.enqueue(sessionId, {
      question: conversational,   // 🔥 store conversational only
      idealAnswer: qna.ideal_answer || "",
      topic,
      phase: state.phase,
    });

  } catch (err) {
    console.error("[_generateAndEnqueue]", err.message);
  }
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




  _getDifficultyString(depthLevel) {
    if (depthLevel === 1) return "easy";
    if (depthLevel === 2) return "medium";
    return "hard";
  }
}