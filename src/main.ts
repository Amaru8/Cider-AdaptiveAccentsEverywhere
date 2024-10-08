import { defineCustomElement } from 'vue';
import type { App } from 'vue';
import { createPinia } from 'pinia';
import { definePluginContext } from '@ciderapp/pluginkit';
import PluginSettings from './components/PluginSettings.vue';
import PluginConfig from './plugin.config';
import { getAlbumMediaItem, waitForMusicKit } from './utils';

const pinia = createPinia();

function configureApp(app: App) {
    app.use(pinia);
}

export const CustomElements = {
    settings: defineCustomElement(PluginSettings, {
        shadowRoot: false,
        configureApp,
    }),
};

const { plugin, setupConfig, customElementName, goToPage, useCPlugin } = definePluginContext({
    ...PluginConfig,
    CustomElements,
    SettingsElement: `${PluginConfig.ce_prefix}-settings`,
    setup() {
        for (const [key, value] of Object.entries(CustomElements)) {
            const _key = key as keyof typeof CustomElements;
            customElements.define(customElementName(_key), value);
        }

        waitForMusicKit().then(() => {
            console.log('[Adaptive Accents Everywhere] MusicKit loaded, registering event listener.');
            MusicKit.getInstance().addEventListener('nowPlayingItemDidChange', async (event: any) => {
                if (cfg.value.frozen === true) return;

                if (!event.item) return;

                let fetchId: string | null = null;
                let relationshipMode = false;

                try {
                    if (event.item.attributes?.playParams?.catalogId) {
                        // console.debug(
                        //     '[Adaptive Accents Everywhere] Resolving using catalog method:',
                        //     event.item.attributes.playParams.catalogId
                        // );
                        fetchId = event.item.attributes.playParams.catalogId;
                    } else if (event.item.relationships?.albums?.data?.[0]?.id) {
                        // console.debug(
                        //     '[Adaptive Accents Everywhere] Resolving using relationship method:',
                        //     event.item.relationships.albums.data[0].id
                        // );
                        fetchId = event.item.relationships.albums.data[0].id;
                        relationshipMode = true;
                    } else if (event.item.attributes?.playParams?.id) {
                        // console.debug(
                        //     '[Adaptive Accents Everywhere] Resolving using playParams method:',
                        //     event.item.attributes.playParams.id
                        // );
                        fetchId = event.item.attributes.playParams.id;
                    } else {
                        console.warn('[Adaptive Accents Everywhere] No identifiable album or song ID.', event.item);
                    }

                    if (!fetchId) return;

                    const albumMediaItem = await getAlbumMediaItem(fetchId, relationshipMode);

                    if (!albumMediaItem.attributes || !albumMediaItem.attributes.artwork) {
                        console.warn(
                            '[Adaptive Accents Everywhere] Album media item does not have expected attributes.'
                        );
                        return;
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

                    function getContrastRatio(color1: string, color2: string): number {
                        const l1 = getLuminance(color1);
                        const l2 = getLuminance(color2);
                        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
                    }

                    function adjustColorForContrast(
                        color: string,
                        backgroundColor: string,
                        minContrast: number = 4.5
                    ): string {
                        let contrastRatio = getContrastRatio(color, backgroundColor);

                        while (contrastRatio < minContrast) {
                            const luminance = getLuminance(color);
                            if (luminance > 0.5) {
                                color = (parseInt(color, 16) - 0x111111).toString(16).padStart(6, '0');
                            } else {
                                color = (parseInt(color, 16) + 0x111111).toString(16).padStart(6, '0');
                            }
                            contrastRatio = getContrastRatio(color, backgroundColor);
                        }

                        return color;
                    }

                    if (cfg.value.keyColor !== 'cider') {
                        let keyColor: string = (albumMediaItem.attributes.artwork as any)[cfg.value.keyColor];
                        keyColor = adjustColorForContrast(keyColor, '000000');
                        document.body.style.setProperty('--keyColor', '#' + keyColor);
                    }

                    if (cfg.value.musicKeyColor !== 'cider') {
                        let musicKeyColor: string = (albumMediaItem.attributes.artwork as any)[cfg.value.musicKeyColor];
                        musicKeyColor = adjustColorForContrast(musicKeyColor, '000000');
                        document.documentElement.style.setProperty('--musicKeyColor', '#' + musicKeyColor);
                    }
                } catch (error) {
                    console.error('[Adaptive Accents Everywhere] Error processing now playing item:', error);
                }
            });
        });
    },
});

export const cfg = setupConfig({
    frozen: false,
    keyColor: 'textColor1',
    musicKeyColor: 'textColor4',
});

export function useConfig() {
    return cfg.value;
}

export { setupConfig, customElementName, goToPage, useCPlugin };
export default plugin;
