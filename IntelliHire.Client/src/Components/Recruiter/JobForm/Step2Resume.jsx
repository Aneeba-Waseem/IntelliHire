import React, { useEffect, useState } from "react";
import { getStep1Cache, getStep2BatchId, saveStep2BatchId } from "../../../api/JobApi";
import { uploadResumes, getBatchStatus, startMatchingAPI, updateShortlistAPI } from "../../../api/resume_api";

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



  //select files and upload to backend, then start polling for status every 2 seconds until parsed/matched results are ready. 
  // Also handle auto-selecting shortlisted candidates based on backend matching results.
  const handleFileChange = (e) => {
    console.log("getting file of resume");
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    uploadAndParse(selectedFiles);
  };

  //parse resumes and start polling for status
  const uploadAndParse = async (selectedFiles) => {
    setError(null);
    setIsUploading(true);
    setIsParsing(true);

    try {
      // 1️⃣ Get existing batch if present
      let currentBatchId = batchId;

      if (!currentBatchId) {
        const saved = await getStep2BatchId();
        currentBatchId = saved?.batchId;
      }

      // 2️⃣ Upload (reuse batch if exists)
      const data = await uploadResumes(selectedFiles, jdText, currentBatchId);

      if (data.status !== "processing") {
        throw new Error("Upload failed");
      }

      // 3️⃣ Save batch only once
      if (data.batch_id && data.batch_id !== batchId) {
        setBatchId(data.batch_id);
        await saveStep2BatchId(data.batch_id);
      }

      // 4️⃣ Start polling
      startPolling(data.batch_id);

    } catch (err) {
      setError(err.message);
      setIsParsing(false);
    } finally {
      setIsUploading(false);
    }
  };


  // Polling function to check resume parsing/matching status
  const startPolling = (batchId) => {
    const interval = setInterval(async () => {
      try {
        const data = await getBatchStatus(batchId);

        if (data.status === "parsed" && data.profiles) {
          // setProfiles(data.profiles);
          setProfiles(prev => mergeProfiles(prev, data.profiles));
          setIsParsing(false);
        }

        if (data.status === "matched" && data.profiles) {
          clearInterval(interval);
          setProfiles(data.profiles);
          autoSelectShortlisted(data.profiles);
          setIsParsing(false);
        }

      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  //get JD from Step1 cache on mount to send to resume parsing API and for reference when selecting resumes
  useEffect(() => {
    const loadJD = async () => {
      try {
        const step1 = await getStep1Cache();
        const jd = `
        Role: ${step1.jobRole}
        Experience: ${step1.experience}
        Domains: ${(step1.domains || []).join(", ")}
        Tech Stack: ${(step1.techStack || []).join(", ")}
        Requirements: ${step1.requirements || ""}
              `.trim();

        setJdText(jd);
      } catch (err) {
        console.error("Failed to load JD", err);
      }
    };

    loadJD();
  }, []);



  const mergeProfiles = (oldList, newList) => {
    const map = new Map(oldList.map(p => [p.resume_id, p]));
    newList.forEach(p => map.set(p.resume_id, p));
    return Array.from(map.values());
  };

  useEffect(() => {
    const restoreStep2 = async () => {
      const res = await getStep2BatchId();
      const batchId = res.batchId || res.batch_id;

      if (!batchId) return;

      setBatchId(batchId);

      const data = await getBatchStatus(batchId);

      if (data.profiles) {
        setProfiles(data.profiles);   // first load → replace
        if (data.status === "matched") {
          autoSelectShortlisted(data.profiles);
        }
      }
    };

    restoreStep2();
  }, []);




  //once resume got parsed . match it with JD and get matching score. This is for on-demand matching in case recruiter wants to adjust JD 
  // and re-match without re-uploading resumes.
  const startMatching = async () => {
    if (!batchId) return setError("Upload resumes first");

    setIsParsing(true);

    const data = await startMatchingAPI(batchId, jdText);

    if (data.status === "matching") {
      startPolling(batchId);
    }
  };

  const autoSelectShortlisted = (profiles) => {
    const defaults = new Set();
    profiles.forEach(p => {
      if (p.matching?.is_shortlisted) defaults.add(p.resume_id);
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
const handleShortlistChange = async (resumeId, checked) => {
  setSelectedIds(prev => {
    const copy = new Set(prev);
    if (checked) copy.add(resumeId);
    else copy.delete(resumeId);
    return copy;
  });

  await updateShortlistAPI(batchId, resumeId, checked);
};



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

      {isParsing && (
        <div className="mb-4 text-blue-600 font-semibold">Processing resumes... Please wait.</div>
      )}
{profiles.map(p => {
  const isChecked =
    selectedIds.has(p.resume_id) || p.matching?.is_shortlisted;

  return (
    <div
      key={p.resume_id}
      className={`flex items-center justify-between mt-5 p-4 mb-3 rounded-lg border transition hover:shadow-sm
        ${
          isChecked
            ? "bg-[#E6F2EC] border-[#29445D]"
            : "bg-white border-gray-300"
        }
      `}
    >
      {/* Left: Checkbox + Info */}
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          className="w-5 h-5 cursor-pointer accent-[#29445D]"
          checked={isChecked}
          onChange={(e) =>
            handleShortlistChange(p.resume_id, e.target.checked)
          }
        />

        <div className="flex flex-col">
          <span className="font-semibold text-lg text-[#29445D]">
            {p.parsed_resume?.name || "Unknown Candidate"}
          </span>
          <span className="text-sm text-gray-500">
            {p.parsed_resume?.qualification || ""}
          </span>
        </div>
      </div>

      {/* Right: Score */}
      <div className="text-right">
        <span className="text-sm text-gray-500">Match Score</span>
        <div className="text-lg font-bold text-[#29445D]">
          {p.matching?.score ?? "-"}
        </div>
      </div>
    </div>
  );
})}


      {profiles.length > 0 && (
        <div className="w-full flex justify-end mt-4">
          <button
            style={{ cursor: isParsing ? "not-allowed" : "pointer" }}
            onClick={startMatching}
            disabled={isParsing}
            className="border-2 border-[#29445D] rounded-full px-8 py-2 text-[#29445D] hover:bg-[#29445D] hover:text-[#D1DED3]"
          >
            Filter Candidates
          </button>
        </div>
      )}



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
    </div>

  );
}