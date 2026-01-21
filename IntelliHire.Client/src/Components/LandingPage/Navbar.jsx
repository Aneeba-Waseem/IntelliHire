import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import logo from "../../assets/landing/logo_final.png";
import { Disclosure } from "@headlessui/react";
import { Link, useLocation } from "react-router-dom";

const navigationItems = [
  { name: "For Candidates", href: "/" },
  { name: "For Recruiters", href: "/experience" },
  { name: "Sign In", href: "/auth" },
];

function Navbar() {
  const location = useLocation();
  const [hoverTab, setHoverTab] = useState(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const navRefs = useRef([]);

  const currentPath = location.pathname;
  const activeTabByPath = navigationItems.find(
    (item) => item.href === currentPath
  )?.name;
  const activeOrHoverTab = hoverTab || activeTabByPath;

  useEffect(() => {
    const index = navigationItems.findIndex(
      (item) => item.name === activeOrHoverTab
    );
    const el = navRefs.current[index];
    if (el) {
      const { offsetLeft, offsetWidth } = el;
      setUnderlineStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeOrHoverTab, location.pathname]);

  return (
    <Disclosure as="nav" className="bg-[#D1DED3] py-4">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex items-center justify-center lg:flex lg:items-center lg:justify-between h-16">
          {/* Logo */}
          <motion.img
            src={logo}
            alt="IntelliHire"
            className="mt-5 w-70 md:w-70 lg:w-64"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          />

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6 bg-[#DDE8E2] px-6 py-2 rounded-2xl">
            {navigationItems.map((item, index) => {
              const isActive = activeTabByPath === item.name;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  ref={(el) => (navRefs.current[index] = el)}
                  onMouseEnter={() => setHoverTab(item.name)}
                  onMouseLeave={() => setHoverTab(null)}
                  className={`px-2 py-1 cursor-pointer font-semibold transition-colors duration-200 ${
                    isActive ? "text-[#29445D]" : "text-[#45767C]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* CTA Button */}
          <motion.button
            whileHover={{
              scale: 1.03,
              boxShadow: "0px 8px 20px rgba(0,0,0,0.15)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="hidden lg:block rounded-3xl w-[180px] text-[#F2FAF5] py-3 font-semibold
                       bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
                       hover:from-[#45767C] hover:via-[#719D99] hover:to-[#9CBFAC]"
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </Disclosure>
  );
}

export default Navbar;
