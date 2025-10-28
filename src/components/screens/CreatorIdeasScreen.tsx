import Layout from '../Layout';
import IdeaVault from '../creator/IdeaVault';

interface CreatorIdeasScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function CreatorIdeasScreen({ navigate }: CreatorIdeasScreenProps) {
  return (
    <Layout navigate={navigate} userRole={'creator'} currentScreen="creatorIdeas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IdeaVault />
      </div>
    </Layout>
  );
}