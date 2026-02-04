'use client';
import React from 'react';
import { Sliders, Bell, Shield, Database, Palette, Check } from 'lucide-react';
import { useTheme } from '@/app/lib/ThemeContext';

export default function SettingsPage() {
    const { currentTheme, setCurrentTheme, themes } = useTheme();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-brand-primary" /> Appearance & Theme</h2>
                <p className="text-sm text-brand-muted mb-6">Select a color palette for the entire application. This affects both the admin and public views.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {Object.entries(themes).map(([key, theme]) => (
                        <button
                            key={key}
                            onClick={() => setCurrentTheme(key)}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${currentTheme === key
                                    ? 'border-brand-primary bg-brand-background shadow-md'
                                    : 'border-brand hover:border-brand-secondary bg-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full shadow-inner"
                                    style={{ backgroundColor: theme.primary }}
                                />
                                <span className={`font-bold text-sm ${currentTheme === key ? 'text-brand-primary' : 'text-gray-600'}`}>
                                    {theme.name}
                                </span>
                            </div>
                            {currentTheme === key && <Check className="w-5 h-5 text-brand-primary" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Sliders className="w-5 h-5 text-brand-primary" /> System Settings</h2>
                <p className="text-sm text-brand-muted mb-6">Manage global configurations for the TournamentMaker system.</p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-brand-background rounded-xl border border-brand">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Bell className="w-4 h-4" /></div>
                            <div>
                                <p className="font-semibold text-brand-text text-sm">Email Notifications</p>
                                <p className="text-[10px] text-brand-muted">Send automatic updates to players about match schedules.</p>
                            </div>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked />
                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-brand-background rounded-xl border border-brand opacity-60">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600"><Shield className="w-4 h-4" /></div>
                            <div>
                                <p className="font-semibold text-brand-text text-sm">Advanced Security</p>
                                <p className="text-[10px] text-brand-muted">Enable multi-factor authentication for admin accounts.</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase">Coming Soon</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .toggle-checkbox:checked {
                    right: 0;
                    border-color: var(--brand-primary);
                }
                .toggle-checkbox:checked + .toggle-label {
                    background-color: var(--brand-primary);
                }
                .toggle-checkbox {
                    right: 4px;
                    top: 0;
                    transition: all 0.3s;
                }
                .toggle-label {
                    border: 1px solid var(--brand-border);
                }
            `}</style>
        </div>
    );
}
