import InterviewTurn from "../cacheModels/InterviewTurn.js";
import EvaluationResult from "../models/EvaluationResult.js";

class InterviewTurnRepository {
  constructor(InterviewTurnModel) {
    this.InterviewTurnModel = InterviewTurnModel;
  }

  async create(turnData) {
    const evaluation = turnData.evaluation
      ? new EvaluationResult(turnData.evaluation)
      : null;

    const created = await this.InterviewTurnModel.create({
      sessionId: turnData.sessionId,
      question: turnData.question,
      idealAnswer: turnData.idealAnswer,
      candidateAnswer: turnData.candidateAnswer,
      evaluation: evaluation ? evaluation.toJSON() : null,
      topic: turnData.topic,
      phase: turnData.phase,
      depthLevel: turnData.depthLevel,
      createdAt: new Date(),
    });

    return new InterviewTurn({
      ...created.toJSON(),
      evaluation: evaluation,
    });
  }

  async findBySessionId(sessionId) {
    const turns = await this.InterviewTurnModel.findAll({
      where: { sessionId },
      order: [["createdAt", "ASC"]],
    });

    return turns.map((t) => {
      const plain = t.toJSON();

      return new InterviewTurn({
        ...plain,
        evaluation: plain.evaluation
          ? new EvaluationResult(plain.evaluation)
          : null,
      });
    });
  }
}

export default InterviewTurnRepository;