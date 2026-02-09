import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchCards, useGetRecentlyChangedCards } from '@/hooks/useQueries';
import CardGrid from '@/components/CardGrid';
import AddCardDialog from '@/components/AddCardDialog';
import FilterSidebar from '@/components/FilterSidebar';
import ValueTrendsSummary from '@/components/ValueTrendsSummary';
import type { CardFilters } from '@/backend';

const PAGE_SIZE = 24;

export default function CardCatalog() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isRookieCard, setIsRookieCard] = useState<boolean | null>(null);
  const [isAutographed, setIsAutographed] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Build filters with hidden Milwaukee Brewers team filter
  const filters: CardFilters = useMemo(() => ({
    year: selectedYear || undefined,
    playerName: selectedPlayer || undefined,
    cardSeries: selectedSeries || undefined,
    brand: selectedBrand || undefined,
    isRookieCard: isRookieCard ?? undefined,
    isAutographed: isAutographed ?? undefined,
    team: 'Milwaukee Brewers', // Hidden default filter
  }), [selectedYear, selectedPlayer, selectedSeries, selectedBrand, isRookieCard, isAutographed]);

  const offset = currentPage * PAGE_SIZE;

  const { data: searchResult, isLoading } = useSearchCards(
    filters,
    searchTerm || null,
    PAGE_SIZE,
    offset
  );

  const { data: recentCards = [] } = useGetRecentlyChangedCards();

  const cards = searchResult?.cards || [];
  const hasMore = searchResult?.hasMore || false;
  const total = Number(searchResult?.total || 0);

  const totalValue = useMemo(() => {
    return cards.reduce((sum, card) => {
      return sum + (card.averagePrice || 0);
    }, 0);
  }, [cards]);

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset to first page when filters change
  const handleFilterChange = (setter: (value: any) => void) => (value: any) => {
    setter(value);
    setCurrentPage(0);
  };

  const loadedCount = offset + cards.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-brewers-navy mb-2">My Collection</h1>
              <p className="text-muted-foreground">
                Showing {loadedCount} of {total} {total === 1 ? 'card' : 'cards'}
              </p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-brewers-gold hover:bg-brewers-gold/90 text-brewers-navy font-semibold shadow-brewers"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Card
            </Button>
          </div>

          <div className="bg-gradient-to-r from-brewers-navy to-brewers-navy/90 rounded-lg p-6 shadow-brewers mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brewers-gold/80 text-sm font-medium mb-1">Current Page Value</p>
                <p className="text-4xl font-bold text-brewers-gold">${totalValue.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-brewers-gold/60 text-xs">
                  Based on average market prices
                </p>
              </div>
            </div>
          </div>

          <ValueTrendsSummary cards={recentCards} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <FilterSidebar
              searchTerm={searchTerm}
              onSearchChange={handleFilterChange(setSearchTerm)}
              selectedYear={selectedYear}
              onYearChange={handleFilterChange(setSelectedYear)}
              selectedSeries={selectedSeries}
              onSeriesChange={handleFilterChange(setSelectedSeries)}
              selectedBrand={selectedBrand}
              onBrandChange={handleFilterChange(setSelectedBrand)}
              selectedPlayer={selectedPlayer}
              onPlayerChange={handleFilterChange(setSelectedPlayer)}
              isRookieCard={isRookieCard}
              onRookieCardChange={handleFilterChange(setIsRookieCard)}
              isAutographed={isAutographed}
              onAutographedChange={handleFilterChange(setIsAutographed)}
              loadedCards={cards}
            />
          </aside>

          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brewers-navy mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your collection...</p>
                </div>
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {total === 0
                    ? 'No cards in your collection yet. Add your first card to get started!'
                    : 'No cards match your current filters.'}
                </p>
                {total === 0 && (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-brewers-gold hover:bg-brewers-gold/90 text-brewers-navy"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Your First Card
                  </Button>
                )}
              </div>
            ) : (
              <>
                <CardGrid cards={cards} />
                
                {/* Pagination Controls */}
                {(currentPage > 0 || hasMore) && (
                  <div className="mt-8 flex items-center justify-between">
                    <Button
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                      variant="outline"
                      className="border-brewers-navy text-brewers-navy hover:bg-brewers-navy hover:text-white disabled:opacity-50"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage + 1} of {Math.ceil(total / PAGE_SIZE)}
                    </div>
                    
                    <Button
                      onClick={handleNextPage}
                      disabled={!hasMore}
                      variant="outline"
                      className="border-brewers-navy text-brewers-navy hover:bg-brewers-navy hover:text-white disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <AddCardDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
