import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  generatePairNames, 
  distributeIntoGroups, 
  generateRoundRobinMatches,
  calculateStandings,
  generateKnockoutBracket,
  generateEmptyBracket,
  updateBracket
} from '../utils/tournamentUtils';

export const useTournament = (user) => {
  const [tournaments, setTournaments] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tournaments data with real-time updates
  const loadTournaments = useCallback(async () => {
    if (!user) {
      setTournaments([]);
      setCurrentTournament(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all tournaments for this user with real-time updates
      const tournamentsRef = collection(db, 'tournaments');
      const q = query(
        tournamentsRef, 
        where('ownerUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tournamentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Real-time update - Tournaments loaded:', tournamentsList.length);
        console.log('Tournament IDs:', tournamentsList.map(t => t.id));
        
        setTournaments(tournamentsList);
        
        // Set the most recent tournament as current
        if (tournamentsList.length > 0) {
          setCurrentTournament(tournamentsList[0]);
          console.log('Current tournament set to:', tournamentsList[0].id);
        } else {
          setCurrentTournament(null);
          console.log('No current tournament set');
        }
        
        setLoading(false);
      }, (err) => {
        console.error('Error loading tournaments:', err);
        setError('Lỗi khi tải dữ liệu giải đấu');
        setLoading(false);
      });
      
      // Return unsubscribe function for cleanup
      return unsubscribe;
    } catch (err) {
      console.error('Error setting up tournaments listener:', err);
      setError('Lỗi khi tải dữ liệu giải đấu');
      setLoading(false);
    }
  }, [user]);

  // Create new tournament
  const createTournament = useCallback(async (settings) => {
    if (!user) {
      throw new Error('Vui lòng đăng nhập để tạo giải đấu');
    }

    try {
      setError(null);

      const { totalPairs, pairsPerGroup, teamsPerGroup, customTeams } = settings;
      
      // Generate pairs - use custom teams if provided, otherwise generate default names
      const pairs = customTeams || generatePairNames(totalPairs);
      
      // Distribute into groups
      const groups = distributeIntoGroups(pairs, pairsPerGroup);
      
      // Generate matches for each group
      const groupMatches = {};
      groups.forEach(group => {
        groupMatches[group.id] = generateRoundRobinMatches(group.pairs);
      });
      
      // Generate initial standings
      const standings = {};
      groups.forEach(group => {
        standings[group.id] = calculateStandings(group, groupMatches[group.id]);
      });
      
      // Generate empty knockout bracket structure (will be populated when group stage is complete)
      const bracketMatches = generateEmptyBracket(teamsPerGroup * groups.length);

      const tournamentData = {
        ownerUid: user.uid,
        ownerEmail: user.email,
        name: settings.tournamentName,
        settings,
        pairs,
        groups,
        groupMatches,
        standings,
        bracketMatches,
        authorizedEmails: [{ email: user.email, name: user.displayName || user.email }], // Owner is automatically authorized
        referees: [{ email: user.email, name: user.displayName || user.email }], // Owner is automatically a referee
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create new tournament document
      const tournamentRef = doc(collection(db, 'tournaments'));
      await setDoc(tournamentRef, tournamentData);

      const newTournament = {
        id: tournamentRef.id,
        ...tournamentData
      };

      setTournaments(prev => [newTournament, ...prev]);
      setCurrentTournament(newTournament);

      return tournamentRef.id;
    } catch (err) {
      console.error('Error creating tournament:', err);
      setError('Lỗi khi tạo giải đấu');
      throw err;
    }
  }, [user]);

  // Update pair name
  const updatePairName = useCallback(async (pairId, newName) => {
    if (!currentTournament || !user) return;

    try {
      const updatedPairs = currentTournament.pairs.map(pair => 
        pair.id === pairId ? { ...pair, name: newName } : pair
      );

      const updatedGroups = currentTournament.groups.map(group => ({
        ...group,
        pairs: group.pairs.map(pair => 
          pair.id === pairId ? { ...pair, name: newName } : pair
        )
      }));

      // Update group matches with new team names
      const updatedGroupMatches = {};
      Object.keys(currentTournament.groupMatches).forEach(groupId => {
        updatedGroupMatches[groupId] = currentTournament.groupMatches[groupId].map(match => ({
          ...match,
          team1: match.team1.id === pairId ? { ...match.team1, name: newName } : match.team1,
          team2: match.team2.id === pairId ? { ...match.team2, name: newName } : match.team2
        }));
      });

      // Update bracket matches with new team names
      const updatedBracketMatches = currentTournament.bracketMatches.map(match => ({
        ...match,
        team1: match.team1 && match.team1.id === pairId ? { ...match.team1, name: newName, teamName: newName } : match.team1,
        team2: match.team2 && match.team2.id === pairId ? { ...match.team2, name: newName, teamName: newName } : match.team2
      }));

      // Recalculate standings with updated team names
      const updatedStandings = {};
      updatedGroups.forEach(group => {
        updatedStandings[group.id] = calculateStandings(group, updatedGroupMatches[group.id]);
      });

      const tournamentRef = doc(db, 'tournaments', currentTournament.id);
      await updateDoc(tournamentRef, {
        pairs: updatedPairs,
        groups: updatedGroups,
        groupMatches: updatedGroupMatches,
        bracketMatches: updatedBracketMatches,
        standings: updatedStandings,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...currentTournament,
        pairs: updatedPairs,
        groups: updatedGroups,
        groupMatches: updatedGroupMatches,
        bracketMatches: updatedBracketMatches,
        standings: updatedStandings
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === currentTournament.id ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error updating pair name:', err);
      setError('Lỗi khi cập nhật tên đội');
    }
  }, [currentTournament, user]);

  // Update group match
  const updateGroupMatch = useCallback(async (groupId, matchId, score1, score2, tournamentId = null) => {
    console.log('updateGroupMatch called with:', { groupId, matchId, score1, score2, tournamentId });
    console.log('Current user:', user?.email);
    console.log('Current tournament:', currentTournament?.id);
    console.log('Available tournaments:', tournaments.map(t => t.id));
    
    if (!user) return;

    // Determine which tournament to update
    let targetTournament = currentTournament;
    let targetTournamentId = currentTournament?.id;
    
    if (tournamentId) {
      // If tournamentId is provided, find that tournament
      targetTournament = tournaments.find(t => t.id === tournamentId);
      targetTournamentId = tournamentId;
      
      // If not found in local tournaments, fetch from Firestore
      if (!targetTournament) {
        console.log('Tournament not found locally, fetching from Firestore...');
        try {
          const tournamentRef = doc(db, 'tournaments', tournamentId);
          const tournamentDoc = await getDoc(tournamentRef);
          
          if (tournamentDoc.exists()) {
            targetTournament = {
              id: tournamentDoc.id,
              ...tournamentDoc.data()
            };
            console.log('Fetched tournament from Firestore:', targetTournament.id);
          } else {
            console.error('Tournament does not exist in Firestore');
            return;
          }
        } catch (error) {
          console.error('Error fetching tournament from Firestore:', error);
          return;
        }
      }
    }
    
    console.log('Target tournament:', targetTournament?.id);
    console.log('Target tournament ID:', targetTournamentId);
    
    if (!targetTournament) {
      console.error('No tournament found to update');
      return;
    }

    try {
      const updatedGroupMatches = { ...targetTournament.groupMatches };
      console.log('Original group matches for group', groupId, ':', updatedGroupMatches[groupId]);
      
      const matchIndex = updatedGroupMatches[groupId].findIndex(m => m.id === matchId);
      console.log('Match index found:', matchIndex, 'for match ID:', matchId);
      
      if (matchIndex !== -1) {
        updatedGroupMatches[groupId][matchIndex] = {
          ...updatedGroupMatches[groupId][matchIndex],
          score1,
          score2,
          completed: score1 !== '' && score2 !== ''
        };
        console.log('Updated match:', updatedGroupMatches[groupId][matchIndex]);
      } else {
        console.error('Match not found in group matches');
      }

      // Recalculate standings
      const updatedStandings = { ...targetTournament.standings };
      const group = targetTournament.groups.find(g => g.id === groupId);
      updatedStandings[groupId] = calculateStandings(group, updatedGroupMatches[groupId]);

      // Update knockout bracket if all group matches are completed
      let updatedBracketMatches = [...targetTournament.bracketMatches];
      const allGroupMatches = Object.values(updatedGroupMatches).flat();
      const completedMatches = allGroupMatches.filter(match => match.completed);
      
      if (completedMatches.length === allGroupMatches.length && allGroupMatches.length > 0) {
        // All group matches completed, populate the bracket
        updatedBracketMatches = generateKnockoutBracket(
          Object.values(updatedStandings), 
          targetTournament.settings.teamsPerGroup
        );
      }

      const tournamentRef = doc(db, 'tournaments', targetTournamentId);
      console.log('Updating tournament in Firestore:', targetTournamentId);
      console.log('Update data:', {
        groupMatches: updatedGroupMatches,
        standings: updatedStandings,
        bracketMatches: updatedBracketMatches
      });
      
      await updateDoc(tournamentRef, {
        groupMatches: updatedGroupMatches,
        standings: updatedStandings,
        bracketMatches: updatedBracketMatches,
        updatedAt: new Date()
      });
      
      console.log('Tournament updated successfully in Firestore');

      const updatedTournament = {
        ...targetTournament,
        groupMatches: updatedGroupMatches,
        standings: updatedStandings,
        bracketMatches: updatedBracketMatches
      };

      // Update local state if this is the current tournament
      if (targetTournamentId === currentTournament?.id) {
        setCurrentTournament(updatedTournament);
      }
      
      setTournaments(prev => prev.map(t => 
        t.id === targetTournamentId ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error updating group match:', err);
      setError('Lỗi khi cập nhật kết quả trận đấu');
    }
  }, [currentTournament, user, tournaments]);

  // Update bracket match
  const updateBracketMatch = useCallback(async (matchId, score1, score2, setsPerMatch = null, setData = null, tournamentId = null) => {
    console.log('updateBracketMatch called with:', { matchId, score1, score2, setsPerMatch, setData, tournamentId });
    console.log('Current user:', user?.email);
    console.log('Current tournament:', currentTournament?.id);
    console.log('Available tournaments:', tournaments.map(t => t.id));
    
    if (!user) return;

    // Determine which tournament to update
    let targetTournament = currentTournament;
    let targetTournamentId = currentTournament?.id;
    
    if (tournamentId) {
      // If tournamentId is provided, find that tournament
      targetTournament = tournaments.find(t => t.id === tournamentId);
      targetTournamentId = tournamentId;
      
      // If not found in local tournaments, fetch from Firestore
      if (!targetTournament) {
        console.log('Tournament not found locally, fetching from Firestore...');
        try {
          const tournamentRef = doc(db, 'tournaments', tournamentId);
          const tournamentDoc = await getDoc(tournamentRef);
          
          if (tournamentDoc.exists()) {
            targetTournament = {
              id: tournamentDoc.id,
              ...tournamentDoc.data()
            };
            console.log('Fetched tournament from Firestore:', targetTournament.id);
          } else {
            console.error('Tournament does not exist in Firestore');
            return;
          }
        } catch (error) {
          console.error('Error fetching tournament from Firestore:', error);
          return;
        }
      }
    }
    
    console.log('Target tournament:', targetTournament?.id);
    console.log('Target tournament ID:', targetTournamentId);
    
    if (!targetTournament) {
      console.error('No tournament found to update');
      return;
    }

    try {
      const matchIndex = targetTournament.bracketMatches.findIndex(m => m.id === matchId);
      console.log('Bracket match index found:', matchIndex, 'for match ID:', matchId);
      
      if (matchIndex === -1) {
        console.error('Bracket match not found');
        return;
      }

      const originalMatch = targetTournament.bracketMatches[matchIndex];
      console.log('Original bracket match:', originalMatch);

      const updatedMatch = {
        ...targetTournament.bracketMatches[matchIndex],
        score1,
        score2,
        completed: score1 !== '' && score2 !== ''
      };
      
      console.log('Updated bracket match:', updatedMatch);

      // If setData is provided, it might override the completed status
      if (setData && setData.completed !== undefined) {
        updatedMatch.completed = setData.completed;
      }

      // Update sets per match if provided
      if (setsPerMatch !== null) {
        updatedMatch.setsPerMatch = setsPerMatch;
      }

      // Update set data if provided (for multiple sets)
      if (setData) {
        Object.assign(updatedMatch, setData);
      }

      // If we're only updating setsPerMatch (no score changes), don't use updateBracket
      if (setsPerMatch !== null && score1 === originalMatch.score1 && score2 === originalMatch.score2) {
        // Direct update without bracket logic
        const updatedBracketMatches = [...targetTournament.bracketMatches];
        updatedBracketMatches[matchIndex] = updatedMatch;
        
        const tournamentRef = doc(db, 'tournaments', targetTournamentId);
        console.log('Updating tournament in Firestore (setsPerMatch only):', targetTournamentId);
        await updateDoc(tournamentRef, {
          bracketMatches: updatedBracketMatches,
          updatedAt: new Date()
        });

        const updatedTournament = {
          ...targetTournament,
          bracketMatches: updatedBracketMatches
        };

        // Update local state if this is the current tournament
        if (targetTournamentId === currentTournament?.id) {
          setCurrentTournament(updatedTournament);
        }
        setTournaments(prev => prev.map(t => 
          t.id === targetTournamentId ? updatedTournament : t
        ));
      } else {
        // Use updateBracket for score changes
        const updatedBracketMatches = updateBracket(targetTournament.bracketMatches, updatedMatch);

        const tournamentRef = doc(db, 'tournaments', targetTournamentId);
        console.log('Updating tournament in Firestore (with bracket logic):', targetTournamentId);
        await updateDoc(tournamentRef, {
          bracketMatches: updatedBracketMatches,
          updatedAt: new Date()
        });

        const updatedTournament = {
          ...targetTournament,
          bracketMatches: updatedBracketMatches
        };

        // Update local state if this is the current tournament
        if (targetTournamentId === currentTournament?.id) {
          setCurrentTournament(updatedTournament);
        }
        setTournaments(prev => prev.map(t => 
          t.id === targetTournamentId ? updatedTournament : t
        ));
      }
    } catch (err) {
      console.error('Error updating bracket match:', err);
      setError('Lỗi khi cập nhật kết quả vòng loại trực tiếp');
    }
  }, [currentTournament, user, tournaments]);

  // Update tournament name
  const updateTournamentName = useCallback(async (tournamentId, newName) => {
    if (!user) return;

    try {
      setError(null);
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        name: newName,
        updatedAt: new Date()
      });

      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? { ...t, name: newName } : t
      ));
      
      if (currentTournament?.id === tournamentId) {
        setCurrentTournament(prev => prev ? { ...prev, name: newName } : null);
      }
    } catch (err) {
      console.error('Error updating tournament name:', err);
      setError('Lỗi khi cập nhật tên giải đấu');
    }
  }, [user, currentTournament]);

  // Add new group
  const addGroup = useCallback(async () => {
    if (!currentTournament || !user) return;

    try {
      setError(null);
      const newGroupId = String.fromCharCode(65 + currentTournament.groups.length); // A, B, C, ...
      
      // Determine how many teams to add based on existing groups
      let teamsToAdd = 0;
      if (currentTournament.groups.length > 0) {
        // Use the number of teams from the first group as reference
        teamsToAdd = currentTournament.groups[0].pairs.length;
      } else {
        // If no groups exist, use the tournament settings
        teamsToAdd = currentTournament.settings?.pairsPerGroup || 4;
      }

      // Create default teams for the new group
      const newPairs = [];
      for (let i = 0; i < teamsToAdd; i++) {
        const newPairId = `P${currentTournament.pairs.length + i + 1}`;
        newPairs.push({
          id: newPairId,
          name: newPairId,
          editable: true
        });
      }

      const newGroup = {
        id: newGroupId,
        pairs: newPairs,
        name: `Bảng ${newGroupId}`
      };

      // Update pairs list with new teams
      const updatedPairs = [...currentTournament.pairs, ...newPairs];
      const updatedGroups = [...currentTournament.groups, newGroup];

      // Generate matches and standings for the new group
      const updatedGroupMatches = { ...currentTournament.groupMatches };
      const updatedStandings = { ...currentTournament.standings };
      
      updatedGroupMatches[newGroupId] = generateRoundRobinMatches(newPairs);
      updatedStandings[newGroupId] = calculateStandings(newGroup, updatedGroupMatches[newGroupId]);

      const tournamentRef = doc(db, 'tournaments', currentTournament.id);
      await updateDoc(tournamentRef, {
        pairs: updatedPairs,
        groups: updatedGroups,
        groupMatches: updatedGroupMatches,
        standings: updatedStandings,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...currentTournament,
        pairs: updatedPairs,
        groups: updatedGroups,
        groupMatches: updatedGroupMatches,
        standings: updatedStandings
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === currentTournament.id ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error adding group:', err);
      setError('Lỗi khi thêm bảng');
    }
  }, [currentTournament, user]);

  // Delete group
  const deleteGroup = useCallback(async (groupId) => {
    if (!currentTournament || !user) return;

    try {
      setError(null);
      
      const updatedGroups = currentTournament.groups.filter(g => g.id !== groupId);
      
      // Synchronize pairs array with remaining groups (this is the key fix)
      const updatedPairs = [];
      updatedGroups.forEach(group => {
        updatedPairs.push(...group.pairs);
      });
      const updatedGroupMatches = { ...currentTournament.groupMatches };
      const updatedStandings = { ...currentTournament.standings };
      
      delete updatedGroupMatches[groupId];
      delete updatedStandings[groupId];

      const tournamentRef = doc(db, 'tournaments', currentTournament.id);
      await updateDoc(tournamentRef, {
        pairs: updatedPairs,
        groups: updatedGroups,
        groupMatches: updatedGroupMatches,
        standings: updatedStandings,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...currentTournament,
        pairs: updatedPairs,
        groups: updatedGroups,
        groupMatches: updatedGroupMatches,
        standings: updatedStandings
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === currentTournament.id ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error deleting group:', err);
      setError('Lỗi khi xóa bảng');
    }
  }, [currentTournament, user]);

  // Add new player
  const addPlayer = useCallback(async (groupId = null) => {
    if (!currentTournament || !user) return;

    try {
      setError(null);
      const newPairId = `P${currentTournament.pairs.length + 1}`;
      const newPair = {
        id: newPairId,
        name: newPairId,
        editable: true
      };

      const updatedPairs = [...currentTournament.pairs, newPair];
      let updatedGroups = [...currentTournament.groups];

      if (groupId) {
        // Add to specific group
        updatedGroups = updatedGroups.map(group => 
          group.id === groupId 
            ? { ...group, pairs: [...group.pairs, newPair] }
            : group
        );
      } else {
        // Add to first group or create new group if none exists
        if (updatedGroups.length === 0) {
          updatedGroups = [{
            id: 'A',
            pairs: [newPair],
            name: 'Bảng A'
          }];
        } else {
          updatedGroups[0] = {
            ...updatedGroups[0],
            pairs: [...updatedGroups[0].pairs, newPair]
          };
        }
      }

      // Update group matches and standings
      const updatedGroupMatches = { ...currentTournament.groupMatches };
      const updatedStandings = { ...currentTournament.standings };

      updatedGroups.forEach(group => {
        if (!updatedGroupMatches[group.id]) {
          updatedGroupMatches[group.id] = generateRoundRobinMatches(group.pairs);
        } else {
          updatedGroupMatches[group.id] = generateRoundRobinMatches(group.pairs);
        }
        updatedStandings[group.id] = calculateStandings(group, updatedGroupMatches[group.id]);
      });

      const tournamentRef = doc(db, 'tournaments', currentTournament.id);
      await updateDoc(tournamentRef, {
        pairs: updatedPairs,
        groups: updatedGroups,
        groupMatches: updatedGroupMatches,
        standings: updatedStandings,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...currentTournament,
        pairs: updatedPairs,
        groups: updatedGroups,
        groupMatches: updatedGroupMatches,
        standings: updatedStandings
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === currentTournament.id ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error adding player:', err);
      setError('Lỗi khi thêm đội');
    }
  }, [currentTournament, user]);

  // Delete player
  const deletePlayer = useCallback(async (groupId, playerId) => {
    if (!currentTournament || !user) return;

    try {
      setError(null);
      const updatedGroups = currentTournament.groups.map(group => 
        group.id === groupId 
          ? { ...group, pairs: group.pairs.filter(p => p.id !== playerId) }
          : group
      );

      // Synchronize pairs array with groups (this is the key fix)
      const updatedPairs = [];
      updatedGroups.forEach(group => {
        updatedPairs.push(...group.pairs);
      });

      // Update group matches and standings
      const updatedGroupMatches = { ...currentTournament.groupMatches };
      const updatedStandings = { ...currentTournament.standings };

      updatedGroups.forEach(group => {
        if (group.pairs.length > 0) {
          updatedGroupMatches[group.id] = generateRoundRobinMatches(group.pairs);
          updatedStandings[group.id] = calculateStandings(group, updatedGroupMatches[group.id]);
        } else {
          delete updatedGroupMatches[group.id];
          delete updatedStandings[group.id];
        }
      });

      const tournamentRef = doc(db, 'tournaments', currentTournament.id);
      await updateDoc(tournamentRef, {
        pairs: updatedPairs,
        groups: updatedGroups,
        groupMatches: updatedGroupMatches,
        standings: updatedStandings,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...currentTournament,
        pairs: updatedPairs,
        groups: updatedGroups,
        groupMatches: updatedGroupMatches,
        standings: updatedStandings
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === currentTournament.id ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error deleting player:', err);
      setError('Lỗi khi xóa đội');
    }
  }, [currentTournament, user]);

  // Switch to a different tournament
  const switchTournament = useCallback((tournamentId) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      setCurrentTournament(tournament);
    }
  }, [tournaments]);

  // Delete tournament
  const deleteTournament = useCallback(async (tournamentId) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'tournaments', tournamentId));
      
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
      
      // If we deleted the current tournament, switch to the first available one
      if (currentTournament?.id === tournamentId) {
        const remainingTournaments = tournaments.filter(t => t.id !== tournamentId);
        if (remainingTournaments.length > 0) {
          setCurrentTournament(remainingTournaments[0]);
        } else {
          setCurrentTournament(null);
        }
      }
    } catch (err) {
      console.error('Error deleting tournament:', err);
      setError('Lỗi khi xóa giải đấu');
      throw err;
    }
  }, [user, currentTournament, tournaments]);

  // Helper function to get default sets per match based on round
  const getDefaultSetsPerMatch = (round, totalRounds) => {
    if (round === totalRounds) return 3; // Finals: 3 sets
    return 1; // Quarter-finals and Semi-finals: 1 set
  };

  // Add authorized email to tournament
  const addAuthorizedEmail = useCallback(async (tournamentId, email, name) => {
    if (!user) return;

    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      // Check if user is owner
      if (tournament.ownerUid !== user.uid) {
        throw new Error('Chỉ chủ sở hữu mới có thể thêm email được ủy quyền');
      }

      // Check if email is already authorized
      const existingEmail = tournament.authorizedEmails?.find(auth => 
        typeof auth === 'string' ? auth === email : auth.email === email
      );
      if (existingEmail) {
        throw new Error('Email này đã được ủy quyền');
      }

      const newAuthorizedUser = { email: email.toLowerCase(), name };
      const updatedAuthorizedEmails = [...(tournament.authorizedEmails || []), newAuthorizedUser];

      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        authorizedEmails: updatedAuthorizedEmails,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...tournament,
        authorizedEmails: updatedAuthorizedEmails
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error adding authorized email:', err);
      setError(err.message || 'Lỗi khi thêm email được ủy quyền');
      throw err;
    }
  }, [user, tournaments]);

  // Remove authorized email from tournament
  const removeAuthorizedEmail = useCallback(async (tournamentId, email) => {
    if (!user) return;

    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      // Check if user is owner
      if (tournament.ownerUid !== user.uid) {
        throw new Error('Chỉ chủ sở hữu mới có thể xóa email được ủy quyền');
      }

      // Check if trying to remove owner
      if (email === tournament.ownerEmail) {
        throw new Error('Không thể xóa email của chủ sở hữu');
      }

      const updatedAuthorizedEmails = (tournament.authorizedEmails || []).filter(auth => 
        typeof auth === 'string' ? auth !== email : auth.email !== email
      );

      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        authorizedEmails: updatedAuthorizedEmails,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...tournament,
        authorizedEmails: updatedAuthorizedEmails
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error removing authorized email:', err);
      setError(err.message || 'Lỗi khi xóa email được ủy quyền');
      throw err;
    }
  }, [user, tournaments]);

  // Reset all scores in tournament
  const resetTournamentScores = useCallback(async (tournamentId) => {
    if (!user) return;

    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      // Reset all group matches
      const resetGroupMatches = {};
      Object.keys(tournament.groupMatches).forEach(groupId => {
        resetGroupMatches[groupId] = tournament.groupMatches[groupId].map(match => ({
          ...match,
          score1: '',
          score2: '',
          completed: false
        }));
      });

      // Calculate total rounds
      const totalRounds = Math.max(...tournament.bracketMatches.map(m => m.round));
      
      // Reset all bracket matches
      const resetBracketMatches = tournament.bracketMatches.map(match => ({
        ...match,
        team1: null,
        team2: null,
        score1: '',
        score2: '',
        completed: false,
        winner: null,
        setsPerMatch: match.setsPerMatch || getDefaultSetsPerMatch(match.round, totalRounds) // Preserve sets per match setting
      }));

      // Recalculate standings with empty scores
      const resetStandings = {};
      tournament.groups.forEach(group => {
        resetStandings[group.id] = calculateStandings(group, resetGroupMatches[group.id]);
      });

      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        groupMatches: resetGroupMatches,
        bracketMatches: resetBracketMatches,
        standings: resetStandings,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...tournament,
        groupMatches: resetGroupMatches,
        bracketMatches: resetBracketMatches,
        standings: resetStandings
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error resetting tournament scores:', err);
      setError('Lỗi khi đặt lại điểm số');
      throw err;
    }
  }, [user, tournaments]);

  // Assign referee to match
  const assignRefereeToMatch = useCallback(async (tournamentId, groupId, matchId, refereeEmail) => {
    if (!user) return;

    console.log('useTournament - assignRefereeToMatch called with:', {
      tournamentId,
      groupId,
      matchId,
      refereeEmail
    });

    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) {
        console.log('useTournament - Tournament not found:', tournamentId);
        return;
      }

      console.log('useTournament - Found tournament:', tournament.name);
      console.log('useTournament - Current groupMatches:', tournament.groupMatches);

      const updatedGroupMatches = { ...tournament.groupMatches };
      const groupMatches = updatedGroupMatches[groupId];
      
      if (!groupMatches) {
        console.log('useTournament - Group matches not found for group:', groupId);
        return;
      }

      console.log('useTournament - Group matches for', groupId, ':', groupMatches);

      const matchIndex = groupMatches.findIndex(m => m.id === matchId);
      console.log('useTournament - Match index found:', matchIndex, 'for matchId:', matchId);
      
      if (matchIndex === -1) {
        console.log('useTournament - Match not found in group');
        return;
      }

      console.log('useTournament - Original match:', groupMatches[matchIndex]);

      // Update the match with assigned referee
      groupMatches[matchIndex] = {
        ...groupMatches[matchIndex],
        assignedReferee: refereeEmail
      };

      console.log('useTournament - Updated match:', groupMatches[matchIndex]);

      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        groupMatches: updatedGroupMatches,
        updatedAt: new Date()
      });

      console.log('useTournament - Successfully updated Firestore');

      const updatedTournament = {
        ...tournament,
        groupMatches: updatedGroupMatches
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? updatedTournament : t
      ));

      console.log('useTournament - Successfully updated local state');
    } catch (err) {
      console.error('Error assigning referee to match:', err);
      setError('Lỗi khi phân công trọng tài');
      throw err;
    }
  }, [user, tournaments]);

  // Remove referee assignment from match
  const removeRefereeFromMatch = useCallback(async (tournamentId, groupId, matchId) => {
    if (!user) return;

    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      const updatedGroupMatches = { ...tournament.groupMatches };
      const groupMatches = updatedGroupMatches[groupId];
      
      if (!groupMatches) return;

      const matchIndex = groupMatches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return;

      // Remove referee assignment
      groupMatches[matchIndex] = {
        ...groupMatches[matchIndex],
        assignedReferee: null
      };

      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        groupMatches: updatedGroupMatches,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...tournament,
        groupMatches: updatedGroupMatches
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error removing referee from match:', err);
      setError('Lỗi khi xóa phân công trọng tài');
      throw err;
    }
  }, [user, tournaments]);

  // Assign referee to knockout match
  const assignRefereeToKnockoutMatch = useCallback(async (tournamentId, matchId, refereeEmail) => {
    if (!user) return;

    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      const updatedBracketMatches = [...tournament.bracketMatches];
      const matchIndex = updatedBracketMatches.findIndex(m => m.id === matchId);
      
      if (matchIndex === -1) return;

      // Update the match with assigned referee
      updatedBracketMatches[matchIndex] = {
        ...updatedBracketMatches[matchIndex],
        assignedReferee: refereeEmail
      };

      console.log('useTournament - Updated knockout match:', updatedBracketMatches[matchIndex]);

      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        bracketMatches: updatedBracketMatches,
        updatedAt: new Date()
      });

      console.log('useTournament - Successfully updated Firestore for knockout match');

      const updatedTournament = {
        ...tournament,
        bracketMatches: updatedBracketMatches
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? updatedTournament : t
      ));

      console.log('useTournament - Successfully updated local state for knockout match');
    } catch (err) {
      console.error('Error assigning referee to knockout match:', err);
      setError('Lỗi khi phân công trọng tài cho trận đấu loại trực tiếp');
      throw err;
    }
  }, [user, tournaments]);

  // Remove referee assignment from knockout match
  const removeRefereeFromKnockoutMatch = useCallback(async (tournamentId, matchId) => {
    console.log('useTournament - removeRefereeFromKnockoutMatch called:', { tournamentId, matchId });
    
    if (!user) {
      console.log('useTournament - No user, returning');
      return;
    }

    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) {
        console.log('useTournament - Tournament not found');
        return;
      }

      console.log('useTournament - Found tournament, bracket matches:', tournament.bracketMatches);
      
      const updatedBracketMatches = [...tournament.bracketMatches];
      const matchIndex = updatedBracketMatches.findIndex(m => m.id === matchId);
      
      console.log('useTournament - Match index:', matchIndex);
      
      if (matchIndex === -1) {
        console.log('useTournament - Match not found');
        return;
      }

      console.log('useTournament - Current match:', updatedBracketMatches[matchIndex]);

      // Remove referee assignment
      updatedBracketMatches[matchIndex] = {
        ...updatedBracketMatches[matchIndex],
        assignedReferee: null
      };

      console.log('useTournament - Updated match:', updatedBracketMatches[matchIndex]);

      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        bracketMatches: updatedBracketMatches,
        updatedAt: new Date()
      });

      console.log('useTournament - Firestore update completed');

      const updatedTournament = {
        ...tournament,
        bracketMatches: updatedBracketMatches
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? updatedTournament : t
      ));
      
      console.log('useTournament - State updated successfully');
    } catch (err) {
      console.error('Error removing referee from knockout match:', err);
      setError('Lỗi khi xóa phân công trọng tài cho trận đấu loại trực tiếp');
      throw err;
    }
  }, [user, tournaments]);

  // Add referee to tournament
  const addReferee = useCallback(async (tournamentId, email, name) => {
    if (!user) return;

    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      // Check if user is owner
      if (tournament.ownerUid !== user.uid) {
        throw new Error('Chỉ chủ sở hữu mới có thể thêm trọng tài');
      }

      // Check if referee already exists
      const existingReferee = (tournament.referees || []).find(r => r.email === email);
      if (existingReferee) {
        throw new Error('Trọng tài với email này đã tồn tại');
      }

      const updatedReferees = [...(tournament.referees || []), { email: email.toLowerCase(), name }];

      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        referees: updatedReferees,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...tournament,
        referees: updatedReferees
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error adding referee:', err);
      setError(err.message || 'Lỗi khi thêm trọng tài');
      throw err;
    }
  }, [user, tournaments]);

  // Remove referee from tournament
  const removeReferee = useCallback(async (tournamentId, email) => {
    if (!user) return;

    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      // Check if user is owner
      if (tournament.ownerUid !== user.uid) {
        throw new Error('Chỉ chủ sở hữu mới có thể xóa trọng tài');
      }

      // Check if trying to remove owner
      if (email === tournament.ownerEmail) {
        throw new Error('Không thể xóa chủ sở hữu khỏi danh sách trọng tài');
      }

      const updatedReferees = (tournament.referees || []).filter(r => r.email !== email);

      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        referees: updatedReferees,
        updatedAt: new Date()
      });

      const updatedTournament = {
        ...tournament,
        referees: updatedReferees
      };

      setCurrentTournament(updatedTournament);
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? updatedTournament : t
      ));
    } catch (err) {
      console.error('Error removing referee:', err);
      setError(err.message || 'Lỗi khi xóa trọng tài');
      throw err;
    }
  }, [user, tournaments]);

  // Load tournaments on mount and when user changes
  useEffect(() => {
    let unsubscribe;
    
    const setupListener = async () => {
      unsubscribe = await loadTournaments();
    };
    
    setupListener();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadTournaments]);

  return {
    tournaments,
    currentTournament,
    loading,
    error,
    createTournament,
    updatePairName,
    updateTournamentName,
    updateGroupMatch,
    updateBracketMatch,
    switchTournament,
    deleteTournament,
    resetTournamentScores,
    addGroup,
    deleteGroup,
    addPlayer,
    deletePlayer,
    addAuthorizedEmail,
    removeAuthorizedEmail,
    assignRefereeToMatch,
    removeRefereeFromMatch,
    assignRefereeToKnockoutMatch,
    removeRefereeFromKnockoutMatch,
    addReferee,
    removeReferee
  };
};
