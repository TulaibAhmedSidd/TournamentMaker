'use client'
import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Loader2, List, Zap, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Helper Components ---

const TournamentCard = ({ tournament, onSelect }) => {
  const startDate = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD';

  return (
    <div
      className="bg-brand-surface p-6 rounded-2xl shadow-sm border border-brand hover:border-brand-primary transition-all duration-300 cursor-pointer flex flex-col justify-between group"
      onClick={() => onSelect(tournament._id)}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-brand-background text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
            <Trophy className="w-6 h-6" />
          </div>
          <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${tournament.status === 'Active' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{tournament.status}</span>
        </div>
        <h3 className="text-xl font-bold text-brand-text mb-3 leading-tight">
          {tournament.name}
        </h3>
        <div className="space-y-2 text-brand-muted text-sm">
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-primary" />
            Starts: {startDate}
          </p>
          <p className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-secondary" />
            Participants: {tournament.playerCount}
          </p>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-brand flex justify-between items-center">
        <span className="text-brand-primary text-sm font-bold flex items-center group-hover:gap-2 transition-all">
          Details <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </div>
    </div>
  );
};

const TournamentListApp = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/tournament');
        const result = await response.json();
        if (result.success) setTournaments(result.tournaments);
        else throw new Error(result.error);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchTournaments();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background">
      <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-background text-brand-text p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="py-12 text-center">
          <h1 className="text-5xl font-black tracking-tight mb-4">
            Active <span className="text-brand-primary">Tournaments</span>
          </h1>
          <p className="text-brand-muted text-lg max-w-xl mx-auto">
            Join the competition and test your skills. Select a tournament below to view the current bracket and results.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tournaments?.length > 0 ? (
            tournaments.map(t => (
              <TournamentCard key={t._id} tournament={t} onSelect={id => router.push(`/tournament/${id}`)} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-brand rounded-3xl">
              <Trophy className="w-12 h-12 text-brand-muted mx-auto mb-4 opacity-20" />
              <p className="text-brand-muted italic">No tournaments are currently scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentListApp;