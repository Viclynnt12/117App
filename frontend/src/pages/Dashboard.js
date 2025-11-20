import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/App';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, Calendar, DollarSign, BookOpen } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { user, API } = useContext(AuthContext);
  const [stats, setStats] = useState({
    drugTests: 0,
    meetings: 0,
    payments: 0,
    devotions: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [drugTests, meetings, payments, devotions] = await Promise.all([
        axios.get(`${API}/drug-tests`, { withCredentials: true }),
        axios.get(`${API}/meetings`, { withCredentials: true }),
        axios.get(`${API}/rent-payments`, { withCredentials: true }),
        axios.get(`${API}/devotions`, { withCredentials: true })
      ]);

      setStats({
        drugTests: drugTests.data.length,
        meetings: meetings.data.filter(m => m.attended).length,
        payments: payments.data.filter(p => p.confirmed).length,
        devotions: devotions.data.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Here's your journey overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Drug Tests"
            value={stats.drugTests}
            icon={<ClipboardCheck className="w-6 h-6" />}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Meetings Attended"
            value={stats.meetings}
            icon={<Calendar className="w-6 h-6" />}
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            title="Payments Confirmed"
            value={stats.payments}
            icon={<DollarSign className="w-6 h-6" />}
            color="from-orange-500 to-amber-500"
          />
          <StatCard
            title="Devotions Available"
            value={stats.devotions}
            icon={<BookOpen className="w-6 h-6" />}
            color="from-purple-500 to-pink-500"
          />
        </div>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-lg">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <QuickActionButton href="/devotions" label="Read Today's Devotion" />
              <QuickActionButton href="/calendar" label="View Events" />
              <QuickActionButton href="/messages" label="Check Messages" />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{title}</p>
          <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
        </div>
        <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-md`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const QuickActionButton = ({ href, label }) => (
  <a
    href={href}
    className="block p-4 bg-white rounded-xl hover:bg-blue-50 transition-colors duration-200 text-center font-medium text-gray-700 hover:text-blue-600 shadow-sm hover:shadow-md"
    style={{ fontFamily: 'Inter, sans-serif' }}
  >
    {label}
  </a>
);

export default Dashboard;