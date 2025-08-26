import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import AppBar from './components/AppBar';
import TournamentHeader from './components/TournamentHeader';
import PairsList from './components/PairsList';
import GroupMatches from './components/GroupMatches';
import KnockoutBracket from './components/KnockoutBracket';
import QRCodeManager from './components/QRCodeManager';
import CourtScoreInput from './components/CourtScoreInput';
import KnockoutScoreInput from './components/KnockoutScoreInput';
import RefereeDashboard from './components/RefereeDashboard';
import TournamentAccess from './components/TournamentAccess';
import RefereeAssignment from './components/RefereeAssignment';
import AuthModal from './components/AuthModal';

import { useAuth } from './hooks/useAuth';
import { useTournament } from './hooks/useTournament';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { parseGroupUrl, parseKnockoutMatchUrl, parseRefereeDashboardUrl } from './utils/qrCodeUtils';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    surface: {
      main: '#fafafa',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    divider: '#e0e0e0',
    action: {
      hover: '#f5f5f5',
      selected: '#e3f2fd',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.9rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.8rem',
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.8rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: '0.8rem',
          fontWeight: 500,
          minHeight: 36,
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        },
        outlined: {
          borderWidth: 1,
          '&:hover': {
            borderWidth: 1,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontSize: '1rem',
            '&:focus-within': {
              boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.3)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '1rem',
          '&:focus-within': {
            boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.3)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontSize: '0.9rem',
            fontWeight: 500,
            borderColor: '#e0e0e0',
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            fontWeight: 600,
            backgroundColor: '#f5f5f5',
          },
        },
      },
    },
  },
  spacing: 8,
});

function App() {
  const { user, loading: authLoading } = useAuth();
  const {
    tournaments,
    currentTournament,
    loading: tournamentLoading,
    error: tournamentError,
    createTournament,
    updatePairName,
    updateTournamentName,
    updateGroupMatch,
    updateBracketMatch,
    switchTournament,
    deleteTournament,
    resetTournamentScores,
    addGroup,
    deleteGroup,
    addPlayer,
    deletePlayer,
    addAuthorizedEmail,
    removeAuthorizedEmail,
    assignRefereeToMatch,
    removeRefereeFromMatch,
    assignRefereeToKnockoutMatch,
    removeRefereeFromKnockoutMatch,
    addReferee,
    removeReferee
  } = useTournament(user);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Routing state
  const [currentTab, setCurrentTab] = useState(0);
  const [courtView, setCourtView] = useState(null);
  const [knockoutMatchView, setKnockoutMatchView] = useState(null);
  const [refereeDashboardView, setRefereeDashboardView] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Check if we're in group view mode, knockout match view mode, or referee dashboard mode
  useEffect(() => {
    const groupUrlParams = parseGroupUrl(window.location.href);
    const knockoutUrlParams = parseKnockoutMatchUrl(window.location.href);
    const refereeUrlParams = parseRefereeDashboardUrl(window.location.href);
    
    console.log('App.jsx routing - URL:', window.location.href);
    console.log('App.jsx routing - groupUrlParams:', groupUrlParams);
    console.log('App.jsx routing - knockoutUrlParams:', knockoutUrlParams);
    console.log('App.jsx routing - refereeUrlParams:', refereeUrlParams);
    
    if (refereeUrlParams) {
      console.log('App.jsx: Setting referee dashboard view');
      setRefereeDashboardView({
        tournamentId: refereeUrlParams.tournamentId
      });
      setCourtView(null);
      setKnockoutMatchView(null);
    } else if (groupUrlParams) {
      console.log('App.jsx: Setting court view');
      setCourtView({
        tournamentId: groupUrlParams.tournamentId,
        groupId: groupUrlParams.groupId
      });
      setKnockoutMatchView(null);
      setRefereeDashboardView(null);
    } else if (knockoutUrlParams) {
      console.log('App.jsx: Setting knockout match view');
      setKnockoutMatchView({
        tournamentId: knockoutUrlParams.tournamentId,
        matchId: knockoutUrlParams.matchId
      });
      setCourtView(null);
      setRefereeDashboardView(null);
    }
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Show success/error messages
  useEffect(() => {
    if (tournamentError) {
      setSnackbar({
        open: true,
        message: tournamentError,
        severity: 'error'
      });
    }
  }, [tournamentError]);

  const handleCreateTournament = async (settings) => {
    try {
      await createTournament(settings);
      setSnackbar({
        open: true,
        message: 'Tạo giải đấu thành công!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Lỗi khi tạo giải đấu',
        severity: 'error'
      });
    }
  };

  const handleUpdatePairName = async (pairId, newName) => {
    try {
      await updatePairName(pairId, newName);
      setSnackbar({
        open: true,
        message: 'Cập nhật tên đội thành công!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Lỗi khi cập nhật tên đội',
        severity: 'error'
      });
    }
  };

  const handleUpdateTournamentName = async (tournamentId, newName) => {
    try {
      await updateTournamentName(tournamentId, newName);
      setSnackbar({
        open: true,
        message: 'Cập nhật tên giải đấu thành công!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Lỗi khi cập nhật tên giải đấu',
        severity: 'error'
      });
    }
  };

  const handleUpdateGroupMatch = async (groupId, matchId, score1, score2, tournamentId) => {
    try {
      await updateGroupMatch(groupId, matchId, score1, score2, tournamentId);
      setSnackbar({
        open: true,
        message: 'Cập nhật kết quả trận đấu thành công!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Lỗi khi cập nhật kết quả trận đấu',
        severity: 'error'
      });
    }
  };

  const handleUpdateBracketMatch = async (matchId, score1, score2, setsPerMatch = null, setData = null, tournamentId = null) => {
    try {
      await updateBracketMatch(matchId, score1, score2, setsPerMatch, setData, tournamentId);
      setSnackbar({
        open: true,
        message: 'Cập nhật kết quả vòng loại trực tiếp thành công!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Lỗi khi cập nhật kết quả vòng loại trực tiếp',
        severity: 'error'
      });
    }
  };

  const handleBatchUpdateBracketMatches = async (updatedBracketMatches) => {
    try {
      // Get the round number and new sets per match value
      const roundNumber = updatedBracketMatches[0].round;
      const newSetsPerMatch = updatedBracketMatches[0].setsPerMatch;
      
      // Keep all matches except those in the edited round
      const matchesToKeep = currentTournament.bracketMatches.filter(match => match.round !== roundNumber);
      
      // Get the teams that should be in this round (from the updated matches)
      const roundTeams = updatedBracketMatches
        .filter(match => match.team1 || match.team2)
        .flatMap(match => [match.team1, match.team2])
        .filter(team => team !== null);
      
      // Regenerate matches for this round with the new sets per match
      const regeneratedMatches = [];
      const roundMatches = updatedBracketMatches.filter(match => match.round === roundNumber);
      
      roundMatches.forEach((match, index) => {
        regeneratedMatches.push({
          ...match,
          setsPerMatch: newSetsPerMatch,
          // Preserve teams if they exist
          team1: match.team1 || null,
          team2: match.team2 || null,
          // Clear scores when changing sets per match
          score1: '',
          score2: '',
          completed: false,
          winner: null,
          // Clear all set scores
          set1_team1: '',
          set1_team2: '',
          set2_team1: '',
          set2_team2: '',
          set3_team1: '',
          set3_team2: '',
          set4_team1: '',
          set4_team2: '',
          set5_team1: '',
          set5_team2: '',
          finalScore1: '',
          finalScore2: ''
        });
      });
      
      // Combine kept matches with regenerated matches
      const finalBracketMatches = [...matchesToKeep, ...regeneratedMatches];
      
      // Update the tournament
      const tournamentRef = doc(db, 'tournaments', currentTournament.id);
      await updateDoc(tournamentRef, {
        bracketMatches: finalBracketMatches,
        updatedAt: new Date()
      });

      // Refresh the tournament data
      await switchTournament(currentTournament.id);

      setSnackbar({
        open: true,
        message: 'Cập nhật số set cho vòng thành công!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error in batch update:', error);
      setSnackbar({
        open: true,
        message: `Lỗi khi cập nhật số set cho vòng: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenAuthModal = () => {
    setAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };

  const isLoading = authLoading || tournamentLoading;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar />
        
        <Container maxWidth="xl" sx={{ flexGrow: 1, py: 2 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Court Referee View - Always rendered but conditionally shown */}
              {courtView && (
                <CourtScoreInput
                  tournamentId={courtView.tournamentId}
                  groupId={courtView.groupId}
                  onUpdateMatch={handleUpdateGroupMatch}
                />
              )}

              {/* Knockout Match Referee View - Always rendered but conditionally shown */}
              {knockoutMatchView && (
                <>
                  {console.log('App.jsx: Rendering KnockoutScoreInput with:', knockoutMatchView)}
                  <KnockoutScoreInput
                    tournamentId={knockoutMatchView.tournamentId}
                    matchId={knockoutMatchView.matchId}
                    onUpdateMatch={handleUpdateBracketMatch}
                  />
                </>
              )}

              {/* Referee Dashboard View - Always rendered but conditionally shown */}
              {refereeDashboardView && (
                <>
                  {console.log('App.jsx: Rendering RefereeDashboard with:', refereeDashboardView)}
                  <RefereeDashboard
                    tournamentId={refereeDashboardView.tournamentId}
                    onUpdateMatch={handleUpdateGroupMatch}
                    onUpdateBracketMatch={handleUpdateBracketMatch}
                  />
                </>
              )}
              
              {/* Main Dashboard View - Always rendered but conditionally shown */}
              {!courtView && !knockoutMatchView && !refereeDashboardView && (
                <Box>
                  <TournamentHeader
                    tournaments={tournaments}
                    currentTournament={currentTournament}
                    onSwitchTournament={switchTournament}
                    onCreateTournament={handleCreateTournament}
                    onDeleteTournament={deleteTournament}
                    onResetScores={resetTournamentScores}
                    onUpdateTournamentName={updateTournamentName}
                    isLoggedIn={!!user}
                  />

                  {currentTournament ? (
                    <>
                      {/* Tabs for different views */}
                      <Paper sx={{ mb: 3 }}>
                        <Tabs 
                          value={currentTab} 
                          onChange={handleTabChange}
                          variant="scrollable"
                          scrollButtons="auto"
                          sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                                                <Tab label="Quản lý đội" />
                      <Tab label="Bảng đấu" />
                      <Tab label="Vòng loại trực tiếp" />
                      <Tab label="Mã QR trọng tài" />
                      <Tab label="Phân công trọng tài" />
                      <Tab label="Quản lý quyền truy cập" />
                        </Tabs>
                      </Paper>

                      {/* Tab content */}
                      {currentTab === 0 && (
                        <PairsList
                          key={`pairs-${currentTournament.pairs.length}`}
                          pairs={currentTournament.pairs}
                          groups={currentTournament.groups}
                          onUpdatePairName={handleUpdatePairName}
                          onAddGroup={addGroup}
                          onAddPlayer={addPlayer}
                          onDeleteGroup={deleteGroup}
                          onDeletePlayer={deletePlayer}
                          isLoggedIn={!!user}
                        />
                      )}

                      {currentTab === 1 && (
                        <GroupMatches
                          groups={currentTournament.groups}
                          groupMatches={currentTournament.groupMatches}
                          standings={currentTournament.standings}
                          onUpdateMatch={handleUpdateGroupMatch}
                          onDeletePlayer={deletePlayer}
                          isLoggedIn={!!user}
                        />
                      )}

                      {currentTab === 2 && (
                        <KnockoutBracket
                          bracketMatches={currentTournament.bracketMatches}
                          onUpdateMatch={handleUpdateBracketMatch}
                          onBatchUpdateMatches={handleBatchUpdateBracketMatches}
                          isLoggedIn={!!user}
                        />
                      )}

                      {currentTab === 3 && (
                        <QRCodeManager
                          tournament={currentTournament}
                          onUpdateMatch={handleUpdateGroupMatch}
                        />
                      )}
                      
                      {currentTab === 4 && (
                        <RefereeAssignment
                          tournament={currentTournament}
                          onAssignReferee={assignRefereeToMatch}
                          onRemoveReferee={removeRefereeFromMatch}
                          onAssignKnockoutReferee={assignRefereeToKnockoutMatch}
                          onRemoveKnockoutReferee={removeRefereeFromKnockoutMatch}
                        />
                      )}
                      
                      {currentTab === 5 && (
                        <TournamentAccess
                          tournament={{
                            ...currentTournament,
                            currentUserUid: user?.uid,
                            currentUserEmail: user?.email
                          }}
                          onAddAuthorizedEmail={addAuthorizedEmail}
                          onRemoveAuthorizedEmail={removeAuthorizedEmail}
                        />
                      )}
                    </>
                  ) : (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 600, mb: 3 }}>
                        {user ? 'Chưa có giải đấu nào. Vui lòng tạo giải đấu mới.' : 'Vui lòng đăng nhập để quản lý giải đấu.'}
                      </Typography>
                      {!user && (
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleOpenAuthModal}
                          sx={{ px: 4, py: 1.5 }}
                        >
                          Đăng nhập
                        </Button>
                      )}
                    </Paper>
                  )}
                </Box>
              )}
            </>
          )}
        </Container>

        {/* Auth Modal */}
        <AuthModal
          open={authModalOpen}
          onClose={handleCloseAuthModal}
          title="Đăng nhập"
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
