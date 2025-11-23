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
import { Plus, BookMarked, ExternalLink } from 'lucide-react';

const ReadingMaterials = () => {
  const { user, API } = useContext(AuthContext);
  const [materials, setMaterials] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: 'Recovery',
    link: ''
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await axios.get(`${API}/reading-materials`, { withCredentials: true });
      setMaterials(response.data);
    } catch (error) {
      toast.error('Failed to load reading materials');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/reading-materials`, formData, { withCredentials: true });
      toast.success('Reading material added');
      setOpen(false);
      loadMaterials();
      setFormData({
        title: '',
        author: '',
        description: '',
        category: 'Recovery',
        link: ''
      });
    } catch (error) {
      toast.error('Failed to add reading material');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Recovery': 'bg-blue-100 text-blue-800',
      'Spiritual': 'bg-purple-100 text-purple-800',
      'Life Skills': 'bg-green-100 text-green-800',
      'Personal Growth': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Other'];
  };

  const groupedMaterials = materials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-6" data-testid="reading-materials-page">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Reading Materials
            </h1>
            <p className="text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Suggested books and resources for growth</p>
          </div>
          {user?.role !== 'user' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-material-button" className="bg-gray-900 hover:bg-gray-800 rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Add Reading Material</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      data-testid="material-title-input"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Author</Label>
                    <Input
                      data-testid="material-author-input"
                      value={formData.author}
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger data-testid="material-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Recovery">Recovery</SelectItem>
                        <SelectItem value="Spiritual">Spiritual</SelectItem>
                        <SelectItem value="Life Skills">Life Skills</SelectItem>
                        <SelectItem value="Personal Growth">Personal Growth</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      data-testid="material-description-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      placeholder="Brief description of the book or resource..."
                    />
                  </div>
                  <div>
                    <Label>Link (Optional)</Label>
                    <Input
                      data-testid="material-link-input"
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({...formData, link: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <Button data-testid="submit-material-button" type="submit" className="w-full bg-gray-900 hover:bg-gray-800">Add Material</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {materials.length === 0 ? (
          <Card className="bg-white shadow-lg">
            <CardContent className="p-12 text-center">
              <BookMarked className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>No reading materials added yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMaterials).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {category}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {items.map((material) => (
                    <Card key={material.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300" data-testid={`material-${material.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                              {material.title}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>by {material.author}</p>
                          </div>
                          {material.link && (
                            <a
                              href={material.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700"
                              data-testid={`material-link-${material.id}`}
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(material.category)} mb-3`}>
                          {material.category}
                        </span>
                        {material.description && (
                          <p className="text-sm text-gray-700 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {material.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReadingMaterials;