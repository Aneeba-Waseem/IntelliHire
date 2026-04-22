import React from "react";
import { NavLink } from "react-router-dom";
import { useModal } from "../../Components/Recruiter/JobForm/ModalContext";
import JobForm from "../../Components/Recruiter/JobForm/JobForm";
import ProfileModal from "../Profile/ProfileModal";
import { useSelector } from "react-redux";
// adjust path to your file


const iconBase =
  "text-[#2F4B4A] cursor-pointer transition text-xl sm:text-2xl";

const SidebarCustom = () => {
  const { openModal } = useModal();
  // const { user } = useSelector((state) => state.auth);
  // console.log("User in SidebarCustom:", user);
  // Handle click for Add button
  const handleAddClick = (e) => {
    e.preventDefault();
    openModal(<JobForm type="engineer" setFormType={() => { }} />);
  };
  const handleProfileClick = (e) => {
    e.preventDefault();

    openModal(
      <ProfileModal
        // user={user}
        onClose={() => { }}
      />
    );
  };
  return (
 <div
  className={`
    mt-10
    mr-2
  fixed sm:absolute z-50

    /* 📱 Mobile (bottom navbar) */
    bottom-0 left-0 w-full
    flex flex-row items-center justify-between
    h-[65px] px-6

    /* 💻 Tablet & Desktop (left sidebar) */
    sm:top-1/2 sm:left-4 sm:-translate-y-1/2
    sm:h-[70vh] sm:w-[80px]
    sm:flex-col sm:justify-start
    sm:gap-15 sm:py-6

    bg-[#DDE8E2]
    sm:rounded-full
    shadow-xl backdrop-blur-md
  `}
>
      <NavItem to="/userDashboard" icon="fa-house" />
      <button
        onClick={handleAddClick}
        className="p-2 sm:p-3 hover:bg-[#F2FAF5] rounded-full transition"
      >
        <i className={`fa-solid fa-circle-plus ${iconBase}`}></i>
      </button>
      <NavItem to="/ScheduledInterview" icon="fa-calendar-check" regular />
      <NavItem to="/CompletedInterview" icon="fa-circle-check" />
      {/* <NavItem to="/profile" icon="fa-user" regular /> */}
      <button
        onClick={handleProfileClick}
        className="p-2 sm:p-3 hover:bg-[#F2FAF5] rounded-full transition"
      >
        <i className="fa-regular fa-user text-[#2F4B4A] text-xl sm:text-2xl" />
      </button>
      {/* Add Button — opens modal */}


      {/* <NavItem to="/settings" icon="fa-gear" /> */}
    </div>
  );
};

const NavItem = ({ to, icon, regular }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      isActive
        ? "bg-[#F2FAF5] p-2 sm:p-3 rounded-full"
        : "p-2 sm:p-3"
    }
  >
    <i
      className={`
        ${regular ? "fa-regular" : "fa-solid"}
        ${icon}
        ${iconBase}
      `}
    ></i>
  </NavLink>
);

export default SidebarCustom;
