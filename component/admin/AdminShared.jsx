'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Users, Clock, Trophy, Shuffle, UserPlus, Zap, CheckCircle, ExternalLink, XCircle, UserCheck, ChevronRight } from 'lucide-react';

// Reusable function for API calls
export const apiCall = async (endpoint, method = 'GET', data = null) => {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : null,
        cache: 'no-store'
    };

    const res = await fetch(endpoint, options);
    try {
        return await res.json();
    } catch (err) {
        console.error('Invalid JSON response', err);
        return { success: false, error: 'Invalid JSON response' };
    }
};

// Helper to get team size and minimum required players
export const getFormatRequirements = (format) => {
    const teamSizeMatch = format?.match(/^(\d+)v\d+$/);
    const teamSize = teamSizeMatch ? parseInt(teamSizeMatch[1]) : 1;
    return {
        teamSize,
        minPlayers: teamSize * 2 // Always need at least 2 teams to start
    };
};

export const getTeamDetails = (match) => {
    const { teamSize } = getFormatRequirements(match.game?.matchFormat);

    if (!match.participants || match.participants.length < teamSize) {
        return { teamSize: 1, team1: [], team2: [], team1Name: 'TBD', team2Name: 'TBD' };
    }

    const team1 = match.participants.slice(0, teamSize);
    const team2 = match.participants.slice(teamSize, teamSize * 2);
    const formatTeamName = (team) => team.map(p => p.name).join(', ');

    return {
        teamSize, team1, team2,
        team1Name: formatTeamName(team1),
        team2Name: formatTeamName(team2.length > 0 ? team2 : []),
    };
};

export const MatchWinnerForm = ({ match, onWinnerRecorded }) => {
    const [selectedWinnerId, setSelectedWinnerId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const { team1, team2, team1Name, team2Name } = getTeamDetails(match);

    useEffect(() => {
        setSelectedWinnerId('');
        setMessage('');
    }, [match?._id]);

    const handleSubmitWinner = async (e) => {
        e.preventDefault();
        if (!selectedWinnerId) { setMessage('Please select a winning side.'); return; }
        setIsLoading(true); setMessage('');

        let representativeWinnerId;
        if (selectedWinnerId === 'team1' && team1.length > 0) representativeWinnerId = team1[0]._id;
        else if (selectedWinnerId === 'team2' && team2.length > 0) representativeWinnerId = team2[0]._id;
        else { setMessage('Invalid team selection.'); setIsLoading(false); return; }

        try {
            const result = await apiCall(`/api/admin/match/${match._id}/winner`, 'PATCH', { winnerId: representativeWinnerId });
            if (result?.success) {
                setMessage(result?.message || `Winner recorded!`);
                onWinnerRecorded?.();
            } else setMessage(`Error: ${result?.error || 'Failed to record winner.'}`);
        } catch (error) {
            setMessage('Network error recording winner.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 6000);
        }
    };

    if (match?.isBye) {
        return (
            <div className="flex justify-between items-center text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                <span className="font-semibold text-indigo-500">{team1Name} (Bye)</span>
                <span className="flex items-center text-green-600 font-medium"><CheckCircle className="w-4 h-4 mr-1" /> Auto-Completed</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmitWinner} className="flex flex-col space-y-2 sm:flex-row sm:space-x-3 items-center w-full mt-3 pt-3 border-t border-gray-100">
            <select value={selectedWinnerId} onChange={(e) => setSelectedWinnerId(e.target.value)} required className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-indigo-500 transition">
                <option value="">Select Winning Side</option>
                {team1.length > 0 && <option value="team1">{team1Name}</option>}
                {team2.length > 0 && <option value="team2">{team2Name}</option>}
            </select>
            <button type="submit" disabled={isLoading || !selectedWinnerId} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition shadow-md">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trophy className="h-4 w-4 mr-2" />} Record Win
            </button>
            {message && <p className={`text-xs font-medium w-full sm:w-1/2 p-2 rounded-lg text-center ${message.startsWith('Error') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>{message}</p>}
        </form>
    );
};

export const PlayerManager = ({ gameId, gameStatus, allPlayers, onPlayerAction, registeredPlayers = [] }) => {
    const [view, setView] = useState('existing');
    const registeredIds = new Set(registeredPlayers?.map(p => p._id));
    const unregisteredPlayers = allPlayers?.filter(player => !registeredIds.has(player?._id)) || [];

    const RegisterForm = ({ isNew }) => {
        const [formData, setFormData] = useState({ name: '', email: '', id: '' });
        const [isLoading, setIsLoading] = useState(false);
        const [message, setMessage] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            setIsLoading(true); setMessage('');
            const data = isNew ? { players: [{ name: formData.name, email: formData.email }] } : { players: [{ name: allPlayers.find(p => p._id === formData.id).name, email: allPlayers.find(p => p._id === formData.id).email }] };
            try {
                const result = await apiCall(`/api/admin/game/${gameId}/register-player`, 'POST', data);
                if (result?.success) {
                    setMessage('Registered successfully!');
                    setFormData({ name: '', email: '', id: '' });
                    onPlayerAction?.();
                } else setMessage(`Error: ${result?.error}`);
            } catch (err) { setMessage('Network error.'); }
            finally { setIsLoading(false); setTimeout(() => setMessage(''), 5000); }
        };

        return (
            <form onSubmit={handleSubmit} className={`p-4 rounded-lg mt-4 border ${isNew ? 'bg-indigo-50 border-indigo-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {isNew ? (
                        <>
                            <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="p-2 border rounded-lg text-sm" />
                            <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required className="p-2 border rounded-lg text-sm" />
                        </>
                    ) : (
                        <select value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} required className="p-2 border rounded-lg text-sm sm:col-span-2">
                            <option value="">Select Player</option>
                            {unregisteredPlayers.map(p => <option key={p._id} value={p._id}>{p.name} ({p.email})</option>)}
                        </select>
                    )}
                    <button type="submit" disabled={isLoading} className={`px-4 py-2 text-sm font-medium rounded-lg text-white ${isNew ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
                    </button>
                </div>
                {message && <p className="text-xs mt-2 text-center">{message}</p>}
            </form>
        );
    };

    if (gameStatus !== 'Registration Open') return null;

    return (
        <div className="mt-6 border-t pt-6 border-brand border-dashed">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-brand-text uppercase tracking-tight flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-brand-primary" />
                    Registration
                </h3>
                <div className="flex p-1 bg-brand-background rounded-xl border border-brand">
                    <button
                        onClick={() => setView('new')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'new' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
                    >
                        New
                    </button>
                    <button
                        onClick={() => setView('existing')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'existing' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
                    >
                        Directory
                    </button>
                </div>
            </div>

            <div className="animate-in fade-in zoom-in-95 duration-300">
                <RegisterForm isNew={view === 'new'} />
            </div>
        </div>
    );
};

export const GameForm = ({ onGameCreated }) => {
    const [formData, setFormData] = useState({ name: '', type: 'Table Tennis', matchFormat: '1v1', scheduledTime: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault(); setIsLoading(true);
        try {
            const result = await apiCall('/api/admin/game', 'POST', formData);
            if (result?.success) {
                setMessage('Tournament created successfully!');
                setFormData({ name: '', type: 'Table Tennis', matchFormat: '1v1', scheduledTime: '' });
                onGameCreated?.();
            } else setMessage(`Error: ${result?.error}`);
        } catch (err) { setMessage('Network error.'); }
        finally { setIsLoading(false); setTimeout(() => setMessage(''), 5000); }
    };

    return (
        <div className="bg-brand-surface p-8 rounded-3xl shadow-sm border border-brand">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-background rounded-2xl text-brand-primary border border-brand">
                    <Plus className="w-6 h-6 border-brand-primary" />
                </div>
                <h2 className="text-2xl font-black text-brand-text tracking-tight uppercase">New <span className="text-brand-primary">Bracket</span></h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1">Grand Event Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Winter Clash 2024"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-5 py-4 bg-brand-background border border-brand rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold text-sm"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1">Discipline</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-5 py-4 bg-brand-background border border-brand rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold text-sm appearance-none"
                        >
                            <option value="Table Tennis">Table Tennis</option>
                            <option value="Foosball">Foosball</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1">Match Format</label>
                        <select
                            value={formData.matchFormat}
                            onChange={e => setFormData({ ...formData, matchFormat: e.target.value })}
                            className="w-full px-5 py-4 bg-brand-background border border-brand rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold text-sm appearance-none"
                        >
                            <option value="1v1">1 vs 1 (Solo)</option>
                            <option value="2v2">2 vs 2 (Duo)</option>
                            <option value="4v4">4 vs 4 (Squad)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1">Kickoff Schedule</label>
                    <input
                        type="datetime-local"
                        value={formData.scheduledTime}
                        onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                        required
                        className="w-full px-5 py-4 bg-brand-background border border-brand rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-brand-secondary active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'Create Tournament'}
                </button>

                {message && (
                    <p className={`text-[10px] font-bold p-3 rounded-xl border text-center uppercase tracking-widest ${message.startsWith('Error')
                        ? 'text-red-600 bg-red-50 border-red-100'
                        : 'text-brand-primary bg-brand-background border-brand'
                        }`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export const GameActions = ({ game, onActionComplete }) => {
    const [isDrafting, setIsDrafting] = useState(false);
    const [message, setMessage] = useState('');

    const { minPlayers } = getFormatRequirements(game.matchFormat);
    const registeredCount = game.registeredPlayers?.length || 0;
    const canDraft = registeredCount >= minPlayers && registeredCount % (minPlayers / 2) === 0;

    const runAction = async () => {
        if (!canDraft) return;
        setIsDrafting(true); setMessage('');
        try {
            const result = await apiCall(`/api/admin/game/${game._id}/draft`, 'POST', {});
            if (result?.success) { onActionComplete?.(); }
            else setMessage(`Error: ${result?.error}`);
        } catch (err) { setMessage('Network error.'); }
        finally { setIsDrafting(false); setTimeout(() => setMessage(''), 5000); }
    };

    if (game.status !== 'Registration Open') return null;

    return (
        <div className="mt-4 pt-4 border-t border-brand border-dashed">
            <button
                onClick={runAction}
                disabled={isDrafting || !canDraft}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md ${canDraft && !isDrafting
                    ? 'bg-brand-primary text-white hover:bg-brand-secondary active:scale-[0.98]'
                    : 'bg-brand-background text-brand-muted border border-brand cursor-not-allowed opacity-60'
                    }`}
            >
                {isDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                {registeredCount < minPlayers
                    ? `Need ${minPlayers - registeredCount} more players`
                    : !canDraft
                        ? `Waiting for Teams (${registeredCount % (minPlayers / 2)} extra)`
                        : 'Generate Bracket'
                }
            </button>
            {message && <p className="text-[10px] mt-3 font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center uppercase tracking-widest">{message}</p>}
        </div>
    );
};

export const GameList = ({ games, isLoading, onAction, allPlayers, onDelete }) => (
    <div className="bg-brand-surface p-8 rounded-3xl shadow-sm border border-brand">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-brand-background rounded-2xl text-brand-primary border border-brand">
                <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-brand-text tracking-tight uppercase">Tournament <span className="text-brand-primary">History</span></h2>
        </div>

        {isLoading ? <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div> : (
            <div className="grid grid-cols-1 gap-6">
                {games.map(game => (
                    <div key={game._id} className="p-6 border border-brand rounded-2xl bg-brand-background/50 hover:bg-brand-background transition-all group relative">
                        <div className="flex justify-between items-start mb-6">
                            <div className="min-w-0 flex-1">
                                <h3 className="font-black text-brand-text text-lg uppercase tracking-tight truncate group-hover:text-brand-primary transition-colors">{game.name}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-1.5">
                                        <Zap className="w-3 h-3" /> {game.type}
                                    </p>
                                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-1.5">
                                        <Shuffle className="w-3 h-3" /> {game.matchFormat}
                                    </p>
                                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" /> {new Date(game.scheduledTime).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                                <span className={`px-4 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-widest shadow-sm ${game.status === 'Active' ? 'bg-brand-primary text-white' :
                                        game.status === 'Completed' ? 'bg-green-500 text-white' :
                                            'bg-brand-surface text-brand-muted border border-brand'
                                    }`}>
                                    {game.status}
                                </span>
                                <button
                                    onClick={() => onDelete?.(game._id)}
                                    className="p-2 text-brand-muted hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Tournament"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-brand-surface rounded-2xl p-2 border border-brand border-dashed">
                            <PlayerManager gameId={game._id} gameStatus={game.status} allPlayers={allPlayers} onPlayerAction={onAction} registeredPlayers={game.registeredPlayers} />
                            <GameActions game={game} onActionComplete={onAction} />
                        </div>

                        <a
                            href={`/tournament/${game._id}`}
                            target="_blank"
                            className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all"
                        >
                            Explore Live Bracket <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                ))}
                {games.length === 0 && (
                    <div className="py-20 text-center bg-brand-background rounded-3xl border border-dashed border-brand">
                        <Trophy className="w-12 h-12 text-brand-muted mx-auto mb-4 opacity-20" />
                        <p className="text-brand-muted font-bold italic">No tournaments in the archive.</p>
                    </div>
                )}
            </div>
        )}
    </div>
);

export const ActiveMatchList = ({ activeMatches, isLoading, onAction }) => (
    <div className="bg-brand-surface p-8 rounded-3xl shadow-sm border border-brand">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-red-50 rounded-2xl text-red-600 border border-red-100">
                <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-brand-text tracking-tight uppercase">Live <span className="text-red-600">Battles</span></h2>
        </div>

        {isLoading ? <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-red-600" /></div> : (
            <div className="space-y-6">
                {activeMatches.map(match => {
                    const { team1Name, team2Name } = getTeamDetails(match);
                    return (
                        <div key={match._id} className="p-6 border border-red-100 rounded-3xl bg-red-50/30 hover:bg-red-50/50 transition-all border-l-8 border-l-red-500">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Round {match.round}</span>
                                <div className="h-px flex-1 bg-red-200 opacity-50"></div>
                                <span className="text-[10px] font-bold text-brand-muted">{match.game?.name}</span>
                            </div>
                            <div className="flex items-center justify-between gap-6 py-2">
                                <p className="text-lg font-black text-brand-text truncate flex-1 text-center bg-brand-surface py-3 rounded-2xl border border-brand shadow-sm">{team1Name}</p>
                                <div className="text-[10px] font-black text-red-500 italic px-2">VS</div>
                                <p className="text-lg font-black text-brand-text truncate flex-1 text-center bg-brand-surface py-3 rounded-2xl border border-brand shadow-sm">{team2Name}</p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-red-100">
                                <MatchWinnerForm match={match} onWinnerRecorded={onAction} />
                            </div>
                        </div>
                    );
                })}
                {activeMatches.length === 0 && (
                    <div className="py-20 text-center bg-red-50/30 rounded-3xl border border-dashed border-red-100">
                        <CheckCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
                        <p className="text-brand-muted font-bold italic">No active matches at the moment.</p>
                    </div>
                )}
            </div>
        )}
    </div>
);
