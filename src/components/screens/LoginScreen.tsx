import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { post, setToken } from '../../system/api';

interface LoginScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

export default function LoginScreen({ navigate }: LoginScreenProps) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.email || !formData.password) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      const { token, user } = res || {};
      if (!token || !user) throw new Error('Invalid login response');

      setToken(token);

      if (user.role === 'BRAND') {
        toast.success('Logged in as brand');
        navigate('brandDashboard', {
          userRole: 'brand',
          user,
          token,
        });
      } else if (user.role === 'ADMIN') {
        toast.success('Logged in as admin');
        navigate('adminDashboard', { userRole: 'admin', user, token });
      } else if (user.role === 'CREATOR') {
        toast.success('Logged in as creator');
        navigate('creatorDashboard', { userRole: 'creator', user, token });
      } else {
        toast.success('Logged in');
        navigate('brandDashboard', { userRole: 'brand', user, token });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <div className="text-center mt-4 text-sm">
              <button onClick={() => navigate('roleSelection')} className="text-blue-600 hover:text-blue-700">
                Create an account
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
