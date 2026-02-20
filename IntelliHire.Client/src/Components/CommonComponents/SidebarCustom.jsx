import React from "react";
import { NavLink } from "react-router-dom";
import { useModal } from "../../Components/Recruiter/JobForm/ModalContext";
import JobForm from "../../Components/Recruiter/JobForm/JobForm";
 // adjust path to your file

const iconBase =
  "text-[#2F4B4A] cursor-pointer transition text-xl sm:text-2xl";

const SidebarCustom = () => {
  const { openModal } = useModal();

  // Handle click for Add button
  const handleAddClick = (e) => {
    e.preventDefault();
    openModal(<JobForm type="engineer" setFormType={() => {}} />);
  };

  return (
    <div
      className={`
        bg-[#DDE8E2]
        md:rounded-full mt-15 mb-50
        shadow-2xl
        flex
        items-center
        gap-6 sm:gap-15
        py-4 sm:py-6
        w-full md:w-[8vw] lg:w-[5vw]
        sm:max-h-[650px]
        min-w-[44px]
        mx-auto sm:mx-[1.5vw]
        fixed bottom-0 left-0 sm:static
        flex-row sm:flex-col
        justify-center sm:justify-start
        z-50
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
      <NavItem to="/completed" icon="fa-circle-check" />
      <NavItem to="/profile" icon="fa-user" regular />

      {/* Add Button — opens modal */}
     

      <NavItem to="/settings" icon="fa-gear" />
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
