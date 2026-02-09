import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, X } from 'lucide-react';
import { ExternalBlob } from '@/backend';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface ManualCardFormProps {
  onSubmit: (data: {
    playerName: string;
    year: number;
    brand: string;
    serialNumber: string | null;
    cardNumber: string | null;
    cardSeries: string | null;
    notes: string | null;
    image: ExternalBlob;
    recognitionConfidence?: number | null;
    isRookieCard: boolean;
    isAutographed: boolean;
  }) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export default function ManualCardForm({ onSubmit, isSubmitting, onCancel }: ManualCardFormProps) {
  const [playerName, setPlayerName] = useState('');
  const [year, setYear] = useState('');
  const [brand, setBrand] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardSeries, setCardSeries] = useState('');
  const [notes, setNotes] = useState('');
  const [isRookieCard, setIsRookieCard] = useState(false);
  const [isAutographed, setIsAutographed] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim() || !year || !brand.trim() || !imageFile) {
      toast.error('Please fill in all required fields');
      return;
    }

    const yearNum = parseInt(year);
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
      playerName: playerName.trim(),
      year: yearNum,
      brand: brand.trim(),
      serialNumber: serialNumber.trim() || null,
      cardNumber: cardNumber.trim() || null,
      cardSeries: cardSeries.trim() || null,
      notes: notes.trim() || null,
      image: blob,
      recognitionConfidence: null,
      isRookieCard,
      isAutographed,
    });

    // Reset form
    setPlayerName('');
    setYear('');
    setBrand('');
    setSerialNumber('');
    setCardNumber('');
    setCardSeries('');
    setNotes('');
    setIsRookieCard(false);
    setIsAutographed(false);
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="image" className="required">Card Image</Label>
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-w-xs rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2"
              onClick={handleRemoveImage}
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
        ) : (
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="image"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input
                id="image"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="playerName" className="required">Player Name</Label>
          <Input
            id="playerName"
            placeholder="e.g., Robin Yount"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year" className="required">Year</Label>
          <Input
            id="year"
            type="number"
            placeholder="e.g., 1989"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="1800"
            max={new Date().getFullYear() + 1}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand" className="required">Brand</Label>
        <Input
          id="brand"
          placeholder="e.g., Topps, Upper Deck, Panini"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number (Optional)</Label>
          <Input
            id="serialNumber"
            placeholder="e.g., 23/99"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardNumber">Card Number (Optional)</Label>
          <Input
            id="cardNumber"
            placeholder="e.g., #123"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardSeries">Card Series (Optional)</Label>
        <Input
          id="cardSeries"
          placeholder="e.g., Stadium Club, Chrome"
          value={cardSeries}
          onChange={(e) => setCardSeries(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isRookieCard"
            checked={isRookieCard}
            onCheckedChange={(checked) => setIsRookieCard(checked === true)}
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
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !playerName || !year || !brand || !imageFile}
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
    </form>
  );
}
