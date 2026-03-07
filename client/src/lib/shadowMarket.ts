/**
 * Shadow Market System
 * Syncs Polymarket event data with local BinaryMarket contracts
 */

import { fetchPolymarketMarkets, type PolymarketMarket } from './polymarketApi';

export interface ShadowMarketMetadata {
  polymarketId: string;
  title: string;
  description: string;
  resolutionSource?: string;
  endDate: Date;
  category: 'sports' | 'politics' | 'crypto' | 'entertainment' | 'other';
  icon: string;
}

export interface ShadowMarketContract {
  address: string;
  chainId: number;
  deployed: boolean;
  createdAt: Date;
}

export interface ShadowMarket {
  id: string; // Unique identifier combining polymarketId + chainId
  metadata: ShadowMarketMetadata;
  contract: ShadowMarketContract;
  yesPool: bigint;
  noPool: bigint;
  yesOdds: number;
  noOdds: number;
  totalVolume: bigint;
  status: 'active' | 'resolved' | 'pending';
  lastSyncedAt: Date;
}

export interface ShadowMarketMapping {
  [polymarketId: string]: ShadowMarketContract;
}

// Local storage key for market mappings
const SHADOW_MARKET_STORAGE_KEY = 'nexus_shadow_markets';
const SHADOW_MARKET_METADATA_KEY = 'nexus_shadow_metadata';

/**
 * Get stored market mappings from localStorage
 */
export function getShadowMarketMappings(): ShadowMarketMapping {
  try {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(SHADOW_MARKET_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to get shadow market mappings:', error);
    return {};
  }
}

/**
 * Save market mappings to localStorage
 */
export function saveShadowMarketMappings(mappings: ShadowMarketMapping): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SHADOW_MARKET_STORAGE_KEY, JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to save shadow market mappings:', error);
  }
}

/**
 * Get stored market metadata from localStorage
 */
export function getShadowMarketMetadata(): Record<string, ShadowMarketMetadata> {
  try {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(SHADOW_MARKET_METADATA_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    // Convert date strings back to Date objects
    Object.values(parsed).forEach((market: any) => {
      if (market.endDate && typeof market.endDate === 'string') {
        market.endDate = new Date(market.endDate);
      }
    });

    return parsed;
  } catch (error) {
    console.error('Failed to get shadow market metadata:', error);
    return {};
  }
}

/**
 * Save market metadata to localStorage
 */
export function saveShadowMarketMetadata(metadata: Record<string, ShadowMarketMetadata>): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SHADOW_MARKET_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('Failed to save shadow market metadata:', error);
  }
}

/**
 * Infer category from Polymarket title
 */
function inferCategory(title: string): ShadowMarketMetadata['category'] {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes('nfl') ||
    lowerTitle.includes('nba') ||
    lowerTitle.includes('nhl') ||
    lowerTitle.includes('mlb') ||
    lowerTitle.includes('soccer') ||
    lowerTitle.includes('football') ||
    lowerTitle.includes('basketball') ||
    lowerTitle.includes('baseball') ||
    lowerTitle.includes('hockey') ||
    lowerTitle.includes('sports')
  ) {
    return 'sports';
  }

  if (
    lowerTitle.includes('election') ||
    lowerTitle.includes('president') ||
    lowerTitle.includes('trump') ||
    lowerTitle.includes('biden') ||
    lowerTitle.includes('harris') ||
    lowerTitle.includes('political')
  ) {
    return 'politics';
  }

  if (
    lowerTitle.includes('bitcoin') ||
    lowerTitle.includes('ethereum') ||
    lowerTitle.includes('crypto') ||
    lowerTitle.includes('btc') ||
    lowerTitle.includes('eth')
  ) {
    return 'crypto';
  }

  if (
    lowerTitle.includes('oscars') ||
    lowerTitle.includes('grammys') ||
    lowerTitle.includes('emmys') ||
    lowerTitle.includes('movie') ||
    lowerTitle.includes('music') ||
    lowerTitle.includes('celebrity') ||
    lowerTitle.includes('oscar') ||
    lowerTitle.includes('award')
  ) {
    return 'entertainment';
  }

  return 'other';
}

/**
 * Get emoji icon based on category
 */
function getCategoryIcon(category: ShadowMarketMetadata['category']): string {
  const icons: Record<ShadowMarketMetadata['category'], string> = {
    sports: '🏀',
    politics: '🇺🇸',
    crypto: '₿',
    entertainment: '🎬',
    other: '📊',
  };
  return icons[category];
}

/**
 * Create shadow market metadata from Polymarket market
 */
export function createShadowMarketMetadata(market: PolymarketMarket): ShadowMarketMetadata {
  const category = inferCategory(market.title);
  const icon = getCategoryIcon(category);

  let endDate = new Date();
  if (market.endDate) {
    const parsed = new Date(market.endDate);
    if (!isNaN(parsed.getTime())) {
      endDate = parsed;
    } else {
      endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  return {
    polymarketId: market.id,
    title: market.title,
    description: market.description || market.title,
    resolutionSource: 'Polymarket',
    endDate,
    category,
    icon,
  };
}

/**
 * Register a contract mapping for a Polymarket event
 */
export function registerShadowMarketContract(
  polymarketId: string,
  contractAddress: string,
  chainId: number = 137 // Default to Polygon
): ShadowMarketContract {
  const contract: ShadowMarketContract = {
    address: contractAddress,
    chainId,
    deployed: true,
    createdAt: new Date(),
  };

  const mappings = getShadowMarketMappings();
  mappings[polymarketId] = contract;
  saveShadowMarketMappings(mappings);

  return contract;
}

/**
 * Get contract mapping for a Polymarket event
 */
export function getShadowMarketContract(polymarketId: string): ShadowMarketContract | null {
  const mappings = getShadowMarketMappings();
  return mappings[polymarketId] || null;
}

/**
 * Check if a Polymarket event has a local contract
 */
export function hasShadowMarketContract(polymarketId: string): boolean {
  return getShadowMarketContract(polymarketId) !== null;
}

/**
 * Fetch and sync top Polymarket events as shadow markets
 */
export async function fetchAndSyncShadowMarkets(limit: number = 5): Promise<ShadowMarketMetadata[]> {
  try {
    const polymarkets = await fetchPolymarketMarkets(limit);

    const metadata: Record<string, ShadowMarketMetadata> = {};
    const shadowMetadata: ShadowMarketMetadata[] = [];

    polymarkets.forEach((market) => {
      const shadowMeta = createShadowMarketMetadata(market);
      metadata[market.id] = shadowMeta;
      shadowMetadata.push(shadowMeta);
    });

    // Save to localStorage
    const existingMetadata = getShadowMarketMetadata();
    const updatedMetadata = { ...existingMetadata, ...metadata };
    saveShadowMarketMetadata(updatedMetadata);

    return shadowMetadata;
  } catch (error) {
    console.error('Failed to fetch and sync shadow markets:', error);
    throw error;
  }
}

/**
 * Get all synced shadow market metadata
 */
export function getAllShadowMarketMetadata(): ShadowMarketMetadata[] {
  const metadata = getShadowMarketMetadata();
  return Object.values(metadata);
}

/**
 * Generate unique shadow market ID
 */
export function generateShadowMarketId(polymarketId: string, chainId: number = 137): string {
  return `${polymarketId}_${chainId}`;
}

/**
 * Create shadow market object with contract and pool data
 */
export function createShadowMarket(
  metadata: ShadowMarketMetadata,
  contract: ShadowMarketContract,
  yesPool: bigint,
  noPool: bigint
): ShadowMarket {
  const totalVolume = yesPool + noPool;
  const yesOdds = totalVolume > BigInt(0) ? Number((yesPool * BigInt(100)) / totalVolume) : 50;
  const noOdds = 100 - yesOdds;

  return {
    id: generateShadowMarketId(metadata.polymarketId, contract.chainId),
    metadata,
    contract,
    yesPool,
    noPool,
    yesOdds,
    noOdds,
    totalVolume,
    status: 'active',
    lastSyncedAt: new Date(),
  };
}

/**
 * Get shadow market by ID
 */
export function getShadowMarketById(id: string): ShadowMarketMetadata | null {
  const metadata = getShadowMarketMetadata();
  // Parse ID to get polymarketId
  const polymarketId = id.split('_')[0];
  return metadata[polymarketId] || null;
}

/**
 * Get shadow markets by category
 */
export function getShadowMarketsByCategory(
  category: ShadowMarketMetadata['category']
): ShadowMarketMetadata[] {
  const metadata = getShadowMarketMetadata();
  return Object.values(metadata).filter((m) => m.category === category);
}

/**
 * Update shadow market contract status
 */
export function updateShadowMarketContractStatus(
  polymarketId: string,
  deployed: boolean
): ShadowMarketContract | null {
  const contract = getShadowMarketContract(polymarketId);
  if (!contract) return null;

  const updated = { ...contract, deployed };
  const mappings = getShadowMarketMappings();
  mappings[polymarketId] = updated;
  saveShadowMarketMappings(mappings);

  return updated;
}
