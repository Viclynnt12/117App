import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/App';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';

const Meetings = () => {
  const { user, API } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    meeting_date: '',
    meeting_type: 'Group Therapy',
    attended: true,
    notes: '',
    recorded_by: ''
  });

  useEffect(() => {
    loadMeetings();
    if (user?.role !== 'user') {
      loadUsers();
    }
  }, []);

  const loadMeetings = async () => {
    try {
      const response = await axios.get(`${API}/meetings`, { withCredentials: true });
      setMeetings(response.data);
    } catch (error) {
      toast.error('Failed to load meetings');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, { withCredentials: true });
      setUsers(response.data.filter(u => u.role === 'user'));
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/meetings`, formData, { withCredentials: true });
      toast.success('Meeting recorded');
      setOpen(false);
      loadMeetings();
      setFormData({
        user_id: '',
        meeting_date: '',
        meeting_type: 'Group Therapy',
        attended: true,
        notes: '',
        recorded_by: ''
      });
    } catch (error) {
      toast.error('Failed to record meeting');
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="meetings-page">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Meeting Attendance
            </h1>
            <p className="text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Track meeting attendance and notes</p>
          </div>
          {user?.role !== 'user' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-meeting-button" className="bg-gray-900 hover:bg-gray-800 rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Record Meeting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Record Meeting Attendance</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Participant</Label>
                    <Select value={formData.user_id} onValueChange={(value) => setFormData({...formData, user_id: value})}>
                      <SelectTrigger data-testid="meeting-user-select">
                        <SelectValue placeholder="Select participant" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Meeting Date</Label>
                    <Input
                      data-testid="meeting-date-input"
                      type="datetime-local"
                      value={formData.meeting_date}
                      onChange={(e) => setFormData({...formData, meeting_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Meeting Type</Label>
                    <Select value={formData.meeting_type} onValueChange={(value) => setFormData({...formData, meeting_type: value})}>
                      <SelectTrigger data-testid="meeting-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Group Therapy">Group Therapy</SelectItem>
                        <SelectItem value="Individual Counseling">Individual Counseling</SelectItem>
                        <SelectItem value="Bible Study">Bible Study</SelectItem>
                        <SelectItem value="Life Skills">Life Skills</SelectItem>
                        <SelectItem value="AA/NA Meeting">AA/NA Meeting</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      data-testid="attended-checkbox"
                      checked={formData.attended}
                      onCheckedChange={(checked) => setFormData({...formData, attended: checked})}
                    />
                    <Label>Attended</Label>
                  </div>
                  <div>
                    <Label>Recorded By</Label>
                    <Input
                      data-testid="recorded-by-input"
                      value={formData.recorded_by}
                      onChange={(e) => setFormData({...formData, recorded_by: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      data-testid="meeting-notes-textarea"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={4}
                      placeholder="Meeting notes, observations, or feedback..."
                    />
                  </div>
                  <Button data-testid="submit-meeting-button" type="submit" className="w-full bg-gray-900 hover:bg-gray-800">Record Meeting</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-4">
          {meetings.length === 0 ? (
            <Card className="bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>No meetings recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting) => (
              <Card key={meeting.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300" data-testid={`meeting-${meeting.id}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          meeting.attended ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'
                        }`}>
                          {meeting.attended ? 'ATTENDED' : 'ABSENT'}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">{meeting.meeting_type}</span>
                      </div>
                      <div className="text-gray-700">
                        <p className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {format(new Date(meeting.meeting_date), 'PPP p')}
                        </p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Recorded by: {meeting.recorded_by}</p>
                        {meeting.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>{meeting.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Meetings;