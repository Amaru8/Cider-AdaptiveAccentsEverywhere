import { useCider } from '@ciderapp/pluginkit';
import { useConfig } from './main';
import Vibrant from 'node-vibrant';
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

export function waitForMusicKit(): Promise<void> {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (MusicKit.getInstance()) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

export async function getColor(
    type: 'keyColor' | 'musicKeyColor',
    albumMediaItem: MusicKit.MediaItem
): Promise<string> {
    if (useConfig().useInternalAlgorithm === false) {
        // use colors provided by musickit
        return adjustColorForContrast(
            (albumMediaItem.attributes.artwork as any)[useConfig()[type]],
            detectBackgroundColor(albumMediaItem.attributes.artwork)
        );
    }

    // internal algo
    const artworkAttribute = albumMediaItem.attributes.artwork;
    let appearance = CiderApp.config.cfg.value.visual.appearance;
    if (appearance === 'auto')
        appearance = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    let palette = await Vibrant.from(
        resolveCoverUrl(artworkAttribute.url, artworkAttribute.width / 4, artworkAttribute.height / 4)
    ).getPalette();

    let returnColor: string | undefined;

    switch (appearance) {
        case 'dark':
            returnColor = useConfig().internalAlgoFlipScheme
                ? palette.LightVibrant?.getHex()
                : palette.DarkVibrant?.getHex();
            break;

        case 'light':
            returnColor = useConfig().internalAlgoFlipScheme
                ? palette.DarkVibrant?.getHex()
                : palette.LightVibrant?.getHex();
            break;

        default:
            break;
    }

    return returnColor ? returnColor.replace('#', '') : (albumMediaItem.attributes.artwork as any)[useConfig()[type]];
}

function adjustColorForContrast(color: string, backgroundColor: string, minContrast: number = 4.5): string {
    let contrastRatio = getContrastRatio(color, backgroundColor);
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loop

    while (contrastRatio < minContrast && attempts < maxAttempts) {
        const luminance = getLuminance(color);
        if (luminance > 0.5) {
            color = (parseInt(color, 16) - 0x111111).toString(16).padStart(6, '0');
        } else {
            color = (parseInt(color, 16) + 0x111111).toString(16).padStart(6, '0');
        }
        contrastRatio = getContrastRatio(color, backgroundColor);
        attempts++;
    }

    console.debug(`[Adaptive Accents Everywhere] Color adjustment attempts: ${attempts}`);
    return color;
}

function getContrastRatio(color1: string, color2: string): number {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function getLuminance(hex: string): number {
    const rgb = parseInt(hex, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const R = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const G = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const B = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function detectBackgroundColor(artworkAttribute: any): string {
    let appearance = CiderApp.config.cfg.value.visual.appearance;
    if (appearance === 'auto')
        appearance = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    switch (appearance) {
        case 'dark':
            if (CiderApp.config.cfg.value.visual.sweetener.useImmersiveBG === true) return artworkAttribute.bgColor;
            return '000000';

        case 'light':
            return 'ffffff';

        default:
            break;
    }

    return '000000';
}

function resolveCoverUrl(url: string, width: number, height: number): string {
    return url.replace('{w}', width.toString()).replace('{h}', height.toString()).replace('{f}', 'webp');
}
