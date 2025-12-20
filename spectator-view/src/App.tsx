import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaEye } from 'react-icons/fa';
import { listTournaments } from './lib/api';
import TournamentViewer from './components/TournamentViewer';
import LoadingScreen from './components/LoadingScreen';
import PS5ControllerBackground from './components/PS5ControllerBackground';
import type { Tournament } from './lib/types';

function App() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadTournaments, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTournaments = async () => {
    const { tournaments: loadedTournaments } = await listTournaments();
    setTournaments(loadedTournaments);
    setLoading(false);
  };

  if (loading) {
    return <LoadingScreen message="Loading Tournaments..." />;
  }

  if (selectedTournamentId) {
    return (
      <>
        <PS5ControllerBackground />
        <TournamentViewer
          tournamentId={selectedTournamentId}
          onBack={() => setSelectedTournamentId(null)}
        />
      </>
    );
  }

  return (
    <>
      <PS5ControllerBackground />
      <div className="min-h-screen p-8 relative z-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-16"
      >
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-8xl font-black mb-4 text-blood text-glow-blood"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
        >
          MORTAL KOMBAT
        </motion.h1>
        <motion.p
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl mb-6 text-gold text-glow-gold"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}
        >
          TOURNAMENT SPECTATOR
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4 }}
          className="h-1 w-64 mx-auto mb-8 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, #00FF41, transparent)',
            boxShadow: '0 0 20px #00FF41'
          }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-text-muted text-lg"
        >
          Live Tournament Brackets • Real-Time Updates • Match Results
        </motion.p>
      </motion.div>

      {/* Tournament List */}
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold mb-8 text-text flex items-center gap-3"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
        >
          <FaTrophy className="text-gold" /> LIVE TOURNAMENTS
        </h2>

        {loading ? (
          <div className="text-center text-text-muted py-20">
            <div className="text-4xl mb-4">⏳</div>
            <p>Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card text-center py-20"
          >
            <div className="text-6xl mb-6 text-blood">🎮</div>
            <p className="text-text text-xl mb-2">No active tournaments</p>
            <p className="text-text-muted">Check back later for upcoming matches!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => setSelectedTournamentId(tournament.id)}
                className="card cursor-pointer group transition-all duration-300 hover:border-blood"
                style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3
                    className="text-xl font-bold text-text group-hover:text-blood transition-colors"
                    style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
                  >
                    {tournament.name}
                  </h3>
                  <FaTrophy className="text-2xl text-gold" />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-sm">Status</span>
                    <span
                      className={`badge ${
                        tournament.status === 'Completed'
                          ? 'badge-soul'
                          : tournament.status === 'In-Progress'
                          ? 'badge-gold'
                          : 'badge-blood'
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-sm">Fighters</span>
                    <span className="text-text font-semibold text-lg">
                      {tournament.participant_count}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 bg-blood text-white rounded-lg font-bold transition-all hover:bg-blood-700 flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
                >
                  <FaEye /> VIEW BRACKET
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-text-muted text-sm">
        <div
          className="inline-block h-px w-64 mb-4"
          style={{
            background: 'linear-gradient(90deg, transparent, #8B0000, transparent)'
          }}
        />
        <p className="mb-2">Mortal Kombat Tournament Spectator View</p>
        <p className="text-gold">Real-Time Double Elimination Brackets • 2025</p>
      </footer>
      </div>
    </>
  );
}

export default App;
