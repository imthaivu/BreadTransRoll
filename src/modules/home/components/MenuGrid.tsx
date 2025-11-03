"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { menuItems } from "../constants";

const menuItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

export default function MenuGrid() {
  const router = useRouter();

  const handleMenuClick = (path: string) => {
    router.push(path);
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      {menuItems.map((item, index) => (
        <motion.div
          key={item.id}
          variants={menuItemVariants}
          initial="initial"
          animate="animate"
          custom={index}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:bg-gray-50 transition-all duration-300 cursor-pointer flex flex-col items-center text-center pb-2"
          onClick={() => handleMenuClick(item.path)}
        >
          <div className="relative w-full aspect-16/9 mb-2 rounded-xl overflow-hidden">
            <Image
              src={item.image}
              alt={item.alt}
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-1">
            {item.title}
          </h3>
          <p className="text-xs text-gray-600 leading-tight">
            {item.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
