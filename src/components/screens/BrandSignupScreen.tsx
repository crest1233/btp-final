import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { post, setToken } from '../../system/api';

interface BrandSignupScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function BrandSignupScreen({ navigate }: BrandSignupScreenProps) {
  const [formData, setFormData] = useState({
    brandName: '',
    email: '',
    password: '',
    category: '',
    region: '',
    website: '',
    budget: [5000],
    teamSize: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  const budgetPresets = [
    { label: 'Startup', value: 5000 },
    { label: 'Growing', value: 15000 },
    { label: 'Established', value: 50000 },
    { label: 'Enterprise', value: 100000 },
  ];

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.brandName || !formData.email || !formData.password || !formData.category || !formData.region) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      // 1) Register user with BRAND role
      const registerRes = await post('/api/auth/register', {
        email: formData.email,
        password: formData.password,
        role: 'BRAND',
      });
      const { token, user } = registerRes || {};
      if (!token || !user) {
        throw new Error('Registration failed');
      }
      setToken(token);

      // 2) Create brand profile for the newly registered user
      const brandRes = await post('/api/brands', {
        companyName: formData.brandName,
        website: formData.website || undefined,
        industry: formData.category || undefined,
        contactEmail: formData.email,
        description: `${formData.region} • Team: ${formData.teamSize || 'N/A'} • Budget: ${inr.format(formData.budget[0])}/mo`,
      });

      const brand = brandRes?.brand || brandRes; // endpoint returns { brand }
      if (!brand || !brand.id) {
        throw new Error('Brand profile creation failed');
      }

      toast.success('Brand account created successfully!');
      navigate('brandDashboard', {
        userRole: 'brand',
        user: { ...user, brand },
        token,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create brand account');
    } finally {
      setSubmitting(false);
    }
  };

  const formatBudget = (value: number) => {
    return inr.format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
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
            <CardTitle>Brand Signup</CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              Create your brand account to start discovering creators
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-gray-900">Basic Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name *</Label>
                  <Input
                    id="brandName"
                    placeholder="Acme Inc."
                    value={formData.brandName}
                    onChange={(e) => updateField('brandName', e.target.value)}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="brand@example.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      required
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
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                  />
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-gray-900">Business Details</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Industry *</Label>
                    <Select value={formData.category} onValueChange={(value: string) => updateField('category', value)}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                        <SelectItem value="beauty">Beauty & Cosmetics</SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="fitness">Health & Fitness</SelectItem>
                        <SelectItem value="travel">Travel & Hospitality</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Primary Region *</Label>
                    <Select value={formData.region} onValueChange={(value: string) => updateField('region', value)}>
                      <SelectTrigger id="region">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="north-america">North America</SelectItem>
                        <SelectItem value="europe">Europe</SelectItem>
                        <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                        <SelectItem value="latin-america">Latin America</SelectItem>
                        <SelectItem value="middle-east">Middle East</SelectItem>
                        <SelectItem value="africa">Africa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Select value={formData.teamSize} onValueChange={(value: string) => updateField('teamSize', value)}>
                    <SelectTrigger id="teamSize">
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Budget Configuration */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-900">Monthly Marketing Budget</h3>
                  <span className="text-purple-600">{formatBudget(formData.budget[0])}</span>
                </div>

                <div className="space-y-4">
                  <Slider
                    value={formData.budget}
                    onValueChange={(value: number[]) => updateField('budget', value)}
                    min={1000}
                    max={200000}
                    step={1000}
                    className="w-full"
                  />

                  <div className="grid grid-cols-4 gap-2">
                    {budgetPresets.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant={formData.budget[0] === preset.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateField('budget', [preset.value])}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500">
                    This helps us recommend creators that fit your budget
                  </p>
                </div>
              </div>

              {/* Summary Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-900">Account Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Brand:</span>
                    <span className="ml-2 text-gray-900">{formData.brandName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Industry:</span>
                    <span className="ml-2 text-gray-900">{formData.category || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Region:</span>
                    <span className="ml-2 text-gray-900">{formData.region || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Budget:</span>
                    <span className="ml-2 text-gray-900">{formatBudget(formData.budget[0])}/mo</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                <Check className="w-4 h-4" />
                {submitting ? 'Creating...' : 'Create Brand Account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('login')}
              className="text-blue-600 hover:text-blue-700"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
