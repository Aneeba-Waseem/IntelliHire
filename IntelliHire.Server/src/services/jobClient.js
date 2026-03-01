// services/JobClient.js
import axios from "axios";

export default class JobClient {
  constructor(baseURL = "http://localhost:8000/api") {
    this.client = axios.create({ baseURL, timeout: 10000 });
  }

  async getJobStep1(token) {
  try {
    const resp = await this.client.get("/jobCache/cacheStep1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp.data || {};
  } catch (err) {
    console.error("JobClient error:", err.response?.data || err.message);
    return {};
  }
}
}