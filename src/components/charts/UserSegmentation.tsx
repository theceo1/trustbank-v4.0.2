import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = {
  tier1: "#22C55E",    // Bright green
  tier2: "#3B82F6",    // Bright blue
  tier3: "#F59E0B",    // Bright orange
  tier4: "#8B5CF6",    // Bright purple
  tier5: "#EC4899"     // Bright pink
};

interface UserSegmentationProps {
  data: {
    tier1: number;
    tier2: number;
    tier3: number;
    tier4: number;
    tier5: number;
  };
}

export function UserSegmentation({ data }: UserSegmentationProps) {
  const chartData = [
    { name: "Basic", value: data.tier1, color: COLORS.tier1 },
    { name: "Starter", value: data.tier2, color: COLORS.tier2 },
    { name: "Intermediate", value: data.tier3, color: COLORS.tier3 },
    { name: "Advanced", value: data.tier4, color: COLORS.tier4 },
    { name: "Premium", value: data.tier5, color: COLORS.tier5 }
  ].filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Segmentation by KYC Level</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center">
        {total > 0 ? (
          <div className="w-full max-w-xs">
            <PieChart width={300} height={300}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} users`, 'Count']}
              />
              <Legend />
            </PieChart>
            <div className="mt-4 space-y-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span>{item.value} users</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">No user data available</div>
        )}
      </CardContent>
    </Card>
  );
} 