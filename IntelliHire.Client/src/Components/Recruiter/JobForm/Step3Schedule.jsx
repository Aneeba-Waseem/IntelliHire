import React from "react";

export default function Step3Schedule({ handleBack, handleSubmit }) {
  return (
    <div className="text-center text-[#29445D]">
      <p>Schedule interview details will appear here.</p>
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="border-2 border-[#29445D] rounded-full px-8 py-2 text-[#29445D]"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="border-2 border-[#29445D] rounded-full px-8 py-2 bg-[#29445D] text-[#D1DED3]"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
