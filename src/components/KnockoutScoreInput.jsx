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
  Divider
} from '@mui/material';
import {
  SportsTennis as TennisIcon,
  Login as LoginIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useTournament } from '../hooks/useTournament';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import AuthModal from './AuthModal';

const KnockoutScoreInput = ({ tournamentId, matchId, onUpdateMatch }) => {
  const { user, signInWithGoogle } = useAuth();
  const { tournaments } = useTournament(user);
  const [tournament, setTournament] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editScores, setEditScores] = useState({ score1: '', score2: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Debug logging
  console.log('KnockoutScoreInput props:', { tournamentId, matchId });
  console.log('KnockoutScoreInput user:', user);
  console.log('KnockoutScoreInput tournaments:', tournaments);

  // Load tournament and match data with real-time updates
  const loadKnockoutMatchTournament = useCallback(async () => {
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
          console.log('KnockoutScoreInput - Real-time update received for tournament:', tournamentId);
          
          if (tournamentSnap.exists()) {
            const tournamentData = {
              id: tournamentSnap.id,
              ...tournamentSnap.data()
            };
            
            console.log('KnockoutScoreInput - Tournament data updated:', {
              id: tournamentData.id,
              name: tournamentData.name,
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

            // Find the specific match
            const foundMatch = tournamentData.bracketMatches?.find(m => m.id === matchId);
            if (!foundMatch) {
              setError('Không tìm thấy trận đấu');
              return;
            }

            // Check if match is assigned to this referee
            if (foundMatch.assignedReferee && foundMatch.assignedReferee !== user?.email) {
              setError('Trận đấu này không được phân công cho bạn');
              return;
            }

            setTournament(tournamentData);
            setMatch(foundMatch);
            
            // Set current scores for editing
            setEditScores({
              score1: foundMatch.score1?.toString() || '',
              score2: foundMatch.score2?.toString() || ''
            });
          } else {
            setError('Không tìm thấy giải đấu');
          }
          setLoading(false);
        }, (error) => {
          console.error('KnockoutScoreInput - Error loading tournament:', error);
          setError('Lỗi khi tải dữ liệu trận đấu');
          setLoading(false);
        });
        
        // Return unsubscribe function for cleanup
        return unsubscribe;
      } else {
        // Tournament found locally, set up real-time listener for updates
        const tournamentRef = doc(db, 'tournaments', tournamentId);
        
        const unsubscribe = onSnapshot(tournamentRef, (tournamentSnap) => {
          console.log('KnockoutScoreInput - Real-time update received for local tournament:', tournamentId);
          
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

            // Find the specific match
            const foundMatch = tournamentData.bracketMatches?.find(m => m.id === matchId);
            if (!foundMatch) {
              setError('Không tìm thấy trận đấu');
              return;
            }

            // Check if match is assigned to this referee
            if (foundMatch.assignedReferee && foundMatch.assignedReferee !== user?.email) {
              setError('Trận đấu này không được phân công cho bạn');
              return;
            }

            setTournament(tournamentData);
            setMatch(foundMatch);
            
            // Set current scores for editing
            setEditScores({
              score1: foundMatch.score1?.toString() || '',
              score2: foundMatch.score2?.toString() || ''
            });
          }
        }, (error) => {
          console.error('KnockoutScoreInput - Error in real-time listener:', error);
        });
        
        // Set initial data
        const hasAccess = foundTournament.ownerUid === user?.uid || 
          foundTournament.authorizedEmails?.some(auth => 
            typeof auth === 'string' ? auth === user?.email : auth.email === user?.email
          );

        if (!hasAccess) {
          throw new Error('Bạn không có quyền truy cập vào giải đấu này');
        }

        // Find the specific match
        const foundMatch = foundTournament.bracketMatches?.find(m => m.id === matchId);
        if (!foundMatch) {
          throw new Error('Không tìm thấy trận đấu');
        }

        // Check if match is assigned to this referee
        if (foundMatch.assignedReferee && foundMatch.assignedReferee !== user?.email) {
          throw new Error('Trận đấu này không được phân công cho bạn');
        }

        setTournament(foundTournament);
        setMatch(foundMatch);
        
        // Set current scores for editing
        setEditScores({
          score1: foundMatch.score1?.toString() || '',
          score2: foundMatch.score2?.toString() || ''
        });
        
        setLoading(false);
        return unsubscribe;
      }

    } catch (err) {
      console.error('Error loading knockout match tournament:', err);
      setError(err.message || 'Lỗi khi tải dữ liệu trận đấu');
      setLoading(false);
    }
  }, [tournamentId, matchId, tournaments, user]);

  useEffect(() => {
    let unsubscribe;
    
    const setupData = async () => {
      if (user) {
        unsubscribe = await loadKnockoutMatchTournament();
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
  }, [user, loadKnockoutMatchTournament]);

  // Get team name helper function
  const getTeamName = (team) => {
    if (!team) return 'TBD';
    if (typeof team === 'string') return team;
    if (typeof team === 'object' && team.name) return team.name;
    return 'TBD';
  };

  // Handle score update
  const handleUpdateScore = async () => {
    if (!tournament || !match || !user) return;

    try {
      setError(null);
      
      const score1 = parseInt(editScores.score1) || 0;
      const score2 = parseInt(editScores.score2) || 0;
      
      console.log('KnockoutScoreInput - Calling onUpdateMatch with:', {
        matchId: match.id,
        score1,
        score2,
        tournamentId
      });
      
      // Use the onUpdateMatch prop if provided, otherwise fall back to direct Firestore update
      if (onUpdateMatch) {
        await onUpdateMatch(match.id, score1, score2, null, null, tournamentId);
      } else {
        // Fallback to direct Firestore update
        const updatedBracketMatches = tournament.bracketMatches.map(m => 
          m.id === match.id 
            ? { 
                ...m, 
                score1,
                score2,
                completed: score1 > 0 && score2 > 0
              }
            : m
        );

        // Update in Firestore
        const tournamentRef = doc(db, 'tournaments', tournament.id);
        await updateDoc(tournamentRef, {
          bracketMatches: updatedBracketMatches,
          updatedAt: new Date()
        });

        // Update local state
        setTournament(prev => ({
          ...prev,
          bracketMatches: updatedBracketMatches
        }));
      }

      setMatch(prev => ({
        ...prev,
        score1,
        score2,
        completed: score1 > 0 && score2 > 0
      }));

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating score:', err);
      setError('Lỗi khi cập nhật điểm');
    }
  };

  // Handle score input change
  const handleScoreChange = (field, value) => {
    // Allow empty values, remove leading zeros for non-empty values, and limit to 2 digits
    if (value === '') {
      setEditScores(prev => ({ ...prev, [field]: '' }));
    } else {
      const cleanValue = value.replace(/^0+/, '') || '0';
      const limitedValue = cleanValue.length > 2 ? cleanValue.slice(0, 2) : cleanValue;
      setEditScores(prev => ({ ...prev, [field]: limitedValue }));
    }
  };

  // Handle score button click
  const handleScoreButtonClick = (field, increment) => {
    const currentValue = parseInt(editScores[field] || '0');
    const newValue = Math.max(0, Math.min(99, currentValue + increment));
    setEditScores(prev => ({ ...prev, [field]: newValue.toString() }));
  };

  // Handle key press for score inputs
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUpdateScore();
    }
  };

  if (!user) {
    console.log('KnockoutScoreInput: No user, showing login screen');
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TennisIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Đăng nhập để nhập điểm
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Vui lòng đăng nhập để truy cập vào trận đấu loại trực tiếp
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => {
              console.log('KnockoutScoreInput: Login button clicked');
              setAuthModalOpen(true);
            }}
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
    console.log('KnockoutScoreInput: Loading state');
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Đang tải dữ liệu trận đấu...</Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    console.log('KnockoutScoreInput: Error state:', error);
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

  if (!tournament || !match) {
    console.log('KnockoutScoreInput: No tournament or match found');
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Không tìm thấy trận đấu
          </Typography>
        </Paper>
      </Container>
    );
  }

  console.log('KnockoutScoreInput: Rendering main view with tournament:', tournament?.name, 'match:', match?.id);
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TennisIcon sx={{ fontSize: 32, color: 'secondary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" color="secondary.main">
              Trận đấu loại trực tiếp
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Vòng {match.round} - Trận {match.matchNumber}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Trọng tài: {user.email}
        </Typography>
      </Paper>

      <Card>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600, color: 'secondary.main' }}>
            Nhập điểm trận đấu
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {isEditing ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ 
                    flex: 1, 
                    fontSize: '0.85rem',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    maxWidth: 'calc(100% - 80px)',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
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
                       onClick={() => handleScoreButtonClick('score1', -1)}
                     >
                       -
                     </Button>
                     <TextField
                       size="small"
                       type="number"
                       value={editScores.score1}
                       onChange={(e) => handleScoreChange('score1', e.target.value)}
                       onKeyDown={handleKeyPress}
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
                       autoFocus
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
                       onClick={() => handleScoreButtonClick('score1', 1)}
                     >
                       +
                     </Button>
                   </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ 
                    flex: 1, 
                    fontSize: '0.85rem',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    maxWidth: 'calc(100% - 80px)',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
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
                       onClick={() => handleScoreButtonClick('score2', -1)}
                     >
                       -
                     </Button>
                     <TextField
                       size="small"
                       type="number"
                       value={editScores.score2}
                       onChange={(e) => handleScoreChange('score2', e.target.value)}
                       onKeyDown={handleKeyPress}
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
                       onClick={() => handleScoreButtonClick('score2', 1)}
                     >
                       +
                     </Button>
                   </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ 
                    flex: 1, 
                    fontSize: '0.85rem',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    maxWidth: 'calc(100% - 50px)',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
                    {getTeamName(match.team1)}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 600,
                      color: match.completed ? 'success.main' : 'text.primary',
                      minWidth: 40,
                      width: 40,
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}
                  >
                    {match.score1 || '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ 
                    flex: 1, 
                    fontSize: '0.85rem',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    maxWidth: 'calc(100% - 50px)',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
                    {getTeamName(match.team2)}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 600,
                      color: match.completed ? 'success.main' : 'text.primary',
                      minWidth: 40,
                      width: 40,
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}
                  >
                    {match.score2 || '-'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  onClick={handleUpdateScore}
                  disabled={!editScores.score1 && !editScores.score2}
                >
                  Lưu điểm
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsEditing(false);
                    setEditScores({
                      score1: match.score1?.toString() || '',
                      score2: match.score2?.toString() || ''
                    });
                  }}
                >
                  Hủy
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={() => setIsEditing(true)}
              >
                Sửa điểm
              </Button>
            )}
          </Box>

          {/* Match status */}
          {match.completed && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Chip 
                label="Đã hoàn thành" 
                color="success" 
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default KnockoutScoreInput;
