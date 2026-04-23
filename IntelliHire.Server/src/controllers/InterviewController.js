class InterviewController {
  constructor({ flowService }) {
    this.flowService = flowService;

    this.generateContext = this.generateContext.bind(this);
    this.convertQuestion = this.convertQuestion.bind(this);
  }

  async generateContext(req, res) {
    try {
      const { keywords } = req.body;

      const context =
        await this.flowService.createContextFromKeywords(keywords);

      res.status(200).json({ context });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async convertQuestion(req, res) {
    try {
      const { question } = req.body;

      const result =
        await this.flowService.convertToInterviewStyle(question);

      res.status(200).json({ question: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }


}

export default InterviewController;