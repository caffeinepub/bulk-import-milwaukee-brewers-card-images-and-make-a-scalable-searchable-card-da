import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Camera, Upload, X, RefreshCw, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { ExternalBlob } from '@/backend';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import CameraCapture from './CameraCapture';
import { recognizeCard } from '@/lib/cardRecognition';

interface ImageRecognitionFormProps {
  onSubmit: (data: {
    playerName: string;
    year: number;
    brand: string;
    serialNumber: string | null;
    cardNumber: string | null;
    cardSeries: string | null;
    notes: string | null;
    image: ExternalBlob;
    recognitionConfidence: number | null;
    isRookieCard: boolean;
    isAutographed: boolean;
  }) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

interface FieldState {
  value: string;
  confidence: number | null;
  isUncertain: boolean;
}

export default function ImageRecognitionForm({ onSubmit, isSubmitting, onCancel }: ImageRecognitionFormProps) {
  const [captureMode, setCaptureMode] = useState<'upload' | 'camera' | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionComplete, setRecognitionComplete] = useState(false);
  const [recognitionMethod, setRecognitionMethod] = useState<'primary' | 'fallback' | 'failed' | null>(null);
  const [overallConfidence, setOverallConfidence] = useState<number | null>(null);
  
  const [playerName, setPlayerName] = useState<FieldState>({ value: '', confidence: null, isUncertain: false });
  const [year, setYear] = useState<FieldState>({ value: '', confidence: null, isUncertain: false });
  const [brand, setBrand] = useState<FieldState>({ value: '', confidence: null, isUncertain: false });
  const [cardSeries, setCardSeries] = useState<FieldState>({ value: '', confidence: null, isUncertain: false });
  
  const [serialNumber, setSerialNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isRookieCard, setIsRookieCard] = useState(false);
  const [isAutographed, setIsAutographed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageSelected = async (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setCaptureMode(null);

    // Automatically start recognition
    await recognizeImage(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelected(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    handleImageSelected(file);
  };

  const recognizeImage = async (file: File) => {
    setIsRecognizing(true);
    setRecognitionComplete(false);
    
    try {
      const result = await recognizeCard(file);
      
      if (result.success && result.fields) {
        // Set field values with confidence indicators
        const uncertaintyThreshold = 0.6;
        
        if (result.fields.playerName) {
          setPlayerName({
            value: result.fields.playerName.value,
            confidence: result.fields.playerName.confidence,
            isUncertain: result.fields.playerName.confidence < uncertaintyThreshold,
          });
        }
        
        if (result.fields.year) {
          setYear({
            value: result.fields.year.value,
            confidence: result.fields.year.confidence,
            isUncertain: result.fields.year.confidence < uncertaintyThreshold,
          });
        }
        
        if (result.fields.brand) {
          setBrand({
            value: result.fields.brand.value,
            confidence: result.fields.brand.confidence,
            isUncertain: result.fields.brand.confidence < uncertaintyThreshold,
          });
        }
        
        if (result.fields.cardSeries) {
          setCardSeries({
            value: result.fields.cardSeries.value,
            confidence: result.fields.cardSeries.confidence,
            isUncertain: result.fields.cardSeries.confidence < uncertaintyThreshold,
          });
        }
        
        setOverallConfidence(result.overallConfidence);
        setRecognitionMethod(result.method);
        setRecognitionComplete(true);
        
        // Show appropriate toast based on confidence
        if (result.overallConfidence >= 0.7) {
          toast.success('Card recognized with high confidence! Please review the details.');
        } else if (result.overallConfidence >= 0.5) {
          toast.warning('Card recognized with medium confidence. Please verify uncertain fields highlighted in yellow.');
        } else {
          toast.warning('Low confidence recognition. Please carefully review all fields before saving.');
        }
      } else {
        toast.error(result.error || 'Failed to recognize card. Please enter details manually.');
        setOverallConfidence(0);
        setRecognitionMethod('failed');
      }
    } catch (error) {
      console.error('Recognition error:', error);
      toast.error('Recognition failed. Please enter details manually.');
      setOverallConfidence(0);
      setRecognitionMethod('failed');
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleRetryRecognition = async () => {
    if (imageFile) {
      await recognizeImage(imageFile);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    setRecognitionComplete(false);
    setRecognitionMethod(null);
    setOverallConfidence(null);
    setPlayerName({ value: '', confidence: null, isUncertain: false });
    setYear({ value: '', confidence: null, isUncertain: false });
    setBrand({ value: '', confidence: null, isUncertain: false });
    setCardSeries({ value: '', confidence: null, isUncertain: false });
    setSerialNumber('');
    setCardNumber('');
    setNotes('');
    setIsRookieCard(false);
    setIsAutographed(false);
    setCaptureMode(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.value.trim() || !year.value || !brand.value.trim() || !imageFile) {
      toast.error('Please fill in all required fields');
      return;
    }

    const yearNum = parseInt(year.value);
    if (isNaN(yearNum) || yearNum < 1800 || yearNum > new Date().getFullYear() + 1) {
      toast.error('Please enter a valid year');
      return;
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
      setUploadProgress(percentage);
    });

    await onSubmit({
      playerName: playerName.value.trim(),
      year: yearNum,
      brand: brand.value.trim(),
      serialNumber: serialNumber.trim() || null,
      cardNumber: cardNumber.trim() || null,
      cardSeries: cardSeries.value.trim() || null,
      notes: notes.trim() || null,
      image: blob,
      recognitionConfidence: overallConfidence,
      isRookieCard,
      isAutographed,
    });

    // Reset form
    handleRemoveImage();
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (confidence === null) return null;
    
    if (confidence >= 0.7) {
      return (
        <Badge variant="default" className="ml-2 bg-green-600 hover:bg-green-600">
          {Math.round(confidence * 100)}%
        </Badge>
      );
    } else if (confidence >= 0.5) {
      return (
        <Badge variant="secondary" className="ml-2 bg-yellow-500 text-white hover:bg-yellow-500">
          {Math.round(confidence * 100)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="ml-2">
          {Math.round(confidence * 100)}%
        </Badge>
      );
    }
  };

  if (captureMode === 'camera') {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setCaptureMode(null)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!imagePreview ? (
        <div className="space-y-4">
          <Label className="required">Choose Image Source</Label>
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-32 flex flex-col gap-2"
              onClick={() => setCaptureMode('camera')}
            >
              <Camera className="h-8 w-8" />
              <span>Use Camera</span>
            </Button>
            <label className="cursor-pointer">
              <div className="h-32 flex flex-col gap-2 items-center justify-center border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8" />
                <span>Upload Image</span>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Card Image</Label>
            <div className="relative">
              <img
                src={imagePreview}
                alt="Card preview"
                className="w-full max-w-xs rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2"
                onClick={handleRemoveImage}
                disabled={isRecognizing}
              >
                <X className="h-4 w-4" />
              </Button>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">Uploading: {uploadProgress}%</p>
                </div>
              )}
            </div>
          </div>

          {isRecognizing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Analyzing card with advanced recognition... This may take a few moments.
              </AlertDescription>
            </Alert>
          )}

          {recognitionComplete && overallConfidence !== null && (
            <Alert className={
              overallConfidence >= 0.7 
                ? 'border-green-500 bg-green-50' 
                : overallConfidence >= 0.5 
                ? 'border-yellow-500 bg-yellow-50' 
                : 'border-red-500 bg-red-50'
            }>
              {overallConfidence >= 0.7 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : overallConfidence >= 0.5 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      Recognition complete with{' '}
                      <Badge variant={overallConfidence >= 0.7 ? 'default' : 'secondary'} className={
                        overallConfidence >= 0.7 
                          ? 'bg-green-600 hover:bg-green-600' 
                          : overallConfidence >= 0.5 
                          ? 'bg-yellow-500 hover:bg-yellow-500 text-white' 
                          : ''
                      }>
                        {Math.round(overallConfidence * 100)}% confidence
                      </Badge>
                    </span>
                    {recognitionMethod && recognitionMethod !== 'failed' && (
                      <Badge variant="outline" className="text-xs">
                        {recognitionMethod === 'primary' ? 'Primary AI' : 'Fallback OCR'}
                      </Badge>
                    )}
                  </div>
                  {overallConfidence < 0.7 && (
                    <span className="text-xs text-muted-foreground">
                      Fields with low confidence are highlighted. Please review and correct as needed.
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRetryRecognition}
                  disabled={isRecognizing}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="playerName" className="required flex items-center">
                Player Name
                {getConfidenceBadge(playerName.confidence)}
              </Label>
              <Input
                id="playerName"
                placeholder="e.g., Robin Yount"
                value={playerName.value}
                onChange={(e) => setPlayerName({ ...playerName, value: e.target.value })}
                required
                disabled={isRecognizing}
                className={playerName.isUncertain ? 'border-yellow-500 bg-yellow-50 focus-visible:ring-yellow-500' : ''}
              />
              {playerName.isUncertain && (
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Low confidence - please verify
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="required flex items-center">
                Year
                {getConfidenceBadge(year.confidence)}
              </Label>
              <Input
                id="year"
                type="number"
                placeholder="e.g., 1989"
                value={year.value}
                onChange={(e) => setYear({ ...year, value: e.target.value })}
                min="1800"
                max={new Date().getFullYear() + 1}
                required
                disabled={isRecognizing}
                className={year.isUncertain ? 'border-yellow-500 bg-yellow-50 focus-visible:ring-yellow-500' : ''}
              />
              {year.isUncertain && (
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Low confidence - please verify
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand" className="required flex items-center">
              Brand
              {getConfidenceBadge(brand.confidence)}
            </Label>
            <Input
              id="brand"
              placeholder="e.g., Topps, Upper Deck, Panini"
              value={brand.value}
              onChange={(e) => setBrand({ ...brand, value: e.target.value })}
              required
              disabled={isRecognizing}
              className={brand.isUncertain ? 'border-yellow-500 bg-yellow-50 focus-visible:ring-yellow-500' : ''}
            />
            {brand.isUncertain && (
              <p className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Low confidence - please verify
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number (Optional)</Label>
              <Input
                id="serialNumber"
                placeholder="e.g., 23/99"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                disabled={isRecognizing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number (Optional)</Label>
              <Input
                id="cardNumber"
                placeholder="e.g., #123"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                disabled={isRecognizing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardSeries" className="flex items-center">
              Card Series (Optional)
              {getConfidenceBadge(cardSeries.confidence)}
            </Label>
            <Input
              id="cardSeries"
              placeholder="e.g., Stadium Club, Chrome"
              value={cardSeries.value}
              onChange={(e) => setCardSeries({ ...cardSeries, value: e.target.value })}
              disabled={isRecognizing}
              className={cardSeries.isUncertain ? 'border-yellow-500 bg-yellow-50 focus-visible:ring-yellow-500' : ''}
            />
            {cardSeries.isUncertain && (
              <p className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Low confidence - please verify
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRookieCard"
                checked={isRookieCard}
                onCheckedChange={(checked) => setIsRookieCard(checked === true)}
                disabled={isRecognizing}
                className="border-brewers-navy data-[state=checked]:bg-brewers-gold data-[state=checked]:text-brewers-navy data-[state=checked]:border-brewers-gold"
              />
              <Label
                htmlFor="isRookieCard"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Rookie Card
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAutographed"
                checked={isAutographed}
                onCheckedChange={(checked) => setIsAutographed(checked === true)}
                disabled={isRecognizing}
                className="border-brewers-navy data-[state=checked]:bg-brewers-gold data-[state=checked]:text-brewers-navy data-[state=checked]:border-brewers-gold"
              />
              <Label
                htmlFor="isAutographed"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Autographed
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this card..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isRecognizing}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isRecognizing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isRecognizing || !playerName.value || !year.value || !brand.value || !imageFile}
              className="bg-brewers-navy hover:bg-brewers-navy/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Card'
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
