import axios from "axios";

/**
 * AIClient.js
 *
 * Wraps all AI/ML endpoints.
 *
 * NEW in this revision:
 *   analyzeWithConversationalLLM({ question, answer })
 *     → { decision: "further_explanation" | "submit", followUpText?: string }
 *
 *   generateFallbackBatch(topics, count)
 *     → Array<{ question, idealAnswer }>
 *
 * Everything else is unchanged from the original.
 */
export default class AIClient {
  constructor(baseURL = "http://localhost:8001/api") {
    this.client = axios.create({
      baseURL,
      timeout: 240_000, // 4 minutes
    });
  }

  /* =========================================
     1️⃣  GENERATE CONTEXT
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

      const context =
        resp.data?.context || resp.data?.data || resp.data?.response || "";

      if (!context || typeof context !== "string") {
        console.warn("generateContext returned invalid context:", context);
        return topic || "general";
      }

      return context;
    } catch (err) {
      console.error("generateContext error:", err.message);
      return "general";
    }
  }

  /* =========================================
     2️⃣  GENERATE QUESTION
  ========================================= */
  async generateQuestion({ context, difficulty }) {
    try {
      if (!context || typeof context !== "string") context = "general";
      if (!["easy", "medium", "hard"].includes(difficulty)) difficulty = "easy";

      const resp = await this.client.post("/chatModel/qna/generate-question", {
        context,
        difficulty,
      });

      let item = null;
      if (resp.data?.data?.[0])      item = resp.data.data[0];
      else if (resp.data?.question)  item = resp.data;
      else if (Array.isArray(resp.data)) item = resp.data[0];

      if (!item?.question) {
        return {
          question:    `Tell me about ${context}`,
          ideal_answer: `Follow-up on ${context}`,
        };
      }

      return {
        question:    item.question,
        ideal_answer: item.ideal_answer || item.answer || `Expected answer for: ${item.question}`,
      };
    } catch (err) {
      console.error("generateQuestion error:", err.message);
      return {
        question:    `Tell me about ${context || "general"}`,
        ideal_answer: "Please provide a detailed answer",
      };
    }
  }

  /* =========================================
     3️⃣  CONVERT QUESTION (conversational)
  ========================================= */
  async convertQuestion(question) {
    try {
      if (!question || typeof question !== "string") return question || "Could you tell me more?";

      const resp = await this.client.post("/chatModel/groq/convert-question", {
        prompt: question,
      });

      const conversational =
        resp.data?.response ||
        resp.data?.message  ||
        resp.data?.data     ||
        resp.data?.text     ||
        null;

      return conversational && typeof conversational === "string"
        ? conversational
        : question;
    } catch (err) {
      console.error("convertQuestion error:", err.message);
      return question;
    }
  }

  /* =========================================
     4️⃣  EVALUATE ANSWER
  ========================================= */
  async evaluateAnswer(payload) {
    try {
      if (!payload.interview_id || !payload.question_id) {
        throw new Error("Missing required fields: interview_id, question_id");
      }

      const evaluationPayload = {
        input_event: {
          interview_id: payload.interview_id,
          question_id:  payload.question_id,
          domain:       payload.domain       || "general",
          question:     payload.question     || "",
          answer:       payload.answer       || "",
          ideal_answer: payload.ideal_answer || "",
          turn_index:   payload.turn_index   ?? 0,
          timestamp:    new Date().toISOString(),
          metadata:     payload.metadata     || {},
        },
        scorecard: payload.scorecard || {
          dimensions: {
            understanding: { current: 0, max: 5 },
            correctness:   { current: 0, max: 5 },
            relevance:     { current: 0, max: 5 },
          },
          by_domain: {},
          metadata:  {},
        },
      };

      console.time("Evaluator API time");
      const resp = await this.client.post("/evaluator/evaluate", evaluationPayload);
      console.timeEnd("Evaluator API time");

      if (!resp.data) throw new Error("Evaluator returned empty response");

      const evaluation = {
        response_quality: resp.data.response_quality || "ok",
        question_score:   resp.data.question_score   ?? 0,
        notes:            resp.data.notes            || [],
        feedback:         resp.data.feedback         || "",
        ...resp.data,
      };

      if (!["strong", "ok", "weak"].includes(evaluation.response_quality)) {
        evaluation.response_quality = "ok";
      }

      return evaluation;
    } catch (err) {
      console.error("evaluateAnswer error:", err.response?.data || err.message);
      return {
        response_quality: "ok",
        question_score:   0,
        notes:            [`Evaluation error: ${err.message}`],
        feedback:         "Could not evaluate answer",
      };
    }
  }

  /* =========================================
     5️⃣  ANALYSE WITH CONVERSATIONAL LLM  ← NEW
     ─────────────────────────────────────────
     Decides after a candidate answers whether to:
       A) Ask a follow-up / request further explanation
       B) Accept the answer and move on (submit)

     Returns:
       {
         decision:      "further_explanation" | "submit",
         followUpText?: string   // only when decision === "further_explanation"
       }
  ========================================= */
  async analyzeWithConversationalLLM({ question, answer }) {
    try {
      if (!question || !answer) {
        return { decision: "submit" };
      }

      console.log("[ConvLLM] Analysing answer for follow-up decision...");

      const resp = await this.client.post(
        "/chatModel/groq/conversational-analysis",
        { question, answer }
      );

      const data = resp.data;

      /*
       * Expected API response shape:
       *   { decision: "further_explanation" | "submit", followUpText?: string }
       *
       * Fallback: if the API returns something unexpected we default to "submit"
       * so the interview keeps flowing.
       */
      const decision = data?.decision;

      if (decision === "further_explanation") {
        const followUpText =
          data?.followUpText ||
          data?.follow_up_text ||
          data?.message ||
          "Could you elaborate on that a bit more?";

        console.log("[ConvLLM] Decision: further_explanation →", followUpText);
        return { decision: "further_explanation", followUpText };
      }

      console.log("[ConvLLM] Decision: submit");
      return { decision: "submit" };
    } catch (err) {
      console.error("analyzeWithConversationalLLM error:", err.message);
      // Default to submit on error so the interview never gets stuck
      return { decision: "submit" };
    }
  }

  /* =========================================
     6️⃣  GENERATE FALLBACK BATCH  ← NEW
     ─────────────────────────────────────────
     Pre-generates `count` questions for the fallback queue
     based on the job's topic list.

     Returns Array<{ question, idealAnswer }>
  ========================================= */
  async generateFallbackBatch(topics = [], count = 10) {
    try {
      console.log(`[AIClient] Generating ${count} fallback questions for topics:`, topics);

      const resp = await this.client.post("/chatModel/qna/generate-batch", {
        topics,
        count,
        difficulty: "easy",  // fallbacks are intentionally approachable
      });

      const items = resp.data?.data || resp.data?.questions || resp.data || [];

      if (!Array.isArray(items) || items.length === 0) {
        console.warn("[AIClient] generateFallbackBatch returned no items, using generic");
        return [];
      }

      return items.map((item) => ({
        question:    item.question    || `Tell me about ${topics[0] || "your experience"}`,
        idealAnswer: item.ideal_answer || item.answer || "",
        source:      "fallback",
      }));
    } catch (err) {
      console.error("generateFallbackBatch error:", err.message);
      return []; // QuestionQueueService will pad with _genericFallbacks
    }
  }

  /* =========================================
     HEALTH CHECK
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