import Interview from "../models/Interview.js";
import InterviewSession from "../models/InterviewSession.js";
import QuestionResponse from "../models/QuestionResponse.js";
import InterviewEvaluationRepository from "../repositories/InterviewEvaluationRepository.js";

const repo = new InterviewEvaluationRepository();

export const saveEvaluation = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // 🔥 1. Get full session from Redis
    const sessionData = await repo.getBySessionId(sessionId);
    console.log("session data: ", sessionData);
    if (!sessionData) {
      return res.status(404).json({
        message: "Session not found in Redis",
      });
    }

    const { interviewId, questions } = sessionData;

    // 🔥 2. Get interview details from DB
    const interview = await Interview.findOne({
      where: { id: interviewId },
      attributes: ["FK_JobDescription", "candidateUserId"],
    });

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const candidateId = interview.candidateUserId;
    const jobId = interview.FK_JobDescription;
    console.log("candidate: ", candidateId, "job: ", jobId);

    // 🔥 3. Create Interview Session (DB)
    await InterviewSession.create({
      id: sessionId,
      FK_Candidate: candidateId,
      FK_JobDescription: jobId,
    });

    // 🔥 4. Bulk insert questions
    const questionRows = questions.map((q) => ({
      questionId: q.questionId,
      domain: q.domain,
      topic: q.topic,
      question_text: q.question_text,
      candidate_answer: q.candidate_answer,
      ideal_answer: q.ideal_answer,
      phase: q.phase,
      depthLevel: q.depthLevel,
      timestamp: q.timestamp,
      evaluation_output: q.evaluation_output,
      FK_Session: sessionId,
    }));

    await QuestionResponse.bulkCreate(questionRows);

    // 🔥 5. Clear Redis after successful save
    await repo.clearSession(sessionId);

    return res.status(200).json({
      message: "Evaluation saved successfully",
    });
  } catch (error) {
    console.error("❌ saveEvaluation error:", error);

    return res.status(500).json({
      message: "Error saving evaluation",
      error: error.message,
    });
  }
};