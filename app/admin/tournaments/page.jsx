'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { GameForm, GameList, apiCall } from '@/component/admin/AdminShared';

export default function TournamentsPage() {
    const [games, setGames] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [gamesRes, playersRes] = await Promise.all([
            apiCall('/api/admin/game'),
            apiCall('/api/admin/player/list')
        ]);
        setGames(gamesRes?.data || []);
        setPlayers(playersRes?.data?.players || playersRes?.players || []);
        setLoading(false);
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this tournament?')) return;
        const res = await apiCall(`/api/admin/game/${id}`, 'DELETE');
        if (res?.success) fetchData();
    };

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
                <GameForm onGameCreated={fetchData} />
            </div>
            <div className="lg:col-span-8">
                <GameList games={games} isLoading={loading} onAction={fetchData} allPlayers={players} onDelete={handleDelete} />
            </div>
        </div>
    );
}
