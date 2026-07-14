'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, X, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (pairingCode: string) => void;
  onClose?: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const qrReaderRef = useRef<Html5Qrcode | null>(null);

  // Initialize and start scanner
  useEffect(() => {
    const qrRegionId = "qr-reader-element";
    
    const startScanning = async () => {
      try {
        const qrScanner = new Html5Qrcode(qrRegionId);
        qrReaderRef.current = qrScanner;

        // Try getting cameras list
        let devices: any[] = [];
        try {
          devices = await Html5Qrcode.getCameras();
          setCameras(devices);
        } catch (e) {
          console.warn("Could not retrieve camera list, using default face mode:", e);
        }

        // Find environment camera if available
        const config = {
          fps: 10,
          qrbox: (width: number, height: number) => {
            const size = Math.min(width, height) * 0.65;
            return { width: size, height: size };
          }
        };

        const successCallback = (decodedText: string) => {
          console.log("[QRScanner] Decoded QR:", decodedText);
          
          // Parse pairing code from scanned URL
          // Expected: .../pair/123456 or .../pair/123-456
          const match = decodedText.match(/\/pair\/([0-9a-zA-Z\-]+)/);
          if (match && match[1]) {
            const cleanCode = match[1].replace('-', '');
            // Stop scanner and trigger success
            stopScanning().then(() => {
              onScanSuccess(cleanCode);
            });
          } else {
            // Attempt to treat the entire text as pairing code if it is numeric and 6 digits
            const trimmed = decodedText.trim();
            if (/^[0-9a-zA-Z]{6}$/.test(trimmed)) {
              stopScanning().then(() => {
                onScanSuccess(trimmed);
              });
            } else {
              setError("Invalid QR code. Please scan the QR code displayed on your laptop screen.");
            }
          }
        };

        // If we have cameras, try the back one, else use facingMode
        if (devices.length > 0) {
          const backCam = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('environment')
          );
          const activeCameraId = backCam ? backCam.id : devices[0].id;
          const matchedIndex = devices.findIndex(d => d.id === activeCameraId);
          setCurrentCameraIndex(matchedIndex >= 0 ? matchedIndex : 0);

          await qrScanner.start(
            activeCameraId,
            config,
            successCallback,
            (errorMessage) => { /* Silent failure for continuous scans */ }
          );
        } else {
          await qrScanner.start(
            { facingMode: "environment" },
            config,
            successCallback,
            (errorMessage) => { /* Silent failure for continuous scans */ }
          );
        }

        setIsScanning(true);
        setError(null);
      } catch (err: any) {
        console.error("QR Scanner initialization error:", err);
        setError("Camera access is required for scanning. Please allow camera permissions and refresh.");
        setIsScanning(false);
      }
    };

    startScanning();

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanning = async () => {
    if (qrReaderRef.current && qrReaderRef.current.isScanning) {
      try {
        await qrReaderRef.current.stop();
        console.log("[QRScanner] Scanner stopped successfully");
      } catch (e) {
        console.error("[QRScanner] Failed to stop scanner:", e);
      }
    }
    setIsScanning(false);
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1 || !qrReaderRef.current) return;
    
    try {
      await stopScanning();
      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);
      const nextCameraId = cameras[nextIndex].id;

      const config = {
        fps: 10,
        qrbox: (width: number, height: number) => {
          const size = Math.min(width, height) * 0.65;
          return { width: size, height: size };
        }
      };

      await qrReaderRef.current.start(
        nextCameraId,
        config,
        (decodedText: string) => {
          const match = decodedText.match(/\/pair\/([0-9a-zA-Z\-]+)/);
          if (match && match[1]) {
            const cleanCode = match[1].replace('-', '');
            stopScanning().then(() => onScanSuccess(cleanCode));
          } else {
            const trimmed = decodedText.trim();
            if (/^[0-9a-zA-Z]{6}$/.test(trimmed)) {
              stopScanning().then(() => onScanSuccess(trimmed));
            } else {
              setError("Invalid QR code. Please scan the QR code displayed on your laptop screen.");
            }
          }
        },
        (errorMessage) => {}
      );
      setIsScanning(true);
      setError(null);
    } catch (e) {
      console.error("Camera switch error:", e);
      setError("Failed to switch camera.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm mx-auto shadow-2xl relative overflow-hidden">
      {/* Header controls */}
      <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <span className="text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-indigo-400" />
          Align QR Code
        </span>
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <button
              onClick={handleSwitchCamera}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Switch Camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Viewfinder */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
        {/* html5-qrcode element */}
        <div id="qr-reader-element" className="w-full h-full" />
        
        {/* Overlay guides */}
        {isScanning && !error && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
            <div className="flex justify-between">
              <div className="w-5 h-5 border-t-2 border-l-2 border-indigo-400" />
              <div className="w-5 h-5 border-t-2 border-r-2 border-indigo-400" />
            </div>
            
            {/* Center pulsing line */}
            <div className="w-full h-[1px] bg-indigo-500/50 animate-pulse" />
            
            <div className="flex justify-between">
              <div className="w-5 h-5 border-b-2 border-l-2 border-indigo-400" />
              <div className="w-5 h-5 border-b-2 border-r-2 border-indigo-400" />
            </div>
          </div>
        )}

        {/* Not scanning / Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-slate-300 text-xs leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      <p className="text-slate-500 text-[10px] text-center mt-3 leading-relaxed">
        Align the QR code from your laptop screen within the brackets to automatically pair the device.
      </p>
    </div>
  );
}
