import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  SportsTennis as TennisIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { useTournament } from '../hooks/useTournament';
import { useAuth } from '../hooks/useAuth';
import { generateGroupQRCode } from '../utils/qrCodeUtils';
import AuthModal from './AuthModal';

const CourtScoreInput = ({ tournamentId, groupId, onUpdateMatch }) => {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { tournaments, loading: tournamentsLoading } = useTournament(user);
  
  // For group referees, we need to load the specific tournament regardless of ownership
  const [groupTournament, setGroupTournament] = useState(null);
  const [groupTournamentLoading, setGroupTournamentLoading] = useState(false);
  const [tournament, setTournament] = useState(null);
  const [group, setGroup] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingMatch, setUpdatingMatch] = useState(null);
  const [qrCodeDialog, setQrCodeDialog] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [tempScores, setTempScores] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

    // Load specific tournament for group referees (regardless of ownership) with real-time updates
  const loadGroupTournament = useCallback(async () => {
    if (!tournamentId || !user) return;
    
    setGroupTournamentLoading(true);
    try {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      
             // Set up real-time listener
       const unsubscribe = onSnapshot(tournamentRef, (tournamentDoc) => {
         console.log('CourtScoreInput - Real-time update received for tournament:', tournamentId);
         
         if (tournamentDoc.exists()) {
           const tournamentData = {
             id: tournamentDoc.id,
             ...tournamentDoc.data()
           };
           
           console.log('CourtScoreInput - Tournament data updated:', {
             id: tournamentData.id,
             name: tournamentData.name,
             groupMatches: Object.keys(tournamentData.groupMatches || {}),
             updatedAt: tournamentData.updatedAt
           });
           
           // Check if user has access to this tournament
           const hasAccess = tournamentData.ownerUid === user.uid || 
                            tournamentData.authorizedEmails?.some(auth => 
                              typeof auth === 'string' ? auth === user.email : auth.email === user.email
                            );
           
           if (!hasAccess) {
             console.log('CourtScoreInput - User not authorized:', user.email);
             console.log('CourtScoreInput - Tournament owner:', tournamentData.ownerEmail);
             console.log('CourtScoreInput - Authorized emails:', tournamentData.authorizedEmails);
             setError(`Bạn không có quyền truy cập vào giải đấu này. Vui lòng liên hệ với chủ sở hữu (${tournamentData.ownerEmail}) để được ủy quyền.`);
             return;
           }
           
           setGroupTournament(tournamentData);
           console.log('CourtScoreInput - Loaded group tournament:', tournamentData);
         } else {
           console.log('CourtScoreInput - Tournament does not exist:', tournamentId);
           setError(`Giải đấu với ID ${tournamentId} không tồn tại.`);
         }
         setGroupTournamentLoading(false);
       }, (error) => {
         console.error('CourtScoreInput - Error loading court tournament:', error);
         setError('Lỗi khi tải dữ liệu giải đấu. Vui lòng thử lại.');
         setGroupTournamentLoading(false);
       });
      
      // Return unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('CourtScoreInput - Error setting up tournament listener:', error);
      setError('Lỗi khi tải dữ liệu giải đấu. Vui lòng thử lại.');
      setGroupTournamentLoading(false);
    }
  }, [tournamentId, user]);

  // Find tournament and court data
  useEffect(() => {
    let unsubscribe;
    
    const setupData = async () => {
      console.log('CourtScoreInput - tournaments:', tournaments);
      console.log('CourtScoreInput - tournamentId:', tournamentId);
      console.log('CourtScoreInput - groupId:', groupId);
      console.log('CourtScoreInput - tournamentsLoading:', tournamentsLoading);
      console.log('CourtScoreInput - Current URL:', window.location.href);
      
      // First try to find tournament in user's tournaments
      if (tournaments && tournamentId) {
        console.log('CourtScoreInput - Available tournament IDs:', tournaments.map(t => t.id));
        const foundTournament = tournaments.find(t => t.id === tournamentId);
        console.log('CourtScoreInput - foundTournament:', foundTournament);
        
        if (foundTournament) {
          setTournament(foundTournament);
          console.log('CourtScoreInput - Tournament groups:', foundTournament.groups);
          
          // Find the specific group
          const foundGroup = foundTournament.groups?.find(g => g.id === groupId);
          console.log('CourtScoreInput - foundGroup:', foundGroup);
          
          if (foundGroup) {
            setGroup(foundGroup);
            
                      // Get matches for this group
          const allGroupMatches = foundTournament.groupMatches && foundTournament.groupMatches[groupId] 
            ? foundTournament.groupMatches[groupId]
            : [];
          
          console.log('CourtScoreInput - All group matches:', allGroupMatches);
          
          // Filter matches based on referee assignment
          console.log('CourtScoreInput - Starting match filtering for user:', user.email);
          console.log('CourtScoreInput - Total matches in group:', allGroupMatches.length);
            
            const userMatches = allGroupMatches.filter(match => {
              console.log('CourtScoreInput - Checking match:', {
                matchId: match.id,
                assignedReferee: match.assignedReferee,
                userEmail: user.email,
                isAssigned: match.assignedReferee === user.email
              });
              
              if (!match.assignedReferee) {
                console.log('CourtScoreInput - Match has no assigned referee, NOT showing to anyone');
                return false; // Unassigned matches are NOT visible to anyone
              }
              
              const isAssigned = match.assignedReferee === user.email;
              console.log('CourtScoreInput - Match assigned to:', match.assignedReferee, 'User:', user.email, 'Show:', isAssigned);
              return isAssigned;
            });
            
            console.log('CourtScoreInput - Final filtered matches count:', userMatches.length);
            
            console.log('CourtScoreInput - allGroupMatches:', allGroupMatches);
            console.log('CourtScoreInput - userMatches:', userMatches);
            setMatches(userMatches);
          } else {
            const availableGroupIds = foundTournament.groups?.map(g => g.id) || [];
            console.log('CourtScoreInput - Available group IDs:', availableGroupIds);
            console.log('CourtScoreInput - Missing group ID:', groupId);
            setError(`Không tìm thấy bảng đấu với ID: ${groupId}. Bảng có sẵn: ${availableGroupIds.join(', ')}. Vui lòng kiểm tra lại mã QR hoặc liên hệ với trọng tài chính.`);
          }
          setLoading(false);
        } else {
          // Tournament not found in user's tournaments, try to load it directly
          console.log('CourtScoreInput - Tournament not in user list, loading directly...');
          unsubscribe = await loadGroupTournament();
        }
      } else if (!tournamentsLoading && tournaments) {
        // If tournaments are loaded but no tournamentId provided
        console.log('CourtScoreInput - No tournamentId provided, but tournaments loaded:', tournaments.length);
        setError('Thiếu thông tin giải đấu. Vui lòng sử dụng mã QR hợp lệ.');
        setLoading(false);
      } else if (!tournamentsLoading && !tournaments) {
        // If no tournaments loaded at all
        console.log('CourtScoreInput - No tournaments loaded');
        setError('Không thể tải dữ liệu giải đấu. Vui lòng kiểm tra kết nối mạng.');
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
  }, [tournaments, tournamentId, groupId, tournamentsLoading, loadGroupTournament]);

  // Handle group tournament loading
  useEffect(() => {
    if (groupTournament && tournamentId) {
      console.log('CourtScoreInput - Processing group tournament:', groupTournament);
      
      // Find the specific group
      const foundGroup = groupTournament.groups?.find(g => g.id === groupId);
      console.log('CourtScoreInput - foundGroup from group tournament:', foundGroup);
      
      if (foundGroup) {
        setTournament(groupTournament);
        setGroup(foundGroup);
        
        // Get matches for this group
        const allGroupMatches = groupTournament.groupMatches && groupTournament.groupMatches[groupId] 
          ? groupTournament.groupMatches[groupId]
          : [];
        
        // Filter matches based on referee assignment
        console.log('CourtScoreInput - Starting match filtering from group tournament for user:', user.email);
        console.log('CourtScoreInput - Total matches in group from group tournament:', allGroupMatches.length);
        
        const userMatches = allGroupMatches.filter(match => {
          console.log('CourtScoreInput - Checking match from group tournament:', {
            matchId: match.id,
            assignedReferee: match.assignedReferee,
            userEmail: user.email,
            isAssigned: match.assignedReferee === user.email
          });
          
          if (!match.assignedReferee) {
            console.log('CourtScoreInput - Match has no assigned referee, NOT showing to anyone');
            return false; // Unassigned matches are NOT visible to anyone
          }
          
          const isAssigned = match.assignedReferee === user.email;
          console.log('CourtScoreInput - Match assigned to:', match.assignedReferee, 'User:', user.email, 'Show:', isAssigned);
          return isAssigned;
        });
        
        console.log('CourtScoreInput - Final filtered matches count from group tournament:', userMatches.length);
        
        console.log('CourtScoreInput - allGroupMatches from group tournament:', allGroupMatches);
        console.log('CourtScoreInput - userMatches from group tournament:', userMatches);
        setMatches(userMatches);
        setLoading(false);
      } else {
        const availableGroupIds = groupTournament.groups?.map(g => g.id) || [];
        console.log('CourtScoreInput - Available group IDs from group tournament:', availableGroupIds);
        setError(`Không tìm thấy bảng đấu với ID: ${groupId}. Bảng có sẵn: ${availableGroupIds.join(', ')}. Vui lòng kiểm tra lại mã QR hoặc liên hệ với trọng tài chính.`);
        setLoading(false);
      }
    }
  }, [groupTournament, tournamentId, groupId]);

  // Generate QR code for this group
  const handleGenerateQRCode = async () => {
    try {
      const qrCode = await generateGroupQRCode(tournamentId, groupId);
      setQrCodeData(qrCode);
      setQrCodeDialog(true);
    } catch (error) {
      setError('Không thể tạo mã QR');
    }
  };

  // Handle score update
  const handleScoreUpdate = async (matchId) => {
    const scores = tempScores[matchId] || {};
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
      setError('Không cho phép kết quả hòa');
      return;
    }

    setUpdatingMatch(matchId);
    setError(null);
    setSuccessMessage(''); // Clear any existing success message

    try {
      console.log('CourtScoreInput - Calling onUpdateMatch with:', {
        groupId,
        matchId,
        score1: score1Num,
        score2: score2Num,
        tournamentId
      });
      await onUpdateMatch(groupId, matchId, score1Num, score2Num, tournamentId);
      
      // Update local state
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === matchId 
            ? { ...match, score1: score1Num, score2: score2Num, completed: true }
            : match
        )
      );
      
      // Clear temp scores for this match
      setTempScores(prev => {
        const newScores = { ...prev };
        delete newScores[matchId];
        return newScores;
      });
      
      // Show success message
      setSuccessMessage('Đã lưu điểm số thành công!');
      setTimeout(() => setSuccessMessage(''), 3000); // Clear after 3 seconds
    } catch (error) {
      setError('Lỗi khi cập nhật điểm số');
    } finally {
      setUpdatingMatch(null);
    }
  };

  // Handle temp score change
  const handleTempScoreChange = (matchId, field, value) => {
    setTempScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
    
    // Clear any existing error or success messages when user starts typing
    if (error) setError(null);
    if (successMessage) setSuccessMessage('');
  };

  // Get team names
  const getTeamName = (team) => {
    if (!tournament) return '';
    
    // Handle both team ID strings and team objects
    const teamId = typeof team === 'string' ? team : team?.id;
    
    if (!teamId) return 'Đội không xác định';
    
    const pair = tournament.pairs.find(p => p.id === teamId);
    return pair ? pair.name : `Đội ${teamId}`;
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          Đang kiểm tra đăng nhập...
        </Typography>
      </Box>
    );
  }

  // Show login screen if user is not authenticated
  if (!user) {
    return (
      <Box sx={{ p: 2, maxWidth: 400, mx: 'auto', mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <TennisIcon sx={{ fontSize: 48, color: 'primary.main', mr: 2 }} />
            <Typography variant="h5" fontWeight="bold" color="primary">
              Trọng tài sân đấu
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Vui lòng đăng nhập để truy cập vào giao diện nhập điểm sân đấu
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => setAuthModalOpen(true)}
            sx={{ px: 4, py: 1.5 }}
          >
            Đăng nhập
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Chỉ trọng tài được ủy quyền mới có thể truy cập
          </Typography>
        </Paper>
        
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          title="Đăng nhập trọng tài"
        />
      </Box>
    );
  }

  if (loading || tournamentsLoading || groupTournamentLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          Đang tải dữ liệu giải đấu...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <TennisIcon sx={{ fontSize: 48, color: 'warning.main', mr: 2 }} />
            <Typography variant="h5" fontWeight="bold" color="warning.main">
              Không tìm thấy giải đấu
            </Typography>
          </Box>
          
                     <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
             {error}
           </Typography>
           
           <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'left' }}>
             <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
               Thông tin URL:
             </Typography>
             <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
               URL: {window.location.href}
             </Typography>
             <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
               Tournament ID: {tournamentId}
             </Typography>
             <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
               Group ID: {groupId}
             </Typography>
             <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
               User UID: {user?.uid}
             </Typography>
             <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
               User Email: {user?.email}
             </Typography>
           </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Vui lòng kiểm tra lại mã QR hoặc liên hệ với trọng tài chính để được hỗ trợ.
          </Typography>
          
                     {/* Show available tournaments for debugging */}
           {tournaments && tournaments.length > 0 && (
             <Box sx={{ mb: 3, textAlign: 'left' }}>
               <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                 Các giải đấu có sẵn:
               </Typography>
               {tournaments.map((tournament) => (
                 <Box key={tournament.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                   <Typography variant="body2" fontWeight="medium">
                     {tournament.name} (ID: {tournament.id})
                   </Typography>
                   {tournament.groups && tournament.groups.length > 0 && (
                     <Box>
                       <Typography variant="caption" color="text.secondary">
                         Bảng: {tournament.groups.map(g => g.name).join(', ')}
                       </Typography>
                       <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                         Group IDs: {tournament.groups.map(g => g.id).join(', ')}
                       </Typography>
                     </Box>
                   )}
                 </Box>
               ))}
             </Box>
           )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
              startIcon={<RefreshIcon />}
            >
              Tải lại trang
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={() => window.location.href = '/'}
            >
              Về trang chủ
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (!tournament || !group) {
    return (
      <Box sx={{ p: 2, maxWidth: 400, mx: 'auto', mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <TennisIcon sx={{ fontSize: 48, color: 'warning.main', mr: 2 }} />
            <Typography variant="h5" fontWeight="bold" color="warning.main">
              Không tìm thấy thông tin
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Không thể tìm thấy thông tin giải đấu hoặc bảng đấu với ID đã cung cấp.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Vui lòng kiểm tra lại mã QR hoặc liên hệ với trọng tài chính.
          </Typography>
          
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
            startIcon={<RefreshIcon />}
            sx={{ mr: 2 }}
          >
            Tải lại trang
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => window.location.href = '/'}
          >
            Về trang chủ
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
           <TennisIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
           <Box>
             <Typography variant="h5" fontWeight="bold" color="primary">
               {tournament.name}
             </Typography>
                            <Typography variant="h6" color="text.secondary">
                 {group.name}
               </Typography>
           </Box>
         </Box>
         
         <Box sx={{ mb: 2 }}>
           <Typography variant="body2" color="text.secondary">
             Trọng tài: {user?.email || user?.displayName || 'Unknown'}
           </Typography>
         </Box>
         
         <Button
           variant="outlined"
           startIcon={<QrCodeIcon />}
           onClick={handleGenerateQRCode}
           sx={{ mt: 1, mr: 1 }}
         >
           Xem mã QR bảng đấu
         </Button>
         
         <Button
           variant="outlined"
           startIcon={<RefreshIcon />}
           onClick={() => {
             console.log('Manual refresh clicked');
             console.log('Current tournament data:', tournament);
             console.log('Current matches:', matches);
             console.log('Current temp scores:', tempScores);
           }}
           sx={{ mt: 1 }}
         >
           Debug Info
         </Button>
       </Paper>

      {/* Matches */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
            Danh sách trận đấu
          </Typography>

          {matches.length === 0 ? (
            <Alert severity="info">
              Chưa có trận đấu nào được lên lịch cho bảng này
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {matches.map((match) => (
                <Box key={match.id} sx={{ 
                  p: 2, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1,
                  backgroundColor: match.completed ? '#f8f9fa' : 'transparent'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                      Trận {match.matchNumber || matches.indexOf(match) + 1}
                    </Typography>
                    {match.completed && (
                      <Chip 
                        label="Đã hoàn thành" 
                        color="success" 
                        size="small" 
                        icon={<CheckIcon />}
                      />
                    )}
                  </Box>

                  {!match.completed ? (
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
                            onClick={() => {
                              const currentValue = parseInt(tempScores[match.id]?.score1 || match.score1 || 0);
                              const newValue = Math.max(0, currentValue - 1);
                              handleTempScoreChange(match.id, 'score1', newValue.toString());
                            }}
                          >
                            -
                          </Button>
                          <TextField
                            size="small"
                            type="number"
                            value={tempScores[match.id]?.score1 ?? (match.score1 || '')}
                            onChange={(e) => handleTempScoreChange(match.id, 'score1', e.target.value)}
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
                              const currentValue = parseInt(tempScores[match.id]?.score1 || match.score1 || 0);
                              const newValue = Math.min(99, currentValue + 1);
                              handleTempScoreChange(match.id, 'score1', newValue.toString());
                            }}
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
                            onClick={() => {
                              const currentValue = parseInt(tempScores[match.id]?.score2 || match.score2 || 0);
                              const newValue = Math.max(0, currentValue - 1);
                              handleTempScoreChange(match.id, 'score2', newValue.toString());
                            }}
                          >
                            -
                          </Button>
                          <TextField
                            size="small"
                            type="number"
                            value={tempScores[match.id]?.score2 ?? (match.score2 || '')}
                            onChange={(e) => handleTempScoreChange(match.id, 'score2', e.target.value)}
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
                              const currentValue = parseInt(tempScores[match.id]?.score2 || match.score2 || 0);
                              const newValue = Math.min(99, currentValue + 1);
                              handleTempScoreChange(match.id, 'score2', newValue.toString());
                            }}
                          >
                            +
                          </Button>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={updatingMatch === match.id}
                          onClick={() => handleScoreUpdate(match.id)}
                        >
                          {updatingMatch === match.id ? <CircularProgress size={16} /> : 'Lưu điểm'}
                        </Button>
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
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog 
        open={qrCodeDialog} 
        onClose={() => setQrCodeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Mã QR {group.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {qrCodeData && (
              <img 
                src={qrCodeData} 
                alt="QR Code" 
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Quét mã QR này để truy cập nhanh vào bảng đấu
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrCodeDialog(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourtScoreInput;
