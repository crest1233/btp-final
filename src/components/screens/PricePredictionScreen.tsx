import { useState, useEffect } from 'react';
import Layout from '../Layout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { TrendingUp, DollarSign, Users, BarChart3, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { toast } from 'sonner';
import { get } from '../../system/api';

interface PricePredictionScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function PricePredictionScreen({ navigate }: PricePredictionScreenProps) {
  const [followers, setFollowers] = useState([10000]);
  const [engagement, setEngagement] = useState([5]);
  const [platform, setPlatform] = useState('instagram');
  const [niche, setNiche] = useState('fashion');
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [priceRange, setPriceRange] = useState(null);

  const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  useEffect(() => {
    // Optionally fetch baseline data
    (async () => {
      try {
        await get('/api/metrics');
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const calculatePrice = () => {
    const base = followers[0] * (engagement[0] / 100) * 0.05;
    const platformMultiplier = platform === 'instagram' ? 1 : platform === 'tiktok' ? 1.2 : 1.1;
    const nicheMultiplier = niche === 'tech' ? 1.3 : niche === 'beauty' ? 1.2 : 1.0;
    const MULTIPLIER = 7; // increase predicted pricing as requested
    const price = Math.round(base * platformMultiplier * nicheMultiplier * MULTIPLIER);
    setPredictedPrice(price as any);
    setPriceRange({ low: Math.round(price * 0.8), recommended: price, high: Math.round(price * 1.4) } as any);
    toast.success('Pricing calculated');
  };

  return (
    <Layout navigate={navigate} userRole={null} currentScreen="pricePrediction">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Pricing Tool</h1>
          <p className="text-gray-600">Estimate fair pricing for your posts based on reach and engagement</p>
        </div>

        {/* Inputs */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Followers</Label>
                  <Slider value={followers} onValueChange={setFollowers} min={1000} max={1000000} step={1000} />
                  <p className="text-xs text-gray-600 mt-1">{followers[0].toLocaleString()}</p>
                </div>
                <div>
                  <Label>Engagement (%)</Label>
                  <Slider value={engagement} onValueChange={setEngagement} min={1} max={20} step={0.5} />
                  <p className="text-xs text-gray-600 mt-1">{engagement[0].toFixed(1)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Niche</Label>
                  <Select value={niche} onValueChange={setNiche}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="beauty">Beauty</SelectItem>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="food">Food & Cooking</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={calculatePrice} className="w-full gap-2">
                <BarChart3 className="w-4 h-4" />
                Calculate Pricing
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Followers</p>
                    <p className="text-gray-900">{followers[0].toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Engagement</p>
                    <p className="text-gray-900">{engagement[0].toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="text-sm text-gray-900 mb-2">Pro Tip</h4>
                <p className="text-xs text-gray-600">
                  Higher engagement rates can command premium pricing. Focus on building an engaged community!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results */}
        {predictedPrice && priceRange && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                Recommended Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Minimum</p>
                  <p className="text-gray-900">{inr.format((priceRange as any).low)}</p>
                  <p className="text-xs text-gray-500 mt-2">Conservative estimate</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-lg">
                  <p className="text-sm text-purple-100 mb-2">Recommended</p>
                  <p className="text-white">{inr.format((priceRange as any).recommended)}</p>
                  <p className="text-xs text-purple-100 mt-2">Based on your metrics</p>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Premium</p>
                  <p className="text-gray-900">{inr.format((priceRange as any).high)}</p>
                  <p className="text-xs text-gray-500 mt-2">For exclusive deals</p>
                </div>
              </div>

              {/* Trend Insights */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Market Insights</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p>
                      {niche.charAt(0).toUpperCase() + niche.slice(1)} creators with {engagement[0]}% engagement typically charge 
                      {inr.format(Math.round((predictedPrice as any) * 0.9))} - {inr.format(Math.round((predictedPrice as any) * 1.1))} per post
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p>
                      Your engagement rate is {engagement[0] >= 5 ? 'above' : 'below'} the industry average of 5%
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p>
                      Consider offering package deals (3+ posts) at a 10-15% discount for better brand retention
                    </p>
                  </div>
                </div>
              </div>

              {/* Save to Profile CTA */}
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1">
                  Save to Profile
                </Button>
                <Button className="flex-1" onClick={() => navigate('creatorProfile')}>
                  Update Profile Rate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pricing Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm text-gray-900 mb-2">What increases your rate:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>High engagement rate (5%+)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Niche expertise (Tech, Beauty)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Video content (Reels, TikTok)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Usage rights & exclusivity</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm text-gray-900 mb-2">Common pricing mistakes:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Undervaluing your engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Not factoring in production time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Same price for all content types</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Ignoring usage rights value</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
