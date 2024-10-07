import { defineCustomElement } from 'vue';
import type { App } from 'vue';
import { createPinia } from 'pinia';
import { definePluginContext } from '@ciderapp/pluginkit';
import PluginSettings from './components/PluginSettings.vue';
import PluginConfig from './plugin.config';
import { getAlbumMediaItem } from './utils';

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
        const mk = MusicKit.getInstance();

        mk.addEventListener('nowPlayingItemDidChange', async (event: any) => {
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
                    console.warn('[Adaptive Accents Everywhere] Album media item does not have expected attributes.');
                    return;
                }

                if (cfg.value.keyColor !== 'cider')
                    document.body.style.setProperty(
                        '--keyColor',
                        // @ts-ignore
                        '#' + albumMediaItem.attributes.artwork[cfg.value.keyColor]
                    );

                if (cfg.value.musicKeyColor !== 'cider')
                    document.documentElement.style.setProperty(
                        '--musicKeyColor',
                        // @ts-ignore
                        '#' + albumMediaItem.attributes.artwork[cfg.value.musicKeyColor]
                    );
            } catch (error) {
                console.error('[Adaptive Accents Everywhere] Error processing now playing item:', error);
            }
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
