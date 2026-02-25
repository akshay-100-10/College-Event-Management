export interface Profile {
    id: string;
    email: string;
    role: 'admin' | 'college' | 'student';
    full_name: string | null;
    avatar_url: string | null;
    created_at?: string;
    // Profile Setup Wizard fields
    department?: string;
    phone?: string;
    bio?: string;
    interests?: string[];
    college_name?: string;
    college_website?: string;
    profile_complete?: boolean;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    category: string;
    total_seats: number;
    booked_seats: number;
    price: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    organizer_id: string;
    created_at: string;
    image_url?: string;
    contact_phone?: string;
    contact_email?: string;
    brochure_url?: string;
    registration_type?: 'internal' | 'external';
    external_registration_url?: string;
    profiles?: {
        full_name: string;
        email?: string;
    };
    is_liked?: boolean;
}

export interface Booking {
    id: string;
    event_id: string;
    user_id: string;
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
    };
    events: {
        title: string;
        organizer_id?: string;
    };
}

export interface SubEvent {
    id: string;
    event_id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    venue: string;
    price: number;
    total_seats: number;
    booked_seats: number;
    requires_registration: boolean;
}

export interface BookingTicket {
    id: string;
    booking_id: string;
    seat_number: number;
    qr_code_data: string;
    checked_in: boolean;
    checked_in_at?: string;
    checked_in_by?: string;
    created_at: string;
}
