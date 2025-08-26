import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  ClearAll as ClearAllIcon
} from '@mui/icons-material';

const RefereeAssignment = ({ tournament, onAssignReferee, onRemoveReferee, onAssignKnockoutReferee, onRemoveKnockoutReferee }) => {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedReferee, setSelectedReferee] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Batch assignment states
  const [batchReferee, setBatchReferee] = useState('');
  const [selectedMatches, setSelectedMatches] = useState(new Set());
  const [batchExpanded, setBatchExpanded] = useState(false);

  const handleAssignReferee = async () => {
    if (!selectedReferee) {
      setError('Vui lòng chọn trọng tài');
      return;
    }

    console.log('RefereeAssignment - Assigning referee:', {
      tournamentId: tournament.id,
      groupId: selectedMatch.groupId,
      matchId: selectedMatch.id,
      refereeEmail: selectedReferee,
      matchType: selectedMatch.groupId === 'knockout' ? 'knockout' : 'group'
    });

    try {
      if (selectedMatch.groupId === 'knockout') {
        await onAssignKnockoutReferee(tournament.id, selectedMatch.id, selectedReferee);
        setSuccess('Đã phân công trọng tài cho trận đấu loại trực tiếp thành công!');
      } else {
        await onAssignReferee(tournament.id, selectedMatch.groupId, selectedMatch.id, selectedReferee);
        setSuccess('Đã phân công trọng tài thành công!');
      }
      setDialogOpen(false);
      setSelectedReferee('');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleRemoveReferee = async (groupId, matchId) => {
    console.log('RefereeAssignment - Removing referee:', {
      tournamentId: tournament.id,
      groupId,
      matchId
    });

    try {
      await onRemoveReferee(tournament.id, groupId, matchId);
      setError('');
      setSuccess('Đã xóa phân công trọng tài thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const openAssignmentDialog = (match, groupId) => {
    setSelectedMatch({ ...match, groupId });
    setSelectedReferee(match.assignedReferee || '');
    setDialogOpen(true);
    setError('');
  };

  const handleRemoveKnockoutReferee = async (matchId) => {
    console.log('RefereeAssignment - Removing knockout referee:', {
      tournamentId: tournament.id,
      matchId
    });

    try {
      await onRemoveKnockoutReferee(tournament.id, matchId);
      setError('');
      setSuccess('Đã xóa phân công trọng tài cho trận đấu loại trực tiếp thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  // Batch assignment functions
  const handleBatchMatchToggle = (matchKey) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(matchKey)) {
      newSelected.delete(matchKey);
    } else {
      newSelected.add(matchKey);
    }
    setSelectedMatches(newSelected);
  };

  const handleBatchAssign = async () => {
    if (!batchReferee) {
      setError('Vui lòng chọn trọng tài');
      return;
    }

    if (selectedMatches.size === 0) {
      setError('Vui lòng chọn ít nhất một trận đấu');
      return;
    }

    try {
      const assignments = Array.from(selectedMatches).map(matchKey => {
        const [groupId, matchId] = matchKey.split('-');
        return { groupId, matchId };
      });

      // Separate group and knockout assignments
      const groupAssignments = assignments.filter(a => a.groupId !== 'knockout');
      const knockoutAssignments = assignments.filter(a => a.groupId === 'knockout');

      // Handle group assignments
      for (const { groupId, matchId } of groupAssignments) {
        await onAssignReferee(tournament.id, groupId, matchId, batchReferee);
      }

      // Handle knockout assignments in a single batch operation
      if (knockoutAssignments.length > 0) {
        await handleBatchKnockoutAssignment(knockoutAssignments, batchReferee);
      }

      setSelectedMatches(new Set());
      setBatchReferee('');
      setBatchExpanded(false);
      setError('');
      setSuccess(`Đã phân công ${assignments.length} trận đấu cho trọng tài thành công!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleBatchKnockoutAssignment = async (knockoutAssignments, refereeEmail) => {
    try {
      // Get current tournament data
      const currentTournament = tournament;
      const updatedBracketMatches = [...currentTournament.bracketMatches];
      
      // Update all knockout matches in the array
      knockoutAssignments.forEach(({ matchId }) => {
        const matchIndex = updatedBracketMatches.findIndex(m => m.id === matchId);
        if (matchIndex !== -1) {
          updatedBracketMatches[matchIndex] = {
            ...updatedBracketMatches[matchIndex],
            assignedReferee: refereeEmail
          };
        }
      });

      // Make a single Firestore update
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const tournamentRef = doc(db, 'tournaments', tournament.id);
      await updateDoc(tournamentRef, {
        bracketMatches: updatedBracketMatches,
        updatedAt: new Date()
      });

      console.log('Batch knockout assignment completed successfully');
    } catch (err) {
      console.error('Error in batch knockout assignment:', err);
      throw new Error('Lỗi khi phân công hàng loạt cho trận đấu loại trực tiếp');
    }
  };

  const handleSelectAllInGroup = (groupId) => {
    const groupMatches = tournament.groupMatches[groupId] || [];
    const newSelected = new Set(selectedMatches);
    
    const allGroupMatches = groupMatches.map(match => `${groupId}-${match.id}`);
    const allSelected = allGroupMatches.every(matchKey => newSelected.has(matchKey));
    
    if (allSelected) {
      // Deselect all
      allGroupMatches.forEach(matchKey => newSelected.delete(matchKey));
    } else {
      // Select all
      allGroupMatches.forEach(matchKey => newSelected.add(matchKey));
    }
    
    setSelectedMatches(newSelected);
  };

  const handleSelectAllInKnockout = () => {
    const knockoutMatches = tournament.bracketMatches || [];
    const newSelected = new Set(selectedMatches);
    
    const allKnockoutMatches = knockoutMatches.map(match => `knockout-${match.id}`);
    const allSelected = allKnockoutMatches.every(matchKey => newSelected.has(matchKey));
    
    if (allSelected) {
      // Deselect all
      allKnockoutMatches.forEach(matchKey => newSelected.delete(matchKey));
    } else {
      // Select all
      allKnockoutMatches.forEach(matchKey => newSelected.add(matchKey));
    }
    
    setSelectedMatches(newSelected);
  };

  const handleSelectAllMatches = () => {
    const allMatches = [];
    
    // Add group matches
    tournament.groups.forEach(group => {
      const groupMatches = tournament.groupMatches[group.id] || [];
      groupMatches.forEach(match => {
        allMatches.push(`${group.id}-${match.id}`);
      });
    });
    
    // Add knockout matches
    if (tournament.bracketMatches) {
      tournament.bracketMatches.forEach(match => {
        allMatches.push(`knockout-${match.id}`);
      });
    }
    
    const newSelected = new Set(selectedMatches);
    const allSelected = allMatches.every(matchKey => newSelected.has(matchKey));
    
    if (allSelected) {
      // Deselect all
      setSelectedMatches(new Set());
    } else {
      // Select all
      setSelectedMatches(new Set(allMatches));
    }
  };

  const handleClearAllAssignments = async () => {
    try {
      console.log('RefereeAssignment - Starting clear all assignments');
      console.log('Tournament bracket matches:', tournament.bracketMatches);
      
      let clearedCount = 0;
      
      // Clear all group match assignments
      for (const group of tournament.groups) {
        const groupMatches = tournament.groupMatches[group.id] || [];
        for (const match of groupMatches) {
          if (match.assignedReferee) {
            console.log('RefereeAssignment - Clearing group match referee:', { groupId: group.id, matchId: match.id, referee: match.assignedReferee });
            await onRemoveReferee(tournament.id, group.id, match.id);
            clearedCount++;
          }
        }
      }

      // Clear all knockout match assignments in a single batch operation
      if (tournament.bracketMatches && tournament.bracketMatches.length > 0) {
        console.log('RefereeAssignment - Processing knockout matches:', tournament.bracketMatches.length);
        
        const matchesToClear = tournament.bracketMatches.filter(match => match.assignedReferee);
        console.log('RefereeAssignment - Knockout matches to clear:', matchesToClear.length);
        
        if (matchesToClear.length > 0) {
          await handleBatchKnockoutClear(matchesToClear);
          clearedCount += matchesToClear.length;
        }
      }

      console.log('RefereeAssignment - Total assignments cleared:', clearedCount);
      setError('');
      setSuccess(`Đã xóa tất cả phân công trọng tài thành công! (${clearedCount} trận)`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('RefereeAssignment - Error in clear all assignments:', err);
      setError(err.message);
      setSuccess('');
    }
  };

  const handleBatchKnockoutClear = async (matchesToClear) => {
    try {
      console.log('RefereeAssignment - Starting batch knockout clear for matches:', matchesToClear.map(m => m.id));
      
      // Get current tournament data
      const currentTournament = tournament;
      const updatedBracketMatches = [...currentTournament.bracketMatches];
      
      // Clear all referee assignments in the array
      matchesToClear.forEach((matchToClear) => {
        const matchIndex = updatedBracketMatches.findIndex(m => m.id === matchToClear.id);
        if (matchIndex !== -1) {
          console.log('RefereeAssignment - Clearing referee for match:', matchToClear.id);
          updatedBracketMatches[matchIndex] = {
            ...updatedBracketMatches[matchIndex],
            assignedReferee: null
          };
        }
      });

      // Make a single Firestore update
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const tournamentRef = doc(db, 'tournaments', tournament.id);
      await updateDoc(tournamentRef, {
        bracketMatches: updatedBracketMatches,
        updatedAt: new Date()
      });

      console.log('RefereeAssignment - Batch knockout clear completed successfully');
    } catch (err) {
      console.error('RefereeAssignment - Error in batch knockout clear:', err);
      throw new Error('Lỗi khi xóa phân công hàng loạt cho trận đấu loại trực tiếp');
    }
  };

  const getTeamName = (team) => {
    const teamId = typeof team === 'string' ? team : team?.id;
    if (!teamId) return 'Đội không xác định';
    
    const pair = tournament.pairs.find(p => p.id === teamId);
    return pair ? pair.name : `Đội ${teamId}`;
  };

  const getRefereeName = (email) => {
    // Check in authorizedEmails first (new format with names)
    const authorizedUser = tournament.authorizedEmails?.find(auth => 
      typeof auth === 'object' && auth.email === email
    );
    if (authorizedUser) {
      return authorizedUser.name;
    }
    
    // Fallback to email if no name found
    return email;
  };

  const formatRefereeDisplay = (email, name) => {
    // Check if it's a phone number (ends with @pickleball.local)
    if (email.endsWith('@pickleball.local')) {
      const phoneNumber = email.replace('@pickleball.local', '');
      // Convert back to Vietnamese format
      if (phoneNumber.startsWith('+84')) {
        return `0${phoneNumber.substring(3)}`;
      }
      return phoneNumber;
    }
    return email;
  };

  const isPhoneNumber = (email) => {
    return email.endsWith('@pickleball.local');
  };

  if (!tournament) {
    return (
      <Alert severity="info">
        Vui lòng chọn một giải đấu để quản lý phân công trọng tài
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Phân công trọng tài
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gán trọng tài cho từng trận đấu để tránh xung đột khi nhập điểm
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<ClearAllIcon />}
            onClick={handleClearAllAssignments}
            sx={{ 
              borderColor: 'warning.main',
              color: 'warning.main',
              '&:hover': {
                borderColor: 'warning.dark',
                backgroundColor: 'warning.50'
              }
            }}
          >
            Xóa tất cả phân công
          </Button>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Batch Assignment Section */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
        <Accordion 
          expanded={batchExpanded} 
          onChange={() => setBatchExpanded(!batchExpanded)}
          sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              backgroundColor: 'primary.100', 
              borderRadius: 1,
              '&:hover': { backgroundColor: 'primary.200' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AssignmentIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold" color="primary">
                Phân công hàng loạt
              </Typography>
              {selectedMatches.size > 0 && (
                <Chip 
                  label={`${selectedMatches.size} trận đã chọn`} 
                  color="primary" 
                  size="small" 
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2, backgroundColor: 'background.paper', borderRadius: 1, mt: 1 }}>
            <Grid container spacing={2}>
              {/* Referee Selection */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Chọn trọng tài</InputLabel>
                  <Select
                    value={batchReferee}
                    onChange={(e) => setBatchReferee(e.target.value)}
                    label="Chọn trọng tài"
                  >
                    {tournament.authorizedEmails?.map((auth) => {
                      const email = typeof auth === 'string' ? auth : auth.email;
                      const name = typeof auth === 'string' ? auth : auth.name;
                      const displayValue = formatRefereeDisplay(email, name);
                      const isPhone = isPhoneNumber(email);
                      
                      return (
                        <MenuItem key={email} value={email}>
                          {name} ({isPhone ? displayValue : email})
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Action Buttons */}
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={handleSelectAllMatches}
                    startIcon={selectedMatches.size > 0 ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                  >
                    {selectedMatches.size > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={handleBatchAssign}
                    disabled={!batchReferee || selectedMatches.size === 0}
                    startIcon={<AssignmentIcon />}
                  >
                    Phân công {selectedMatches.size > 0 ? `(${selectedMatches.size} trận)` : ''}
                  </Button>
                  
                  <Typography variant="caption" color="text.secondary">
                    Chọn trọng tài và các trận đấu cần phân công
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Match Selection List */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Danh sách trận đấu ({selectedMatches.size} đã chọn)
              </Typography>
              
              <Grid container spacing={2}>
                {/* Group Matches */}
                {tournament.groups.map((group) => {
                  const groupMatches = tournament.groupMatches[group.id] || [];
                  const selectedInGroup = groupMatches.filter(match => 
                    selectedMatches.has(`${group.id}-${match.id}`)
                  ).length;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={group.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
                              {group.name}
                            </Typography>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleSelectAllInGroup(group.id)}
                            >
                              {selectedInGroup === groupMatches.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </Button>
                          </Box>
                          
                          <List dense sx={{ p: 0.5, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                            {groupMatches.map((match, index) => {
                              const matchKey = `${group.id}-${match.id}`;
                              const isSelected = selectedMatches.has(matchKey);
                              const isAssigned = !!match.assignedReferee;
                              
                              return (
                                <ListItem 
                                  key={match.id} 
                                  sx={{ 
                                    p: 0.75, 
                                    borderRadius: 1,
                                    backgroundColor: isSelected ? 'primary.50' : 'background.paper',
                                    '&:hover': { backgroundColor: isSelected ? 'primary.100' : 'action.hover' },
                                    width: '100%',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    mb: 0.5,
                                    '&:last-child': { mb: 0 }
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 32, mr: 0.5 }}>
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={() => handleBatchMatchToggle(matchKey)}
                                      size="small"
                                      disabled={isAssigned}
                                    />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                        <Typography variant="caption" sx={{ 
                                          color: 'text.secondary', 
                                          fontWeight: 600, 
                                          textAlign: 'left',
                                          fontSize: '0.7rem',
                                          mb: 0.25
                                        }}>
                                          Trận {index + 1}
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                          fontSize: '0.8rem',
                                          fontWeight: 500,
                                          color: 'text.primary',
                                          textAlign: 'left',
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word',
                                          hyphens: 'auto',
                                          lineHeight: 1.2,
                                          maxWidth: '100%',
                                          overflow: 'hidden',
                                          mb: 0.25
                                        }}>
                                          {getTeamName(match.team1)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                          fontSize: '0.8rem',
                                          fontWeight: 500,
                                          color: 'text.primary',
                                          textAlign: 'left',
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word',
                                          hyphens: 'auto',
                                          lineHeight: 1.2,
                                          maxWidth: '100%',
                                          overflow: 'hidden'
                                        }}>
                                          {getTeamName(match.team2)}
                                        </Typography>
                                      </Box>
                                    }
                                    secondary={
                                      isAssigned ? (
                                        <Typography variant="caption" color="success.main" sx={{
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word',
                                          hyphens: 'auto',
                                          maxWidth: '100%',
                                          overflow: 'hidden'
                                        }}>
                                          Đã phân công: {getRefereeName(match.assignedReferee)}
                                        </Typography>
                                      ) : null
                                    }
                                  />
                                </ListItem>
                              );
                            })}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}

                {/* Knockout Matches */}
                {tournament.bracketMatches && tournament.bracketMatches.length > 0 && (
                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                            Vòng loại trực tiếp
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleSelectAllInKnockout()}
                          >
                            {selectedMatches.size > 0 && tournament.bracketMatches.every(match => 
                              selectedMatches.has(`knockout-${match.id}`)
                            ) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                          </Button>
                        </Box>
                        
                        <List dense sx={{ p: 0.5, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                          {tournament.bracketMatches.map((match, index) => {
                            const matchKey = `knockout-${match.id}`;
                            const isSelected = selectedMatches.has(matchKey);
                            const isAssigned = !!match.assignedReferee;
                            
                            return (
                              <ListItem 
                                key={match.id} 
                                sx={{ 
                                  p: 0.75, 
                                  borderRadius: 1,
                                  backgroundColor: isSelected ? 'primary.50' : 'background.paper',
                                  '&:hover': { backgroundColor: isSelected ? 'primary.100' : 'action.hover' },
                                  width: '100%',
                                  maxWidth: '100%',
                                  overflow: 'hidden',
                                  border: '1px solid',
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  mb: 0.5,
                                  '&:last-child': { mb: 0 }
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 32, mr: 0.5 }}>
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={() => handleBatchMatchToggle(matchKey)}
                                    size="small"
                                    disabled={isAssigned}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                      <Typography variant="caption" sx={{ 
                                        color: 'text.secondary', 
                                        fontWeight: 600, 
                                        textAlign: 'left',
                                        fontSize: '0.7rem',
                                        mb: 0.25
                                      }}>
                                        Vòng {match.round} - Trận {match.matchNumber}
                                      </Typography>
                                      <Typography variant="body2" sx={{ 
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        textAlign: 'left',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        hyphens: 'auto',
                                        lineHeight: 1.2,
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        mb: 0.25
                                      }}>
                                        {match.team1 ? getTeamName(match.team1) : 'TBD'}
                                      </Typography>
                                      <Typography variant="body2" sx={{ 
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        textAlign: 'left',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        hyphens: 'auto',
                                        lineHeight: 1.2,
                                        maxWidth: '100%',
                                        overflow: 'hidden'
                                      }}>
                                        {match.team2 ? getTeamName(match.team2) : 'TBD'}
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={
                                    isAssigned ? (
                                      <Typography variant="caption" color="success.main" sx={{
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        hyphens: 'auto',
                                        maxWidth: '100%',
                                        overflow: 'hidden'
                                      }}>
                                        Đã phân công: {getRefereeName(match.assignedReferee)}
                                      </Typography>
                                    ) : null
                                  }
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Groups */}
      <Grid container spacing={2}>
        {tournament.groups.map((group) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={group.id}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'secondary.main' }}>
                  {group.name}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {tournament.groupMatches[group.id]?.map((match, index) => (
                    <Box 
                      key={match.id} 
                      sx={{ 
                        p: 1, 
                        border: '1px solid', 
                        borderColor: match.assignedReferee ? 'success.main' : 'divider', 
                        borderRadius: 1,
                        backgroundColor: match.assignedReferee ? 'success.50' : 'background.paper',
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                          Trận {index + 1}
                        </Typography>
                        {match.assignedReferee ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Trọng tài: {getRefereeName(match.assignedReferee)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => openAssignmentDialog(match, group.id)}
                                sx={{ 
                                  minWidth: 'auto', 
                                  p: 0.5,
                                  fontSize: '0.7rem',
                                  color: 'primary.main'
                                }}
                              >
                                Sửa
                              </Button>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => handleRemoveReferee(group.id, match.id)}
                                sx={{ 
                                  minWidth: 'auto', 
                                  p: 0.5,
                                  fontSize: '0.7rem',
                                  color: 'warning.main'
                                }}
                              >
                                Xóa
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Tooltip title="Phân công trọng tài" arrow>
                            <IconButton
                              size="small"
                              onClick={() => openAssignmentDialog(match, group.id)}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': { backgroundColor: 'primary.50' }
                              }}
                            >
                              <AssignmentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      
                      <Box sx={{ mb: 0.5, width: '100%' }}>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 500, 
                          color: 'text.primary', 
                          textAlign: 'left',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                          lineHeight: 1.2,
                          mb: 0.5,
                          width: '100%',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {getTeamName(match.team1)}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 500, 
                          color: 'text.primary', 
                          textAlign: 'left',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                          lineHeight: 1.2,
                          width: '100%',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {getTeamName(match.team2)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Knockout Matches Section */}
      {tournament.bracketMatches && tournament.bracketMatches.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: 'primary.main' }}>
            Vòng loại trực tiếp
          </Typography>
          
          <Grid container spacing={2}>
            {tournament.bracketMatches.map((match) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={match.id}>
                <Card>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                        Vòng {match.round} - Trận {match.matchNumber}
                      </Typography>
                      {match.assignedReferee ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Trọng tài: {getRefereeName(match.assignedReferee)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => openAssignmentDialog(match, 'knockout')}
                              sx={{ 
                                minWidth: 'auto', 
                                p: 0.5,
                                fontSize: '0.7rem',
                                color: 'primary.main'
                              }}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleRemoveKnockoutReferee(match.id)}
                              sx={{ 
                                minWidth: 'auto', 
                                p: 0.5,
                                fontSize: '0.7rem',
                                color: 'warning.main'
                              }}
                            >
                              Xóa
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Tooltip title="Phân công trọng tài" arrow>
                          <IconButton
                            size="small"
                            onClick={() => openAssignmentDialog(match, 'knockout')}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.50' }
                            }}
                          >
                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 0.5, width: '100%' }}>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 500, 
                        color: 'text.primary', 
                        textAlign: 'left',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        lineHeight: 1.2,
                        mb: 0.5,
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {match.team1 ? getTeamName(match.team1) : 'TBD'}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 500, 
                        color: 'text.primary', 
                        textAlign: 'left',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        lineHeight: 1.2,
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {match.team2 ? getTeamName(match.team2) : 'TBD'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Assignment Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Phân công trọng tài
        </DialogTitle>
        <DialogContent>
          {selectedMatch && (
            <Box sx={{ py: 2 }}>
              <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, backgroundColor: 'background.paper' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                  Trận đấu
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontWeight: 600, 
                  color: 'primary.main', 
                  textAlign: 'center',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  lineHeight: 1.3,
                  minHeight: '2.6em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}>
                  {getTeamName(selectedMatch.team1)}
                </Typography>
                <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 700, textAlign: 'center', my: 1 }}>
                  VS
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontWeight: 600, 
                  color: 'primary.main', 
                  textAlign: 'center',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  lineHeight: 1.3,
                  minHeight: '2.6em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}>
                  {getTeamName(selectedMatch.team2)}
                </Typography>
              </Box>
              
                             <FormControl fullWidth size="small">
                 <InputLabel>Chọn trọng tài</InputLabel>
                                   <Select
                    value={selectedReferee}
                    onChange={(e) => setSelectedReferee(e.target.value)}
                    label="Chọn trọng tài"
                  >
                    {tournament.authorizedEmails?.map((auth) => {
                      const email = typeof auth === 'string' ? auth : auth.email;
                      const name = typeof auth === 'string' ? auth : auth.name;
                      const displayValue = formatRefereeDisplay(email, name);
                      const isPhone = isPhoneNumber(email);
                      
                      return (
                        <MenuItem key={email} value={email}>
                          {name} ({isPhone ? displayValue : email})
                        </MenuItem>
                      );
                    })}
                  </Select>
               </FormControl>
               
               <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                 * Trọng tài sẽ chỉ thấy trận đấu này khi đăng nhập với email hoặc số điện thoại này
               </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleAssignReferee} variant="contained">
            Phân công
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RefereeAssignment;
