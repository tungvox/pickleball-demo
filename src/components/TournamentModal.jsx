import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormHelperText,
  Tabs,
  Tab,
  TextareaAutosize,
  Chip,
  Alert
} from '@mui/material';

const TournamentModal = ({ open, onClose, onCreateTournament, isLoggedIn, loading }) => {
  const [settings, setSettings] = useState({
    tournamentName: '',
    tournamentDate: '',
    totalPairs: '',
    pairsPerGroup: '',
    teamsPerGroup: ''
  });
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [importedTeams, setImportedTeams] = useState([]);
  const [teamNamesText, setTeamNamesText] = useState('');
  const [importError, setImportError] = useState('');

  const validateSettings = () => {
    const newErrors = {};
    
    if (!settings.tournamentName || settings.tournamentName.trim() === '') {
      newErrors.tournamentName = 'Vui lòng nhập tên giải đấu';
    }
    
    if (!settings.tournamentDate || settings.tournamentDate === '') {
      newErrors.tournamentDate = 'Vui lòng chọn ngày tổ chức giải đấu';
    } else {
      const selectedDate = new Date(settings.tournamentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.tournamentDate = 'Ngày tổ chức không được trong quá khứ';
      }
    }
    
    if (activeTab === 0) {
      // Manual mode validation
      if (!settings.totalPairs || settings.totalPairs === '') {
        newErrors.totalPairs = 'Vui lòng nhập tổng số cặp đôi';
      } else if (parseInt(settings.totalPairs) < 2) {
        newErrors.totalPairs = 'Tổng số cặp phải từ 2 trở lên';
      }
    } else {
      // Import mode validation
      if (importedTeams.length < 2) {
        newErrors.importedTeams = 'Cần ít nhất 2 đội để tạo giải đấu';
      }
    }
    
    if (!settings.pairsPerGroup || settings.pairsPerGroup === '') {
      newErrors.pairsPerGroup = 'Vui lòng nhập số cặp mỗi bảng';
    } else if (parseInt(settings.pairsPerGroup) < 2) {
      newErrors.pairsPerGroup = 'Số cặp mỗi bảng phải từ 2 trở lên';
    }
    
    if (!settings.teamsPerGroup || settings.teamsPerGroup === '') {
      newErrors.teamsPerGroup = 'Vui lòng nhập số đội vào vòng loại trực tiếp';
    } else if (parseInt(settings.teamsPerGroup) < 1) {
      newErrors.teamsPerGroup = 'Số đội vào vòng loại trực tiếp phải từ 1 trở lên';
    }
    
    const totalPairs = activeTab === 0 ? parseInt(settings.totalPairs) : importedTeams.length;
    if (settings.pairsPerGroup && settings.teamsPerGroup && totalPairs &&
        parseInt(settings.teamsPerGroup) > parseInt(settings.pairsPerGroup)) {
      newErrors.teamsPerGroup = 'Số đội vào vòng loại trực tiếp không được vượt quá số cặp mỗi bảng';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImportTeams = () => {
    setImportError('');
    
    if (!teamNamesText.trim()) {
      setImportError('Vui lòng nhập danh sách tên đội');
      return;
    }

    // Parse team names from text
    const lines = teamNamesText.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      setImportError('Cần ít nhất 2 đội để tạo giải đấu');
      return;
    }

    // Remove duplicates and empty lines
    const uniqueTeams = [...new Set(lines)].filter(team => team.length > 0);
    
    if (uniqueTeams.length < 2) {
      setImportError('Cần ít nhất 2 đội khác nhau để tạo giải đấu');
      return;
    }

    // Create team objects
    const teams = uniqueTeams.map((name, index) => ({
      id: `P${index + 1}`,
      name: name.trim(),
      editable: true
    }));

    setImportedTeams(teams);
    setSettings(prev => ({ ...prev, totalPairs: teams.length.toString() }));
  };

  const handleCreateTournament = async () => {
    if (!validateSettings()) return;
    
    try {
      const tournamentSettings = {
        tournamentName: settings.tournamentName.trim(),
        tournamentDate: settings.tournamentDate,
        totalPairs: activeTab === 0 ? parseInt(settings.totalPairs) : importedTeams.length,
        pairsPerGroup: parseInt(settings.pairsPerGroup),
        teamsPerGroup: parseInt(settings.teamsPerGroup),
        customTeams: activeTab === 1 ? importedTeams : null
      };
      await onCreateTournament(tournamentSettings);
      handleClose();
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  const handleClose = () => {
    setSettings({
      tournamentName: '',
      tournamentDate: '',
      totalPairs: '',
      pairsPerGroup: '',
      teamsPerGroup: ''
    });
    setErrors({});
    setActiveTab(0);
    setImportedTeams([]);
    setTeamNamesText('');
    setImportError('');
    onClose();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setErrors({});
    setImportError('');
  };

  const totalPairs = activeTab === 0 ? parseInt(settings.totalPairs) : importedTeams.length;
  const isFormValid = settings.tournamentName && settings.tournamentName.trim() !== '' &&
                     settings.tournamentDate && settings.tournamentDate !== '' &&
                     settings.pairsPerGroup && settings.pairsPerGroup !== '' &&
                     settings.teamsPerGroup && settings.teamsPerGroup !== '' &&
                     totalPairs >= 2 && 
                     parseInt(settings.pairsPerGroup) >= 2 && 
                     parseInt(settings.teamsPerGroup) >= 1 &&
                     parseInt(settings.teamsPerGroup) <= parseInt(settings.pairsPerGroup) &&
                     (activeTab === 0 || importedTeams.length >= 2);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, color: 'primary.main', fontSize: '1.5rem' }}>
        Tạo giải đấu mới
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Tên giải đấu"
            value={settings.tournamentName}
            onChange={(e) => setSettings(prev => ({ ...prev, tournamentName: e.target.value }))}
            error={!!errors.tournamentName}
            helperText={errors.tournamentName}
            fullWidth
            sx={{ fontSize: '1rem' }}
          />
          
          <TextField
            label="Ngày tổ chức giải đấu"
            type="date"
            value={settings.tournamentDate}
            onChange={(e) => setSettings(prev => ({ ...prev, tournamentDate: e.target.value }))}
            error={!!errors.tournamentDate}
            helperText={errors.tournamentDate || 'Chọn ngày tổ chức giải đấu'}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: new Date().toISOString().split('T')[0]
            }}
            sx={{ fontSize: '1rem' }}
          />

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="tournament creation tabs">
              <Tab label="Tạo thủ công" />
              <Tab label="Nhập danh sách đội" />
            </Tabs>
          </Box>

          {activeTab === 0 ? (
            // Manual mode
            <TextField
              label="Tổng số cặp đôi"
              type="number"
              value={settings.totalPairs}
              onChange={(e) => setSettings(prev => ({ ...prev, totalPairs: e.target.value }))}
              error={!!errors.totalPairs}
              helperText={errors.totalPairs || 'Ví dụ: 8, 12, 16...'}
              fullWidth
              inputProps={{ min: 2 }}
              sx={{ fontSize: '1rem' }}
            />
          ) : (
            // Import mode
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Nhập danh sách tên đội (mỗi đội một dòng)
              </Typography>
              
              <TextareaAutosize
                minRows={5}
                maxRows={8}
                placeholder="Ví dụ:&#10;Đội A&#10;Đội B&#10;Đội C&#10;Đội D&#10;..."
                value={teamNamesText}
                onChange={(e) => setTeamNamesText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleImportTeams}
                  sx={{ fontWeight: 600 }}
                >
                  Nhập danh sách
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    setTeamNamesText('');
                    setImportedTeams([]);
                    setImportError('');
                  }}
                  sx={{ fontWeight: 600 }}
                >
                  Xóa
                </Button>
              </Box>

              {importError && (
                <Alert severity="error" sx={{ fontSize: '0.875rem' }}>
                  {importError}
                </Alert>
              )}

              {importedTeams.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Danh sách đội đã nhập ({importedTeams.length} đội):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {importedTeams.map((team, index) => (
                      <Chip
                        key={team.id}
                        label={`${index + 1}. ${team.name}`}
                        variant="outlined"
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
          
          <TextField
            label="Số cặp mỗi bảng"
            type="number"
            value={settings.pairsPerGroup}
            onChange={(e) => setSettings(prev => ({ ...prev, pairsPerGroup: e.target.value }))}
            error={!!errors.pairsPerGroup}
            helperText={errors.pairsPerGroup || 'Ví dụ: 4 cặp mỗi bảng'}
            fullWidth
            inputProps={{ min: 2 }}
            sx={{ fontSize: '1rem' }}
          />
          
          <TextField
            label="Số đội vào vòng loại trực tiếp"
            type="number"
            value={settings.teamsPerGroup}
            onChange={(e) => setSettings(prev => ({ ...prev, teamsPerGroup: e.target.value }))}
            error={!!errors.teamsPerGroup}
            helperText={errors.teamsPerGroup || 'Số đội từ mỗi bảng vào vòng loại trực tiếp'}
            fullWidth
            inputProps={{ min: 1 }}
            sx={{ fontSize: '1rem' }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        >
          Hủy
        </Button>
        <Button 
          onClick={handleCreateTournament}
          variant="contained"
          disabled={!isFormValid || loading}
          sx={{ fontWeight: 600 }}
        >
          {loading ? 'Đang tạo...' : 'Tạo giải đấu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TournamentModal;
