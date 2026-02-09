import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CardMetadata, CardId, PricePoint, CardFilters, PaginatedResult, BulkImportCard, BulkImportResult, UserProfile } from '@/backend';

export function useGetAllCards() {
  const { actor, isFetching } = useActor();

  return useQuery<CardMetadata[]>({
    queryKey: ['cards'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCards();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchCards(
  filters: CardFilters,
  searchTerm: string | null,
  pageSize: number,
  offset: number
) {
  const { actor, isFetching } = useActor();

  return useQuery<PaginatedResult>({
    queryKey: ['searchCards', filters, searchTerm, pageSize, offset],
    queryFn: async () => {
      if (!actor) return { cards: [], hasMore: false, total: BigInt(0) };
      return actor.searchCards(filters, searchTerm, BigInt(pageSize), BigInt(offset));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCardById(id: CardId) {
  const { actor, isFetching } = useActor();

  return useQuery<CardMetadata | null>({
    queryKey: ['card', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      try {
        return await actor.getCardById(id);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useGetPriceHistory(id: CardId) {
  const { actor, isFetching } = useActor();

  return useQuery<PricePoint[]>({
    queryKey: ['priceHistory', id],
    queryFn: async () => {
      if (!actor || !id) return [];
      try {
        return await actor.getPriceHistory(id);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useGetRecentlyChangedCards() {
  const { actor, isFetching } = useActor();

  return useQuery<CardMetadata[]>({
    queryKey: ['recentlyChangedCards'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentlyChangedCards();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useAddCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      year,
      playerName,
      brand,
      serialNumber,
      cardNumber,
      cardSeries,
      notes,
      image,
      recognitionConfidence,
      isRookieCard,
      isAutographed,
      team,
    }: {
      id: CardId;
      year: number;
      playerName: string;
      brand: string;
      serialNumber: string | null;
      cardNumber: string | null;
      cardSeries: string | null;
      notes: string | null;
      image: any;
      recognitionConfidence?: number | null;
      isRookieCard: boolean;
      isAutographed: boolean;
      team?: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addCard(
        id,
        year,
        playerName,
        brand,
        serialNumber,
        cardNumber,
        cardSeries,
        notes,
        image,
        recognitionConfidence ?? null,
        isRookieCard,
        isAutographed,
        team || 'Milwaukee Brewers'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['searchCards'] });
      queryClient.invalidateQueries({ queryKey: ['recentlyChangedCards'] });
    },
  });
}

export function useUpdateCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      year,
      playerName,
      brand,
      serialNumber,
      cardNumber,
      cardSeries,
      notes,
      image,
      recognitionConfidence,
      isRookieCard,
      isAutographed,
      team,
    }: {
      id: CardId;
      year: number;
      playerName: string;
      brand: string;
      serialNumber: string | null;
      cardNumber: string | null;
      cardSeries: string | null;
      notes: string | null;
      image: any;
      recognitionConfidence?: number | null;
      isRookieCard: boolean;
      isAutographed: boolean;
      team?: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.updateCard(
        id,
        year,
        playerName,
        brand,
        serialNumber,
        cardNumber,
        cardSeries,
        notes,
        image,
        recognitionConfidence ?? null,
        isRookieCard,
        isAutographed,
        team || 'Milwaukee Brewers'
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['searchCards'] });
      queryClient.invalidateQueries({ queryKey: ['card', variables.id] });
    },
  });
}

export function useDeleteCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: CardId) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteCard(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['searchCards'] });
      queryClient.invalidateQueries({ queryKey: ['recentlyChangedCards'] });
    },
  });
}

export function useRefreshCardPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: CardId) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.refreshCardPrice(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['searchCards'] });
      queryClient.invalidateQueries({ queryKey: ['card', id] });
      queryClient.invalidateQueries({ queryKey: ['priceHistory', id] });
      queryClient.invalidateQueries({ queryKey: ['recentlyChangedCards'] });
    },
  });
}

export function useBulkImportCards() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardsToImport: BulkImportCard[]) => {
      if (!actor) throw new Error('Actor not initialized');
      return await actor.bulkImportCards(cardsToImport);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['searchCards'] });
      queryClient.invalidateQueries({ queryKey: ['recentlyChangedCards'] });
    },
  });
}
