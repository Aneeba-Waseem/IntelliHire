import React, { useEffect, useState } from "react";
import ProfileAvatar from "./ProfileAvatar";
import { updateProfile } from "../../api/profileApi";
import { Pencil } from "lucide-react";
import { useDispatch } from "react-redux";
import { getCurrentUser } from "../../api/profileApi";
import toast from "react-hot-toast";
/* ✅ Field moved OUTSIDE (fixes 1-letter typing issue) */
const Field = ({
  label,
  name,
  value,
  editField,
  handleChange,
  toggleEdit,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm text-[#29445D] font-medium">
      {label}
    </label>

    <div className="flex items-center gap-2">
      {editField === name ? (
        <input
          name={name}
          value={value}
          onChange={handleChange}
          autoFocus
          className="w-full px-3 py-2 rounded-lg bg-[#D1DED3] border border-[#29445D] outline-none"
        />
      ) : (
        <div className="w-full px-3 py-2 rounded-lg bg-[#F2FAF5] text-[#29445D]">
          {value || "Not set"}
        </div>
      )}

      <button
        type="button"
        onClick={() => toggleEdit(name)}
        className="p-2 rounded-lg hover:bg-[#D1DED3] transition"
      >
        <Pencil size={16} className="text-[#29445D]" />
      </button>
    </div>
  </div>
);

export default function ProfileForm({ onClose }) {

  const [user, setUser] = useState(null);
  console.log("User in ProfileForm:", user);
  const [form, setForm] = useState({
  firstName: "",
  lastName: "",
  company: "",
  companyURL: "",
  jobRole: "",
  phone: "",
});
  useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await getCurrentUser();
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to load user", err);
    }
  };

  fetchUser();
}, []);

useEffect(() => {
  if (user) {
    setForm({
      firstName: user?.fullName?.split(" ")[0] || "",
      lastName: user?.fullName?.split(" ")[1] || "",
      company: user?.company || "",
      companyURL: user?.CompanyURL || "",
      jobRole: user?.jobRole || "",
      phone: user?.phone || "",
    });
  }
}, [user]);
  const dispatch = useDispatch();

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editField, setEditField] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleEdit = (field) => {
    setEditField(field === editField ? null : field);
  };

const handleSave = async () => {
  try {
    setLoading(true);

    const formData = new FormData();

    formData.append(
      "fullName",
      `${form.firstName} ${form.lastName}`
    );

    Object.keys(form).forEach((key) => {
      if (key !== "firstName" && key !== "lastName") {
        formData.append(key, form[key]);
      }
    });

    if (image) {
      formData.append("profileImage", image);
    }

    await updateProfile(formData);

    // ✅ IMPORTANT: fetch fresh user from DB
    const res = await getCurrentUser();

    dispatch({
      type: "auth/setUser",
      payload: res.data.user,
    });
    setEditField(null);
   toast.success("Profile updated successfully");

    onClose();

  } catch (err) {
    console.error(err);
    toast.error("Failed to update profile");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="space-y-6">
      {/* AVATAR */}
      <ProfileAvatar
        image={image}
        setImage={setImage}
        existingImage={user?.profileImage}
      />

      {/* NAME */}
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="First Name"
          name="firstName"
          value={form.firstName}
          editField={editField}
          handleChange={handleChange}
          toggleEdit={toggleEdit}
        />

        <Field
          label="Last Name"
          name="lastName"
          value={form.lastName}
          editField={editField}
          handleChange={handleChange}
          toggleEdit={toggleEdit}
        />
      </div>

      {/* OTHER FIELDS */}
      <Field
        label="Company"
        name="company"
        value={form.company}
        editField={editField}
        handleChange={handleChange}
        toggleEdit={toggleEdit}
      />

      <Field
        label="Company Website"
        name="companyURL"
        value={form.companyURL}
        editField={editField}
        handleChange={handleChange}
        toggleEdit={toggleEdit}
      />

      <Field
        label="Your Role"
        name="jobRole"
        value={form.jobRole}
        editField={editField}
        handleChange={handleChange}
        toggleEdit={toggleEdit}
      />

      <Field
        label="Phone Number"
        name="phone"
        value={form.phone}
        editField={editField}
        handleChange={handleChange}
        toggleEdit={toggleEdit}
      />

      {/* SAVE BUTTON */}
      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="w-full py-3 rounded-lg text-white font-semibold
        bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
        hover:from-[#45767C] hover:to-[#9CBFAC]"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}