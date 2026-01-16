'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMatchSocket, type MatchNotification } from '@/hooks/useMatchSocket';
import MatchSuccessModal from '@/components/MatchSuccessModal';

interface MatchContextValue {
    isConnected: boolean;
    lastMatch: MatchNotification | null;
}

const MatchContext = createContext<MatchContextValue>({
    isConnected: false,
    lastMatch: null,
});

export function useMatchContext() {
    return useContext(MatchContext);
}

interface MatchProviderProps {
    children: React.ReactNode;
}

export function MatchProvider({ children }: MatchProviderProps) {
    const [showModal, setShowModal] = useState(false);
    const [currentMatch, setCurrentMatch] = useState<MatchNotification | null>(null);
    const [currentUserName, setCurrentUserName] = useState<string>('You');

    const { isConnected, lastMatch, clearLastMatch } = useMatchSocket({
        onMatchFound: (notification) => {
            setCurrentMatch(notification);
            setShowModal(true);
        },
    });

    // Get current user name from localStorage
    useEffect(() => {
        const storedName = localStorage.getItem('displayName');
        if (storedName) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentUserName(storedName);
        }
    }, []);

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentMatch(null);
        clearLastMatch();
    };

    return (
        <MatchContext.Provider value={{ isConnected, lastMatch }}>
            {children}

            {/* Global Match Modal */}
            {showModal && currentMatch && (
                <MatchSuccessModal
                    match={currentMatch}
                    currentUserName={currentUserName}
                    onClose={handleCloseModal}
                />
            )}
        </MatchContext.Provider>
    );
}
