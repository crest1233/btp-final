import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Users, Briefcase, ArrowRight, Star, TrendingUp, Zap } from 'lucide-react';

interface RoleSelectionScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function RoleSelectionScreen({ navigate }: RoleSelectionScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg" />
            <span className="text-gray-900">Inverso</span>
          </div>
          <h1 className="text-gray-900 mb-4">Choose Your Role</h1>
          <p className="text-gray-600">
            Select how you want to use Inverso to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Creator Card */}
          <Card className="border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer group">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-gray-900 mb-3">I'm a Creator</h2>
              <p className="text-gray-600 mb-6">
                Showcase your talent, connect with brands, and monetize your content
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>Get discovered by premium brands</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>AI-powered pricing insights</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>Manage campaigns effortlessly</span>
                </div>
              </div>

              <Button
                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                size="lg"
                onClick={() => navigate('creatorSignup')}
              >
                Continue as Creator
                <ArrowRight className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>

          {/* Brand Card */}
          <Card className="border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-gray-900 mb-3">I'm a Brand</h2>
              <p className="text-gray-600 mb-6">
                Find perfect creators, launch campaigns, and track performance
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Advanced creator discovery</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Campaign analytics & insights</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Verified creator profiles</span>
                </div>
              </div>

              <Button
                className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                size="lg"
                onClick={() => navigate('brandSignup')}
              >
                Continue as Brand
                <ArrowRight className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('login')}
              className="text-purple-600 hover:text-purple-700"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
