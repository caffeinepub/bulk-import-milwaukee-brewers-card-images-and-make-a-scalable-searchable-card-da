import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CardMetadata } from '@/backend';

interface FilterSidebarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedYear: number | null;
  onYearChange: (value: number | null) => void;
  selectedSeries: string | null;
  onSeriesChange: (value: string | null) => void;
  selectedBrand: string | null;
  onBrandChange: (value: string | null) => void;
  selectedPlayer: string | null;
  onPlayerChange: (value: string | null) => void;
  isRookieCard: boolean | null;
  onRookieCardChange: (value: boolean | null) => void;
  isAutographed: boolean | null;
  onAutographedChange: (value: boolean | null) => void;
  loadedCards: CardMetadata[];
}

export default function FilterSidebar({
  searchTerm,
  onSearchChange,
  selectedYear,
  onYearChange,
  selectedSeries,
  onSeriesChange,
  selectedBrand,
  onBrandChange,
  selectedPlayer,
  onPlayerChange,
  isRookieCard,
  onRookieCardChange,
  isAutographed,
  onAutographedChange,
  loadedCards,
}: FilterSidebarProps) {
  // Build filter options from currently loaded cards
  const years = useMemo(() => {
    const yearSet = new Set(loadedCards.map(card => card.year));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [loadedCards]);

  const series = useMemo(() => {
    const seriesSet = new Set(
      loadedCards
        .map(card => card.cardSeries)
        .filter((s): s is string => s !== undefined && s !== null)
    );
    return Array.from(seriesSet).sort();
  }, [loadedCards]);

  const brands = useMemo(() => {
    const brandSet = new Set(loadedCards.map(card => card.brand));
    return Array.from(brandSet).sort();
  }, [loadedCards]);

  const hasActiveFilters = searchTerm || selectedYear || selectedSeries || selectedBrand || selectedPlayer || isRookieCard !== null || isAutographed !== null;
  
  const activeFilterCount = [selectedYear, selectedSeries, selectedBrand, selectedPlayer, isRookieCard, isAutographed].filter(v => v !== null).length;

  const clearFilters = () => {
    onSearchChange('');
    onYearChange(null);
    onSeriesChange(null);
    onBrandChange(null);
    onPlayerChange(null);
    onRookieCardChange(null);
    onAutographedChange(null);
  };

  return (
    <div className="rounded-lg border border-brewers-navy/10 bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-brewers-navy" />
          <h3 className="text-lg font-semibold text-brewers-navy">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge className="bg-brewers-gold hover:bg-brewers-gold text-brewers-navy">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-8 px-2 text-xs hover:bg-brewers-gold/10 hover:text-brewers-gold"
          >
            <X className="mr-1 h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-brewers-navy">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brewers-navy/60" />
            <Input
              id="search"
              placeholder="Player, brand, series..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 border-brewers-navy/20 focus-visible:ring-brewers-gold"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brewers-navy/60 hover:text-brewers-navy"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year" className="text-brewers-navy flex items-center justify-between">
            Year
            {selectedYear && (
              <button
                type="button"
                onClick={() => onYearChange(null)}
                className="text-xs text-brewers-gold hover:text-brewers-gold/80"
              >
                Clear
              </button>
            )}
          </Label>
          {years.length > 0 ? (
            <Select
              value={selectedYear?.toString() || ''}
              onValueChange={(value) => onYearChange(value ? parseInt(value) : null)}
            >
              <SelectTrigger id="year" className="border-brewers-navy/20 focus:ring-brewers-gold">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="year"
              type="number"
              placeholder="Enter year..."
              value={selectedYear?.toString() || ''}
              onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : null)}
              className="border-brewers-navy/20 focus-visible:ring-brewers-gold"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand" className="text-brewers-navy flex items-center justify-between">
            Brand
            {selectedBrand && (
              <button
                type="button"
                onClick={() => onBrandChange(null)}
                className="text-xs text-brewers-gold hover:text-brewers-gold/80"
              >
                Clear
              </button>
            )}
          </Label>
          {brands.length > 0 ? (
            <Select
              value={selectedBrand || ''}
              onValueChange={(value) => onBrandChange(value || null)}
            >
              <SelectTrigger id="brand" className="border-brewers-navy/20 focus:ring-brewers-gold">
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="brand"
              placeholder="Enter brand..."
              value={selectedBrand || ''}
              onChange={(e) => onBrandChange(e.target.value || null)}
              className="border-brewers-navy/20 focus-visible:ring-brewers-gold"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="series" className="text-brewers-navy flex items-center justify-between">
            Card Series
            {selectedSeries && (
              <button
                type="button"
                onClick={() => onSeriesChange(null)}
                className="text-xs text-brewers-gold hover:text-brewers-gold/80"
              >
                Clear
              </button>
            )}
          </Label>
          {series.length > 0 ? (
            <Select
              value={selectedSeries || ''}
              onValueChange={(value) => onSeriesChange(value || null)}
            >
              <SelectTrigger id="series" className="border-brewers-navy/20 focus:ring-brewers-gold">
                <SelectValue placeholder="All series" />
              </SelectTrigger>
              <SelectContent>
                {series.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="series"
              placeholder="Enter series..."
              value={selectedSeries || ''}
              onChange={(e) => onSeriesChange(e.target.value || null)}
              className="border-brewers-navy/20 focus-visible:ring-brewers-gold"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="player" className="text-brewers-navy flex items-center justify-between">
            Player Name
            {selectedPlayer && (
              <button
                type="button"
                onClick={() => onPlayerChange(null)}
                className="text-xs text-brewers-gold hover:text-brewers-gold/80"
              >
                Clear
              </button>
            )}
          </Label>
          <Input
            id="player"
            placeholder="Enter player name..."
            value={selectedPlayer || ''}
            onChange={(e) => onPlayerChange(e.target.value || null)}
            className="border-brewers-navy/20 focus-visible:ring-brewers-gold"
          />
        </div>

        <div className="space-y-3 pt-2 border-t border-brewers-navy/10">
          <Label className="text-brewers-navy">Card Type</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rookie-filter"
              checked={isRookieCard === true}
              onCheckedChange={(checked) => onRookieCardChange(checked ? true : null)}
              className="border-brewers-navy data-[state=checked]:bg-brewers-gold data-[state=checked]:text-brewers-navy data-[state=checked]:border-brewers-gold"
            />
            <Label
              htmlFor="rookie-filter"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Rookie Card
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autographed-filter"
              checked={isAutographed === true}
              onCheckedChange={(checked) => onAutographedChange(checked ? true : null)}
              className="border-brewers-navy data-[state=checked]:bg-brewers-gold data-[state=checked]:text-brewers-navy data-[state=checked]:border-brewers-gold"
            />
            <Label
              htmlFor="autographed-filter"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Autographed
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
