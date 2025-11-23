import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/App';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { Plus, DollarSign, Check, X } from 'lucide-react';

const RentPayments = () => {
  const { user, API } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    payment_date: '',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await axios.get(`${API}/rent-payments`, { withCredentials: true });
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to load payments');
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
        notes: ''
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

  return (
    <Layout>
      <div className="space-y-6" data-testid="rent-payments-page">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Rent Payments
            </h1>
            <p className="text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Track and confirm rent payments</p>
          </div>
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

        <div className="space-y-4">
          {payments.length === 0 ? (
            <Card className="bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>No payments recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300" data-testid={`payment-${payment.id}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          payment.confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.confirmed ? 'CONFIRMED' : 'PENDING'}
                        </span>
                        <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          ${parseFloat(payment.amount).toFixed(2)}
                        </span>
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
                      </div>
                    </div>
                    {user?.role !== 'user' && !payment.confirmed && (
                      <div className="flex space-x-2 ml-4">
                        <Button
                          data-testid={`confirm-payment-${payment.id}`}
                          size="sm"
                          onClick={() => handleConfirm(payment.id, true)}
                          className="bg-green-600 hover:bg-green-700"
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
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RentPayments;