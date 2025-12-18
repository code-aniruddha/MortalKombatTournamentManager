# 🧮 DOUBLE ELIMINATION ALGORITHM EXPLAINED

Deep dive into the tournament bracket generation algorithm.

## 📐 Mathematical Foundation

### Power of 2 Requirement

Double elimination tournaments require bracket sizes that are powers of 2:
- 4 players (2²)
- 8 players (2³)
- 16 players (2⁴)
- 32 players (2⁵)
- 64 players (2⁶)

**Why?** Each round eliminates exactly half the participants in a balanced way.

### BYE Player Calculation

If you have N players where N is NOT a power of 2:

```
targetSize = 2^⌈log₂(N)⌉
byesNeeded = targetSize - N
```

**Examples**:
- 7 players → 8 target → 1 BYE needed
- 10 players → 16 target → 6 BYEs needed
- 13 players → 16 target → 3 BYEs needed

## 🏆 Winners Bracket Structure

### Number of Rounds
```
rounds = log₂(N)
```

**Examples**:
- 8 players → 3 rounds (8→4→2→1)
- 16 players → 4 rounds (16→8→4→2→1)
- 32 players → 5 rounds (32→16→8→4→2→1)

### Matches per Round
```
Round R: N / 2^R matches
```

**Example for 16 players**:
- Round 1: 16/2¹ = 8 matches
- Round 2: 16/2² = 4 matches
- Round 3: 16/2³ = 2 matches
- Round 4: 16/2⁴ = 1 match (Finals)

### Total Winners Bracket Matches
```
Total = N - 1
```

This is because we need N-1 wins to declare a winner from N players.

## 💀 Losers Bracket Structure

### Number of Rounds
```
rounds = (2 × log₂(N)) - 1
```

**Examples**:
- 8 players → 5 LB rounds (2×3 - 1)
- 16 players → 7 LB rounds (2×4 - 1)

### Round Types

#### Odd Rounds (R1, R3, R5...)
**Consolidation Rounds** - Losers bracket players face each other

```
Matches in odd round = Previous round winners / 2
```

#### Even Rounds (R2, R4, R6...)
**Merge Rounds** - LB survivors play WB drop-downs

```
Matches in even round = WB dropdowns from corresponding round
```

### Total Losers Bracket Matches
```
Total = N - 2
```

One less than Winners Bracket because one player comes from WB Finals.

## 🔄 Drop-Down Mapping

### The Critical Formula

When a player loses in Winners Bracket Round R, they drop to Losers Bracket:

```
LB_Round = (WB_Round × 2) - 2

Exception: WB Round 1 → LB Round 1 (direct mapping)
```

### Why This Formula?

The formula ensures players meet opponents with similar loss histories:

**Example with 16 players**:

| WB Round | Lose At | Drop To LB Round | Reasoning |
|----------|---------|------------------|-----------|
| R1 | 8 losers | LB R1 | First losses, play each other |
| R2 | 4 losers | LB R2 | Meet LB R1 winners (both have 1 loss) |
| R3 | 2 losers | LB R4 | Skip R3, wait for LB survivors |
| R4 (Finals) | 1 loser | LB Finals | Plays LB champion |

## 📊 Complete 8-Player Example

### Initial Setup
```
Players: 1, 2, 3, 4, 5, 6, 7, 8 (seeds)
```

### Winners Bracket - Round 1
```
Match 1: P1 vs P8  → Winner: P1  (P8 → LB R1)
Match 2: P4 vs P5  → Winner: P4  (P5 → LB R1)
Match 3: P2 vs P7  → Winner: P2  (P7 → LB R1)
Match 4: P3 vs P6  → Winner: P3  (P6 → LB R1)
```

### Losers Bracket - Round 1
```
Match 1: P8 vs P5  → Winner: P8  (P5 eliminated)
Match 2: P7 vs P6  → Winner: P7  (P6 eliminated)
```

### Winners Bracket - Round 2
```
Match 1: P1 vs P4  → Winner: P1  (P4 → LB R2)
Match 2: P2 vs P3  → Winner: P2  (P3 → LB R2)
```

### Losers Bracket - Round 2
```
Match 1: P8 (LB R1 winner) vs P4 (WB R2 loser)  → Winner: P4
Match 2: P7 (LB R1 winner) vs P3 (WB R2 loser)  → Winner: P3
```

### Losers Bracket - Round 3
```
Match 1: P4 vs P3  → Winner: P3  (P4 eliminated)
```

### Winners Finals
```
P1 vs P2  → Winner: P1  (P2 → LB Finals)
```

### Losers Finals
```
P3 (LB champion) vs P2 (WB Finals loser)  → Winner: P2
```

### Grand Finals
```
Set 1: P1 (WB champion, 0 losses) vs P2 (LB champion, 1 loss)

Scenario A: P1 wins → Tournament Over, P1 champion
Scenario B: P2 wins → Both have 1 loss → BRACKET RESET

Set 2 (if reset): P1 vs P2 → Winner is champion
```

## 🔗 Match Linking Algorithm

### Progression Pointers

Each match stores:
- `next_match_id_win`: Where winner goes
- `next_match_id_lose`: Where loser goes (or NULL if eliminated)

### Winner Progression
```
WB Match:
  winner → next WB round (same bracket)

LB Match (not finals):
  winner → next LB round

LB Finals:
  winner → Grand Finals

WB Finals:
  winner → Grand Finals
```

### Loser Progression
```
WB Match:
  loser → LB Round (using drop-down formula)

LB Match:
  loser → ELIMINATED (NULL)

Grand Finals:
  loser → 2nd place (or triggers Set 2)
```

## 🧩 Player Slot Assignment

When a match completes, the winner/loser move to their next matches:

```typescript
// Pseudocode
function advancePlayer(playerId, nextMatchId) {
  nextMatch = getMatch(nextMatchId)

  if (nextMatch.player1_id == null) {
    nextMatch.player1_id = playerId
  } else if (nextMatch.player2_id == null) {
    nextMatch.player2_id = playerId
  }

  saveMatch(nextMatch)
}
```

## 📈 Complexity Analysis

### Time Complexity
- **Bracket Generation**: O(N log N)
  - Generate WB matches: O(N)
  - Generate LB matches: O(N)
  - Link matches: O(N)

- **Match Result Processing**: O(1)
  - Update winner: O(1)
  - Advance to next matches: O(1) × 2 = O(1)

### Space Complexity
- **Total Matches**: O(N)
  - WB: N - 1
  - LB: N - 2
  - GF: 2
  - Total: 2N - 1

### Database Queries
- **Bracket Creation**: O(N) inserts + O(N) updates
- **Match Result**: O(1) updates × 3
  - Current match
  - Next match (winner)
  - Next match (loser)

## 🎯 Edge Cases

### Single BYE Match
```
Player vs BYE → Auto-advance player (instant win)
```

### Grand Finals Edge Cases

**Case 1: WB winner wins Set 1**
```
P1 (0 losses) defeats P2 (1 loss)
→ P2 now has 2 losses
→ Tournament complete
```

**Case 2: LB winner wins Set 1**
```
P2 (1 loss) defeats P1 (0 losses)
→ Both have 1 loss
→ Trigger Set 2
→ Winner of Set 2 is champion
```

**Case 3: Set 2 completion**
```
Either player wins Set 2
→ Tournament complete
→ Winner declared
```

## 🔍 Verification Algorithm

To verify a bracket is correctly structured:

```typescript
function verifyBracket(matches: Match[], playerCount: N) {
  checks = [
    // Check 1: Correct match count
    matches.length == (2N - 1),

    // Check 2: WB has N-1 matches
    winnersMatches.length == (N - 1),

    // Check 3: LB has N-2 matches
    losersMatches.length == (N - 2),

    // Check 4: All matches have valid progression
    allMatchesHaveValidNextIds(),

    // Check 5: No circular references
    !hasCircularProgression(),

    // Check 6: Finals converge to Grand Finals
    wbFinalsLeadsToGrandFinals(),
    lbFinalsLeadsToGrandFinals()
  ]

  return checks.every(check => check == true)
}
```

## 📚 References

### Academic Sources
- **Tournament Theory**: Hwang, F. K. (1982). "New concepts in seeding knockout tournaments"
- **Graph Theory**: Directed Acyclic Graph (DAG) representation of brackets

### Implementation Inspiration
- Challonge.com bracket algorithms
- Smash.gg tournament system
- Traditional sports tournament software

## 🛠️ Implementation in Code

See `src/lib/tournamentEngine.ts` for the complete TypeScript implementation.

Key functions:
- `generateDoubleEliminationBracket()` - Main algorithm
- `getDropDownRound()` - Drop-down formula
- `generateSeedPairings()` - Optimal seeding
- `processMatchResult()` - Match progression logic

---

**Math + Code = Perfect Brackets** 🧮⚔️
