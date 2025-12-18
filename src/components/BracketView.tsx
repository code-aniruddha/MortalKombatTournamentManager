import { useEffect, useState } from 'react';
import { getMatches, getPlayers, reportMatchResult } from '../lib/api';
import { subscribeToMatches } from '../lib/supabase';
import type { Match, Player } from '../lib/tournamentEngine';

interface BracketViewProps {
  tournamentId: string;
}

interface MatchWithPlayers extends Match {
  player1?: Player;
  player2?: Player;
  winner?: Player;
}

export default function BracketView({ tournamentId }: BracketViewProps) {
  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithPlayers | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates
    const channel = subscribeToMatches(tournamentId, (payload) => {
      console.log('Match updated:', payload);
      loadData();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [tournamentId]);

  const loadData = async () => {
    try {
      const [matchesResult, playersResult] = await Promise.all([
        getMatches(tournamentId),
        getPlayers(tournamentId),
      ]);

      if (matchesResult.error) throw matchesResult.error;
      if (playersResult.error) throw playersResult.error;

      // Enrich matches with player data
      const enrichedMatches = matchesResult.matches.map((match) => ({
        ...match,
        player1: playersResult.players.find((p) => p.id === match.player1_id),
        player2: playersResult.players.find((p) => p.id === match.player2_id),
        winner: playersResult.players.find((p) => p.id === match.winner_id),
      }));

      setMatches(enrichedMatches);
      setPlayers(playersResult.players);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportResult = async (matchId: string, winnerId: string) => {
    try {
      const { success, error } = await reportMatchResult(matchId, winnerId);
      if (!success || error) {
        throw error || new Error('Failed to report result');
      }
      setSelectedMatch(null);
      // Realtime subscription will handle the update
    } catch (error) {
      console.error('Error reporting result:', error);
      alert('Failed to report match result');
    }
  };

  const simulateNextMatch = async () => {
    setSimulating(true);
    try {
      // Find first ready (non-completed) match
      const readyMatch = matches.find(
        m => m.player1_id && m.player2_id && !m.winner_id && !m.player1?.is_bye && !m.player2?.is_bye
      );

      if (readyMatch) {
        // Randomly pick a winner
        const winnerId = Math.random() > 0.5 ? readyMatch.player1_id! : readyMatch.player2_id!;
        await handleReportResult(readyMatch.id, winnerId);
      } else {
        alert('No ready matches to simulate');
      }
    } catch (error) {
      console.error('Error simulating match:', error);
    } finally {
      setSimulating(false);
    }
  };

  const simulateAll = async () => {
    setSimulating(true);
    try {
      let hasMoreMatches = true;
      while (hasMoreMatches) {
        const currentMatches = await getMatches(tournamentId);
        const readyMatch = currentMatches.matches.find(
          m => m.player1_id && m.player2_id && !m.winner_id
        );

        if (readyMatch) {
          const winnerId = Math.random() > 0.5 ? readyMatch.player1_id! : readyMatch.player2_id!;
          await reportMatchResult(readyMatch.id, winnerId);
          // Small delay to see progression
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
          hasMoreMatches = false;
        }
      }
      alert('Tournament simulation complete!');
    } catch (error) {
      console.error('Error simulating tournament:', error);
    } finally {
      setSimulating(false);
    }
  };

  const getMatchesByBracket = (bracketType: string) => {
    return matches.filter((m) => m.bracket_type === bracketType);
  };

  const getTournamentWinner = (): Player | null => {
    // Check Grand Finals
    const grandFinals = matches.find(m => m.bracket_type === 'GrandFinals' && m.winner_id);
    const grandFinalsReset = matches.find(m => m.bracket_type === 'GrandFinalsReset' && m.winner_id);

    // If reset happened and completed, that winner is the champion
    if (grandFinalsReset?.winner) {
      return grandFinalsReset.winner;
    }

    // If Grand Finals completed without reset, that winner is the champion
    if (grandFinals?.winner) {
      return grandFinals.winner;
    }

    return null;
  };

  const renderMatch = (match: MatchWithPlayers) => {
    const isReady = match.player1_id && match.player2_id;
    const isCompleted = match.winner_id !== null;
    const hasBye = match.player1?.is_bye || match.player2?.is_bye;

    return (
      <div
        key={match.id}
        className={`card border-2 transition-all duration-300 ${
          isCompleted
            ? 'border-green-600 shadow-green-900/30'
            : isReady
            ? 'border-accent-600 hover:border-primary-500 cursor-pointer hover:shadow-xl hover:shadow-primary-900/20'
            : 'border-dark-700 opacity-75'
        }`}
        onClick={() => isReady && !isCompleted && setSelectedMatch(match)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-dark-400">
            Round {match.round_number} • Match {match.match_order + 1}
          </div>
          {hasBye && <div className="text-xs bg-accent-900/50 text-accent-400 px-2 py-1 rounded-full">BYE</div>}
        </div>

        {/* Player 1 */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg mb-2 transition-all ${
            match.winner_id === match.player1_id
              ? 'bg-green-600/20 border-2 border-green-500'
              : 'bg-dark-900 border border-dark-700'
          }`}
        >
          <span className={`font-medium ${
            match.winner_id === match.player1_id ? 'text-green-300 font-bold' : 'text-white'
          }`}>
            {match.player1?.name || 'TBD'}
            {match.player1?.is_bye && ' (BYE)'}
          </span>
          {match.winner_id === match.player1_id && (
            <span className="text-green-400 font-bold text-lg">✓</span>
          )}
        </div>

        {/* Player 2 */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg transition-all ${
            match.winner_id === match.player2_id
              ? 'bg-green-600/20 border-2 border-green-500'
              : 'bg-dark-900 border border-dark-700'
          }`}
        >
          <span className={`font-medium ${
            match.winner_id === match.player2_id ? 'text-green-300 font-bold' : 'text-white'
          }`}>
            {match.player2?.name || 'TBD'}
            {match.player2?.is_bye && ' (BYE)'}
          </span>
          {match.winner_id === match.player2_id && (
            <span className="text-green-400 font-bold text-lg">✓</span>
          )}
        </div>

        {!isCompleted && isReady && (
          <div className="mt-3 text-center text-xs font-semibold text-accent-400 animate-pulse">
            Click to report result →
          </div>
        )}
      </div>
    );
  };

  const renderBracket = (title: string, bracketMatches: MatchWithPlayers[]) => {
    if (bracketMatches.length === 0) return null;

    // Group by rounds
    const rounds = new Map<number, MatchWithPlayers[]>();
    bracketMatches.forEach((match) => {
      if (!rounds.has(match.round_number)) {
        rounds.set(match.round_number, []);
      }
      rounds.get(match.round_number)!.push(match);
    });

    return (
      <div className="mb-12">
        <h2 className="font-display text-3xl font-bold text-accent-400 mb-6 flex items-center gap-3">
          {title}
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
          {Array.from(rounds.entries())
            .sort(([a], [b]) => a - b)
            .map(([roundNum, roundMatches]) => (
              <div key={roundNum} className="flex-shrink-0 w-72">
                <div className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 mb-4 text-center">
                  <h3 className="text-white font-bold text-lg">
                    Round {roundNum}
                  </h3>
                  <div className="text-dark-400 text-xs mt-1">
                    {roundMatches.filter(m => m.winner_id).length} / {roundMatches.length} complete
                  </div>
                </div>
                <div className="space-y-4">
                  {roundMatches
                    .sort((a, b) => a.match_order - b.match_order)
                    .map(renderMatch)}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎮</div>
          <div className="text-accent-400 text-2xl font-semibold">Loading bracket...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="text-center mb-6">
            <h1 className="font-display text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500 mb-3">
              MORTAL KOMBAT TOURNAMENT
            </h1>
            <div className="flex items-center justify-center gap-4 text-dark-400">
              <span className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                {players.filter(p => !p.is_bye).length} Fighters
              </span>
              <span>•</span>
              <span>Double Elimination</span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Live Updates
              </span>
            </div>

            {/* Tournament Winner Display */}
            {getTournamentWinner() && (
              <div className="mt-6 inline-block">
                <div className="bg-gradient-to-r from-accent-600 to-accent-500 rounded-lg px-8 py-4 shadow-2xl shadow-accent-900/50 border-2 border-accent-400">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">👑</span>
                    <div>
                      <div className="text-xs text-accent-100 font-semibold uppercase tracking-wider">Tournament Champion</div>
                      <div className="font-display text-3xl font-black text-white">{getTournamentWinner()?.name}</div>
                    </div>
                    <span className="text-4xl">🏆</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Simulation Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={simulateNextMatch}
              disabled={simulating}
              className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {simulating ? '⏳ Simulating...' : '🎲 Simulate Next Match'}
            </button>
            <button
              onClick={simulateAll}
              disabled={simulating}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {simulating ? '⏳ Running...' : '⚡ Auto-Simulate All'}
            </button>
          </div>
        </div>

        {/* Winners Bracket */}
        {renderBracket('🏆 WINNERS BRACKET', getMatchesByBracket('Winners'))}

        {/* Losers Bracket */}
        {renderBracket('⚔️ LOSERS BRACKET', getMatchesByBracket('Losers'))}

        {/* Grand Finals */}
        {renderBracket('👑 GRAND FINALS', [
          ...getMatchesByBracket('GrandFinals'),
          ...getMatchesByBracket('GrandFinalsReset'),
        ])}

        {/* Match Result Modal */}
        {selectedMatch && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card border-4 border-primary-500 max-w-lg w-full shadow-2xl shadow-primary-900/50 animate-scale-in">
              <h2 className="font-display text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
                REPORT RESULT
              </h2>

              <div className="mb-8">
                <div className="bg-dark-900 rounded-lg p-4 mb-6 text-center border border-dark-700">
                  <p className="text-dark-400 text-sm mb-1">
                    {selectedMatch.bracket_type} Bracket
                  </p>
                  <p className="text-white font-semibold">
                    Round {selectedMatch.round_number} \u2022 Match {selectedMatch.match_order + 1}
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() =>
                      handleReportResult(selectedMatch.id, selectedMatch.player1_id!)
                    }
                    className="w-full p-5 bg-gradient-to-r from-primary-600 to-primary-700 border-2 border-primary-500 rounded-lg text-white hover:from-primary-500 hover:to-primary-600 transition-all font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
                  >
                    🏆 {selectedMatch.player1?.name} WINS
                  </button>

                  <button
                    onClick={() =>
                      handleReportResult(selectedMatch.id, selectedMatch.player2_id!)
                    }
                    className="w-full p-5 bg-gradient-to-r from-primary-600 to-primary-700 border-2 border-primary-500 rounded-lg text-white hover:from-primary-500 hover:to-primary-600 transition-all font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
                  >
                    🏆 {selectedMatch.player2?.name} WINS
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedMatch(null)}
                className="w-full py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-all border border-dark-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
