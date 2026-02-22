import React from "react";
import { motion } from "framer-motion";

export default function SectionTemplate({ 
  heading, 
  paragraph, 
  image, 
  reverse = false, // if true, image goes on left, text on right
  buttonText = "helllo" // pass the button text
}) {
  return (
    <div className={`flex flex-col lg:flex-row items-center my-16 w-full ${reverse ? "lg:flex-row-reverse" : ""}`}>
      
      {/* Image */}
      <motion.div
        className="w-full lg:w-1/2 flex justify-center items-center mb-8 lg:mb-0"
        initial={{ opacity: 0, x: reverse ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <img
          src={image}
          alt={heading}
          className="w-[80%] h-[80%] rounded-xl"
        />
      </motion.div>

      {/* Text */}
      <motion.div
        className="w-full lg:w-1/2 flex flex-col justify-center px-6"
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <h2 className="text-4xl font-bold text-[#29445D] mb-6">{heading}</h2>
        <p className="text-[#45767C] text-lg mb-6">{paragraph}</p>

        {buttonText && (
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0px 8px 20px rgba(0,0,0,0.15)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="hidden lg:block mt-5 rounded-3xl w-[50%] text-[#F2FAF5] py-3 font-semibold
                       bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
                       hover:from-[#45767C] hover:via-[#719D99] hover:to-[#9CBFAC]"
          >
            {buttonText}
          </motion.button>
        )}
      </motion.div>
      
    </div>
  );
}
