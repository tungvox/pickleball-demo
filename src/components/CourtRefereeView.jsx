import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Undo as UndoIcon,
  Menu as MenuIcon,
  SwapVert as SwapVertIcon,
  SwapHoriz as SwapHorizIcon,
  Person as PersonIcon,
  SportsTennis as TennisIcon,
  Close as CloseIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const CourtRefereeView = ({ 
  match, 
  tournament, 
  onBack, 
  onUpdateMatch, 
  matchType = 'group', // 'group' or 'knockout'
  groupId = null 
}) => {
  const [score, setScore] = useState({ score1: 0, score2: 0 }); // Single score state for the match
  const [server, setServer] = useState(2); // Server number (1 or 2)
  const [currentSet, setCurrentSet] = useState(1);
  const [matchStatus, setMatchStatus] = useState('not_started'); // 'not_started', 'in_progress', 'completed'
  const [showSpecialDialog, setShowSpecialDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [tempScore, setTempScore] = useState({ score1: '', score2: '' });
  const [team1PlayerOrder, setTeam1PlayerOrder] = useState([0, 1]); // [serverIndex, nonServerIndex] - initially upper player (index 0) is first, lower player (index 1) is second
  const [team2PlayerOrder, setTeam2PlayerOrder] = useState([0, 1]); // [serverIndex, nonServerIndex] - initially upper player (index 0) is first, lower player (index 1) is second
  const [teamsSwitched, setTeamsSwitched] = useState(false); // false = team1 left, team2 right; true = team2 left, team1 right
  const [servingTeam, setServingTeam] = useState('left'); // 'left' or 'right' - which team is currently serving
  const [firstSideOutHappened, setFirstSideOutHappened] = useState(false); // Track if first side-out has occurred
  const [servingPlayerId, setServingPlayerId] = useState(1); // Track which player is serving (0 = first player, 1 = second player)

  // Initialize scores from match data
  useEffect(() => {
    if (match) {
      setScore({
        score1: match.score1 || 0,
        score2: match.score2 || 0
      });
      setServer(match.currentServer || 2);
      setCurrentSet(match.currentSet || 1);
      setMatchStatus(match.completed ? 'completed' : (match.score1 || match.score2 ? 'in_progress' : 'not_started'));
    }
  }, [match]);

  // Get team names
  const getTeamName = (team) => {
    if (!tournament) return '';
    
    const teamId = typeof team === 'string' ? team : team?.id;
    if (!teamId) return 'Đội không xác định';
    
    const pair = tournament.pairs.find(p => p.id === teamId);
    return pair ? pair.name : `Đội ${teamId}`;
  };

  // Get player names from team name
  const getPlayerNames = (teamName) => {
    if (!teamName) return ['', ''];
    const names = teamName.split(' - ');
    return names.length >= 2 ? names : [teamName, ''];
  };

  const handleScoreUpdate = async () => {
    if (!tempScore.score1 || !tempScore.score2) {
      return;
    }

    const score1Num = parseInt(tempScore.score1);
    const score2Num = parseInt(tempScore.score2);

    if (isNaN(score1Num) || isNaN(score2Num)) {
      return;
    }

    if (score1Num === score2Num) {
      alert('Không cho phép kết quả hòa');
      return;
    }

    try {
      if (matchType === 'group') {
        await onUpdateMatch(groupId, match.id, score1Num, score2Num);
      } else {
        await onUpdateMatch(match.id, score1Num, score2Num);
      }
      setShowScoreDialog(false);
      setTempScore({ score1: '', score2: '' });
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const handleStartMatch = () => {
    setMatchStatus('in_progress');
    // Force initial state for first serve
    setServer(2); // First serve is always Server #2
    setFirstSideOutHappened(false); // Reset first side-out flag
    setScore({ score1: 0, score2: 0 }); // Reset scores to 0-0
    // Ensure serving team starts correctly (left team serves first by default)
    setServingTeam('left');
    // Set initial serving player (Server #2 is the second player in the team)
    setServingPlayerId(1);
  };

  const handleUndo = () => {
    // Implement undo functionality
    console.log('Undo action');
  };

  const handleSpecialSituation = () => {
    setShowSpecialDialog(true);
  };

  const handleSwitchSides = () => {
    setTeamsSwitched(!teamsSwitched);
  };

  const handlePlayerSwitch = (teamSide) => {
    // Determine which team is actually on this side based on teamsSwitched
    if (teamSide === 'left') {
      // Left side: if teamsSwitched, this is team2, otherwise team1
      if (teamsSwitched) {
        setTeam2PlayerOrder(prev => [prev[1], prev[0]]);
      } else {
        setTeam1PlayerOrder(prev => [prev[1], prev[0]]);
      }
    } else {
      // Right side: if teamsSwitched, this is team1, otherwise team2
      if (teamsSwitched) {
        setTeam1PlayerOrder(prev => [prev[1], prev[0]]);
      } else {
        setTeam2PlayerOrder(prev => [prev[1], prev[0]]);
      }
    }
  };

  // Handle scoring - when serving team scores
  const handleScore = (scoringTeam) => {
    // Only the serving team can score
    if (scoringTeam === servingTeam) {
      if (scoringTeam === 'left') {
        setScore(prev => ({ ...prev, score1: prev.score1 + 1 }));
      } else {
        setScore(prev => ({ ...prev, score2: prev.score2 + 1 }));
      }
      // Server switches court sides (right ↔ left) but stays the same server number
      // This is handled by the player order switching
      // Determine which team is actually on this side based on teamsSwitched
      if (scoringTeam === 'left') {
        // Left side: if teamsSwitched, this is team2, otherwise team1
        if (teamsSwitched) {
          setTeam2PlayerOrder(prev => [prev[1], prev[0]]);
        } else {
          setTeam1PlayerOrder(prev => [prev[1], prev[0]]);
        }
      } else {
        // Right side: if teamsSwitched, this is team1, otherwise team2
        if (teamsSwitched) {
          setTeam1PlayerOrder(prev => [prev[1], prev[0]]);
        } else {
          setTeam2PlayerOrder(prev => [prev[1], prev[0]]);
        }
      }
    }
  };

  // Handle side-out (when serving team loses a rally)
  const handleSideOut = () => {
    if (isFirstServeOfMatch() && server === 2) {
      // Special case: first serve (Server #2) loses → other team serves
      const newServingTeam = servingTeam === 'left' ? 'right' : 'left';
      setServingTeam(newServingTeam);
      setServer(1);
      setFirstSideOutHappened(true);
      // Server #1 starts serving (first player in the team)
      setServingPlayerId(0);
    } else if (server === 1) {
      // Server 1 loses → switch to partner (Server 2)
      setServer(2);
      // Switch to the other player in the team
      setServingPlayerId(servingPlayerId === 0 ? 1 : 0);
    } else {
      // Server 2 lost → side-out to other team
      const newServingTeam = servingTeam === 'left' ? 'right' : 'left';
      setServingTeam(newServingTeam);
      setServer(1);
      // Server #1 starts serving (first player in the team)
      setServingPlayerId(0);
    }
  };



  // Check if this is the first serve of the entire match
  const isFirstServeOfMatch = () => {
    // First serve means: no side-out has happened yet AND score is 0-0
    return !firstSideOutHappened && score.score1 === 0 && score.score2 === 0;
  };

  // Check if this is the first serving round for the current team
  const isFirstServingRoundForCurrentTeam = () => {
    // First serving round means: first team serving OR right team serving after first side-out
    return isFirstTeamServing() || (servingTeam === 'right' && firstSideOutHappened);
  };

  // Handle change server (switch to other player in same team)
  const handleChangeServer = () => {
    // Switch to server 2 (other player in same team)
    setServer(2);
    // Switch to the other player in the team
    setServingPlayerId(servingPlayerId === 0 ? 1 : 0);
  };

  const getMatchId = () => {
    return `${tournament?.id?.substring(0, 6) || 'XXXXXX'} • ${match?.matchNumber || 'XX'}`;
  };

  // Get server indicator based on court positioning
  const getServerIndicator = (playerPosition, teamSide) => {
    // Only show server indicator if this team is serving
    if (teamSide !== servingTeam) {
      return null;
    }
    
    let isServer = false;
    
    if (matchStatus === 'not_started') {
      // Before match starts: server is always the player in the right box (facing the net)
      if (teamSide === 'left') {
        // Left team: right box is lower position
        isServer = playerPosition === 'lower';
      } else {
        // Right team: right box is upper position
        isServer = playerPosition === 'upper';
      }
    } else {
      // Match started: server position is determined by serving team's score parity
      const servingTeamScore = servingTeam === 'left' ? score.score1 : score.score2;
      const isEvenScore = servingTeamScore % 2 === 0;
      
      if (isEvenScore) {
        // Even score: server stands in right box
        if (teamSide === 'left') {
          isServer = playerPosition === 'lower'; // Left team: right box is lower
        } else {
          isServer = playerPosition === 'upper'; // Right team: right box is upper
        }
      } else {
        // Odd score: server stands in left box
        if (teamSide === 'left') {
          isServer = playerPosition === 'upper'; // Left team: left box is upper
        } else {
          isServer = playerPosition === 'lower'; // Right team: left box is lower
        }
      }
      
      // Check if this is the correct player in that position
      if (teamSide === 'left') {
        const leftTeamOrder = teamsSwitched ? team2PlayerOrder : team1PlayerOrder;
        const servingPlayerInPosition = leftTeamOrder[servingPlayerId];
        if (playerPosition === 'upper' && servingPlayerInPosition === 0) {
          isServer = isServer; // Keep server status if this is the serving player
        } else if (playerPosition === 'lower' && servingPlayerInPosition === 1) {
          isServer = isServer; // Keep server status if this is the serving player
        } else {
          isServer = false; // Not the serving player
        }
      } else {
        const rightTeamOrder = teamsSwitched ? team1PlayerOrder : team2PlayerOrder;
        const servingPlayerInPosition = rightTeamOrder[servingPlayerId];
        if (playerPosition === 'upper' && servingPlayerInPosition === 0) {
          isServer = isServer; // Keep server status if this is the serving player
        } else if (playerPosition === 'lower' && servingPlayerInPosition === 1) {
          isServer = isServer; // Keep server status if this is the serving player
        } else {
          isServer = false; // Not the serving player
        }
      }
    }
    
    return isServer ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <TennisIcon sx={{ fontSize: 12, color: 'primary.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.6rem' }}>
          S
        </Typography>
      </Box>
    ) : null;
  };

  const team1Name = getTeamName(match?.team1);
  const team2Name = getTeamName(match?.team2);
  const team1Players = getPlayerNames(team1Name);
  const team2Players = getPlayerNames(team2Name);

  // Determine which team is on which side
  const leftTeam = teamsSwitched ? team2Players : team1Players;
  const rightTeam = teamsSwitched ? team1Players : team2Players;
  const leftTeamOrder = teamsSwitched ? team2PlayerOrder : team1PlayerOrder;
  const rightTeamOrder = teamsSwitched ? team1PlayerOrder : team2PlayerOrder;

  return (
    <Container maxWidth="sm" sx={{ p: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 1.5, borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ borderRadius: 1, fontSize: '0.8rem', py: 0.5 }}
          >
            Quay lại
          </Button>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
            {getMatchId()}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MenuIcon />}
            onClick={handleSpecialSituation}
            sx={{ borderRadius: 1, fontSize: '0.8rem', py: 0.5 }}
          >
            Tình huống đặc biệt
          </Button>
        </Box>
      </Paper>

      {/* Main Content - 3 Column Grid */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 1, gap: 1 }}>
        {/* Top Score Line */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
            {servingTeam === 'left' ? `${score.score1} - ${score.score2}` : `${score.score2} - ${score.score1}`} - {server}
          </Typography>
        </Box>

        {/* 3-Column Layout */}
        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
          {/* Left Column - Team 1 */}
          <Box sx={{ 
            flex: 1, 
            backgroundColor: 'success.50', 
            borderRadius: 1, 
            p: 1,
            border: '1px solid',
            borderColor: 'success.main',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Team 1 Players */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
              {/* Player 1 (Upper) */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                p: 0.5,
                backgroundColor: 'background.paper',
                borderRadius: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                minHeight: 40,
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flex: 1, 
                    fontWeight: 500, 
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    maxWidth: '60px'
                  }}
                  title={leftTeam[leftTeamOrder[0]]}
                >
                  {leftTeam[leftTeamOrder[0]]}
                </Typography>
                {getServerIndicator('upper', 'left')}
              </Box>

                             {/* Player Switch Arrow */}
               {matchStatus === 'not_started' && (
                 <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                   <IconButton
                     size="small"
                     onClick={() => handlePlayerSwitch('left')}
                     sx={{ color: 'text.secondary', p: 0.5 }}
                   >
                     <SwapVertIcon sx={{ fontSize: 16 }} />
                   </IconButton>
                 </Box>
               )}

              {/* Player 2 (Lower) */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                p: 0.5,
                backgroundColor: 'background.paper',
                borderRadius: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                minHeight: 40,
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flex: 1, 
                    fontWeight: 500, 
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    maxWidth: '60px'
                  }}
                  title={leftTeam[leftTeamOrder[1]]}
                >
                  {leftTeam[leftTeamOrder[1]]}
                </Typography>
                {getServerIndicator('lower', 'left')}
              </Box>
            </Box>

            {/* Team 1 Score Button */}
            {matchStatus === 'in_progress' && (
              <Button
                variant="contained"
                size="small"
                fullWidth
                sx={{ 
                  backgroundColor: 'success.main',
                  '&:hover': { backgroundColor: 'success.dark' },
                  fontSize: '0.7rem',
                  py: 0.5,
                  mt: 1
                }}
                                 onClick={() => handleScore('left')}
              >
                + Đội bên trái
              </Button>
            )}
          </Box>

          {/* Middle Column - Score & Controls */}
          <Box sx={{ 
            flex: 1, 
            backgroundColor: 'background.paper', 
            borderRadius: 1, 
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1
          }}>
            {matchStatus === 'not_started' ? (
              <>
                <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.7rem' }}>
                  Trọng tài xác nhận vị trí đứng và người giao bóng
                </Typography>
                                 <Button
                   variant="outlined"
                   size="small"
                   startIcon={<SwapHorizIcon />}
                   onClick={handleSwitchSides}
                   sx={{ fontSize: '0.7rem' }}
                 >
                   Đổi bên
                 </Button>
              </>
            ) : (
              <>
                {/* Current Game Score */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {score.score1} : {score.score2}
                  </Typography>
                </Box>
                
                                 {/* Server Buttons */}
                 {server === 1 ? (
                   // Server 1 lost - show Change Server button
                   <Button
                     variant="contained"
                     size="small"
                     sx={{ 
                       backgroundColor: 'warning.main',
                       '&:hover': { backgroundColor: 'warning.dark' },
                       fontSize: '0.7rem',
                       py: 0.5
                     }}
                     onClick={handleChangeServer}
                   >
                     Change Server
                   </Button>
                 ) : (
                   // Server 2 lost - show Side-out button
                   <Button
                     variant="contained"
                     size="small"
                     sx={{ 
                       backgroundColor: 'error.main',
                       '&:hover': { backgroundColor: 'error.dark' },
                       fontSize: '0.7rem',
                       py: 0.5
                     }}
                     onClick={handleSideOut}
                   >
                     Side-out
                   </Button>
                 )}
              </>
            )}
          </Box>

          {/* Right Column - Team 2 */}
          <Box sx={{ 
            flex: 1, 
            backgroundColor: 'info.50', 
            borderRadius: 1, 
            p: 1,
            border: '1px solid',
            borderColor: 'info.main',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Team 2 Players */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
              {/* Player 1 (Upper) */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                p: 0.5,
                backgroundColor: 'background.paper',
                borderRadius: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                minHeight: 40,
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flex: 1, 
                    fontWeight: 500, 
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    maxWidth: '60px'
                  }}
                  title={rightTeam[rightTeamOrder[0]]}
                >
                  {rightTeam[rightTeamOrder[0]]}
                </Typography>
                {getServerIndicator('upper', 'right')}
              </Box>

                             {/* Player Switch Arrow */}
               {matchStatus === 'not_started' && (
                 <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                   <IconButton
                     size="small"
                     onClick={() => handlePlayerSwitch('right')}
                     sx={{ color: 'text.secondary', p: 0.5 }}
                   >
                     <SwapVertIcon sx={{ fontSize: 16 }} />
                   </IconButton>
                 </Box>
               )}

              {/* Player 2 (Lower) */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                p: 0.5,
                backgroundColor: 'background.paper',
                borderRadius: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                minHeight: 40,
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flex: 1, 
                    fontWeight: 500, 
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    maxWidth: '60px'
                  }}
                  title={rightTeam[rightTeamOrder[1]]}
                >
                  {rightTeam[rightTeamOrder[1]]}
                </Typography>
                {getServerIndicator('lower', 'right')}
              </Box>
            </Box>

            {/* Team 2 Score Button */}
            {matchStatus === 'in_progress' && (
              <Button
                variant="contained"
                size="small"
                fullWidth
                sx={{ 
                  backgroundColor: 'info.main',
                  '&:hover': { backgroundColor: 'info.dark' },
                  fontSize: '0.7rem',
                  py: 0.5,
                  mt: 1
                }}
                                 onClick={() => handleScore('right')}
              >
                + Đội bên phải
              </Button>
            )}
          </Box>
        </Box>

        {/* Footer */}
        {matchStatus === 'not_started' && (
          <Box sx={{ mt: 1 }}>
            <Button
              variant="contained"
              size="medium"
              fullWidth
              onClick={handleStartMatch}
              sx={{ 
                backgroundColor: 'success.main',
                '&:hover': { backgroundColor: 'success.dark' },
                fontSize: '0.8rem',
                py: 1
              }}
            >
              Bắt đầu trận đấu ngay →
            </Button>
          </Box>
        )}
        
        {matchStatus === 'in_progress' && (
          <Box sx={{ mt: 1 }}>
            <Button
              variant="contained"
              size="medium"
              fullWidth
              onClick={() => setMatchStatus('completed')}
              sx={{ 
                backgroundColor: 'error.main',
                '&:hover': { backgroundColor: 'error.dark' },
                fontSize: '0.8rem',
                py: 1
              }}
            >
              Kết thúc trận đấu
            </Button>
          </Box>
        )}
      </Box>

      {/* Special Situation Dialog */}
      <Dialog open={showSpecialDialog} onClose={() => setShowSpecialDialog(false)}>
        <DialogTitle>Tình huống đặc biệt</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Chọn tình huống đặc biệt cần xử lý:
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button variant="outlined" fullWidth>Thời gian chờ</Button>
            <Button variant="outlined" fullWidth>Chấn thương</Button>
            <Button variant="outlined" fullWidth>Thiết bị hỏng</Button>
            <Button variant="outlined" fullWidth>Thời tiết</Button>
            <Button variant="outlined" fullWidth>Khác</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSpecialDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Score Update Dialog */}
      <Dialog open={showScoreDialog} onClose={() => setShowScoreDialog(false)}>
        <DialogTitle>Cập nhật điểm số</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>{team1Name}</Typography>
              <TextField
                fullWidth
                type="number"
                value={tempScore.score1}
                onChange={(e) => setTempScore(prev => ({ ...prev, score1: e.target.value }))}
                placeholder="0"
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>{team2Name}</Typography>
              <TextField
                fullWidth
                type="number"
                value={tempScore.score2}
                onChange={(e) => setTempScore(prev => ({ ...prev, score2: e.target.value }))}
                placeholder="0"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScoreDialog(false)}>Hủy</Button>
          <Button onClick={handleScoreUpdate} variant="contained">Cập nhật</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourtRefereeView;
