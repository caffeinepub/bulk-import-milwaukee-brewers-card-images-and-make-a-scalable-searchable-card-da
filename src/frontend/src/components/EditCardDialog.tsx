import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, X } from 'lucide-react';
import { useUpdateCard } from '@/hooks/useQueries';
import { ExternalBlob } from '@/backend';
import type { CardMetadata } from '@/backend';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface EditCardDialogProps {
  card: CardMetadata;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCardDialog({ card, open, onOpenChange }: EditCardDialogProps) {
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

  const updateCard = useUpdateCard();

  useEffect(() => {
    if (card && open) {
      setPlayerName(card.playerName);
      setYear(card.year.toString());
      setBrand(card.brand);
      setSerialNumber(card.serialNumber || '');
      setCardNumber(card.cardNumber || '');
      setCardSeries(card.cardSeries || '');
      setNotes(card.notes || '');
      setIsRookieCard(card.isRookieCard);
      setIsAutographed(card.isAutographed);
      setImagePreview(card.image.getDirectURL());
      setImageFile(null);
      setUploadProgress(0);
    }
  }, [card, open]);

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

  const handleRemoveNewImage = () => {
    setImageFile(null);
    setImagePreview(card.image.getDirectURL());
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim() || !year || !brand.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1800 || yearNum > new Date().getFullYear() + 1) {
      toast.error('Please enter a valid year');
      return;
    }

    try {
      let imageBlob: ExternalBlob;

      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        imageBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      } else {
        imageBlob = card.image;
      }

      await updateCard.mutateAsync({
        id: card.id,
        year: yearNum,
        playerName: playerName.trim(),
        brand: brand.trim(),
        serialNumber: serialNumber.trim() || null,
        cardNumber: cardNumber.trim() || null,
        cardSeries: cardSeries.trim() || null,
        notes: notes.trim() || null,
        image: imageBlob,
        recognitionConfidence: card.recognitionConfidence,
        isRookieCard,
        isAutographed,
        team: card.team || 'Milwaukee Brewers',
      });

      toast.success('Card updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update card');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-brewers-navy">Edit Card</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-image">Card Image</Label>
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-w-xs rounded-lg border"
                />
                {imageFile && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={handleRemoveNewImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="mt-1 text-xs text-muted-foreground">Uploading: {uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <label
                htmlFor="edit-image"
                className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span className="text-sm">Replace Image</span>
              </label>
              <input
                id="edit-image"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-playerName" className="required">Player Name</Label>
              <Input
                id="edit-playerName"
                placeholder="e.g., Robin Yount"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-year" className="required">Year</Label>
              <Input
                id="edit-year"
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
            <Label htmlFor="edit-brand" className="required">Brand</Label>
            <Input
              id="edit-brand"
              placeholder="e.g., Topps, Upper Deck, Panini"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-serialNumber">Serial Number (Optional)</Label>
              <Input
                id="edit-serialNumber"
                placeholder="e.g., 23/99"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cardNumber">Card Number (Optional)</Label>
              <Input
                id="edit-cardNumber"
                placeholder="e.g., #123"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cardSeries">Card Series (Optional)</Label>
            <Input
              id="edit-cardSeries"
              placeholder="e.g., Stadium Club, Chrome"
              value={cardSeries}
              onChange={(e) => setCardSeries(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isRookieCard"
                checked={isRookieCard}
                onCheckedChange={(checked) => setIsRookieCard(checked === true)}
                className="border-brewers-navy data-[state=checked]:bg-brewers-gold data-[state=checked]:text-brewers-navy data-[state=checked]:border-brewers-gold"
              />
              <Label
                htmlFor="edit-isRookieCard"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Rookie Card
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isAutographed"
                checked={isAutographed}
                onCheckedChange={(checked) => setIsAutographed(checked === true)}
                className="border-brewers-navy data-[state=checked]:bg-brewers-gold data-[state=checked]:text-brewers-navy data-[state=checked]:border-brewers-gold"
              />
              <Label
                htmlFor="edit-isAutographed"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Autographed
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes (Optional)</Label>
            <Textarea
              id="edit-notes"
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
              onClick={() => onOpenChange(false)}
              disabled={updateCard.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateCard.isPending || !playerName || !year || !brand}
              className="bg-brewers-navy hover:bg-brewers-navy/90"
            >
              {updateCard.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Card'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
