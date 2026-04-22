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
      console.log("Fetched user in Profile component:", res.data.user);
    } catch (err) {
      console.error("Failed to load user", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div>
      <img
        src={
          user?.profileImage
            ? `http://localhost:8000/uploads/${user.profileImage}`
            : "..."
        }
        className="w-15 h-15 md:w-15 h-5 md:h-15 rounded-full object-cover cursor-pointer"
        onClick={() =>
          openModal(
            <ProfileModal
              user={user}
              onClose={fetchUser} // 🔥 KEY FIX
            />
          )
        }
      />
    </div>
  );
};

export default Profile;