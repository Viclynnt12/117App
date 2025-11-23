import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/App';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Calendar, DollarSign, BookOpen, Download, Printer } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user, API } = useContext(AuthContext);
  const [stats, setStats] = useState({
    drugTests: 0,
    meetings: 0,
    payments: 0,
    devotions: 0
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [detailedData, setDetailedData] = useState({
    drugTests: [],
    meetings: [],
    payments: []
  });

  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'mentor') {
        loadUsers();
      } else {
        setSelectedUserId(user.id);
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedUserId) {
      loadStats();
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, { withCredentials: true });
      setUsers(response.data.filter(u => u.role === 'user'));
      if (response.data.length > 0) {
        setSelectedUserId(response.data.find(u => u.role === 'user')?.id || user.id);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [drugTests, meetings, payments, devotions] = await Promise.all([
        axios.get(`${API}/drug-tests?user_id=${selectedUserId}`, { withCredentials: true }),
        axios.get(`${API}/meetings?user_id=${selectedUserId}`, { withCredentials: true }),
        axios.get(`${API}/rent-payments?user_id=${selectedUserId}`, { withCredentials: true }),
        axios.get(`${API}/devotions`, { withCredentials: true })
      ]);

      setDetailedData({
        drugTests: drugTests.data,
        meetings: meetings.data,
        payments: payments.data
      });

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

  const exportToCSV = () => {
    const selectedUser = users.find(u => u.id === selectedUserId) || user;
    let csv = `1:17 Discipleship - Dashboard Report\n`;
    csv += `User: ${selectedUser.name}\n`;
    csv += `Generated: ${format(new Date(), 'PPP')}\n\n`;

    csv += `Drug Tests\n`;
    csv += `Date,Type,Result,Administered By,Notes\n`;
    detailedData.drugTests.forEach(test => {
      csv += `${format(new Date(test.test_date), 'PP')},${test.test_type},${test.result},${test.administered_by},"${test.notes || ''}"\n`;
    });

    csv += `\nMeetings\n`;
    csv += `Date,Type,Attended,Recorded By,Notes\n`;
    detailedData.meetings.forEach(meeting => {
      csv += `${format(new Date(meeting.meeting_date), 'PP')},${meeting.meeting_type},${meeting.attended ? 'Yes' : 'No'},${meeting.recorded_by},"${meeting.notes || ''}"\n`;
    });

    csv += `\nRent Payments\n`;
    csv += `Date,Amount,Confirmed,Confirmed By\n`;
    detailedData.payments.forEach(payment => {
      csv += `${format(new Date(payment.payment_date), 'PP')},$${payment.amount},${payment.confirmed ? 'Yes' : 'No'},${payment.confirmed_by || 'Pending'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${selectedUser.name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Dashboard
            </h1>
            {(user?.role === 'admin' || user?.role === 'mentor') && (
              <div className="mt-4">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-64" data-testid="user-select">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex space-x-2 print:hidden">
            <Button
              data-testid="export-csv-button"
              onClick={exportToCSV}
              variant="outline"
              className="space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
            <Button
              data-testid="print-button"
              onClick={handlePrint}
              variant="outline"
              className="space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Drug Tests"
            value={stats.drugTests}
            icon={<ClipboardCheck className="w-6 h-6" />}
            color="from-gray-800 to-gray-900"
          />
          <StatCard
            title="Meetings Attended"
            value={stats.meetings}
            icon={<Calendar className="w-6 h-6" />}
            color="from-gray-700 to-gray-800"
          />
          <StatCard
            title="Payments Confirmed"
            value={stats.payments}
            icon={<DollarSign className="w-6 h-6" />}
            color="from-gray-600 to-gray-700"
          />
          <StatCard
            title="Devotions Available"
            value={stats.devotions}
            icon={<BookOpen className="w-6 h-6" />}
            color="from-gray-800 to-gray-900"
          />
        </div>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-none shadow-lg">
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
    className="block p-4 bg-white rounded-xl hover:bg-gray-100 transition-colors duration-200 text-center font-medium text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md"
    style={{ fontFamily: 'Inter, sans-serif' }}
  >
    {label}
  </a>
);

export default Dashboard;