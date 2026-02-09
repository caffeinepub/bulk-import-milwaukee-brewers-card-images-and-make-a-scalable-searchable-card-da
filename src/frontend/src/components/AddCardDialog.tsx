import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload } from 'lucide-react';
import { useAddCard } from '@/hooks/useQueries';
import { ExternalBlob } from '@/backend';
import { toast } from 'sonner';
import ManualCardForm from './ManualCardForm';
import ImageRecognitionForm from './ImageRecognitionForm';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCardDialog({ open, onOpenChange }: AddCardDialogProps) {
  const [activeTab, setActiveTab] = useState<'recognize' | 'manual'>('recognize');
  const addCard = useAddCard();

  const handleAddCard = async (cardData: {
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
  }) => {
    try {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await addCard.mutateAsync({
        id,
        year: cardData.year,
        playerName: cardData.playerName,
        brand: cardData.brand,
        serialNumber: cardData.serialNumber,
        cardNumber: cardData.cardNumber,
        cardSeries: cardData.cardSeries,
        notes: cardData.notes,
        image: cardData.image,
        recognitionConfidence: cardData.recognitionConfidence,
        isRookieCard: cardData.isRookieCard,
        isAutographed: cardData.isAutographed,
        team: 'Milwaukee Brewers',
      });

      toast.success('Card added successfully! Fetching market price...');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add card');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-brewers-navy">Add New Card</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'recognize' | 'manual')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recognize" className="flex items-center gap-2 data-[state=active]:bg-brewers-gold data-[state=active]:text-brewers-navy">
              <Camera className="h-4 w-4" />
              Recognize Card
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2 data-[state=active]:bg-brewers-gold data-[state=active]:text-brewers-navy">
              <Upload className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recognize" className="mt-6">
            <ImageRecognitionForm
              onSubmit={handleAddCard}
              isSubmitting={addCard.isPending}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="manual" className="mt-6">
            <ManualCardForm
              onSubmit={handleAddCard}
              isSubmitting={addCard.isPending}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
