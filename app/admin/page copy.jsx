'use client'; 
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Users, Clock, Trophy, Shuffle, UserPlus, Zap, CheckCircle, ExternalLink, XCircle } from 'lucide-react';

// Mock list of players for registration (Kept for reference, but functionality will change)
// NOTE: These are only used for the initial registration API call setup. 
// Player details for matches are now fetched via API from the Match model population.
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : null,
  };
  
  const response = await fetch(endpoint, options);
  // Implement exponential backoff for retries if needed in a production scenario
  return response.json();
};


const MatchWinnerForm = ({ match, onWinnerRecorded }) => {
    const [selectedWinnerId, setSelectedWinnerId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

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
            
            if (result.success) {
                // Display the detailed message returned from the API, including advancement status
                setMessage(result.message || `Winner recorded! Match ${match._id} completed.`);
                onWinnerRecorded(); 
            } else {
                setMessage(`Error: ${result.error || 'Failed to record winner.'}`);
            }
        } catch (error) {
            console.error('API Error:', error);
            setMessage('Network error recording winner.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 7000); // Increased timeout for multi-step message
        }
    };
    
    // Handle bye matches automatically showing the winner
    if (match.isBye) {
        const byePlayer = match.participants[0];
        return (
            <div className="flex justify-between items-center text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                <span className="font-semibold text-indigo-500">{byePlayer.name} (Bye)</span>
                <span className="flex items-center text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4 mr-1" /> Auto-Completed
                </span>
            </div>
        );
    }


    return (
        <form onSubmit={handleSubmitWinner} className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-3 items-center w-full mt-3 pt-3 border-t border-gray-100">
            <select
                value={selectedWinnerId}
                onChange={(e) => { setSelectedWinnerId(e.target.value); setMessage(''); }}
                required
                className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            >
                <option value="">Select Winner</option>
                {match.participants.map(player => (
                    <option key={player._id} value={player._id}>
                        {player.name}
                    </option>
                ))}
            </select>
            
            <button
                type="submit"
                disabled={isLoading || !selectedWinnerId}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition duration-150 shadow-md"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Trophy className="h-4 w-4 mr-2" />
                )}
                Record Win
            </button>
            
            {message && (
                <p className={`text-xs font-medium w-full sm:w-1/2 p-2 rounded-lg text-center ${message.startsWith('Error') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>
                    {message}
                </p>
            )}
        </form>
    );
};


const ActiveMatchList = ({ activeMatches, isLoading, fetchActiveMatches }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-red-600" />
                Matches Awaiting Result ({activeMatches.length})
            </h2>

            {isLoading ? (
                <div className="flex justify-center items-center h-40 text-indigo-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading active matches...
                </div>
            ) : activeMatches.length === 0 ? (
                <p className="text-gray-500 italic">No matches currently scheduled or active. Draft a game to begin!</p>
            ) : (
                <div className="space-y-4">
                    {activeMatches.map((match) => (
                        <div key={match._id} className="p-4 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition duration-150">
                            <div className="flex justify-between items-start">
                                <div className="flex-grow">
                                    <p className="text-md font-bold text-red-700">
                                        Round {match.round} - {match.game.name}
                                    </p>
                                    <p className="text-lg font-semibold text-gray-800">
                                        {/* Display Player names */}
                                        {match.participants.map(p => p.name).join(' vs ')}
                                    </p>
                                    <div className="flex text-sm text-gray-600 mt-1">
                                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-yellow-600" /> {new Date(match.scheduledTime).toLocaleString()}</span>
                                    </div>
                                </div>
                                <span className="px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-red-200 text-red-800">
                                    AWAITING RESULT
                                </span>
                            </div>
                            <MatchWinnerForm match={match} onWinnerRecorded={fetchActiveMatches} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- Player Registration Component (NEW) ---

const PlayerRegistrationForm = ({ gameId, onPlayerRegistered, gameStatus }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // Only allow registration if the game is open
    const canRegister = gameStatus === 'Registration Open';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canRegister) {
            setMessage('Registration is closed for this tournament.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        const endpoint = `/api/admin/game/${gameId}/register-player`;
        // Send a single player object in an array
        const data = { players: [{ name, email }] }; 

        try {
            const result = await apiCall(endpoint, 'POST', data);
            
            if (result.success) {
                setMessage(`Player "${name}" registered successfully!`);
                setName('');
                setEmail('');
                onPlayerRegistered(); 
            } else {
                setMessage(`Error: ${result.error || 'Failed to register player.'}`);
            }
        } catch (error) {
            console.error('API Error:', error);
            setMessage('Network error registering player.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 5000); 
        }
    };
    
    if (!canRegister) return null;

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-indigo-50 rounded-lg mt-4 border border-indigo-200">
            <h4 className="text-lg font-semibold text-indigo-700 mb-3 flex items-center">
                <UserPlus className="w-4 h-4 mr-2" /> Register Player
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                    type="text"
                    placeholder="Player Name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setMessage(''); }}
                    required
                    className="w-full p-2 border text-indigo-500 border-indigo-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <input
                    type="email"
                    placeholder="Player Email (Unique ID)"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setMessage(''); }}
                    required
                    className="w-full p-2 border text-indigo-500 border-indigo-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <button
                    type="submit"
                    disabled={isLoading || !name || !email}
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-md"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    Add Player
                </button>
            </div>
            {message && (
                <p className={`text-xs font-medium mt-3 p-2 rounded-lg text-center ${message.startsWith('Error') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>
                    {message}
                </p>
            )}
        </form>
    );
};


// --- Existing Components (GameForm and GameList) ---

const GameForm = ({ onGameCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Table Tennis',
    matchFormat: '1v1',
    scheduledTime: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const result = await apiCall('/api/admin/game', 'POST', formData);
      
      if (result.success) {
        setMessage(`Game "${result.data.name}" created successfully!`);
        setFormData({
            name: '',
            type: 'Table Tennis',
            matchFormat: '1v1',
            scheduledTime: '',
        });
        onGameCreated(); // Refresh the list
      } else {
        setMessage(`Error: ${result.error || 'Failed to create game.'}`);
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Plus className="w-5 h-5 mr-2 text-indigo-600" />
        Create New Tournament
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Q4 Table Tennis Championship"
            className="w-full p-3 border text-indigo-500 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Game Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-3 border text-indigo-500 border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          >
            <option value="Table Tennis">Table Tennis</option>
            <option value="Foosball">Foosball</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="matchFormat" className="block text-sm font-medium text-gray-700 mb-1">Match Format</label>
          <select
            id="matchFormat"
            name="matchFormat"
            value={formData.matchFormat}
            onChange={handleChange}
            className="w-full p-3 border text-indigo-500 border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          >
            <option value="1v1">1 vs 1 (Singles)</option>
            <option value="2v2">2 vs 2 (Doubles/Teams)</option>
            <option value="4v4">4 vs 4 (Team)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
          <input
            type="datetime-local"
            id="scheduledTime"
            name="scheduledTime"
            value={formData.scheduledTime}
            onChange={handleChange}
            required
            className="w-full p-3 border text-indigo-500 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-between mt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Creating...' : 'Create Tournament'}
          </button>
          {message && (
            <p className={`text-sm font-medium ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

const GameActions = ({ game, onActionComplete }) => {
    // NOTE: Removed isRegistering state and the bulk registration button
    const [isDrafting, setIsDrafting] = useState(false);
    const [message, setMessage] = useState('');

    const runAction = useCallback(async (actionType) => {
        setMessage('');
        let endpoint = '';
        let body = {};
        
        if (actionType === 'draft') {
            setIsDrafting(true);
            endpoint = `/api/admin/game/${game._id}/draft`;
            body = {};
        }

        try {
            const result = await apiCall(endpoint, 'POST', body);
            
            if (result.success) {
                setMessage(result.message || 'Action completed successfully.');
                onActionComplete(); // Refresh game list
            } else {
                setMessage(`Error: ${result.error || 'Action failed.'}`);
            }
        } catch (error) {
            console.error('API Error:', error);
            setMessage('Network error. Check console.');
        } finally {
            setIsDrafting(false);
            setTimeout(() => setMessage(''), 5000);
        }
    }, [game._id, onActionComplete]);
    
    // Determine action button availability
    const canDraft = game.status === 'Registration Open' && game.registeredPlayers.length >= 2;
    const isProcessing = isDrafting;
    // NOTE: Removed canRegister since individual registration is now a separate form

    return (
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2 w-full mt-3 pt-3 border-t border-gray-100">
            {/* Individual Player Registration Form is now displayed separately below */}

            {canDraft && (
                <button
                    onClick={() => runAction('draft')}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50 transition shadow-md"
                >
                    {isDrafting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shuffle className="h-4 w-4 mr-2" />}
                    {isDrafting ? 'Drafting...' : 'Start Random Draft (Round 1)'}
                </button>
            )}
            
            {!canDraft && game.status === 'Registration Open' && game.registeredPlayers.length < 2 && (
                <span className="flex-1 text-center text-xs text-red-500 p-2 bg-red-50 rounded-lg">
                    Need at least 2 players to draft.
                </span>
            )}

            {message && (
                <p className={`text-sm font-medium p-2 rounded-lg ${message.startsWith('Error') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}

const GameList = ({ games, isLoading, fetchGames, fetchActiveMatches }) => {
  const refetchAllData = useCallback(() => {
    fetchGames();
    fetchActiveMatches();
  }, [fetchGames, fetchActiveMatches]);
    
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Trophy className="w-5 h-5 mr-2 text-green-600" />
        Existing Tournaments ({games.length})
      </h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40 text-indigo-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading games...
        </div>
      ) : games.length === 0 ? (
        <p className="text-gray-500 italic">No tournaments created yet.</p>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <div key={game._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col hover:bg-gray-100 transition duration-150">
              <div className="flex justify-between items-start">
                  <div className="flex-grow">
                      <p className="text-lg font-semibold text-indigo-700">{game.name}</p>
                      <div className="flex flex-wrap text-sm text-gray-600 mt-1 space-x-4">
                          <span className="flex items-center"><Zap className="w-4 h-4 mr-1 text-blue-500" /> {game.type} ({game.matchFormat})</span>
                          <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-yellow-600" /> {new Date(game.scheduledTime).toLocaleString()}</span>
                          <span className="flex items-center"><Users className="w-4 h-4 mr-1 text-gray-500" /> Players: {game.registeredPlayers.length}</span>
                      </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      game.status === 'Registration Open' ? 'bg-green-100 text-green-800' :
                      game.status === 'Active' ? 'bg-yellow-100 text-yellow-800' :
                      game.status === 'Completed' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                      {game.status}
                  </span>
              </div>
              
              {/* NEW: Individual Player Registration Form */}
              <PlayerRegistrationForm 
                gameId={game._id} 
                onPlayerRegistered={refetchAllData} 
                gameStatus={game.status} 
              />
              
              {/* Game Actions (Drafting) */}
              <GameActions game={game} onActionComplete={refetchAllData} />
              
              <a 
                href={`/tournament/${game._id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 transition"
              >
                <ExternalLink className="h-4 w-4 mr-2" /> View Public Bracket
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// Main App Component for the Admin Page
export default function App() {
  const [games, setGames] = useState([]);
  const [activeMatches, setActiveMatches] = useState([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);


  const fetchGames = useCallback(async () => {
    setIsLoadingGames(true);
    try {
      const result = await apiCall('/api/admin/game');
      if (result.success) {
        setGames(result.data);
      } else {
        console.error('Failed to fetch games:', result.error);
        setGames([]);
      }
    } catch (error) {
      console.error('Network Error fetching games:', error);
      setGames([]);
    } finally {
      setIsLoadingGames(false);
    }
  }, []);
  
  const fetchActiveMatches = useCallback(async () => {
    setIsLoadingMatches(true);
    try {
      // Fetch matches that are scheduled or in progress
      const result = await apiCall('/api/admin/match'); 
      if (result.success) {
        setActiveMatches(result.data);
      } else {
        console.error('Failed to fetch active matches:', result.error);
        setActiveMatches([]);
      }
    } catch (error) {
      console.error('Network Error fetching active matches:', error);
      setActiveMatches([]);
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
    fetchActiveMatches();
  }, [fetchGames, fetchActiveMatches]);
  
  // Combine fetching functions for re-render after action
  const refetchAllData = useCallback(() => {
      fetchGames();
      fetchActiveMatches();
  }, [fetchGames, fetchActiveMatches]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          Tournament Manager
        </h1>
        <p className="mt-2 text-lg text-indigo-600">Admin Control Panel</p>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        <GameForm onGameCreated={refetchAllData} />
        
        {/* Match results section */}
        <ActiveMatchList 
            activeMatches={activeMatches} 
            isLoading={isLoadingMatches} 
            fetchActiveMatches={refetchAllData} 
        />
        
        {/* Tournament list with player registration and drafting */}
        <GameList 
            games={games} 
            isLoading={isLoadingGames} 
            fetchGames={refetchAllData} 
            fetchActiveMatches={fetchActiveMatches} // Pass to allow GameList to refresh matches after drafting
        />
        
        <div className="mt-12 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg text-sm text-indigo-700">
            <p className="font-semibold">Next Steps:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
                <li>**Player Management:** You can now register players individually for tournaments in the list below. The mock player system has been replaced with the new form.</li>
                <li>**Public Viewer:** The public viewer is now available at `/tournament/[id]`. Try creating a game, registering players, drafting, and recording a winner to see the bracket advance!</li>
                <li>**Team Games:** Refine the drafting logic to handle **4v4 team games** (grouping players into teams first, and then matching teams). This is more complex and will require a new `Team` model.</li>
            </ul>
        </div>
      </div>
    </div>
  );
}