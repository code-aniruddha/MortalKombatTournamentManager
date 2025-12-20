import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaTrophy, FaUser, FaCheckCircle, FaClock } from 'react-icons/fa';
import { getTournament, getPlayers, getMatches } from '../lib/api';
import { subscribeToMatches } from '../lib/supabase';
import LoadingScreen from './LoadingScreen';
import type { Tournament, Player, Match } from '../lib/types';

interface TournamentViewerProps {
  tournamentId: string;
  onBack: () => void;
}

interface MatchWithPlayers extends Match {
  player1?: Player;
  player2?: Player;
  winner?: Player;
}

export default function TournamentViewer({ tournamentId, onBack }: TournamentViewerProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    const channel = subscribeToMatches(tournamentId, () => {
      loadData();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [tournamentId]);

  const loadData = async () => {
    try {
      const [tournamentResult, matchesResult, playersResult] = await Promise.all([
        getTournament(tournamentId),
        getMatches(tournamentId),
        getPlayers(tournamentId),
      ]);

      const enrichedMatches = matchesResult.matches.map((match) => ({
        ...match,
        player1: playersResult.players.find((p) => p.id === match.player1_id),
        player2: playersResult.players.find((p) => p.id === match.player2_id),
        winner: playersResult.players.find((p) => p.id === match.winner_id),
      }));

      setTournament(tournamentResult.tournament);
      setMatches(enrichedMatches);
      setPlayers(playersResult.players);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchesByBracket = (bracketType: string) => {
    return matches.filter((m) => m.bracket_type === bracketType);
  };

  const getTournamentWinner = () => {
    const grandFinalsReset = matches.find(m => m.bracket_type === 'GrandFinalsReset' && m.winner_id);
    if (grandFinalsReset) {
      return grandFinalsReset.winner;
    }

    const grandFinals = matches.find(m => m.bracket_type === 'GrandFinals' && m.winner_id);
    if (grandFinals) {
      return grandFinals.winner;
    }

    return null;
  };

  const renderMatch = (match: MatchWithPlayers) => {
    const isReady = match.player1_id && match.player2_id;
    const isCompleted = match.winner_id !== null;
    const hasBye = match.player1?.is_bye || match.player2?.is_bye;

    return (
      <motion.div
        key={match.id}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
        className={`card border-2 transition-all duration-300 ${
          isCompleted
            ? 'border-soul shadow-soul/30 animate-pulse-glow'
            : isReady
            ? 'border-gold'
            : 'border-obsidian-400 opacity-60'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-text-muted uppercase">
            R{match.round_number} • Match {match.match_order + 1}
          </div>
          {hasBye && <div className="badge badge-gold text-xs">BYE</div>}
          {isCompleted && <FaCheckCircle className="text-soul" />}
          {isReady && !isCompleted && <FaClock className="text-gold animate-pulse" />}
        </div>

        {/* Player 1 */}
        <motion.div
          whileHover={{ scale: 1.01, x: 2 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center justify-between p-3 rounded-lg mb-2 transition-all ${
            match.winner_id === match.player1_id
              ? 'bg-soul/20 border-2 border-soul'
              : 'bg-obsidian-500 border border-obsidian-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <FaUser className={match.winner_id === match.player1_id ? 'text-soul' : 'text-text-muted'} />
            <span className={`font-medium ${match.winner_id === match.player1_id ? 'text-soul font-bold' : 'text-text'}`}>
              {match.player1?.name || 'TBD'}
              {match.player1?.is_bye && ' (BYE)'}
            </span>
          </div>
          {match.winner_id === match.player1_id && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <FaTrophy className="text-gold text-xl" />
            </motion.div>
          )}
        </motion.div>

        {/* Player 2 */}
        <motion.div
          whileHover={{ scale: 1.01, x: 2 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center justify-between p-3 rounded-lg transition-all ${
            match.winner_id === match.player2_id
              ? 'bg-soul/20 border-2 border-soul'
              : 'bg-obsidian-500 border border-obsidian-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <FaUser className={match.winner_id === match.player2_id ? 'text-soul' : 'text-text-muted'} />
            <span className={`font-medium ${match.winner_id === match.player2_id ? 'text-soul font-bold' : 'text-text'}`}>
              {match.player2?.name || 'TBD'}
              {match.player2?.is_bye && ' (BYE)'}
            </span>
          </div>
          {match.winner_id === match.player2_id && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <FaTrophy className="text-gold text-xl" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  const renderBracket = (title: string, bracketMatches: MatchWithPlayers[]) => {
    if (bracketMatches.length === 0) return null;

    const rounds = Array.from(new Set(bracketMatches.map(m => m.round_number))).sort((a, b) => a - b);

    return (
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <h2
          className="text-3xl font-bold mb-6 text-text flex items-center gap-3"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
        >
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rounds.map(round => (
            <div key={round} className="space-y-4">
              <div
                className="text-lg font-bold text-gold mb-3 text-center glass-strong rounded-lg py-2"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                ROUND {round}
              </div>
              {bracketMatches
                .filter(m => m.round_number === round)
                .sort((a, b) => a.match_order - b.match_order)
                .map(renderMatch)}
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading Tournament Data..." />;
  }

  return (
    <div className="min-h-screen p-8 relative z-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="mb-6 px-6 py-3 glass-strong text-text rounded-lg hover:bg-blood hover:text-white transition-all font-semibold inline-flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Tournaments
        </motion.button>

        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1
            className="text-7xl font-black mb-4 text-blood text-glow-blood"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
          >
            {tournament?.name}
          </h1>
          <div className="flex items-center justify-center gap-4 text-text-muted mb-6">
            <span className="flex items-center gap-2">
              <FaUser />
              {players.filter(p => !p.is_bye).length} Fighters
            </span>
            <span>•</span>
            <span className={`badge ${
              tournament?.status === 'Completed'
                ? 'badge-soul'
                : tournament?.status === 'In-Progress'
                ? 'badge-gold'
                : 'badge-blood'
            }`}>
              {tournament?.status}
            </span>
            <span>•</span>
            <span className="flex items-center gap-2 text-soul">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-soul opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-soul"></span>
              </span>
              LIVE
            </span>
          </div>

          {/* Tournament Winner */}
          {getTournamentWinner() && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-block mt-6"
            >
              <div
                className="glass-strong bg-gradient-to-r from-gold/30 via-blood/30 to-gold/30 rounded-xl px-10 py-6 shadow-2xl border-4 border-gold backdrop-blur-md"
                style={{ boxShadow: '0 0 60px rgba(197, 160, 89, 0.8)' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-5xl">👑</span>
                  <div>
                    <div
                      className="text-sm text-white font-bold uppercase tracking-wider mb-1"
                      style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                    >
                      Tournament Champion
                    </div>
                    <div
                      className="text-4xl font-black text-white"
                      style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
                    >
                      {getTournamentWinner()?.name}
                    </div>
                  </div>
                  <span className="text-5xl">🏆</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Brackets */}
      <div className="max-w-7xl mx-auto">
        {renderBracket('🏆 WINNERS BRACKET', getMatchesByBracket('Winners'))}
        {renderBracket('⚔️ LOSERS BRACKET', getMatchesByBracket('Losers'))}
        {renderBracket('👑 GRAND FINALS', [
          ...getMatchesByBracket('GrandFinals'),
          ...getMatchesByBracket('GrandFinalsReset'),
        ])}
      </div>

      {/* Player Stats */}
      <div className="max-w-7xl mx-auto mt-12">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2
            className="text-3xl font-bold mb-6 text-text"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
          >
            👥 ALL FIGHTERS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {players.filter(p => !p.is_bye).map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05, rotate: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="card text-center hover:border-blood"
              >
                <div
                  className="text-2xl font-bold text-blood mb-2"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  #{player.seed}
                </div>
                <div className="text-text font-semibold truncate">{player.name}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
