// cacheRepositories/InterviewTurnRepository.js
const InterviewTurn = require("../cacheModels/InterviewTurn");
const EvaluationResult = require("../cacheModels/EvaluationResult"); // assuming you have this class

class InterviewTurnRepository {
  constructor(turnCache = []) {
    // turnCache can be an in-memory array or a Redis list
    this.cache = turnCache;
  }

  async create(turnData) {
    const turn = new InterviewTurn({
      ...turnData,
      evaluation: turnData.evaluation
        ? new EvaluationResult(turnData.evaluation)
        : null,
    });

    this.cache.push(turn); // simple in-memory storage
    return turn;
  }

  async findBySessionId(sessionId) {
    const turns = this.cache
      .filter((t) => t.sessionId === sessionId)
      .sort((a, b) => a.createdAt - b.createdAt);

    return turns.map(
      (t) =>
        new InterviewTurn({
          ...t,
          evaluation: t.evaluation
            ? new EvaluationResult(t.evaluation)
            : null,
        })
    );
  }
}

module.exports = InterviewTurnRepository;