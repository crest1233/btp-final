import Layout from '../Layout';
import MediaKitGenerator from '../creator/MediaKitGenerator';

interface CreatorMediaKitScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function CreatorMediaKitScreen({ navigate }: CreatorMediaKitScreenProps) {
  return (
    <Layout navigate={navigate} userRole={'creator'} currentScreen="creatorMediaKit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MediaKitGenerator />
      </div>
    </Layout>
  );
}