import { useState, useEffect } from 'react';
import TournamentSetup from './components/TournamentSetup';
import BracketView from './components/BracketView';
import { listTournaments, deleteTournament } from './lib/api';
import type { Tournament } from './lib/tournamentEngine';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'setup' | 'bracket'>('home');
  const [currentTournamentId, setCurrentTournamentId] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    if (currentView === 'home') {
      loadTournaments();
    }
  }, [currentView]);

  const loadTournaments = async () => {
    const { tournaments } = await listTournaments();
    setTournaments(tournaments);
  };

  const handleTournamentCreated = (tournamentId: string) => {
    setCurrentTournamentId(tournamentId);
    setCurrentView('bracket');
  };

  const handleDeleteTournament = async (tournamentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      const { success } = await deleteTournament(tournamentId);
      if (success) {
        loadTournaments();
      } else {
        alert('Failed to delete tournament');
      }
    }
  };

  const handleViewTournament = (tournamentId: string) => {
    setCurrentTournamentId(tournamentId);
    setCurrentView('bracket');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setCurrentTournamentId(null);
  };

  if (currentView === 'setup') {
    return <TournamentSetup onTournamentCreated={handleTournamentCreated} />;
  }

  if (currentView === 'bracket' && currentTournamentId) {
    return (
      <div className="min-h-screen bg-dark-950">
        <div className="bg-dark-900 p-6 border-b border-dark-800 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleBackToHome}
              className="btn-secondary"
            >
              ← Back to Tournaments
            </button>
          </div>
        </div>
        <BracketView tournamentId={currentTournamentId} />
      </div>
    );
  }

  // Home View
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-dark-900 via-primary-950 to-dark-950 py-24 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNGgybDJ2LTJoLTJ2Mnptb C0ydjJoMnYtMmgtMnptLTItNGg0djRoLTR2LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative z-10">
          <h1 className="font-display text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500 mb-6 tracking-tight drop-shadow-2xl animate-pulse">
            MORTAL KOMBAT
          </h1>
          <p className="font-display text-4xl text-accent-400 mb-8 tracking-wider">TOURNAMENT MANAGER</p>
          <div className="h-1.5 w-64 bg-gradient-to-r from-transparent via-primary-500 to-transparent mx-auto mb-8 rounded-full"></div>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            Double Elimination Tournament System • Real-Time Updates • Grand Finals Reset
          </p>

          <button
            onClick={() => setCurrentView('setup')}
            className="btn-primary text-xl px-16 py-5"
          >
            CREATE NEW TOURNAMENT
          </button>
        </div>
      </div>

      {/* Recent Tournaments */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="font-display text-4xl font-bold text-white mb-8">Recent Tournaments</h2>

        {tournaments.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-6xl mb-6">🎮</div>
            <p className="text-dark-400 text-xl mb-2">No tournaments yet</p>
            <p className="text-dark-500">Create your first tournament to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="card group cursor-pointer hover:border-accent-500 hover:shadow-xl hover:shadow-accent-900/20 transition-all duration-300 relative"
                onClick={() => handleViewTournament(tournament.id)}
              >
                <button
                  onClick={(e) => handleDeleteTournament(tournament.id, e)}
                  className="absolute top-4 right-4 text-dark-500 hover:text-primary-500 transition-colors z-10"
                  title="Delete tournament"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <div className="flex items-start justify-between mb-4 pr-8">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                    {tournament.name}
                  </h3>
                  <div className="text-2xl">🏆</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-400 text-sm">Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tournament.status === 'Completed'
                          ? 'bg-green-500/20 text-green-400'
                          : tournament.status === 'In-Progress'
                          ? 'bg-accent-500/20 text-accent-400'
                          : 'bg-primary-500/20 text-primary-400'
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-400 text-sm">Fighters</span>
                    <span className="text-white font-semibold text-lg">{tournament.participant_count}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-dark-700 flex items-center justify-between">
                    <span className="text-accent-500 text-sm font-medium group-hover:text-accent-400 transition-colors">
                      View Bracket →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-dark-900 to-dark-950 py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-600">
            Tournament Features
          </h2>
          <p className="text-center text-dark-400 mb-16 text-lg">Everything you need for professional tournament management</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center group hover:border-primary-500 transition-all">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🏆</div>
              <h3 className="text-2xl font-bold text-white mb-3 font-display">Double Elimination</h3>
              <p className="text-dark-400 leading-relaxed">
                Every fighter gets a second chance. Winners and Losers brackets ensure fair competition.
              </p>
            </div>

            <div className="card text-center group hover:border-accent-500 transition-all">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-3 font-display">Real-Time Updates</h3>
              <p className="text-dark-400 leading-relaxed">
                Powered by Supabase Realtime. All participants see bracket updates instantly.
              </p>
            </div>

            <div className="card text-center group hover:border-primary-500 transition-all">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🔄</div>
              <h3 className="text-2xl font-bold text-white mb-3 font-display">Grand Finals Reset</h3>
              <p className="text-dark-400 leading-relaxed">
                Lucky Loser rule: Losers bracket winner forces a Grand Finals reset if they win.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark-950 py-8 text-center text-dark-500 text-sm border-t border-dark-800">
        <p className="mb-2">Built with React + Vite + Supabase + Tailwind CSS</p>
        <p>Double Elimination Tournament System • 2025</p>
      </footer>
    </div>
  );
}

export default App;
