import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart as RechartsBarChart, Bar } from 'recharts';

interface ChartProps {
  data: any[];
  xField: string;
  yField: string;
  height?: number;
}

export function LineChart({ data, xField, yField, height = 400 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xField} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={yField} stroke="#8884d8" />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export function BarChart({ data, xField, yField, height = 400 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xField} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={yField} fill="#8884d8" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
} 