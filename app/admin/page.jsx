'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Plus, Users, Clock, Trophy, Shuffle, UserPlus, Zap, CheckCircle, ExternalLink, XCircle, UserCheck, Sidebar as LayoutSidebar, Sliders, List, ChevronRight } from 'lucide-react';

// Mock list of players for initial creation if the list is empty (API endpoint: /api/admin/player/init)
const MOCK_PLAYERS = [
    { name: 'Ali Khan', email: 'ali.k@example.com' },
    { name: 'Sana Malik', email: 'sana.m@example.com' },
    { name: 'Omar Hussain', email: 'omar.h@example.com' },
    { name: 'Aisha Saleem', email: 'aisha.s@example.com' },
    { name: 'Fahad Riaz', email: 'fahad.r@example.com' },
    { name: 'Hira Tariq', email: 'hira.t@example.com' },
    { name: 'Zain Abbas', email: 'zain.a@example.com' },
    { name: 'Sara Kamran', email: 'sara.k@example.com' },
    { name: 'Bilal Javed', email: 'bilal.j@example.com' },
    { name: 'Mehak Nasir', email: 'mehak.n@example.com' },
    { name: 'Imran Bhatti', email: 'imran.b@example.com' },
];

// Reusable function for API calls
const apiCall = async (endpoint, method = 'GET', data = null) => {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : null,
    };

    const res = await fetch(endpoint, options);
    // defensive
    try {
        return await res.json();
    } catch (err) {
        console.error('Invalid JSON response', err);
        return { success: false, error: 'Invalid JSON response' };
    }
};

// ---------- Small UI pieces ----------
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
    </button>
);

const StatCard = ({ title, value, icon: Icon, small }) => (
    <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs text-gray-500">{title}</p>
                <p className={`mt-1 text-xl font-bold ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50">
                <Icon className="w-6 h-6 text-indigo-600" />
            </div>
        </div>
    </div>
);

// ---------- Match Winner Form ----------
const MatchWinnerForm = ({ match, onWinnerRecorded }) => {
    const [selectedWinnerId, setSelectedWinnerId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // reset when match changes
        setSelectedWinnerId('');
        setMessage('');
    }, [match?._id]);

    const handleSubmitWinner = async (e) => {
        e.preventDefault();
        if (!selectedWinnerId) {
            setMessage('Please select a winner.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        const endpoint = `/api/admin/match/${match._id}/winner`;
        const data = { winnerId: selectedWinnerId };

        try {
            const result = await apiCall(endpoint, 'PATCH', data);
            if (result?.success) {
                setMessage(result?.message || `Winner recorded!`);
                onWinnerRecorded?.();
            } else {
                setMessage(`Error: ${result?.error || 'Failed to record winner.'}`);
            }
        } catch (error) {
            console.error('API Error:', error);
            setMessage('Network error recording winner.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 6000);
        }
    };

    if (match?.isBye) {
        const byePlayer = match.participants?.[0];
        return (
            <div className="flex justify-between items-center text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                <span className="font-semibold text-indigo-500">{byePlayer?.name} (Bye)</span>
                <span className="flex items-center text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4 mr-1" /> Auto-Completed
                </span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmitWinner} className="flex flex-col space-y-2 sm:flex-row sm:space-x-3 items-center w-full mt-3 pt-3 border-t border-gray-100">
            <select value={selectedWinnerId} onChange={(e) => { setSelectedWinnerId(e.target.value); setMessage(''); }} required className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                <option value="">Select Winner</option>
                {match.participants?.map(player => (
                    <option key={player._id} value={player._id}>{player.name}</option>
                ))}
            </select>

            <button type="submit" disabled={isLoading || !selectedWinnerId} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition duration-150 shadow-md">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trophy className="h-4 w-4 mr-2" />} Record Win
            </button>

            {message && (
                <p className={`text-xs font-medium w-full sm:w-1/2 p-2 rounded-lg text-center ${message.startsWith('Error') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>{message}</p>
            )}
        </form>
    );
};

// ---------- Player Manager (New + Existing) ----------
const PlayerManager = ({ game = null, gameId, gameStatus, allPlayers, onPlayerAction, registeredPlayers = [] }) => {
    const [view, setView] = useState('existing');
    console.log("game", game)
    const registeredIds = useMemo(() => new Set(registeredPlayers?.map(p => p._id)), [registeredPlayers]);
    const unregisteredPlayers = useMemo(() => allPlayers?.filter(player => !registeredIds.has(player?._id)) || [], [allPlayers, registeredIds]);

    const NewPlayerRegistration = () => {
        const [name, setName] = useState('');
        const [email, setEmail] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [message, setMessage] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            setIsLoading(true);
            setMessage('');

            const endpoint = `/api/admin/game/${gameId}/register-player`;
            const data = { players: [{ name, email }] };

            try {
                const result = await apiCall(endpoint, 'POST', data);
                if (result?.success) {
                    setMessage(`Player "${name}" registered successfully!`);
                    setName(''); setEmail('');
                    onPlayerAction?.();
                } else {
                    setMessage(`Error: ${result?.error || 'Failed to register player.'}`);
                }
            } catch (error) {
                console.error('API Error:', error);
                setMessage('Network error registering player.');
            } finally {
                setIsLoading(false);
                setTimeout(() => setMessage(''), 5000);
            }
        };

        return (
            <form onSubmit={handleSubmit} className="p-4 bg-indigo-50 rounded-lg mt-4 border border-indigo-200">
                <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-indigo-700 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Register New Player</h4>
                    <div className="text-sm text-gray-500">For this tournament</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <input type="text" placeholder="Player Name" value={name} onChange={(e) => { setName(e.target.value); setMessage(''); }} required className="w-full p-2 border text-indigo-500 border-indigo-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 transition" />
                    <input type="email" placeholder="Player Email (Unique ID)" value={email} onChange={(e) => { setEmail(e.target.value); setMessage(''); }} required className="w-full p-2 border text-indigo-500 border-indigo-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 transition" />
                    <button type="submit" disabled={isLoading || !name || !email} className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-md">
                        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />} Add & Register
                    </button>
                </div>
                {message && <p className={`text-xs font-medium mt-3 p-2 rounded-lg text-center ${message.startsWith('Error') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>{message}</p>}
            </form>
        );
    };

    const ExistingPlayerRegistration = () => {
        const [selectedPlayerId, setSelectedPlayerId] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [message, setMessage] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!selectedPlayerId) { setMessage('Please select a player.'); return; }
            setIsLoading(true); setMessage('');

            const endpoint = `/api/admin/game/${gameId}/register-player`;
            const playerToRegister = allPlayers.find(p => p._id === selectedPlayerId);
            const data = { players: [{ name: playerToRegister.name, email: playerToRegister.email }] };

            try {
                const result = await apiCall(endpoint, 'POST', data);
                if (result?.success) {
                    setMessage('Existing player registered successfully!');
                    setSelectedPlayerId('');
                    onPlayerAction?.();
                } else {
                    setMessage(`Error: ${result?.error || 'Failed to register player.'}`);
                }
            } catch (error) {
                console.error('API Error:', error);
                setMessage('Network error registering player.');
            } finally {
                setIsLoading(false);
                setTimeout(() => setMessage(''), 5000);
            }
        };

        if (!unregisteredPlayers.length) return (
            <div className="p-4 bg-yellow-50 rounded-lg mt-4 border border-yellow-200">
                <p className="text-sm text-yellow-700 font-medium flex items-center"><UserCheck className="w-4 h-4 mr-2" /> All existing players are already registered for this tournament.</p>
            </div>
        );

        return (
            <form onSubmit={handleSubmit} className="p-4 bg-blue-50 rounded-lg mt-4 border border-blue-200">
                <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-blue-700 flex items-center gap-2"><UserCheck className="w-4 h-4" /> Register Existing Player</h4>
                    <div className="text-sm text-gray-500">Choose from global players</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <select value={selectedPlayerId} onChange={(e) => { setSelectedPlayerId(e.target.value); setMessage(''); }} required className="w-full p-2 border text-blue-500 border-blue-300 rounded-lg text-sm bg-white focus:ring-blue-500 focus:border-blue-500 transition sm:col-span-2">
                        <option value="">Select an existing player to register</option>
                        {unregisteredPlayers.sort((a, b) => a.name.localeCompare(b.name)).map(p => <option disabled={registeredPlayers?.includes(p._id)} key={p._id} value={p._id}>{p.name} ({p.email})</option>)}
                    </select>

                    <button type="submit" disabled={isLoading || !selectedPlayerId} className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-md">
                        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />} Register Player
                    </button>
                </div>
                {message && <p className={`text-xs font-medium mt-3 p-2 rounded-lg text-center ${message.startsWith('Error') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>{message}</p>}
            </form>
        );
    };

    if (gameStatus !== 'Registration Open') return null;

    return (
        <div className="mt-4 border-t pt-4 border-gray-100">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /> Player Registration</h3>
                <div className="space-x-2">
                    <button onClick={() => setView('new')} className={`px-3 py-1 rounded-md text-sm ${view === 'new' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>New</button>
                    <button onClick={() => setView('existing')} className={`px-3 py-1 rounded-md text-sm ${view === 'existing' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Existing</button>
                </div>
            </div>

            {view === 'new' ? <NewPlayerRegistration /> : <ExistingPlayerRegistration />}
        </div>
    );
};

// ---------- Game Form ----------
const GameForm = ({ onGameCreated }) => {
    const [formData, setFormData] = useState({ name: '', type: 'Table Tennis', matchFormat: '1v1', scheduledTime: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setIsLoading(true); setMessage('');
        try {
            const result = await apiCall('/api/admin/game', 'POST', formData);
            if (result?.success) {
                setMessage(`Game "${result?.data?.name}" created successfully!`);
                setFormData({ name: '', type: 'Table Tennis', matchFormat: '1v1', scheduledTime: '' });
                onGameCreated?.();
            } else {
                setMessage(`Error: ${result?.error || 'Failed to create game.'}`);
            }
        } catch (error) {
            console.error('API Error:', error);
            setMessage('Network error. Check console.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-600" /> Create New Tournament</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
                    <input type="text" id="name" name="name" value={formData?.name} onChange={handleChange} required placeholder="e.g., Q4 Table Tennis Championship" className="w-full p-3 border text-indigo-500 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150" />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Game Type</label>
                    <select id="type" name="type" value={formData?.type} onChange={handleChange} className="w-full p-3 border text-indigo-500 border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                        <option value="Table Tennis">Table Tennis</option>
                        <option value="Foosball">Foosball</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="matchFormat" className="block text-sm font-medium text-gray-700 mb-1">Match Format</label>
                    <select id="matchFormat" name="matchFormat" value={formData?.matchFormat} onChange={handleChange} className="w-full p-3 border text-indigo-500 border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                        <option value="1v1">1 vs 1 (Singles)</option>
                        <option value="2v2">2 vs 2 (Doubles/Teams)</option>
                        <option value="4v4">4 vs 4 (Team)</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
                    <input type="datetime-local" id="scheduledTime" name="scheduledTime" value={formData?.scheduledTime} onChange={handleChange} required className="w-full p-3 border text-indigo-500 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150" />
                </div>

                <div className="md:col-span-2 flex items-center justify-between mt-4">
                    <button type="submit" disabled={isLoading} className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150">
                        {isLoading ? (<Loader2 className="mr-2 h-5 w-5 animate-spin" />) : (<Plus className="mr-2 h-5 w-5" />)}
                        {isLoading ? 'Creating...' : 'Create Tournament'}
                    </button>
                    {message && (<p className={`text-sm font-medium ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>)}
                </div>
            </form>
        </div>
    );
};

// ---------- Game Actions ----------
const GameActions = ({ game, onActionComplete }) => {
    const [isDrafting, setIsDrafting] = useState(false);
    const [message, setMessage] = useState('');

    const runAction = useCallback(async (actionType) => {
        setMessage('');
        let endpoint = '';
        if (actionType === 'draft') {
            setIsDrafting(true);
            endpoint = `/api/admin/game/${game._id}/draft`;
        } else return;

        try {
            const result = await apiCall(endpoint, 'POST', {});
            if (result?.success) {
                setMessage(result?.message || 'Action completed successfully.');
                onActionComplete?.();
            } else {
                setMessage(`Error: ${result?.error || 'Action failed.'}`);
            }
        } catch (error) {
            console.error('API Error:', error);
            setMessage('Network error. Check console.');
        } finally {
            setIsDrafting(false);
            setTimeout(() => setMessage(''), 5000);
        }
    }, [game._id, onActionComplete]);

    const canDraft = game.status === 'Registration Open' && (game.registeredPlayers?.length || 0) >= 2;

    return (
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 w-full mt-3 pt-3 border-t border-gray-100">
            {canDraft ? (
                <button onClick={() => runAction('draft')} disabled={isDrafting} className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50 transition shadow-md">
                    {isDrafting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shuffle className="h-4 w-4 mr-2" />}
                    {isDrafting ? 'Drafting...' : 'Start Random Draft (Round 1)'}
                </button>
            ) : (
                game.status === 'Registration Open' && <span className="flex-1 text-center text-xs text-red-500 p-2 bg-red-50 rounded-lg">Need at least 2 players to draft.</span>
            )}

            {message && (<p className={`text-sm font-medium p-2 rounded-lg ${message.startsWith('Error') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>{message}</p>)}
        </div>
    );
};

// ---------- Game List ----------
const GameList = ({ games = [], isLoading, refetchAllData, fetchActiveMatches, allPlayers }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-green-600" /> Existing Tournaments ({games.length})</h2>

            {isLoading ? (
                <div className="flex justify-center items-center h-40 text-indigo-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading games...</div>
            ) : games.length === 0 ? (
                <p className="text-gray-500 italic">No tournaments created yet.</p>
            ) : (
                <div className="space-y-4">
                    {games.map(game => (
                        <div key={game._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col hover:bg-gray-100 transition duration-150">
                            <div className="flex justify-between items-start">
                                <div className="flex-grow">
                                    <p className="text-lg font-semibold text-indigo-700">{game.name}</p>
                                    <div className="flex flex-wrap text-sm text-gray-600 mt-1 gap-4">
                                        <span className="flex items-center"><Zap className="w-4 h-4 mr-1 text-blue-500" /> {game.type} ({game.matchFormat})</span>
                                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-yellow-600" /> {new Date(game.scheduledTime).toLocaleString()}</span>
                                        <span className="flex items-center"><Users className="w-4 h-4 mr-1 text-gray-500" /> Players: {game.registeredPlayers?.length || 0}</span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${game.status === 'Registration Open' ? 'bg-green-100 text-green-800' : game.status === 'Active' ? 'bg-yellow-100 text-yellow-800' : game.status === 'Completed' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>{game.status}</span>
                            </div>

                            <PlayerManager game={game} gameId={game._id} gameStatus={game.status} allPlayers={allPlayers} onPlayerAction={refetchAllData} registeredPlayers={game.registeredPlayers || []} />

                            <GameActions game={game} onActionComplete={refetchAllData} />

                            <a href={`/tournament/${game._id}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 transition"><ExternalLink className="h-4 w-4 mr-2" /> View Public Bracket</a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ---------- Active Match List ----------
const ActiveMatchList = ({ activeMatches = [], isLoading, fetchActiveMatches }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-600" /> Matches Awaiting Result ({activeMatches.length})</h2>

            {isLoading ? (
                <div className="flex justify-center items-center h-40 text-indigo-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading active matches...</div>
            ) : activeMatches.length === 0 ? (
                <p className="text-gray-500 italic">No matches currently scheduled or active. Draft a game to begin!</p>
            ) : (
                <div className="space-y-4">
                    {activeMatches.map(match => (
                        <div key={match._id} className="p-4 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition duration-150">
                            <div className="flex justify-between items-start">
                                <div className="flex-grow">
                                    <p className="text-md font-bold text-red-700">Round {match.round} - {match.game?.name}</p>
                                    <p className="text-lg font-semibold text-gray-800">{match.participants?.map(p => p.name).join(' vs ')}</p>
                                    <div className="flex text-sm text-gray-600 mt-1"><span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-yellow-600" /> {new Date(match.scheduledTime).toLocaleString()}</span></div>
                                </div>
                                <span className="px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-red-200 text-red-800">AWAITING RESULT</span>
                            </div>

                            <MatchWinnerForm match={match} onWinnerRecorded={fetchActiveMatches} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ---------- Main Admin Panel ----------


const ClientOnlyDate = ({ date }) => {
    const [clientDate, setClientDate] = React.useState('');

    React.useEffect(() => {
        if (date) {
            setClientDate(new Date(date).toLocaleString());
        }
    }, [date]);

    return <>{clientDate}</>;
};
const LastSynced = () => {
    const [now, setNow] = React.useState('');
    React.useEffect(() => {
        setNow(new Date().toLocaleString());
    }, []);
    return <>{now}</>;
};



export default function AdminPanel() {
    let user = null;
    const [games, setGames] = useState([]);
    const [activeMatches, setActiveMatches] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [isLoadingGames, setIsLoadingGames] = useState(true);
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
    const [winners, setWinners] = useState([]);
    const [error, setError] = useState(null);
    const [userlocal, setuserlocal] = useState(null);
    const [view, setView] = useState('dashboard'); // dashboard | tournaments | players | matches | winners | settings
    const [isAdmin, setIsAdmin] = useState(null);
    const fetchWinners = useCallback(async () => {
        if (isAdmin !== true) return; // Prevent fetch if not authenticated
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/tournament/winners');
            const data = await response.json();

            if (response.ok && data.success) {
                setWinners(data.winners || []);
            } else {
                // If fetching fails during use, check for unauthorized status
                if (response.status === 401 || response.status === 403) {
                    window.location.href = '/admin/login';
                    return;
                }
                setError(data.error || 'Failed to fetch winners data.');
                setWinners([]);
            }
        } catch (err) {
            console.error(err);
            setError('A network error occurred while fetching winners.');
            setWinners([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin]);
    const fetchAllPlayers = useCallback(async () => {
        setIsLoadingPlayers(true);
        try {
            let result = await apiCall('/api/admin/player/list');
            // support different shapes: {success,data:{players:[]}} or {success,players:[]}
            const players = result?.data?.players ?? result?.players ?? [];

            if (result?.success && players.length === 0) {
                console.log('No players found. Initializing mock players...');
                await apiCall('/api/admin/player/init', 'POST', { players: MOCK_PLAYERS });
                result = await apiCall('/api/admin/player/list');
            }

            const finalPlayers = result?.data?.players ?? result?.players ?? [];
            setAllPlayers(finalPlayers);
        } catch (error) {
            console.error('Network Error fetching players:', error);
            setAllPlayers([]);
        } finally {
            setIsLoadingPlayers(false);
        }
    }, []);
    const fetchGames = useCallback(async () => {
        setIsLoadingGames(true);
        try {
            const result = await apiCall('/api/admin/game');
            const data = result?.data ?? result ?? [];

            setGames(Array.isArray(data) ? data : (data?.games || []));
        } catch (error) {
            console.error('Network Error fetching games:', error);
            setGames([]);
        } finally {
            setIsLoadingGames(false);
        }
    }, []);
    const bulkAdd = useCallback(async () => {
        setIsLoadingMatches(true);
        try {
            const result = await apiCall('/api/player/bulk', 'POST');
        } catch (error) {
            console.error('Network Error fetching active matches:', error);
        } finally {
            setIsLoadingMatches(false);
        }
    }, []);
    const fetchActiveMatches = useCallback(async () => {
        setIsLoadingMatches(true);
        try {
            const result = await apiCall('/api/admin/match');
            const data = result?.data ?? result ?? [];
            setActiveMatches(Array.isArray(data) ? data : (data?.matches || []));
        } catch (error) {
            console.error('Network Error fetching active matches:', error);
            setActiveMatches([]);
        } finally {
            setIsLoadingMatches(false);
        }
    }, []);
    // quick aggregated stats
    const stats = useMemo(() => ({
        totalTournaments: games.length,
        totalActiveMatches: activeMatches.length,
        totalPlayers: allPlayers.length,
    }), [games, activeMatches, allPlayers]);
    // --- Authentication and Redirection Logic (Relies ONLY on HttpOnly cookie via API) ---
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // 1. Hit a protected API route (e.g., /api/admin/tournament/winners) to check the session cookie
                // The browser automatically sends the HttpOnly cookie.
                const response = await fetch('/api/tournament/winners');

                if (response.ok) {
                    // 2. Auth successful
                    setIsAdmin(true);

                    // Pre-fetch initial data if successful
                    const data = await response.json();
                    if (data.success) {
                        // Assuming the winner API returns an object with a 'winners' key
                        setWinners(data.winners || []);
                    }
                } else if (response.status === 401 || response.status === 403) {
                    // 3. Unauthorized/Forbidden -> Redirect to login page
                    setIsAdmin(false);
                    // Crucial: Client-side redirection to the login route
                    window.location.href = '/admin/login';
                } else {
                    // Other server error during check
                    setIsAdmin(false);
                    setError("Server error during initial auth check.");
                }
            } catch (err) {
                // 4. Network error, assume unauthenticated and redirect
                setIsAdmin(false);
                window.location.href = '/admin/login';
                console.error("Auth check failed:", err);
            }
        };
        // Only run the auth check on mount
        checkAuthStatus();
    }, []);
    useEffect(() => {
        if (typeof window != 'undefined') {
            user = localStorage.getItem('user')
            user = user ? JSON.parse(user) : null
            setuserlocal(user)
        }
    }, [user])

    useEffect(() => {
        fetchAllPlayers();
        fetchGames();
        fetchActiveMatches();
    }, [fetchAllPlayers, fetchGames, fetchActiveMatches]);

    const refetchAllData = useCallback(() => {
        fetchAllPlayers(); fetchGames(); fetchActiveMatches();
    }, [fetchAllPlayers, fetchGames, fetchActiveMatches]);



    useEffect(() => {
        if (view === 'winners') {
            fetchWinners();
        }
    }, [view, fetchWinners]);

    // useEffect(() => {
    //     if (!userlocal && user != null) {
    //         window.location.replace('/admin/login')
    //     }
    // }, [userlocal,user]);

    const WinnerRow = ({ winner }) => (
        <div className="grid grid-cols-12 gap-4 items-center py-4 border-b last:border-b-0 hover:bg-indigo-50 transition-colors duration-150">
            <div className="col-span-4 font-semibold text-indigo-700 truncate">{winner.tournamentName}</div>
            <div className="col-span-3 text-sm text-gray-500">
                {console.log("winner", winner)}
                {new Date(winner.scheduledTime).toLocaleString()}
            </div>
            <div className="col-span-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="font-bold text-gray-800 truncate">
                    {/* Check if winner object and name exist */}
                    {winner.winner?.name || winner.winner?.email || 'TBD/N/A'}
                </span>
            </div>
            <div className="col-span-1 text-right">
                <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
        </div>
    );
    console.log("userlocal", userlocal)

    const logout = async () => {
        localStorage.clear();
        sessionStorage.clear();
        const response = await apiCall('/api/admin/logout','POST',{});
        if (response) {
            window.location.replace('/admin/login')
        }
    }
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-[1200px] mx-auto grid grid-cols-12 gap-6">
                {/* Sidebar */}
                <aside className="col-span-12 md:col-span-3 lg:col-span-2">
                    <div className="sticky top-6 space-y-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <LayoutSidebar className="w-7 h-7 text-indigo-600" />
                                <div>
                                    <h3 className="text-lg font-bold">Tournament Admin</h3>
                                    <p className="text-xs text-gray-500">Control panel & management</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
                            <SidebarItem icon={List} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                            <SidebarItem icon={Trophy} label="Tournaments" active={view === 'tournaments'} onClick={() => setView('tournaments')} />
                            <SidebarItem icon={Users} label="Players" active={view === 'players'} onClick={() => setView('players')} />
                            <SidebarItem icon={CheckCircle} label="Matches" active={view === 'matches'} onClick={() => setView('matches')} />
                            <SidebarItem icon={UserCheck} label="Winners" active={view === 'winners'} onClick={() => setView('winners')} />
                            <SidebarItem icon={Sliders} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
                        </div>

                        <div className="bg-white p-3 rounded-lg text-sm text-gray-600 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs">Last synced</p>
                                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-yellow-600" /> <ClientOnlyDate date={new Date().toLocaleString()} /></span>
                                </div>
                                <button onClick={refetchAllData} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm">Sync</button>
                            </div>
                        </div>

                    </div>
                </aside>

                {/* Main Area */}
                <main className="col-span-12 md:col-span-9 lg:col-span-10">
                    <header className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">Admin Control Panel</h1>
                            <p className="mt-1 text-sm text-gray-600">Manage tournaments, players, matches and winners</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className='flex items-center gap-2 mb-1' >
                                    <p className="text-xs text-gray-500">Welcome, {userlocal?.name}</p>
                                    <button onClick={logout} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm">logout</button>
                                </div>
                                <p className="text-xs text-gray-500">Total Players</p>
                                <p className="text-lg font-semibold text-indigo-600">{isLoadingPlayers ? (<span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading</span>) : stats.totalPlayers}</p>
                            </div>
                        </div>
                    </header>

                    {view === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard title="Tournaments" value={stats.totalTournaments} icon={Trophy} />
                                <StatCard title="Active Matches" value={stats.totalActiveMatches} icon={CheckCircle} />
                                <StatCard title="Players" value={stats.totalPlayers} icon={Users} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <GameForm onGameCreated={refetchAllData} />
                                </div>

                                <div>
                                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                                        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                                        <p className="text-sm text-gray-600">Quick overview — latest created tournaments and matches awaiting results.</p>

                                        <div className="mt-4 space-y-3">
                                            {games.slice(0, 3).map(g => (
                                                <div key={g._id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                                    <div>
                                                        <p className="font-medium">{g.name}</p>
                                                        <p className="text-xs text-gray-500">{g.registeredPlayers?.length || 0} players • {new Date(g.scheduledTime).toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{g.status}</div>
                                                </div>
                                            ))}
                                            {games.length === 0 && <p className="text-sm text-gray-500 italic">No recent tournaments</p>}
                                        </div>

                                    </div>
                                </div>
                            </div>

                            <ActiveMatchList activeMatches={activeMatches} isLoading={isLoadingMatches} fetchActiveMatches={refetchAllData} />

                            <GameList games={games} isLoading={isLoadingGames} refetchAllData={refetchAllData} fetchActiveMatches={fetchActiveMatches} allPlayers={allPlayers} />

                        </div>
                    )}

                    {view === 'tournaments' && (
                        <div className="space-y-6">
                            <GameForm onGameCreated={refetchAllData} />
                            <GameList games={games} isLoading={isLoadingGames} refetchAllData={refetchAllData} fetchActiveMatches={fetchActiveMatches} allPlayers={allPlayers} />
                        </div>
                    )}

                    {view === 'players' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                                <h2 className="text-xl font-bold">Players ({allPlayers.length})</h2>
                                <button onClick={bulkAdd} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm">Bulk Add user</button>
                                <p className="text-sm text-gray-600 mt-2">Global player directory. Add / edit players from your user management API.</p>

                                <div className="mt-4">
                                    {isLoadingPlayers ? (
                                        <div className="flex items-center gap-2 text-indigo-600"><Loader2 className="w-4 h-4 animate-spin" /> Loading players...</div>
                                    ) : allPlayers.length === 0 ? (
                                        <p className="text-gray-500 italic">No players yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {allPlayers.map(p => (
                                                <div key={p._id || p.email} className="p-3 rounded-lg bg-white border border-gray-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{p.name}</p>
                                                        <p className="text-xs text-gray-500">{p.email}</p>
                                                    </div>
                                                    <div className="text-sm text-gray-500">{p._id ? 'ID: ' + p._id.slice?.(0, 6) : ''}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'matches' && (
                        <div className="space-y-6">
                            <ActiveMatchList activeMatches={activeMatches} isLoading={isLoadingMatches} fetchActiveMatches={refetchAllData} />
                        </div>
                    )}

                    {view === 'winners' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                    <Trophy className="w-6 h-6 mr-3 text-yellow-500" /> Tournament Champions
                                </h2>
                                <p className="text-sm text-gray-600 mt-2 mb-6">A list of all completed tournaments and their official winners.</p>

                                {isLoading && (
                                    <div className="flex justify-center items-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                        <p className="ml-3 text-indigo-600">Loading winners...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                                        Error: {error}
                                    </div>
                                )}

                                {!isLoading && !error && winners.length > 0 && (
                                    <>
                                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase border-b pb-2 mb-2">
                                            <div className="col-span-4">Tournament Name</div>
                                            <div className="col-span-3">Start Date</div>
                                            <div className="col-span-4">Winner</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {winners.map((winner) => (
                                                <WinnerRow key={winner.tournamentId} winner={winner} />
                                            ))}
                                        </div>
                                    </>
                                )}

                                {!isLoading && !error && winners.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">
                                        <Trophy className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                                        <p className="font-semibold">No Champions Yet</p>
                                        <p className="text-sm">Completed tournaments with a final winner will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {view === 'settings' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                                <h2 className="text-xl font-bold">Settings</h2>
                                <p className="text-sm text-gray-600 mt-2">Configure admin preferences and system-wide defaults (future).</p>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
