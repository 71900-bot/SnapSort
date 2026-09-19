# SnapSort Change Notes

Date: 2026-09-19

## Latest Packaging and UI Updates

- Updated the project version to `1.0.0`.
- Changed the Windows NSIS installer from one-click installation to a visible setup wizard.
- Added installation-directory selection, installation progress, Start Menu shortcuts, desktop shortcuts, and a completion screen.
- Added the custom cartoon icon at `public/snap-sort-icon.svg`.
- Connected the icon to the Electron window, browser favicon, and Electron Builder configuration.
- Added `vite.config.ts` with `base: './'` so packaged Electron builds load renderer assets correctly from local `file://` URLs.
- Added the colorful 2D cartoon visual layer with bold outlines, bright colors, playful cards, and sticker-like controls.
- Changed Electron Builder output from `dist` to `release` so normal Vite builds do not remove the installer.

## Overview

SnapSort was redesigned from a browser-only ZIP generator into a batch image-renaming tool. The desktop Electron app can now select an image folder, preview the new filenames, and rename the files in place.

## New Workflow

1. Select an image folder.
2. SnapSort scans supported image files in the folder.
3. Choose a naming prefix, starting number, and number width.
4. Review the current and proposed filenames.
5. Sort the preview by name or date added.
6. Click **Rename files** to apply the changes.

Supported image formats include PNG, JPG, JPEG, GIF, WEBP, BMP, TIF, and TIFF.

## Code Changes

### `electron/main.cjs`

- Added Electron dialog support for selecting folders.
- Added image-folder scanning through `fs.readdir` and `fs.stat`.
- Added native batch renaming through IPC.
- Added collision checks so existing files are not overwritten.
- Added temporary staging filenames so swaps and overlapping filenames are handled safely.
- Added best-effort rollback if a rename operation fails.
- Connected the secure preload script to the BrowserWindow.

### `electron/preload.cjs`

- Added a secure `contextBridge` API:
  - `chooseFolder`
  - `scanFolder`
  - `renameFiles`

### `src/main.ts`

- Replaced the old date-prefix interface with a batch rename interface.
- Added folder selection and file scanning.
- Added naming controls:
  - Name prefix
  - Starting number
  - Number width
- Added live filename previews.
- Added file removal and clear-list actions.
- Added sorting by filename or date.
- Added Electron desktop-mode renaming.
- Preserved a browser fallback that creates a renamed ZIP preview because normal browsers cannot modify arbitrary local files in place.

### `src/style.css`

- Replaced the previous visual design with a responsive file-organizer layout.
- Added a new Manrope and DM Mono typography system.
- Added setup, preview, naming-rule, status, and responsive mobile styles.
- Added visual states for empty queues, active sorting, disabled actions, and rename status.
- Added the colorful cartoon treatment, including paper texture, coral/yellow/mint/blue accents, bold outlines, offset shadows, and gentle motion.

### `index.html`

- Updated the theme color for the redesigned interface.
- Added the custom SnapSort SVG favicon.

### `vite.config.ts`

- Configured Vite with `base: './'` so JavaScript and CSS use relative asset paths in packaged Electron builds.

### `package.json`

- Updated the application version to `1.0.0`.
- Configured Electron Builder to use the custom icon.
- Configured a visible, non-one-click Windows NSIS setup wizard.

## Validation

The project passed the production build command:

```text
npm run build
```

The build completed successfully with TypeScript compilation and Vite production output.

The Windows installer was also generated successfully with:

```text
npm run desktop
```

The installer output is `release/SnapSort Setup 1.0.0.exe`. Vite continues to use `dist` for temporary web build files, while Electron installers and unpacked desktop builds are kept in `release`.

## Usage

For development, run:

```text
npm run dev
```

Then use the Electron desktop window and select a folder. Browser preview mode can be used with `npm run dev` through the Vite page, but it exports a ZIP instead of modifying local files directly.

For normal use after installation, launch SnapSort from the Windows Start Menu or desktop shortcut. No development command is required.
