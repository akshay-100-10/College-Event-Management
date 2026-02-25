import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { StarRating } from '../ui';
import { Button } from '../ui';
import { Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Review {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    user_id: string;
    profiles: {
        full_name: string;
    };
}

interface ReviewsSectionProps {
    eventId: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ eventId }) => {
    const { user, profile } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [comment, setComment] = useState('');

    useEffect(() => {
        fetchReviews();
    }, [eventId]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    profiles:user_id (full_name)
                `)
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to write a review');
            return;
        }
        if (userRating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert([
                    {
                        event_id: eventId,
                        user_id: user.id,
                        rating: userRating,
                        comment,
                    }
                ]);

            if (error) throw error;

            toast.success('Review submitted successfully!');
            setComment('');
            setUserRating(0);
            fetchReviews();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Star className="text-indigo-600 dark:text-indigo-400" />
                    Reviews & Ratings
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{averageRating}</span>
                    <div className="flex flex-col">
                        <StarRating rating={parseFloat(averageRating)} size={16} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{reviews.length} reviews</span>
                    </div>
                </div>
            </div>

            {/* Review Form */}
            {user && profile?.role === 'student' && (
                <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Write a Review</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                            <StarRating
                                rating={userRating}
                                interactive
                                onRatingChange={setUserRating}
                                size={24}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comment</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-32"
                                required
                            />
                        </div>
                        <Button type="submit" loading={submitting} disabled={submitting}>
                            Submit Review
                        </Button>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
                {loading ? (
                    <p className="text-gray-500 text-center">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                        <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                        {review.profiles.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{review.profiles.full_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <StarRating rating={review.rating} size={16} />
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {review.comment}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewsSection;
