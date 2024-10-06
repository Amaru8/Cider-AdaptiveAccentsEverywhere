# Adaptive Accents Everywhere

Changes the accent color of the app based on the playing song's album cover.
**(Requires Cider 2.5 or later)**

Author: amaru8

Identifier: `cidr.amaru8.adaptiveaccentseverywhere`

## Available Commands

-   `npm run dev` - Start development server, Cider can then listen to this server when you select "Enable Vite" from the main menu
-   `npm run build` - Build the plugin to `dist/{plugin.config.ts:identifier}`
-   `npm run prepare-marketplace` - Prepare a ZIP package in the correct format for the Cider Marketplace

## How to install after build

-   Copy `dist/{plugin.config.ts:identifier}` to the `/plugins` directory of your Cider app data directory
    -   On Windows, this is `%APPDATA%\C2Windows\plugins`
    -   On macOS, this is `~/Library/Application Support/sh.cider.electron/plugins`
    -   On Linux, this is `~/.config/sh.cider.electron/plugins`
