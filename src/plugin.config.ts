import { createId } from '@paralleldrive/cuid2';

export default {
    ce_prefix: createId(),
    identifier: 'cidr.amaru8.adaptiveaccentseverywhere',
    name: 'Adaptive Accents Everywhere',
    description: "Changes the accent color of the app based on the playing song's album cover.",
    version: '1.1.2',
    author: 'amaru8',
    repo: 'https://github.com/Amaru8/Cider-AdaptiveAccentsEverywhere',
    entry: {
        'plugin.js': {
            type: 'main',
        },
    },
};
