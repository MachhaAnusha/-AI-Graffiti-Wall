import QRCode from 'qrcode';

/**
 * Network utilities for IP detection and QR code generation
 */
export class NetworkUtils {
  static async getLocalIPAddress() {
    try {
      // Method 1: Using WebRTC to get local IP
      const localIP = await this.getWebRTCIP();
      if (localIP && localIP !== '127.0.0.1' && localIP !== '::1') {
        return localIP;
      }
      
      // Method 2: Fallback to window.location for development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'localhost';
      }
      
      // Method 3: Use current hostname
      return window.location.hostname;
    } catch (error) {
      console.warn('Failed to detect local IP:', error);
      return 'localhost';
    }
  }

  static async getWebRTCIP() {
    return new Promise((resolve, reject) => {
      const rtc = new RTCPeerConnection({ iceServers: [] });
      const localCandidates = [];
      
      rtc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch) {
            const ip = ipMatch[1];
            if (!localCandidates.includes(ip)) {
              localCandidates.push(ip);
              // Prefer private network IPs
              if (this.isPrivateIP(ip)) {
                resolve(ip);
                rtc.close();
                return;
              }
            }
          }
        } else {
          // ICE gathering complete
          if (localCandidates.length > 0) {
            resolve(localCandidates[0]);
          } else {
            reject(new Error('No local IP found'));
          }
          rtc.close();
        }
      };
      
      rtc.createDataChannel('test');
      rtc.createOffer()
        .then(offer => rtc.setLocalDescription(offer))
        .catch(reject);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        rtc.close();
        reject(new Error('IP detection timeout'));
      }, 5000);
    });
  }

  static isPrivateIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fe80:/
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  static async generateQRCode(url, options = {}) {
    const defaultOptions = {
      width: 256,
      margin: 2,
      color: {
        dark: '#FFE500', // Neon yellow
        light: '#000000' // Black background
      },
      errorCorrectionLevel: 'L'
    };
    
    const qrOptions = { ...defaultOptions, ...options };
    
    try {
      const qrDataUrl = await QRCode.toDataURL(url, qrOptions);
      return qrDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('QR code generation failed');
    }
  }

  static async getNetworkInfo() {
    const localIP = await this.getLocalIPAddress();
    const port = window.location.port || '3000';
    const protocol = window.location.protocol;
    
    return {
      ip: localIP,
      port: port,
      protocol: protocol.replace(':', ''),
      fullUrl: `${protocol}//${localIP}:${port}`,
      creatorUrl: `${protocol}//${localIP}:${port}/create`,
      displayUrl: `${protocol}//${localIP}:${port}/display`,
      adminUrl: `${protocol}//${localIP}:${port}/admin`
    };
  }

  static async createQRCodeForView(view = 'create', customOptions = {}) {
    const networkInfo = await this.getNetworkInfo();
    const url = networkInfo[`${view}Url`] || networkInfo.creatorUrl;
    
    const viewOptions = {
      create: {
        width: 256,
        color: { dark: '#FFE500', light: '#000000' }
      },
      display: {
        width: 256,
        color: { dark: '#00F5FF', light: '#000000' }
      },
      admin: {
        width: 256,
        color: { dark: '#FF006E', light: '#000000' }
      }
    };
    
    const options = { ...viewOptions[view], ...customOptions };
    return this.generateQRCode(url, options);
  }

  static formatIPDisplay(ip) {
    if (ip === 'localhost') {
      return 'localhost (local)';
    }
    
    if (this.isPrivateIP(ip)) {
      return `${ip} (local network)`;
    }
    
    return `${ip} (external)`;
  }

  static async testConnectivity(url) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch (error) {
      console.warn('Connectivity test failed:', error);
      return false;
    }
  }

  static async getBestNetworkURL() {
    const networkInfo = await this.getNetworkInfo();
    
    // Test different URL variations to find the best one
    const urls = [
      networkInfo.fullUrl,
      `http://localhost:${networkInfo.port}`,
      `http://127.0.0.1:${networkInfo.port}`
    ];
    
    for (const url of urls) {
      if (await this.testConnectivity(url)) {
        return url;
      }
    }
    
    return networkInfo.fullUrl; // Fallback
  }
}

export default NetworkUtils;
