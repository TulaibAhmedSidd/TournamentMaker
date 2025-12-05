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
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-2xl border border-indigo-100">
                <div className="text-center">
                    <LogIn className="w-10 h-10 mx-auto text-indigo-600" />
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                        Admin Login
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to access the Tournament Control Panel
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="********"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${loading
                                    ? 'bg-indigo-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
                                }`}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <LogIn className="w-5 h-5 mr-2" />
                            )}
                            {loading ? 'Logging In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}