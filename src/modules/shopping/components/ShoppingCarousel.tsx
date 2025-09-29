"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import Image from "next/image";

import "swiper/css";
import "swiper/css/effect-fade";

interface ShoppingCarouselProps {
  images: string[];
  interval?: number;
}

export default function ShoppingCarousel({
  images,
  interval = 3500,
}: ShoppingCarouselProps) {
  return (
    <Swiper
      modules={[Autoplay, EffectFade]}
      effect="fade"
      loop={true}
      autoplay={{
        delay: interval,
        disableOnInteraction: false,
      }}
      className="w-full h-auto rounded-lg overflow-hidden aspect-square"
    >
      {images.map((src, index) => (
        <SwiperSlide key={index}>
          <Image
            src={src}
            alt={`Shopping item ${index + 1}`}
            width={500}
            height={500}
            className="w-full h-full object-contain"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
