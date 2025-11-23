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
import { Plus, DollarSign, Check, X, Download, Printer, Upload } from 'lucide-react';

const RentPayments = () => {
  const { user, API } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState({ expected_rent_amount: 0 });
  const [formData, setFormData] = useState({
    user_id: '',
    payment_date: '',
    amount: '',
    notes: '',
    image_url: ''
  });

  useEffect(() => {
    if (user) {
      loadSettings();
      if (user.role === 'admin' || user.role === 'mentor') {
        loadUsers();
      } else {
        setSelectedUserId(user.id);
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedUserId || user?.role === 'user') {
      loadPayments();
    }
  }, [selectedUserId]);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings`, { withCredentials: true });
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings');
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

  const loadPayments = async () => {
    try {
      const userId = user?.role === 'user' ? user.id : selectedUserId;
      const response = await axios.get(`${API}/rent-payments${userId ? `?user_id=${userId}` : ''}`, { withCredentials: true });
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to load payments');
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
      toast.success('Receipt uploaded');
    } catch (error) {
      toast.error('Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        user_id: user.id
      };
      await axios.post(`${API}/rent-payments`, data, { withCredentials: true });
      toast.success('Payment submitted for confirmation');
      setOpen(false);
      loadPayments();
      setFormData({
        user_id: '',
        payment_date: '',
        amount: '',
        notes: '',
        image_url: ''
      });
    } catch (error) {
      toast.error('Failed to submit payment');
    }
  };

  const handleConfirm = async (paymentId, confirmed) => {
    try {
      await axios.patch(`${API}/rent-payments/${paymentId}/confirm`, {
        confirmed,
        confirmed_by: user.name
      }, { withCredentials: true });
      toast.success(confirmed ? 'Payment confirmed' : 'Payment rejected');
      loadPayments();
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const exportCSV = () => {
    let csv = '1:17 Discipleship - Rent Payments Report\n';
    csv += `Generated: ${format(new Date(), 'PPP')}\n\n`;
    csv += 'User,Date,Amount,Confirmed,Confirmed By,Notes\n';
    payments.forEach(payment => {
      const userName = users.find(u => u.id === payment.user_id)?.name || 'Unknown';
      csv += `${userName},${format(new Date(payment.payment_date), 'PP')},$${payment.amount},${payment.confirmed ? 'Yes' : 'No'},${payment.confirmed_by || 'Pending'},"${payment.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rent-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const isAmountIncorrect = (amount) => {
    return settings.expected_rent_amount > 0 && parseFloat(amount) !== parseFloat(settings.expected_rent_amount);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="rent-payments-page">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Rent Payments
            </h1>
            <p className="text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Track and confirm rent payments</p>
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
            {(user?.role === 'admin' || user?.role === 'mentor') && (
              <>
                <Button onClick={exportCSV} variant="outline">
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
                <Button onClick={() => window.print()} variant="outline">
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
              </>
            )}
            {user?.role === 'user' && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="submit-payment-button" className="bg-gray-900 hover:bg-gray-800 rounded-full">
                    <Plus className="w-4 h-4 mr-2" /> Submit Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Submit Rent Payment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Payment Date</Label>
                      <Input
                        data-testid="payment-date-input"
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input
                        data-testid="amount-input"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Upload Receipt (Optional)</Label>
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
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        data-testid="payment-notes-textarea"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows={3}
                        placeholder="Payment method, reference number, etc..."
                      />
                    </div>
                    <Button data-testid="submit-payment-form-button" type="submit" className="w-full bg-gray-900 hover:bg-gray-800">Submit for Confirmation</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Ministry Forms Payment Embed */}
        {user?.role === 'user' && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Pay Online</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full" style={{ minHeight: '600px' }}>
                <iframe 
                  src="https://forms.ministryforms.net/embed.aspx?formId=81b750c1-d76f-4158-b9e0-f00edf760e88"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  title="Ministry Forms Payment"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {payments.length === 0 ? (
            <Card className="bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>No payments recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => {
              const amountIncorrect = isAmountIncorrect(payment.amount);
              return (
                <Card key={payment.id} className={`bg-white shadow-lg hover:shadow-xl transition-all duration-300 ${amountIncorrect ? 'border-2 border-red-500' : ''}`} data-testid={`payment-${payment.id}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            payment.confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.confirmed ? 'CONFIRMED' : 'PENDING'}
                          </span>
                          <span className={`text-2xl font-bold ${amountIncorrect ? 'text-red-600' : 'text-gray-900'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            ${parseFloat(payment.amount).toFixed(2)}
                          </span>
                          {amountIncorrect && (
                            <span className="text-xs text-red-600 font-medium">
                              Expected: ${parseFloat(settings.expected_rent_amount).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-700">
                          <p className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            Payment Date: {format(new Date(payment.payment_date), 'PPP')}
                          </p>
                          {payment.confirmed && payment.confirmed_by && (
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                              Confirmed by: {payment.confirmed_by} on {format(new Date(payment.confirmation_date), 'PPP')}
                            </p>
                          )}
                          {payment.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>{payment.notes}</p>
                            </div>
                          )}
                          {payment.image_url && (
                            <a href={payment.image_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                              View Receipt
                            </a>
                          )}
                        </div>
                      </div>
                      {user?.role !== 'user' && !payment.confirmed && (
                        <div className="flex space-x-2 ml-4">
                          <Button
                            data-testid={`confirm-payment-${payment.id}`}
                            size="sm"
                            onClick={() => handleConfirm(payment.id, true)}
                            className="bg-gray-800 hover:bg-gray-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            data-testid={`reject-payment-${payment.id}`}
                            size="sm"
                            variant="destructive"
                            onClick={() => handleConfirm(payment.id, false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RentPayments;