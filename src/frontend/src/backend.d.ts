import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface CardMetadata {
    id: CardId;
    averagePrice?: number;
    recognitionConfidence?: number;
    team: string;
    year: number;
    priceHistory: Array<PricePoint>;
    isRookieCard: boolean;
    priceLastUpdated?: Time;
    serialNumber?: string;
    isAutographed: boolean;
    notes?: string;
    cardSeries?: string;
    timestamp: Time;
    playerName: string;
    brand: string;
    image: ExternalBlob;
    cardNumber?: string;
}
export interface BulkImportCard {
    id: CardId;
    recognitionConfidence?: number;
    team?: string;
    year: number;
    isRookieCard: boolean;
    serialNumber?: string;
    isAutographed: boolean;
    notes?: string;
    cardSeries?: string;
    playerName: string;
    brand: string;
    image: ExternalBlob;
    cardNumber?: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface BulkImportResult {
    created: bigint;
    errors: Array<[CardId, string]>;
    updated: bigint;
    failed: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface PaginatedResult {
    total: bigint;
    hasMore: boolean;
    cards: Array<CardMetadata>;
}
export interface PricePoint {
    timestamp: Time;
    price?: number;
}
export interface CardFilters {
    team?: string;
    year?: number;
    isRookieCard?: boolean;
    isAutographed?: boolean;
    cardSeries?: string;
    playerName?: string;
    brand?: string;
}
export type CardId = string;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCard(id: CardId, year: number, playerName: string, brand: string, serialNumber: string | null, cardNumber: string | null, cardSeries: string | null, notes: string | null, image: ExternalBlob, recognitionConfidence: number | null, isRookieCard: boolean, isAutographed: boolean, team: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkImportCards(cardsToImport: Array<BulkImportCard>): Promise<BulkImportResult>;
    deleteCard(id: CardId): Promise<void>;
    filterCards(filters: CardFilters): Promise<Array<CardMetadata>>;
    getAllCards(): Promise<Array<CardMetadata>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCardById(id: CardId): Promise<CardMetadata>;
    getPriceHistory(id: CardId): Promise<Array<PricePoint>>;
    getRecentlyChangedCards(): Promise<Array<CardMetadata>>;
    getUserProfile(user: string): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    refreshCardPrice(id: CardId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchCards(filters: CardFilters, searchTerm: string | null, pageSize: bigint, offset: bigint): Promise<PaginatedResult>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCard(id: CardId, year: number, playerName: string, brand: string, serialNumber: string | null, cardNumber: string | null, cardSeries: string | null, notes: string | null, image: ExternalBlob, recognitionConfidence: number | null, isRookieCard: boolean, isAutographed: boolean, team: string): Promise<void>;
}
