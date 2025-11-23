import { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '@/App';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { Send, MessageCircle } from 'lucide-react';

const Messages = () => {
  const { user, API } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [content, setContent] = useState('');
  const [recipientId, setRecipientId] = useState('broadcast');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    loadUsers();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages`, { withCredentials: true });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, { withCredentials: true });
      setUsers(response.data.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await axios.post(`${API}/messages`, {
        content: content.trim(),
        recipient_id: recipientId === 'broadcast' ? null : recipientId
      }, { withCredentials: true });
      setContent('');
      loadMessages();
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getUserName = (userId) => {
    if (userId === user?.id) return 'You';
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.name || 'Unknown';
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="messages-page">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Messages
          </h1>
          <p className="text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Communicate with the community</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Conversation</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        data-testid={`message-${message.id}`}
                      >
                        <div className={`max-w-[70%] ${
                          isOwnMessage
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-900'
                        } rounded-2xl px-4 py-3 shadow-md`}>
                          {!isOwnMessage && (
                            <p className="text-xs font-semibold mb-1 opacity-80" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                              {getUserName(message.sender_id)}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {message.content}
                          </p>
                          {message.recipient_id === null && (
                            <span className={`inline-block text-xs mt-1 px-2 py-0.5 rounded-full ${
                              isOwnMessage ? 'bg-white/20' : 'bg-blue-100 text-blue-800'
                            }`}>
                              Broadcast
                            </span>
                          )}
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'opacity-80' : 'text-gray-500'
                          }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                            {format(new Date(message.created_at), 'MMM d, p')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Send Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <Select value={recipientId} onValueChange={setRecipientId}>
                      <SelectTrigger data-testid="recipient-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="broadcast">Everyone (Broadcast)</SelectItem>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    data-testid="message-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your message..."
                    rows={6}
                    required
                  />
                  <Button
                    data-testid="send-message-button"
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-gray-800"
                  >
                    <Send className="w-4 h-4 mr-2" /> Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;