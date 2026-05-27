import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import socket from '../services/socket';

const TrackingContext = createContext();

export const useTracking = () => useContext(TrackingContext);

export const TrackingProvider = ({ children }) => {
    const [globalLocation, setGlobalLocation] = useState(null);
    const [isGlobalFollowing, setIsGlobalFollowing] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const watcherRef = useRef(null);

    // Watch position whenever broadcasting or following is enabled
    useEffect(() => {
        if ((isGlobalFollowing || isBroadcasting) && navigator.geolocation) {
            watcherRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLoc = { lat: latitude, lng: longitude };
                    setGlobalLocation(newLoc);
                    setPermissionError(null);
                },
                (err) => {
                    console.error("Global Geolocation Error:", err);
                    setPermissionError(err.message);
                    setIsGlobalFollowing(false);
                    setIsBroadcasting(false);
                },
                { enableHighAccuracy: true, maximumAge: 1000 }
            );
        } else {
            if (watcherRef.current) {
                navigator.geolocation.clearWatch(watcherRef.current);
                watcherRef.current = null;
            }
        }

        return () => {
            if (watcherRef.current) navigator.geolocation.clearWatch(watcherRef.current);
        };
    }, [isGlobalFollowing, isBroadcasting]);

    const value = {
        globalLocation,
        isGlobalFollowing,
        setIsGlobalFollowing,
        isBroadcasting,
        setIsBroadcasting,
        permissionError
    };

    return (
        <TrackingContext.Provider value={value}>
            {children}
        </TrackingContext.Provider>
    );
};
