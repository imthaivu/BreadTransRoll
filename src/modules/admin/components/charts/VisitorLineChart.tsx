"use client";
import { Button } from "@/components/ui/Button";
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

interface VisitorDataPoint {
  date: string;
  anonymous: number;
  guest: number;
}

interface VisitorLineChartProps {
  data: VisitorDataPoint[];
  range: "week" | "month";
  onRangeChange: (range: "week" | "month") => void;
}

export default function VisitorLineChart({
  data,
  range,
  onRangeChange,
}: VisitorLineChartProps) {
  const hasData = Array.isArray(data) && data.length >= 2 && data.some((d) => (d.anonymous ?? 0) > 0 || (d.guest ?? 0) > 0);

  if (!hasData) {
    return null;
  }
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold">
          Lượt truy cập của khách và người dùng vãng lai
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant={range === "week" ? "primary" : "outline"}
            onClick={() => onRangeChange("week")}
            size="sm"
          >
            Tuần này
          </Button>
          <Button
            variant={range === "month" ? "primary" : "outline"}
            onClick={() => onRangeChange("month")}
            size="sm"
          >
            Tháng này
          </Button>
        </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="anonymous"
            name="Vãng lai (Chưa đăng nhập)"
            stroke="#8884d8"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="guest"
            name="Khách (Đã đăng nhập)"
            stroke="#82ca9d"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
