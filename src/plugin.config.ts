import { createId } from '@paralleldrive/cuid2';

export default {
    ce_prefix: createId(),
    identifier: 'cidr.amaru8.adaptiveaccentseverywhere',
    name: 'Adaptive Accents Everywhere',
    description: "Changes the accent color of the app based on the playing song's album cover.",
    version: '1.0.0',
    author: 'amaru8',
    repo: 'https://github.com/amaru8/AdaptiveAccentsEverywhere',
    entry: {
        'plugin.js': {
            type: 'main',
        },
    },
};
