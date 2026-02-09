import { useMemo } from 'react';
import { useGetPriceHistory } from '@/hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import type { CardId } from '@/backend';

interface PriceHistoryChartProps {
  cardId: CardId;
}

export default function PriceHistoryChart({ cardId }: PriceHistoryChartProps) {
  const { data: priceHistory = [], isLoading } = useGetPriceHistory(cardId);

  const chartData = useMemo(() => {
    return priceHistory
      .map(point => ({
        timestamp: new Date(Number(point.timestamp) / 1_000_000).toLocaleDateString(),
        price: point.price ?? 0,
      }))
      .reverse();
  }, [priceHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brewers-navy" />
      </div>
    );
  }

  if (chartData.length < 2) {
    return (
      <Card className="border-brewers-navy/10">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-12 w-12 text-brewers-navy/20 mb-4" />
            <p className="text-lg font-medium text-brewers-navy">No price history yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Price trends will appear here after multiple price updates
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brewers-navy/10">
      <CardHeader>
        <CardTitle className="text-brewers-navy flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brewers-gold" />
          Price History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0a2351" opacity={0.1} />
            <XAxis 
              dataKey="timestamp" 
              stroke="#0a2351"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#0a2351"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #0a2351',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#ffc52f" 
              strokeWidth={3}
              dot={{ fill: '#0a2351', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
