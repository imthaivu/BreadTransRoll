"use client";

import { STREAMLINE_BOOKS, StreamlineBook } from "@/constants/streamline";
import { cn } from "@/utils";
import { motion } from "framer-motion";
import Image from "next/image";

interface BookSelectorProps {
  onBookSelect: (book: StreamlineBook) => void;
  selectedBook: StreamlineBook | null;
  className?: string;
}

export default function BookSelector({
  onBookSelect,
  selectedBook,
  className = "",
}: BookSelectorProps) {
  return (
    <div className={`${className}`}>
      

      <div className="flex justify-center gap-4 mt-1">
        {STREAMLINE_BOOKS.map((book) => (
          <motion.div
            className="relative cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            key={book.id}
            onClick={() => onBookSelect(book)}
          >
            {/* Book cover */}
            <div className="relative overflow-hidden w-full">
              <Image
                src={book.imageUrl}
                alt={book.name}
                width={160}
                height={213}
                quality={100}
                className="object-contain"
              />

              {/* Selected indicator */}
              {selectedBook?.id === book.id && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                  ✓
                </div>
              )}
            </div>

            {/* Book info */}
            <div>
              <h3
                className={cn(
                  "text-xs md:text-base text-center font-semibold text-gray-800 mb-2 mt-2",
                  {
                    "text-primary": selectedBook?.id === book.id,
                  }
                )}
              >
                {book.name}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
