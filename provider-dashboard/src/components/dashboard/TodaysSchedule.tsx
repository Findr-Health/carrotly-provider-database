import React from 'react';
import { Card } from '../common/Card';
import type { Appointment } from '../../types';
import { format } from 'date-fns';

interface TodaysScheduleProps {
  appointments: Appointment[];
  isLoading?: boolean;
  onAppointmentClick: (appointment: Appointment) => void;
}

export function TodaysSchedule({ 
  appointments, 
  isLoading, 
  onAppointmentClick 
}: TodaysScheduleProps) {
  if (isLoading) {
    return (
      <Card>
        <h2 className="text-xl font-bold mb-4">Today's Schedule</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <h2 className="text-xl font-bold mb-4">Today's Schedule</h2>
        <div className="text-center py-8 text-gray-500">
          No appointments scheduled for today
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Today's Schedule</h2>
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <div
            key={appointment._id}
            onClick={() => onAppointmentClick(appointment)}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-teal-500 cursor-pointer transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-gray-900">
                  {format(new Date(appointment.scheduledFor), 'h:mm a')}
                </div>
                <div className="text-sm text-gray-600">
                  {appointment.patientId.firstName} {appointment.patientId.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {appointment.serviceId.name} • {appointment.serviceId.duration} min
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                  appointment.status
                )}`}
              >
                {appointment.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
