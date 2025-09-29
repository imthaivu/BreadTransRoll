// Streamline books configuration
export interface StreamlineBook {
  id: number;
  name: string;
  imageUrl: string;
  totalLessons: number;
  missingLessons: number[];
  audioFiles: string[];
}

// Audio files configuration for each Streamline book
const audioFilesST = {
  1: Array.from({ length: 80 }, (_, i) => i + 1)
    // .filter((i) => ![3, 20, 40, 53, 60, 68, 70, 76, 78, 80].includes(i))
    .map(
      (i) =>
        `https://magical-tulumba-581427.netlify.app/streamline/streamline1/${String(
          i
        ).padStart(2, "0")}.mp3`
    ),

  2: Array.from({ length: 80 }, (_, i) => i + 1)
    // .filter((i) => ![8, 24, 45, 53, 59, 67, 72, 78, 80].includes(i))
    .map(
      (i) =>
        `https://magical-tulumba-581427.netlify.app/streamline/streamline2/${String(
          i
        ).padStart(2, "0")}.mp3`
    ),

  3: Array.from({ length: 80 }, (_, i) => i + 1)
    // .filter(
    //   (i) =>
    //     ![
    //       6, 8, 14, 26, 30, 33, 41, 48, 49, 50, 55, 58, 61, 64, 66, 68, 69, 70,
    //       73, 79,
    //     ].includes(i)
    // )
    .map(
      (i) =>
        `https://magical-tulumba-581427.netlify.app/streamline/streamline3/${String(
          i
        ).padStart(2, "0")}.mp3`
    ),

  4: Array.from({ length: 60 }, (_, i) => i + 1)
    // .filter(
    //   (i) =>
    //     ![
    //       5, 8, 9, 12, 14, 18, 23, 27, 29, 30, 32, 35, 37, 38, 41, 43, 44, 46,
    //       48, 51, 53, 56, 60,
    //     ].includes(i)
    // )
    .map(
      (i) =>
        `https://magical-tulumba-581427.netlify.app/streamline/streamline4/${String(
          i
        ).padStart(2, "0")}.mp3`
    ),
};

// Streamline books data
export const STREAMLINE_BOOKS: StreamlineBook[] = [
  {
    id: 1,
    name: "Streamline 1",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/st1.jpg",
    totalLessons: 80,
    missingLessons: [3, 20, 40, 53, 60, 68, 70, 76, 78, 80],
    audioFiles: audioFilesST[1],
  },
  {
    id: 2,
    name: "Streamline 2",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/st2.jpg",
    totalLessons: 80,
    missingLessons: [8, 24, 45, 53, 59, 67, 72, 78, 80],
    audioFiles: audioFilesST[2],
  },
  {
    id: 3,
    name: "Streamline 3",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/st3.png",
    totalLessons: 80,
    missingLessons: [
      6, 8, 14, 26, 30, 33, 41, 48, 49, 50, 55, 58, 61, 64, 66, 68, 69, 70, 73,
      79,
    ],
    audioFiles: audioFilesST[3],
  },
  {
    id: 4,
    name: "Streamline 4",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/st4.png",
    totalLessons: 60,
    missingLessons: [
      5, 8, 9, 12, 14, 18, 23, 27, 29, 30, 32, 35, 37, 38, 41, 43, 44, 46, 48,
      51, 53, 56, 60,
    ],
    audioFiles: audioFilesST[4],
  },
];

// Audio player configuration
export const AUDIO_PLAYER_CONFIG = {
  defaultSpeed: 1,
  speeds: [0.75, 1],
  speedIcons: {
    0.75: "🐢",
    1: "🐇",
  },
};

// Streamline page configuration
export const STREAMLINE_CONFIG = {
  title: "Luyện nghe nói tiếng Anh",
  description:
    "Chọn sách và bài học để bắt đầu luyện nghe. Streamline English là một phương pháp học tiếng Anh hiệu quả, giúp bạn cải thiện kỹ năng nghe và nói một cách tự nhiên.",
  features: [
    {
      icon: "🎧",
      title: "Luyện nghe",
      description: "Nghe và hiểu tiếng Anh một cách tự nhiên",
      color: "blue",
    },
    {
      icon: "🗣️",
      title: "Luyện nói",
      description: "Phát âm chuẩn và tự tin giao tiếp",
      color: "green",
    },
    {
      icon: "📚",
      title: "Từ vựng",
      description: "Học từ vựng qua ngữ cảnh thực tế",
      color: "purple",
    },
  ],
};

export const AUDIO_SETTINGS_CONFIG = {
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
