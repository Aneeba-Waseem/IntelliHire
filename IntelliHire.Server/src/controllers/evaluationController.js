import InterviewSession from "../models/InterviewSession.js";
import QuestionResponse from "../models/QuestionResponse.js";
import User from "../models/User.js";

export const saveEvaluation = async (req, res) => {
  try {
    const { sessionData, candidateUserId } = req.body;

    const { sessionId, questions } = sessionData;

    // 🔥 get candidate (UserId → AutoId)
    const candidate = await User.findOne({
      where: { UserId: candidateUserId },
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // 🔥 recruiter from token (assuming middleware sets req.user)
    const recruiterId = req.user.AutoId;

    // ⚠️ you must send this from frontend OR store earlier
    const jobId = req.body.jobId;

    // 1️⃣ Create Session
    await InterviewSession.create({
      id: sessionId,
      FK_Candidate: candidate.AutoId,
      FK_Recruiter: recruiterId,
      FK_JobDescription: jobId,
    });

    // 2️⃣ Prepare bulk questions
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

    // 3️⃣ Bulk Insert
    await QuestionResponse.bulkCreate(questionRows);

    return res.status(200).json({
      message: "Evaluation saved successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error saving evaluation",
    });
  }
};