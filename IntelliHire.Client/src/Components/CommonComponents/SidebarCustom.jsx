import React from "react";
import { NavLink } from "react-router-dom";

const iconBase =
  "text-[#2F4B4A] cursor-pointer transition text-xl sm:text-2xl";

const SidebarCustom = () => {
  return (
    <div
      className="
        w-[12vw] sm:w-[7vw] md:w-[7vw] lg:w-[6vw] mt-20
        max-h-[350px] sm:max-h-[450px] md:max-h-[450px]
        max-w-[64px]
        min-w-[44px]
        bg-[#DDE8E2]
        rounded-full
        py-4 sm:py-6
        flex flex-col
        items-center
        gap-6 sm:gap-10
        shadow-sm
        mx-[2vw] sm:mx-[1.5vw]
      "   
      >
      <NavItem to="/" icon="fa-house" />
      <NavItem to="/scheduled" icon="fa-calendar-check" regular />
      <NavItem to="/completed" icon="fa-circle-check" />
      <NavItem to="/profile" icon="fa-user" regular />
      <NavItem to="/settings" icon="fa-gear" />
    </div>
  );
};

const NavItem = ({ to, icon, regular }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      isActive
        ? "bg-[#E9F1ED] p-2 sm:p-3 rounded-full"
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