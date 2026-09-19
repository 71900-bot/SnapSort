# SnapSort Change Notes

Date: 2026-09-19

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

### `index.html`

- Updated the theme color for the redesigned interface.

## Validation

The project passed the production build command:

```text
npm run build
```

The build completed successfully with TypeScript compilation and Vite production output.

## Usage

For the real in-place rename workflow, run:

```text
npm run dev
```

Then use the Electron desktop window and select a folder. Browser preview mode can be used with `npm run dev` through the Vite page, but it exports a ZIP instead of modifying local files directly.
