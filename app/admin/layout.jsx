'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import AdminSidebar from '@/component/admin/AdminSidebar';

export default function AdminLayout({ children }) {
    const [isAdmin, setIsAdmin] = useState(null);
    const [userlocal, setUserlocal] = useState(null);
    const [error, setError] = useState(null);

    const logout = async () => {
        localStorage.clear();
        sessionStorage.clear();
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.replace('/admin/login');
        } catch (err) {
            console.error('Logout failed:', err);
            window.location.replace('/admin/login');
        }
    };

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await fetch('/api/tournament/winners', { cache: 'no-store' });
                if (response.ok) {
                    setIsAdmin(true);
                    if (typeof window !== 'undefined') {
                        const user = localStorage.getItem('user');
                        setUserlocal(user ? JSON.parse(user) : null);
                    }
                } else if (response.status === 401 || response.status === 403) {
                    setIsAdmin(false);
                    window.location.href = '/admin/login';
                } else {
                    setIsAdmin(false);
                    setError("Server error during initial auth check.");
                }
            } catch (err) {
                setIsAdmin(false);
                window.location.href = '/admin/login';
            }
        };
        checkAuthStatus();
    }, []);

    if (isAdmin === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-background p-4 sm:p-8">
            <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 flex-wrap">
                <AdminSidebar logout={logout} />
                <main className="flex-1 min-w-0">
                    <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-brand-surface rounded-2xl border border-brand shadow-sm">
                        <div>
                            <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">Admin <span className="text-brand-primary">Portal</span></h1>
                            <p className="mt-1 text-sm text-brand-muted font-medium italic">Manage tournaments, players, and winners.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-brand-background px-4 py-2 rounded-xl border border-brand">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest leading-none">Connected as</p>
                                <p className="text-sm font-bold text-brand-primary">{userlocal?.name || 'Admin User'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center font-black text-brand-primary uppercase">
                                {userlocal?.name?.[0] || 'A'}
                            </div>
                        </div>
                    </header>
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
