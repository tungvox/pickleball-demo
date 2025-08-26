import QRCode from 'qrcode';

/**
 * Generate QR code for group referee access
 * @param {string} tournamentId - Tournament ID
 * @param {string} groupId - Group ID
 * @param {string} baseUrl - Base URL of the application
 * @returns {Promise<string>} - QR code data URL
 */
export const generateGroupQRCode = async (tournamentId, groupId, baseUrl = window.location.origin) => {
  const groupUrl = `${baseUrl}/group/${tournamentId}/${groupId}`;
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(groupUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Không thể tạo mã QR');
  }
};

/**
 * Generate QR code for specific match access
 * @param {string} tournamentId - Tournament ID
 * @param {string} matchId - Match ID
 * @param {string} baseUrl - Base URL of the application
 * @returns {Promise<string>} - QR code data URL
 */
export const generateMatchQRCode = async (tournamentId, matchId, baseUrl = window.location.origin) => {
  const matchUrl = `${baseUrl}/match/${tournamentId}/${matchId}`;
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(matchUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Không thể tạo mã QR');
  }
};

/**
 * Generate QR code for knockout match access
 * @param {string} tournamentId - Tournament ID
 * @param {string} matchId - Knockout match ID
 * @param {string} baseUrl - Base URL of the application
 * @returns {Promise<string>} - QR code data URL
 */
export const generateKnockoutMatchQRCode = async (tournamentId, matchId, baseUrl = window.location.origin) => {
  const knockoutMatchUrl = `${baseUrl}/knockout/${tournamentId}/${matchId}`;
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(knockoutMatchUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating knockout match QR code:', error);
    throw new Error('Không thể tạo mã QR cho trận đấu loại trực tiếp');
  }
};

/**
 * Generate QR code for referee dashboard access
 * @param {string} tournamentId - Tournament ID
 * @param {string} baseUrl - Base URL of the application
 * @returns {Promise<string>} - QR code data URL
 */
export const generateRefereeDashboardQRCode = async (tournamentId, baseUrl = window.location.origin) => {
  const refereeUrl = `${baseUrl}/referee/${tournamentId}`;
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(refereeUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating referee dashboard QR code:', error);
    throw new Error('Không thể tạo mã QR cho bảng điều khiển trọng tài');
  }
};

/**
 * Parse group URL parameters
 * @param {string} url - URL to parse
 * @returns {Object|null} - Parsed parameters or null if invalid
 */
export const parseGroupUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    if (pathParts[1] === 'group' && pathParts.length === 4) {
      return {
        tournamentId: pathParts[2],
        groupId: pathParts[3]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing group URL:', error);
    return null;
  }
};

/**
 * Parse match URL parameters
 * @param {string} url - URL to parse
 * @returns {Object|null} - Parsed parameters or null if invalid
 */
export const parseMatchUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    if (pathParts[1] === 'match' && pathParts.length === 4) {
      return {
        tournamentId: pathParts[2],
        matchId: pathParts[3]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing match URL:', error);
    return null;
  }
};

/**
 * Parse knockout match URL parameters
 * @param {string} url - URL to parse
 * @returns {Object|null} - Parsed parameters or null if invalid
 */
export const parseKnockoutMatchUrl = (url) => {
  try {
    console.log('parseKnockoutMatchUrl called with:', url);
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    console.log('parseKnockoutMatchUrl pathParts:', pathParts);
    
    if (pathParts[1] === 'knockout' && pathParts.length === 4) {
      const result = {
        tournamentId: pathParts[2],
        matchId: pathParts[3]
      };
      console.log('parseKnockoutMatchUrl returning:', result);
      return result;
    }
    
    console.log('parseKnockoutMatchUrl returning null');
    return null;
  } catch (error) {
    console.error('Error parsing knockout match URL:', error);
    return null;
  }
};

/**
 * Generate group access URL
 * @param {string} tournamentId - Tournament ID
 * @param {string} groupId - Group ID
 * @param {string} baseUrl - Base URL
 * @returns {string} - Group access URL
 */
export const generateGroupUrl = (tournamentId, groupId, baseUrl = window.location.origin) => {
  return `${baseUrl}/group/${tournamentId}/${groupId}`;
};

/**
 * Generate match access URL
 * @param {string} tournamentId - Tournament ID
 * @param {string} matchId - Match ID
 * @param {string} baseUrl - Base URL
 * @returns {string} - Match access URL
 */
export const generateMatchUrl = (tournamentId, matchId, baseUrl = window.location.origin) => {
  return `${baseUrl}/match/${tournamentId}/${matchId}`;
};

/**
 * Generate knockout match access URL
 * @param {string} tournamentId - Tournament ID
 * @param {string} matchId - Knockout match ID
 * @param {string} baseUrl - Base URL
 * @returns {string} - Knockout match access URL
 */
export const generateKnockoutMatchUrl = (tournamentId, matchId, baseUrl = window.location.origin) => {
  return `${baseUrl}/knockout/${tournamentId}/${matchId}`;
};

/**
 * Parse referee dashboard URL parameters
 * @param {string} url - URL to parse
 * @returns {Object|null} - Parsed parameters or null if invalid
 */
export const parseRefereeDashboardUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    if (pathParts[1] === 'referee' && pathParts.length === 3) {
      return {
        tournamentId: pathParts[2]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing referee dashboard URL:', error);
    return null;
  }
};

/**
 * Generate referee dashboard access URL
 * @param {string} tournamentId - Tournament ID
 * @param {string} baseUrl - Base URL
 * @returns {string} - Referee dashboard access URL
 */
export const generateRefereeDashboardUrl = (tournamentId, baseUrl = window.location.origin) => {
  return `${baseUrl}/referee/${tournamentId}`;
};
