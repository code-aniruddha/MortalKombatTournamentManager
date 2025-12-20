import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaMinus, FaFistRaised, FaTrophy } from 'react-icons/fa';
import { createTournament, addPlayers, initializeBracket, updateTournamentStatus, autoResolveByes } from '../lib/api';
import { getNextPowerOfTwo } from '../lib/tournamentEngine';
import PS5ControllerBackground from './PS5ControllerBackground';
import LoadingScreen from './LoadingScreen';

interface TournamentSetupProps {
  onTournamentCreated: (tournamentId: string) => void;
}

export default function TournamentSetup({ onTournamentCreated }: TournamentSetupProps) {
  const [tournamentName, setTournamentName] = useState('');
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPlayerField = () => {
    setPlayerNames([...playerNames, '']);
  };

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) {
      const updated = playerNames.filter((_, i) => i !== index);
      setPlayerNames(updated);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      const validPlayers = playerNames.filter(name => name.trim() !== '');

      if (!tournamentName.trim()) {
        throw new Error('Tournament name is required');
      }

      if (validPlayers.length < 2) {
        throw new Error('At least 2 players are required');
      }

      // Calculate actual participant count (power of 2)
      const actualCount = getNextPowerOfTwo(validPlayers.length);

      // Create tournament
      const { tournament, error: tournamentError } = await createTournament(
        tournamentName,
        actualCount
      );

      if (tournamentError || !tournament) {
        throw tournamentError || new Error('Failed to create tournament');
      }

      // Add players
      const { error: playersError } = await addPlayers(
        tournament.id,
        validPlayers
      );

      if (playersError) {
        throw playersError;
      }

      // Initialize bracket structure
      const { success, error: bracketError } = await initializeBracket(
        tournament.id
      );

      if (!success || bracketError) {
        throw bracketError || new Error('Failed to initialize bracket');
      }

      // Update tournament status to In-Progress
      await updateTournamentStatus(tournament.id, 'In-Progress');

      // Auto-resolve BYE matches so tournament starts with ready matches
      await autoResolveByes(tournament.id);

      // Navigate to tournament view
      onTournamentCreated(tournament.id);
    } catch (err: any) {
      console.error('Error creating tournament:', err);
      setError(err.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const powerOfTwo = getNextPowerOfTwo(playerNames.filter(n => n.trim()).length);
  const byesNeeded = powerOfTwo - playerNames.filter(n => n.trim()).length;

  if (loading) {
    return <LoadingScreen message="Creating Tournament..." />;
  }

  return (
    <>
      <PS5ControllerBackground />
      <div className="min-h-screen p-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12"
          >
            <h1
              className="text-8xl font-black mb-4"
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                color: '#8B0000',
                textShadow: '0 0 40px rgba(139, 0, 0, 0.8), 0 0 80px rgba(139, 0, 0, 0.5)'
              }}
            >
              MORTAL KOMBAT
            </h1>
            <p
              className="text-4xl mb-6"
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                color: '#C5A059',
                letterSpacing: '0.15em'
              }}
            >
              TOURNAMENT MANAGER
            </p>
            <div
              className="mt-6 h-1 w-48 mx-auto rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, #00FF41, transparent)',
                boxShadow: '0 0 20px #00FF41'
              }}
            />
          </motion.div>

          {/* Setup Form */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="card p-10 shadow-2xl"
          >
            <h2
              className="text-5xl font-bold text-text mb-8 text-center"
              style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}
            >
              <FaFistRaised className="inline-block mr-3 text-blood" />
              Create Tournament
            </h2>

            {error && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="border-2 border-blood text-text px-5 py-4 rounded-lg mb-6 flex items-center gap-3 glass-dark"
              >
                <span className="text-2xl">⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleCreateTournament} className="space-y-8">
            {/* Tournament Name */}
            <div>
              <label className="block text-text font-semibold mb-3 text-lg">
                Tournament Name
              </label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="input-field text-lg"
                placeholder="e.g., Summer Championship 2025"
                required
              />
            </div>

            {/* Players */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-text font-semibold text-lg">
                  Fighters <span className="text-soul">({playerNames.filter(n => n.trim()).length})</span>
                </label>
                <motion.button
                  type="button"
                  onClick={addPlayerField}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary text-sm inline-flex items-center gap-2"
                >
                  <FaPlus /> Add Fighter
                </motion.button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {playerNames.map((name, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3"
                  >
                    <div className="relative flex-1">
                      <div
                        className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-blood"
                        style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                      >
                        #{index + 1}
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => updatePlayerName(index, e.target.value)}
                        className="input-field pl-14"
                        placeholder={`Fighter name`}
                      />
                    </div>
                    {playerNames.length > 2 && (
                      <motion.button
                        type="button"
                        onClick={() => removePlayer(index)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="px-4 py-3 bg-obsidian-light text-text-muted rounded-lg hover:bg-blood hover:text-text transition-all border border-obsidian-light"
                      >
                        <FaMinus />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="border-2 border-gold p-6 rounded-xl"
              style={{ background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.1), rgba(13, 13, 13, 0.5))' }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="text-text font-semibold mb-2">
                    <span className="text-gold">Bracket Size:</span> {powerOfTwo} players
                  </p>
                  {byesNeeded > 0 && (
                    <p className="text-text-muted text-sm mb-2">
                      {byesNeeded} "BYE" player{byesNeeded > 1 ? 's' : ''} will be added automatically
                      to reach the next power of 2.
                    </p>
                  )}
                  <p className="text-text-muted text-sm">
                    Double Elimination: Players are eliminated after 2 losses
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full text-2xl py-5"
              style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}
            >
              {loading ? 'CREATING TOURNAMENT...' : '⚔️ START TOURNAMENT'}
            </motion.button>
          </form>
        </motion.div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="card border-l-4 border-blood"
          >
            <FaTrophy className="text-4xl mb-3 text-gold" />
            <h3
              className="text-2xl text-gold font-bold mb-3"
              style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
            >
              WINNERS BRACKET
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Stay here as long as you keep winning. One loss drops you to Losers Bracket.
            </p>
          </motion.div>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="card border-l-4 border-soul"
          >
            <div className="text-4xl mb-3">⚔️</div>
            <h3
              className="text-2xl text-soul font-bold mb-3"
              style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
            >
              LOSERS BRACKET
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Second chance for redemption. One more loss and you're eliminated.
            </p>
          </motion.div>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="card border-l-4 border-gold"
          >
            <div className="text-4xl mb-3">👑</div>
            <h3
              className="text-2xl text-blood font-bold mb-3"
              style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
            >
              GRAND FINALS
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Winner from each bracket faces off. Bracket reset if Loser's winner wins!
            </p>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
  }
