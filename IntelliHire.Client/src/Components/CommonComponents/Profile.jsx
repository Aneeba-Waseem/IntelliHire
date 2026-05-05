import React, { useEffect, useState } from "react";
import { useModal } from "../../Components/Recruiter/JobForm/ModalContext";
import ProfileModal from "../Profile/ProfileModal";
import { getCurrentUser } from "../../api/profileApi";

const Profile = () => {
  const { openModal } = useModal();
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await getCurrentUser();
      setUser(res.data.user);
      console.log("Fetched user:", res.data.user);
    } catch (err) {
      console.error("Failed to load user", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // 🔥 Get initials from full name
  const getInitials = (name = "") => {
    const parts = name.trim().split(" ");
    const first = parts[0]?.[0] || "";
    const last = parts[1]?.[0] || "";
    return (first + last).toUpperCase();
  };

  const imageUrl = user?.profileImage
    ? `https://intellihire-production.up.railway.app/uploads/${user.profileImage}`
    : null;

  return (
    <div>
      {imageUrl ? (
        <img
          src={imageUrl}
          className="w-15 h-15 md:w-15 md:h-15 rounded-full object-cover cursor-pointer"
          onClick={() =>
            openModal(
              <ProfileModal user={user} onClose={fetchUser} />
            )
          }
        />
      ) : (
        <div
          onClick={() =>
            openModal(
              <ProfileModal user={user} onClose={fetchUser} />
            )
          }
          className="w-15 h-15 md:w-15 md:h-15 rounded-full bg-[#29445D] text-[#F2FAF5] flex items-center justify-center cursor-pointer font-semibold"
        >
          {getInitials(user?.fullName)}
        </div>
      )}
    </div>
  );
};

export default Profile;