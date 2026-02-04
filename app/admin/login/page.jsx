'use client'
import React, { useEffect, useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';

/**
 * Standalone Login Page Component
 * This should be rendered when the user navigates to /admin/login
 */
export default function AdminLoginPage() {
    let user = null;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userlocal, setuserlocal] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Login successful. Redirect to the main protected admin page.
                // This will trigger the auth check on the main page.
                localStorage.setItem("user", JSON.stringify(data?.user))
                window.location.href = '/admin';
            } else {
                setError(data.error || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('A network error occurred during login.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    // useEffect(() => {
    //     if (typeof window != 'undefined') {
    //         user = localStorage.getItem('user')
    //         user = user ? JSON.parse(user) : null
    //         setuserlocal(user)
    //     }
    // }, [user])
    // useEffect(() => {
    //     if (!userlocal && user != null) {
    //         window.location.replace('/admin')
    //     }
    // }, [userlocal, user]);
    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-background">
            <div className="max-w-md w-full p-10 bg-brand-surface rounded-3xl shadow-xl border border-brand transition-all hover:shadow-2xl">
                <div className="text-center">
                    <div className="p-4 bg-brand-background rounded-2xl w-fit mx-auto mb-6">
                        <LogIn className="w-10 h-10 text-brand-primary" />
                    </div>
                    <h2 className="text-4xl font-black text-brand-text tracking-tight">
                        Admin Access
                    </h2>
                    <p className="mt-2 text-sm text-brand-muted font-medium">
                        Enter your credentials to manage tournaments.
                    </p>
                </div>
                <form className="mt-10 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-xs font-black text-brand-muted uppercase tracking-widest ml-1 mb-2">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full px-5 py-3 bg-brand-background border border-brand rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-xs font-black text-brand-muted uppercase tracking-widest ml-1 mb-2">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full px-5 py-3 bg-brand-background border border-brand rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                            placeholder="********"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold text-center" role="alert">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center py-4 px-6 rounded-2xl text-sm font-black tracking-widest uppercase transition-all shadow-md ${loading
                                ? 'bg-brand-secondary opacity-50 cursor-not-allowed'
                                : 'bg-brand-primary text-white hover:bg-brand-secondary active:scale-[0.98]'
                                }`}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-3" />
                            ) : (
                                <LogIn className="w-5 h-5 mr-3" />
                            )}
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
