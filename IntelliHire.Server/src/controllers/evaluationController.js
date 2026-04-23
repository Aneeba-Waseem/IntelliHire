import Interview from "../models/Interview.js";
import InterviewSession from "../models/InterviewSession.js";
import QuestionResponse from "../models/QuestionResponse.js";
import InterviewEvaluationRepository from "../repositories/InterviewEvaluationRepository.js";
import SessionEvaluationSummary from "../models/SessionEvaluationSummary.js";
import User from "../models/User.js";
import JobDescription from "../models/JobDescription.js";

const repo = new InterviewEvaluationRepository();

// ================= SAVE =================
export const saveEvaluation = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const sessionData = await repo.getBySessionId(sessionId);

    if (!sessionData) {
      return res.status(404).json({
        message: "Session not found in Redis",
      });
    }

    const { interviewId, questions } = sessionData;

    const interview = await Interview.findOne({
      where: { id: interviewId },
      attributes: ["id", "FK_JobDescription", "candidateUserId"],
    });

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    interview.IsCompleted = true;
    await interview.save();

    const candidateId = interview.candidateUserId;
    const jobId = interview.FK_JobDescription;

    await InterviewSession.create({
      id: sessionId,
      FK_Candidate: candidateId,
      FK_JobDescription: jobId,
    });

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

// ================= GET REPORT =================
export const getEvaluationReport = async (req, res) => {
  try {
    const { candidateId, jobId } = req.params;

    // 🔹 1. Find session
    const session = await InterviewSession.findOne({
      where: {
        FK_Candidate: candidateId,
        FK_JobDescription: jobId,
      },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const sessionId = session.id;

    // 🔹 2. Candidate + Job
    const candidate = await User.findOne({
      where: { AutoId: candidateId },
      attributes: ["fullName"],
    });

    const job = await JobDescription.findOne({
      where: { id: jobId },
      attributes: ["JobRole"],
    });

    // 🔹 3. Check summary
    let summary = await SessionEvaluationSummary.findOne({
      where: { FK_Session: sessionId },
    });

    let summaryArr = [];
    let strengths = [];
    let weaknesses = [];
    let overallScore = 0;

    // 🔥 4. Compute if not exists
    if (!summary) {
      const responses = await QuestionResponse.findAll({
        where: { FK_Session: sessionId },
      });

      const domainMap = {};

      responses.forEach((r) => {
        const evalData = r.evaluation_output || {};
        const score = evalData.question_score || 0;
        const note = evalData.notes || "";

        if (!domainMap[r.domain]) {
          domainMap[r.domain] = {
            total: 0,
            count: 0,
            notes: [],
          };
        }

        domainMap[r.domain].total += score;
        domainMap[r.domain].count += 1;

        if (note) {
          domainMap[r.domain].notes.push(note);
        }
      });

      // 🔹 domain summary
      summaryArr = Object.keys(domainMap).map((domain) => {
        const avg =
          domainMap[domain].total / domainMap[domain].count;

        return {
          domain,
          avgScore: parseFloat(avg.toFixed(2)),
          notes: domainMap[domain].notes.join(" | "), // 🔥 merge notes
        };
      });

      // 🔹 overall score
      overallScore =
        summaryArr.reduce((a, d) => a + d.avgScore, 0) /
        summaryArr.length;

      overallScore = parseFloat(overallScore.toFixed(2));

      // 🔹 strengths & weaknesses
      const scores = summaryArr.map((d) => d.avgScore);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);

      strengths = summaryArr
        .filter((d) => d.avgScore === maxScore)
        .map((d) => d.domain);

      weaknesses = summaryArr
        .filter((d) => d.avgScore === minScore)
        .map((d) => d.domain);

      // 🔥 store
      summary = await SessionEvaluationSummary.create({
        FK_Session: sessionId,
        domainScores: summaryArr,
        overallScore,
      });

    } else {
      summaryArr = summary.domainScores || [];
      overallScore = summary.overallScore || 0;

      if (summaryArr.length) {
        const scores = summaryArr.map((d) => d.avgScore);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);

        strengths = summaryArr
          .filter((d) => d.avgScore === maxScore)
          .map((d) => d.domain);

        weaknesses = summaryArr
          .filter((d) => d.avgScore === minScore)
          .map((d) => d.domain);
      }
    }

    // 🔹 5. DETAILS (always fresh)
    const responses = await QuestionResponse.findAll({
      where: { FK_Session: sessionId },
      order: [["timestamp", "ASC"]],
    });

    const sectionsMap = {};

    responses.forEach((r) => {
      const evalData = r.evaluation_output || {};
      const score = evalData.question_score || 0;
      const feedback = evalData.feedback || "";
      const notes = evalData.notes || ""; // 🔥 add notes

      if (!sectionsMap[r.domain]) {
        sectionsMap[r.domain] = {
          title: r.domain,
          questions: [],
        };
      }

      sectionsMap[r.domain].questions.push({
        question: r.question_text,
        feedback,
        score,
        notes, // 🔥 important
      });
    });

    const sections = Object.values(sectionsMap).map((sec) => {
      const avg =
        sec.questions.reduce((a, q) => a + q.score, 0) /
        sec.questions.length;

      return {
        ...sec,
        score: avg.toFixed(2),
      };
    });

    // 🔹 format summary
    const formattedSummary = summaryArr.map((d) => {
      const avgScore = d.avgScore;

      let noteText =
       avgScore < 2.5
    ? "The candidate struggled to demonstrate a clear understanding of key concepts in this domain and would benefit from further practice and foundational improvement."
    : avgScore < 4
    ? "The candidate shows a moderate understanding of this domain but lacks consistency and depth in some areas. With targeted improvement, performance can be strengthened."
    : "The candidate demonstrates strong proficiency and confidence in this domain, with clear and well-structured responses throughout.";

      return {
        domain: d.domain,
        score: avgScore,
        notes: noteText,
      };
    });
    let recommendation = overallScore < 2.5
  ? {
      title: "Reject the Candidate",
      description: "The candidate does not meet the required criteria and performance expectations.",
    }
  : overallScore < 4
  ? {
      title: "Consider the Candidate",
      description: "The candidate shows potential but has some areas that need improvement.",
    }
  : {
      title: "Hire the Candidate",
      description: "The candidate demonstrates strong skills and is a great fit for the role.",
    };


    return res.json({
      candidate: candidate?.fullName || "N/A",
      role: job?.JobRole || "N/A",
      duration: "N/A",
      score: overallScore,
      summary: formattedSummary,
      strengths,
      weaknesses,
      sections,
      recommendation,
    });

  } catch (err) {
    console.error("getEvaluationReport error:", err);
    res.status(500).json({ message: "Server error" });
  }
};