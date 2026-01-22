import React, { useRef, useState, useEffect } from "react";
import { motion as Motion, useInView } from "motion/react";

const Stats = () => {
  // Years of Experience
  const expRef = useRef(null);
  const isInView = useInView(expRef, { once: true });
  const [exp, setExp] = useState(1);
  useEffect(() => {
    if (!isInView) return;
    let current = 1;
    const interval = setInterval(() => {
      current += 1;
      setExp(current);
      if (current === 4) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [isInView]);

  // Projects
  const proRef = useRef(null);
  const proisInView = useInView(proRef, { once: true });
  const [pro, setPro] = useState(1);
  useEffect(() => {
    if (!proisInView) return;
    let current = 1;
    const interval = setInterval(() => {
      current += 1;
      setPro(current);
      if (current === 80) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [proisInView]);

  // Clients
  const recRef = useRef(null);
  const recisInView = useInView(recRef, { once: true });
  const [rec, setRec] = useState(1);
  useEffect(() => {
    if (!recisInView) return;
    let current = 1;
    const interval = setInterval(() => {
      current += 1;
      setRec(current);
      if (current === 95) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [recisInView]);

  return (
    <div className=" flex justify-evenly md:gap-8 text-center py-10">
      {/* Experience */}
      <div>
        <Motion.h1
          ref={expRef}
          className="text-5xl font-bold text-[#092936]"
        >
          {exp}k+
        </Motion.h1>
        <p className="text-lg font-medium text-[#45767C]">Active Cndidates</p>
      </div>

      {/* Projects */}
      <div>
        <Motion.h1
          ref={proRef}
          className="text-5xl font-bold text-[#092936]"
        >
          {pro}+
        </Motion.h1>
        <p className="text-lg font-medium text-[#45767C]">Companies Hiring</p>
      </div>

      {/* Clients */}
      <div>
        <Motion.h1
          ref={recRef}
          className="text-5xl font-bold text-[#092936]"
        >
          {rec}%
        </Motion.h1>
        <p className="text-lg font-medium text-[#45767C]">Match Accuracy</p>
      </div>
    </div>
  );
};

export default Stats;
