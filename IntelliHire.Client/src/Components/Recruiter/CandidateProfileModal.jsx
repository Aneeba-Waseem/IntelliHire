import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faCode,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";

const CandidateProfileModal = ({ profile }) => {
  if (!profile) return null;
    console.log("candidate profile in modal", profile)
  return (
    <div className="text-[#29445D] flex flex-col gap-6">

      {/* Header */}
      <div className="border-b border-[#9CBFAC] pb-4">
        <h2 className="text-3xl font-bold">
          {profile.name}
        </h2>
        <p className="flex items-center gap-2 text-[#45767C] mt-2">
          <FontAwesomeIcon icon={faEnvelope} />
          {profile.email}
        </p>
      </div>

      {/* Skills */}
      <div className="bg-[#F2FAF5] p-4 rounded-xl border border-[#C6D3CA]">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <FontAwesomeIcon icon={faCode} />
          Skills Summary
        </h3>
        <p className="text-sm text-[#45767C]">
          {JSON.stringify(profile.skills_summary, null, 2)}
        </p>
      </div>

      {/* Coursework */}
      <div className="bg-[#F2FAF5] p-4 rounded-xl border border-[#C6D3CA]">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <FontAwesomeIcon icon={faGraduationCap} />
          Coursework Keywords
        </h3>
        <p className="text-sm text-[#45767C]">
          {JSON.stringify(profile.coursework_keywords, null, 2)}
        </p>
      </div>

      {/* Links */}
      <div className="flex flex-col gap-2 text-sm">
        <a
          href={profile.linkedin}
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          LinkedIn Profile
        </a>

        <a
          href={profile.github_link}
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          GitHub Profile
        </a>
      </div>
    </div>
  );
};

export default CandidateProfileModal;