import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/App';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { Plus, FileText, Upload, Download, Printer } from 'lucide-react';

const DrugTests = () => {
  const { user, API } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    test_date: '',
    test_type: 'urinalysis',
    result: 'negative',
    administered_by: '',
    notes: '',
    image_url: ''
  });

  useEffect(() => {
    if (user) {
      if (user.role !== 'user') {
        loadUsers();
      } else {
        setSelectedUserId(user.id);
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedUserId || user?.role === 'user') {
      loadTests();
    }
  }, [selectedUserId]);

  const loadTests = async () => {
    try {
      const userId = user?.role === 'user' ? user.id : selectedUserId;
      const response = await axios.get(`${API}/drug-tests${userId ? `?user_id=${userId}` : ''}`, { withCredentials: true });
      setTests(response.data);
    } catch (error) {
      toast.error('Failed to load drug tests');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, { withCredentials: true });
      const regularUsers = response.data.filter(u => u.role === 'user');
      setUsers(regularUsers);
      if (regularUsers.length > 0) {
        setSelectedUserId(regularUsers[0].id);
      }
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload`, uploadFormData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, image_url: response.data.url });
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/drug-tests`, formData, { withCredentials: true });
      toast.success('Drug test recorded');
      setOpen(false);
      loadTests();
      setFormData({
        user_id: '',
        test_date: '',
        test_type: 'urinalysis',
        result: 'negative',
        administered_by: '',
        notes: '',
        image_url: ''
      });
    } catch (error) {
      toast.error('Failed to record drug test');
    }
  };

  const exportCSV = () => {
    let csv = '1:17 Discipleship - Drug Tests Report\n';
    csv += `Generated: ${format(new Date(), 'PPP')}\n\n`;
    csv += 'Date,Type,Result,Administered By,Notes\n';
    tests.forEach(test => {
      csv += `${format(new Date(test.test_date), 'PP')},${test.test_type},${test.result},${test.administered_by},"${test.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drug-tests-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'negative': return 'bg-green-100 text-green-800';
      case 'positive': return 'bg-red-100 text-red-800';
      case 'dilute': return 'bg-yellow-100 text-yellow-800';
      case 'invalid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="drug-tests-page">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Drug Tests
            </h1>
            <p className="text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Track and monitor drug test results</p>
            {(user?.role === 'admin' || user?.role === 'mentor') && (
              <div className="mt-4">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-64">
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
          <div className="flex space-x-2">
            <Button onClick={exportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={() => window.print()} variant="outline">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            {user?.role !== 'user' && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="add-drug-test-button" className="bg-gray-900 hover:bg-gray-800 rounded-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Test
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Record Drug Test</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Participant</Label>
                      <Select value={formData.user_id} onValueChange={(value) => setFormData({...formData, user_id: value})}>
                        <SelectTrigger data-testid="user-select">
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
                      <Label>Test Date</Label>
                      <Input
                        data-testid="test-date-input"
                        type="datetime-local"
                        value={formData.test_date}
                        onChange={(e) => setFormData({...formData, test_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Test Type</Label>
                      <Select value={formData.test_type} onValueChange={(value) => setFormData({...formData, test_type: value})}>
                        <SelectTrigger data-testid="test-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urinalysis">Urinalysis</SelectItem>
                          <SelectItem value="breathalyzer">Breathalyzer</SelectItem>
                          <SelectItem value="blood">Blood Test</SelectItem>
                          <SelectItem value="hair">Hair Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Result</Label>
                      <Select value={formData.result} onValueChange={(value) => setFormData({...formData, result: value})}>
                        <SelectTrigger data-testid="result-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="negative">Negative</SelectItem>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="dilute">Dilute</SelectItem>
                          <SelectItem value="invalid">Invalid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Administered By</Label>
                      <Input
                        data-testid="administered-by-input"
                        value={formData.administered_by}
                        onChange={(e) => setFormData({...formData, administered_by: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Upload Test Image</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        {uploading && <span className="text-sm text-gray-600">Uploading...</span>}
                        {formData.image_url && <span className="text-sm text-green-600">✓ Uploaded</span>}
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        data-testid="notes-textarea"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <Button data-testid="submit-drug-test-button" type="submit" className="w-full bg-gray-900 hover:bg-gray-800">Submit Test</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {tests.length === 0 ? (
            <Card className="bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>No drug tests recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            tests.map((test) => (
              <Card key={test.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300" data-testid={`drug-test-${test.id}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getResultColor(test.result)}`}>
                          {test.result.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">{test.test_type}</span>
                      </div>
                      <div className="text-gray-700">
                        <p className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Date: {format(new Date(test.test_date), 'PPP p')}</p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Administered by: {test.administered_by}</p>
                        {test.notes && <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Notes: {test.notes}</p>}
                        {test.image_url && (
                          <a href={test.image_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                            View Test Image
                          </a>
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

export default DrugTests;