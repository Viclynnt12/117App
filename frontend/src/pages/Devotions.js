import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/App';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { Plus, BookOpen } from 'lucide-react';

const Devotions = () => {
  const { user, API } = useContext(AuthContext);
  const [devotions, setDevotions] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    scripture_reference: ''
  });

  useEffect(() => {
    loadDevotions();
  }, []);

  const loadDevotions = async () => {
    try {
      const response = await axios.get(`${API}/devotions`, { withCredentials: true });
      setDevotions(response.data);
    } catch (error) {
      toast.error('Failed to load devotions');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/devotions`, formData, { withCredentials: true });
      toast.success('Devotion posted');
      setOpen(false);
      loadDevotions();
      setFormData({
        title: '',
        content: '',
        scripture_reference: ''
      });
    } catch (error) {
      toast.error('Failed to post devotion');
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="devotions-page">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Daily Devotions
            </h1>
            <p className="text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Spiritual guidance and encouragement</p>
          </div>
          {user?.role === 'admin' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-devotion-button" className="bg-gray-900 hover:bg-gray-800 rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Post Devotion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Post New Devotion</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      data-testid="devotion-title-input"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                      placeholder="Devotion title"
                    />
                  </div>
                  <div>
                    <Label>Scripture Reference</Label>
                    <Input
                      data-testid="scripture-reference-input"
                      value={formData.scripture_reference}
                      onChange={(e) => setFormData({...formData, scripture_reference: e.target.value})}
                      placeholder="e.g., John 3:16"
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      data-testid="devotion-content-textarea"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      required
                      rows={10}
                      placeholder="Devotion content..."
                    />
                  </div>
                  <Button data-testid="submit-devotion-button" type="submit" className="w-full bg-gray-900 hover:bg-gray-800">Post Devotion</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-6">
          {devotions.length === 0 ? (
            <Card className="bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>No devotions available yet</p>
              </CardContent>
            </Card>
          ) : (
            devotions.map((devotion) => (
              <Card key={devotion.id} className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-lg hover:shadow-xl transition-all duration-300" data-testid={`devotion-${devotion.id}`}>
                <CardHeader>
                  <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {devotion.title}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span>{format(new Date(devotion.created_at), 'PPP')}</span>
                    {devotion.scripture_reference && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                        {devotion.scripture_reference}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {devotion.content}
                    </p>
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

export default Devotions;