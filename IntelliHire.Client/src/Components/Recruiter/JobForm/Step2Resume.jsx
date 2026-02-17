import React, { useState } from "react";

export default function Step2Resume({ handleNext, handleBack }) {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className=" text-[#29445D] max-w-lg mx-auto">

      <div className="flex flex-col justify-center items-center">
      <h2 className="text-xl font-bold mb-4">Select Candidate Resumes</h2>

      {/* File Upload Button */}
      <div className="mb-6">
        <label className="cursor-pointer inline-block bg-[#29445D] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#45767C] transition">
          Choose Resumes
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx"
          />
        </label>
      </div>

      </div>
      
      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Selected Files:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-[#D1DED3] p-2 rounded-md"
              >
                <span className="truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 font-bold px-2 py-1 rounded hover:bg-red-100 transition"
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="border-2 border-[#29445D] rounded-full px-8 py-2 text-[#29445D]"
        >
          Back
        </button>
        <button
          onClick={() => handleNext(files)}
          className="border-2 border-[#29445D] rounded-full px-8 py-2 text-[#29445D] hover:bg-[#29445D] hover:text-[#D1DED3]"
        >
          Next
        </button>
      </div>
    </div>
  );
}