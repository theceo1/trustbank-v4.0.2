import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

// Default empty dataset
const defaultData = {
  labels: [],
  datasets: [{
    label: 'No Data',
    data: [],
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    borderColor: 'rgba(75, 192, 192, 1)',
  }]
};

interface LineChartProps {
  data?: ChartData<'line'>;
  options?: ChartOptions<'line'>;
}

interface BarChartProps {
  data?: ChartData<'bar'>;
  options?: ChartOptions<'bar'>;
}

export function LineChart({ data = defaultData, options = {} }: LineChartProps) {
  // Ensure data and datasets exist
  const safeData = {
    labels: data?.labels || [],
    datasets: data?.datasets || defaultData.datasets
  };

  return (
    <div style={{ height: '300px' }}>
      <Line data={safeData} options={{ ...commonOptions, ...options }} />
    </div>
  );
}

export function BarChart({ data = defaultData, options = {} }: BarChartProps) {
  // Ensure data and datasets exist
  const safeData = {
    labels: data?.labels || [],
    datasets: data?.datasets || defaultData.datasets
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar data={safeData} options={{ ...commonOptions, ...options }} />
    </div>
  );
} 