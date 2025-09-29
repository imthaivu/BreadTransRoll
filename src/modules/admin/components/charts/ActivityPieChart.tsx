"use client";
import { useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ActivityPieChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = ["#FF8042", "#00C49F", "#0088FE"];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent === 0) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ActivityPieChart({ data }: ActivityPieChartProps) {
  const hasData = data.some((item) => item.value > 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[400px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Phân tích hoạt động hôm nay
      </h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value, "Số lượng"]} />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Chưa có hoạt động nào hôm nay.
        </div>
      )}
    </div>
  );
}
