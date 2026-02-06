import React, { useState } from "react";

export default function JobForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    jobRole: "",
    domains: "",
    techStack: "",
    experience: "",
    requirements: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // clear error on typing
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.jobRole.trim())
        newErrors.jobRole = "Job role is required";
      if (!formData.techStack.trim())
        newErrors.techStack = "Tech stack is required";
      if (!formData.experience.trim())
        newErrors.experience = "Experience is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 3) setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep()) {
      console.log("Job Data Submitted:", formData);
    }
  };

  return (
    <div className="p-8">
      {/* Progress Steps */}
      <div className="relative flex items-center justify-between mb-10 px-6">
        {/* base line */}
        <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-[#9CBFAC] -translate-y-1/2 z-0"></div>
        {/* filled line */}
        <div
          className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width:
              step === 1
                ? "0%"
                : step === 2
                ? "50%"
                : "100%",
            backgroundColor: "#29445D",
          }}
        ></div>

        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center z-10">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 ${
                s <= step
                  ? "bg-[#29445D] border-[#29445D]"
                  : "bg-[#9CBFAC] border-[#9CBFAC] text-[#29445D]"
              }`}
            >
              {s}
            </div>
            <p
              className={`mt-2 text-sm sm:text-lg font-bold ${
                s <= step ? "text-[#29445D]" : "text-[#719D99]"
              }`}
            >
              {s === 1
                ? "JOB DESCRIPTION"
                : s === 2
                ? "CANDIDATE RESUMES"
                : "SCHEDULE INTERVIEW"}
            </p>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-[#29445D]">
              * JOB ROLE
            </label>
            <input
              type="text"
              name="jobRole"
              value={formData.jobRole}
              onChange={handleChange}
              className={`w-full p-2 rounded-md border ${
                errors.jobRole ? "border-red-500" : "border-[#9CBFAC]"
              } bg-[#D1DED3] focus:outline-none focus:border-[#45767C]`}
              placeholder="Enter job title"
            />
            {errors.jobRole && (
              <p className="text-red-600 text-sm mt-1">{errors.jobRole}</p>
            )}
          </div>

          <div>
            <label className="block font-bold text-[#29445D]">
              DOMAINS
            </label>
            <input
              type="text"
              name="domains"
              value={formData.domains}
              onChange={handleChange}
              className="w-full p-2 rounded-md bg-[#D1DED3] border border-[#9CBFAC] focus:outline-none focus:border-[#45767C]"
              placeholder="e.g. Web Development, AI, Cloud"
            />
          </div>

          <div>
            <label className="block font-bold text-[#29445D]">
              * TECH STACK
            </label>
            <input
              type="text"
              name="techStack"
              value={formData.techStack}
              onChange={handleChange}
              className={`w-full p-2 rounded-md border ${
                errors.techStack ? "border-red-500" : "border-[#9CBFAC]"
              } bg-[#D1DED3] focus:outline-none focus:border-[#45767C]`}
              placeholder="e.g. React, Node.js, Python"
            />
            {errors.techStack && (
              <p className="text-red-600 text-sm mt-1">{errors.techStack}</p>
            )}
          </div>

          <div>
            <label className="block font-bold text-[#29445D]">
              * EXPERIENCE
            </label>
            <input
              type="text"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className={`w-full p-2 rounded-md border ${
                errors.experience ? "border-red-500" : "border-[#9CBFAC]"
              } bg-[#D1DED3] focus:outline-none focus:border-[#45767C]`}
              placeholder="e.g. 2+ years"
            />
            {errors.experience && (
              <p className="text-red-600 text-sm mt-1">{errors.experience}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-[#29445D]">
              REQUIREMENTS
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              className="w-full p-2 rounded-md bg-[#D1DED3] border border-[#9CBFAC] focus:outline-none focus:border-[#45767C]"
              placeholder="List job requirements"
              rows={3}
            ></textarea>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleNext}
              className="border-2 border-[#29445D] text-[#29445D] rounded-full px-8 py-2 font-semibold hover:bg-[#29445D] hover:text-[#D1DED3] transition"
            >
              NEXT
            </button>
          </div>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
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
      )}

      {/* Step 3 */}
      {step === 3 && (
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
      )}
    </div>
  );
}
