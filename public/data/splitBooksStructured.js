import fs from "fs";
import path from "path";

// Input file
const inputFile = "final_ipa_mean.json";
// Output folder
const outputDir = "books";

// Đọc file gốc
const rawData = fs.readFileSync(inputFile, "utf8");
const items = JSON.parse(rawData);

// Gom nhóm theo book
const booksMap = new Map();
let count = 0;

for (const item of items) {
  const { book, lesson, word, ipa, mean } = item;

  if (!booksMap.has(book)) {
    booksMap.set(book, {
      id: count + 1,
      name: `Book ${book}`,
      totalLessons: 0,
      totalWords: 0,
      lessons: new Map(), // tạm dùng Map để dễ merge
    });

    count++;
  }

  const bookObj = booksMap.get(book);

  if (!bookObj.lessons.has(lesson)) {
    bookObj.lessons.set(lesson, {
      id: lesson,
      words: [],
    });
  }

  bookObj.lessons.get(lesson).words.push({ word, ipa, mean, book, lesson });
}

// Chuyển Map → object và tính tổng
const books = [];
count = 0;
for (const [bookId, bookObj] of booksMap.entries()) {
  const lessonsArr = Array.from(bookObj.lessons.values());
  const totalLessons = lessonsArr.length;
  const totalWords = lessonsArr.reduce((sum, l) => sum + l.words.length, 0);

  const bookJson = {
    id: bookObj.id,
    name: bookObj.name,
    totalLessons,
    totalWords,
    lessons: lessonsArr,
  };

  books.push(bookJson);

  // Ghi từng file book_X.json
  const bookFile = path.join(outputDir, `book_${count + 1}.json`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(bookFile, JSON.stringify(bookJson, null, 2), "utf8");
  count++;
}

// Ghi file books.json (metadata tổng hợp)
const booksMeta = books.map(({ id, name, totalLessons, totalWords }) => ({
  id,
  name,
  totalLessons,
  totalWords,
}));
fs.writeFileSync(
  path.join(outputDir, "books.json"),
  JSON.stringify(booksMeta, null, 2),
  "utf8"
);

console.log("✅ Generated books successfully!");
