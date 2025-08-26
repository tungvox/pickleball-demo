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
  TextareaAutosize,
  Alert
} from '@mui/material';
import { ExpandMore, ExpandLess, Edit, Check, Close, Add, Delete } from '@mui/icons-material';

const PairsList = ({ pairs, groups, onUpdatePairName, onAddGroup, onAddPlayer, onDeleteGroup, onDeletePlayer, isLoggedIn }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState('');

  const handleEditGroup = (groupId, groupPairs) => {
    setEditingGroupId(groupId);
    setEditText(groupPairs.map(pair => pair.name).join('\n'));
    setEditError('');
  };

  const handleSaveGroup = async (groupId, groupPairs) => {
    if (!editText.trim()) {
      setEditError('Vui lòng nhập tên các đội');
      return;
    }

    const lines = editText.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length !== groupPairs.length) {
      setEditError(`Cần đúng ${groupPairs.length} đội, hiện tại có ${lines.length} đội`);
      return;
    }

    // Check for duplicates
    const uniqueLines = [...new Set(lines)];
    if (uniqueLines.length !== lines.length) {
      setEditError('Có tên đội bị trùng lặp');
      return;
    }

    try {
      // Update each pair name
      for (let i = 0; i < groupPairs.length; i++) {
        if (groupPairs[i].name !== lines[i]) {
          await onUpdatePairName(groupPairs[i].id, lines[i]);
        }
      }
      
      setEditingGroupId(null);
      setEditText('');
      setEditError('');
    } catch (error) {
      setEditError('Lỗi khi cập nhật tên đội');
    }
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditText('');
    setEditError('');
  };

  // Group pairs by their assigned group
  const pairsByGroup = {};
  if (groups) {
    groups.forEach(group => {
      pairsByGroup[group.id] = group.pairs;
    });
  } else {
    // Fallback: if no groups, show all pairs in one group
    pairsByGroup['all'] = pairs;
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Danh sách cặp đôi ({pairs.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isLoggedIn && (
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={onAddGroup}
                size="small"
                sx={{ fontWeight: 600, fontSize: '0.8rem' }}
              >
                Thêm bảng
              </Button>
            )}
            <Button
              variant="text"
              onClick={() => setExpanded(!expanded)}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </Button>
          </Box>
        </Box>
        
        <Collapse in={expanded}>
          <Grid container spacing={1.5}>
            {Object.entries(pairsByGroup).map(([groupId, groupPairs]) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={groupId}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1, 
                    border: '1px solid',
                    borderColor: 'divider',
                    height: 'fit-content',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                        {groups ? `Bảng ${groupId}` : 'Tất cả đội'}
                      </Typography>
                      <Chip 
                        label={`${groupPairs.length} đội`} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 600, borderWidth: 1, fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                    {isLoggedIn && groups && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => onAddPlayer(groupId)}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.7rem', px: 1, py: 0.5 }}
                        >
                          Thêm đội
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Delete />}
                          onClick={() => onDeleteGroup(groupId)}
                          color="error"
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.7rem', px: 1, py: 0.5 }}
                        >
                          Xóa bảng
                        </Button>
                      </Box>
                    )}
                  </Box>
                  
                  {editingGroupId === groupId ? (
                    // Edit mode
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Chỉnh sửa tên đội (mỗi đội một dòng):
                      </Typography>
                      
                      <TextareaAutosize
                        minRows={Math.max(3, groupPairs.length)}
                        maxRows={Math.max(6, groupPairs.length + 2)}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          resize: 'vertical',
                          lineHeight: '1.4'
                        }}
                        placeholder="Nhập tên đội, mỗi đội một dòng..."
                      />
                      
                      {editError && (
                        <Alert severity="error" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                          {editError}
                        </Alert>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<Check />}
                          onClick={() => handleSaveGroup(groupId, groupPairs)}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          Lưu
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Close />}
                          onClick={handleCancelEdit}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          Hủy
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    // Display mode
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {groupPairs.map((pair) => (
                        <Box 
                          key={pair.id} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            p: 0.75,
                            borderRadius: 1,
                            backgroundColor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              flexGrow: 1, 
                              fontWeight: 500,
                              fontSize: '0.85rem',
                              wordBreak: 'normal',
                              overflowWrap: 'break-word',
                              whiteSpace: 'normal',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {pair.name}
                          </Typography>
                          {isLoggedIn && (
                            <Button
                              size="small"
                              onClick={() => onDeletePlayer(groupId, pair.id)}
                              color="error"
                              variant="text"
                              sx={{ 
                                ml: 1,
                                p: 0.5,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                minWidth: 'auto'
                              }}
                            >
                              Xóa
                            </Button>
                          )}
                        </Box>
                      ))}
                      
                      {isLoggedIn && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                          <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => handleEditGroup(groupId, groupPairs)}
                            size="small"
                            sx={{ 
                              fontWeight: 600, 
                              fontSize: '0.75rem',
                              px: 2
                            }}
                          >
                            Chỉnh sửa tên đội
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default PairsList;
