import React from "react";

export default function InfoCard({
  image,
  width = "w-80",
  height = "h-80",
  bgColor = "white",
}) {
  return (
    <div
      className={`${width} ${height} rounded-lg shadow-lg overflow-hidden flex items-center justify-center`}
      style={{ backgroundColor: bgColor }}
    >
      <img
        src={image}
        alt="Card"
        className="w-[80%] h-[80%] object-cover"
      />
    </div>
  );
}
