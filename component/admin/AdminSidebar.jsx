'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Trophy, Users, CheckCircle, List,
    PanelLeft, Sliders, Clock, UserCheck, LogOut
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, href, active }) => (
    <Link href={href} className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 font-bold text-sm tracking-tight ${active
            ? 'bg-brand-primary text-white shadow-[0_4px_12px_rgba(var(--brand-primary-rgb),0.3)] scale-[1.02]'
            : 'text-brand-muted hover:bg-brand-background hover:text-brand-primary'
        }`}>
        <Icon className="w-5 h-5" />
        <span>{label}</span>
    </Link>
);

export default function AdminSidebar({ logout }) {
    const pathname = usePathname();

    return (
        <aside className="w-full lg:w-72 flex-shrink-0 animate-in slide-in-from-left duration-700">
            <div className="sticky top-8 space-y-6">
                <div className="bg-brand-surface p-6 rounded-3xl shadow-sm border border-brand">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-background rounded-2xl border border-brand">
                            <PanelLeft className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-brand-text uppercase leading-none">System</h3>
                            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1">Navigation</p>
                        </div>
                    </div>
                </div>

                <div className="bg-brand-surface p-4 rounded-3xl shadow-sm border border-brand space-y-1">
                    <SidebarItem icon={List} label="Overview" href="/admin" active={pathname === '/admin'} />
                    <SidebarItem icon={Trophy} label="Brackets" href="/admin/tournaments" active={pathname === '/admin/tournaments'} />
                    <SidebarItem icon={Users} label="Player Directory" href="/admin/players" active={pathname === '/admin/players'} />
                    <SidebarItem icon={CheckCircle} label="Active Matches" href="/admin/matches" active={pathname === '/admin/matches'} />
                    <SidebarItem icon={UserCheck} label="Hall of Fame" href="/admin/winners" active={pathname === '/admin/winners'} />
                    <SidebarItem icon={Sliders} label="Preferences" href="/admin/settings" active={pathname === '/admin/settings'} />
                </div>

                <div className="bg-brand-surface p-4 rounded-3xl shadow-sm border border-brand">
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-brand-text bg-brand-background border border-brand hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-black text-xs uppercase tracking-widest shadow-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Terminte Session
                    </button>
                </div>
            </div>
        </aside>
    );
}
