import { useState, useEffect, useCallback } from 'react';
import { NetworkUtils } from '../utils/networkUtils';

export const useNetwork = () => {
  const [networkInfo, setNetworkInfo] = useState({
    ip: 'localhost',
    port: '3000',
    protocol: 'http',
    fullUrl: 'http://localhost:3000',
    creatorUrl: 'http://localhost:3000/create',
    displayUrl: 'http://localhost:3000/display',
    adminUrl: 'http://localhost:3000/admin'
  });
  const [qrCodes, setQrCodes] = useState({
    create: '',
    display: '',
    admin: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const updateNetworkInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const info = await NetworkUtils.getNetworkInfo();
      setNetworkInfo(info);
      
      // Generate QR codes for all views
      const [createQR, displayQR, adminQR] = await Promise.all([
        NetworkUtils.createQRCodeForView('create'),
        NetworkUtils.createQRCodeForView('display'),
        NetworkUtils.createQRCodeForView('admin')
      ]);
      
      setQrCodes({
        create: createQR,
        display: displayQR,
        admin: adminQR
      });
    } catch (err) {
      console.error('Network detection failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getQRCode = useCallback(async (view = 'create', customOptions = {}) => {
    try {
      const qrCode = await NetworkUtils.createQRCodeForView(view, customOptions);
      setQrCodes(prev => ({ ...prev, [view]: qrCode }));
      return qrCode;
    } catch (err) {
      console.error('QR code generation failed:', err);
      throw err;
    }
  }, []);

  const testConnectivity = useCallback(async () => {
    try {
      const bestUrl = await NetworkUtils.getBestNetworkURL();
      return await NetworkUtils.testConnectivity(bestUrl);
    } catch (err) {
      console.error('Connectivity test failed:', err);
      return false;
    }
  }, []);

  const formatIPDisplay = useCallback((ip = networkInfo.ip) => {
    return NetworkUtils.formatIPDisplay(ip);
  }, [networkInfo.ip]);

  const refreshNetworkInfo = useCallback(() => {
    updateNetworkInfo();
  }, [updateNetworkInfo]);

  // Auto-detect network info on mount
  useEffect(() => {
    updateNetworkInfo();
  }, [updateNetworkInfo]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      updateNetworkInfo();
    };
    
    const handleOffline = () => {
      console.log('Network connection lost');
      setError('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateNetworkInfo]);

  return {
    // Network information
    networkInfo,
    ip: networkInfo.ip,
    port: networkInfo.port,
    fullUrl: networkInfo.fullUrl,
    creatorUrl: networkInfo.creatorUrl,
    displayUrl: networkInfo.displayUrl,
    adminUrl: networkInfo.adminUrl,
    
    // QR codes
    qrCodes,
    createQR: qrCodes.create,
    displayQR: qrCodes.display,
    adminQR: qrCodes.admin,
    
    // State
    loading,
    error,
    
    // Methods
    getQRCode,
    testConnectivity,
    formatIPDisplay,
    refreshNetworkInfo
  };
};

export default useNetwork;
