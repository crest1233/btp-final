import { useEffect, useState } from 'react';
import Layout from '../Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Calendar, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { toast } from 'sonner';
import { get, post } from '../../system/api';

interface CreatorCalendarScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  startAt: string; // ISO from backend
  endAt?: string | null;
  location?: string | null;
};

export default function CreatorCalendarScreen({ navigate }: CreatorCalendarScreenProps) {
  const [creatorId, setCreatorId] = useState(null as string | null);
  const [events, setEvents] = useState([] as EventItem[]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null as EventItem | null);

  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState(''); // datetime-local
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    let mounted = true;
    ;(async () => {
      try {
        const me = await get('/api/auth/me');
        const cid = me?.user?.creator?.id;
        if (!cid) {
          setLoading(false);
          return;
        }
        setCreatorId(cid);
        const res = await get(`/api/creators/${cid}/events`);
        if (!mounted) return;
        setEvents(Array.isArray(res?.events) ? res.events : []);
        setLoading(false);
      } catch (err: any) {
        if (!mounted) return;
        toast.error(err?.message || 'Failed to load events');
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const resetForm = () => {
    setTitle('');
    setStartAt('');
    setEndAt('');
    setLocation('');
    setDescription('');
  };

  const handleAddEvent = async () => {
    try {
      if (!creatorId) return;
      if (!title || !startAt) {
        toast.error('Title and start time are required');
        return;
      }
      const payload: any = {
        title,
        startAt: new Date(startAt).toISOString(),
      };
      if (endAt) payload.endAt = new Date(endAt).toISOString();
      if (location) payload.location = location;
      if (description) payload.description = description;

      const res = await post(`/api/creators/${creatorId}/events`, payload);
      const created = res?.event as EventItem;
      setEvents(prev => [...prev, created].sort((a,b) => Date.parse(a.startAt) - Date.parse(b.startAt)));
      setAddOpen(false);
      resetForm();
      toast.success('Event added');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add event');
    }
  };

  const openView = (ev: EventItem) => {
    setSelectedEvent(ev);
    setViewOpen(true);
  };

  return (
    <Layout navigate={navigate} userRole="creator" currentScreen="creatorCalendar">
      <div className="max-w-md mx-auto px-4 py-6">{/* Mobile-focused width */}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-gray-900 mb-1 text-lg">Calendar</h1>
            <p className="text-gray-600 text-sm">Track content, deadlines, and meetings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('creatorDashboard')}>Dashboard</Button>
            <Button className="gap-2" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-600">Loading…</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-gray-600">No events yet. Add your schedule.</p>
            ) : (
              <div className="space-y-3">
                {events.map(ev => (
                  <div key={ev.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-gray-900 text-sm truncate">{ev.title}</p>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {new Date(ev.startAt).toLocaleString()} {ev.endAt ? `– ${new Date(ev.endAt).toLocaleTimeString()}` : ''}
                        </p>
                        {ev.location ? (
                          <p className="text-xs text-gray-600 mt-1 truncate">{ev.location}</p>
                        ) : null}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openView(ev)}>View</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Event Sheet (bottom for mobile) */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle>Add Event</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <label className="text-sm">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Start</label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">End (optional)</label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Location (optional)</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Zoom, Studio" />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Description (optional)</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes, agenda…" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleAddEvent}>Save</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* View Event Sheet */}
      <Sheet open={viewOpen} onOpenChange={setViewOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle>Event Details</SheetTitle>
          </SheetHeader>
          {selectedEvent ? (
            <div className="p-4 space-y-3">
              <div>
                <p className="text-gray-900 text-sm">{selectedEvent.title}</p>
                <p className="text-xs text-gray-600 mt-1">{new Date(selectedEvent.startAt).toLocaleString()}</p>
                {selectedEvent.endAt ? (
                  <p className="text-xs text-gray-600">Ends: {new Date(selectedEvent.endAt).toLocaleString()}</p>
                ) : null}
              </div>
              {selectedEvent.location ? (
                <p className="text-xs text-gray-600">Location: {selectedEvent.location}</p>
              ) : null}
              {selectedEvent.description ? (
                <p className="text-xs text-gray-600">{selectedEvent.description}</p>
              ) : null}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setViewOpen(false)}>Close</Button>
                <Button className="flex-1" onClick={() => toast.info('Edit coming soon')}>Edit</Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </Layout>
  );
}