import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, MessageCircle, Heart } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      handleAuth(sessionId);
    }
  }, []);

  const handleAuth = async (sessionId) => {
    try {
      await axios.post(`${API}/auth/session`, {}, {
        headers: { 'X-Session-ID': sessionId },
        withCredentials: true
      });
      window.location.hash = '';
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Journey Connect
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Supporting your recovery journey with comprehensive tracking, guidance, and community connection
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Daily Devotions"
              description="Spiritual guidance and inspiration to support your journey"
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Progress Tracking"
              description="Monitor meetings, tests, and milestones in one place"
            />
            <FeatureCard
              icon={<MessageCircle className="w-6 h-6" />}
              title="Community Messaging"
              description="Stay connected with mentors and fellow members"
            />
            <FeatureCard
              icon={<Heart className="w-6 h-6" />}
              title="Accountability Tools"
              description="Track rent payments, attendance, and personal growth"
            />
          </div>
        </div>

        <div className="text-center">
          <Button
            data-testid="login-button"
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            Sign In with Google
          </Button>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100">
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
        <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{description}</p>
      </div>
    </div>
  </div>
);

export default LandingPage;