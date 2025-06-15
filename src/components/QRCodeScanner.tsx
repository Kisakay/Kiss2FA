import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { Camera, X } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const webcamRef = useRef<Webcam>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Get available camera devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        // Select back camera by default if available (for mobile)
        const rearCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('arrière')
        );
        
        if (rearCamera) {
          setSelectedDeviceId(rearCamera.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error accessing camera devices:', err);
        setError('Unable to access cameras. Please check permissions.');
      }
    };
    
    getDevices();
  }, []);

  // Function to analyze webcam images
  const scanQRCode = useCallback(() => {
    if (!scanning) return;
    
    const interval = setInterval(() => {
      if (webcamRef.current) {
        const video = webcamRef.current.video;
        if (video && video.readyState === 4) {
          // Create a canvas to capture the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Analyze QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          
          if (code) {
            // QR code detected
            setScanning(false);
            clearInterval(interval);
            onScan(code.data);
          }
        }
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [scanning, onScan]);

  // Start scanning once the webcam is ready
  useEffect(() => {
    const cleanup = scanQRCode();
    return () => {
      if (cleanup) cleanup();
    };
  }, [scanQRCode]);

  // Change camera
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeviceId(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Scan QR Code
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 text-red-800 dark:text-red-300">
              {error}
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  videoConstraints={{
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                    facingMode: selectedDeviceId ? undefined : 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-white border-opacity-50 rounded-lg pointer-events-none"></div>
              </div>
              
              {devices.length > 1 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select a camera
                  </label>
                  <select
                    value={selectedDeviceId}
                    onChange={handleDeviceChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${devices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Position the QR code in the center of the camera to scan it automatically.
              </p>
            </>
          )}
        </div>
        
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
