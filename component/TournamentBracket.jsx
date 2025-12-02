'use client';

import React from 'react';

// Single Match Node in Bracket
const BracketMatch = ({ match }) => {
  const participants = match.participants || [];
  const winnerId = match.winner?._id;

  return (
    <div className="flex flex-col items-center bg-gray-700 rounded-xl p-3 w-48 mb-6 relative">
      {participants.length === 2 ? (
        <>
          <p
            className={`truncate font-semibold ${
              participants[0]._id === winnerId ? 'text-green-400' : 'text-white'
            }`}
          >
            {participants[0].name} {participants[0]._id === winnerId && '🏆'}
          </p>
          <span className="text-yellow-400 font-bold my-1">VS</span>
          <p
            className={`truncate font-semibold ${
              participants[1]._id === winnerId ? 'text-green-400' : 'text-white'
            }`}
          >
            {participants[1].name} {participants[1]._id === winnerId && '🏆'}
          </p>
        </>
      ) : (
        <p className="text-white italic">Bye / Waiting</p>
      )}
      <span className="text-gray-400 text-xs mt-2">Round {match.round}</span>
      <span className="text-gray-500 text-xs mt-1">{match.status}</span>

      {/* Connectors for bracket graph */}
      <div className="absolute right-[-16px] top-1/2 transform -translate-y-1/2 h-px w-4 bg-gray-500 hidden sm:block" />
    </div>
  );
};

// Tournament Bracket Graph
const TournamentBracket = ({ game, matches }) => {
  if (!matches || matches.length === 0) {
    return <p className="text-gray-400 italic">No matches scheduled yet.</p>;
  }

  // Group matches by rounds
  const roundsMap = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});

  // Determine tournament winner
  const tournamentWinner = game?.winner
    ? game?.registeredPlayers?.find(p => p._id === game?.winner)
    : null;
  console.log("tournamentWinnerx",tournamentWinner)
  console.log("game?.winner",game?.winner)
  console.log("game?.",game)
  return (
    <div className="flex flex-col items-center bg-gray-900 p-4 rounded-2xl">
      {/* Tournament Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-indigo-400">{game?.name}</h1>
        <p className="text-lg text-gray-300 mt-1">Status: {game?.status}</p>
        {tournamentWinner && (
          <p className="text-green-400 font-bold text-xl mt-2">
            Tournament Winner: {tournamentWinner.name} 🏆
          </p>
        )}
      </div>

      {/* Bracket */}
      <div style={{display:'flex',gap:'20px',alignItems:'center'}}>
        {Object.keys(roundsMap)
          .sort((a, b) => a - b)
          .map(round => (
            <div key={round} className="flex flex-col items-center gap-1">
              <h3 className="text-lg font-bold text-indigo-400 mb-4">Round {round}</h3>
              {roundsMap[round].map(match => (
                <BracketMatch key={match._id} match={match} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

export default TournamentBracket;
