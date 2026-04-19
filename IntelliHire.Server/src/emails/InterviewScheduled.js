import React from "react";

export default function InterviewScheduled({ name, date, time, link }) {
  return React.createElement(
    "div",
    { style: { fontFamily: "Arial" } },
    React.createElement("h2", null, "Interview Scheduled"),
    React.createElement("p", null, `Hi ${name},`),
    React.createElement(
      "p",
      null,
      "Your interview is scheduled on ",
      React.createElement("b", null, date),
      " at ",
      React.createElement("b", null, time),
      "."
    ),
    React.createElement(
      "p",
      null,
      "Join using this link: ",
      React.createElement("a", { href: link }, link)
    ),
    React.createElement(
      "p",
      { style: { color: "red", fontWeight: "500", fontSize: "12px" } },
      "This is a secure, single-use interview link. Once you proceed to the interview, this session will be locked and cannot be reused for security purposes."
    ),
    React.createElement(
      "p",
      null,
      "Best regards,",
      React.createElement("br"),
      " IntelliHire Team"
    )
  );
}