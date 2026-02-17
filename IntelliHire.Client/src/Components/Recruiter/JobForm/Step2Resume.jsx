import React, { useEffect, useState } from "react";

export default function Step2Resume({ handleNext, handleBack }) {
  const [jdText, setJdText] = useState(""); // JD input

  const [files, setFiles] = useState([]);

  const [batchId, setBatchId] = useState(null);          // store backend batch id
  const [pollingInterval, setPollingInterval] = useState(null); // to clear polling
  const [isParsing, setIsParsing] = useState(false);    // parsing loader
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());


  const handleFileChange = (e) => {
    console.log("getting file of resume");
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    uploadAndParse(selectedFiles); // then start async upload
  };


  const uploadAndParse = async (selectedFiles) => {
    setError(null);
    setIsUploading(true);
    setIsParsing(true);

    const form = new FormData();
    selectedFiles.forEach(f => form.append("files", f));
    form.append("jd_text", jdText || "");

    try {
      const res = await fetch("http://localhost:8001/api/resumes/upload", { method: "POST", body: form });
      const data = await res.json();

      if (data.status === "processing" && data.batch_id) {
        setBatchId(data.batch_id);
        startPolling(data.batch_id);
      } else if (data.status === "ok" && data.profiles) {
        setProfiles(data.profiles);
        autoSelectShortlisted(data.profiles);
        setIsParsing(false);
      } else {
        throw new Error("Unexpected server response");
      }
    } catch (err) {
      setError(err.message || "Upload failed");
      setIsParsing(false);
    } finally {
      setIsUploading(false);
    }
  };
  const startPolling = (batchId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8001/api/resumes/status/${batchId}`);
        const data = await res.json();
        if (data.status === "parsed" && data.profiles) {
          clearInterval(interval);
          setPollingInterval(null);
          setProfiles(data.profiles);
          autoSelectShortlisted(data.profiles);
          setIsParsing(false);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000); // poll every 2 sec

    setPollingInterval(interval);
  };

  const autoSelectShortlisted = (profiles) => {
    const defaults = new Set();
    profiles.forEach(p => {
      if (p.is_shortlisted) defaults.add(p.resume_id);
    });
    setSelectedIds(defaults);
  };


  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);


  return (
    <div className=" text-[#29445D] w-full mx-auto ">

      <div className="flex flex-col justify-center items-center">
        <h2 className="text-xl font-bold mb-4">Select Candidate Resumes</h2>

        {/* File Upload Button */}
        <label
          htmlFor="resumeUpload"
          className="cursor-pointer inline-block bg-[#29445D] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#45767C] transition"
        >
          Choose Resumes
        </label>

        <input
          id="resumeUpload"
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx"
        />


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
      {/* Navigation Buttons */}
      <div className="flex justify-between items-center w-full mt-8">
        <button
          style={{ cursor: "pointer" }}
          onClick={handleBack}
          className="border-2 border-[#29445D] rounded-full px-8 py-2 text-[#29445D] hover:bg-[#29445D] hover:text-[#D1DED3]"
        >
          Back
        </button>
        <button
          style={{ cursor: "pointer" }}
          onClick={() => handleNext(files)}
          className="border-2 border-[#29445D] rounded-full px-8 py-2 text-[#29445D] hover:bg-[#29445D] hover:text-[#D1DED3]"
        >
          Next
        </button>


      </div>
      {isParsing && (
        <div className="mb-4 text-blue-600 font-semibold">Processing resumes... Please wait.</div>
      )}

      <button
        style={{ cursor: isParsing ? "not-allowed" : "pointer" }}
        onClick={() => handleNext(files)}
        disabled={isParsing}
        className="border-2 border-[#29445D] rounded-full px-8 py-2 text-[#29445D] hover:bg-[#29445D] hover:text-[#D1DED3]"
      >
        Filter Cndidates
      </button>


      {/* <button disabled={isParsing || profiles.length === 0}>Next</button> */}

    </div>
  );
}