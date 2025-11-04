"use client";

import PageMotion, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/PageMotion";
import { SHOPPING_CATEGORIES } from "@/modules/shopping";
import ShoppingCarousel from "@/modules/shopping/components/ShoppingCarousel";
import Image from "next/image";

export default function ShoppingPage() {
  return (
    <PageMotion showLoading={false}>
      <div className="bg-white">
        <StaggerContainer>
          <StaggerItem>
           
            <div className="text-center">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
               Nobita đi Shopping
              </h1>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SHOPPING_CATEGORIES.map((category) => (
                <div
                  key={category.title}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-100 flex flex-col"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {category.title}
                  </h3>
                  <div className="mb-3">
                    <ShoppingCarousel
                      images={category.images}
                      interval={category.interval}
                    />
                  </div>
                  <h4 className="text-lg font-bold text-blue-600 mt-auto text-right">
                    Từ {category.price}
                    <span className="inline-block ml-1">
                      <Image
                        src="https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
                        alt="Dorayaki"
                        width={24}
                        height={24}
                        className="align-middle"
                      />
                    </span>
                  </h4>
                </div>
              ))}
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-6 bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <h4 className="text-xl font-semibold text-gray-800 mb-3">
                Cứ lựa đi Thầy có Shopee Pay
              </h4>
              <a
                href="https://shopee.vn/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="https://magical-tulumba-581427.netlify.app/img-ui/muaKhac.jpg"
                  alt="Shopee"
                  width={1200}
                  height={400}
                  className="w-full h-auto rounded-lg"
                />
              </a>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageMotion>
  );
}
