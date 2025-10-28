import Layout from '../Layout';
import AnalyticsDashboard from '../creator/AnalyticsDashboard';

interface CreatorAnalyticsScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function CreatorAnalyticsScreen({ navigate }: CreatorAnalyticsScreenProps) {
  return (
    <Layout navigate={navigate} userRole={'creator'} currentScreen="creatorAnalytics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard />
      </div>
    </Layout>
  );
}