// Lessons1000 books configuration
export interface Lessons1000Book {
  id: number;
  name: string;
  imageUrl: string;
  totalLessons: number;
  audioFiles: string[];
}

// Audio files configuration for each Lessons1000 book
const audioFiles1000: { [key: number]: string[] } = {};

for (let book = 1; book <= 12; book++) {
  // chọn domain theo số bread
  const domain =
    book <= 10
      ? "https://dainty-swan-7f415b.netlify.app"
      : "https://magical-tulumba-581427.netlify.app";

  audioFiles1000[book] = Array.from(
    { length: 80 },
    (_, i) => `${domain}/bread${book}/${String(i + 1).padStart(3, "0")}.mp3`
  );
}

// Lessons1000 books data
export const LESSONS_1000_BOOKS: Lessons1000Book[] = [
  {
    id: 5,
    name: "Quyển 1",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-1.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[1],
  },
  {
    id: 6,
    name: "Quyển 2",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-1.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[2],
  },
  {
    id: 7,
    name: "Quyển 3",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-1.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[3],
  },
  {
    id: 8,
    name: "Quyển 4",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-1.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[4],
  },
  {
    id: 9,
    name: "Quyển 5",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-1.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[5],
  },
  {
    id: 10,
    name: "Quyển 6",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-1.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[6],
  },
  {
    id: 11,
    name: "Quyển 7",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-1.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[7],
  },
  {
    id: 12,
    name: "Quyển 8",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-1.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[8],
  },
  {
    id: 13,
    name: "Quyển 9",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-1.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[9],
  },
  {
    id: 14,
    name: "Quyển 10",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-1.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[10],
  },
  {
    id: 15,
    name: "Quyển 11",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-11.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[11],
  },
  {
    id: 16,
    name: "Quyển 12",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/nobita-12.png",
    totalLessons: 80,
    audioFiles: audioFiles1000[12],
  },
];

// Audio player configuration for Lessons1000
export const LESSONS_1000_AUDIO_CONFIG = {
  defaultSpeed: 1,
  speeds: [0.75, 1, 1.25, 1.5],
  speedIcons: {
    0.75: "🐢",
    1: "🐇",
    1.25: "🚀",
    1.5: "⚡",
  },
};

// Lessons1000 page configuration
export const LESSONS_1000_CONFIG = {
  title: "1000 Bài luyện nghe nói tiếng Anh",
  description:
    "Chọn sách và bài học để bắt đầu luyện nghe. 1000 Bài luyện là hệ thống học tiếng Anh toàn diện, giúp bạn phát triển kỹ năng nghe và nói từ cơ bản đến nâng cao.",
  features: [
    {
      icon: "📚",
      title: "1000 Bài học",
      description: "Hệ thống bài học đa dạng từ cơ bản đến nâng cao",
      color: "blue",
    },
    {
      icon: "🎯",
      title: "Luyện tập có mục tiêu",
      description: "Mỗi bài học đều có mục tiêu rõ ràng và cụ thể",
      color: "green",
    },
    {
      icon: "🏆",
      title: "Theo dõi tiến độ",
      description: "Theo dõi quá trình học tập và đánh giá kết quả",
      color: "purple",
    },
  ],
};

export const LESSONS_1000_AUDIO_SETTINGS_CONFIG = {
  voices: [
    { id: "male-us", name: "Giọng Nam (US)" },
    { id: "female-uk", name: "Giọng Nữ (UK)" },
    { id: "child-us", name: "Giọng Trẻ em (US)" },
  ],
  backgroundSounds: [
    { id: "none", name: "Không có" },
    {
      id: "rain",
      name: "Tiếng mưa",
      url: "https://cdn.pixabay.com/audio/2022/10/21/audio_182103909c.mp3",
    },
    {
      id: "cafe",
      name: "Quán cafe",
      url: "https://cdn.pixabay.com/audio/2022/08/03/audio_5029e712a8.mp3",
    },
    {
      id: "ocean",
      name: "Sóng biển",
      url: "https://cdn.pixabay.com/audio/2023/09/23/audio_7556a1b2f1.mp3",
    },
  ],
};
