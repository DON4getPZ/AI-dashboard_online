import Dashboard from '../components/Dashboard';
import ForecastChart from '../components/ForecastChart';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard />
      <div className="max-w-7xl mx-auto px-8 py-8">
        <ForecastChart />
      </div>
    </div>
  );
}
