import JSZip from 'jszip'
import './style.css'

type NativeFile = { path: string; name: string; size: number; modified: number; extension: string }
type Picture = NativeFile & { id: number; file?: File }
type SortMode = 'name' | 'date'

declare global {
  interface Window {
    snapSort?: {
      chooseFolder: () => Promise<string | null>
      scanFolder: (folderPath: string) => Promise<NativeFile[]>
      renameFiles: (files: NativeFile[], options: { prefix: string; start: number; digits: number }) => Promise<string[]>
    }
  }
}

const pictures: Picture[] = []
let nextId = 0
let folderPath = ''
let sortMode: SortMode = 'name'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="app-shell">
    <header class="topbar"><a class="brand" href="#"><span class="brand-icon">↗</span><span>SnapSort</span></a><div class="topbar-right"><span class="mode-pill"><span class="live-dot"></span>${window.snapSort ? 'Desktop mode' : 'Browser preview'}</span><span class="version">BATCH RENAME TOOL</span></div></header>
    <section class="hero"><div class="hero-copy"><p class="eyebrow">FILE ORGANIZER / 01</p><h1>Rename the whole<br><span>story at once.</span></h1><p class="lede">Turn a messy folder of screenshots into a sequence you can actually find. Set the rule once, check the preview, and let SnapSort do the repetitive part.</p></div><div class="hero-note"><span class="note-mark">✦</span><p>Built for the hundred-file moments.<br><strong>Simple rules. Zero busywork.</strong></p></div></section>
    <section class="workspace">
      <aside class="setup-column">
        <div class="section-label"><span>01</span><div><strong>Choose a folder</strong><small>We only look at image files.</small></div></div>
        <button class="folder-button" id="folder-button" type="button"><span class="folder-symbol">＋</span><span><strong id="folder-button-label">Select image folder</strong><small id="folder-status">Pick the folder that holds your screenshots</small></span><span class="arrow">→</span></button>
        <input id="file-input" type="file" accept="image/*" multiple hidden><button class="browser-files" id="browser-files" type="button">Or add files for a preview <span>↗</span></button>
        <div class="section-label pattern-label"><span>02</span><div><strong>Set the naming rule</strong><small>Every file gets the same pattern.</small></div></div>
        <label class="field-label" for="prefix-input">Name prefix</label><input class="text-input" id="prefix-input" value="Screenshot" autocomplete="off">
        <div class="field-grid"><div><label class="field-label" for="start-input">Start at</label><input class="text-input" id="start-input" value="1" inputmode="numeric"></div><div><label class="field-label" for="digits-input">Number width</label><select class="text-input" id="digits-input"><option value="1">1 digit</option><option value="2" selected>2 digits</option><option value="3">3 digits</option><option value="4">4 digits</option></select></div></div>
        <div class="pattern-card"><span>Example output</span><strong id="pattern-preview">Screenshot_01.png</strong></div><button class="rename-button" id="rename-button" type="button" disabled><span>Rename files</span><span>↗</span></button><p class="privacy-copy"><span>◎</span> Files stay on this device. SnapSort never uploads your pictures.</p>
      </aside>
      <section class="preview-column">
        <div class="preview-header"><div class="section-label"><span>03</span><div><strong>Review changes</strong><small id="preview-subtitle">Your files will appear here</small></div></div><span class="file-count" id="file-count">0 FILES</span></div>
        <div class="toolbar"><span>ORDER BY</span><button class="sort-button active" data-sort="name" type="button">Name <span>↕</span></button><button class="sort-button" data-sort="date" type="button">Date added <span>↕</span></button></div>
        <div class="file-list" id="file-list"><div class="empty-state"><div class="empty-stack"><span>IMG</span><span>IMG</span><span>IMG</span></div><strong>Nothing queued yet</strong><p>Select a folder to see the rename preview.</p></div></div><div class="preview-footer"><span id="footer-message">Waiting for a folder</span><button class="clear-button" id="clear-button" type="button" disabled>Clear list</button></div>
      </section>
    </section>
    <footer><span>SNAPSORT <b>·</b> A quieter way to handle files</span><span>PNG · JPG · GIF · WEBP · TIFF</span></footer>
  </main>`

const folderButton = document.querySelector<HTMLButtonElement>('#folder-button')!
const folderButtonLabel = document.querySelector<HTMLElement>('#folder-button-label')!
const folderStatus = document.querySelector<HTMLElement>('#folder-status')!
const fileInput = document.querySelector<HTMLInputElement>('#file-input')!
const browserFilesButton = document.querySelector<HTMLButtonElement>('#browser-files')!
const prefixInput = document.querySelector<HTMLInputElement>('#prefix-input')!
const startInput = document.querySelector<HTMLInputElement>('#start-input')!
const digitsInput = document.querySelector<HTMLSelectElement>('#digits-input')!
const patternPreview = document.querySelector<HTMLElement>('#pattern-preview')!
const renameButton = document.querySelector<HTMLButtonElement>('#rename-button')!
const fileList = document.querySelector<HTMLDivElement>('#file-list')!
const fileCount = document.querySelector<HTMLElement>('#file-count')!
const previewSubtitle = document.querySelector<HTMLElement>('#preview-subtitle')!
const footerMessage = document.querySelector<HTMLElement>('#footer-message')!
const clearButton = document.querySelector<HTMLButtonElement>('#clear-button')!

function extension(file: { extension: string; name: string }) { return file.extension || file.name.split('.').pop()?.toLowerCase() || 'png' }
function outputName(file: Picture, index: number) { return `${prefixInput.value.trim() || 'Screenshot'}_${String((Number(startInput.value) || 1) + index).padStart(Number(digitsInput.value), '0')}.${extension(file)}` }
function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB` }
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] ?? character)) }
function sortedPictures() { return [...pictures].sort((a, b) => sortMode === 'name' ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }) : a.modified - b.modified) }

function render() {
  const currentPictures = sortedPictures()
  const prefix = prefixInput.value.trim() || 'Screenshot'
  patternPreview.textContent = `${prefix}_${String(Number(startInput.value) || 1).padStart(Number(digitsInput.value), '0')}.png`
  fileCount.textContent = `${pictures.length} ${pictures.length === 1 ? 'FILE' : 'FILES'}`
  clearButton.disabled = pictures.length === 0
  renameButton.disabled = pictures.length === 0 || !prefixInput.value.trim()
  renameButton.innerHTML = `<span>${folderPath ? 'Rename files' : 'Download preview ZIP'}</span><span>${folderPath ? '↗' : '↓'}</span>`
  previewSubtitle.textContent = pictures.length ? `${folderPath || 'Browser preview'} · ${sortMode === 'name' ? 'alphabetical order' : 'date added'}` : 'Your files will appear here'
  if (!pictures.length) { fileList.innerHTML = '<div class="empty-state"><div class="empty-stack"><span>IMG</span><span>IMG</span><span>IMG</span></div><strong>Nothing queued yet</strong><p>Select a folder to see the rename preview.</p></div>'; return }
  fileList.innerHTML = currentPictures.map((picture, index) => `<div class="file-row"><span class="row-number">${String(index + 1).padStart(2, '0')}</span><span class="file-type">${extension(picture).toUpperCase()}</span><div class="file-info"><strong>${escapeHtml(picture.name)}</strong><span>${formatBytes(picture.size)}</span></div><span class="rename-arrow">→</span><strong class="new-name">${escapeHtml(outputName(picture, index))}</strong><button class="remove-button" data-id="${picture.id}" aria-label="Remove ${escapeHtml(picture.name)}" type="button">×</button></div>`).join('')
  fileList.querySelectorAll<HTMLButtonElement>('.remove-button').forEach((button) => button.addEventListener('click', () => { const index = pictures.findIndex((picture) => picture.id === Number(button.dataset.id)); if (index >= 0) pictures.splice(index, 1); render() }))
}

async function loadFolder() {
  if (!window.snapSort) { fileInput.click(); return }
  const selectedPath = await window.snapSort.chooseFolder()
  if (!selectedPath) return
  const files = await window.snapSort.scanFolder(selectedPath)
  folderPath = selectedPath
  pictures.splice(0, pictures.length, ...files.map((file) => ({ ...file, id: nextId++ })))
  folderButtonLabel.textContent = selectedPath.split(/[\\/]/).pop() || 'Selected folder'
  folderStatus.textContent = `${pictures.length} image${pictures.length === 1 ? '' : 's'} found`
  footerMessage.textContent = pictures.length ? 'Ready to rename' : 'No supported images found'
  render()
}

function addBrowserFiles(files: FileList | File[]) {
  const additions = Array.from(files).filter((file) => file.type.startsWith('image/')).map((file) => ({ path: '', name: file.name, size: file.size, modified: file.lastModified, extension: extension({ extension: '', name: file.name }), id: nextId++, file }))
  folderPath = ''
  pictures.splice(0, pictures.length, ...additions)
  folderButtonLabel.textContent = 'Preview files selected'
  folderStatus.textContent = 'Browser mode cannot rename in place'
  footerMessage.textContent = 'Download a ZIP from this preview'
  render()
}

async function downloadZip() {
  if (!pictures.length) return
  renameButton.disabled = true
  renameButton.innerHTML = '<span>Building ZIP…</span><span>↗</span>'
  const zip = new JSZip()
  sortedPictures().forEach((picture, index) => { if (picture.file) zip.file(outputName(picture, index), picture.file) })
  const blob = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${prefixInput.value.trim() || 'Screenshot'}-renamed.zip`
  link.click()
  URL.revokeObjectURL(link.href)
  footerMessage.textContent = 'Preview ZIP downloaded'
  render()
}

folderButton.addEventListener('click', () => void loadFolder())
browserFilesButton.addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', () => { if (fileInput.files) addBrowserFiles(fileInput.files); fileInput.value = '' })
;[prefixInput, startInput, digitsInput].forEach((input) => input.addEventListener('input', () => { if (input === startInput) startInput.value = startInput.value.replace(/\D/g, '').slice(0, 5); render() }))
document.querySelectorAll<HTMLButtonElement>('.sort-button').forEach((button) => button.addEventListener('click', () => { sortMode = button.dataset.sort as SortMode; document.querySelectorAll('.sort-button').forEach((item) => item.classList.toggle('active', item === button)); render() }))
clearButton.addEventListener('click', () => { pictures.splice(0); folderPath = ''; folderButtonLabel.textContent = 'Select image folder'; folderStatus.textContent = 'Pick the folder that holds your screenshots'; footerMessage.textContent = 'Waiting for a folder'; render() })
renameButton.addEventListener('click', async () => {
  if (!window.snapSort || !folderPath) { await downloadZip(); return }
  renameButton.disabled = true
  renameButton.innerHTML = '<span>Renaming…</span><span>↗</span>'
  try {
    await window.snapSort.renameFiles(sortedPictures(), { prefix: prefixInput.value.trim(), start: Number(startInput.value) || 1, digits: Number(digitsInput.value) })
    footerMessage.textContent = `${pictures.length} files renamed successfully`
    folderStatus.textContent = 'Rename complete'
    pictures.splice(0)
    render()
  } catch (error) {
    footerMessage.textContent = error instanceof Error ? error.message : 'Rename failed. No files were changed.'
    render()
  }
})

render()
