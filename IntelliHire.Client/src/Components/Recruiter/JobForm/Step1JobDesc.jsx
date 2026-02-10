import React, { useState, useEffect } from "react";
import MultiSelectField from "./MultiSelectField.jsx";
import { fetchDomains, fetchTechStacks, saveJobDescription } from "../../../api/JobApi.js";

export default function Step1JobDesc({ formData, setFormData, errors, setErrors, handleNext }) {
  const [domainsOptions, setDomainsOptions] = useState([]);
  const [techOptions, setTechOptions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      const domains = await fetchDomains();
      const techs = await fetchTechStacks();
      setDomainsOptions(domains);
      setTechOptions(techs);
    };
    fetchOptions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.jobRole.trim()) newErrors.jobRole = "Job role is required";
    if (!formData.domains.length) newErrors.domains = "Domains are required";
    if (!formData.techStack.length) newErrors.techStack = "Tech stack is required";
    if (!formData.experience.trim()) newErrors.experience = "Experience is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
  if (!validate()) return;

  // Prepare payload for backend
  const payload = {
    jobRole: formData.jobRole,
    experience: formData.experience,
    requirements: formData.requirements || "",
    domains: formData.domains,      // array of strings
    techStack: formData.techStack,  // array of strings
    // FK_Users is handled in backend for now (hardcoded)
  };

  console.log("📤 Sending to backend:", payload);

  try {
    await saveJobDescription(payload);
    console.log("✅ Job description saved successfully");
    handleNext();
  } catch (err) {
    console.error("❌ Error saving job description:", err);
  }
};


  return (
    <form className="space-y-4">
      <div>
        <label className="block font-bold text-[#29445D]">* JOB ROLE</label>
        <input
          type="text"
          name="jobRole"
          value={formData.jobRole}
          onChange={handleChange}
          className={`w-full p-2 rounded-md border ${errors.jobRole ? "border-red-500" : "border-[#9CBFAC]"} bg-[#D1DED3] focus:outline-none focus:border-[#45767C]`}
          placeholder="Enter job title"
        />
        {errors.jobRole && <p className="text-red-600 text-sm mt-1">{errors.jobRole}</p>}
      </div>

      <MultiSelectField
        label="DOMAINS"
        options={domainsOptions}
        value={formData.domains}
        setValue={(val) => setFormData({ ...formData, domains: val })}
        error={errors.domains}
      />

      <MultiSelectField
        label="TECH STACK"
        options={techOptions}
        value={formData.techStack}
        setValue={(val) => setFormData({ ...formData, techStack: val })}
        error={errors.techStack}
      />

      <div>
        <label className="block font-bold text-[#29445D]">* EXPERIENCE</label>
        <select
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          className={`w-full p-2 rounded-md border ${errors.experience ? "border-red-500" : "border-[#9CBFAC]"} bg-[#D1DED3] focus:outline-none focus:border-[#45767C]`}
        >
          <option value="">Select experience</option>
          <option value="0-1">0-1 years</option>
          <option value="1-3">1-3 years</option>
          <option value="3+">3+ years</option>
        </select>
        {errors.experience && <p className="text-red-600 text-sm mt-1">{errors.experience}</p>}
      </div>

      <div>
        <label className="block font-semibold text-[#29445D]">REQUIREMENTS</label>
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
          onClick={nextStep}
          className="border-2 border-[#29445D] text-[#29445D] rounded-full px-8 py-2 font-semibold hover:bg-[#29445D] hover:text-[#D1DED3] transition"
        >
          NEXT
        </button>
      </div>
    </form>
  );
}