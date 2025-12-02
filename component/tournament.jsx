'use client'
import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Loader2, List, Zap, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Helper Components ---

const TournamentCard = ({ tournament, onSelect }) => {
  const startDate = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD';
  
  return (
    <div
      style={{padding:'16px'}} 
      className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-500 transition duration-300 cursor-pointer flex flex-col justify-between"
      onClick={() => onSelect(tournament._id)}
    >
      <div>
        <h3 className="text-xl font-bold text-white mb-2 flex items-center">
          <Trophy className="w-5 h-5 text-yellow-500 mr-2"/>
          {tournament.name}
        </h3>
        <div className="space-y-2 text-gray-400 text-sm">
          <p className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-indigo-400"/>
            Start: {startDate}
          </p>
          <p className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-green-400"/>
            Players: {tournament.playerCount}
          </p>
          <p className="flex items-center">
            <Zap className="w-4 h-4 mr-2 text-red-400"/>
            Status: {tournament.status || 'Pending'}
          </p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-700 flex justify-end">
        <span className="text-indigo-400 flex items-center font-medium">
          View Details <ArrowRight className="w-4 h-4 ml-1"/>
        </span>
      </div>
    </div>
  );
};


// --- Main Component ---

const TournamentListApp = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const apiEndpoint = '/api/tournament'; 
  const router = useRouter()

  console.log("tournaments",tournaments)
  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(apiEndpoint);
        
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: 'Unknown server error.' }));
          throw new Error(`Failed to fetch tournaments: ${response.status} - ${errorBody.message || 'Server error.'}`);
        }

        const result = await response.json();
        
        if (result.tournaments || result.data.tournaments) {
          setTournaments(result.tournaments || result.data.tournaments);
        } else {
          setError('API returned successfully but missing "tournaments" array.');
        }

      } catch (err) {
        console.error("Fetch error:", err);
        setError(`An error occurred while fetching data from ${apiEndpoint}: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [apiEndpoint]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mr-3" />
        <p>Loading tournament list...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-8">
        <div className="bg-red-800/80 p-6 rounded-xl text-white max-w-lg shadow-xl border border-red-500">
          <h2 className="text-xl font-bold mb-2">API Error</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <header className="py-6 border-b border-gray-700 mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Available Tournaments
          </h1>
          <p className="mt-2 text-xl text-gray-400 flex items-center">
            <List className="w-5 h-5 mr-2 text-purple-400"/> 
            Select a tournament to view details.
          </p>
        </header>

        {/* Tournament Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments?.length > 0 ? (
            tournaments?.map(tournament => (
              <TournamentCard 
                key={tournament._id} 
                tournament={tournament} 
                onSelect={(tournamentID)=>{router.push(`/tournament/${tournamentID}`)}} 
              />
            ))
          ) : (
            <p className="text-gray-400 italic col-span-3">No tournaments found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentListApp;