import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaSave, FaTimes, FaUserSlash, FaBed, FaCheck } from 'react-icons/fa';
import { getPlayers, updatePlayerName, assignByeToPlayer, eliminatePlayer } from '../lib/api';
import type { Player } from '../lib/tournamentEngine';

interface PlayerManagementProps {
  tournamentId: string;
  onClose: () => void;
}

export default function PlayerManagement({ tournamentId, onClose }: PlayerManagementProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, [tournamentId]);

  const loadPlayers = async () => {
    const { players: loadedPlayers } = await getPlayers(tournamentId);
    setPlayers(loadedPlayers);
  };

  const handleStartEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async (playerId: string) => {
    if (!editName.trim()) return;

    setLoading(true);
    const { success } = await updatePlayerName(playerId, editName.trim());
    if (success) {
      await loadPlayers();
      setEditingId(null);
      setEditName('');
    }
    setLoading(false);
  };

  const handleToggleBye = async (player: Player) => {
    setLoading(true);
    const { success } = await assignByeToPlayer(player.id, !player.is_bye);
    if (success) {
      await loadPlayers();
    }
    setLoading(false);
  };

  const handleEliminate = async (playerId: string, playerName: string) => {
    if (confirm(`Are you sure you want to eliminate ${playerName}? This action cannot be undone.`)) {
      setLoading(true);
      const { success } = await eliminatePlayer(playerId);
      if (success) {
        await loadPlayers();
      }
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="card max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-blood/30 p-6 flex items-center justify-between">
          <h2
            className="text-3xl font-bold text-text"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
          >
            PLAYER MANAGEMENT
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-blood transition-colors text-2xl"
          >
            <FaTimes />
          </button>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            <AnimatePresence>
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    player.is_bye
                      ? 'border-gold/30 bg-gold/10'
                      : player.name === 'ELIMINATED'
                      ? 'border-blood/30 bg-blood/10 opacity-50'
                      : 'border-obsidian-light bg-obsidian-light/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Seed and Name */}
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="text-2xl font-bold text-blood w-12 text-center"
                        style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                      >
                        #{player.seed}
                      </div>

                      {editingId === player.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-field flex-1"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(player.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        <div className="flex-1">
                          <div className="text-text font-semibold text-lg">
                            {player.name}
                          </div>
                          {player.is_bye && (
                            <div className="text-gold text-xs flex items-center gap-1 mt-1">
                              <FaBed /> BYE Player
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {editingId === player.id ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSaveEdit(player.id)}
                            disabled={loading}
                            className="btn-primary px-3 py-2 text-sm"
                          >
                            <FaSave />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancelEdit}
                            className="btn-secondary px-3 py-2 text-sm"
                          >
                            <FaTimes />
                          </motion.button>
                        </>
                      ) : (
                        <>
                          {player.name !== 'ELIMINATED' && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleStartEdit(player)}
                                disabled={loading}
                                className="px-3 py-2 bg-obsidian-light text-soul rounded-lg hover:bg-soul hover:text-obsidian transition-all"
                                title="Edit Name"
                              >
                                <FaEdit />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleToggleBye(player)}
                                disabled={loading}
                                className={`px-3 py-2 rounded-lg transition-all ${
                                  player.is_bye
                                    ? 'bg-gold/20 text-gold border border-gold/30 hover:bg-gold hover:text-obsidian'
                                    : 'bg-obsidian-light text-text-muted hover:bg-gold/20 hover:text-gold'
                                }`}
                                title={player.is_bye ? 'Remove BYE' : 'Assign BYE'}
                              >
                                {player.is_bye ? <FaCheck /> : <FaBed />}
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEliminate(player.id, player.name)}
                                disabled={loading}
                                className="px-3 py-2 bg-obsidian-light text-blood rounded-lg hover:bg-blood hover:text-text transition-all"
                                title="Eliminate Player"
                              >
                                <FaUserSlash />
                              </motion.button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-blood/30 p-6">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <div>
              Total Players: <span className="text-soul font-semibold">{players.length}</span> •
              BYE Players: <span className="text-gold font-semibold">{players.filter(p => p.is_bye).length}</span>
            </div>
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
