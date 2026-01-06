'use client';

import React, { useState, useEffect } from 'react';
import { Users, Calendar, Trophy, Zap, Loader2, LinkIcon, AlertTriangle, ArrowRight } from 'lucide-react';

// --- Helper Components ---

// Stat Card
const StatCard = ({ icon: Icon, title, value }) => (
    <div className="flex items-center p-4 bg-white/10 rounded-xl shadow-lg transition duration-300 hover:bg-white/20">
        <Icon className="w-6 h-6 text-indigo-400 mr-4" />
        <div>
            <p className="text-sm font-medium text-gray-300">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

// Team Display
const TeamDisplay = ({ team, winnerId, matchStatus }) => {
    const teamNames = team.map(p => p.name).join(' & ');
    const isWinner = team.some(p => p._id === winnerId);

    return (
        <div className="flex items-center truncate">
            <span
                className={`text-lg font-semibold truncate ${
                    isWinner && matchStatus === 'Completed' ? 'text-yellow-300' : 'text-white'
                }`}
                title={teamNames}
            >
                {teamNames}
            </span>
            {isWinner && matchStatus === 'Completed' && (
                <Trophy className="w-4 h-4 text-yellow-400 ml-2 flex-shrink-0" />
            )}
        </div>
    );
};

// Match Card
const MatchCard = ({ match, index, matchFormat }) => {
    const participants = match.participants || [];
    const winnerId = match.winner?._id;

    let team1 = [];
    let team2 = [];
    const expectedPlayers = matchFormat === '2v2' ? 4 : 2;

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
        <div className="flex flex-col justify-between p-4 bg-gray-700 rounded-xl shadow-md mb-4 transition hover:bg-gray-600 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
                <div className="text-sm font-mono text-gray-400">Round {match.round} | Match {match.matchNumber}</div>
                <div
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                        isCompleted ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                    }`}
                >
                    {match.status}
                </div>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center sm:gap-4 w-full mt-2">
                {participants.length >= 2 ? (
                    <>
                        <div className="flex-1 text-left py-1">
                            <TeamDisplay team={team1} winnerId={winnerId} matchStatus={match.status} />
                        </div>
                        <span className="text-yellow-400 font-bold text-xl mx-2 py-2 sm:py-0">VS</span>
                        <div className="flex-1 text-left sm:text-right py-1">
                            <TeamDisplay team={team2} winnerId={winnerId} matchStatus={match.status} />
                        </div>
                    </>
                ) : (
                    <p className="text-white italic text-center w-full">
                        Bye or Waiting for Participants ({participants.length}/{expectedPlayers} required)
                    </p>
                )}
            </div>
        </div>
    );
};

// Tournament Summary
const TournamentBracket = ({ game, matches }) => {
    const gameWinnerName = game.winner?.name || 'TBD';
    const isCompleted = game.status === 'Completed' && game.winner;

    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => b - a);
    const finalRound = rounds[0];
    const finalMatch = matches.find(m => m.round === finalRound && m.status === 'Completed');

    return (
        <div className="p-4 bg-gray-700 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 text-indigo-300 border-b border-gray-600 pb-2">Tournament Summary</h3>

            {isCompleted ? (
                <div className="text-center p-6 bg-gray-600 rounded-lg shadow-inner">
                    <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3 animate-pulse" />
                    <p className="text-xl text-gray-300">Champion</p>
                    <p className="text-4xl font-extrabold text-yellow-300 mt-1">{gameWinnerName}</p>
                    <p className="text-sm text-gray-400 mt-2">({game.matchFormat} Winner)</p>
                </div>
            ) : (
                <p className="text-gray-400 italic text-center p-4">Tournament is ongoing. Final result pending.</p>
            )}

            {finalMatch && finalRound > 1 && (
                <div className="mt-6 border-t border-gray-600 pt-4">
                    <p className="text-lg font-semibold text-gray-300 flex items-center mb-3">
                        <ArrowRight className="w-5 h-5 mr-2 text-indigo-400" />
                        Final Match (Round {finalRound})
                    </p>
                    <MatchCard match={finalMatch} index={0} matchFormat={game.matchFormat} />
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
    const apiEndpoint = `/api/tournament/${gameId}`;

    useEffect(() => {
        const fetchGameDetails = async () => {
            setLoading(true);
            setError(null);

            for (let i = 0; i < 3; i++) {
                try {
                    const response = await fetch(apiEndpoint,{ cache: 'no-store' });

                    if (!response.ok) {
                        const errorBody = await response.json().catch(() => ({ message: 'Unknown server error.' }));
                        throw new Error(
                            `Failed to fetch game data: ${response.status} - ${
                                errorBody.error || errorBody.message || 'Server responded with an error.'
                            }`
                        );
                    }

                    const result = await response.json();

                    if (!result.data?.game) throw new Error('API returned successfully but missing "game" object.');

                    setGameData(result.data.game);
                    setMatches(result.data.matches || []);

                    setLoading(false);
                    return;
                } catch (err) {
                    if (i < 2) {
                        const delay = Math.pow(2, i) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        setError(`Error fetching data from ${apiEndpoint}: ${err.message}`);
                    }
                }
            }
            setLoading(false);
        };

        fetchGameDetails();
    }, [gameId, apiEndpoint]);

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mr-3" />
                <p>Loading tournament details...</p>
            </div>
        );

    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 sm:p-8">
                <div className="bg-red-800/80 p-6 rounded-xl text-white max-w-lg shadow-xl border border-red-500">
                    <h2 className="text-xl font-bold mb-2 flex items-center">
                        <AlertTriangle className="w-6 h-6 mr-2" /> API Error
                    </h2>
                    <p className="text-sm break-all">{error}</p>
                    <p className="text-xs text-red-300 mt-4">
                        Please ensure your Next.js API route for `{apiEndpoint}` is running.
                    </p>
                </div>
            </div>
        );

    if (!gameData) return null;

    const startDate = gameData.scheduledTime ? new Date(gameData.scheduledTime).toLocaleString() : 'TBD';
    const registeredPlayers = gameData.registeredPlayers || [];
    const matchFormat = gameData.matchFormat || '1v1';

    const roundsMap = matches.reduce((acc, match) => {
        (acc[match.round] = acc[match.round] || []).push(match);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="py-6 border-b border-gray-700 mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                        {gameData.name || 'Tournament Details'}
                    </h1>

                    <p className="mt-2 text-xl text-gray-400 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                        Format: <span className="font-mono text-lg ml-2 capitalize">{matchFormat}</span>
                    </p>

                    <p className="mt-1 text-sm text-gray-500 flex items-center">
                        <LinkIcon className="w-4 h-4 mr-1 text-gray-500" />
                        API Endpoint: {apiEndpoint}
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard icon={Zap} title="Status" value={gameData.status || 'Unknown'} />
                    <StatCard icon={Calendar} title="Start Time" value={startDate} />
                    <StatCard icon={Users} title="Registered Players" value={registeredPlayers.length} />
                </div>

                <section className="mb-10">
                    <TournamentBracket game={gameData} matches={matches} />
                </section>

                <section className="bg-gray-800 p-6 rounded-2xl shadow-2xl mb-10">
                    <h2 className="text-2xl font-bold mb-4 border-b border-indigo-500/50 pb-2">
                        Participating Players
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {registeredPlayers.length > 0 ? (
                            registeredPlayers.map((player, index) => (
                                <div
                                    key={player._id || index}
                                    className="flex items-center p-3 bg-gray-700 rounded-lg transition duration-150 hover:bg-gray-600"
                                >
                                    <div className="text-lg font-mono text-gray-400 w-8 flex-shrink-0">
                                        {index + 1}.
                                    </div>
                                    <div className="ml-3 truncate">
                                        <p className="text-lg font-semibold text-white truncate">
                                            {player.name || 'Name Missing'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate mt-1">
                                            User ID: {player._id || 'Unknown ID'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 italic col-span-2">No players registered yet.</p>
                        )}
                    </div>
                </section>

                <section className="bg-gray-800 p-6 rounded-2xl shadow-2xl">
                    <h2 className="text-2xl font-bold mb-4 border-b border-purple-500/50 pb-2">
                        Tournament Matches
                    </h2>

                    {Object.keys(roundsMap).length > 0 ? (
                        Object.keys(roundsMap)
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .map(round => (
                                <div key={round} className="mb-6">
                                    <h3 className="text-xl font-semibold mb-3 text-indigo-400">Round {round}</h3>
                                    {roundsMap[round].map((match, idx) => (
                                        <MatchCard
                                            key={match._id || idx}
                                            match={match}
                                            index={idx}
                                            matchFormat={matchFormat}
                                        />
                                    ))}
                                </div>
                            ))
                    ) : (
                        <p className="text-gray-400 italic">No matches scheduled yet.</p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default App;
