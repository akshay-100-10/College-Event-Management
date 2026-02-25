
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FixProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<string | React.ReactNode>('Checking...');

    useEffect(() => {
        const fix = async () => {
            if (!user) {
                setStatus(
                    <div>
                        <p className="mb-4">Not logged in.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition"
                        >
                            Log In to Repair
                        </button>
                    </div>
                );
                return;
            }

            setStatus(`Found user: ${user.email}. Checking profile...`);

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (profile) {
                setStatus('Profile already exists. Updating role to college...');
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ role: 'college' })
                    .eq('id', user.id);

                if (updateError) {
                    setStatus('Error updating role: ' + updateError.message);
                } else {
                    setStatus('Success! Role updated to college. Redirecting...');
                    setTimeout(() => navigate('/college'), 2000);
                }
            } else {
                setStatus('No profile found. Creating college profile...');
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: user.id,
                            email: user.email,
                            full_name: user.user_metadata?.full_name || 'Christ College',
                            role: 'college'
                        }
                    ]);

                if (insertError) {
                    setStatus('Error creating profile: ' + insertError.message);
                } else {
                    setStatus('Success! Profile created. Redirecting...');
                    setTimeout(() => navigate('/college'), 2000);
                }
            }
        };

        fix();
    }, [user, navigate]);

    return (
        <div className="fixed inset-0 min-h-screen w-full flex flex-col items-center justify-center bg-white text-black p-4 z-[9999]">
            <div className="max-w-md w-full text-center space-y-6">
                <h1 className="text-3xl font-black text-black">Profile Repair Tool</h1>

                <div className="p-6 bg-gray-100 border-2 border-gray-300 rounded-xl text-lg font-medium text-black shadow-sm">
                    {status}
                </div>

                <button
                    onClick={() => navigate('/home')}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                    Return to Home
                </button>
            </div>
        </div>
    );
};

export default FixProfile;
