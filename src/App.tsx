import { useState } from 'react';
import LandingScreen from './components/screens/LandingScreen';
import RoleSelectionScreen from './components/screens/RoleSelectionScreen';
import LoginScreen from './components/screens/LoginScreen';
import CreatorSignupScreen from './components/screens/CreatorSignupScreen';
import BrandSignupScreen from './components/screens/BrandSignupScreen';
import BrandDashboardScreen from './components/screens/BrandDashboardScreen';
import CreatorSearchScreen from './components/screens/CreatorSearchScreen';
import CampaignManagementScreen from './components/screens/CampaignManagementScreen';
import CreateCampaignScreen from './components/screens/CreateCampaignScreen';
import ShortlistScreen from './components/screens/ShortlistScreen';
import CampaignDetailsScreen from './components/screens/CampaignDetailsScreen';
import CreatorDashboardScreen from './components/screens/CreatorDashboardScreen';
import CreatorProfileScreen from './components/screens/CreatorProfileScreen';
import PricePredictionScreen from './components/screens/PricePredictionScreen';
import AdminDashboardScreen from './components/screens/AdminDashboardScreen';
import UserManagementScreen from './components/screens/UserManagementScreen';
import { Toaster } from './components/ui/sonner';
import BackendStatus from './components/system/BackendStatus';
import CreatorCalendarScreen from './components/screens/CreatorCalendarScreen';
import CreatorApplicationsScreen from './components/screens/CreatorApplicationsScreen';
import CreatorDealsScreen from './components/screens/CreatorDealsScreen';
import CreatorFinanceScreen from './components/screens/CreatorFinanceScreen';
import CreatorIdeasScreen from './components/screens/CreatorIdeasScreen';
import CreatorAnalyticsScreen from './components/screens/CreatorAnalyticsScreen';
import CreatorMediaKitScreen from './components/screens/CreatorMediaKitScreen';

export type UserRole = 'creator' | 'brand' | 'admin' | null;

export interface AppState {
  currentScreen: string;
  userRole: UserRole;
  user: any;
  shortlistedCreators: any[];
  campaigns: any[];
  history: string[];
}

function App() {
  const [appState, setAppState] = useState({
    currentScreen: 'landing',
    userRole: null,
    user: null,
    shortlistedCreators: [],
    campaigns: [],
    history: [],
  } as AppState);

  const navigate = (screen: string, updates?: Partial<AppState>) => {
    setAppState(prev => {
      if (screen === 'back') {
        const prevHistory = prev.history || [];
        const history = [...prevHistory];
        const prevScreen = history.pop();
        const fallback = prev.userRole === 'brand'
          ? 'brandDashboard'
          : prev.userRole === 'creator'
          ? 'creatorDashboard'
          : prev.userRole === 'admin'
          ? 'adminDashboard'
          : 'landing';
        return { ...prev, currentScreen: prevScreen || fallback, history };
      }
      const nextHistory = prev.currentScreen ? [...(prev.history || []), prev.currentScreen] : (prev.history || []);
      return { ...prev, currentScreen: screen, history: nextHistory, ...updates };
    });
  };

  const addToShortlist = (creator: any) => {
    setAppState(prev => ({
      ...prev,
      shortlistedCreators: [...prev.shortlistedCreators, creator],
    }));
  };

  const removeFromShortlist = (creatorId: string) => {
    setAppState(prev => ({
      ...prev,
      shortlistedCreators: prev.shortlistedCreators.filter(c => c.id !== creatorId),
    }));
  };

  const addCampaign = (campaign: any) => {
    setAppState(prev => ({
      ...prev,
      campaigns: [...prev.campaigns, { ...campaign, id: Date.now().toString() }],
    }));
  };

  const renderScreen = () => {
    const { currentScreen, userRole } = appState;

    switch (currentScreen) {
      case 'landing':
        return <LandingScreen navigate={navigate} />;
      case 'roleSelection':
        return <RoleSelectionScreen navigate={navigate} />;
      case 'login':
        return <LoginScreen navigate={navigate} />;
      case 'creatorSignup':
        return <CreatorSignupScreen navigate={navigate} />;
      case 'brandSignup':
        return <BrandSignupScreen navigate={navigate} />;
      case 'brandDashboard':
      return (
        <BrandDashboardScreen
          navigate={navigate}
          appState={appState}
          addToShortlist={addToShortlist}
        />
      );
      case 'creatorSearch':
        return <CreatorSearchScreen navigate={navigate} appState={appState} />;
      case 'campaignManagement':
        return <CampaignManagementScreen navigate={navigate} appState={appState} />;
      case 'createCampaign':
        return <CreateCampaignScreen navigate={navigate} appState={appState} />;
      case 'shortlist':
        return <ShortlistScreen navigate={navigate} appState={appState} />;
      case 'campaignDetails':
        return <CampaignDetailsScreen navigate={navigate} appState={appState} />;
      case 'creatorDashboard':
        return <CreatorDashboardScreen navigate={navigate} appState={appState} />;
      case 'creatorProfile':
        return <CreatorProfileScreen navigate={navigate} appState={appState} />;
      case 'pricePrediction':
        return <PricePredictionScreen navigate={navigate} />;
      case 'creatorCalendar':
        return <CreatorCalendarScreen navigate={navigate} />;
      case 'adminDashboard':
        return <AdminDashboardScreen navigate={navigate} />;
      case 'userManagement':
        return <UserManagementScreen navigate={navigate} />;
      case 'creatorApplications':
        return <CreatorApplicationsScreen navigate={navigate} appState={appState} />;
      case 'creatorDeals':
        return <CreatorDealsScreen navigate={navigate} />;
      case 'creatorFinance':
        return <CreatorFinanceScreen navigate={navigate} />;
      case 'creatorIdeas':
        return <CreatorIdeasScreen navigate={navigate} />;
      case 'creatorAnalytics':
        return <CreatorAnalyticsScreen navigate={navigate} />;
      case 'creatorMediaKit':
        return <CreatorMediaKitScreen navigate={navigate} />;
      default:
        return <LandingScreen navigate={navigate} />;
    }
  };

  return (
    <>
      {renderScreen()}
      <Toaster />
      <BackendStatus />
    </>
  );
}

export default App;
