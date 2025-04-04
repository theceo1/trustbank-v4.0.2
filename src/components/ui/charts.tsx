import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

interface BaseChartProps {
  data: any[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
}

interface BarChartProps extends BaseChartProps {
  categories: string[];
}

interface PieChartProps extends BaseChartProps {
  data: Array<{ name: string; value: number }>;
}

const defaultColors = ['#22C55E', '#16A34A', '#15803D', '#166534'];

export function BarChart({
  data,
  categories,
  colors = defaultColors,
  valueFormatter = (value: number) => value.toString(),
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          width={80}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={valueFormatter}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[i % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function PieChart({
  data,
  colors = defaultColors,
  valueFormatter = (value: number) => value.toString(),
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          label={(entry) => entry.name}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={valueFormatter}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
} 