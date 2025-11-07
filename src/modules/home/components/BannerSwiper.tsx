"use client";

import { useAuth } from "@/lib/auth/context";
import { bannerSlides } from "@/modules/home/constants";
import { cn } from "@/utils";
import { ChevronLeft, ChevronRight, DoorOpen, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import MagicDoor from "./MagicDoor";

export default function BannerSwiper() {
  const { session, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      <div className="relative mb-8">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation={{
            nextEl: ".banner-swiper-button-next",
            prevEl: ".banner-swiper-button-prev",
          }}
          pagination={{
            clickable: true,
            el: ".banner-swiper-pagination",
          }}
          autoplay={{
            delay: 2000,
            disableOnInteraction: false,
          }}
          loop={true}
          className={cn("banner-swiper h-[250px] md:h-[350px]", {
            "h-[250px]": !session?.user,
          })}
        >
          {bannerSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div
                className={`relative w-full h-full p-1 md:p-1 ${slide.bgColor} overflow-hidden`}
              >
                <div className="absolute inset-0 "></div>
                <div className="relative max-w-6xl mx-auto px-1 sm:px-4 h-full flex md:items-center py-2 sm:py-4 md:py-6">
                  <div className="flex items-center gap-1 md:gap-2 w-full h-full flex-col sm:flex-row justify-center sm:justify-between">
                    {/* Image */}
                    <div className="flex-1 order-1 md:order-2 h-full flex flex-col justify-center sm:max-w-1/2 min-h-[100px]">
                      <div className="relative h-full aspect-16/9 mx-auto rounded-xl overflow-hidden">
                        <Image
                          src={slide.image}
                          alt={slide.title}
                          fill
                          quality={100}
                          className="object-cover sm:object-contain md:object-cover"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="md:flex-1 text-center md:text-left order-2 md:order-1 h-fit flex flex-col sm:justify-center w-full">
                      <h1
                        className={`text-lg sm:text-2xl md:text-4xl font-black ${slide.textColor} drop-shadow-2xl mb-1 md:mb-2`}
                      >
                        {slide.title}
                      </h1>
                      <h2
                        className={`text-sm sm:text-base md:text-base lg:text-2xl ${slide.textColor}/90 font-semibold mb-1 md:mb-2`}
                      >
                        {slide.subtitle}
                      </h2>
                      <p
                        className={`text-xs sm:text-sm md:text-base ${slide.textColor}/80 mb-2 md:mb-6 max-w-2xl mx-auto md:mx-0`}
                      >
                        {slide.description}
                      </p>

                      {!loading && !session?.user && (
                        <div className="mt-2 md:mt-4">
                          <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-white text-primary hover:bg-yellow-100 font-black py-2 px-4 md:py-2 md:px-4 lg:py-4 lg:px-6 rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl hover:shadow-2xl md:hover:shadow-3xl transition-all duration-300 border-2 md:border-4 border-white/50 text-sm md:text-base"
                          >
                            <div className="flex items-center gap-1 md:gap-3">
                              <DoorOpen className="w-4 h-4 md:w-8 md:h-8 text-primary" />
                              <span className="text-primary font-black">
                                Tham gia ngay
                              </span>
                              <Sparkles className="w-4 h-4 md:w-8 md:h-8 text-primary" />
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation buttons for banner swiper */}
        <div className="banner-swiper-button-prev">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div className="banner-swiper-button-next">
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </div>

        {/* Pagination for banner swiper */}
        <div className="banner-swiper-pagination absolute bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2"></div>
      </div>

      <MagicDoor
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </>
  );
}
