import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, ChevronLeft, ChevronRight, List, Grid3x3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface CampaignEvent {
  id: string;
  brand: string;
  campaign: string;
  type: 'shoot' | 'draft' | 'post-live' | 'deadline';
  date: string;
  color: string;
}

const mockEvents: CampaignEvent[] = [
  {
    id: '1',
    brand: 'StyleCo',
    campaign: 'Summer Collection',
    type: 'shoot',
    date: '2025-10-25',
    color: 'bg-purple-500'
  },
  {
    id: '2',
    brand: 'StyleCo',
    campaign: 'Summer Collection',
    type: 'draft',
    date: '2025-10-27',
    color: 'bg-purple-500'
  },
  {
    id: '3',
    brand: 'StyleCo',
    campaign: 'Summer Collection',
    type: 'post-live',
    date: '2025-10-29',
    color: 'bg-purple-500'
  },
  {
    id: '4',
    brand: 'FitLife',
    campaign: 'Workout Series',
    type: 'shoot',
    date: '2025-10-26',
    color: 'bg-blue-500'
  },
  {
    id: '5',
    brand: 'FitLife',
    campaign: 'Workout Series',
    type: 'deadline',
    date: '2025-10-30',
    color: 'bg-blue-500'
  },
  {
    id: '6',
    brand: 'TechGear',
    campaign: 'Product Review',
    type: 'shoot',
    date: '2025-10-28',
    color: 'bg-green-500'
  },
  {
    id: '7',
    brand: 'BeautyBox',
    campaign: 'Monthly Unboxing',
    type: 'draft',
    date: '2025-11-02',
    color: 'bg-pink-500'
  }
];

const daysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const firstDay = getFirstDayOfMonth(year, month);
  const daysCount = daysInMonth(year, month);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const getEventsForDate = (date: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return mockEvents.filter(event => event.date === dateStr);
  };

  const getTypeLabel = (type: CampaignEvent['type']) => {
    switch (type) {
      case 'shoot': return 'Shoot Day';
      case 'draft': return 'Draft Due';
      case 'post-live': return 'Post Live';
      case 'deadline': return 'Deadline';
    }
  };

  const renderMonthView = () => {
    const days: React.ReactNode[] = [];
    const totalSlots = Math.ceil((firstDay + daysCount) / 7) * 7;

    for (let i = 0; i < totalSlots; i++) {
      const dayNumber = i - firstDay + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysCount;
      const isToday = isCurrentMonth && 
                     dayNumber === today.getDate() && 
                     month === today.getMonth() && 
                     year === today.getFullYear();
      const events = isCurrentMonth ? getEventsForDate(dayNumber) : [];

      days.push(
        <div
          key={i}
          className={`min-h-[120px] border border-gray-200 p-2 ${
            !isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
          } ${isToday ? 'ring-2 ring-purple-500' : ''}`}
        >
          {isCurrentMonth && (
            <>
              <div className={`text-sm mb-2 ${isToday ? 'text-purple-600' : 'text-gray-900'}`}>
                {dayNumber}
              </div>
              <div className="space-y-1">
                {events.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`${event.color} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity`}
                    title={`${event.brand} - ${event.campaign}`}
                  >
                    <div className="truncate">{event.brand}</div>
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-xs text-gray-600 pl-1">
                    +{events.length - 3} more
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-100 p-3 text-sm text-gray-900 border-b border-gray-200 text-center">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderListView = () => {
    const sortedEvents = [...mockEvents].sort((a, b) => a.date.localeCompare(b.date));

    return (
      <div className="space-y-2">
        {sortedEvents.map(event => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-16 rounded ${event.color}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-gray-900">{event.brand}</h4>
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(event.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{event.campaign}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Calendar & Timeline</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your content schedule and deadlines</p>
        </div>
      </div>

      {/* Calendar Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-gray-900 min-w-[180px] text-center">
                {monthNames[month]} {year}
              </h3>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>

            <Tabs value={view} onValueChange={(v: string) => setView(v as 'month' | 'week' | 'list')}>
              <TabsList>
                <TabsTrigger value="month" className="gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Month
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="w-4 h-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {view === 'month' ? renderMonthView() : renderListView()}
        </CardContent>
      </Card>

      {/* Event Types Legend */}
      <Card>
        <CardContent className="p-6">
          <h4 className="text-sm text-gray-900 mb-4">Event Types</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Shoot Day', color: 'bg-purple-500' },
              { label: 'Draft Submission', color: 'bg-blue-500' },
              { label: 'Post Live', color: 'bg-green-500' },
              { label: 'Campaign Deadline', color: 'bg-pink-500' }
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${item.color}`} />
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h4 className="text-gray-900">Upcoming This Week</h4>
          </div>
          <div className="space-y-3">
            {mockEvents
              .filter(event => {
                const eventDate = new Date(event.date);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return eventDate >= today && eventDate <= weekFromNow;
              })
              .slice(0, 5)
              .map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-1 h-12 rounded ${event.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{event.brand}</span>
                      <Badge variant="outline" className="text-xs">{getTypeLabel(event.type)}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{event.campaign}</p>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
