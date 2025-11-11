import * as React from 'react';
import { Button } from './ui/button';
import { Home, Search, Briefcase, Users, Star, BarChart3, LogOut, User, PlusCircle, ArrowLeft, Calendar, DollarSign, Lightbulb, Award, Menu } from 'lucide-react';
import { APP_VERSION, APP_NAME } from '../version';

interface LayoutProps {
  children: any;
  navigate: (screen: string, updates?: any) => void;
  userRole: 'creator' | 'brand' | 'admin' | null;
  currentScreen?: string;
}

export default function Layout({ children, navigate, userRole, currentScreen }: LayoutProps) {
  const getNavItems = () => {
    if (userRole === 'brand') {
      return [
        { icon: Home, label: 'Dashboard', screen: 'brandDashboard' },
        { icon: Search, label: 'Discover', screen: 'creatorSearch' },
        { icon: Briefcase, label: 'Campaigns', screen: 'campaignManagement' },
        { icon: Star, label: 'Shortlist', screen: 'shortlist' },
      ];
    } else if (userRole === 'creator') {
      return [
        { icon: Home, label: 'Dashboard', screen: 'creatorDashboard' },
        { icon: Calendar, label: 'Calendar', screen: 'creatorCalendar' },
        { icon: Briefcase, label: 'Deals CRM', screen: 'creatorDeals' },
        { icon: DollarSign, label: 'Finance Hub', screen: 'creatorFinance' },
        { icon: Lightbulb, label: 'Idea Vault', screen: 'creatorIdeas' },
        { icon: BarChart3, label: 'Analytics', screen: 'creatorAnalytics' },
        { icon: Award, label: 'Media Kit', screen: 'creatorMediaKit' },
        { icon: User, label: 'Profile', screen: 'creatorProfile' },
        { icon: BarChart3, label: 'Pricing Tool', screen: 'pricePrediction' },
      ];
    } else if (userRole === 'admin') {
      return [
        { icon: Home, label: 'Dashboard', screen: 'adminDashboard' },
        { icon: Users, label: 'Users', screen: 'userManagement' },
      ];
    }
    return [];
  };

  const handleLogout = () => {
    navigate('landing', { userRole: null, user: null });
  };

  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('back')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg" />
              <span className="font-semibold text-gray-900">Inverso</span>
            </div>
            
            {/* Sidebar toggle on desktop */}
            {userRole && (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-0 w-7 h-7 min-w-0"
                  aria-label={sidebarOpen ? 'Hide menu' : 'Show menu'}
                >
                  <Menu className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Mobile hamburger toggle */}
            {userRole && (
              <div className="md:hidden flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(v => !v)}
                  className="p-0 w-8 h-8 min-w-0"
                  aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            )}

            {userRole && (
              <div className="hidden md:flex items-center gap-2">
                {userRole === 'brand' && (
                  <Button onClick={() => navigate('createCampaign')} className="gap-2 hidden md:inline-flex">
                    <PlusCircle className="w-4 h-4" />
                    New Campaign
                  </Button>
                )}
                <Button variant="ghost" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {userRole && mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          {/* Mobile Header Actions for Brand Users */}
          {userRole === 'brand' && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-700">Quick Actions</h2>
                <Button 
                  onClick={() => navigate('createCampaign')} 
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Campaign
                </Button>
              </div>
            </div>
          )}
          
          {/* Mobile Navigation Tabs */}
          <nav className="px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
            {getNavItems().map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.screen;
              return (
                <Button
                  key={item.screen}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => { setMobileOpen(false); navigate(item.screen); }}
                  className={`gap-2 whitespace-nowrap flex-shrink-0 ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
            
            {/* Mobile Logout Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => { setMobileOpen(false); handleLogout(); }} 
              className="gap-2 whitespace-nowrap flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </nav>
        </div>
      )}

      {/* Content */}
      {userRole ? (
        <>
          {/* Mobile content without sidebar */}
          <div className="md:hidden min-h-[calc(100vh-4rem)]">{children}</div>
          {/* Desktop sidebar + content */}
          <div className="hidden md:flex min-h-[calc(100vh-4rem)]">
            <aside className={`bg-white border-r border-gray-200 ${sidebarOpen ? 'w-56' : 'w-16'} transition-all`}>
              <div className="p-2">
                {getNavItems().map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.screen;
                  return (
                    <Button
                      key={item.screen}
                      variant={isActive ? 'secondary' : 'ghost'}
                      onClick={() => navigate(item.screen)}
                      className={`w-full justify-start gap-2 ${sidebarOpen ? '' : 'px-2'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </Button>
                  );
                })}
                <div className="mt-4">
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout} 
                    className={`w-full justify-start gap-2 ${sidebarOpen ? '' : 'px-2'}`}
                  >
                    <LogOut className="w-4 h-4" />
                    {sidebarOpen && <span>Logout</span>}
                  </Button>
                </div>
              </div>
            </aside>
            <main className="flex-1">{children}</main>
          </div>
        </>
      ) : (
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg" />
              <span className="text-gray-900">{APP_NAME}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500">v{APP_VERSION}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-purple-600 transition-colors">About</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Support</a>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 {APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
