'use client';

import React, { useState, useEffect } from 'react';
import { Users, Calendar, Trophy, Zap, Loader2, LinkIcon, AlertTriangle, ArrowRight } from 'lucide-react';

// --- Helper Components ---

// Stat Card
const StatCard = ({ icon: Icon, title, value }) => (
    <div className="flex items-center p-6 bg-brand-surface rounded-2xl shadow-sm border border-brand transition duration-300 hover:shadow-md">
        <div className="p-3 rounded-xl bg-brand-background text-brand-primary mr-4">
            <Icon className="w-6 h-6 border-brand-primary" />
        </div>
        <div>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">{title}</p>
            <p className="text-xl font-black text-brand-text">{value}</p>
        </div>
    </div>
);

const TeamDisplay = ({ team, winnerId, matchStatus }) => {
    const teamNames = team.map(p => p.name).join(' & ');
    const isWinner = team.some(p => p._id === winnerId);

    return (
        <div className="flex items-center min-w-0 group/team relative">
            <span
                className={`text-base font-bold truncate transition-colors ${isWinner && matchStatus === 'Completed' ? 'text-brand-primary' : 'text-brand-text'
                    }`}
            >
                {teamNames}
            </span>
            {isWinner && matchStatus === 'Completed' && (
                <Trophy className="w-4 h-4 text-brand-accent ml-2 flex-shrink-0 animate-bounce" />
            )}
            {/* Hover Tooltip for Full Team Names */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/team:block z-50">
                <div className="bg-brand-text text-brand-surface text-[10px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap">
                    {teamNames}
                </div>
            </div>
        </div>
    );
};

const MatchCard = ({ match, index, matchFormat }) => {
    const participants = match.participants || [];
    const winnerId = match.winner?._id;

    let team1 = [];
    let team2 = [];
    const expectedPlayers = matchFormat === '2v2' ? 4 : (matchFormat === '4v4' ? 8 : 2);

    if (participants.length === expectedPlayers) {
        const half = participants.length / 2;
        team1 = participants.slice(0, half);
        team2 = participants.slice(half);
    } else if (participants.length > 0) {
        team1 = participants.slice(0, Math.ceil(participants.length / 2));
        team2 = participants.slice(Math.ceil(participants.length / 2));
    }

    const isCompleted = match.status === 'Completed';

    return (
        <div className="flex flex-col p-5 bg-brand-surface rounded-2xl shadow-sm border border-brand mb-4 transition hover:border-brand-primary group">
            <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-brand-muted px-2 py-0.5 bg-brand-background rounded">R{match.round} • M{match.matchNumber}</div>
                <div
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-brand-primary text-white'
                        }`}
                >
                    {match.status}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <TeamDisplay team={team1} winnerId={winnerId} matchStatus={match.status} />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-brand-border opacity-50"></div>
                    <div className="text-[10px] font-black text-brand-muted italic opacity-40">VS</div>
                    <div className="h-px flex-1 bg-brand-border opacity-50"></div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <TeamDisplay team={team2} winnerId={winnerId} matchStatus={match.status} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const TournamentBracket = ({ game, matches }) => {
    const gameWinner = game.winner; // This is a User object popualted
    const isCompleted = game.status === 'Completed' && gameWinner;

    // Find the winning team (could be multiple people if 2v2/4v4)
    // We look at the final match to find all members of the winning team
    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => b - a);
    const finalRound = rounds[0];
    const finalMatch = matches.find(m => m.round === finalRound);

    let winnerNames = gameWinner?.name || 'TBD';
    if (finalMatch && finalMatch.winner) {
        const teamSizeMatch = game.matchFormat.match(/^(\d+)v\d+$/);
        const teamSize = teamSizeMatch ? parseInt(teamSizeMatch[1]) : 1;
        const winnerIndex = finalMatch.participants.findIndex(p => p._id === finalMatch.winner._id);

        if (winnerIndex !== -1) {
            const teamStart = Math.floor(winnerIndex / teamSize) * teamSize;
            const winningTeam = finalMatch.participants.slice(teamStart, teamStart + teamSize);
            winnerNames = winningTeam.map(p => p.name).join(' & ');
        }
    }

    return (
        <div className="p-8 bg-brand-surface rounded-3xl border border-brand shadow-sm">
            <h3 className="text-lg font-black mb-6 text-brand-text uppercase tracking-tight">Tournament Summary</h3>

            {isCompleted ? (
                <div className="text-center p-10 bg-brand-background rounded-2xl border border-brand-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
                    <Trophy className="w-16 h-16 text-brand-accent mx-auto mb-4 animate-pulse" />
                    <p className="text-sm font-bold text-brand-muted uppercase tracking-widest">Champion</p>
                    <p className="text-3xl font-black text-brand-primary mt-2 leading-tight">{winnerNames}</p>
                    <p className="text-xs text-brand-muted mt-4 font-medium italic">Congratulations on the victory!</p>
                </div>
            ) : (
                <div className="p-10 text-center bg-brand-background rounded-2xl border border-dashed border-brand">
                    <Zap className="w-10 h-10 text-brand-muted mx-auto mb-4 opacity-20" />
                    <p className="text-brand-muted font-medium italic">The tournament is currently in progress.</p>
                </div>
            )}
        </div>
    );
};

// --- Main Component ---
const App = ({ params }) => {
    const [gameData, setGameData] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { id: gameId } = params;

    useEffect(() => {
        const fetchGameDetails = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/tournament/${gameId}`);
                const result = await response.json();
                if (result.success) {
                    setGameData(result.data.game);
                    setMatches(result.data.matches || []);
                } else throw new Error(result.error);
            } catch (err) { setError(err.message); }
            finally { setLoading(false); }
        };
        fetchGameDetails();
    }, [gameId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-brand-background">
            <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-brand-background p-8">
            <div className="bg-white p-8 rounded-3xl text-brand-text max-w-lg shadow-xl border border-red-200">
                <div className="p-3 bg-red-100 rounded-2xl text-red-600 w-fit mb-4"><AlertTriangle /></div>
                <h2 className="text-2xl font-black mb-2">Something went wrong</h2>
                <p className="text-brand-muted text-sm">{error}</p>
            </div>
        </div>
    );

    if (!gameData) return null;

    const roundsMap = matches.reduce((acc, match) => {
        (acc[match.round] = acc[match.round] || []).push(match);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-brand-background text-brand-text p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="py-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <a href="/" className="text-brand-primary font-bold text-xs uppercase tracking-widest hover:underline mb-4 block">← Back to Tournaments</a>
                        <h1 className="text-5xl font-black tracking-tighter leading-none">{gameData.name}</h1>
                        <p className="mt-4 text-brand-muted text-lg font-medium flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-brand-accent" />
                            Format: <span className="font-bold text-brand-text uppercase">{gameData.matchFormat}</span>
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard icon={Zap} title="Current Status" value={gameData.status} />
                    <StatCard icon={Calendar} title="Start Time" value={new Date(gameData.scheduledTime).toLocaleString()} />
                    <StatCard icon={Users} title="Participants" value={gameData.registeredPlayers?.length || 0} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-brand-surface p-8 rounded-3xl shadow-sm border border-brand">
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-4">
                                Match <span className="text-brand-primary">Bracket</span>
                                <div className="h-px flex-1 bg-brand-border"></div>
                            </h2>
                            {Object.keys(roundsMap).length > 0 ? (
                                Object.keys(roundsMap).sort((a, b) => a - b).map(round => (
                                    <div key={round} className="mb-10 last:mb-0">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm">{round}</div>
                                            <h3 className="text-lg font-black uppercase tracking-tight">Round {round}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {roundsMap[round].map(match => (
                                                <MatchCard key={match._id} match={match} matchFormat={gameData.matchFormat} />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : <p className="text-brand-muted italic">No matches generated yet.</p>}
                        </section>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <TournamentBracket game={gameData} matches={matches} />

                        <section className="bg-brand-surface p-8 rounded-3xl shadow-sm border border-brand">
                            <h2 className="text-lg font-black mb-6 uppercase tracking-tight">Players</h2>
                            <div className="space-y-4">
                                {gameData.registeredPlayers?.map((player, idx) => (
                                    <div key={player._id} className="flex items-center gap-3 p-3 bg-brand-background rounded-xl border border-brand">
                                        <div className="w-6 h-6 flex-shrink-0 bg-brand-surface border border-brand rounded flex items-center justify-center text-[10px] font-bold text-brand-muted">{idx + 1}</div>
                                        <p className="font-bold text-sm truncate">{player.name}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
