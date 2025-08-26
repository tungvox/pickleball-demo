import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Tabs,
  Tab,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  SportsTennis as TennisIcon,
  Login as LoginIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  Sports as SportsIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useTournament } from '../hooks/useTournament';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import AuthModal from './AuthModal';
import CourtRefereeView from './CourtRefereeView';

const RefereeDashboard = ({ tournamentId, onUpdateMatch, onUpdateBracketMatch }) => {
  const { user, signInWithGoogle } = useAuth();
  const { tournaments } = useTournament(user);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [tempScores, setTempScores] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [editingMatches, setEditingMatches] = useState({});
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedMatchType, setSelectedMatchType] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Debug logging
  console.log('RefereeDashboard props:', { tournamentId });
  console.log('RefereeDashboard user:', user);
  console.log('RefereeDashboard tournaments:', tournaments);

  // Load tournament data with real-time updates
  const loadTournament = useCallback(async () => {
    if (!tournamentId) return;

    setLoading(true);
    setError(null);

    try {
      // First try to find tournament in local state
      let foundTournament = tournaments.find(t => t.id === tournamentId);
      
      if (!foundTournament) {
        // If not found locally, fetch from Firestore with real-time updates
        const tournamentRef = doc(db, 'tournaments', tournamentId);
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(tournamentRef, (tournamentSnap) => {
          console.log('RefereeDashboard - Real-time update received for tournament:', tournamentId);
          
          if (tournamentSnap.exists()) {
            const tournamentData = {
              id: tournamentSnap.id,
              ...tournamentSnap.data()
            };
            
            console.log('RefereeDashboard - Tournament data updated:', {
              id: tournamentData.id,
              name: tournamentData.name,
              groups: tournamentData.groups?.length || 0,
              bracketMatches: tournamentData.bracketMatches?.length || 0,
              updatedAt: tournamentData.updatedAt
            });
            
            // Check if user has access
            const hasAccess = tournamentData.ownerUid === user?.uid || 
              tournamentData.authorizedEmails?.some(auth => 
                typeof auth === 'string' ? auth === user?.email : auth.email === user?.email
              );

            if (!hasAccess) {
              setError('Bạn không có quyền truy cập vào giải đấu này');
              return;
            }

            setTournament(tournamentData);
          } else {
            setError('Không tìm thấy giải đấu');
          }
          setLoading(false);
        }, (error) => {
          console.error('RefereeDashboard - Error loading tournament:', error);
          setError('Lỗi khi tải dữ liệu giải đấu');
          setLoading(false);
        });
        
        // Return unsubscribe function for cleanup
        return unsubscribe;
      } else {
        // Tournament found locally, set up real-time listener for updates
        const tournamentRef = doc(db, 'tournaments', tournamentId);
        
        const unsubscribe = onSnapshot(tournamentRef, (tournamentSnap) => {
          console.log('RefereeDashboard - Real-time update received for local tournament:', tournamentId);
          
          if (tournamentSnap.exists()) {
            const tournamentData = {
              id: tournamentSnap.id,
              ...tournamentSnap.data()
            };
            
            // Check if user has access
            const hasAccess = tournamentData.ownerUid === user?.uid || 
              tournamentData.authorizedEmails?.some(auth => 
                typeof auth === 'string' ? auth === user?.email : auth.email === user?.email
              );

            if (!hasAccess) {
              setError('Bạn không có quyền truy cập vào giải đấu này');
              return;
            }

            setTournament(tournamentData);
          }
        }, (error) => {
          console.error('RefereeDashboard - Error in real-time listener:', error);
        });
        
        // Set initial data
        const hasAccess = foundTournament.ownerUid === user?.uid || 
          foundTournament.authorizedEmails?.some(auth => 
            typeof auth === 'string' ? auth === user?.email : auth.email === user?.email
          );

        if (!hasAccess) {
          throw new Error('Bạn không có quyền truy cập vào giải đấu này');
        }

        setTournament(foundTournament);
        setLoading(false);
        return unsubscribe;
      }

    } catch (err) {
      console.error('Error loading tournament:', err);
      setError(err.message || 'Lỗi khi tải dữ liệu giải đấu');
      setLoading(false);
    }
  }, [tournamentId, tournaments, user]);

  useEffect(() => {
    let unsubscribe;
    
    const setupData = async () => {
      if (user) {
        unsubscribe = await loadTournament();
      } else {
        setLoading(false);
      }
    };
    
    setupData();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, loadTournament]);

  // Get assigned group matches for the current referee
  const getAssignedGroupMatches = () => {
    if (!tournament || !user) return [];
    
    const assignedMatches = [];
    
    Object.entries(tournament.groupMatches || {}).forEach(([groupId, matches]) => {
      const group = tournament.groups.find(g => g.id === groupId);
      if (!group) return;
      
      const userMatches = matches.filter(match => 
        match.assignedReferee === user.email
      );
      
      if (userMatches.length > 0) {
        assignedMatches.push({
          group,
          matches: userMatches
        });
      }
    });
    
    return assignedMatches;
  };

  // Get assigned knockout matches for the current referee
  const getAssignedKnockoutMatches = () => {
    if (!tournament || !user) return [];
    
    return (tournament.bracketMatches || []).filter(match => 
      match.assignedReferee === user.email
    );
  };

  // Handle group match score update
  const handleGroupMatchUpdate = async (groupId, matchId) => {
    const scores = tempScores[`group-${matchId}`] || {};
    const score1 = scores.score1 || '';
    const score2 = scores.score2 || '';
    
    if (!score1 || !score2) {
      setError('Vui lòng nhập đầy đủ điểm số');
      return;
    }

    const score1Num = parseInt(score1);
    const score2Num = parseInt(score2);

    if (isNaN(score1Num) || isNaN(score2Num)) {
      setError('Điểm số phải là số nguyên');
      return;
    }

    if (score1Num === score2Num) {
      setError('Không cho phép kết quả hòa. Vui lòng nhập điểm khác nhau hoặc nhấn Hủy để thoát.');
      return;
    }

    setError(null);
    setSuccessMessage('');

    try {
      console.log('RefereeDashboard - Calling onUpdateMatch with:', {
        groupId,
        matchId,
        score1: score1Num,
        score2: score2Num,
        tournamentId
      });
      
      await onUpdateMatch(groupId, matchId, score1Num, score2Num, tournamentId);
      
             // Clear temp scores for this match
       setTempScores(prev => {
         const newScores = { ...prev };
         delete newScores[`group-${matchId}`];
         return newScores;
       });
       
       // Clear editing state for this match
       setEditingMatches(prev => {
         const newState = { ...prev };
         delete newState[`group-${matchId}`];
         return newState;
       });
       
       // Show success message
       setSuccessMessage('Đã lưu điểm số thành công!');
       setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Lỗi khi cập nhật điểm số');
    }
  };

  // Handle knockout match score update
  const handleKnockoutMatchUpdate = async (matchId) => {
    const scores = tempScores[`knockout-${matchId}`] || {};
    const score1 = scores.score1 || '';
    const score2 = scores.score2 || '';
    
    if (!score1 || !score2) {
      setError('Vui lòng nhập đầy đủ điểm số');
      return;
    }

    const score1Num = parseInt(score1);
    const score2Num = parseInt(score2);

    if (isNaN(score1Num) || isNaN(score2Num)) {
      setError('Điểm số phải là số nguyên');
      return;
    }

    if (score1Num === score2Num) {
      setError('Không cho phép kết quả hòa. Vui lòng nhập điểm khác nhau hoặc nhấn Hủy để thoát.');
      return;
    }

    setError(null);
    setSuccessMessage('');

    try {
      console.log('RefereeDashboard - Calling onUpdateBracketMatch with:', {
        matchId,
        score1: score1Num,
        score2: score2Num,
        tournamentId
      });
      
      await onUpdateBracketMatch(matchId, score1Num, score2Num, null, null, tournamentId);
      
             // Clear temp scores for this match
       setTempScores(prev => {
         const newScores = { ...prev };
         delete newScores[`knockout-${matchId}`];
         return newScores;
       });
       
       // Clear editing state for this match
       setEditingMatches(prev => {
         const newState = { ...prev };
         delete newState[`knockout-${matchId}`];
         return newState;
       });
       
       // Show success message
       setSuccessMessage('Đã lưu điểm số thành công!');
       setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Lỗi khi cập nhật điểm số');
    }
  };

  // Handle temp score change
  const handleTempScoreChange = (matchType, matchId, field, value) => {
    // Allow empty values, remove leading zeros for non-empty values, and limit to 2 digits
    let cleanValue = value;
    if (value === '') {
      cleanValue = '';
    } else {
      // Remove leading zeros and limit to 2 digits
      cleanValue = value.replace(/^0+/, '') || '0';
      cleanValue = cleanValue.length > 2 ? cleanValue.slice(0, 2) : cleanValue;
    }
    
    const key = `${matchType}-${matchId}`;
    setTempScores(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: cleanValue
      }
    }));
    
    // Clear any existing error or success messages when user starts typing
    if (error) setError(null);
    if (successMessage) setSuccessMessage('');
  };

  // Handle start editing a match
  const handleStartEdit = (matchType, matchId, currentScore1, currentScore2) => {
    const key = `${matchType}-${matchId}`;
    setEditingMatches(prev => ({
      ...prev,
      [key]: true
    }));
    
    // Initialize temp scores with current values
    setTempScores(prev => ({
      ...prev,
      [key]: {
        score1: currentScore1?.toString() || '',
        score2: currentScore2?.toString() || ''
      }
    }));
  };

  // Handle cancel editing a match
  const handleCancelEdit = (matchType, matchId) => {
    const key = `${matchType}-${matchId}`;
    setEditingMatches(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
    
    // Clear temp scores for this match
    setTempScores(prev => {
      const newScores = { ...prev };
      delete newScores[key];
      return newScores;
    });
  };

  // Get team name helper function
  const getTeamName = (team) => {
    if (!tournament) return '';
    
    // Handle both team ID strings and team objects
    const teamId = typeof team === 'string' ? team : team?.id;
    
    if (!teamId) return 'Đội không xác định';
    
    const pair = tournament.pairs.find(p => p.id === teamId);
    return pair ? pair.name : `Đội ${teamId}`;
  };

  // Handle opening court view for a match
  const handleOpenCourtView = (match, matchType, groupId = null) => {
    setSelectedMatch(match);
    setSelectedMatchType(matchType);
    setSelectedGroupId(groupId);
  };

  // Handle closing court view
  const handleCloseCourtView = () => {
    setSelectedMatch(null);
    setSelectedMatchType(null);
    setSelectedGroupId(null);
  };

  // Show loading while authentication is being checked
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TennisIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Đăng nhập để truy cập
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Vui lòng đăng nhập để truy cập vào bảng điều khiển trọng tài
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => setAuthModalOpen(true)}
          >
            Đăng nhập
          </Button>
        </Paper>
        
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          title="Đăng nhập trọng tài"
        />
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Đang tải dữ liệu giải đấu...</Typography>
        </Paper>
      </Container>
    );
  }

  // Only show full-page error for critical errors, not validation errors
  if (error && !error.includes('Không cho phép kết quả hòa') && !error.includes('Vui lòng nhập đầy đủ điểm số') && !error.includes('Điểm số phải là số nguyên')) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Các giải đấu có sẵn: {tournaments.map(t => `${t.name} (ID: ${t.id})`).join(', ')}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Không tìm thấy giải đấu
          </Typography>
        </Paper>
      </Container>
    );
  }

  const assignedGroupMatches = getAssignedGroupMatches();
  const assignedKnockoutMatches = getAssignedKnockoutMatches();

  console.log('RefereeDashboard: Rendering with tournament:', tournament?.name);
  console.log('Assigned group matches:', assignedGroupMatches);
  console.log('Assigned knockout matches:', assignedKnockoutMatches);

  // Show court view if a match is selected
  if (selectedMatch) {
    return (
      <CourtRefereeView
        match={selectedMatch}
        tournament={tournament}
        onBack={handleCloseCourtView}
        onUpdateMatch={selectedMatchType === 'group' ? onUpdateMatch : onUpdateBracketMatch}
        matchType={selectedMatchType}
        groupId={selectedGroupId}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TennisIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              Bảng điều khiển trọng tài
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {tournament.name}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Trọng tài: {user?.email || user?.displayName || 'Unknown'}
        </Typography>
      </Paper>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
                     <Tab 
             label={`Vòng bảng (${assignedGroupMatches.reduce((total, group) => total + group.matches.length, 0)})`} 
             icon={<TennisIcon />}
           />
           <Tab 
             label={`Vòng loại (${assignedKnockoutMatches.length})`} 
             icon={<TennisIcon />}
           />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {assignedGroupMatches.length === 0 ? (
            <Alert severity="info">
              Bạn chưa được phân công trận đấu vòng bảng nào
            </Alert>
          ) : (
                         assignedGroupMatches.map(({ group, matches }) => (
               <Accordion key={group.id} sx={{ mb: 2 }} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {group.name}
                    </Typography>
                    <Chip 
                      label={`${matches.filter(m => m.completed).length}/${matches.length} hoàn thành`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {matches.map((match) => (
                      <Grid item xs={12} sm={6} md={4} key={match.id}>
                        <Card>
                          <CardContent>
                                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                               <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                                 Trận {match.matchNumber || matches.indexOf(match) + 1}
                               </Typography>
                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                 {match.completed && !editingMatches[`group-${match.id}`] && (
                                   <Chip 
                                     label="Hoàn thành" 
                                     color="success" 
                                     size="small" 
                                     icon={<CheckIcon />}
                                   />
                                 )}
                                 {match.completed && !editingMatches[`group-${match.id}`] && (
                                   <Button
                                     size="small"
                                     variant="outlined"
                                     onClick={() => handleStartEdit('group', match.id, match.score1, match.score2)}
                                     sx={{ fontSize: '0.7rem', py: 0.5 }}
                                   >
                                     Sửa
                                   </Button>
                                 )}
                                 <Button
                                   size="small"
                                   variant="contained"
                                   startIcon={<SportsIcon />}
                                   onClick={() => handleOpenCourtView(match, 'group', group.id)}
                                   sx={{ fontSize: '0.7rem', py: 0.5 }}
                                 >
                                   Quản lý
                                 </Button>
                               </Box>
                             </Box>

                                                         {!match.completed || editingMatches[`group-${match.id}`] ? (
                               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        flex: 1, 
                                        fontSize: '0.85rem',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        hyphens: 'auto',
                                        maxWidth: 'calc(100% - 130px)',
                                        minWidth: 0,
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {getTeamName(match.team1)}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                          minWidth: 32, 
                                          width: 32, 
                                          height: 36,
                                          p: 0,
                                          fontSize: '1.2rem',
                                          fontWeight: 'bold'
                                        }}
                                        onClick={() => {
                                          const currentValue = parseInt(tempScores[`group-${match.id}`]?.score1 || match.score1 || 0);
                                          const newValue = Math.max(0, currentValue - 1);
                                          handleTempScoreChange('group', match.id, 'score1', newValue.toString());
                                        }}
                                      >
                                        -
                                      </Button>
                                                                             <TextField
                                         size="small"
                                         type="number"
                                         value={tempScores[`group-${match.id}`]?.score1 ?? (match.score1 || '')}
                                         onChange={(e) => handleTempScoreChange('group', match.id, 'score1', e.target.value)}
                                         sx={{ 
                                           width: 70, 
                                           minWidth: 70,
                                           flexShrink: 0,
                                           '& .MuiOutlinedInput-root': { 
                                             fontSize: '1rem',
                                             fontWeight: 600,
                                             height: 36
                                           } 
                                         }}
                                         inputProps={{ 
                                           min: 0, 
                                           max: 99,
                                           style: { textAlign: 'center' },
                                           size: 2,
                                           name: 'score1',
                                           'data-score-input': 'score1'
                                         }}
                                       />
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                          minWidth: 32, 
                                          width: 32, 
                                          height: 36,
                                          p: 0,
                                          fontSize: '1.2rem',
                                          fontWeight: 'bold'
                                        }}
                                        onClick={() => {
                                          const currentValue = parseInt(tempScores[`group-${match.id}`]?.score1 || match.score1 || 0);
                                          const newValue = Math.min(99, currentValue + 1);
                                          handleTempScoreChange('group', match.id, 'score1', newValue.toString());
                                        }}
                                      >
                                        +
                                      </Button>
                                    </Box>
                                  </Box>
                                 
                                                                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        flex: 1, 
                                        fontSize: '0.85rem',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        hyphens: 'auto',
                                        maxWidth: 'calc(100% - 130px)',
                                        minWidth: 0,
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {getTeamName(match.team2)}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                          minWidth: 32, 
                                          width: 32, 
                                          height: 36,
                                          p: 0,
                                          fontSize: '1.2rem',
                                          fontWeight: 'bold'
                                        }}
                                        onClick={() => {
                                          const currentValue = parseInt(tempScores[`group-${match.id}`]?.score2 || match.score2 || 0);
                                          const newValue = Math.max(0, currentValue - 1);
                                          handleTempScoreChange('group', match.id, 'score2', newValue.toString());
                                        }}
                                      >
                                        -
                                      </Button>
                                                                             <TextField
                                         size="small"
                                         type="number"
                                         value={tempScores[`group-${match.id}`]?.score2 ?? (match.score2 || '')}
                                         onChange={(e) => handleTempScoreChange('group', match.id, 'score2', e.target.value)}
                                         sx={{ 
                                           width: 70, 
                                           minWidth: 70,
                                           flexShrink: 0,
                                           '& .MuiOutlinedInput-root': { 
                                             fontSize: '1rem',
                                             fontWeight: 600,
                                             height: 36
                                           } 
                                         }}
                                         inputProps={{ 
                                           min: 0, 
                                           max: 99,
                                           style: { textAlign: 'center' },
                                           size: 2,
                                           name: 'score2',
                                           'data-score-input': 'score2'
                                         }}
                                       />
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                          minWidth: 32, 
                                          width: 32, 
                                          height: 36,
                                          p: 0,
                                          fontSize: '1.2rem',
                                          fontWeight: 'bold'
                                        }}
                                        onClick={() => {
                                          const currentValue = parseInt(tempScores[`group-${match.id}`]?.score2 || match.score2 || 0);
                                          const newValue = Math.min(99, currentValue + 1);
                                          handleTempScoreChange('group', match.id, 'score2', newValue.toString());
                                        }}
                                      >
                                        +
                                      </Button>
                                    </Box>
                                  </Box>

                                                                 <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                                   <Button
                                     variant="contained"
                                     size="small"
                                     onClick={() => handleGroupMatchUpdate(group.id, match.id)}
                                   >
                                     {editingMatches[`group-${match.id}`] ? 'Cập nhật' : 'Lưu điểm'}
                                   </Button>
                                   {editingMatches[`group-${match.id}`] && (
                                     <Button
                                       variant="outlined"
                                       size="small"
                                       onClick={() => handleCancelEdit('group', match.id)}
                                     >
                                       Hủy
                                     </Button>
                                   )}
                                   {!editingMatches[`group-${match.id}`] && (
                                     <Button
                                       variant="outlined"
                                       size="small"
                                       startIcon={<SportsIcon />}
                                       onClick={() => handleOpenCourtView(match, 'group', group.id)}
                                     >
                                       Quản lý
                                     </Button>
                                   )}
                                 </Box>
                              </Box>
                                                         ) : (
                               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                   <Typography 
                                     variant="body2" 
                                     sx={{ 
                                       flex: 1, 
                                       fontSize: '0.85rem',
                                       wordBreak: 'break-word',
                                       overflowWrap: 'break-word',
                                       hyphens: 'auto',
                                       maxWidth: 'calc(100% - 40px)',
                                       minWidth: 0,
                                       overflow: 'hidden'
                                     }}
                                   >
                                     {getTeamName(match.team1)}
                                   </Typography>
                                   <Typography 
                                     variant="body1" 
                                     sx={{ 
                                       fontWeight: 600, 
                                       color: 'success.main', 
                                       minWidth: 30, 
                                       width: 30,
                                       textAlign: 'center',
                                       flexShrink: 0
                                     }}
                                   >
                                     {match.score1 || '-'}
                                   </Typography>
                                 </Box>
                                 
                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                   <Typography 
                                     variant="body2" 
                                     sx={{ 
                                       flex: 1, 
                                       fontSize: '0.85rem',
                                       wordBreak: 'break-word',
                                       overflowWrap: 'break-word',
                                       hyphens: 'auto',
                                       maxWidth: 'calc(100% - 40px)',
                                       minWidth: 0,
                                       overflow: 'hidden'
                                     }}
                                   >
                                     {getTeamName(match.team2)}
                                   </Typography>
                                   <Typography 
                                     variant="body1" 
                                     sx={{ 
                                       fontWeight: 600, 
                                       color: 'success.main', 
                                       minWidth: 30, 
                                       width: 30,
                                       textAlign: 'center',
                                       flexShrink: 0
                                     }}
                                   >
                                     {match.score2 || '-'}
                                   </Typography>
                                 </Box>
                               </Box>
                             )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {assignedKnockoutMatches.length === 0 ? (
            <Alert severity="info">
              Bạn chưa được phân công trận đấu loại trực tiếp nào
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {assignedKnockoutMatches.map((match) => (
                <Grid item xs={12} sm={6} md={4} key={match.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
                          Vòng {match.round} - Trận {match.matchNumber}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {match.completed && !editingMatches[`knockout-${match.id}`] && (
                            <Chip 
                              label="Hoàn thành" 
                              color="success" 
                              size="small" 
                              icon={<CheckIcon />}
                            />
                          )}
                                                     {match.completed && !editingMatches[`knockout-${match.id}`] && (
                             <Button
                               size="small"
                               variant="outlined"
                               onClick={() => handleStartEdit('knockout', match.id, match.score1, match.score2)}
                               sx={{ fontSize: '0.7rem', py: 0.5 }}
                             >
                               Sửa
                             </Button>
                           )}
                           <Button
                             size="small"
                             variant="contained"
                             startIcon={<SportsIcon />}
                             onClick={() => handleOpenCourtView(match, 'knockout')}
                             sx={{ fontSize: '0.7rem', py: 0.5 }}
                           >
                             Quản lý
                           </Button>
                        </Box>
                      </Box>

                                             {(!match.completed && match.team1 && match.team2) || editingMatches[`knockout-${match.id}`] ? (
                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  flex: 1, 
                                  fontSize: '0.85rem',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  hyphens: 'auto',
                                  maxWidth: 'calc(100% - 130px)',
                                  minWidth: 0,
                                  overflow: 'hidden'
                                }}
                              >
                                {match.team1 ? match.team1.name : 'TBD'}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    minWidth: 32, 
                                    width: 32, 
                                    height: 36,
                                    p: 0,
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                  }}
                                  onClick={() => {
                                    const currentValue = parseInt(tempScores[`knockout-${match.id}`]?.score1 || match.score1 || 0);
                                    const newValue = Math.max(0, currentValue - 1);
                                    handleTempScoreChange('knockout', match.id, 'score1', newValue.toString());
                                  }}
                                >
                                  -
                                </Button>
                                                                 <TextField
                                   size="small"
                                   type="number"
                                   value={tempScores[`knockout-${match.id}`]?.score1 ?? (match.score1 || '')}
                                   onChange={(e) => handleTempScoreChange('knockout', match.id, 'score1', e.target.value)}
                                   sx={{ 
                                     width: 70, 
                                     minWidth: 70,
                                     flexShrink: 0,
                                     '& .MuiOutlinedInput-root': { 
                                       fontSize: '1rem',
                                       fontWeight: 600,
                                       height: 36
                                     } 
                                   }}
                                   inputProps={{ 
                                     min: 0, 
                                     max: 99,
                                     style: { textAlign: 'center' },
                                     size: 2,
                                     name: 'score1',
                                     'data-score-input': 'score1'
                                   }}
                                 />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    minWidth: 32, 
                                    width: 32, 
                                    height: 36,
                                    p: 0,
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                  }}
                                  onClick={() => {
                                    const currentValue = parseInt(tempScores[`knockout-${match.id}`]?.score1 || match.score1 || 0);
                                    const newValue = Math.min(99, currentValue + 1);
                                    handleTempScoreChange('knockout', match.id, 'score1', newValue.toString());
                                  }}
                                >
                                  +
                                </Button>
                              </Box>
                            </Box>
                           
                                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  flex: 1, 
                                  fontSize: '0.85rem',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  hyphens: 'auto',
                                  maxWidth: 'calc(100% - 130px)',
                                  minWidth: 0,
                                  overflow: 'hidden'
                                }}
                              >
                                {match.team2 ? match.team2.name : 'TBD'}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    minWidth: 32, 
                                    width: 32, 
                                    height: 36,
                                    p: 0,
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                  }}
                                  onClick={() => {
                                    const currentValue = parseInt(tempScores[`knockout-${match.id}`]?.score2 || match.score2 || 0);
                                    const newValue = Math.max(0, currentValue - 1);
                                    handleTempScoreChange('knockout', match.id, 'score2', newValue.toString());
                                  }}
                                >
                                  -
                                </Button>
                                                                 <TextField
                                   size="small"
                                   type="number"
                                   value={tempScores[`knockout-${match.id}`]?.score2 ?? (match.score2 || '')}
                                   onChange={(e) => handleTempScoreChange('knockout', match.id, 'score2', e.target.value)}
                                   sx={{ 
                                     width: 70, 
                                     minWidth: 70,
                                     flexShrink: 0,
                                     '& .MuiOutlinedInput-root': { 
                                       fontSize: '1rem',
                                       fontWeight: 600,
                                       height: 36
                                     } 
                                   }}
                                   inputProps={{ 
                                     min: 0, 
                                     max: 99,
                                     style: { textAlign: 'center' },
                                     size: 2,
                                     name: 'score2',
                                     'data-score-input': 'score2'
                                   }}
                                 />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    minWidth: 32, 
                                    width: 32, 
                                    height: 36,
                                    p: 0,
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                  }}
                                  onClick={() => {
                                    const currentValue = parseInt(tempScores[`knockout-${match.id}`]?.score2 || match.score2 || 0);
                                    const newValue = Math.min(99, currentValue + 1);
                                    handleTempScoreChange('knockout', match.id, 'score2', newValue.toString());
                                  }}
                                >
                                  +
                                </Button>
                              </Box>
                            </Box>

                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleKnockoutMatchUpdate(match.id)}
                            >
                              {editingMatches[`knockout-${match.id}`] ? 'Cập nhật' : 'Lưu điểm'}
                            </Button>
                            {editingMatches[`knockout-${match.id}`] && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleCancelEdit('knockout', match.id)}
                              >
                                Hủy
                              </Button>
                            )}
                            {!editingMatches[`knockout-${match.id}`] && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<SportsIcon />}
                                onClick={() => handleOpenCourtView(match, 'knockout')}
                              >
                                Quản lý
                              </Button>
                            )}
                          </Box>
                        </Box>
                                             ) : (
                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                             <Typography 
                               variant="body2" 
                               sx={{ 
                                 flex: 1, 
                                 fontSize: '0.85rem',
                                 wordBreak: 'break-word',
                                 overflowWrap: 'break-word',
                                 hyphens: 'auto',
                                 maxWidth: 'calc(100% - 40px)',
                                 minWidth: 0,
                                 overflow: 'hidden'
                               }}
                             >
                               {match.team1 ? match.team1.name : 'TBD'}
                             </Typography>
                             <Typography 
                               variant="body1" 
                               sx={{ 
                                 fontWeight: 600, 
                                 color: 'success.main', 
                                 minWidth: 30, 
                                 width: 30,
                                 textAlign: 'center',
                                 flexShrink: 0
                               }}
                             >
                               {match.score1 || '-'}
                             </Typography>
                           </Box>
                           
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                             <Typography 
                               variant="body2" 
                               sx={{ 
                                 flex: 1, 
                                 fontSize: '0.85rem',
                                 wordBreak: 'break-word',
                                 overflowWrap: 'break-word',
                                 hyphens: 'auto',
                                 maxWidth: 'calc(100% - 40px)',
                                 minWidth: 0,
                                 overflow: 'hidden'
                               }}
                             >
                               {match.team2 ? match.team2.name : 'TBD'}
                             </Typography>
                             <Typography 
                               variant="body1" 
                               sx={{ 
                                 fontWeight: 600, 
                                 color: 'success.main', 
                                 minWidth: 30, 
                                 width: 30,
                                 textAlign: 'center',
                                 flexShrink: 0
                               }}
                             >
                               {match.score2 || '-'}
                             </Typography>
                           </Box>
                         </Box>
                       )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      
    </Container>
  );
};

export default RefereeDashboard;
