import React, { createContext, useContext, useState } from "react";
const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);

  const openModal = (component) => {
    setContent(component);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setContent(null);
  };

  return (
    <ModalContext.Provider value={{ isOpen, content, openModal, closeModal }}>
      {children}

      {isOpen && (
        <div
          className="
            fixed inset-0 
            bg-[#D1DED3]/15 backdrop-blur-[2px]
            flex justify-center items-center 
            z-50
            transition-all duration-300
            animate-fadeInOverlay
          "
        >
          <div
            className="
              bg-[#DDE8E2] border-2 border-[#9CBFAC]
              rounded-2xl p-8 
              w-[90vw] md:w-[70vw] lg:w-[60vw]
              relative shadow-xl
              animate-slideUp
            "
          >
            <button
              onClick={closeModal}
              className="
                absolute top-3 right-4 
                text-[#29445D] hover:text-[#45767C]  active:scale-90
                text-xl font-bold
                cursor-pointer transition-transform 
                hover:border border-[#45767C] rounded-xl p-3 hover:bg-[#29445D] hover:text-[#D1DED3]
              "
              title="Close"
            >
              ✕
            </button>
            {content}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
