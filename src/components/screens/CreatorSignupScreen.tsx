import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { post, setToken } from '../../system/api';

interface CreatorSignupScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function CreatorSignupScreen({ navigate }: CreatorSignupScreenProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    followers: '',
    engagement: '',
    niche: '',
    rate: '',
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.niche) {
        toast.error('Please fill all required fields');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.email || !formData.password) {
        toast.error('Email and password are required');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      // Register user with role CREATOR
      const registerRes = await post('/api/auth/register', {
        email: formData.email,
        password: formData.password,
        role: 'CREATOR',
      });
      const token = registerRes?.token;
      if (!token) throw new Error('Registration succeeded but no token returned');
      setToken(token);

      // Create initial creator profile using provided details
      const usernameBase = (formData.email.split('@')[0] || 'creator').replace(/[^a-zA-Z0-9]/g, '');
      const username = usernameBase.length >= 3 ? usernameBase : `${usernameBase}123`;

      await post('/api/creators', {
        username,
        displayName: formData.name,
        instagramHandle: formData.instagram || undefined,
        tiktokHandle: formData.tiktok || undefined,
        youtubeHandle: formData.youtube || undefined,
        categories: formData.niche ? [formData.niche] : undefined,
        basePrice: formData.rate ? Number(formData.rate) : 0,
      });

      toast.success('Account created successfully!');
      navigate('creatorDashboard', { userRole: 'creator' });
    } catch (err: any) {
      const msg = err?.message || 'Failed to create account';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Button
          variant="ghost"
          onClick={() => navigate('roleSelection')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Creator Signup</CardTitle>
              <span className="text-sm text-gray-600">Step {step} of {totalSteps}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-gray-900">Basic Information</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Let's start with your basic details
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Must be at least 6 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="niche">Niche *</Label>
                  <Select value={formData.niche} onValueChange={(value: string) => updateField('niche', value)}>
                    <SelectTrigger id="niche">
                      <SelectValue placeholder="Select your niche" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="beauty">Beauty</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="food">Food & Cooking</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Social Media */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-gray-900">Social Media Profiles</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Connect your social media accounts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram Handle</Label>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-3 bg-gray-100 border border-gray-300 rounded-l-md text-gray-600">
                      @
                    </span>
                    <Input
                      id="instagram"
                      placeholder="username"
                      value={formData.instagram}
                      onChange={(e) => updateField('instagram', e.target.value)}
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok Handle</Label>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-3 bg-gray-100 border border-gray-300 rounded-l-md text-gray-600">
                      @
                    </span>
                    <Input
                      id="tiktok"
                      placeholder="username"
                      value={formData.tiktok}
                      onChange={(e) => updateField('tiktok', e.target.value)}
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube Channel</Label>
                  <Input
                    id="youtube"
                    placeholder="Channel URL or ID"
                    value={formData.youtube}
                    onChange={(e) => updateField('youtube', e.target.value)}
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Tip: Connecting your social accounts helps brands discover you and verify your reach
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Metrics & Pricing */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-gray-900">Metrics & Pricing</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Help brands understand your reach
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followers">Total Followers</Label>
                  <Select value={formData.followers} onValueChange={(value: string) => updateField('followers', value)}>
                    <SelectTrigger id="followers">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1k-10k">1K - 10K</SelectItem>
                      <SelectItem value="10k-50k">10K - 50K</SelectItem>
                      <SelectItem value="50k-100k">50K - 100K</SelectItem>
                      <SelectItem value="100k-500k">100K - 500K</SelectItem>
                      <SelectItem value="500k+">500K+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engagement">Engagement Rate</Label>
                  <Select value={formData.engagement} onValueChange={(value: string) => updateField('engagement', value)}>
                    <SelectTrigger id="engagement">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3%">1% - 3%</SelectItem>
                      <SelectItem value="3-5%">3% - 5%</SelectItem>
                      <SelectItem value="5-8%">5% - 8%</SelectItem>
                      <SelectItem value="8-10%">8% - 10%</SelectItem>
                      <SelectItem value="10%+">10%+</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Average likes + comments / followers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Base Rate per Post</Label>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-3 bg-gray-100 border border-gray-300 rounded-l-md text-gray-600">
                      ₹
                    </span>
                    <Input
                      id="rate"
                      type="number"
                      placeholder="500"
                      value={formData.rate}
                      onChange={(e) => updateField('rate', e.target.value)}
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    This can be adjusted later using our pricing tool
                  </p>
                </div>

                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Upload Media Kit (Optional)</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, up to 10MB</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button onClick={handleNext} className="gap-2">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-2">
                  <Check className="w-4 h-4" />
                  Create Account
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
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
