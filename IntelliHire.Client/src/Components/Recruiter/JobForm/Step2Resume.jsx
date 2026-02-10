import React from "react";

export default function Step2Resume({ handleNext, handleBack }) {
  return (
    <div className="text-center text-[#29445D]">
      <p>Candidate resume selection will appear here.</p>
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="border-2 border-[#29445D] rounded-full px-8 py-2 text-[#29445D]"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="border-2 border-[#29445D] rounded-full px-8 py-2 text-[#29445D] hover:bg-[#29445D] hover:text-[#D1DED3]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
