'use client';

import React, { useState, useEffect } from 'react';
import { Users, Calendar, Trophy, Zap, Loader2, LinkIcon, AlertTriangle } from 'lucide-react';
import TournamentBracket from '@/component/TournamentBracket';

// --- Helper Components ---
const StatCard = ({ icon: Icon, title, value }) => (
    <div className="flex items-center p-4 bg-white/10 rounded-xl shadow-lg transition duration-300 hover:bg-white/20">
        <Icon className="w-6 h-6 text-indigo-400 mr-4" />
        <div>
            <p className="text-sm font-medium text-gray-300">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

// Matchup Card
const MatchCard = ({ match, index }) => {
    const participants = match.participants || [];
    return (
        <div className="flex flex-col   justify-between p-4 bg-gray-700 rounded-xl shadow-md mb-4 transition hover:bg-gray-600">
            <div className="mt-2 sm:mt-0 text-sm text-gray-400 font-mono">Round {match.round}</div>
            <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center  sm:gap-4 w-full">
                {participants.length === 2 ? (
                    <>
                        <p className="flex-1 text-white font-semibold truncate">{participants[0].name}</p>
                        <span className="text-yellow-400 font-bold text-xl mx-2">VS</span>
                        <p className="flex-1 text-white font-semibold truncate md:text-end text-start">{participants[1].name}</p>
                    </>
                ) : (
                    <p className="text-white italic">Bye / Waiting for participant</p>
                )}
            </div>
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
    const apiEndpoint = `/api/tournament/${gameId}`;

    useEffect(() => {
        const fetchGameDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(apiEndpoint);
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ message: 'Unknown server error.' }));
                    throw new Error(`Failed to fetch game data: ${response.status} - ${errorBody.message || 'Server responded with an error.'}`);
                }
                const result = await response.json();

                if (result.data?.game) {
                    setGameData(result.data.game);
                } else {
                    setError('API returned successfully but missing "game" object in response.');
                }

                if (result.data?.matches) {
                    setMatches(result.data.matches);
                }

            } catch (err) {
                console.error("Fetch error:", err);
                setError(`An error occurred while fetching data from ${apiEndpoint}: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchGameDetails();
    }, [gameId, apiEndpoint]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mr-3" />
                <p>Loading tournament details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 p-8">
                <div className="bg-red-800/80 p-6 rounded-xl text-white max-w-lg shadow-xl border border-red-500">
                    <h2 className="text-xl font-bold mb-2 flex items-center"><AlertTriangle className="w-6 h-6 mr-2" /> API Error</h2>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs text-red-300 mt-4">Please ensure your Next.js API route for `{apiEndpoint}` is running and returns the game data.</p>
                </div>
            </div>
        );
    }

    if (!gameData) return null;

    const startDate = gameData.scheduledTime ? new Date(gameData.scheduledTime).toLocaleString() : 'TBD';
    const registeredPlayers = gameData.registeredPlayers || [];

    // Group matches by rounds
    const roundsMap = matches.reduce((acc, match) => {
        if (!acc[match.round]) acc[match.round] = [];
        acc[match.round].push(match);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <header className="py-6 border-b border-gray-700 mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                        {gameData.name || 'Tournament Details'}
                    </h1>
                    <p className="mt-2 text-xl text-gray-400 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                        Game ID: <span className='font-mono text-sm ml-2'>{gameId}</span>
                    </p>
                    <p className="mt-1 text-sm text-gray-500 flex items-center">
                        <LinkIcon className="w-4 h-4 mr-1 text-gray-500" />
                        API Endpoint: {apiEndpoint}
                    </p>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard icon={Zap} title="Status" value={gameData.status || 'Unknown'} />
                    <StatCard icon={Calendar} title="Start Time" value={startDate} />
                    <StatCard icon={Users} title="Registered Players" value={registeredPlayers.length} />
                </div>

                {/* Registered Players */}
                <section className="bg-gray-800 p-6 rounded-2xl shadow-2xl mb-10">
                    <h2 className="text-2xl font-bold mb-4 border-b border-indigo-500/50 pb-2">
                        Participating Players
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {registeredPlayers.length > 0 ? registeredPlayers.map((player, index) => (
                            <div key={player._id || index} className="flex items-center p-3 bg-gray-700 rounded-lg transition duration-150 hover:bg-gray-600">
                                <div className="text-lg font-mono text-gray-400 w-8 flex-shrink-0">{index + 1}.</div>
                                <div className="ml-3 truncate">
                                    <p className="text-lg font-semibold text-white truncate">{player.name || 'Name Missing'}</p>
                                    <p className="text-xs text-gray-400 truncate mt-1">User ID: {player._id || 'Unknown ID'}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-400 italic col-span-2">No players registered yet.</p>
                        )}
                    </div>
                </section>

                {/* Tournament Matches */}
                <section className="bg-gray-800 p-6 rounded-2xl shadow-2xl">
                    <h2 className="text-2xl font-bold mb-4 border-b border-purple-500/50 pb-2">Tournament Matches</h2>

                    {Object.keys(roundsMap).length > 0 ? (
                        Object.keys(roundsMap).sort((a, b) => a - b).map(round => (
                            <div key={round} className="mb-6">
                                <h3 className="text-xl font-semibold mb-3 text-indigo-400">Round {round}</h3>
                                {roundsMap[round].map((match, idx) => (
                                    <MatchCard key={match._id || idx} match={match} index={idx} />
                                ))}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 italic">No matches scheduled yet.</p>
                    )}
                </section>
                <section className="mt-10 p-6 bg-gray-800 rounded-2xl shadow-2xl">
                    <h2 className="text-2xl font-bold mb-4 border-b border-purple-500/50 pb-2">
                        Tournament Bracket
                    </h2>
                    <TournamentBracket
                    game={gameData}
                    matches={matches} />
                </section>
            </div>
        </div>
    );
};

export default App;
