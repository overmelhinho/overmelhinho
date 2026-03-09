'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocationContextType {
    cityId: number | null;
    cityName: string | null;
    coords: { lat: number; lng: number } | null;
    isLoading: boolean;
    setCity: (id: number, name: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cityId, setCityId] = useState<number | null>(null);
    const [cityName, setCityName] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const setCity = (id: number, name: string) => {
        setCityId(id);
        setCityName(name);
        localStorage.setItem('user_city', JSON.stringify({ id, name }));
    };

    useEffect(() => {
        const detectLocation = async () => {
            setIsLoading(true);

            // 1. Tentar ler do localStorage
            const stored = localStorage.getItem('user_city');
            if (stored) {
                const { id, name } = JSON.parse(stored);
                setCityId(id);
                setCityName(name);
                setIsLoading(false);
                return;
            }

            // 2. Tentar Browser Geolocation
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        setCoords({ lat: latitude, lng: longitude });

                        // Tentar buscar a cidade via IP-API (mais rápido e sem chave pros testes agora)
                        try {
                            const res = await fetch('https://ipapi.co/json/');
                            const data = await res.json();
                            if (data.city) {
                                setCityName(data.city);
                            }
                        } catch (e) {
                            console.error("Erro ao cruzar dados de localização", e);
                        }
                        setIsLoading(false);
                    },
                    async () => {
                        // Fallback IP-API se o usuário negar geolocalização
                        try {
                            const res = await fetch('https://ipapi.co/json/');
                            const data = await res.json();
                            if (data?.city) setCityName(data.city);
                        } catch {
                            // Falha silenciosa: extensão ou rede bloqueou a requisição
                        } finally {
                            setIsLoading(false);
                        }
                    }
                );
            } else {
                setIsLoading(false);
            }
        };

        detectLocation();
    }, []);

    return (
        <LocationContext.Provider value={{ cityId, cityName, coords, isLoading, setCity }}>
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
