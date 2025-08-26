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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, Edit, Check, Close, Delete, Clear, EmojiEvents } from '@mui/icons-material';

const GroupMatches = ({ groups, groupMatches, standings, onUpdateMatch, onDeletePlayer, isLoggedIn }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editScores, setEditScores] = useState({ score1: '', score2: '' });

  const handleEditScores = (match, groupId) => {
    setEditingMatch(`${groupId}-${match.id}`);
    setEditScores({ score1: match.score1 || '', score2: match.score2 || '' });
  };

  const handleSaveScores = async (groupId, matchId) => {
    if (!isLoggedIn) return;
    
    const { score1, score2 } = editScores;
    
    // If both scores are empty, clear the match
    if (score1 === '' && score2 === '') {
      await onUpdateMatch(groupId, matchId, '', '');
      setEditingMatch(null);
      setEditScores({ score1: '', score2: '' });
      return;
    }
    
    // If only one score is filled, don't save yet (wait for both)
    if (score1 === '' || score2 === '') {
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
    
    await onUpdateMatch(groupId, matchId, score1, score2);
    setEditingMatch(null);
    setEditScores({ score1: '', score2: '' });
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
    setEditScores({ score1: '', score2: '' });
  };

  const handleClearScores = async (groupId, matchId) => {
    if (!isLoggedIn) return;
    await onUpdateMatch(groupId, matchId, '', '');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const [groupId, matchId] = editingMatch.split('-');
      handleSaveScores(groupId, matchId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const getMatchStatus = (match) => {
    if (match.completed) return { label: 'Hoàn thành', color: 'success' };
    return { label: 'Chưa đấu', color: 'default' };
  };

  return (
    <>
      {/* Group Matches Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Trận đấu vòng bảng
            </Typography>
            <Button
              variant="text"
              onClick={() => setExpanded(!expanded)}
              sx={{ minWidth: 'auto', p: 1 }}
            >
              {expanded ? <ExpandMore /> : <ExpandMore />}
            </Button>
          </Box>
          
          <Collapse in={expanded}>
            <Grid container spacing={2}>
              {groups.map((group) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={group.id}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      border: '1px solid',
                      borderColor: 'divider',
                      height: 'fit-content'
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'secondary.main' }}>
                      {group.name} ({group.pairs.length} đội)
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {groupMatches[group.id]?.map((match, index) => (
                        <Box 
                          key={match.id} 
                          sx={{ 
                            p: 1.5, 
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
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Trận {index + 1}
                              </Typography>
                              <Chip 
                                label={getMatchStatus(match).label} 
                                color={getMatchStatus(match).color} 
                                size="small"
                                variant={match.completed ? "filled" : "outlined"}
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            </Box>
                            {isLoggedIn && !editingMatch && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => handleEditScores(match, group.id)}
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
                                    onClick={() => handleClearScores(group.id, match.id)}
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
                          
                          {editingMatch === `${group.id}-${match.id}` ? (
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
                                  {match.team1.name}
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
                                      handleSaveScores(group.id, match.id);
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
                                  {match.team2.name}
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
                                      handleSaveScores(group.id, match.id);
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
                                  {match.team1.name}
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
                                  {match.team2.name}
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
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Standings Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
            Bảng xếp hạng
          </Typography>
          
          <Grid container spacing={1.5}>
            {groups.map((group) => (
              <Grid item xs={12} md={6} lg={4} key={group.id}>
                <Paper elevation={1} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: 'secondary.main', fontSize: '0.9rem' }}>
                    {group.name}
                  </Typography>
                  
                  <TableContainer sx={{ maxWidth: '100%' }}>
                    <Table size="small" sx={{ minWidth: 'auto' }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: '0.65rem', py: 0.25, fontWeight: 600, width: '40%' }}>Đội</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.65rem', py: 0.25, width: '15%' }}>T</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.65rem', py: 0.25, width: '15%' }}>B</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.65rem', py: 0.25, width: '15%' }}>HS</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.65rem', py: 0.25, width: '15%' }}>Hạng</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {standings[group.id]?.map((team) => (
                          <TableRow key={team.teamId} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                            <TableCell sx={{ 
                              fontSize: '0.7rem', 
                              py: 0.25, 
                              fontWeight: 500, 
                              width: '40%',
                              maxWidth: '40%',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              hyphens: 'auto',
                              whiteSpace: 'normal',
                              lineHeight: 1.2,
                              overflow: 'hidden',
                              '@media (max-width: 600px)': {
                                wordBreak: 'break-all',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 0
                              }
                            }}>
                              {team.teamName}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.65rem', py: 0.25, width: '15%' }}>{team.won}</TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.65rem', py: 0.25, width: '15%' }}>{team.lost}</TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.65rem', py: 0.25, width: '15%' }}>{team.goalDifference}</TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.65rem', py: 0.25, width: '15%', fontWeight: 600 }}>{team.rank}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </>
  );
};

export default GroupMatches;
