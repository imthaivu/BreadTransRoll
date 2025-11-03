"use client";

import { LESSONS_1000_BOOKS, Lessons1000Book } from "@/constants/lessons1000";
import { cn } from "@/utils";
import { motion } from "framer-motion";
import Image from "next/image";

interface BookSelectorProps {
  onBookSelect: (book: Lessons1000Book) => void;
  selectedBook: Lessons1000Book | null;
  className?: string;
}

export default function BookSelector({
  onBookSelect,
  selectedBook,
  className = "",
}: BookSelectorProps) {
  return (
    <div className={`${className}`}>
      

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {LESSONS_1000_BOOKS.map((book) => (
          <motion.div
            className="relative cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            key={book.id}
            onClick={() => onBookSelect(book)}
          >
            {/* Book cover */}
            <div className="relative overflow-hidden aspect-1/1 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
              <Image
                src={book.imageUrl}
                alt={book.name}
                fill
                quality={100}
                className="object-cover"
              />

              {/* Selected indicator */}
              {selectedBook?.id === book.id && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                  ✓
                </div>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>

            {/* Book info */}
            <div className="mt-3">
              <h3
                className={cn(
                  "text-sm md:text-base text-center font-semibold text-gray-800 mb-1 line-clamp-2",
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
