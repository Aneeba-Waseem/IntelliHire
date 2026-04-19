import React, { useEffect, useState } from "react";
import { getStep2BatchId } from "../../../api/JobApi";
import { getBatchStatus } from "../../../api/resume_api";
import { scheduleInterviewsAPI } from "../../../api/interviewSchedule";
import toast from "react-hot-toast";
import { useModal } from "./ModalContext";

export default function Step3Schedule({ handleBack, handleSubmit }) {
  const [candidates, setCandidates] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [isSending, setIsSending] = useState(false);
  const { closeModal } = useModal();

  useEffect(() => {
    const loadShortlisted = async () => {
      try {
        const res = await getStep2BatchId();
        const batchId = res.batchId || res.batch_id;
        if (!batchId) return;

        const data = await getBatchStatus(batchId);

        if (data.profiles) {
          const shortlisted = data.profiles.filter(
            (p) => p.matching?.is_shortlisted
          );
          setCandidates(shortlisted);
        }
      } catch (err) {
        console.error("Failed to load shortlisted candidates", err);
      }
    };

    loadShortlisted();
  }, []);

  const handleChange = (resumeId, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [resumeId]: {
        ...prev[resumeId],
        [field]: value,
      },
    }));
  };

  const submitSchedule = async () => {
    try {
      setIsSending(true);

      const res = await getStep2BatchId();
      const batchId = res.batchId || res.batch_id;

      const interviews = candidates
        .map((c) => ({
          resume_id: c.resume_id,
          name: c.parsed_resume?.name || "Candidate",
          email: c.parsed_resume?.contact_info?.email || "",
          date: schedule[c.resume_id]?.date || "",
          time: schedule[c.resume_id]?.time || "",
        }))
        .filter((x) => x.email && x.date && x.time);

      if (interviews.length === 0) {
        toast.error("Please select date & time for candidates");
        setIsSending(false);
        return;
      }

      await scheduleInterviewsAPI(batchId, interviews);

      toast.success(`Emails sent to ${interviews.length} candidate(s)`);
      handleSubmit(interviews);
      closeModal();
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send interview emails");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="text-[#29445D] w-full p-6 ">
      <h2 className="text-2xl font-bold text-center mb-6 text-[#29445D]">
        Schedule Interviews
      </h2>

      {candidates.length === 0 && (
        <p className="text-center text-[#45767C]">No shortlisted candidates</p>
      )}

      <div className="grid gap-4">
        {candidates.map((c) => (
          <div
            key={c.resume_id}
            className="border border-[#719D99] p-5 rounded-xl bg-[#E6F2EC] hover:shadow-md transition-shadow"
          >
            <div className="font-semibold text-lg text-[#29445D]">
              {c.parsed_resume?.name || "Unknown"}
            </div>
            <div className="text-md text-[#29445D] mb-3">
              Score: {c.matching?.score ? (c.matching.score * 100).toFixed(2) : "-"}%
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1 text-[#29445D]">
                  Select Date
                </label>
                <input
                  type="date"
                  className="w-full border border-[#719D99] p-2 rounded-lg focus:ring-2 focus:ring-[#45767C] bg-[#F2FAF5]  text-[#29445D]"
                  value={schedule[c.resume_id]?.date || ""}
                  onChange={(e) => handleChange(c.resume_id, "date", e.target.value)}
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1 text-[#29445D]">
                  Select Time
                </label>
                <input
                  type="time"
                  className="w-full border border-[#719D99] p-2 rounded-lg focus:ring-2 focus:ring-[#45767C] bg-[#F2FAF5] text-[#29445D]"
                  value={schedule[c.resume_id]?.time || ""}
                  onChange={(e) => handleChange(c.resume_id, "time", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          style={{ cursor: "pointer" }}
          onClick={handleBack}
          className="border-2 border-[#29445D] rounded-full px-8 py-2 text-[#29445D] hover:bg-[#29445D] hover:text-[#D1DED3]"
        >
          Back
        </button>

        <button
          onClick={submitSchedule}
          style={{cursor: "pointer"}}
          disabled={isSending}
          className={`rounded-full px-8 py-2 font-medium border-2 border-[#29445D] transition-all duration-200 ${
            isSending
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-[#29445D] text-[#D1DED3] hover:bg-[#1f3447]"
          }`}
        >
          {isSending ? "Sending Emails..." : "Submit"}
        </button>
      </div>
    </div>
  );
}