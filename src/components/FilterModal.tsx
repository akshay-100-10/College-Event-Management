import React from 'react';
import { X, Check } from 'lucide-react';

export interface FilterState {
    date: 'all' | 'today' | 'tomorrow' | 'weekend';
    priceRange: 'all' | 'free' | 'paid' | 'under-500' | '500-1000' | '1000+';
    categories: string[];
    sortBy: 'date' | 'price-low' | 'price-high' | 'popularity';
}

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    onApply: () => void;
    onClear: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    filters,
    setFilters,
    onApply,
    onClear
}) => {
    // Temporary state to hold changes before applying
    const [tempFilters, setTempFilters] = React.useState<FilterState>(filters);

    // Sync temp state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setTempFilters(filters);
        }
    }, [isOpen, filters]);

    const handleCategoryToggle = (category: string) => {
        setTempFilters(prev => {
            const isSelected = prev.categories.includes(category);
            return {
                ...prev,
                categories: isSelected
                    ? prev.categories.filter(c => c !== category)
                    : [...prev.categories, category]
            };
        });
    };

    const handleApply = () => {
        setFilters(tempFilters);
        onApply();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Panel */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-md z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-8">

                    {/* Sort By */}
                    <Section title="Sort By">
                        <div className="grid grid-cols-2 gap-3">
                            <RadioOption
                                label="Date: Soonest"
                                selected={tempFilters.sortBy === 'date'}
                                onClick={() => setTempFilters({ ...tempFilters, sortBy: 'date' })}
                            />
                            <RadioOption
                                label="Popularity"
                                selected={tempFilters.sortBy === 'popularity'}
                                onClick={() => setTempFilters({ ...tempFilters, sortBy: 'popularity' })}
                            />
                            <RadioOption
                                label="Price: Low to High"
                                selected={tempFilters.sortBy === 'price-low'}
                                onClick={() => setTempFilters({ ...tempFilters, sortBy: 'price-low' })}
                            />
                            <RadioOption
                                label="Price: High to Low"
                                selected={tempFilters.sortBy === 'price-high'}
                                onClick={() => setTempFilters({ ...tempFilters, sortBy: 'price-high' })}
                            />
                        </div>
                    </Section>

                    {/* Date */}
                    <Section title="Date">
                        <div className="flex flex-wrap gap-2">
                            {['all', 'today', 'tomorrow', 'weekend'].map((opt) => (
                                <FilterChip
                                    key={opt}
                                    label={opt === 'all' ? 'Any Date' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                                    selected={tempFilters.date === opt}
                                    onClick={() => setTempFilters({ ...tempFilters, date: opt as any })}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Price Range */}
                    <Section title="Price Range">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all', label: 'Any Price' },
                                { id: 'free', label: 'Free' },
                                { id: 'paid', label: 'Paid' },
                                { id: 'under-500', label: 'Under ₹500' },
                                { id: '500-1000', label: '₹500 - ₹1000' },
                                { id: '1000+', label: '₹1000+' },
                            ].map((opt) => (
                                <FilterChip
                                    key={opt.id}
                                    label={opt.label}
                                    selected={tempFilters.priceRange === opt.id}
                                    onClick={() => setTempFilters({ ...tempFilters, priceRange: opt.id as any })}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Categories */}
                    <Section title="Categories">
                        <div className="grid grid-cols-2 gap-3">
                            {['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'].map(cat => (
                                <CheckboxOption
                                    key={cat}
                                    label={cat}
                                    selected={tempFilters.categories.includes(cat)}
                                    onClick={() => handleCategoryToggle(cat)}
                                />
                            ))}
                        </div>
                    </Section>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex gap-4">
                    <button
                        onClick={() => {
                            onClear();
                            onClose();
                        }}
                        className="px-6 py-3 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        Clear All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

// UI Helpers
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">{title}</h3>
        {children}
    </div>
);

const FilterChip = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selected
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
    >
        {label}
    </button>
);

const RadioOption = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <div
        onClick={onClick}
        className={`cursor-pointer px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${selected
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}
    >
        <span className="text-sm font-medium">{label}</span>
        {selected && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
    </div>
);

const CheckboxOption = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <div
        onClick={onClick}
        className={`cursor-pointer px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${selected
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}
    >
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400 bg-white dark:bg-gray-800'
            }`}>
            {selected && <Check size={12} className="text-white" />}
        </div>
        <span className="text-sm font-medium">{label}</span>
    </div>
);

export default FilterModal;
