'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { apiCall } from '@/component/admin/AdminShared';

const WinnerRow = ({ winner }) => (
    <div className="grid grid-cols-12 gap-4 items-center py-4 border-b last:border-b-0 hover:bg-indigo-50 transition-colors duration-150 rounded-lg px-2">
        <div className="col-span-5 font-semibold text-indigo-700 truncate">{winner.tournamentName}</div>
        <div className="col-span-3 text-sm text-gray-500">
            {new Date(winner.scheduledTime).toLocaleDateString()}
        </div>
        <div className="col-span-3 flex items-center">
            <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
            <span className="font-bold text-gray-800 truncate">
                {winner.winner?.name || 'TBD'}
            </span>
        </div>
        <div className="col-span-1 text-right">
            <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
    </div>
);

export default function WinnersPage() {
    const [winners, setWinners] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWinners = useCallback(async () => {
        setLoading(true);
        const result = await apiCall('/api/tournament/winners');
        setWinners(result?.winners || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchWinners(); }, [fetchWinners]);

    return (
        <div className="bg-brand-surface p-8 rounded-3xl shadow-sm border border-brand">
            <header className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-brand-background rounded-2xl text-brand-primary border border-brand">
                    <Trophy className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-brand-text tracking-tight uppercase">Hall of <span className="text-brand-primary">Fame</span></h2>
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1">Past Champions</p>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {winners.map(game => (
                        <div key={game._id} className="p-8 rounded-3xl border border-brand bg-brand-background/40 hover:bg-brand-background transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-brand-primary/10 transition-all duration-700"></div>

                            <Trophy className="w-10 h-10 text-brand-accent mb-6" />
                            <h3 className="text-xl font-black text-brand-text uppercase tracking-tight group-hover:text-brand-primary transition-colors">{game.tournamentName}</h3>

                            <div className="mt-6 p-4 bg-brand-surface rounded-2xl border border-brand shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-black text-xs uppercase">
                                        {(game.winner?.name?.[0] || 'W')}
                                    </div>
                                    <p className="font-bold text-brand-text truncate max-w-[150px]">{game.winner?.name || 'Champion'}</p>
                                </div>
                                <div className="text-[10px] font-black text-brand-muted uppercase tracking-widest bg-brand-background px-3 py-1 rounded-full border border-brand"> Winner </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-brand flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted/50">
                                <span>Tournament</span>
                                <span>{new Date(game.scheduledTime).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {winners.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-brand-background rounded-3xl border border-dashed border-brand">
                            <Trophy className="w-12 h-12 text-brand-muted mx-auto mb-4 opacity-10" />
                            <p className="text-brand-muted font-bold italic">No champions crowned yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
