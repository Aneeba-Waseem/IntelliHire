import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../ui/carousel";
import { Card, CardContent } from "../../ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClock,
  faUser,
  faFileLines,
} from "@fortawesome/free-regular-svg-icons";

export default function DashboardCarousel({ data }) {
  const formatTime = (time) => {
  if (!time) return "";

  const [hour, minute] = time.split(":");
  const h = parseInt(hour);

  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHour = h % 12 || 12;

  return `${formattedHour}:${minute} ${ampm}`;
};
  return (
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
      }}
      className="rounded-md w-full"
    >
      {/* Header Row */}
      <div className="flex justify-between items-center mb-3 px-1">
        <div className="flex gap-2 ml-auto">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </div>

      {/* Carousel Content */}
      <CarouselContent className="-ml-3">
        {data.map((item) => (
          <CarouselItem
            key={item.id}
            className="pl-3 basis-full md:basis-1/2 lg:basis-3/3 xl:basis-[65%] flex-shrink-0"
          >
            <Card className="h-full rounded-xl bg-[#F2FAF5] border border-[#C6D3CA] shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5 flex flex-col gap-3 text-[#29445D]">
                {/* Header (Logo + Company Info) */}
                <div className="flex items-center gap-3">
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt={`${item.company} logo`}
                      className="w-12 h-12 rounded-full object-contain bg-[#F8F8F8]"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#DDE8E2]">
                      <FontAwesomeIcon icon={faFileLines} className="text-[#29445D]" />
                    </div>
                  )}
                  <div className="flex flex-col leading-tight">
                    <h3 className="font text-2xl tracking-wide">{item.company}</h3>
                    <p className="text-lg text-[#45767C]">{item.role}</p>
                  </div>
                </div>

                <hr className="border-t border-[#719D99] my-2" />

                {/* Schedule Info */}
                {/* Schedule Info */}
                <div className="space-y-2">

                  {/* Candidate */}
                  <div className="flex items-center gap-3 text-[#29445D] text-lg">
                    <FontAwesomeIcon icon={faUser} />
                    <span>{item.Candidate}</span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-3 text-[#29445D] text-lg">
                    <FontAwesomeIcon icon={faCalendarDays} />
                    <span>
                      {new Date(item.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Time + Duration (clean pill style) */}
                  <div className="flex items-center gap-3 text-[#29445D] text-lg">
                    <FontAwesomeIcon icon={faClock} />

                    <span className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-[#DDE8E2] rounded-md text-md font-medium">
                        {formatTime(item.time)}
                      </span>

                      <span className="text-[#45767C] text-md">
                        • {item.duration} min
                      </span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
