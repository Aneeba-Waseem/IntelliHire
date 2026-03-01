import axios from "axios";

export default class AIClient {
  constructor(baseURL = "http://127.0.0.1:8001/api") {
    this.client = axios.create({
      baseURL,
      timeout: 240000, // 2 minutes,
    });
  }

  /* =========================================
     1️⃣ GENERATE CONTEXT
  ========================================= */
  async generateContext(topic) {
    try {
      if (!topic || typeof topic !== "string") {
        console.warn("Invalid topic for generateContext:", topic);
        return "general";
      }

      console.log("Generating context for topic:", topic);
      const resp = await this.client.post("/chatModel/groq/generate-context", {
        prompt: topic,
      });

      console.log("generateContext response:", resp.data);

      // Handle different response structures
      const context = resp.data?.context || resp.data?.data || resp.data?.response || "";

      if (!context || typeof context !== "string") {
        console.warn("generateContext returned invalid context:", context);
        return topic || "general"; // fallback to topic or "general"
      }

      return context;
    } catch (err) {
      console.error("generateContext error:", err.message);
      return "general"; // safer fallback
    }
  }

  /* =========================================
     2️⃣ GENERATE QUESTION
  ========================================= */
  async generateQuestion({ context, difficulty }) {
    try {
      // Validate inputs
      if (!context || typeof context !== "string") {
        console.warn("Invalid context:", context);
        context = "general";
      }

      if (!difficulty || !["easy", "medium", "hard"].includes(difficulty)) {
        console.warn("Invalid difficulty:", difficulty);
        difficulty = "easy";
      }

      console.log("Generating question:", { context, difficulty });

      const resp = await this.client.post("/chatModel/qna/generate-question", {
        context: context,
        difficulty,
      });

      console.log("generateQuestion response:", resp.data);

      // Handle different response structures
      let item = null;

      if (resp.data?.data?.[0]) {
        item = resp.data.data[0];
      } else if (resp.data?.question) {
        item = resp.data; // direct object
      } else if (Array.isArray(resp.data)) {
        item = resp.data[0]; // array response
      }

      // Validate question item
      if (!item || !item.question) {
        console.error("generateQuestion returned no valid question:", item);
        return {
          question: `Tell me about ${context}`,
          ideal_answer: `This is a follow-up question about ${context}`,
        };
      }

      return {
        question: item.question,
        ideal_answer: item.ideal_answer || item.answer || `Expected answer for: ${item.question}`,
      };
    } catch (err) {
      console.error("generateQuestion error:", err.message);
      return {
        question: `Tell me about ${context || "general"}`,
        ideal_answer: "Please provide a detailed answer",
      };
    }
  }

  /* =========================================
     3️⃣ CONVERT QUESTION TO CONVERSATIONAL
  ========================================= */
  async convertQuestion(question) {
    try {
      if (!question || typeof question !== "string") {
        console.warn("Invalid question for conversion:", question);
        return question || "Could you tell me more about that?";
      }

      console.log("Converting question to conversational:", question.substring(0, 50));

      const resp = await this.client.post("/chatModel/groq/convert-question", {
        prompt: question,
      });

      console.log("convertQuestion response:", resp.data);

      // Handle different response structures
      const conversational =
        resp.data?.response ||
        resp.data?.message ||
        resp.data?.data ||
        resp.data?.text ||
        null;

      if (!conversational || typeof conversational !== "string") {
        console.warn("convertQuestion returned invalid response:", conversational);
        return question; // fallback to original
      }

      return conversational;
    } catch (err) {
      console.error("convertQuestion error:", err.message);
      return question; // fallback to original question
    }
  }

  /* =========================================
     4️⃣ EVALUATE ANSWER
  ========================================= */
  async evaluateAnswer(payload) {
    try {
      // Validate required payload fields
      if (!payload.interview_id || !payload.question_id) {
        throw new Error(
          "Missing required fields: interview_id, question_id"
        );
      }

      const evaluationPayload = {
        input_event: {
          interview_id: payload.interview_id,
          question_id: payload.question_id,
          domain: payload.domain || "general",
          question: payload.question || "",
          // candidate_answer: payload.answer || "",   // ✅ REQUIRED
          answer: payload.answer || "",             // keep both
          ideal_answer: payload.ideal_answer || "",
          turn_index: payload.turn_index ?? 0,
          timestamp: new Date().toISOString(),
          metadata: payload.metadata || {},
        },
        scorecard: payload.scorecard || {
          dimensions: {
            understanding: { current: 0, max: 5 },
            correctness: { current: 0, max: 5 },
            relevance: { current: 0, max: 5 },
          },
          by_domain: {},
          metadata: {},
        },
      };

      console.log("Evaluating answer:", evaluationPayload);

      console.time("Evaluator API time");

const resp = await this.client.post("/evaluator/evaluate", evaluationPayload);

console.timeEnd("Evaluator API time");

      console.log("evaluateAnswer response:", resp.data);

      // Validate response structure
      if (!resp.data) {
        throw new Error("Evaluator returned empty response");
      }

      // Ensure response_quality exists
      const evaluation = {
        response_quality: resp.data.response_quality || "ok",
        question_score: resp.data.question_score ?? 0,
        notes: resp.data.notes || [],
        feedback: resp.data.feedback || "",
        ...resp.data, // preserve all other fields
      };

      // Validate response_quality is one of expected values
      if (!["strong", "ok", "weak"].includes(evaluation.response_quality)) {
        console.warn(
          "Unknown response_quality:",
          evaluation.response_quality,
          "defaulting to 'ok'"
        );
        evaluation.response_quality = "ok";
      }

      return evaluation;
    } catch (err) {
console.error("evaluateAnswer error:", err.response?.data || err.message);      // Return safe default evaluation
      return {
        response_quality: "ok",
        question_score: 0,
        notes: [`Error during evaluation: ${err.message}`],
        feedback: "Could not evaluate answer",
      };
    }
  }

  /* =========================================
     BONUS: HEALTH CHECK
  ========================================= */
  async healthCheck() {
    try {
      const resp = await this.client.get("/health");
      return resp.data;
    } catch (err) {
      console.error("Health check failed:", err.message);
      return { status: "error", message: err.message };
    }
  }
}