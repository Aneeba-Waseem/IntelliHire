import React, { useState } from "react";
import Step1JobDesc from "./Step1JobDesc";
import Step2Resume from "./Step2Resume";
import Step3Schedule from "./Step3Schedule";

export default function JobForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    jobRole: "",
    domains: [],
    techStack: [],
    experience: "",
    requirements: "",
  });
  const [errors, setErrors] = useState({});

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Job Data Submitted:", formData);
  };

  return (
    <div className="p-8">
      {/* Progress Steps */}
      <div className="relative flex items-center justify-between mb-10 px-6">
        <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-[#9CBFAC] -translate-y-1/2 z-0"></div>
        <div
          className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
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

      {/* Steps */}
      {step === 1 && (
        <Step1JobDesc
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          handleNext={handleNext}
        />
      )}
      {step === 2 && <Step2Resume handleNext={handleNext} handleBack={handleBack} />}
      {step === 3 && <Step3Schedule handleBack={handleBack} handleSubmit={handleSubmit} />}
    </div>
  );
}
