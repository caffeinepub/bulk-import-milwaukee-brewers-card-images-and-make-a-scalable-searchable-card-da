import { useState } from 'react';
import type { CardMetadata } from '@/backend';
import CardItem from '@/components/CardItem';
import CardDetailDialog from '@/components/CardDetailDialog';

interface CardGridProps {
  cards: CardMetadata[];
}

export default function CardGrid({ cards }: CardGridProps) {
  const [selectedCard, setSelectedCard] = useState<CardMetadata | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <CardItem 
            key={card.id} 
            card={card} 
            onClick={() => setSelectedCard(card)}
          />
        ))}
      </div>

      <CardDetailDialog
        card={selectedCard}
        open={!!selectedCard}
        onOpenChange={(open) => !open && setSelectedCard(null)}
      />
    </>
  );
}
