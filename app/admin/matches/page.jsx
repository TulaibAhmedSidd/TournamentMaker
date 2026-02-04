'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ActiveMatchList, apiCall } from '@/component/admin/AdminShared';
import { Zap } from 'lucide-react';

export default function MatchesPage() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMatches = useCallback(async () => {
        setLoading(true);
        const res = await apiCall('/api/admin/match');
        setMatches(res?.data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchMatches(); }, [fetchMatches]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-brand-surface p-1 rounded-3xl border border-brand shadow-sm">
                <ActiveMatchList activeMatches={matches} isLoading={loading} onAction={fetchMatches} />
            </div>

            <div className="bg-brand-surface p-8 rounded-3xl shadow-sm border border-brand border-dashed relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Zap className="w-24 h-24 text-brand-primary" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping"></div>
                    <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em]">Live Feed Update</p>
                </div>
                <p className="text-sm font-bold text-brand-text/60 leading-relaxed max-w-2xl">
                    Brackets advance <span className="text-brand-primary">automatically</span> as victors are crowned.
                    Ensure all match results are recorded promptly to keep the momentum going.
                </p>
            </div>
        </div>
    );
}
