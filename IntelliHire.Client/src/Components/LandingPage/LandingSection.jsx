import React from "react";
import SectionTemplate from "./SectionTemplate";
import { sectionsData } from "./SectionData";

export default function LandingSection() {
  return (
    <div className="w-full px-4 lg:px-20">
      {sectionsData.map((section, index) => (
        <SectionTemplate
          key={index}
          heading={section.heading}
          paragraph={section.paragraph}
          image={section.image}
          reverse={section.reverse}
          buttonText={section.buttonText}
        />
      ))}
    </div>
  );
}
