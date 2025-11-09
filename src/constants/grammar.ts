/* eslint-disable @typescript-eslint/no-explicit-any */
// Grammar topics configuration
export interface GrammarExercise {
  exerciseNo: number;
  subNo: number;
  title: string;
  video: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  exercises: GrammarExercise[];
}

export interface GrammarBook {
  id: number;
  name: string;
  imageUrl: string;
  grade: number;
  topics: GrammarTopic[];
}

// Function to fetch grammar data from Google Sheets
export async function fetchGrammarData(): Promise<GrammarTopic[]> {
  const url =
    "https://docs.google.com/spreadsheets/d/1W4HYoAf0MHOEmyOqkfojOEOEH4xJnLMXx74ThPJCpqw/gviz/tq?tqx=out:json&gid=387673851";

  try {
    const res = await fetch(url);
    const text = await res.text();
    // console.log("text", text);
    // gỡ phần header không phải JSON
    const json = JSON.parse(text.substr(47).slice(0, -2));
    // console.log("json", json);

    const headers = json.table.cols.map((c: any) => c.label);
    const rows = json.table.rows.map((r: any) => {
      const values = r.c.map((c: any) => (c ? c.v : ""));
      return Object.fromEntries(
        values.map((v: any, i: number) => [headers[i], v])
      );
    });

    // Group theo TopicID
    const topics: { [key: string]: GrammarTopic } = {};
    rows.forEach((r: any) => {
      if (!r.TopicID) return; // bỏ dòng nếu thiếu TopicID
      if (!topics[r.TopicID]) {
        topics[r.TopicID] = {
          id: r.TopicID,
          title: r.TopicName,
          exercises: [],
        };
      }
      topics[r.TopicID].exercises.push({
        exerciseNo: r.ExerciseNo,
        subNo: r.SubNo,
        title: r.ExerciseTitle,
        video: r.Link,
      });
    });

    return Object.values(topics);
  } catch (error) {
    console.error("Error fetching grammar data:", error);
    return [];
  }
}

// Grammar books data (grades 6-12)
export const GRAMMAR_BOOKS: GrammarBook[] = [
  {
    id: 6,
    name: "Ngữ pháp lớp 6",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/grade-6.jpg",
    grade: 6,
    topics: [],
  },
  {
    id: 7,
    name: "Ngữ pháp lớp 7",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/grade-7.jpg",
    grade: 7,
    topics: [],
  },
  {
    id: 8,
    name: "Ngữ pháp lớp 8",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/grade-8.jpg",
    grade: 8,
    topics: [],
  },
  {
    id: 9,
    name: "Ngữ pháp lớp 9",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/grade-9.jpg",
    grade: 9,
    topics: [],
  },
  {
    id: 10,
    name: "Ngữ pháp lớp 10",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/grade-10.jpg",
    grade: 10,
    topics: [],
  },
  {
    id: 11,
    name: "Ngữ pháp lớp 11",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/grade-11.jpg",
    grade: 11,
    topics: [],
  },
  {
    id: 12,
    name: "Ngữ pháp lớp 12",
    imageUrl: "https://magical-tulumba-581427.netlify.app/img-ui/grade-12.jpg",
    grade: 12,
    topics: [],
  },
];

// Grammar page configuration
export const GRAMMAR_CONFIG = {
  title: "Ngữ pháp tiếng Anh từ lớp 6-12",
  description:
    "Học ngữ pháp tiếng Anh một cách có hệ thống từ cơ bản đến nâng cao. Chọn lớp học phù hợp với trình độ của bạn.",
  features: [
    {
      icon: "📚",
      title: "7 Lớp học",
      description: "Từ lớp 6 đến lớp 12 với nội dung phù hợp",
      color: "blue",
    },
    {
      icon: "🎯",
      title: "Bài tập thực hành",
      description: "Nhiều bài tập đa dạng để củng cố kiến thức",
      color: "green",
    },
    {
      icon: "📹",
      title: "Video hướng dẫn",
      description: "Video giải thích chi tiết từng chủ đề",
      color: "purple",
    },
  ],
};
