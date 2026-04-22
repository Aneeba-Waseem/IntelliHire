import React from "react";
import ProfileForm from "./ProfileForm";

export default function ProfileModal({ user, onClose }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#29445D] mb-4">
        Complete Your Profile
      </h2>

      <p className="text-sm text-[#45767C] mb-6">
        Add your recruiter details to continue.
      </p>

      <ProfileForm  onClose={onClose} />
    </div>
  );
}