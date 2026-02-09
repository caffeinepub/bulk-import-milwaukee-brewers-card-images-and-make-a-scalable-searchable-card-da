import type { CardMetadata } from '@/backend';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Hash, Sparkles } from 'lucide-react';

interface CardItemProps {
  card: CardMetadata;
  onClick: () => void;
}

export default function CardItem({ card, onClick }: CardItemProps) {
  const imageUrl = card.image.getDirectURL();

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-brewers hover:scale-[1.02] border-brewers-navy/10"
      onClick={onClick}
    >
      <div className="aspect-[3/4] overflow-hidden bg-muted relative">
        <img
          src={imageUrl}
          alt={`${card.playerName} - ${card.year}`}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        {card.recognitionConfidence !== undefined && card.recognitionConfidence !== null && card.recognitionConfidence >= 0.7 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-600 hover:bg-green-600 text-white shadow-lg">
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-brewers-navy line-clamp-2">
            {card.playerName}
          </h3>
          <Badge className="shrink-0 bg-brewers-gold hover:bg-brewers-gold text-brewers-navy">
            {card.year}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground line-clamp-1">{card.brand}</p>
          {card.cardSeries && (
            <p className="text-xs text-muted-foreground line-clamp-1">{card.cardSeries}</p>
          )}
          {card.serialNumber && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span className="line-clamp-1">{card.serialNumber}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-sm font-semibold text-brewers-gold pt-1">
            <DollarSign className="h-4 w-4" />
            {formatPrice(card.averagePrice)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
