// controllers/FlowController.js
export default class FlowController {
  constructor({ flowService }) {
    if (!flowService) {
      throw new Error("FlowService is required");
    }
    this.flowService = flowService;

    // Bind methods so Express receives proper functions
    this.startInterview = this.startInterview.bind(this);
    this.submitAnswer = this.submitAnswer.bind(this);
    this.getReport = this.getReport.bind(this);
    this.getProgress = this.getProgress.bind(this);
    this.endInterview = this.endInterview.bind(this);
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
      console.log(`[${requestId}] Starting interview request:`, req.body);

      // ✅ Extract and validate inputs
      const { candidateId, jobId, candidateType } = req.body;

      if (!candidateId || typeof candidateId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid candidateId - must be a non-empty string",
          code: "INVALID_CANDIDATE_ID",
        });
      }

      if (!jobId || typeof jobId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid jobId - must be a non-empty string",
          code: "INVALID_JOB_ID",
        });
      }

      // candidateType is optional, but validate if provided
      if (candidateType && typeof candidateType !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid candidateType - must be a string",
          code: "INVALID_CANDIDATE_TYPE",
        });
      }

      // Extract token from Authorization header
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: "Authorization token missing",
          code: "TOKEN_MISSING",
        });
      }
      // ✅ Call FlowService
      const result = await this.flowService.startInterview({
        candidateId,
        jobId,
        candidateType: candidateType || "generic",
        token
      });

      console.log(`[${requestId}] Interview started:`, result.sessionId);

      // ✅ Return consistent response
      return res.status(200).json({
        success: true,
        data: {
          sessionId: result.sessionId,
          greeting: result.greeting,
          question: result.question,
          phase: result.phase,
        },
      });
    } catch (err) {
      console.error(`[${requestId}] Start Interview Error:`, err.message);

      // Handle specific error types
      if (err.message.includes("Session")) {
        return res.status(500).json({
          success: false,
          error: "Failed to create interview session",
          code: "SESSION_CREATION_FAILED",
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Failed to start interview",
        code: "START_INTERVIEW_ERROR",
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
      console.log(`[${requestId}] Submitting answer request:`, {
        sessionId: req.body.sessionId,
        answerLength: req.body.answer?.length || 0,
      });

      // ✅ Extract and validate inputs
      const { sessionId, answer } = req.body;

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid sessionId - must be a non-empty string",
          code: "INVALID_SESSION_ID",
        });
      }

      if (!answer || typeof answer !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid answer - must be a non-empty string",
          code: "INVALID_ANSWER",
        });
      }

      // Trim and validate answer length
      const trimmedAnswer = answer.trim();
      if (trimmedAnswer.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Answer cannot be empty",
          code: "EMPTY_ANSWER",
        });
      }

      if (trimmedAnswer.length > 5000) {
        return res.status(400).json({
          success: false,
          error: "Answer exceeds maximum length (5000 characters)",
          code: "ANSWER_TOO_LONG",
        });
      }

      // ✅ Call FlowService
      const result = await this.flowService.submitAnswer({
        sessionId,
        candidateAnswer: trimmedAnswer,
      });

      console.log(`[${requestId}] Answer processed:`, {
        sessionId,
        done: result.done,
        phase: result.phase,
      });

      // ✅ Handle interview completion
      if (result.done) {
        return res.status(200).json({
          success: true,
          data: {
            done: true,
            report: result.report,
            message: result.message || "Interview completed",
          },
        });
      }

      // ✅ Continue interview
      return res.status(200).json({
        success: true,
        data: {
          done: false,
          question: result.question,
          phase: result.phase || "technical",
        },
      });
    } catch (err) {
      console.error(`[${requestId}] Submit Answer Error:`, err.message);

      // Handle specific error types
      if (err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: "Interview session not found",
          code: "SESSION_NOT_FOUND",
          message: err.message,
        });
      }

      if (err.message.includes("No active turn")) {
        return res.status(400).json({
          success: false,
          error: "No active question for this session",
          code: "NO_ACTIVE_TURN",
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Failed to process answer",
        code: "SUBMIT_ANSWER_ERROR",
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
      console.log(`[${requestId}] Fetching report for session:`, req.params.sessionId);

      // ✅ Extract and validate input
      const { sessionId } = req.params;

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid sessionId - must be a non-empty string",
          code: "INVALID_SESSION_ID",
        });
      }

      // ✅ Call FlowService
      const report = await this.flowService.generateFinalReport(sessionId);

      console.log(`[${requestId}] Report generated:`, report.overallRating);

      // ✅ Return consistent response
      return res.status(200).json({
        success: true,
        data: {
          sessionId,
          report,
        },
      });
    } catch (err) {
      console.error(`[${requestId}] Get Report Error:`, err.message);

      if (err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: "Interview session not found",
          code: "SESSION_NOT_FOUND",
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Failed to fetch report",
        code: "GET_REPORT_ERROR",
        message: err.message,
      });
    }
  }

  /* =====================================================
     GET PROGRESS (NEW)
     GET /api/flow/progress/:sessionId
  ===================================================== */
  async getProgress(req, res) {
    const requestId = this._generateRequestId();

    try {
      console.log(`[${requestId}] Fetching progress for session:`, req.params.sessionId);

      // ✅ Extract and validate input
      const { sessionId } = req.params;

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid sessionId - must be a non-empty string",
          code: "INVALID_SESSION_ID",
        });
      }

      // ✅ Call FlowService
      const progress = await this.flowService.getSessionProgress(sessionId);

      console.log(`[${requestId}] Progress retrieved:`, progress);

      // ✅ Return consistent response
      return res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (err) {
      console.error(`[${requestId}] Get Progress Error:`, err.message);

      if (err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: "Interview session not found",
          code: "SESSION_NOT_FOUND",
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Failed to fetch progress",
        code: "GET_PROGRESS_ERROR",
        message: err.message,
      });
    }
  }

  /* =====================================================
     END INTERVIEW (NEW)
     POST /api/flow/end/:sessionId
  ===================================================== */
  async endInterview(req, res) {
    const requestId = this._generateRequestId();

    try {
      console.log(`[${requestId}] Ending interview for session:`, req.params.sessionId);

      // ✅ Extract and validate input
      const { sessionId } = req.params;

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid sessionId - must be a non-empty string",
          code: "INVALID_SESSION_ID",
        });
      }

      // ✅ Generate final report before ending
      const report = await this.flowService.generateFinalReport(sessionId);

      // ✅ End session via repository
      await this.flowService.sessionRepo.endSession(sessionId);

      console.log(`[${requestId}] Interview ended:`, report.overallRating);

      // ✅ Return consistent response
      return res.status(200).json({
        success: true,
        data: {
          sessionId,
          message: "Interview ended successfully",
          report,
        },
      });
    } catch (err) {
      console.error(`[${requestId}] End Interview Error:`, err.message);

      if (err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: "Interview session not found",
          code: "SESSION_NOT_FOUND",
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: "Failed to end interview",
        code: "END_INTERVIEW_ERROR",
        message: err.message,
      });
    }
  }

  /* =====================================================
     HELPER: Generate unique request ID for tracing
  ===================================================== */
  _generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /* =====================================================
     HELPER: Validate email format
  ===================================================== */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }


  async getTopicsForJob(req, res) {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "jobId is required",
        });
      }

      const topics = await this.flowService.getTopicsForJob(jobId);

      return res.status(200).json({
        success: true,
        data: topics,
      });
    } catch (error) {
      console.error("Error fetching topics:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch topics",
      });
    }
  };
}