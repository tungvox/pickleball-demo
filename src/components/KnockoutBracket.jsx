import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  Collapse,
  IconButton,
  Grid,
  Paper,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, Edit, Check, Close, Clear, EmojiEvents } from '@mui/icons-material';

const KnockoutBracket = ({ bracketMatches, onUpdateMatch, onBatchUpdateMatches, isLoggedIn }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editScores, setEditScores] = useState({ score1: '', score2: '' });
  const [editSetScores, setEditSetScores] = useState({});
  const [editingSetsPerMatch, setEditingSetsPerMatch] = useState({});
  const [editingRoundSetsPerMatch, setEditingRoundSetsPerMatch] = useState({});

  const handleEditScores = (match) => {
    setEditingMatch(match.id);
    setEditScores({ score1: match.score1 || '', score2: match.score2 || '' });
    
    // Initialize set scores for multiple sets
    const setsPerMatch = match.setsPerMatch || 1;
    const setScores = {};
    for (let i = 1; i <= setsPerMatch; i++) {
      setScores[`set${i}_team1`] = match[`set${i}_team1`] || '';
      setScores[`set${i}_team2`] = match[`set${i}_team2`] || '';
    }
    setEditSetScores(setScores);
  };

  const handleSaveScores = async (matchId) => {
    if (!isLoggedIn) return;
    
    const match = bracketMatches.find(m => m.id === matchId);
    const setsPerMatch = match?.setsPerMatch || 1;
    
    if (setsPerMatch === 1) {
      // Single set logic (original)
      const { score1, score2 } = editScores;
      
      // Allow empty scores for clearing
      if (score1 === '' || score2 === '') {
        await onUpdateMatch(matchId, score1, score2);
        setEditingMatch(null);
        setEditScores({ score1: '', score2: '' });
        return;
      }
      
      // Validate scores
      const score1Num = parseInt(score1);
      const score2Num = parseInt(score2);
      
      if (isNaN(score1Num) || isNaN(score2Num)) return;
      if (score1Num < 0 || score2Num < 0) return;
      if (score1Num === score2Num) {
        alert('Không cho phép kết quả hòa');
        return;
      }
      
      await onUpdateMatch(matchId, score1, score2);
      setEditingMatch(null);
      setEditScores({ score1: '', score2: '' });
    } else {
      // Multiple sets logic
      let team1Wins = 0;
      let team2Wins = 0;
      let allSetsCompleted = true;
      
      // Validate all sets
      for (let i = 1; i <= setsPerMatch; i++) {
        const set1Score = editSetScores[`set${i}_team1`];
        const set2Score = editSetScores[`set${i}_team2`];
        
        if (set1Score === '' || set2Score === '') {
          allSetsCompleted = false;
          continue;
        }
        
        const score1Num = parseInt(set1Score);
        const score2Num = parseInt(set2Score);
        
        if (isNaN(score1Num) || isNaN(score2Num) || score1Num < 0 || score2Num < 0) {
          alert(`Set ${i}: Điểm không hợp lệ`);
          return;
        }
        
        if (score1Num === score2Num) {
          alert(`Set ${i}: Không cho phép kết quả hòa`);
          return;
        }
        
        if (score1Num > score2Num) {
          team1Wins++;
        } else {
          team2Wins++;
        }
      }
      
      if (!allSetsCompleted) {
        alert('Vui lòng nhập đầy đủ điểm cho tất cả các set');
        return;
      }
      
      // Determine winner
      const finalScore1 = team1Wins;
      const finalScore2 = team2Wins;
      
      if (finalScore1 === finalScore2) {
        alert('Không cho phép kết quả hòa');
        return;
      }
      
      // Update match with set scores and final score
      const updateData = {
        ...editSetScores,
        score1: finalScore1.toString(),
        score2: finalScore2.toString()
      };
      
      await onUpdateMatch(matchId, finalScore1.toString(), finalScore2.toString(), updateData);
      setEditingMatch(null);
      setEditScores({ score1: '', score2: '' });
      setEditSetScores({});
    }
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
    setEditScores({ score1: '', score2: '' });
    setEditSetScores({});
  };

  const handleClearScores = async (matchId) => {
    if (!isLoggedIn) return;
      await onUpdateMatch(matchId, '', '');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveScores(editingMatch);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const getMatchStatus = (match) => {
    if (match.completed) return { label: 'Hoàn thành', color: 'success' };
    return { label: 'Chưa đấu', color: 'default' };
  };

  const getRoundName = (round) => {
    const totalRounds = Math.max(...Object.keys(bracketMatches.reduce((acc, match) => {
      acc[match.round] = true;
    return acc;
    }, {})).map(Number));

    if (round === totalRounds) return 'Chung kết';
    if (round === totalRounds - 1) return 'Bán kết';
    if (round === totalRounds - 2) return 'Tứ kết';
    return `Vòng ${round}`;
  };

  const getDefaultSetsPerMatch = (round) => {
    const totalRounds = Math.max(...Object.keys(bracketMatches.reduce((acc, match) => {
      acc[match.round] = true;
      return acc;
    }, {})).map(Number));
    
    if (round === totalRounds) return 3; // Finals: 3 sets
    return 1; // Other rounds: 1 set
  };

  const getRoundSetsPerMatch = (round) => {
    const roundMatches = bracketMatches.filter(match => match.round === round);
    if (roundMatches.length === 0) return getDefaultSetsPerMatch(round);
    const result = roundMatches[0].setsPerMatch || getDefaultSetsPerMatch(round);
    return result;
  };

  // Group matches by round
  const matchesByRound = bracketMatches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {});

  if (bracketMatches.length === 0) {
  return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Vòng loại trực tiếp
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Chưa có trận đấu nào trong vòng loại trực tiếp.
              </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Vòng loại trực tiếp
          </Typography>
          <Button
            variant="text"
              onClick={() => setExpanded(!expanded)}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            {expanded ? <ExpandMore /> : <ExpandMore />}
          </Button>
        </Box>
        
        <Collapse in={expanded}>
          {Object.keys(matchesByRound).length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Chưa có trận đấu nào trong vòng loại trực tiếp.
              </Typography>
            ) : (
              Object.entries(matchesByRound).map(([round, matches]) => (
              <Box key={round} sx={{ mb: 2 }}>
                  {/* Round Header */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                  mb: 1.5,
                  p: 1.5,
                    backgroundColor: 'grey.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {getRoundName(parseInt(round))} ({matches.length} trận)
                    </Typography>
                    
                  {/* Set per match inputs - HIDDEN
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {editingSetsPerMatch[round] ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                      <TextField
                              size="small"
                              type="number"
                          value={editingSetsPerMatch[round]}
                          onChange={(e) => setEditingSetsPerMatch(prev => ({ 
                                  ...prev, 
                            [round]: e.target.value 
                          }))}
                          sx={{ width: 60, '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
                            inputProps={{ min: 1, max: 5 }}
                            autoFocus
                          />
                        <Button
                              size="small"
                          variant="contained"
                              onClick={() => {
                            // Handle save sets per match
                            setEditingSetsPerMatch(prev => {
                              const newState = { ...prev };
                              delete newState[round];
                              return newState;
                            });
                          }}
                          sx={{ fontSize: '0.7rem', px: 1, py: 0.5 }}
                        >
                          Lưu
                        </Button>
                        <Button
                            size="small"
                          variant="outlined"
                            onClick={() => {
                            setEditingSetsPerMatch(prev => {
                              const newState = { ...prev };
                              delete newState[round];
                              return newState;
                            });
                          }}
                          sx={{ fontSize: '0.7rem', px: 1, py: 0.5 }}
                        >
                          Hủy
                        </Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {getRoundSetsPerMatch(parseInt(round))}
                            </Typography>
                          {isLoggedIn && (
                          <Button
                              size="small"
                              onClick={() => {
                              setEditingSetsPerMatch(prev => ({ 
                                ...prev, 
                                [round]: getRoundSetsPerMatch(parseInt(round)).toString() 
                              }));
                            }}
                            sx={{ 
                              minWidth: 'auto', 
                              p: 0.5,
                              fontSize: '0.7rem'
                            }}
                            >
                              <Edit fontSize="small" />
                          </Button>
                          )}
                        </Box>
                      )}
                    </Box>
                  */}
                  </Box>
                  
                  {/* Matches Grid */}
                <Grid container spacing={1.5}>
                    {matches.map((match) => {
                      const isFinalRound = parseInt(round) === Math.max(...Object.keys(matchesByRound).map(Number));
                      return (
                        <Grid item xs={12} sm={isFinalRound ? 12 : 6} md={isFinalRound ? 6 : 3} key={match.id}>
                                                      <Box 
                            sx={{ 
                            p: 1, 
                            border: '1px solid', 
                            borderColor: match.completed ? 'success.main' : 'divider', 
                            borderRadius: 1,
                            backgroundColor: match.completed ? 'success.50' : 'background.paper',
                            transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                variant="caption" 
                                color="text.secondary"
                                  sx={{ 
                                  fontWeight: 500,
                                  fontSize: '0.7rem'
                                  }}
                                >
                                  {isFinalRound ? '🏆 CHUNG KẾT' : `Trận ${match.matchNumber}`}
                                </Typography>
                                <Chip 
                                  label={getMatchStatus(match).label} 
                                  color={getMatchStatus(match).color} 
                                size="small"
                                  sx={{ 
                                  fontWeight: 600,
                                  fontSize: '0.65rem',
                                  height: 18
                                  }}
                                />
                                {/* Removed winner chip as requested */}
                              </Box>
                              {isLoggedIn && !editingMatch && match.team1 && match.team2 && (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => handleEditScores(match)}
                                    sx={{ 
                                      minWidth: 'auto', 
                                      p: 0.5,
                                      fontSize: '0.7rem',
                                      color: 'primary.main'
                                    }}
                                  >
                                    Sửa
                                  </Button>
                                  {match.completed && (
                                    <Button
                                      size="small"
                                      variant="text"
                                      onClick={() => handleClearScores(match.id)}
                                      color="warning"
                                      sx={{ 
                                        minWidth: 'auto', 
                                        p: 0.5,
                                        fontSize: '0.7rem'
                                      }}
                                    >
                                      Xóa
                                    </Button>
                                  )}
                                </Box>
                              )}
                            </Box>
                            
                            {match.isBye ? (
                            <Box sx={{ 
                              textAlign: 'center', 
                              py: 2,
                              backgroundColor: 'action.hover',
                              borderRadius: 1,
                              border: '2px dashed',
                              borderColor: 'divider'
                            }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                BYE - Đội được vào thẳng vòng sau
                              </Typography>
                            </Box>
                            ) : (
                              <>
                                {editingMatch === match.id ? (
                                  <>
                                    {(match.setsPerMatch === 1 || !match.setsPerMatch) ? (
                                    // Single set input (consistent with group matches)
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                                            {match.team1?.teamName || 'Chờ đấu'}
                                          </Typography>
                                          
                                          <TextField
                                            size="small"
                                            type="number"
                                            value={editScores.score1}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              // Allow empty values, remove leading zeros for non-empty values, and limit to 2 digits
                                              if (value === '') {
                                                setEditScores(prev => ({ ...prev, score1: '' }));
                                              } else {
                                                const cleanValue = value.replace(/^0+/, '') || '0';
                                                const limitedValue = cleanValue.length > 2 ? cleanValue.slice(0, 2) : cleanValue;
                                                setEditScores(prev => ({ ...prev, score1: limitedValue }));
                                              }
                                            }}
                                            onKeyDown={handleKeyPress}
                                            onBlur={(e) => {
                                              // Only save if both scores are filled or if we're leaving the editing area completely
                                              const relatedTarget = e.relatedTarget;
                                              const isMovingToOtherScoreInput = relatedTarget && 
                                                (relatedTarget.name === 'score2' || relatedTarget.getAttribute('data-score-input') === 'score2');
                                              
                                              if (!isMovingToOtherScoreInput) {
                                                handleSaveScores(match.id);
                                              }
                                            }}
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
                                          {match.team2?.teamName || 'Chờ đấu'}
                                        </Typography>
                                          
                                          <TextField
                                            size="small"
                                            type="number"
                                            value={editScores.score2}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              // Allow empty values, remove leading zeros for non-empty values, and limit to 2 digits
                                              if (value === '') {
                                                setEditScores(prev => ({ ...prev, score2: '' }));
                                              } else {
                                                const cleanValue = value.replace(/^0+/, '') || '0';
                                                const limitedValue = cleanValue.length > 2 ? cleanValue.slice(0, 2) : cleanValue;
                                                setEditScores(prev => ({ ...prev, score2: limitedValue }));
                                              }
                                            }}
                                            onKeyDown={handleKeyPress}
                                            onBlur={(e) => {
                                              // Only save if both scores are filled or if we're leaving the editing area completely
                                              const relatedTarget = e.relatedTarget;
                                              const isMovingToOtherScoreInput = relatedTarget && 
                                                (relatedTarget.name === 'score1' || relatedTarget.getAttribute('data-score-input') === 'score1');
                                              
                                              if (!isMovingToOtherScoreInput) {
                                                handleSaveScores(match.id);
                                              }
                                            }}
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
                                      </Box>
                                    </Box>
                                    ) : (
                                      // Multiple sets input
                                      <>
                                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontSize: '0.7rem' }}>
                                          Nhập điểm từng set:
                                        </Typography>
                                        {Array.from({ length: match.setsPerMatch }, (_, i) => i + 1).map((setNum) => (
                                          <Box key={setNum} sx={{ mb: 1 }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                                              Set {setNum}:
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ flexGrow: 1, fontSize: '0.8rem' }}>
                                                {match.team1?.teamName || 'Chờ đấu'}
                                              </Typography>
                                              <TextField
                                                size="small"
                                                type="number"
                                                value={editSetScores[`set${setNum}_team1`] || ''}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  // Allow empty values, remove leading zeros for non-empty values, and limit to 2 digits
                                                  if (value === '') {
                                                    setEditSetScores(prev => ({ 
                                                      ...prev, 
                                                      [`set${setNum}_team1`]: '' 
                                                    }));
                                                  } else {
                                                    const cleanValue = value.replace(/^0+/, '') || '0';
                                                    const limitedValue = cleanValue.length > 2 ? cleanValue.slice(0, 2) : cleanValue;
                                                    setEditSetScores(prev => ({ 
                                                      ...prev, 
                                                      [`set${setNum}_team1`]: limitedValue 
                                                    }));
                                                  }
                                                }}
                                                onKeyDown={handleKeyPress}
                                                onBlur={(e) => {
                                                  // Only save if we're leaving the editing area completely
                                                  const relatedTarget = e.relatedTarget;
                                                  const isMovingToOtherSetInput = relatedTarget && 
                                                    (relatedTarget.name === `set${setNum}_team2` || 
                                                     relatedTarget.getAttribute('data-score-input') === `set${setNum}_team2`);
                                                  
                                                  if (!isMovingToOtherSetInput) {
                                                    handleSaveScores(match.id);
                                                  }
                                                }}
                                              sx={{ width: 50, '& .MuiOutlinedInput-root': { fontSize: '0.8rem', height: 28 } }}
                                                inputProps={{ 
                                                  min: 0, 
                                                  max: 99, 
                                                  size: 2,
                                                  name: `set${setNum}_team1`,
                                                  'data-score-input': `set${setNum}_team1`
                                                }}
                                                placeholder="0"
                                              />
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ flexGrow: 1, fontSize: '0.8rem' }}>
                                                {match.team2?.teamName || 'Chờ đấu'}
                                              </Typography>
                                              <TextField
                                                size="small"
                                                type="number"
                                                value={editSetScores[`set${setNum}_team2`] || ''}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  // Allow empty values, remove leading zeros for non-empty values, and limit to 2 digits
                                                  if (value === '') {
                                                    setEditSetScores(prev => ({ 
                                                      ...prev, 
                                                      [`set${setNum}_team2`]: '' 
                                                    }));
                                                  } else {
                                                    const cleanValue = value.replace(/^0+/, '') || '0';
                                                    const limitedValue = cleanValue.length > 2 ? cleanValue.slice(0, 2) : cleanValue;
                                                    setEditSetScores(prev => ({ 
                                                      ...prev, 
                                                      [`set${setNum}_team2`]: limitedValue 
                                                    }));
                                                  }
                                                }}
                                                onKeyDown={handleKeyPress}
                                                onBlur={(e) => {
                                                  // Only save if we're leaving the editing area completely
                                                  const relatedTarget = e.relatedTarget;
                                                  const isMovingToOtherSetInput = relatedTarget && 
                                                    (relatedTarget.name === `set${setNum}_team1` || 
                                                     relatedTarget.getAttribute('data-score-input') === `set${setNum}_team1`);
                                                  
                                                  if (!isMovingToOtherSetInput) {
                                                    handleSaveScores(match.id);
                                                  }
                                                }}
                                              sx={{ width: 50, '& .MuiOutlinedInput-root': { fontSize: '0.8rem', height: 28 } }}
                                                inputProps={{ 
                                                  min: 0, 
                                                  max: 99, 
                                                  size: 2,
                                                  name: `set${setNum}_team2`,
                                                  'data-score-input': `set${setNum}_team2`
                                                }}
                                                placeholder="0"
                                              />
                                            </Box>
                                          </Box>
                                        ))}
                                    

                                    </>
                                  )}
                                  </>
                                ) : (
                                  <>
                                    {(match.setsPerMatch === 1 || !match.setsPerMatch) ? (
                                    // Single set display (consistent with group matches)
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ 
                                          flex: 1, 
                                          fontSize: '0.8rem',
                                          wordBreak: 'normal',
                                          overflowWrap: 'break-word',
                                          whiteSpace: 'normal',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical'
                                        }}>
                                            {match.team1?.teamName || 'Chờ đấu'}
                                          </Typography>
                                          
                                          <Typography 
                                        variant="body1" 
                                            sx={{ 
                                          fontWeight: 600,
                                          color: match.completed ? 'success.main' : 'text.primary',
                                          minWidth: 30,
                                              textAlign: 'center',
                                          fontSize: '0.9rem'
                                            }}
                                          >
                                            {match.score1 || '-'}
                                          </Typography>
                                      </Box>
                                      
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ 
                                          flex: 1, 
                                          fontSize: '0.8rem',
                                          wordBreak: 'normal',
                                          overflowWrap: 'break-word',
                                          whiteSpace: 'normal',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical'
                                        }}>
                                          {match.team2?.teamName || 'Chờ đấu'}
                                        </Typography>
                                      
                                          <Typography 
                                        variant="body1" 
                                            sx={{ 
                                          fontWeight: 600,
                                          color: match.completed ? 'success.main' : 'text.primary',
                                          minWidth: 30,
                                          textAlign: 'center',
                                          fontSize: '0.9rem'
                                        }}
                                      >
                                        {match.score2 || '-'}
                                      </Typography>
                                      </Box>
                                          

                                    </Box>
                                    ) : (
                                      // Multiple sets display
                                      <>
                                        {/* Always show set scores if they exist, regardless of completion status */}
                                        {(match.score1 !== '' && match.score2 !== '') || 
                                         Array.from({ length: match.setsPerMatch || 1 }, (_, i) => i + 1).some(setNum => 
                                           match[`set${setNum}_team1`] !== '' && match[`set${setNum}_team1`] !== null ||
                                           match[`set${setNum}_team2`] !== '' && match[`set${setNum}_team2`] !== null
                                         ) ? (
                                          // Show detailed set results when scores exist
                                          <>
                                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontSize: '0.7rem' }}>
                                              Kết quả từng set:
                                            </Typography>
                                            {Array.from({ length: match.setsPerMatch || 1 }, (_, i) => i + 1).map((setNum) => (
                                              <Box key={setNum} sx={{ mb: 1 }}>
                                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                                                  Set {setNum}:
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="body2" sx={{ 
                                                  flexGrow: 1, 
                                                  fontSize: '0.8rem',
                                                  wordBreak: 'normal',
                                                  overflowWrap: 'break-word',
                                                  whiteSpace: 'normal',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  display: '-webkit-box',
                                                  WebkitLineClamp: 2,
                                                  WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {match.team1?.teamName || 'Chờ đấu'}
                                                  </Typography>
                                                <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center', fontSize: '0.8rem' }}>
                                                    {match[`set${setNum}_team1`] || '-'}
                                                  </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" sx={{ 
                                                  flexGrow: 1, 
                                                  fontSize: '0.8rem',
                                                  wordBreak: 'normal',
                                                  overflowWrap: 'break-word',
                                                  whiteSpace: 'normal',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  display: '-webkit-box',
                                                  WebkitLineClamp: 2,
                                                  WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {match.team2?.teamName || 'Chờ đấu'}
                                                  </Typography>
                                                <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center', fontSize: '0.8rem' }}>
                                                    {match[`set${setNum}_team2`] || '-'}
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            ))}
                                            {(match.score1 !== '' && match.score2 !== '') && (
                                              <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'space-between',
                                                p: 1,
                                                borderRadius: 1,
                                                backgroundColor: 'grey.100',
                                                border: '1px solid',
                                                borderColor: 'grey.300'
                                              }}>
                                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                  Tổng:
                                                </Typography>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                    {match.score1} - {match.score2}
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            )}
                                          </>
                                        ) : (
                                        // Show simple format for matches with no scores yet (consistent with group matches)
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ 
                                              flex: 1, 
                                              fontSize: '0.8rem',
                                              wordBreak: 'normal',
                                              overflowWrap: 'break-word',
                                              whiteSpace: 'normal',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical'
                                            }}>
                                                {match.team1?.teamName || 'Chờ đấu'}
                                              </Typography>
                                              
                                              <Typography 
                                            variant="body1" 
                                                sx={{ 
                                              fontWeight: 600,
                                              color: 'text.primary',
                                              minWidth: 30,
                                                  textAlign: 'center',
                                              fontSize: '0.9rem'
                                                }}
                                              >
                                            -
                                              </Typography>
                                          </Box>
                                          
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ 
                                              flex: 1, 
                                              fontSize: '0.8rem',
                                              wordBreak: 'normal',
                                              overflowWrap: 'break-word',
                                              whiteSpace: 'normal',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical'
                                            }}>
                                              {match.team2?.teamName || 'Chờ đấu'}
                                            </Typography>
                                          
                                              <Typography 
                                            variant="body1" 
                                                sx={{ 
                                              fontWeight: 600,
                                              color: 'text.primary',
                                              minWidth: 30,
                                              textAlign: 'center',
                                              fontSize: '0.9rem'
                                            }}
                                          >
                                            -
                                          </Typography>
                                          </Box>
                                              

                                        </Box>
                                    )}
                                    

                                    </>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              ))
            )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default KnockoutBracket;
