import React, { useState } from "react";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Search Bar */}
      <div className="hidden sm:flex w-[35vw] md:w-[50vw] bg-[#DDE8E2] h-9 rounded-full items-center px-3">
        <i className="fa fa-search text-[#29445D] mx-3"></i>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full bg-transparent focus:outline-none text-[#29445D]"
        />
      </div>

      {/* Mobile Icon */}
      <button
        className="sm:hidden w-9 h-9 bg-[#DDE8E2] rounded-full flex items-center justify-center"
        onClick={() => setIsOpen(true)}
      >
        <i className="fa fa-search text-[#29445D]"></i>
      </button>

      {/* Mobile Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-20">
          <div className="bg-[#DDE8E2] w-[90%] rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <i className="fa fa-search text-[#29445D]"></i>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full focus:outline-none text-[#29445D]"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-500"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBar;