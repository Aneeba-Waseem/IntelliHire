import React from 'react';

const Profile = () => {
  return (
    <div className="flex items-center gap-2 md:gap-4">
      {/* Notification icon */}
      <div className="relative cursor-pointer">
        <i className="fa-regular fa-bell text-[#29445D] text-lg md:text-2xl"></i>

        {/* Notification dot */}
        <span className="absolute md:-top-1 md:-right-1 h-1 md:h-2 w-1 md:w-2 rounded-full bg-red-500"></span>
      </div>

      {/* Profile image */}
      <img
        src="/profile.jpg"
        alt="Profile"
        className="w-5 md:w-9 h-5 md:h-9 text-sm rounded-full object-cover cursor-pointer"
      />
    </div>
  );
};

export default Profile;