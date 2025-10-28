import Layout from '../Layout';
import FinanceHub from '../creator/FinanceHub';

interface CreatorFinanceScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function CreatorFinanceScreen({ navigate }: CreatorFinanceScreenProps) {
  return (
    <Layout navigate={navigate} userRole={'creator'} currentScreen="creatorFinance">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FinanceHub />
      </div>
    </Layout>
  );
}