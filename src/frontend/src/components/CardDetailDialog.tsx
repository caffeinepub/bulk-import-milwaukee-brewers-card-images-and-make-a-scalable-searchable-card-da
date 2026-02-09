import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Pencil, Trash2, Calendar, Tag, Package, DollarSign, Sparkles, Hash, AlertTriangle, Award, PenTool } from 'lucide-react';
import type { CardMetadata } from '@/backend';
import { useRefreshCardPrice, useDeleteCard } from '@/hooks/useQueries';
import { toast } from 'sonner';
import EditCardDialog from './EditCardDialog';
import PriceHistoryChart from './PriceHistoryChart';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CardDetailDialogProps {
  card: CardMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardDetailDialog({ card, open, onOpenChange }: CardDetailDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const refreshPrice = useRefreshCardPrice();
  const deleteCard = useDeleteCard();

  if (!card) return null;

  const handleRefreshPrice = async () => {
    try {
      await refreshPrice.mutateAsync(card.id);
      toast.success('Price updated successfully');
    } catch (error) {
      toast.error('Failed to refresh price');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCard.mutateAsync(card.id);
      toast.success('Card deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete card');
      console.error(error);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getConfidenceBadge = (confidence: number | undefined) => {
    if (confidence === undefined || confidence === null) return null;
    
    if (confidence >= 0.7) {
      return (
        <Badge className="flex items-center gap-1 bg-green-600 hover:bg-green-600 text-white">
          <Sparkles className="h-3 w-3" />
          {Math.round(confidence * 100)}% AI
        </Badge>
      );
    } else if (confidence >= 0.5) {
      return (
        <Badge className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-500 text-white">
          <AlertTriangle className="h-3 w-3" />
          {Math.round(confidence * 100)}% AI
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {Math.round(confidence * 100)}% AI
        </Badge>
      );
    }
  };

  const imageUrl = card.image.getDirectURL();

  return (
    <>
      <Dialog open={open && !isEditDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-brewers-navy">{card.playerName}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="trends">Value Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <img
                    src={imageUrl}
                    alt={card.playerName}
                    className="w-full rounded-lg border border-brewers-navy/20 shadow-brewers"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="text-lg px-3 py-1 bg-brewers-gold hover:bg-brewers-gold text-brewers-navy">
                      {card.year}
                    </Badge>
                    {card.isRookieCard && (
                      <Badge className="flex items-center gap-1 bg-brewers-navy hover:bg-brewers-navy text-brewers-gold">
                        <Award className="h-3 w-3" />
                        Rookie
                      </Badge>
                    )}
                    {card.isAutographed && (
                      <Badge className="flex items-center gap-1 bg-brewers-navy hover:bg-brewers-navy text-brewers-gold">
                        <PenTool className="h-3 w-3" />
                        Autographed
                      </Badge>
                    )}
                    {getConfidenceBadge(card.recognitionConfidence)}
                  </div>

                  {card.recognitionConfidence !== undefined && card.recognitionConfidence !== null && card.recognitionConfidence < 0.7 && (
                    <div className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded p-2 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                      <span>
                        This card was recognized with {card.recognitionConfidence >= 0.5 ? 'medium' : 'low'} confidence. 
                        Some details may need verification.
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Tag className="h-5 w-5 text-brewers-navy/60 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Brand</p>
                        <p className="font-medium text-brewers-navy">{card.brand}</p>
                      </div>
                    </div>

                    {card.cardSeries && (
                      <div className="flex items-start gap-2">
                        <Package className="h-5 w-5 text-brewers-navy/60 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Series</p>
                          <p className="font-medium text-brewers-navy">{card.cardSeries}</p>
                        </div>
                      </div>
                    )}

                    {card.serialNumber && (
                      <div className="flex items-start gap-2">
                        <Hash className="h-5 w-5 text-brewers-navy/60 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Serial Number</p>
                          <p className="font-medium text-brewers-navy">{card.serialNumber}</p>
                        </div>
                      </div>
                    )}

                    {card.cardNumber && (
                      <div className="flex items-start gap-2">
                        <Hash className="h-5 w-5 text-brewers-navy/60 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Card Number</p>
                          <p className="font-medium text-brewers-navy">{card.cardNumber}</p>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-start gap-2">
                      <DollarSign className="h-5 w-5 text-brewers-gold mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Average Market Price</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-brewers-gold">
                            {card.averagePrice !== undefined && card.averagePrice !== null
                              ? `$${card.averagePrice.toFixed(2)}`
                              : 'N/A'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefreshPrice}
                            disabled={refreshPrice.isPending}
                            className="hover:bg-brewers-gold/10 hover:text-brewers-gold"
                          >
                            {refreshPrice.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {card.priceLastUpdated && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last updated: {formatDate(card.priceLastUpdated)}
                          </p>
                        )}
                      </div>
                    </div>

                    {card.notes && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm text-brewers-navy">{card.notes}</p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Added {formatDate(card.timestamp)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 border-brewers-navy/20 hover:bg-brewers-navy/5 hover:text-brewers-navy"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <PriceHistoryChart cardId={card.id} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <EditCardDialog
        card={card}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the card "{card.playerName}" from your collection.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
