"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DailyDataPoint {
  date: string;
  count: number;
}

interface ActivityLineChartProps {
  speakingData: DailyDataPoint[];
  userData: DailyDataPoint[];
  listeningData: DailyDataPoint[];
  quizData: DailyDataPoint[];
}

export default function ActivityLineChart({
  speakingData,
  userData,
  listeningData,
  quizData,
}: ActivityLineChartProps) {
  // We need to merge the data so that all lines are plotted on the same axes
  const mergedData = speakingData.map((speakPoint, index) => ({
    date: speakPoint.date,
    "Bài nộp Speaking": speakPoint.count,
    "Người dùng mới": userData[index]?.count ?? 0,
    "Lượt nghe": listeningData[index]?.count ?? 0,
    "Kết quả Quiz": quizData[index]?.count ?? 0,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[400px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Hoạt động 7 ngày qua
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={mergedData}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="Bài nộp Speaking"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
          <Line type="monotone" dataKey="Người dùng mới" stroke="#82ca9d" />
          <Line type="monotone" dataKey="Lượt nghe" stroke="#ffc658" />
          <Line type="monotone" dataKey="Kết quả Quiz" stroke="#ff8042" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
