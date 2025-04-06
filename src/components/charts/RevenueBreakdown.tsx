import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const COLORS = {
  tier1: "#22C55E",    // Bright green
  tier2: "#3B82F6",    // Bright blue
  tier3: "#F59E0B",    // Bright orange
  tier4: "#8B5CF6",    // Bright purple
  tier5: "#EC4899",    // Bright pink
  quidax: "#EF4444"    // Bright red
};

interface RevenueBreakdownProps {
  data: {
    totalRevenue: number;
    quidaxFees: number;
    netRevenue: number;
    feeBreakdown: {
      tier1: number;
      tier2: number;
      tier3: number;
      tier4: number;
      tier5: number;
    };
  };
}

export function RevenueBreakdown({ data }: RevenueBreakdownProps) {
  const chartData = [
    {
      name: "Revenue",
      Basic: data.feeBreakdown.tier1,
      Starter: data.feeBreakdown.tier2,
      Intermediate: data.feeBreakdown.tier3,
      Advanced: data.feeBreakdown.tier4,
      Premium: data.feeBreakdown.tier5,
      "Quidax Fees": data.quidaxFees
    }
  ];

  const hasData = data.totalRevenue > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-6">
            <BarChart width={500} height={300} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`NGN ${value.toLocaleString()}`, "Amount"]} />
              <Legend />
              <Bar dataKey="Basic" fill={COLORS.tier1} stackId="a" />
              <Bar dataKey="Starter" fill={COLORS.tier2} stackId="a" />
              <Bar dataKey="Intermediate" fill={COLORS.tier3} stackId="a" />
              <Bar dataKey="Advanced" fill={COLORS.tier4} stackId="a" />
              <Bar dataKey="Premium" fill={COLORS.tier5} stackId="a" />
              <Bar dataKey="Quidax Fees" fill={COLORS.quidax} stackId="a" />
            </BarChart>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Revenue</span>
                <span>NGN {data.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Quidax Fees</span>
                <span>NGN {data.quidaxFees.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Net Revenue</span>
                <span>NGN {data.netRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">No revenue data available</div>
        )}
      </CardContent>
    </Card>
  );
} 