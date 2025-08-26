import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField
} from '@mui/material';
import { Add, Delete, Refresh, Edit } from '@mui/icons-material';
import TournamentModal from './TournamentModal';

const TournamentHeader = ({ 
  tournaments, 
  currentTournament, 
  onSwitchTournament, 
  onCreateTournament,
  onDeleteTournament,
  onResetScores,
  onUpdateTournamentName,
  isLoggedIn 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const handleDeleteTournament = async () => {
    if (currentTournament) {
      await onDeleteTournament(currentTournament.id);
      setShowDeleteDialog(false);
    }
  };

  const handleResetScores = async () => {
    if (currentTournament) {
      await onResetScores(currentTournament.id);
      setShowResetDialog(false);
    }
  };

  const handleEditName = () => {
    setEditingName(true);
    setEditNameValue(currentTournament?.name || '');
  };

  const handleSaveName = async () => {
    if (editNameValue.trim() && currentTournament) {
      await onUpdateTournamentName(currentTournament.id, editNameValue.trim());
      setEditingName(false);
      setEditNameValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setEditNameValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Quản lý giải đấu
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateModal(true)}
            disabled={!isLoggedIn}
            sx={{ 
              fontWeight: 600,
              fontSize: '0.95rem',
              px: 3
            }}
          >
            Tạo giải đấu mới
          </Button>
        </Box>

        {isLoggedIn && tournaments.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 320 }}>
              <InputLabel sx={{ fontSize: '1rem', fontWeight: 500 }}>Chọn giải đấu</InputLabel>
              <Select
                value={currentTournament?.id || ''}
                onChange={(e) => onSwitchTournament(e.target.value)}
                label="Chọn giải đấu"
                sx={{ fontSize: '1rem' }}
              >
                {tournaments.map((tournament) => (
                  <MenuItem key={tournament.id} value={tournament.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: 500 }}>
                        {tournament.name}
                      </Typography>
                      <Chip 
                        label={`${tournament.settings.totalPairs} đội`} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontWeight: 600, borderWidth: 2 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        {(() => {
                          try {
                            if (tournament.settings?.tournamentDate) {
                              const date = new Date(tournament.settings.tournamentDate);
                              return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
                            } else {
                              const date = tournament.createdAt?.toDate ? tournament.createdAt.toDate() : new Date(tournament.createdAt);
                              return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
                            }
                          } catch (error) {
                            return 'N/A';
                          }
                        })()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {currentTournament && (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {editingName ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TextField
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      size="small"
                      autoFocus
                      sx={{ minWidth: 220, fontSize: '1rem' }}
                    />
                    <Button 
                      size="small" 
                      onClick={handleSaveName} 
                      color="primary"
                      variant="contained"
                      sx={{ fontWeight: 600 }}
                    >
                      Lưu
                    </Button>
                    <Button 
                      size="small" 
                      onClick={handleCancelEdit} 
                      color="error"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    >
                      Hủy
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleEditName}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  >
                    Sửa tên
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<Delete />}
                  onClick={() => setShowDeleteDialog(true)}
                  color="error"
                  size="small"
                  sx={{ fontWeight: 600 }}
                >
                  Xóa giải đấu
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => setShowResetDialog(true)}
                  color="warning"
                  size="small"
                  sx={{ fontWeight: 600 }}
                >
                  Đặt lại điểm
                </Button>
              </Box>
            )}
          </Box>
        )}


      </CardContent>

      {/* Create Tournament Modal */}
      <TournamentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTournament={onCreateTournament}
        isLoggedIn={isLoggedIn}
        loading={false}
      />

      {/* Delete Tournament Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>
          Xác nhận xóa giải đấu
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem', lineHeight: 1.6 }}>
            Bạn có chắc chắn muốn xóa giải đấu "{currentTournament?.name}"? 
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setShowDeleteDialog(false)}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteTournament} 
            color="error" 
            variant="contained"
            sx={{ fontWeight: 600 }}
          >
            Xóa giải đấu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Scores Dialog */}
      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle sx={{ fontWeight: 600, color: 'warning.main' }}>
          Xác nhận đặt lại điểm số
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem', lineHeight: 1.6 }}>
            Bạn có chắc chắn muốn đặt lại tất cả điểm số trong giải đấu "{currentTournament?.name}"? 
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setShowResetDialog(false)}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleResetScores} 
            color="warning" 
            variant="contained"
            sx={{ fontWeight: 600 }}
          >
            Đặt lại điểm
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TournamentHeader;
