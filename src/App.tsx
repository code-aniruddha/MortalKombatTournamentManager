import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaTrash, FaPlus } from 'react-icons/fa';
import { GiGamepad } from 'react-icons/gi';
import TournamentSetup from './components/TournamentSetup';
import BracketView from './components/BracketView';
import PS5ControllerBackground from './components/PS5ControllerBackground';
import LoadingScreen from './components/LoadingScreen';
import { listTournaments, deleteTournament } from './lib/api';
import type { Tournament } from './lib/tournamentEngine';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'setup' | 'bracket'>('home');
  const [currentTournamentId, setCurrentTournamentId] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentView === 'home') {
      loadTournaments();
    }
  }, [currentView]);

  const loadTournaments = async () => {
    setIsLoading(true);
    const { tournaments } = await listTournaments();
    setTournaments(tournaments);
    setIsLoading(false);
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
      <>
        <PS5ControllerBackground />
        <div className="min-h-screen relative z-10">
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 border-b border-blood/30 shadow-lg backdrop-blur-sm"
            style={{ background: 'rgba(26, 26, 26, 0.8)' }}
          >
            <div className="max-w-7xl mx-auto">
              <button
                onClick={handleBackToHome}
                className="btn-secondary"
              >
                ← Back to Tournaments
              </button>
            </div>
          </motion.div>
          <BracketView tournamentId={currentTournamentId} />
        </div>
      </>
    );
  }

  // Home View
  return (
    <>
      <PS5ControllerBackground />
      {isLoading && <LoadingScreen />}
      <div className="min-h-screen relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="py-24 px-8 text-center relative overflow-hidden backdrop-blur-sm"
          style={{ background: 'rgba(13, 13, 13, 0.3)' }}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1
              className="text-9xl font-black mb-6 tracking-tight"
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                color: '#8B0000',
                textShadow: '0 0 40px rgba(139, 0, 0, 0.8), 0 0 80px rgba(139, 0, 0, 0.5)'
              }}
            >
              MORTAL KOMBAT
            </h1>
          </motion.div>

          <motion.p
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl mb-8"
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              color: '#C5A059',
              letterSpacing: '0.15em'
            }}
          >
            TOURNAMENT MANAGER
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="h-1 w-80 mx-auto mb-8 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #00FF41, transparent)',
              boxShadow: '0 0 20px #00FF41'
            }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-text-muted text-lg max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Double Elimination Tournament System • Real-Time Updates • Grand Finals Reset
          </motion.p>

          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentView('setup')}
            className="btn-primary text-xl px-16 py-5 inline-flex items-center gap-3"
          >
            <FaPlus /> CREATE NEW TOURNAMENT
          </motion.button>
        </motion.div>

        {/* Recent Tournaments */}
        <div className="max-w-7xl mx-auto px-8 py-16">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-text mb-8 flex items-center gap-3"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
          >
            <FaTrophy className="text-gold" /> Recent Tournaments
          </motion.h2>

        {tournaments.length === 0 ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card p-16 text-center"
          >
            <GiGamepad className="text-8xl text-blood mx-auto mb-6" />
            <p className="text-text text-xl mb-2">No tournaments yet</p>
            <p className="text-text-muted">Create your first tournament to get started!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="card group cursor-pointer transition-all duration-300 relative"
                onClick={() => handleViewTournament(tournament.id)}
              >
                <button
                  onClick={(e) => handleDeleteTournament(tournament.id, e)}
                  className="absolute top-4 right-4 text-text-muted hover:text-blood transition-colors z-10"
                  title="Delete tournament"
                >
                  <FaTrash className="w-4 h-4" />
                </button>

                <div className="flex items-start justify-between mb-4 pr-8">
                  <h3
                    className="text-xl font-bold text-text group-hover:text-blood transition-colors"
                    style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
                  >
                    {tournament.name}
                  </h3>
                  <FaTrophy className="text-2xl text-gold" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-sm">Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tournament.status === 'Completed'
                          ? 'bg-soul/20 text-soul border border-soul/30'
                          : tournament.status === 'In-Progress'
                          ? 'bg-gold/20 text-gold border border-gold/30'
                          : 'bg-blood/20 text-blood border border-blood/30'
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-sm">Fighters</span>
                    <span className="text-text font-semibold text-lg">{tournament.participant_count}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-obsidian-light/50 flex items-center justify-between">
                    <span className="text-soul text-sm font-medium group-hover:text-soul-light transition-colors">
                      View Bracket →
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="py-20 px-8 backdrop-blur-sm" style={{ background: 'rgba(26, 26, 26, 0.5)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-5xl font-bold text-center mb-4 text-gold"
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '0.1em',
              textShadow: '0 0 30px rgba(197, 160, 89, 0.5)'
            }}
          >
            Tournament Features
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-text-muted mb-16 text-lg"
          >
            Everything you need for professional tournament management
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="card text-center group"
            >
              <FaTrophy className="text-6xl mb-6 text-gold mx-auto group-hover:scale-110 transition-transform" />
              <h3
                className="text-2xl font-bold text-text mb-3"
                style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
              >
                Double Elimination
              </h3>
              <p className="text-text-muted leading-relaxed">
                Every fighter gets a second chance. Winners and Losers brackets ensure fair competition.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="card text-center group"
            >
              <div className="text-6xl mb-6 text-soul mx-auto group-hover:scale-110 transition-transform" style={{ textShadow: '0 0 20px #00FF41' }}>⚡</div>
              <h3
                className="text-2xl font-bold text-text mb-3"
                style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
              >
                Real-Time Updates
              </h3>
              <p className="text-text-muted leading-relaxed">
                Powered by Supabase Realtime. All participants see bracket updates instantly.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              className="card text-center group"
            >
              <div className="text-6xl mb-6 text-blood mx-auto group-hover:scale-110 transition-transform" style={{ textShadow: '0 0 20px #8B0000' }}>🔄</div>
              <h3
                className="text-2xl font-bold text-text mb-3"
                style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
              >
                Grand Finals Reset
              </h3>
              <p className="text-text-muted leading-relaxed">
                Lucky Loser rule: Losers bracket winner forces a Grand Finals reset if they win.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-text-muted text-sm border-t border-blood/20 backdrop-blur-sm" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
        <p className="mb-2">Built with React + Vite + Supabase + Tailwind CSS</p>
        <p className="text-gold">Double Elimination Tournament System • 2025</p>
      </footer>
    </div>
    </>
  );
}

export default App;
