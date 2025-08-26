import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Paper,
  Alert
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  SportsTennis as TennisIcon
} from '@mui/icons-material';
import { generateRefereeDashboardQRCode, generateRefereeDashboardUrl } from '../utils/qrCodeUtils';

const QRCodeManager = ({ tournament, onUpdateMatch }) => {
  const [refereeQrCode, setRefereeQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  // Generate QR code for referee dashboard
  const generateRefereeQRCode = async () => {
    if (!tournament) return;

    setLoading(true);
    setError(null);

    try {
      const qrCode = await generateRefereeDashboardQRCode(tournament.id);
      setRefereeQrCode(qrCode);
    } catch (error) {
      setError('Không thể tạo mã QR cho bảng điều khiển trọng tài');
      console.error('Error generating referee QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open QR code dialog
  const openQRDialog = () => {
    setDialogOpen(true);
    
    // Generate QR code if not already generated
    if (!refereeQrCode) {
      generateRefereeQRCode();
    }
  };

  // Print QR code
  const printQRCode = () => {
    if (!refereeQrCode) return;

    const printWindow = window.open('', '_blank');
    const refereeUrl = generateRefereeDashboardUrl(tournament.id);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Mã QR Bảng điều khiển trọng tài</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              border: 2px solid #ccc;
              padding: 20px;
              display: inline-block;
              margin: 20px;
            }
            .qr-code {
              max-width: 300px;
              height: auto;
            }
            .tournament-info {
              margin: 10px 0;
              font-size: 18px;
              font-weight: bold;
            }
            .url-info {
              margin: 10px 0;
              font-size: 12px;
              color: #666;
              word-break: break-all;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="tournament-info">Bảng điều khiển trọng tài</div>
            <div class="tournament-info">${tournament.name}</div>
            <img src="${refereeQrCode}" alt="QR Code" class="qr-code" />
            <div class="url-info">${refereeUrl}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!refereeQrCode) return;

    const link = document.createElement('a');
    link.href = refereeQrCode;
    link.download = `qr-code-referee-dashboard-${tournament.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!tournament) {
    return (
      <Alert severity="info">
        Vui lòng chọn một giải đấu để quản lý mã QR
      </Alert>
    );
  }

  // Ensure we have valid data structures
  if (!Array.isArray(tournament.groups)) {
    return (
      <Alert severity="warning">
        Dữ liệu giải đấu chưa được tải hoàn toàn. Vui lòng thử lại.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <QrCodeIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Mã QR Bảng điều khiển trọng tài
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tạo mã QR duy nhất cho tất cả trọng tài truy cập vào bảng điều khiển
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<QrCodeIcon />}
            onClick={openQRDialog}
            disabled={loading}
          >
            {loading ? 'Đang tạo...' : 'Tạo mã QR'}
          </Button>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Referee Dashboard QR Code Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TennisIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Bảng điều khiển trọng tài
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Tất cả trọng tài sẽ sử dụng mã QR này để truy cập vào bảng điều khiển
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sau khi đăng nhập, họ sẽ thấy tất cả trận đấu được phân công (cả vòng bảng và loại trực tiếp)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              onClick={openQRDialog}
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : 'Xem mã QR'}
            </Button>
            
            {refereeQrCode && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={printQRCode}
                >
                  In
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadQRCode}
                >
                  Tải xuống
                </Button>
              </>
            )}
          </Box>

          {refereeQrCode && (
            <Chip 
              label="Đã tạo mã QR" 
              color="success" 
              size="small" 
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Mã QR Bảng điều khiển trọng tài
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {loading ? (
              <Box sx={{ py: 4 }}>
                <Typography>Đang tạo mã QR...</Typography>
              </Box>
            ) : refereeQrCode ? (
              <>
                <img 
                  src={refereeQrCode} 
                  alt="QR Code" 
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Quét mã QR này để truy cập vào bảng điều khiển trọng tài
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {generateRefereeDashboardUrl(tournament.id)}
                </Typography>
              </>
            ) : (
              <Typography color="error">
                Không thể tạo mã QR
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {refereeQrCode && (
            <>
              <Button 
                startIcon={<PrintIcon />}
                onClick={printQRCode}
              >
                In
              </Button>
              <Button 
                startIcon={<DownloadIcon />}
                onClick={downloadQRCode}
              >
                Tải xuống
              </Button>
            </>
          )}
          <Button onClick={() => setDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRCodeManager;
