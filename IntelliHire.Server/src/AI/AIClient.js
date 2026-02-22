import axios from "axios";

class AIClient {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  async generateContext(keywords) {
    const response = await this.client.post("/generate-context", {
      keywords,
    });

    return response.data.context;
  }

  async convertQuestion(question) {
    const response = await this.client.post("/convert-question", {
      question,
    });

    return response.data.question;
  }
}

export default AIClient;