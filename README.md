# SnapSort

SnapSort is a desktop-friendly batch image renaming application for Windows. It helps you rename large groups of screenshots or pictures in one operation instead of changing each filename manually.

For example, a folder containing `Screenshot_1.png`, `Screenshot_2.png`, and `Screenshot_3.png` can be renamed using a consistent pattern such as `Project_01.png`, `Project_02.png`, and `Project_03.png`.

## What the App Offers

SnapSort solves one specific problem: renaming many image files with a consistent numbering pattern.

### Browser version

The browser version is useful for demonstrations, quick previews, and users who do not want to install an application. It lets you:

1. Select multiple local image files with the browser file picker.
2. Enter a filename prefix, such as `Project`.
3. Choose the starting number, such as `1`.
4. Choose the number width, such as `2 digits`.
5. Preview results such as `Project_01.png`, `Project_02.png`, and `Project_03.png`.
6. Sort the selected files by name or date added.
7. Remove individual files from the preview.
8. Download the renamed images as a ZIP file.

Browsers cannot directly modify arbitrary files in a local folder, so browser mode creates a renamed ZIP instead of changing the original files.

### Windows desktop version

The Windows desktop version provides the complete local workflow. It lets you:

1. Choose an image folder from the Windows folder picker.
2. Scan the folder for supported image files.
3. Preview every original filename and its proposed new filename.
4. Configure the prefix, starting number, and number width.
5. Sort the rename order by filename or modification date.
6. Rename the files directly inside the selected folder.
7. Prevent overwriting unrelated existing files.
8. Handle filename swaps safely through temporary staging names.
9. Attempt a rollback if the rename operation fails.

Files remain on the local device. SnapSort does not upload or send pictures to a server.
- Use a colorful 2D cartoon-style interface with a custom SnapSort app icon.

Supported image formats:

- PNG
- JPG and JPEG
- GIF
- WEBP
- BMP
- TIF and TIFF

## Technical Skills and Stack Used

### Frontend and user interface

- **HTML** creates the application structure and controls.
- **CSS** provides the responsive layout, colorful 2D cartoon visual style, file preview rows, forms, buttons, and mobile layout.
- **TypeScript** implements the renderer logic, form handling, sorting, preview generation, validation, and user interactions.
- **Vite** serves the frontend during development and bundles the production browser assets.
- **Vite `base: './'` configuration** makes JavaScript and CSS load correctly when Electron opens the built app through local `file://` URLs.

### Desktop and filesystem functionality

- **Electron** wraps the frontend in a Windows desktop application.
- **Node.js `fs/promises`** scans image folders, reads file metadata, and renames files.
- **Electron IPC** connects the renderer to the main process for folder selection, folder scanning, and renaming.
- **Electron `contextBridge`** exposes only the required native operations while keeping Node.js APIs unavailable to the renderer.
- **Temporary staging filenames** prevent collisions when filenames overlap or are being exchanged.

### File export and packaging

- **JSZip** creates renamed ZIP downloads in browser mode.
- **Electron Builder** creates the Windows NSIS installer and unpacked desktop build.
- **NSIS configuration** provides a visible setup wizard, installation-folder selection, desktop shortcuts, and Start Menu shortcuts.
- **SVG** is used for the custom SnapSort cartoon icon and browser favicon.
- **Concurrently** starts Vite and Electron together during development.
- **wait-on** ensures Electron starts after the Vite development server is available.

## Requirements

- Windows 10 or later is recommended for the packaged desktop application.
- Node.js 20 or later is recommended.
- npm 10 or later is recommended.
- Write permission for the folders whose files will be renamed.
- An internet connection is useful during installation and development because the interface references Google Fonts. The core rename operation itself is local.

Check installed versions:

```powershell
node --version
npm --version
```

## Setup

Clone or open the project, then install its dependencies:

```powershell
npm install
```

## Running the App

### Development desktop mode

This starts Vite and Electron together:

```powershell
npm run dev
```

Use the Electron window to select an image folder and perform an in-place rename.

### Browser development mode

To run only the Vite development server:

```powershell
npx vite
```

Open the URL shown by Vite in a browser. Browser mode can preview selected image files and download a renamed ZIP, but normal browsers cannot rename arbitrary files directly inside a local folder.

### Production build

Build the renderer and production assets:

```powershell
npm run build
```

Preview the built web assets:

```powershell
npm run preview
```

### Package the desktop app

Create a Windows installer/build output:

```powershell
npm run desktop
```

The generated installer is a standard setup wizard. It shows installation progress, allows the installation directory to be changed, creates Start Menu and desktop shortcuts, and displays a completion screen. The installer is generated under `release`, for example `release/SnapSort Setup 1.0.0.exe`. Keeping installers in `release` prevents a later Vite build from deleting them when it cleans `dist`.

After installation, launch SnapSort from the Windows Start Menu or desktop shortcut. You do not need VS Code, Node.js, or `npm run dev` to use the installed application.

Create an unpacked desktop build for testing:

```powershell
npm run desktop:dir
```

## Scheduler Setup for Reminders

A reminder scheduler is not currently implemented in SnapSort. The current application is an on-demand renaming tool and has no background process, reminder settings, notification service, or scheduler configuration.

No scheduler setup is required for the current version.

A future scheduler feature could include:

- Saved rename jobs and source folders.
- A schedule such as daily, weekly, or on a specific date.
- Windows notifications before a job runs.
- A background Electron process or Windows Task Scheduler integration.
- A job history and confirmation/error log.

Until that feature exists, reminders must be managed externally using Windows Task Scheduler, Calendar, or another reminder application.

## Testing

The current project does not include an automated test suite. The available verification command is the production build:

```powershell
npm run build
```

The build runs TypeScript compilation and Vite bundling. For manual testing, verify the following:

1. Start the app with `npm run dev`.
2. Select a test folder containing copies of images.
3. Confirm the preview lists the expected files and new names.
4. Change the prefix, starting number, number width, and sort order.
5. Confirm that duplicate or already-existing destination names are rejected.
6. Confirm that a successful rename produces the expected filenames.
7. Test browser preview mode and confirm that the renamed ZIP downloads correctly.

Always test with copies of important files before using batch rename on production data.

## License

No license has been declared for this project yet. Until a license file is added, all rights are reserved by the copyright holder. Do not redistribute, modify, or use this project commercially without permission.

To publish the project under an open-source license, add a `LICENSE` file and update this section with the selected license, such as MIT, Apache-2.0, or GPL-3.0.
