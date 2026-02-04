'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Loader2, Mail, ExternalLink } from 'lucide-react';
import { apiCall } from '@/component/admin/AdminShared';

export default function PlayersPage() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPlayers = useCallback(async () => {
        setLoading(true);
        const result = await apiCall('/api/admin/player/list');
        setPlayers(result?.data?.players || result?.players || []);
        setLoading(false);
    }, []);

    const bulkAdd = async () => {
        await apiCall('/api/player/bulk', 'POST');
        fetchPlayers();
    };

    useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

    return (
        <div className="bg-brand-surface p-8 rounded-3xl shadow-sm border border-brand">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-brand-background rounded-2xl text-brand-primary border border-brand">
                            <Users className="w-6 h-6 border-brand-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-brand-text tracking-tight uppercase">Player <span className="text-brand-primary">Directory</span></h2>
                    </div>
                    <p className="text-xs font-bold text-brand-muted uppercase tracking-widest ml-14">Community Index</p>
                </div>
                <button
                    onClick={bulkAdd}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-brand-primary text-white rounded-2xl hover:bg-brand-secondary transition-all shadow-lg font-black text-xs uppercase tracking-widest active:scale-[0.98]"
                >
                    <UserPlus className="w-4 h-4" /> Seed Test Users
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {players.map(p => (
                        <div key={p._id} className="p-6 rounded-2xl border border-brand bg-brand-background/40 hover:bg-brand-background transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/5 rounded-full -mr-10 -mt-10 group-hover:bg-brand-primary/10 transition-all"></div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className="min-w-0">
                                    <p className="font-black text-brand-text text-lg tracking-tight truncate group-hover:text-brand-primary transition-colors">{p.name}</p>
                                    <p className="text-xs font-bold text-brand-muted flex items-center gap-2 mt-2 truncate"><Mail className="w-3.5 h-3.5 text-brand-primary/60" /> {p.email}</p>
                                </div>
                                <div className="p-3 bg-brand-surface rounded-xl border border-brand shadow-sm transition-transform group-hover:rotate-12">
                                    <Users className="w-5 h-5 text-brand-muted group-hover:text-brand-primary" />
                                </div>
                            </div>
                            <div className="mt-8 pt-4 border-t border-brand flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-brand-muted/60 relative z-10">
                                <span>UID: {p._id.slice(-8)}</span>
                                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {players.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-brand-background rounded-3xl border border-dashed border-brand">
                            <Users className="w-12 h-12 text-brand-muted mx-auto mb-4 opacity-10" />
                            <p className="text-brand-muted font-bold italic">No participants found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
