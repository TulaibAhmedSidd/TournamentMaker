'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, CheckCircle, Clock, Loader2 } from 'lucide-react';
import StatCard from '@/component/admin/StatCard';
import { apiCall, ActiveMatchList } from '@/component/admin/AdminShared';

export default function Dashboard() {
    const [stats, setStats] = useState({ tournaments: 0, matches: 0, players: 0 });
    const [recentGames, setRecentGames] = useState([]);
    const [activeMatches, setActiveMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [gamesRes, matchesRes, playersRes] = await Promise.all([
            apiCall('/api/admin/game'),
            apiCall('/api/admin/match'),
            apiCall('/api/admin/player/list')
        ]);

        const games = gamesRes?.data || [];
        const matches = matchesRes?.data || [];
        const players = playersRes?.data?.players || playersRes?.players || [];

        setStats({
            tournaments: games.length,
            matches: matches.length,
            players: players.length
        });
        setRecentGames(games.slice(0, 5));
        setActiveMatches(matches);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Tournament Arena" value={stats.tournaments} icon={Trophy} />
                <StatCard title="Ongoing Battles" value={stats.matches} icon={Zap} />
                <StatCard title="Elite Players" value={stats.players} icon={Users} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-brand-surface p-8 rounded-3xl shadow-sm border border-brand">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-brand-background rounded-2xl text-brand-primary border border-brand">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-brand-text tracking-tight uppercase">Recent <span className="text-brand-primary">Events</span></h2>
                    </div>

                    <div className="space-y-4">
                        {recentGames.map(game => (
                            <div key={game._id} className="flex items-center justify-between p-5 bg-brand-background/40 hover:bg-brand-background rounded-2xl border border-brand transition-all group">
                                <div className="min-w-0">
                                    <p className="font-black text-brand-text uppercase group-hover:text-brand-primary transition-colors truncate">{game.name}</p>
                                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1">
                                        {new Date(game.scheduledTime).toLocaleDateString()} • {game.type}
                                    </p>
                                </div>
                                <span className={`px-4 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-widest shadow-sm ${game.status === 'Active' ? 'bg-brand-primary text-white shadow-brand-primary/20' :
                                        game.status === 'Completed' ? 'bg-green-500 text-white shadow-green-500/20' :
                                            'bg-brand-surface text-brand-muted border border-brand'
                                    }`}>
                                    {game.status}
                                </span>
                            </div>
                        ))}
                        {recentGames.length === 0 && (
                            <div className="py-12 text-center bg-brand-background/20 rounded-2xl border border-dashed border-brand">
                                <p className="text-brand-muted font-bold italic text-sm">No recent tournament activity.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-brand-surface p-1 rounded-3xl border border-brand shadow-sm">
                    <ActiveMatchList activeMatches={activeMatches} isLoading={loading} onAction={fetchData} />
                </div>
            </div>
        </div>
    );
}
