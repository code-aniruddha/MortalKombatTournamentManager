import React, { useState } from 'react';
import { createTournament, addPlayers, initializeBracket, updateTournamentStatus, autoResolveByes } from '../lib/api';
import { getNextPowerOfTwo } from '../lib/tournamentEngine';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500 mb-4">
            MORTAL KOMBAT
          </h1>
          <p className="font-display text-3xl text-accent-400 tracking-wider">TOURNAMENT MANAGER</p>
          <div className="mt-6 h-1.5 w-48 bg-gradient-to-r from-transparent via-primary-500 to-transparent mx-auto rounded-full"></div>
        </div>

        {/* Setup Form */}
        <div className="card p-10 shadow-2xl">
          <h2 className="font-display text-4xl font-bold text-white mb-8 text-center">Create Tournament</h2>

          {error && (
            <div className="bg-primary-900/50 border-2 border-primary-500 text-white px-5 py-4 rounded-lg mb-6 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateTournament} className="space-y-8">
            {/* Tournament Name */}
            <div>
              <label className="block text-white font-semibold mb-3 text-lg">
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
                <label className="block text-white font-semibold text-lg">
                  Fighters <span className="text-accent-500">({playerNames.filter(n => n.trim()).length})</span>
                </label>
                <button
                  type="button"
                  onClick={addPlayerField}
                  className="btn-secondary text-sm"
                >
                  + Add Fighter
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {playerNames.map((name, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 font-bold">
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
                      <button
                        type="button"
                        onClick={() => removePlayer(index)}
                        className="px-4 py-3 bg-dark-800 text-dark-400 rounded-lg hover:bg-primary-900 hover:text-primary-400 transition-all border border-dark-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-accent-950 to-dark-900 border-2 border-accent-700 p-6 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="text-white font-semibold mb-2">
                    <span className="text-accent-400">Bracket Size:</span> {powerOfTwo} players
                  </p>
                  {byesNeeded > 0 && (
                    <p className="text-dark-300 text-sm mb-2">
                      {byesNeeded} "BYE" player{byesNeeded > 1 ? 's' : ''} will be added automatically
                      to reach the next power of 2.
                    </p>
                  )}
                  <p className="text-dark-300 text-sm">
                    Double Elimination: Players are eliminated after 2 losses
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-2xl py-5"
            >
              {loading ? 'CREATING TOURNAMENT...' : 'START TOURNAMENT'}
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card border-l-4 border-primary-500 hover:shadow-lg hover:shadow-primary-900/30 transition-all">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-display text-xl text-accent-400 font-bold mb-3">WINNERS BRACKET</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Stay here as long as you keep winning. One loss drops you to Losers Bracket.
            </p>
          </div>
          <div className="card border-l-4 border-accent-500 hover:shadow-lg hover:shadow-accent-900/30 transition-all">
            <div className="text-3xl mb-3">⚔️</div>
            <h3 className="font-display text-xl text-accent-400 font-bold mb-3">LOSERS BRACKET</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Second chance for redemption. One more loss and you're eliminated.
            </p>
          </div>
          <div className="card border-l-4 border-green-500 hover:shadow-lg hover:shadow-green-900/30 transition-all">
            <div className="text-3xl mb-3">👑</div>
            <h3 className="font-display text-xl text-accent-400 font-bold mb-3">GRAND FINALS</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Winner from each bracket faces off. Bracket reset if Loser's winner wins!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
