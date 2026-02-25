// Calendar utility functions for generating .ics files

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    duration?: number; // in hours, default 2
}

/**
 * Format date to ICS format (YYYYMMDDTHHMMSSZ)
 */
const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generate .ics file content for calendar apps
 */
export const generateICSFile = (event: CalendarEvent, bookingId?: string): void => {
    const startDate = new Date(`${event.date}T${event.time}`);
    const endDate = new Date(startDate.getTime() + (event.duration || 2) * 60 * 60 * 1000);

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CollegeEvents//Event Booking//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${bookingId || event.id}@collegeevents.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || 'Event booking confirmation'}
LOCATION:${event.venue}, ${event.location}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
DESCRIPTION:Event reminder - ${event.title}
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
DESCRIPTION:Event starts in 1 hour
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

    // Create and download the .ics file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Generate Google Calendar URL
 */
export const getGoogleCalendarUrl = (event: CalendarEvent): string => {
    const startDate = new Date(`${event.date}T${event.time}`);
    const endDate = new Date(startDate.getTime() + (event.duration || 2) * 60 * 60 * 1000);

    const formatGoogleDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
        details: event.description || 'Event booking confirmation',
        location: `${event.venue}, ${event.location}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Calendar URL
 */
export const getOutlookCalendarUrl = (event: CalendarEvent): string => {
    const startDate = new Date(`${event.date}T${event.time}`);
    const endDate = new Date(startDate.getTime() + (event.duration || 2) * 60 * 60 * 1000);

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: event.title,
        startdt: startDate.toISOString(),
        enddt: endDate.toISOString(),
        body: event.description || 'Event booking confirmation',
        location: `${event.venue}, ${event.location}`,
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

export default {
    generateICSFile,
    getGoogleCalendarUrl,
    getOutlookCalendarUrl
};
