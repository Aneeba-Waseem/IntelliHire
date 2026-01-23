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
        "Keep your ID ready for AI-based verification, if required.",
      ],
    },
    {
      title: "During the Interview",
      rules: [
        "Keep your camera and microphone on at all times.",
        "Avoid external help or background distractions.",
        "Follow on-screen AI prompts for speaking or recording responses.",
        "Maintain eye contact with the camera to help the AI assess engagement.",
        "Speak clearly and at a normal pace for accurate voice analysis.",
        "Manage your time — each question has a set limit.",
        "Avoid background movement or noise that may affect tracking accuracy.",
      ],
    },
    {
      title: "After the Interview",
      rules: [
        "Provide feedback when prompted to help improve the AI system.",
        "Do not refresh or close the browser tab until submission is complete.",
        "Review your performance summary if the AI provides one.",
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
