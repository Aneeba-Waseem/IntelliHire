import recruiter from "../../assets/landing/recruiter.png";
import candidate from "../../assets/landing/candidate.png";

export const sectionsData = [
  {
    heading: "Hire Smarter with IntelliHire – The AI That Works for You",
    paragraph: "IntelliHire empowers recruiters to streamline the hiring process like never before. By creating an account, you can effortlessly schedule interviews for specific candidates, monitor progress, and receive detailed AI-generated reports on each candidate’s performance. Say goodbye to manual evaluations and scattered feedback — IntelliHire ensures every interview is conducted consistently, objectively, and efficiently.",
    image: recruiter,
    reverse: false, // text left, image right
    buttonText : "Start Hiring Smarter"
  },
  {
    heading: "Take Control of Your Career with IntelliHire",
    paragraph: "IntelliHire gives candidates a transparent, interactive, and insightful interview experience. By creating an account, you can view all your scheduled interviews, take them seamlessly through the AI-powered platform, and track your performance over time. Receive clear feedback, understand your strengths, and identify areas for improvement, all in one place.",
    image: candidate,
    reverse: true, // image left, text right
    buttonText : "See your progress"
  },
];
