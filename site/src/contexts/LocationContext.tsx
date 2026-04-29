'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocationContextType {
    cityId: number | null;
    cityName: string | null;
    coords: { lat: number; lng: number } | null;
    isLoading: boolean;
    setCity: (id: number, name: string) => void;
    isCityModalOpen: boolean;
    setIsCityModalOpen: (open: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cityId, setCityId] = useState<number | null>(null);
    const [cityName, setCityName] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);

    const setCity = (id: number, name: string) => {
        setCityId(id);
        setCityName(name);
        localStorage.setItem('user_city', JSON.stringify({ id, name }));
    };

    useEffect(() => {
        const detectLocation = async () => {
            setIsLoading(true);

            // 1. Tentar ler do localStorage primeiro
            const stored = localStorage.getItem('user_city');
            if (stored) {
                try {
                    const { id, name } = JSON.parse(stored);
                    setCityId(id);
                    setCityName(name);
                } catch {
                    localStorage.removeItem('user_city');
                }
                setIsLoading(false);
                return;
            }

            // 2. Tentar Browser Geolocation (apenas GPS, sem chamadas externas)
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setCoords({ lat: latitude, lng: longitude });
                        // Cidade será selecionada manualmente pelo usuário via modal
                        setIsLoading(false);
                    },
                    () => {
                        // Usuário negou geolocalização — encerra silenciosamente
                        // O usuário pode selecionar a cidade pelo modal
                        setIsLoading(false);
                    },
                    { timeout: 5000, maximumAge: 60000 }
                );
            } else {
                setIsLoading(false);
            }
        };

        detectLocation();
    }, []);

    return (
        <LocationContext.Provider value={{ cityId, cityName, coords, isLoading, setCity, isCityModalOpen, setIsCityModalOpen }}>
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
