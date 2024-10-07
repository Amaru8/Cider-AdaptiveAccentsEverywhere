import { useCider } from '@ciderapp/pluginkit';
const CiderApp = useCider();

const storefrontId = localStorage.getItem('appleMusic.storefront') ?? 'auto';

/**
 * Fetches the full MediaItem for an album given its ID or a song's catalog ID (don't use this anywhere else, it works for me, but might fail at any time, ahhh)
 * @param id The ID of the album or the catalog ID of a song
 * @returns Promise<MusicKit.MediaItem> The full MediaItem for the album
 */
export async function getAlbumMediaItem(id: string, relationshipMode: boolean = false): Promise<MusicKit.MediaItem> {
    try {
        let albumId = id;
        const isLibraryItem = id.startsWith('i.');
        let endpoint;

        if (relationshipMode === true) {
            endpoint = `/v1/catalog/${storefrontId}/albums/${albumId}`;
        } else {
            // If it's a song ID, we need to fetch the album ID first
            if (!isLibraryItem && !id.includes('l.')) {
                const songEndpoint = `/v1/catalog/${storefrontId}/songs/${id}`;
                const songResponse = await CiderApp.v3(songEndpoint, {
                    fields: 'albums',
                });
                if (!songResponse.data?.data?.[0]?.relationships?.albums?.data?.[0]?.id) {
                    throw new Error('[Adaptive Accents Everywhere] Album not found for the given song');
                }
                albumId = songResponse.data.data[0].relationships.albums.data[0].id;
            }

            // Now we have the album ID, so we can fetch the album data
            endpoint = isLibraryItem
                ? `/v1/me/library/albums/${albumId}`
                : `/v1/catalog/${storefrontId}/albums/${albumId}`;
        }

        const response = await CiderApp.v3(endpoint, {
            include: 'tracks',
            fields: 'artistName,artistUrl,artwork,contentRating,editorialArtwork,editorialNotes,name,playParams,releaseDate,trackCount,url',
        });

        if (!response.data?.data?.[0]) {
            throw new Error('[Adaptive Accents Everywhere] Album not found');
        }

        const mediaItem: MusicKit.MediaItem = response.data.data[0];

        // Ensure the href is set correctly
        if (!mediaItem.href) {
            mediaItem.href = `/v1/${isLibraryItem ? 'me/library' : `catalog/${storefrontId}`}/albums/${albumId}`;
        }

        return mediaItem;
    } catch (error) {
        console.error('[Adaptive Accents Everywhere] Error fetching album MediaItem:', error);
        throw error;
    }
}
