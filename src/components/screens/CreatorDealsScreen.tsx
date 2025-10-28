import Layout from '../Layout';
import DealsCRMBoard from '../creator/DealsCRMBoard';

interface CreatorDealsScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function CreatorDealsScreen({ navigate }: CreatorDealsScreenProps) {
  return (
    <Layout navigate={navigate} userRole={'creator'} currentScreen="creatorDeals">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DealsCRMBoard />
      </div>
    </Layout>
  );
}