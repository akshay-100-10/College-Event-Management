import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
    Ticket,
    Calendar,
    MapPin,
    Clock,
    ArrowLeft,
    Download,
    AlertCircle,
    Users,
    ExternalLink,
    CheckCircle2,
    XCircle as XCircleIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CollegeSidebar from '../../components/college/Sidebar';
import { Button } from '../../components/ui';
import { AddToCalendarButton } from '../../components/ShareButtons';
import jsPDF from 'jspdf';
import QRCode from 'react-qr-code';
import type { BookingTicket, Event } from '../../types';

interface TicketData extends BookingTicket {
    bookings: {
        events: Event;
    };
}

const MyBookings = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // External (Google Form) registrations
    interface ExtReg {
        id: string;
        status: string;
        created_at: string;
        events: {
            id: string;
            title: string;
            date: string;
            time: string;
            venue: string;
            category: string;
            external_registration_url: string;
        };
    }
    const [extRegs, setExtRegs] = useState<ExtReg[]>([]);

    useEffect(() => {
        if (user) {
            fetchBookings();
            fetchExtRegs();
        }
    }, [user]);

    const fetchExtRegs = async () => {
        const { data } = await supabase
            .from('external_registrations')
            .select(`
                id, status, created_at,
                events (
                    id, title, date, time, venue, category, external_registration_url
                )
            `)
            .order('created_at', { ascending: false });
        setExtRegs((data as unknown as ExtReg[]) || []);
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            // Fetch individual tickets with event details
            // We join booking_tickets -> bookings -> events
            const { data, error } = await supabase
                .from('booking_tickets')
                .select(`
                    *,
                    bookings!inner (
                        events!inner (*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (err: any) {
            console.error('Error fetching tickets:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = (ticket: TicketData) => {
        const doc = new jsPDF();
        const event = ticket.bookings.events;

        // Add College Event Header
        doc.setFillColor(79, 70, 229); // Indigo 600
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("EVENT TICKET", 105, 25, { align: 'center' });

        // Event Title & Category
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(24);
        doc.text(event.title, 20, 60);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(event.category.toUpperCase(), 20, 70);

        // Details Section
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 75, 190, 75);

        // Event Details Grid
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        // Row 1
        doc.setFont('helvetica', 'bold');
        doc.text("DATE", 20, 90);
        doc.text("TIME", 110, 90);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(event.date).toLocaleDateString(), 20, 100);
        doc.text(event.time, 110, 100);

        // Row 2
        doc.setFont('helvetica', 'bold');
        doc.text("VENUE", 20, 120);
        doc.text("LOCATION", 110, 120);
        doc.setFont('helvetica', 'normal');
        // Handle long venue names by splitting lines
        const venueLines = doc.splitTextToSize(event.venue, 80);
        doc.text(venueLines, 20, 130);
        const locationLines = doc.splitTextToSize(event.location, 80);
        doc.text(locationLines, 110, 130);

        // Row 3
        doc.setFont('helvetica', 'bold');
        doc.text("TICKET ID", 20, 150);
        doc.text("SEAT", 110, 150);
        doc.setFont('helvetica', 'normal');
        doc.text(ticket.qr_code_data, 20, 160);
        doc.text(`Seat ${ticket.seat_number}`, 110, 160);

        // Row 4
        doc.setFont('helvetica', 'bold');
        doc.text("PRICE", 20, 180);
        doc.setFont('helvetica', 'normal');
        doc.text(event.price === 0 ? "FREE" : `Rs. ${event.price}`, 20, 190);

        // Footer
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 200, 190, 200);

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Please show this ticket at the event entrance.", 105, 210, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 215, { align: 'center' });

        // Save PDF
        doc.save(`${event.title.replace(/\s+/g, '_')}_Ticket_${ticket.seat_number}.pdf`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 relative overflow-hidden transition-colors duration-300">
            <CollegeSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Navbar */}
            <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-50 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/home" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        CollegeEvents
                    </Link>
                    <Link to="/home" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-10">
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                        <Ticket className="text-indigo-600 dark:text-indigo-400" />
                        My Bookings
                    </h1>
                    <span className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-1 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400">
                        {tickets.length} Tickets
                    </span>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-8 flex items-center gap-3">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {tickets.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-700 border-dashed">
                        <Ticket size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No tickets yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">You haven't booked any events yet. Start exploring!</p>
                        <Link
                            to="/home"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                        >
                            Browse Events
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {tickets.map((ticket) => {
                            const event = ticket.bookings.events;
                            return (
                                <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row hover:border-gray-300 dark:hover:border-gray-600 transition-all group shadow-sm hover:shadow-md">
                                    {/* Ticket Left: Info */}
                                    <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 border-dashed relative">
                                        {/* Punch Holes */}
                                        <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 dark:bg-gray-950 rounded-full border border-gray-200 dark:border-gray-700 z-10"></div>

                                        <div className="flex justify-between items-start mb-6">
                                            <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">
                                                {event.category}
                                            </span>
                                            <div className="text-right">
                                                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">
                                                    Booked on {new Date(ticket.created_at).toLocaleDateString()}
                                                </span>
                                                {ticket.checked_in && (
                                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center justify-end gap-1 mt-1">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        Checked In
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {event.title}
                                        </h2>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">Date & Time</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                    {event.date}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <Clock size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                    {event.time}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">Venue & Location</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <MapPin size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                    <span className="font-bold">{event.venue}</span>
                                                </div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500 ml-5">
                                                    {event.location}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">Seat</p>
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                                                    <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                    Number {ticket.seat_number}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">Price</p>
                                                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                                                    {event.price === 0 ? 'FREE' : `₹${event.price}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ticket Right: QR Code */}
                                    <div className="w-full md:w-64 p-8 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-4 border-l border-gray-200 dark:border-gray-700">
                                        <div className="bg-white p-3 rounded-2xl shadow-xl">
                                            <QRCode
                                                value={ticket.qr_code_data}
                                                size={120}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                viewBox={`0 0 256 256`}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest mb-1">DATA</p>
                                            <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 break-all max-w-[150px]">{ticket.qr_code_data}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleDownloadPDF(ticket)}
                                                className="w-full flex items-center justify-center gap-2 text-xs"
                                            >
                                                <Download size={14} />
                                                Download PDF
                                            </Button>
                                            <div className="scale-90 w-full">
                                                <AddToCalendarButton
                                                    event={event}
                                                    bookingId={ticket.id}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── External (Google Form) Registrations ──────────────────── */}
                {extRegs.length > 0 && (
                    <div className="mt-14">
                        <div className="flex items-center gap-3 mb-6">
                            <ExternalLink size={22} className="text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">External Registrations</h2>
                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                Google Form
                            </span>
                        </div>
                        <div className="space-y-4">
                            {extRegs.map((reg) => {
                                const ev = reg.events;
                                const statusConfig = {
                                    self_reported: { label: 'Pending Verification', color: 'amber', icon: Clock },
                                    verified: { label: 'Verified ✓', color: 'green', icon: CheckCircle2 },
                                    rejected: { label: 'Rejected', color: 'red', icon: XCircleIcon },
                                }[reg.status] ?? { label: reg.status, color: 'gray', icon: Clock };
                                const StatusIcon = statusConfig.icon;
                                return (
                                    <div key={reg.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">
                                                    {ev.category}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{ev.title}</h3>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                <span className="flex items-center gap-1"><Calendar size={13} />{ev.date}</span>
                                                <span className="flex items-center gap-1"><Clock size={13} />{ev.time}</span>
                                                <span className="flex items-center gap-1"><MapPin size={13} />{ev.venue}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${statusConfig.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                                                    statusConfig.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                                                        statusConfig.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                                                            'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                                                }`}>
                                                <StatusIcon size={13} />
                                                {statusConfig.label}
                                            </span>
                                            <a
                                                href={ev.external_registration_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 underline flex items-center gap-1 transition-colors"
                                            >
                                                <ExternalLink size={11} /> Open form
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyBookings;
