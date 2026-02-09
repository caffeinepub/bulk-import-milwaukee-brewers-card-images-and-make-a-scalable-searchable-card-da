import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { CardMetadata } from '@/backend';

interface ValueTrendsSummaryProps {
  cards: CardMetadata[];
}

export default function ValueTrendsSummary({ cards }: ValueTrendsSummaryProps) {
  const trends = useMemo(() => {
    const cardsWithTrends = cards
      .filter(card => card.priceHistory && card.priceHistory.length >= 2)
      .map(card => {
        const history = card.priceHistory;
        const latest = history[0]?.price ?? 0;
        const previous = history[1]?.price ?? 0;
        const change = latest - previous;
        const percentChange = previous !== 0 ? (change / previous) * 100 : 0;

        return {
          card,
          change,
          percentChange,
        };
      })
      .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
      .slice(0, 5);

    return cardsWithTrends;
  }, [cards]);

  if (trends.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-brewers-navy/10">
      <CardHeader>
        <CardTitle className="text-brewers-navy flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brewers-gold" />
          Recent Value Changes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trends.map(({ card, change, percentChange }) => (
            <div key={card.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <p className="font-medium text-brewers-navy">{card.playerName}</p>
                <p className="text-sm text-muted-foreground">{card.brand} - {card.year}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-brewers-navy">
                    ${card.averagePrice?.toFixed(2) ?? 'N/A'}
                  </p>
                  <div className={`flex items-center gap-1 text-sm ${
                    change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {change > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : change < 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                    <span>
                      {change > 0 ? '+' : ''}{change.toFixed(2)} ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
