import React from "react";
import InfoCard from "./InfoCard";
import report1 from "../../assets/landing/landingpage_dummyReport1.png";
import report2 from "../../assets/landing/landingpage_dummyReport2.png";

export default function CardStack() {
  return (
    <div className="relative w-[450px] h-[350px] lg:w-[450px] lg:h-[350px] md:w-[350px] md:h-[250px] sm:w-[250px] sm:h-[180px]">
      
      {/* Bottom card */}
      <div className="absolute top-0 xl:left-0 xl:z-10 -lg:left-30 lg:z-10 lg:left-[-35px] lg:bottom-50 -lg:z-300 ">
        <InfoCard
          image={report1}
          width="xl:w-[280px] lg:w-[180px] md:w-[20px] sm:w-[2px]"
          height="xl:h-[170px] lg:h-[120px] md:h-[13px] sm:h-[1px]"
          bgColor="#3A4E51"
        />
      </div>

      {/* Top card overlapping from corner */}
      <div className="absolute xl:left-25 xl:bottom-30 xl:z-20 lg:left-[25px]  lg:bottom-50 lg:z-[300] ">
        <InfoCard
          image={report2}
          width="xl:w-[180px] lg:w-[120px] md:w-[140px] sm:w-[2px]"
          height="xl:h-[270px] lg:h-[180px] md:h-[200px] sm:h-[2px]"
          bgColor="#45767C"
        />
      </div>
    </div>
  );
}
