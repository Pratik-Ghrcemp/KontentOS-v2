export interface AssetFilterOptions {
  query?: string;
  type?: 'all' | 'video' | 'audio' | 'image';
}

/**
 * Pure function to filter media assets by search query and type filter.
 * Guarantees immutability of the source assets array.
 */
export function filterAssets<T extends { title?: string; fileName?: string; original_name?: string; asset_type?: string; type?: string }>(
  assets: T[],
  options: AssetFilterOptions
): T[] {
  const query = (options.query || '').trim().toLowerCase();
  const filterType = options.type || 'all';

  return assets.filter(asset => {
    // Type Filter Match
    const actualType = (asset.asset_type || asset.type || 'video').toLowerCase();
    const typeMatch = filterType === 'all' || actualType === filterType;
    if (!typeMatch) return false;

    // Search Query Match
    if (!query) return true;

    const title = (asset.title || '').toLowerCase();
    const fileName = (asset.fileName || asset.original_name || '').toLowerCase();

    return title.includes(query) || fileName.includes(query);
  });
}
