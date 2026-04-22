import React from "react";
import { Icon } from "@iconify/react";
import { motion as Motion } from "framer-motion";

const InterviewRules = () => {
  const sections = [
  {
    title: "Before the Interview",
    rules: [
      "Ensure a stable internet connection to avoid interruptions.",
      "Test your microphone, camera, and speakers before joining.",
      "Use a compatible device (preferably a laptop or desktop) with an updated browser.",
      "Choose a quiet, well-lit environment for clear video and audio capture.",
      "Once the AI interview session begins, it must be completed in one continuous attempt and cannot be paused, stopped, or restarted."
    ],
  },
  {
    title: "During the Interview",
    rules: [
      "Keep your camera and microphone on at all times.",
      "Avoid external help or background distractions.",
      "Questions will be displayed on screen and may also be read aloud. You can either read or listen, whichever is more comfortable for you.",
      "Ensure your face remains clearly visible throughout the interview.",
      "Do not switch tabs or applications during the interview. Keep the interview tab open at all times.",
      "Do not use external devices or seek outside assistance during the interview.",
      "Do not refresh or close the browser window, as this may end your session and you may not be able to rejoin.",
      "You must respond to every question. If you are unsure, clearly state 'I don’t know', but still provide an answer attempt."
    ],
  },
  {
    title: "After the Interview",
    rules: [
      "Once completed, your responses will be automatically submitted — no further action is required.",
      "The interview is a single attempt and cannot be retaken once completed.",
      "Your responses will be reviewed by our system and team. If shortlisted, you will be contacted for the next stage."
    ],
  },
];

  return (

    
    <div className="w-full px-8 py-10">
      <Motion.h2
        className="text-4xl md:text-3xl font-bold text-[#29445D] mb-10 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        Interview Rules & Guidelines
      </Motion.h2>

      {sections.map((section, index) => (
        <div key={index} className="mb-12">
          <Motion.h3
            className="text-2xl font-semibold text-[#29445D] mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.2 }}
            viewport={{ once: true }}
          >
            {section.title}
          </Motion.h3>

          <div className="relative border-l-2 border-dashed border-[#005851] ml-3 space-y-6">
            {section.rules.map((rule, idx) => (
              <Motion.div
                key={idx}
                className="relative pl-6 group"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                viewport={{ once: true }}
              >
                <span className="absolute -left-3 top-1 w-4 h-4 rounded-full bg-[#29445D] shadow-md border-2 border-white"></span>
                <div className="flex items-start gap-3">
                  <Icon
                    icon="lucide:check-circle"
                    className="w-5 h-5 mt-0.5 text-[#29445D] flex-shrink-0"
                  />
                  <p className="text-[#29445D] text-lg leading-relaxed">
                    {rule}
                  </p>
                </div>
              </Motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InterviewRules;
