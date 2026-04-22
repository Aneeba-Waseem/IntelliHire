import React from "react";

export default function InterviewScheduled({
  
  name,
  date,
  time,
  jobtitle,
  recruiterName,
  recruiterEmail,
  recruiterCompany,
  link,
}) {
  return React.createElement(
    "div",
    { style: { fontFamily: "Arial", lineHeight: "1.6" } },

    React.createElement("p", null, `Hi ${name},`),
     console.log("job in email"  , {jobtitle}),
    React.createElement(
      "p",
      null,
      "Congratulations! You’ve successfully progressed to the next stage of our hiring process. We’re pleased to inform you that your interview has been scheduled.",
      // React.createElement("b", null, jobtitle),
      
      // "position. We’re pleased to inform you that your interview has been scheduled."
    ),

    React.createElement("p", null, React.createElement("b", null, "Interview Details:")),

    React.createElement("p", null, "Date: ", React.createElement("b", null, date)),
    React.createElement("p", null, "Time: ", React.createElement("b", null, time)),
    React.createElement(
      "p",
      null,
      "Join Link: ",
      React.createElement("a", { href: link }, link)
    ),

    React.createElement(
      "p",
      { style: { color: "red", fontWeight: "500", fontSize: "12px" } },
      "This is a secure, single-use interview link. Once you proceed to the interview, the session will be locked and cannot be reused for security purposes."
    ),

    React.createElement("p", null, React.createElement("b", null, "What to expect:")),

    React.createElement(
      "p",
      null,
      "The interview will last approximately 30 to 45 minutes, so please ensure you have sufficient uninterrupted time available. The interview link is time-bound, so please be ready to start at your scheduled time."
    ),

    React.createElement("p", null, React.createElement("b", null, "Before the interview, please ensure the following:")),

    React.createElement(
      "ul",
      null,
      React.createElement("li", null, "Your camera and microphone are turned on and working properly throughout the session"),
      React.createElement("li", null, "You are in a quiet, distraction-free environment"),
      React.createElement("li", null, "Your browser settings and extensions do not block access to your camera or microphone"),
      React.createElement("li", null, "You have a stable internet connection to avoid interruptions")
    ),

    React.createElement(
      "p",
      null,
      "Further details and guidelines will be shared on the rules page."
    ),

    React.createElement(
      "p",
      null,
      "If you have any questions or face any technical issues prior to the interview, feel free to reach out to the respective HR."
    ),

    React.createElement(
      "p",
      null,
      "Please find HR's information below:"
    ),
    console.log("recruiter info in email template", { recruiterName, recruiterEmail, recruiterCompany }),
   
    React.createElement("p", null, "Name: ", recruiterName),
    React.createElement("p", null, "Email: ", recruiterEmail),
    React.createElement("p", null, "Company website: ", recruiterCompany),

    React.createElement(
      "p",
      null,
      "We look forward to speaking with you."
    ),

    React.createElement(
      "p",
      null,
      "Best regards,",
      React.createElement("br"),
      "IntelliHire Team"
    )
  );
}