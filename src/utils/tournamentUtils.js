// Utility functions for tournament management

// Generate default pair names
export const generatePairNames = (totalPairs) => {
  const pairs = [];
  for (let i = 1; i <= totalPairs; i++) {
    pairs.push({
      id: `P${i}`,
      name: `P${i}`,
      editable: true
    });
  }
  return pairs;
};

// Distribute pairs into groups using snake method
export const distributeIntoGroups = (pairs, pairsPerGroup) => {
  const numGroups = Math.ceil(pairs.length / pairsPerGroup);
  const groups = [];
  
  for (let i = 0; i < numGroups; i++) {
    groups.push([]);
  }
  
  pairs.forEach((pair, index) => {
    // Simple sequential distribution for now
    const groupIndex = index % numGroups;
    groups[groupIndex].push(pair);
  });
  
  return groups.map((group, index) => ({
    id: String.fromCharCode(65 + index), // A, B, C, ...
    pairs: group,
    name: `Bảng ${String.fromCharCode(65 + index)}`
  }));
};

// Generate round-robin matches using circle method
export const generateRoundRobinMatches = (pairs) => {
  if (pairs.length < 2) return [];
  
  const teams = [...pairs];
  const numTeams = teams.length;
  const isOdd = numTeams % 2 === 1;
  
  // Add BYE if odd number of teams
  if (isOdd) {
    teams.push({ id: 'BYE', name: 'BYE', isBye: true });
  }
  
  const rounds = [];
  const numRounds = teams.length - 1;
  const halfSize = teams.length / 2;
  
  for (let round = 0; round < numRounds; round++) {
    const roundMatches = [];
    
    for (let i = 0; i < halfSize; i++) {
      const team1 = teams[i];
      const team2 = teams[teams.length - 1 - i];
      
      // Skip matches involving BYE
      if (team1.isBye || team2.isBye) continue;
      
      roundMatches.push({
        id: `round_${round}_match_${i}`,
        round: round + 1,
        team1: team1,
        team2: team2,
        score1: '',
        score2: '',
        completed: false,
        winner: null,
        assignedReferee: null
      });
    }
    
    rounds.push(roundMatches);
    
    // Rotate teams (circle method)
    const lastTeam = teams.pop();
    teams.splice(1, 0, lastTeam);
  }
  
  return rounds.flat();
};

// Calculate standings for a group
export const calculateStandings = (group, matches) => {
  const standings = {};
  
  // Initialize standings
  group.pairs.forEach(pair => {
    standings[pair.id] = {
      teamId: pair.id,
      teamName: pair.name,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      goalDifference: 0,
      points: 0,
      rank: 0
    };
  });
  
  // Calculate from matches
  matches.forEach(match => {
    if (!match.completed || match.score1 === '' || match.score2 === '') return;
    
    const score1 = parseInt(match.score1);
    const score2 = parseInt(match.score2);
    
    if (isNaN(score1) || isNaN(score2)) return;
    
    const team1 = standings[match.team1.id];
    const team2 = standings[match.team2.id];
    
    if (!team1 || !team2) return;
    
    // Update matches played
    team1.played++;
    team2.played++;
    
    // Update points
    team1.pointsFor += score1;
    team1.pointsAgainst += score2;
    team2.pointsFor += score2;
    team2.pointsAgainst += score1;
    
    // Calculate point difference
    const pointDifference = score1 - score2;
    
    // Determine winner and assign points based on difference
    if (score1 > score2) {
      team1.won++;
      team1.points += pointDifference; // Winner gets positive difference
      team2.lost++;
      team2.points += -pointDifference; // Loser gets negative difference
    } else if (score2 > score1) {
      team2.won++;
      team2.points += -pointDifference; // Winner gets positive difference
      team1.lost++;
      team1.points += pointDifference; // Loser gets negative difference
    }
  });
  
  // Calculate goal difference
  Object.values(standings).forEach(team => {
    team.goalDifference = team.pointsFor - team.pointsAgainst;
  });
  
  // Sort standings
  const sortedStandings = Object.values(standings).sort((a, b) => {
    // Points (descending)
    if (b.points !== a.points) return b.points - a.points;
    
    // Head-to-head (if only 2 teams tied)
    const tiedTeams = [a, b];
    const headToHead = calculateHeadToHead(tiedTeams, matches);
    if (headToHead !== 0) return headToHead;
    
    // Goal difference (descending)
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    
    // Points for (descending)
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    
    // Random seed (use team ID for consistency)
    return a.teamId.localeCompare(b.teamId);
  });
  
  // Assign ranks
  sortedStandings.forEach((team, index) => {
    team.rank = index + 1;
  });
  
  return sortedStandings;
};

// Calculate head-to-head result for tied teams
const calculateHeadToHead = (teams, matches) => {
  if (teams.length !== 2) return 0;
  
  const team1 = teams[0];
  const team2 = teams[1];
  
  const match = matches.find(m => 
    m.completed && 
    ((m.team1.id === team1.teamId && m.team2.id === team2.teamId) ||
     (m.team1.id === team2.teamId && m.team2.id === team1.teamId))
  );
  
  if (!match) return 0;
  
  const score1 = parseInt(match.score1);
  const score2 = parseInt(match.score2);
  
  if (match.team1.id === team1.teamId) {
    return score1 - score2;
  } else {
    return score2 - score1;
  }
};

// Generate empty knockout bracket structure
export const generateEmptyBracket = (totalTeams) => {
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
  
  // Create bracket structure
  const bracketMatches = [];
  let matchId = 1;
  
  // First round (Quarter-finals or Round 1)
  for (let i = 0; i < bracketSize / 2; i++) {
    bracketMatches.push({
      id: `bracket_${matchId}`,
      round: 1,
      matchNumber: matchId,
      team1: null,
      team2: null,
      score1: '',
      score2: '',
      completed: false,
      winner: null,
      isBye: i >= totalTeams / 2, // Mark as BYE if no team available
      setsPerMatch: 1 // Default to 1 set for first round
    });
    matchId++;
  }
  
  // Semi-finals (Round 2)
  let matchesInRound = bracketSize / 4;
  for (let i = 0; i < matchesInRound; i++) {
    bracketMatches.push({
      id: `bracket_${matchId}`,
      round: 2,
      matchNumber: matchId,
      team1: null,
      team2: null,
      score1: '',
      score2: '',
      completed: false,
      winner: null,
      isBye: false,
      setsPerMatch: 1 // Default to 1 set for semi-finals
    });
    matchId++;
  }
  
  // Finals (Round 3) - if we have more than 2 rounds
  if (bracketSize > 4) {
    matchesInRound = bracketSize / 8;
    for (let i = 0; i < matchesInRound; i++) {
      bracketMatches.push({
        id: `bracket_${matchId}`,
        round: 3,
        matchNumber: matchId,
        team1: null,
        team2: null,
        score1: '',
        score2: '',
        completed: false,
        winner: null,
        isBye: false,
        setsPerMatch: 3 // Default to 3 sets for finals
      });
      matchId++;
    }
  }
  
  return bracketMatches;
};

// Generate knockout bracket with teams
export const generateKnockoutBracket = (groupStandings, teamsPerGroup) => {
  const qualifiedTeams = [];
  
  // Get top teams from each group and convert to proper team objects
  groupStandings.forEach(group => {
    const topTeams = group.slice(0, teamsPerGroup);
    qualifiedTeams.push(...topTeams.map(team => ({
      id: team.teamId,
      name: team.teamName,
      teamName: team.teamName // Keep both for compatibility
    })));
  });
  
  const totalTeams = qualifiedTeams.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
  
  // Create bracket structure
  const bracketMatches = [];
  let matchId = 1;
  
  // First round - proper seeding
  for (let i = 0; i < bracketSize / 2; i++) {
    const team1Index = i;
    const team2Index = bracketSize - 1 - i;
    
    // Ensure we don't have the same team playing against itself
    const team1 = team1Index < totalTeams ? qualifiedTeams[team1Index] : null;
    const team2 = team2Index < totalTeams ? qualifiedTeams[team2Index] : null;
    
    // Check if teams are the same (shouldn't happen with proper seeding, but just in case)
    const isBye = !team1 || !team2 || (team1 && team2 && team1.id === team2.id);
    
    bracketMatches.push({
      id: `bracket_${matchId}`,
      round: 1,
      matchNumber: matchId,
      team1: team1,
      team2: team2,
      score1: '',
      score2: '',
      completed: false,
      winner: null,
      isBye: isBye,
      setsPerMatch: 1, // Default to 1 set for first round
      assignedReferee: null
    });
    
    matchId++;
  }
  
  // Subsequent rounds
  let currentRound = 2;
  let matchesInRound = bracketSize / 4;
  
  while (matchesInRound >= 1) {
    for (let i = 0; i < matchesInRound; i++) {
      // Determine sets per match based on round
      let setsPerMatch;
      if (currentRound === 2) {
        setsPerMatch = 1; // Semi-finals: 1 set
      } else {
        setsPerMatch = 3; // Finals: 3 sets
      }
      
      bracketMatches.push({
        id: `bracket_${matchId}`,
        round: currentRound,
        matchNumber: matchId,
        team1: null,
        team2: null,
        score1: '',
        score2: '',
        completed: false,
        winner: null,
        isBye: false,
        setsPerMatch: setsPerMatch,
        assignedReferee: null
      });
      matchId++;
    }
    
    currentRound++;
    matchesInRound /= 2;
  }
  
  return bracketMatches;
};

// Update bracket after match completion
export const updateBracket = (bracketMatches, completedMatch) => {
  const updatedBracket = [...bracketMatches];
  const matchIndex = updatedBracket.findIndex(m => m.id === completedMatch.id);
  
  if (matchIndex === -1) return updatedBracket;
  
  // Update the completed match
  updatedBracket[matchIndex] = { ...completedMatch };
  
  // Determine winner
  const score1 = parseInt(completedMatch.score1);
  const score2 = parseInt(completedMatch.score2);
  
  if (!isNaN(score1) && !isNaN(score2) && completedMatch.score1 !== '' && completedMatch.score2 !== '' && completedMatch.score1 !== null && completedMatch.score2 !== null) {
    const winner = score1 > score2 ? completedMatch.team1 : completedMatch.team2;
    updatedBracket[matchIndex].winner = winner;
    
    // Update next round match
    const nextRound = completedMatch.round + 1;
    
    // Find all matches in the current round to determine position
    const currentRoundMatches = updatedBracket.filter(m => m.round === completedMatch.round);
    const currentMatchPosition = currentRoundMatches.findIndex(m => m.id === completedMatch.id);
    
    // Find all matches in the next round
    const nextRoundMatches = updatedBracket.filter(m => m.round === nextRound);
    
    // Calculate which match in the next round should receive this winner
    const nextMatchIndex = Math.floor(currentMatchPosition / 2);
    
    if (nextMatchIndex < nextRoundMatches.length) {
      const nextMatch = nextRoundMatches[nextMatchIndex];
      const nextMatchGlobalIndex = updatedBracket.findIndex(m => m.id === nextMatch.id);
      
      if (nextMatchGlobalIndex !== -1) {
        // Determine if this winner should go to team1 or team2 slot
        // First match in each pair goes to team1, second goes to team2
        const isFirstTeam = currentMatchPosition % 2 === 0;
        
        if (isFirstTeam) {
          updatedBracket[nextMatchGlobalIndex].team1 = winner;
        } else {
          updatedBracket[nextMatchGlobalIndex].team2 = winner;
        }
      }
    }
  } else {
    // Clear winner when scores are cleared
    updatedBracket[matchIndex].winner = null;
    
    // Also clear the next round match teams if this match was previously completed
    const nextRound = completedMatch.round + 1;
    const currentRoundMatches = updatedBracket.filter(m => m.round === completedMatch.round);
    const currentMatchPosition = currentRoundMatches.findIndex(m => m.id === completedMatch.id);
    const nextRoundMatches = updatedBracket.filter(m => m.round === nextRound);
    const nextMatchIndex = Math.floor(currentMatchPosition / 2);
    
    if (nextMatchIndex < nextRoundMatches.length) {
      const nextMatch = nextRoundMatches[nextMatchIndex];
      const nextMatchGlobalIndex = updatedBracket.findIndex(m => m.id === nextMatch.id);
      
      if (nextMatchGlobalIndex !== -1) {
        const isFirstTeam = currentMatchPosition % 2 === 0;
        
        if (isFirstTeam) {
          updatedBracket[nextMatchGlobalIndex].team1 = null;
        } else {
          updatedBracket[nextMatchGlobalIndex].team2 = null;
        }
        
        // If either team is now null, clear the match scores and completion status
        if (!updatedBracket[nextMatchGlobalIndex].team1 || !updatedBracket[nextMatchGlobalIndex].team2) {
          updatedBracket[nextMatchGlobalIndex].score1 = '';
          updatedBracket[nextMatchGlobalIndex].score2 = '';
          updatedBracket[nextMatchGlobalIndex].completed = false;
          updatedBracket[nextMatchGlobalIndex].winner = null;
          
          // Clear all set scores for multiple sets matches
          for (let i = 1; i <= 5; i++) {
            updatedBracket[nextMatchGlobalIndex][`set${i}_team1`] = '';
            updatedBracket[nextMatchGlobalIndex][`set${i}_team2`] = '';
          }
          updatedBracket[nextMatchGlobalIndex].finalScore1 = '';
          updatedBracket[nextMatchGlobalIndex].finalScore2 = '';
          
          // Recursively clear subsequent rounds
          const subsequentRounds = updatedBracket.filter(m => m.round > nextRound);
          for (const subsequentMatch of subsequentRounds) {
            const subsequentMatchIndex = updatedBracket.findIndex(m => m.id === subsequentMatch.id);
            if (subsequentMatchIndex !== -1) {
              updatedBracket[subsequentMatchIndex].team1 = null;
              updatedBracket[subsequentMatchIndex].team2 = null;
              updatedBracket[subsequentMatchIndex].score1 = '';
              updatedBracket[subsequentMatchIndex].score2 = '';
              updatedBracket[subsequentMatchIndex].completed = false;
              updatedBracket[subsequentMatchIndex].winner = null;
              
              // Clear all set scores for multiple sets matches
              for (let i = 1; i <= 5; i++) {
                updatedBracket[subsequentMatchIndex][`set${i}_team1`] = '';
                updatedBracket[subsequentMatchIndex][`set${i}_team2`] = '';
              }
              updatedBracket[subsequentMatchIndex].finalScore1 = '';
              updatedBracket[subsequentMatchIndex].finalScore2 = '';
            }
          }
        }
      }
    }
  }
  
  return updatedBracket;
};
