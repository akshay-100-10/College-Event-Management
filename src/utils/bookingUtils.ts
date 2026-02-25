// Booking utility functions for cancellation logic and validation

export interface CancellationStatus {
    canCancel: boolean;
    reason?: string;
    hoursRemaining?: number;
}

/**
 * Check if a booking can be cancelled based on event date/time and deadline
 */
export const canCancelBooking = (
    eventDate: string,
    eventTime: string,
    deadlineHours: number = 24
): CancellationStatus => {
    try {
        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        const now = new Date();
        const hoursUntilEvent = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Event has already occurred
        if (hoursUntilEvent < 0) {
            return {
                canCancel: false,
                reason: 'Event has already occurred',
                hoursRemaining: 0
            };
        }

        // Within cancellation deadline
        if (hoursUntilEvent < deadlineHours) {
            return {
                canCancel: false,
                reason: `Cancellation deadline has passed. Must cancel at least ${deadlineHours} hours before the event.`,
                hoursRemaining: Math.max(0, hoursUntilEvent)
            };
        }

        // Can cancel
        return {
            canCancel: true,
            hoursRemaining: hoursUntilEvent
        };
    } catch (error) {
        return {
            canCancel: false,
            reason: 'Invalid event date or time'
        };
    }
};

/**
 * Format hours remaining into human-readable text
 */
export const formatTimeRemaining = (hours: number): string => {
    if (hours < 1) {
        const minutes = Math.floor(hours * 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    if (hours < 24) {
        return `${Math.floor(hours)} hour${Math.floor(hours) !== 1 ? 's' : ''}`;
    }

    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
};

/**
 * Check if event is happening soon (within 24 hours)
 */
export const isEventSoon = (eventDate: string, eventTime: string): boolean => {
    try {
        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        const now = new Date();
        const hoursUntilEvent = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        return hoursUntilEvent > 0 && hoursUntilEvent <= 24;
    } catch {
        return false;
    }
};

/**
 * Check if event has passed
 */
export const hasEventPassed = (eventDate: string, eventTime: string): boolean => {
    try {
        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        const now = new Date();
        return eventDateTime < now;
    } catch {
        return false;
    }
};

export default {
    canCancelBooking,
    formatTimeRemaining,
    isEventSoon,
    hasEventPassed
};
