import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, SwitchCamera, Loader2 } from 'lucide-react';
import { useCamera } from '@/camera/useCamera';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    currentFacingMode,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    retry,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: 'environment',
    quality: 0.95,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if device is mobile
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      await stopCamera();
      onCapture(file);
    }
  };

  const handleCancel = async () => {
    await stopCamera();
    onCancel();
  };

  const handleSwitchCamera = async () => {
    await switchCamera();
  };

  if (isSupported === false) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            Camera is not supported on this device or browser.
          </AlertDescription>
        </Alert>
        <Button onClick={onCancel} variant="outline" className="w-full">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto max-h-[60vh] object-contain"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error.message}
            {error.type === 'permission' && ' Please allow camera access to continue.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>

        <div className="flex gap-2">
          {isMobile && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSwitchCamera}
              disabled={!isActive || isLoading}
            >
              <SwitchCamera className="h-4 w-4" />
            </Button>
          )}
          
          {error ? (
            <Button
              type="button"
              onClick={retry}
              disabled={isLoading}
              className="bg-brewers-navy hover:bg-brewers-navy/90"
            >
              Retry
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleCapture}
              disabled={!isActive || isLoading}
              className="bg-brewers-navy hover:bg-brewers-navy/90"
            >
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
