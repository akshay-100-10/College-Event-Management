import React from 'react';
import { X, MapPin, Search } from 'lucide-react';
import { useLocation } from '../context/LocationContext';


const LocationModal = () => {
    const { isLocationModalOpen, setIsLocationModalOpen, setSelectedLocation, selectedLocation, availableLocations } = useLocation();
    const [searchTerm, setSearchTerm] = React.useState('');

    if (!isLocationModalOpen) return null;

    const filteredCities = availableLocations.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl mx-4 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pick a Location</h2>
                        {!selectedLocation && (
                            <p className="text-red-500 text-sm font-medium animate-pulse">Please select a location to continue</p>
                        )}
                        {selectedLocation && (
                            <button
                                onClick={() => setIsLocationModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                            >
                                <X size={24} />
                            </button>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search for your city"
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-12 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Cities Grid */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {searchTerm && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Search Results</h3>
                            {filteredCities.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No cities found matching "{searchTerm}"
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {filteredCities.map((city) => (
                                        <button
                                            key={city.name}
                                            onClick={() => setSelectedLocation(city.name)}
                                            className="group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <div className="hidden">{city.name}</div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{city.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!searchTerm && (
                        <>
                            <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                                <MapPin size={18} />
                                <span className="text-sm font-semibold uppercase tracking-wider">Popular Cities</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                                {availableLocations.map((city) => (
                                    <button
                                        key={city.name}
                                        onClick={() => setSelectedLocation(city.name)}
                                        className="group flex flex-col items-center gap-3"
                                    >
                                        <div className={`relative w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-indigo-500 transition-all shadow-md group-hover:shadow-lg ${selectedLocation === city.name ? 'border-indigo-600 ring-2 ring-indigo-200' : ''}`}>
                                            <img
                                                src={city.image}
                                                alt={city.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <span className={`text-sm font-medium transition-colors ${selectedLocation === city.name ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                                            {city.name}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Cities are populated based on available events.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationModal;
