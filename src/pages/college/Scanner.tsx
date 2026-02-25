import { useState, useEffect } from 'react';
import { Scanner as QrScanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';

const Scanner = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'warning'>('idle');
    const [message, setMessage] = useState<string>('Ready to scan');
    const [ticketDetails, setTicketDetails] = useState<any>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        // Only allow college/admin to access
        if (profile && profile.role !== 'college' && profile.role !== 'admin') {
            navigate('/home');
        }
    }, [profile, navigate]);

    const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
        if (detectedCodes.length === 0 || isPaused) return;

        const rawValue = detectedCodes[0].rawValue;
        if (!rawValue) return;

        setIsPaused(true);
        validateTicket(rawValue);
    };

    const validateTicket = async (qrCodeData: string) => {
        setStatus('loading');
        setMessage('Verifying ticket...');

        try {
            // OPTIMISTIC UI: Play a beep sound here if we had one

            const { data, error } = await supabase.rpc('check_in_ticket', {
                p_qr_code_data: qrCodeData,
                p_organizer_id: profile?.id
            });

            if (error) throw error;

            console.log("Scan Response:", data);

            // Based on the SQL function check_in_ticket:
            // returns jsonb with success, message, ticket_id, etc.

            if (data.success) {
                setStatus('success');
                setMessage('Access Granted');
                setTicketDetails(data.ticket); // Assuming RPC returns ticket info
            } else {
                // Determine type of error
                if (data.message.includes('already used')) {
                    setStatus('warning');
                    setMessage('Already Scanned!');
                    setTicketDetails(data.ticket);
                } else if (data.message.includes('not found') || data.message.includes('Invalid')) {
                    setStatus('error');
                    setMessage('Invalid Ticket');
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Check-in failed');
                }
            }

        } catch (err: any) {
            console.error('Scan error:', err);
            setStatus('error');
            setMessage(err.message || 'System Error');
        }
    };

    const resetScanner = () => {
        setIsPaused(false);
        setStatus('idle');
        setMessage('Ready to scan');
        setTicketDetails(null);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-20">
                <Link to="/college" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </Link>
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Ticket Scanner
                </h1>
                <div className="w-8"></div> {/* Spacer */}
            </div>

            {/* Scanner Viewport / Status View */}
            <div className="flex-1 relative flex flex-col">
                {!isPaused ? (
                    <div className="flex-1 relative overflow-hidden bg-gray-950">
                        <QrScanner
                            onScan={handleScan}
                            onError={(error: any) => console.log(error?.message)}
                            components={{ finder: false }}
                            styles={{
                                container: { width: '100%', height: '100%' },
                                video: { width: '100%', height: '100%', objectFit: 'cover' }
                            }}
                        />

                        {/* Custom Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-64 border-2 border-indigo-500/50 rounded-3xl relative">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                                {/* Scanning Laser Animation */}
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)] animate-scan"></div>
                            </div>
                        </div>

                        <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
                            <p className="inline-block bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium text-gray-300 border border-white/10">
                                Point camera at QR Code
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={`flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300 ${status === 'success' ? 'bg-green-950/30' :
                        status === 'warning' ? 'bg-yellow-950/30' :
                            status === 'error' ? 'bg-red-950/30' : 'bg-gray-900'
                        }`}>

                        {status === 'loading' && (
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
                        )}

                        {status === 'success' && (
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/50">
                                <CheckCircle size={48} className="text-white" />
                            </div>
                        )}

                        {status === 'warning' && (
                            <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/50">
                                <AlertTriangle size={48} className="text-white" />
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/50">
                                <XCircle size={48} className="text-white" />
                            </div>
                        )}

                        <h2 className="text-3xl font-bold mb-2">{message}</h2>

                        {ticketDetails && (
                            <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 max-w-sm w-full">
                                <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Event</p>
                                <p className="font-bold text-lg mb-3">{ticketDetails.event_title || 'Unknown Event'}</p>

                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div>
                                        <p className="text-gray-400 text-xs">Guest</p>
                                        <p className="font-medium">{ticketDetails.user_email || 'Guest'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Seat</p>
                                        <p className="font-medium">#{ticketDetails.seat_number || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status !== 'loading' && (
                            <Button
                                onClick={resetScanner}
                                size="lg"
                                className="mt-12 bg-white text-black hover:bg-gray-200 min-w-[200px] shadow-xl"
                            >
                                <RefreshCw size={20} className="mr-2" />
                                Scan Next
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Scanner;
