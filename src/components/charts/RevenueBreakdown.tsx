import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const COLORS = {
  basic: "#22C55E",     // Bright green
  verified: "#3B82F6",  // Bright blue
  premium: "#F59E0B",   // Bright orange
  quidax: "#EF4444"     // Bright red
};

interface RevenueBreakdownProps {
  data: {
    totalRevenue: number;
    quidaxFees: number;
    netRevenue: number;
    feeBreakdown: {
      basic: number;
      verified: number;
      premium: number;
    };
  };
}

export function RevenueBreakdown({ data }: RevenueBreakdownProps) {
  const chartData = [
    {
      name: "Revenue",
      Basic: data.feeBreakdown.basic,
      Verified: data.feeBreakdown.verified,
      Premium: data.feeBreakdown.premium,
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
              <Bar dataKey="Basic" fill={COLORS.basic} stackId="a" />
              <Bar dataKey="Verified" fill={COLORS.verified} stackId="a" />
              <Bar dataKey="Premium" fill={COLORS.premium} stackId="a" />
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