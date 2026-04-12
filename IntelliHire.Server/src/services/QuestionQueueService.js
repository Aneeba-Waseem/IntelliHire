/**
 * ============================================================================
 * QuestionQueueService.js
 * 
 * Manages two queues per session:
 *   - questionQueue   : AI-generated questions (dynamic, filled on demand)
 *   - fallbackQueue   : 10 pre-generated questions seeded at session start
 * 
 * API:
 *   await svc.initSession(sessionId, topics)
 *   svc.enqueue(sessionId, { question, idealAnswer, topic?, phase? })
 *   svc.dequeue(sessionId)   → { question, idealAnswer, source } | null
 *   svc.peek(sessionId)      → same without removing
 *   svc.isEmpty(sessionId)
 *   svc.lengths(sessionId)   → { questionQueue, fallbackQueue }
 *   svc.destroy(sessionId)
 * ============================================================================
 */

export default class QuestionQueueService {
  constructor() {
    /** @type {Map<string, { questionQueue: any[], fallbackQueue: any[], initialized: boolean }>} */
    this._sessions = new Map();
  }

  /* ─────────────────────────────────────────────
     INIT SESSION  —  seed fallback queue
  ───────────────────────────────────────────── */

  /**
   * Call once when the interview starts.
   * Generates 10 fallback questions using generic templates (no AI dependency).
   * 
   * @param {string}   sessionId
   * @param {string[]} topics     e.g. ['React', 'Node.js', 'SQL']
   */
  async initSession(sessionId, topics = []) {
    if (this._sessions.has(sessionId)) {
      console.warn(`[QueueSvc] Session ${sessionId} already initialized`);
      return;
    }

    this._sessions.set(sessionId, {
      questionQueue: [],
      fallbackQueue: [],
      initialized: false,
    });

    try {
      // Generate 10 fallback questions using generic templates
      const fallbacks = this._genericFallbacks(topics, 10);
      
      const session = this._sessions.get(sessionId);
      session.fallbackQueue = fallbacks;
      session.initialized = true;

      console.log(
        `[QueueSvc] Session ${sessionId} initialized with ${fallbacks.length} fallback questions`
      );
    } catch (err) {
      console.error(`[QueueSvc] Error initializing fallbacks for ${sessionId}:`, err.message);
      const session = this._sessions.get(sessionId);
      if (session) {
        session.fallbackQueue = this._genericFallbacks(topics, 10);
        session.initialized = true;
      }
    }
  }

  /* ─────────────────────────────────────────────
     ENQUEUE  —  push an AI-generated question
  ───────────────────────────────────────────── */

  /**
   * @param {string} sessionId
   * @param {{ question: string, idealAnswer: string, topic?: string, phase?: string }} item
   */
  enqueue(sessionId, item) {
    this._ensureSession(sessionId);
    const session = this._sessions.get(sessionId);

    if (!item?.question) {
      console.warn(`[QueueSvc] Attempted to enqueue invalid item for ${sessionId}`);
      return;
    }

    session.questionQueue.push({
      question: item.question,
      idealAnswer: item.idealAnswer || "",
      topic: item.topic || null,
      phase: item.phase || null,
      source: "ai",
    });

    console.log(
      `[QueueSvc] Enqueued AI question for ${sessionId}. ` +
      `qQueue=${session.questionQueue.length}`
    );
  }

  /* ─────────────────────────────────────────────
     DEQUEUE  —  get next question (qQueue first)
  ───────────────────────────────────────────── */

  /**
   * Returns the next question object or null if both queues are empty.
   * Priority: questionQueue (AI-generated) → fallbackQueue (generic templates)
   * 
   * @param {string} sessionId
   * @returns {{ question, idealAnswer, topic, phase, source } | null}
   */
  dequeue(sessionId) {
    this._ensureSession(sessionId);
    const session = this._sessions.get(sessionId);

    if (session.questionQueue.length > 0) {
      const item = session.questionQueue.shift();
      console.log(`[QueueSvc] Dequeued from questionQueue for ${sessionId}`);
      return item;
    }

    if (session.fallbackQueue.length > 0) {
      const item = session.fallbackQueue.shift();
      console.log(`[QueueSvc] Dequeued from fallbackQueue for ${sessionId}`);
      return item;
    }

    console.warn(`[QueueSvc] Both queues empty for session ${sessionId}`);
    return null;
  }

  /* ─────────────────────────────────────────────
     PEEK  —  look without removing
  ───────────────────────────────────────────── */

  peek(sessionId) {
    this._ensureSession(sessionId);
    const session = this._sessions.get(sessionId);

    if (session.questionQueue.length > 0) return session.questionQueue[0];
    if (session.fallbackQueue.length > 0) return session.fallbackQueue[0];
    return null;
  }

  /* ─────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────── */

  isEmpty(sessionId) {
    if (!this._sessions.has(sessionId)) return true;
    const s = this._sessions.get(sessionId);
    return s.questionQueue.length === 0 && s.fallbackQueue.length === 0;
  }

  lengths(sessionId) {
    if (!this._sessions.has(sessionId)) return { questionQueue: 0, fallbackQueue: 0 };
    const s = this._sessions.get(sessionId);
    return { 
      questionQueue: s.questionQueue.length, 
      fallbackQueue: s.fallbackQueue.length 
    };
  }

  destroy(sessionId) {
    this._sessions.delete(sessionId);
    console.log(`[QueueSvc] Session ${sessionId} destroyed`);
  }

  /* ─────────────────────────────────────────────
     PRIVATE
  ───────────────────────────────────────────── */

  _ensureSession(sessionId) {
    if (!this._sessions.has(sessionId)) {
      console.warn(`[QueueSvc] Auto-creating session for ${sessionId}`);
      this._sessions.set(sessionId, {
        questionQueue: [],
        fallbackQueue: this._genericFallbacks([], 10),
        initialized: true,
      });
    }
  }

  /**
   * Generate fallback questions from generic templates.
   * Templates are cycled through and parametrized with topics.
   * 
   * @param {string[]} topics - List of topics (e.g., ['React', 'Node.js'])
   * @param {number}  count   - Number of questions to generate (default: 10)
   * @returns {Array<{ question: string, idealAnswer: string, source: string }>}
   */
  _genericFallbacks(topics = [], count = 10) {
    const topicList = topics.length ? topics : ["your experience"];

    const templates = [
      (t) => ({
        question: `Can you walk me through how you've used ${t} in a real project?`,
        idealAnswer: `Candidate should describe a concrete project using ${t} with implementation detail.`,
        source: "fallback",
      }),
      (t) => ({
        question: `What are the most common pitfalls when working with ${t}?`,
        idealAnswer: `Common issues in ${t} include performance bottlenecks, improper error handling, lack of tests.`,
        source: "fallback",
      }),
      (t) => ({
        question: `How do you ensure code quality in a ${t} codebase?`,
        idealAnswer: `Testing, code reviews, linting, and documentation are key for ${t} code quality.`,
        source: "fallback",
      }),
      (t) => ({
        question: `Describe a difficult bug you encountered in ${t} and how you resolved it.`,
        idealAnswer: `Candidate should demonstrate debugging methodology and problem-solving for ${t}.`,
        source: "fallback",
      }),
      (t) => ({
        question: `How do you stay current with changes and updates in ${t}?`,
        idealAnswer: `Official docs, community blogs, experimenting with new features in ${t}.`,
        source: "fallback",
      }),
      (t) => ({
        question: `What performance optimization techniques do you apply with ${t}?`,
        idealAnswer: `Caching, lazy loading, query optimization, and profiling for ${t}.`,
        source: "fallback",
      }),
      (t) => ({
        question: `How would you explain ${t} to a junior developer?`,
        idealAnswer: `A clear analogy-based explanation demonstrating depth of understanding of ${t}.`,
        source: "fallback",
      }),
      (t) => ({
        question: `What limitations or trade-offs exist in ${t}?`,
        idealAnswer: `Thoughtful critique showing understanding of ${t}'s limitations.`,
        source: "fallback",
      }),
      (t) => ({
        question: `How do you test your work when using ${t}?`,
        idealAnswer: `Unit, integration, and end-to-end testing approach for ${t}.`,
        source: "fallback",
      }),
      (t) => ({
        question: `Tell me about a trade-off decision you made involving ${t}.`,
        idealAnswer: `Candidate articulates trade-off reasoning, constraints, and outcome for ${t}.`,
        source: "fallback",
      }),
    ];

    return Array.from({ length: count }, (_, i) => {
      const topic = topicList[i % topicList.length];
      const template = templates[i % templates.length];
      return template(topic);
    });
  }
}