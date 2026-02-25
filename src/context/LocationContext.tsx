import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LocationContextType {
    selectedLocation: string | null;
    setSelectedLocation: (location: string) => void;
    isLocationModalOpen: boolean;
    setIsLocationModalOpen: (isOpen: boolean) => void;
    availableLocations: City[];
}

export interface City {
    name: string;
    image: string;
}

// Popular Indian cities for the demo
export const POPULAR_CITIES: City[] = [
    { name: 'Mumbai', image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&q=80&w=300' },
    { name: 'Delhi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=300' },
    { name: 'Bangalore', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=300' },
    { name: 'Hyderabad', image: 'https://images.unsplash.com/photo-1605218427368-35b82a356391?auto=format&fit=crop&q=80&w=300' },
    { name: 'Chennai', image: 'https://images.unsplash.com/photo-1582510003544-524378f1dd33?auto=format&fit=crop&q=80&w=300' },
    { name: 'Pune', image: 'https://images.unsplash.com/photo-1616853633857-e9fe72559551?auto=format&fit=crop&q=80&w=300' },
    { name: 'Kolkata', image: 'https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?auto=format&fit=crop&q=80&w=300' },
    { name: 'Ahmedabad', image: 'https://images.unsplash.com/photo-1599709949622-c4513720c229?auto=format&fit=crop&q=80&w=300' },
    { name: 'Kochi', image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=300' },
];

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedLocation, setSelectedLocationState] = useState<string | null>(() => {
        return localStorage.getItem('selectedLocation');
    });
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [availableLocations, setAvailableLocations] = useState<City[]>(POPULAR_CITIES);

    useEffect(() => {
        // If no location is selected, open the modal
        if (!selectedLocation) {
            setIsLocationModalOpen(true);
        }
    }, [selectedLocation]);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            // Get all unique locations from events
            const { data, error } = await supabase
                .from('events')
                .select('location')
                .eq('status', 'approved')
                .not('location', 'is', null);

            let uniqueLocations: string[] = [];

            if (!error && data) {
                uniqueLocations = Array.from(new Set(data.map((item: any) => item.location)))
                    .filter((loc): loc is string => typeof loc === 'string' && loc.length > 0);
            }

            // Merge dynamic locations with popular cities
            // Start with POPULAR_CITIES names
            const allCityNames = new Set(POPULAR_CITIES.map(c => c.name));

            // Add dynamic locations to the set (handling case sensitivity if needed, but keeping simple for now)
            uniqueLocations.forEach(loc => allCityNames.add(loc));

            const sortedCityNames = Array.from(allCityNames).sort();

            // Create City objects
            const mergedCities: City[] = sortedCityNames.map(name => {
                // Check if it's a popular city to get the image
                const popularCity = POPULAR_CITIES.find(c => c.name.toLowerCase() === name.toLowerCase());
                return {
                    name: name,
                    image: popularCity?.image || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=300'
                };
            });

            // Add "All Locations" at the beginning
            const allLocationsOption: City = {
                name: 'All Locations',
                image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300' // Globe/Map image
            };

            setAvailableLocations([allLocationsOption, ...mergedCities]);

        } catch (error) {
            console.error('Error fetching locations:', error);
            // Fallback to popular cities
            const allLocationsOption: City = {
                name: 'All Locations',
                image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300'
            };
            setAvailableLocations([allLocationsOption, ...POPULAR_CITIES]);
        }
    };

    const setSelectedLocation = (location: string) => {
        setSelectedLocationState(location);
        localStorage.setItem('selectedLocation', location);
        setIsLocationModalOpen(false);
    };

    return (
        <LocationContext.Provider
            value={{
                selectedLocation,
                setSelectedLocation,
                isLocationModalOpen,
                setIsLocationModalOpen,
                availableLocations,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
