
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../ui/carousel";

import { Card, CardContent } from "../../ui/card";

const DashboardCarousel = ({ title, icon, data }) => {
  return (
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="bg-[#DDE8E2] w-[85vw] md:w-[65vw] rounded-md p-5"
      >
        <div className="flex flex-row justify-between px-2">
      <h1 className="text-2xl" style={{ fontFamily: "Staatliches, monospace" }}>
        <i className={`text-[#2F4B4A] cursor-pointer transition text-xl sm:text-2xl ${icon} me-2`}></i>{title}</h1>
        <div className="flex flex-row gap-2 justify-end mb-2">
            <CarouselPrevious />
            <CarouselNext />
        </div>
        </div>
        <CarouselContent className="-ml-4">
          {data.map((item) => (
            <CarouselItem
              key={item.id}
              className="
                pl-4
                basis-full
                md:basis-2/3
                lg:basis-[40%]
              "
            >
              <Card className="h-full">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm text-gray-500">{item.company}</p>
                  <p className="font-semibold">{item.role}</p>

                  {item.time && (
                    <>
                      <p className="text-sm">{item.date}</p>
                      <p className="text-sm text-gray-400">{item.time}</p>
                      <p className="text-xs">Interviewer: {item.interviewer}</p>
                    </>
                  )}

                  {!item.time && (
                    <p className="text-sm text-gray-400">{item.date}</p>
                  )}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
  );
};

export default DashboardCarousel;
