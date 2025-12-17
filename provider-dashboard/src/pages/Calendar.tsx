import React, { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import type { Appointment } from '../types';
import { TransactionUpdateModal } from '../components/transactions/TransactionUpdateModal';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

type ViewMode = 'week' | 'day' | 'month';

interface CalendarProps {
  appointments?: Appointment[];
  onBack?: () => void;
}

// Generate mock appointments for multiple days
const generateMockAppointments = (): Appointment[] => {
  const today = new Date();
  const appointments: Appointment[] = [];
  
  // Create appointments for the next 14 days
  for (let dayOffset = -3; dayOffset < 11; dayOffset++) {
    const date = addDays(today, dayOffset);
    const numAppointments = Math.floor(Math.random() * 4) + 1; // 1-4 per day
    
    for (let i = 0; i < numAppointments; i++) {
      const hour = 9 + i * 2; // Spread throughout day
      const appointmentDate = new Date(date);
      appointmentDate.setHours(hour, 0, 0, 0);
      
      appointments.push({
        _id: `${dayOffset}-${i}`,
        patientId: {
          _id: `p${dayOffset}-${i}`,
          firstName: ['Jane', 'John', 'Sarah', 'Mike', 'Emily'][Math.floor(Math.random() * 5)],
          lastName: ['Smith', 'Doe', 'Johnson', 'Brown', 'Davis'][Math.floor(Math.random() * 5)],
          email: 'patient@example.com',
          phone: '(555) 123-4567',
        },
        serviceId: {
          _id: `s${i}`,
          name: ['Annual Physical', 'Sick Visit', 'Lab Work', 'Consultation', 'Follow-up'][Math.floor(Math.random() * 5)],
          duration: [30, 45, 60][Math.floor(Math.random() * 3)],
          price: [10000, 15000, 5000][Math.floor(Math.random() * 3)],
        },
        scheduledFor: appointmentDate.toISOString(),
        status: 'scheduled',
        paymentStatus: 'authorized',
        amount: [10000, 15000, 5000][Math.floor(Math.random() * 3)],
      });
    }
  }
  
  return appointments.sort((a, b) => 
    new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
  );
};

export function Calendar({ appointments, onBack }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const mockAppointments = generateMockAppointments();
  const displayAppointments = appointments || mockAppointments;

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else {
      setCurrentDate(addDays(currentDate, -30));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 30));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getAppointmentsForDay = (day: Date) => {
    return displayAppointments.filter(apt => 
      isSameDay(parseISO(apt.scheduledFor), day)
    );
  };

  const handleSaveAdjustment = (adjustments: any[], reason: string, status: string) => {
    console.log('Saving adjustment:', { adjustments, reason, status });
    alert('✅ Adjustment saved! (API integration pending)');
    setSelectedAppointment(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Back
                </button>
              )}
              <div className="flex items-center">
                <img 
                  src="/findr-logo.svg" 
                  alt="Findr Health" 
                  className="h-24 w-auto mr-3"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'week' && `Week of ${format(weekStart, 'MMM d, yyyy')}`}
                    {viewMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
                    {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
                  </p>
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    viewMode === 'day'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    viewMode === 'week'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    viewMode === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrevious}>
                ← Previous
              </Button>
              <Button variant="outline" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" onClick={handleNext}>
                Next →
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              {displayAppointments.length} total appointments
            </div>
          </div>
        </div>
      </header>

      {/* Calendar Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'week' && (
          <WeekView
            weekDays={weekDays}
            appointments={displayAppointments}
            getAppointmentsForDay={getAppointmentsForDay}
            onAppointmentClick={setSelectedAppointment}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            day={currentDate}
            appointments={getAppointmentsForDay(currentDate)}
            onAppointmentClick={setSelectedAppointment}
          />
        )}

        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            appointments={displayAppointments}
            getAppointmentsForDay={getAppointmentsForDay}
            onAppointmentClick={setSelectedAppointment}
          />
        )}
      </main>

      {/* Transaction Modal */}
      {selectedAppointment && (
        <TransactionUpdateModal
          appointment={selectedAppointment}
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onSave={handleSaveAdjustment}
        />
      )}
    </div>
  );
}

// Week View Component
function WeekView({ weekDays, appointments, getAppointmentsForDay, onAppointmentClick }: any) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-4 text-sm font-medium text-gray-500">Time</div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-4 text-center ${
              isSameDay(day, new Date())
                ? 'bg-teal-50 border-l-4 border-teal-500'
                : ''
            }`}
          >
            <div className="text-sm font-medium text-gray-900">
              {format(day, 'EEE')}
            </div>
            <div className={`text-2xl font-bold ${
              isSameDay(day, new Date()) ? 'text-teal-600' : 'text-gray-900'
            }`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-8">
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time Label */}
            <div className="p-4 text-sm text-gray-500 border-r border-gray-200">
              {format(new Date().setHours(hour, 0), 'h:mm a')}
            </div>

            {/* Day Columns */}
            {weekDays.map((day) => {
              const dayAppointments = getAppointmentsForDay(day).filter((apt: Appointment) => {
                const aptHour = new Date(apt.scheduledFor).getHours();
                return aptHour === hour;
              });

              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="p-2 border-r border-b border-gray-200 min-h-[80px] relative"
                >
                  {dayAppointments.map((apt: Appointment) => (
                    <div
                      key={apt._id}
                      onClick={() => onAppointmentClick(apt)}
                      className="bg-teal-100 border-l-4 border-teal-500 p-2 rounded mb-1 cursor-pointer hover:bg-teal-200 transition"
                    >
                      <div className="text-xs font-semibold text-teal-900 truncate">
                        {apt.patientId.firstName} {apt.patientId.lastName}
                      </div>
                      <div className="text-xs text-teal-700 truncate">
                        {apt.serviceId.name}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Day View Component
function DayView({ day, appointments, onAppointmentClick }: any) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">
        {format(day, 'EEEE, MMMM d, yyyy')}
      </h2>
      
      {appointments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No appointments scheduled for this day
        </div>
      ) : (
        <div className="space-y-1">
          {hours.map((hour) => {
            const hourAppointments = appointments.filter((apt: Appointment) => {
              const aptHour = new Date(apt.scheduledFor).getHours();
              return aptHour === hour;
            });

            return (
              <div key={hour} className="flex border-b border-gray-100 min-h-[60px]">
                <div className="w-24 p-3 text-sm text-gray-500 flex-shrink-0">
                  {format(new Date().setHours(hour, 0), 'h:mm a')}
                </div>
                <div className="flex-1 p-2 space-y-2">
                  {hourAppointments.map((apt: Appointment) => (
                    <div
                      key={apt._id}
                      onClick={() => onAppointmentClick(apt)}
                      className="bg-teal-50 border-l-4 border-teal-500 p-3 rounded cursor-pointer hover:bg-teal-100 transition"
                    >
                      <div className="font-semibold text-teal-900">
                        {apt.patientId.firstName} {apt.patientId.lastName}
                      </div>
                      <div className="text-sm text-teal-700">
                        {apt.serviceId.name} • {apt.serviceId.duration} min
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// Month View Component
function MonthView({ currentDate, appointments, getAppointmentsForDay, onAppointmentClick }: any) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = addDays(startOfWeek(monthEnd), 6);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks = [];
  
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200">
            {week.map((day) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] p-2 border-r border-gray-200 ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  } ${isToday ? 'bg-teal-50' : ''}`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    isToday ? 'text-teal-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt: Appointment) => (
                      <div
                        key={apt._id}
                        onClick={() => onAppointmentClick(apt)}
                        className="text-xs bg-teal-100 text-teal-800 p-1 rounded cursor-pointer hover:bg-teal-200 truncate"
                      >
                        {format(parseISO(apt.scheduledFor), 'h:mm a')} {apt.patientId.firstName}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
