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
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { Plus, Calendar as CalendarIcon, MapPin } from 'lucide-react';

const Calendar = () => {
  const { user, API } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_type: 'Meeting',
    location: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await axios.get(`${API}/calendar-events`, { withCredentials: true });
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load events');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/calendar-events`, formData, { withCredentials: true });
      toast.success('Event created');
      setOpen(false);
      loadEvents();
      setFormData({
        title: '',
        description: '',
        event_date: '',
        event_type: 'Meeting',
        location: ''
      });
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day) => {
    return events.filter(event => 
      isSameDay(parseISO(event.event_date), day)
    );
  };

  const getEventColor = (type) => {
    const colors = {
      'Meeting': 'bg-blue-500',
      'Counseling': 'bg-green-500',
      'Event': 'bg-purple-500',
      'Activity': 'bg-orange-500',
      'Other': 'bg-gray-500'
    };
    return colors[type] || colors['Other'];
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="calendar-page">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Event Calendar
            </h1>
            <p className="text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>View upcoming events and activities</p>
          </div>
          {user?.role !== 'user' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-event-button" className="bg-teal-600 hover:bg-teal-700 rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Create Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      data-testid="event-title-input"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Date & Time</Label>
                    <Input
                      data-testid="event-date-input"
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Event Type</Label>
                    <Select value={formData.event_type} onValueChange={(value) => setFormData({...formData, event_type: value})}>
                      <SelectTrigger data-testid="event-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                        <SelectItem value="Counseling">Counseling</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Activity">Activity</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      data-testid="event-location-input"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      data-testid="event-description-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <Button data-testid="submit-event-button" type="submit" className="w-full bg-teal-600 hover:bg-teal-700">Create Event</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {format(currentDate, 'MMMM yyyy')}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2"></div>
                  ))}
                  {daysInMonth.map(day => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toString()}
                        className={`min-h-24 p-2 border rounded-lg ${
                          isToday ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'
                        } hover:shadow-md transition-all duration-200`}
                      >
                        <div className={`text-sm font-semibold ${
                          isToday ? 'text-blue-600' : 'text-gray-700'
                        }`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {format(day, 'd')}
                        </div>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs px-2 py-1 rounded text-white truncate ${getEventColor(event.event_type)}`}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-600 px-2">+{dayEvents.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {events
                    .filter(event => new Date(event.event_date) >= new Date())
                    .slice(0, 10)
                    .map(event => (
                      <div key={event.id} className="border-l-4 pl-4 py-2" style={{ borderColor: getEventColor(event.event_type).replace('bg-', '#') }} data-testid={`event-${event.id}`}>
                        <p className="font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {event.title}
                        </p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <CalendarIcon className="inline w-4 h-4 mr-1" />
                          {format(parseISO(event.event_date), 'PPP p')}
                        </p>
                        {event.location && (
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <MapPin className="inline w-4 h-4 mr-1" />
                            {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-sm text-gray-700 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {event.description}
                          </p>
                        )}
                      </div>
                    ))}
                  {events.filter(e => new Date(e.event_date) >= new Date()).length === 0 && (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>No upcoming events</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;