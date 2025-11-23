import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/App';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { Settings, DollarSign, Calendar } from 'lucide-react';

const AdminSettings = () => {
  const { user, API } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    expected_rent_amount: 0,
    rent_due_day: 1
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings`, { withCredentials: true });
      setSettings({
        expected_rent_amount: response.data.expected_rent_amount || 0,
        rent_due_day: response.data.rent_due_day || 1
      });
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API}/admin/settings`, settings, { withCredentials: true });
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Access denied. Admin only.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="admin-settings-page">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Admin Settings
          </h1>
          <p className="text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Configure system-wide settings</p>
        </div>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Rent Payment Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Expected Rent Amount</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.expected_rent_amount}
                  onChange={(e) => setSettings({...settings, expected_rent_amount: parseFloat(e.target.value)})}
                  placeholder="0.00"
                  className="mt-2"
                  data-testid="expected-rent-input"
                />
                <p className="text-sm text-gray-500 mt-1">Payments not matching this amount will be highlighted in red</p>
              </div>

              <div>
                <Label className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Rent Due Day (of month)</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={settings.rent_due_day}
                  onChange={(e) => setSettings({...settings, rent_due_day: parseInt(e.target.value)})}
                  className="mt-2"
                  data-testid="rent-due-day-input"
                />
                <p className="text-sm text-gray-500 mt-1">Users will be notified on this day each month</p>
              </div>

              <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800" data-testid="save-settings-button">
                Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Expected Rent Amount</h3>
              <p className="text-sm text-gray-600">Set the standard monthly rent amount. When users submit payments with different amounts, they will be highlighted in red on the rent payments dashboard.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Rent Due Day</h3>
              <p className="text-sm text-gray-600">Set which day of the month rent is due. Users will receive a notification reminder on this day.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminSettings;