/**
 * FlowController.js
 *
 * Unchanged interface — all routes remain identical.
 * Minor update: getProgress now returns queueLengths from FlowService.
 */
export default class FlowController {
  constructor({ flowService }) {
    if (!flowService) throw new Error("FlowService is required");
    this.flowService = flowService;

    this.startInterview  = this.startInterview.bind(this);
    this.submitAnswer    = this.submitAnswer.bind(this);
    this.getReport       = this.getReport.bind(this);
    this.getProgress     = this.getProgress.bind(this);
    this.endInterview    = this.endInterview.bind(this);
    this.getTopicsForJob = this.getTopicsForJob.bind(this);
  }

  /* =====================================================
     START INTERVIEW
     POST /api/flow/start
     Body: { candidateId, jobId, candidateType? }
  ===================================================== */
  async startInterview(req, res) {
    const requestId = this._generateRequestId();

    try {
      console.log(`[${requestId}] Starting interview:`, req.body);

      const { candidateId, jobId, candidateType } = req.body;

      if (!candidateId || typeof candidateId !== "string") {
        return res.status(400).json({
          success: false,
          error:   "Invalid candidateId — must be a non-empty string",
          code:    "INVALID_CANDIDATE_ID",
        });
      }

      if (!jobId || typeof jobId !== "string") {
        return res.status(400).json({
          success: false,
          error:   "Invalid jobId — must be a non-empty string",
          code:    "INVALID_JOB_ID",
        });
      }

      if (candidateType && typeof candidateType !== "string") {
        return res.status(400).json({
          success: false,
          error:   "Invalid candidateType — must be a string",
          code:    "INVALID_CANDIDATE_TYPE",
        });
      }

      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          error:   "Authorization token missing",
          code:    "TOKEN_MISSING",
        });
      }

      const result = await this.flowService.startInterview({
        candidateId,
        jobId,
        candidateType: candidateType || "generic",
        token,
      });

      console.log(`[${requestId}] Interview started:`, result.sessionId);

      return res.status(200).json({
        success: true,
        data: {
          sessionId: result.sessionId,
          greeting:  result.greeting,
          question:  result.question,
          phase:     result.phase,
        },
      });
    } catch (err) {
      console.error(`[${requestId}] startInterview error:`, err.message);

      if (err.message.includes("Session")) {
        return res.status(500).json({
          success: false,
          error:   "Failed to create interview session",
          code:    "SESSION_CREATION_FAILED",
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        error:   "Failed to start interview",
        code:    "START_INTERVIEW_ERROR",
        message: err.message,
      });
    }
  }

  /* =====================================================
     SUBMIT ANSWER
     POST /api/flow/answer
     Body: { sessionId, answer }
  ===================================================== */
  async submitAnswer(req, res) {
    const requestId = this._generateRequestId();

    try {
      const { sessionId, answer } = req.body;

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({
          success: false,
          error:   "Invalid sessionId",
          code:    "INVALID_SESSION_ID",
        });
      }

      if (!answer || typeof answer !== "string") {
        return res.status(400).json({
          success: false,
          error:   "Invalid answer",
          code:    "INVALID_ANSWER",
        });
      }

      const trimmedAnswer = answer.trim();

      if (trimmedAnswer.length === 0) {
        return res.status(400).json({
          success: false,
          error:   "Answer cannot be empty",
          code:    "EMPTY_ANSWER",
        });
      }

      if (trimmedAnswer.length > 5000) {
        return res.status(400).json({
          success: false,
          error:   "Answer exceeds maximum length (5000 characters)",
          code:    "ANSWER_TOO_LONG",
        });
      }

      console.log(`[${requestId}] Submitting answer for session ${sessionId}`);

      const result = await this.flowService.submitAnswer({
        sessionId,
        candidateAnswer: trimmedAnswer,
      });

      if (result.done) {
        return res.status(200).json({
          success: true,
          data: {
            done:    true,
            report:  result.report,
            message: result.message || "Interview completed",
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          done:       false,
          question:   result.question,
          phase:      result.phase || "technical",
          isFollowUp: result.isFollowUp || false,
        },
      });
    } catch (err) {
      console.error(`[${requestId}] submitAnswer error:`, err.message);

      if (err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error:   "Interview session not found",
          code:    "SESSION_NOT_FOUND",
          message: err.message,
        });
      }

      if (err.message.includes("No active turn")) {
        return res.status(400).json({
          success: false,
          error:   "No active question for this session",
          code:    "NO_ACTIVE_TURN",
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        error:   "Failed to process answer",
        code:    "SUBMIT_ANSWER_ERROR",
        message: err.message,
      });
    }
  }

  /* =====================================================
     GET REPORT
     GET /api/flow/report/:sessionId
  ===================================================== */
  async getReport(req, res) {
    const requestId = this._generateRequestId();

    try {
      const { sessionId } = req.params;

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({
          success: false,
          error:   "Invalid sessionId",
          code:    "INVALID_SESSION_ID",
        });
      }

      const report = await this.flowService.generateFinalReport(sessionId);
      console.log(`[${requestId}] Report generated:`, report.overallRating);

      return res.status(200).json({
        success: true,
        data:    { sessionId, report },
      });
    } catch (err) {
      console.error(`[${requestId}] getReport error:`, err.message);

      if (err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error:   "Interview session not found",
          code:    "SESSION_NOT_FOUND",
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        error:   "Failed to fetch report",
        code:    "GET_REPORT_ERROR",
        message: err.message,
      });
    }
  }

  /* =====================================================
     GET PROGRESS
     GET /api/flow/progress/:sessionId
  ===================================================== */
  async getProgress(req, res) {
    const requestId = this._generateRequestId();

    try {
      const { sessionId } = req.params;

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({
          success: false,
          error:   "Invalid sessionId",
          code:    "INVALID_SESSION_ID",
        });
      }

      const progress = await this.flowService.getSessionProgress(sessionId);
      console.log(`[${requestId}] Progress retrieved:`, progress);

      return res.status(200).json({
        success: true,
        data:    progress,
      });
    } catch (err) {
      console.error(`[${requestId}] getProgress error:`, err.message);

      if (err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error:   "Interview session not found",
          code:    "SESSION_NOT_FOUND",
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        error:   "Failed to fetch progress",
        code:    "GET_PROGRESS_ERROR",
        message: err.message,
      });
    }
  }

  /* =====================================================
     END INTERVIEW
     POST /api/flow/end/:sessionId
  ===================================================== */
  async endInterview(req, res) {
    const requestId = this._generateRequestId();

    try {
      const { sessionId } = req.params;

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({
          success: false,
          error:   "Invalid sessionId",
          code:    "INVALID_SESSION_ID",
        });
      }

      const report = await this.flowService.generateFinalReport(sessionId);
      await this.flowService.sessionRepo.endSession(sessionId);

      console.log(`[${requestId}] Interview ended:`, report.overallRating);

      return res.status(200).json({
        success: true,
        data: {
          sessionId,
          message: "Interview ended successfully",
          report,
        },
      });
    } catch (err) {
      console.error(`[${requestId}] endInterview error:`, err.message);

      if (err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error:   "Interview session not found",
          code:    "SESSION_NOT_FOUND",
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        error:   "Failed to end interview",
        code:    "END_INTERVIEW_ERROR",
        message: err.message,
      });
    }
  }

  /* =====================================================
     GET TOPICS FOR JOB
     GET /api/flow/topics/:jobId
  ===================================================== */
  async getTopicsForJob(req, res) {
    const requestId = this._generateRequestId();

    try {
      const { jobId } = req.params;

      if (!jobId || typeof jobId !== "string") {
        return res.status(400).json({
          success: false,
          error:   "Invalid jobId",
          code:    "INVALID_JOB_ID",
        });
      }

      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          error:   "Authorization token missing",
          code:    "TOKEN_MISSING",
        });
      }

      const topics = await this.flowService.getTopicsForJob(token);
      console.log(`[${requestId}] Topics fetched:`, topics);

      return res.status(200).json({
        success: true,
        data:    topics,
      });
    } catch (err) {
      console.error(`[${requestId}] getTopicsForJob error:`, err.message);

      return res.status(500).json({
        success: false,
        error:   "Failed to fetch topics",
        code:    "GET_TOPICS_ERROR",
        message: err.message,
      });
    }
  }

  /* =====================================================
     HELPERS
  ===================================================== */
  _generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}