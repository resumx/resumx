<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { data as playgroundData } from './playground.data'

const DEFAULT_CONTENT = playgroundData.markdown

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

const markdown = ref(DEFAULT_CONTENT)
const previewHtml = ref('')
const warnings = ref<string[]>([])
const error = ref('')
const loading = ref(false)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const scale = ref(1)
const iframeHeight = ref(A4_HEIGHT_PX)
const highlightedCode = ref('')

interface ShikiHighlighter {
	codeToHtml(
		code: string,
		options: {
			lang: string
			themes: { light: string; dark: string }
		},
	): string
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingRender = false
let rendering = false
let resizeObserver: ResizeObserver | null = null
let highlighter: ShikiHighlighter | null = null

function updateHighlight(): void {
	if (!highlighter) return
	highlightedCode.value = highlighter.codeToHtml(markdown.value, {
		lang: 'markdown',
		themes: { light: 'github-light', dark: 'github-dark-dimmed' },
	})
}

function updateScale(): void {
	const container = containerRef.value
	if (!container) return
	const { height } = container.getBoundingClientRect()
	scale.value = Math.min(1, height / iframeHeight.value)
}

const previewColWidth = computed(() => Math.ceil(A4_WIDTH_PX * scale.value) + 2)

function measureContentHeight(): void {
	const iframe = iframeRef.value
	if (!iframe) return
	const doc = iframe.contentDocument
	if (!doc) return
	const contentH = doc.documentElement.scrollHeight
	iframeHeight.value = Math.max(contentH, A4_HEIGHT_PX)
}

function applyPreview(html: string, warns: string[]): void {
	previewHtml.value = html
	warnings.value = warns
	writeToIframe(html)
	measureContentHeight()
	updateScale()
}

async function renderPreview(): Promise<void> {
	if (rendering) {
		pendingRender = true
		return
	}

	if (markdown.value === DEFAULT_CONTENT && playgroundData.html) {
		applyPreview(playgroundData.html, [])
		return
	}

	rendering = true
	loading.value = true
	error.value = ''

	try {
		const res = await fetch('/api/preview', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ markdown: markdown.value }),
		})

		const data = (await res.json()) as {
			html?: string
			error?: string
			warnings?: string[]
		}

		if (!res.ok) {
			error.value = data.error ?? 'Preview failed'
			return
		}

		await nextTick()
		applyPreview(data.html ?? '', data.warnings ?? [])
	} catch {
		error.value = 'Failed to connect to preview server'
	} finally {
		loading.value = false
		rendering = false
		if (pendingRender) {
			pendingRender = false
			renderPreview()
		}
	}
}

function writeToIframe(html: string): void {
	const iframe = iframeRef.value
	if (!iframe) return
	const doc = iframe.contentDocument
	if (!doc) return
	doc.open()
	doc.write(html)
	doc.close()
}

function onInput(): void {
	updateHighlight()
	if (debounceTimer) clearTimeout(debounceTimer)
	debounceTimer = setTimeout(renderPreview, 150)
}

function handleTab(e: KeyboardEvent): void {
	if (e.key !== 'Tab') return
	e.preventDefault()
	const textarea = e.target as HTMLTextAreaElement
	const start = textarea.selectionStart
	const end = textarea.selectionEnd
	markdown.value =
		markdown.value.substring(0, start) + '  ' + markdown.value.substring(end)
	nextTick(() => {
		textarea.selectionStart = textarea.selectionEnd = start + 2
	})
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.tex', '.json', '.yaml', '.yml']
const converting = ref(false)
const isDraggingFile = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const turnstileRef = ref<HTMLElement | null>(null)
const verificationDialogRef = ref<HTMLDialogElement | null>(null)
let dragCounter = 0
let pendingBase64 = ''
let pendingFilename = ''
let turnstileWidgetId: string | undefined

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
	| string
	| undefined

interface TurnstileApi {
	render(el: HTMLElement, opts: Record<string, unknown>): string
	reset(id: string): void
	remove(id: string): void
}

function getTurnstile(): TurnstileApi | undefined {
	return (window as unknown as Record<string, unknown>).turnstile as
		| TurnstileApi
		| undefined
}

function waitForTurnstile(timeout = 10000): Promise<void> {
	return new Promise((resolve, reject) => {
		const start = Date.now()
		const check = () => {
			if (getTurnstile()) return resolve()
			if (Date.now() - start > timeout)
				return reject(new Error('Turnstile load timeout'))
			setTimeout(check, 100)
		}
		check()
	})
}

function loadTurnstileScript(): Promise<void> {
	if (getTurnstile()) return Promise.resolve()

	if (
		document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')
	) {
		return waitForTurnstile()
	}

	return new Promise((resolve, reject) => {
		const cbName = '__turnstileReady_' + Date.now()
		;(window as unknown as Record<string, unknown>)[cbName] = () => {
			delete (window as unknown as Record<string, unknown>)[cbName]
			resolve()
		}
		const script = document.createElement('script')
		script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${cbName}`
		script.async = true
		script.onerror = () => {
			delete (window as unknown as Record<string, unknown>)[cbName]
			reject(new Error('Failed to load Turnstile'))
		}
		document.head.appendChild(script)
	})
}

async function renderTurnstileWidget(): Promise<void> {
	if (!TURNSTILE_SITE_KEY) return
	try {
		await loadTurnstileScript()
	} catch {
		error.value = 'Failed to load verification. Please try again.'
		return
	}
	const api = getTurnstile()
	if (!api || !turnstileRef.value) return
	if (turnstileWidgetId) api.remove(turnstileWidgetId)
	turnstileWidgetId = api.render(turnstileRef.value, {
		sitekey: TURNSTILE_SITE_KEY,
		callback: (token: string) => {
			retryWithToken(token)
		},
		'error-callback': () => {
			error.value = 'Verification failed. Please try again.'
			closeVerification()
		},
	})
}

async function openVerification(): Promise<void> {
	verificationDialogRef.value?.showModal()
	await renderTurnstileWidget()
}

let verificationRetrying = false

function cleanupTurnstile(): void {
	const api = getTurnstile()
	if (turnstileWidgetId && api) {
		api.remove(turnstileWidgetId)
		turnstileWidgetId = undefined
	}
}

function handleDialogClose(): void {
	cleanupTurnstile()
	if (!verificationRetrying) {
		converting.value = false
		pendingBase64 = ''
		pendingFilename = ''
	}
}

function closeVerification(): void {
	verificationDialogRef.value?.close()
}

async function retryWithToken(token: string): Promise<void> {
	const base64 = pendingBase64
	const filename = pendingFilename
	pendingBase64 = ''
	pendingFilename = ''
	verificationRetrying = true
	verificationDialogRef.value?.close()
	if (!base64 || !filename) {
		verificationRetrying = false
		return
	}

	error.value = ''

	try {
		const data = await callConvertApi(base64, filename, token)
		markdown.value = data
		updateHighlight()
		renderPreview()
	} catch (err) {
		error.value = err instanceof Error ? err.message : 'Import failed'
	} finally {
		converting.value = false
		verificationRetrying = false
	}
}

function isAcceptedFile(file: File): boolean {
	return ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
}

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result as string
			resolve(result.split(',')[1] ?? '')
		}
		reader.onerror = reject
		reader.readAsDataURL(file)
	})
}

async function callConvertApi(
	base64: string,
	filename: string,
	token?: string,
): Promise<string> {
	const res = await fetch('/api/convert', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			file: base64,
			filename,
			turnstileToken: token || undefined,
		}),
	})

	const contentType = res.headers.get('content-type') ?? ''
	if (!contentType.includes('application/json')) {
		throw new Error(
			res.status === 404 ?
				'Conversion API not available'
			:	`Unexpected response (${res.status})`,
		)
	}

	const data = (await res.json()) as {
		markdown?: string
		error?: string
	}

	if (!res.ok || data.error) {
		throw new Error(data.error ?? `Server error (${res.status})`)
	}

	if (!data.markdown) throw new Error('No markdown returned')
	return data.markdown
}

async function convertFile(file: File): Promise<void> {
	if (!isAcceptedFile(file)) {
		const ext = file.name.slice(file.name.lastIndexOf('.'))
		error.value = `Unsupported format (${ext}). Accepted: PDF, DOCX, LaTeX, JSON, YAML.`
		return
	}

	converting.value = true
	error.value = ''

	let base64 = ''
	let needsVerification = false
	try {
		base64 = await fileToBase64(file)
		const data = await callConvertApi(base64, file.name)
		markdown.value = data
		updateHighlight()
		renderPreview()
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Import failed'
		if (msg === 'Verification required' && TURNSTILE_SITE_KEY) {
			pendingBase64 = base64
			pendingFilename = file.name
			needsVerification = true
		} else {
			error.value = msg
		}
	} finally {
		if (!needsVerification) converting.value = false
	}
	if (needsVerification) openVerification()
}

function openFilePicker(): void {
	fileInputRef.value?.click()
}

function handleFileSelect(e: Event): void {
	const input = e.target as HTMLInputElement
	const file = input.files?.[0]
	if (file) convertFile(file)
	input.value = ''
}

function handleEditorDragEnter(e: DragEvent): void {
	if (!e.dataTransfer?.types.includes('Files')) return
	e.preventDefault()
	dragCounter++
	isDraggingFile.value = true
}

function handleEditorDragLeave(): void {
	dragCounter--
	if (dragCounter <= 0) {
		dragCounter = 0
		isDraggingFile.value = false
	}
}

function handleEditorDrop(e: DragEvent): void {
	dragCounter = 0
	isDraggingFile.value = false
	const file = e.dataTransfer?.files[0]
	if (file) convertFile(file)
}

function downloadMarkdown(): void {
	const blob = new Blob([markdown.value], { type: 'text/markdown' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = 'resume.md'
	a.click()
	URL.revokeObjectURL(url)
}

onMounted(() => {
	resizeObserver = new ResizeObserver(() => updateScale())
	if (containerRef.value) resizeObserver.observe(containerRef.value)
	updateScale()
	renderPreview()
})

onUnmounted(() => {
	resizeObserver?.disconnect()
	closeVerification()
})
</script>

<template>
	<div class="playground">
		<div class="playground-header">
			<div class="header-left">
				<p>
					Write Markdown, see your resume rendered live.
					<span class="hint-cli">
						For PDF export and page fitting,
						<a href="/guide/quick-start">install the CLI</a>.
					</span>
				</p>
			</div>
			<div class="header-actions">
				<input
					ref="fileInputRef"
					type="file"
					:accept="ACCEPTED_EXTENSIONS.join(',')"
					class="sr-only"
					@change="handleFileSelect"
				/>
				<button
					class="action-btn"
					@click="openFilePicker"
					title="Import resume from PDF, DOCX, etc."
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="17 8 12 3 7 8" />
						<line x1="12" y1="3" x2="12" y2="15" />
					</svg>
					Import
				</button>
				<button
					class="action-btn"
					@click="downloadMarkdown"
					title="Download as resume.md"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					Download .md
				</button>
			</div>
		</div>

		<div v-if="warnings.length > 0" class="warnings">
			<span v-for="(w, i) in warnings" :key="i" class="warning-item">{{
				w
			}}</span>
		</div>

		<div v-if="error" class="error-bar">{{ error }}</div>

		<div
			class="editor-layout"
			:style="{ '--preview-w': previewColWidth + 'px' }"
		>
			<div
				class="editor-pane"
				@dragenter="handleEditorDragEnter"
				@dragover.prevent
				@dragleave="handleEditorDragLeave"
				@drop.prevent="handleEditorDrop"
			>
				<div class="pane-label">Markdown</div>
				<div class="editor-area">
					<textarea
						v-model="markdown"
						class="editor-textarea"
						:disabled="converting"
						spellcheck="false"
						autocomplete="off"
						autocorrect="off"
						autocapitalize="off"
						@input="onInput"
						@keydown="handleTab"
					/>
					<div v-if="isDraggingFile" class="editor-drop-overlay">
						<svg
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17 8 12 3 7 8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
						<span>Drop to import</span>
					</div>
					<div v-if="converting" class="editor-converting-overlay">
						<div class="converting-spinner" />
						<span>Converting…</span>
					</div>
				</div>
			</div>

			<div class="preview-pane">
				<div class="pane-label">
					<span>Preview</span>
					<span v-if="loading" class="loading-dot" />
				</div>
				<div
					ref="containerRef"
					:class="['preview-container', { 'preview-loading': loading }]"
				>
					<div
						class="preview-page"
						:style="{
							width: A4_WIDTH_PX * scale + 'px',
							height: iframeHeight * scale + 'px',
						}"
					>
						<iframe
							ref="iframeRef"
							class="preview-iframe"
							:style="{
								width: A4_WIDTH_PX + 'px',
								height: iframeHeight + 'px',
								transform: `scale(${scale})`,
							}"
							sandbox="allow-same-origin allow-scripts"
							title="Resume preview"
						/>
					</div>
				</div>
			</div>
		</div>

		<dialog
			ref="verificationDialogRef"
			class="verify-dialog"
			@close="handleDialogClose"
		>
			<div class="verify-dialog-header">
				<h2 class="verify-dialog-title">Quick verification</h2>
				<button
					class="verify-dialog-close"
					aria-label="Close"
					@click="closeVerification"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M18 6 6 18" />
						<path d="m6 6 12 12" />
					</svg>
				</button>
			</div>
			<div class="verify-dialog-body">
				<p class="verify-dialog-subtitle">
					Complete the check below to import your resume.
				</p>
				<div ref="turnstileRef" class="verify-turnstile" />
			</div>
		</dialog>
	</div>
</template>

<style scoped>
.playground {
	margin: 0 auto;
	padding: 24px 12px;
	max-width: 1400px;
	width: calc(100% - 38px);
}

.playground-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 16px;
}

@media (max-width: 640px) {
	.playground-header {
		flex-direction: column;
		gap: 12px;
	}
	.header-actions {
		width: 100%;
		justify-content: flex-start;
	}
}

.header-left {
	min-width: 0;
}

.header-left h1 {
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0 0 4px;
	line-height: 1.3;
}

.header-left p {
	margin: 0;
	font-size: 0.9rem;
	color: var(--vp-c-text-2);
	line-height: 1.5;
}

@media (max-width: 640px) {
	.header-left p {
		font-size: 0.875rem;
	}
}

.hint-cli a {
	color: var(--vp-c-brand-1) !important;
	text-decoration: none !important;
}

.hint-cli a:hover {
	text-decoration: underline !important;
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	border: 0;
}

.header-actions {
	display: flex;
	gap: 8px;
	flex-shrink: 0;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 14px;
	font-size: 13px;
	font-weight: 500;
	color: var(--vp-c-text-2);
	background: var(--vp-c-bg-soft);
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	cursor: pointer;
	flex-shrink: 0;
	transition: all 0.15s;
}

.action-btn:hover {
	color: var(--vp-c-text-1);
	border-color: var(--vp-c-text-3);
}

.warnings {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 12px;
}

.warning-item {
	font-size: 12px;
	color: var(--vp-c-yellow-1);
	background: var(--vp-c-yellow-soft);
	padding: 4px 10px;
	border-radius: 4px;
}

.error-bar {
	font-size: 13px;
	color: var(--vp-c-red-1);
	background: var(--vp-c-red-soft);
	padding: 8px 12px;
	border-radius: 6px;
	margin-bottom: 12px;
}

.editor-layout {
	display: grid;
	grid-template-columns: 1fr var(--preview-w, 1fr);
	gap: 16px;
	height: calc(100vh - 200px);
	min-height: 500px;
}

.editor-pane,
.preview-pane {
	display: flex;
	flex-direction: column;
	min-height: 0;
}

.pane-label {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--vp-c-text-3);
	padding: 0 2px 8px;
}

.loading-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--vp-c-brand-1);
	animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
	0%,
	100% {
		opacity: 0.3;
	}
	50% {
		opacity: 1;
	}
}

.editor-area {
	position: relative;
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

.editor-drop-overlay,
.editor-converting-overlay {
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	border-radius: 8px;
	z-index: 10;
}

.editor-drop-overlay {
	pointer-events: none;
}

.editor-drop-overlay {
	background: color-mix(in srgb, var(--vp-c-bg) 80%, transparent);
	border: 2px dashed var(--vp-c-brand-1);
	color: var(--vp-c-brand-1);
	font-size: 14px;
	font-weight: 500;
}

.editor-converting-overlay {
	background: color-mix(in srgb, var(--vp-c-bg) 85%, transparent);
	border: 1px solid var(--vp-c-divider);
	font-size: 13px;
	color: var(--vp-c-text-2);
}

.converting-spinner {
	width: 24px;
	height: 24px;
	border: 2px solid var(--vp-c-divider);
	border-top-color: var(--vp-c-text-1);
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.editor-textarea {
	flex: 1;
	width: 100%;
	resize: none;
	font-family: var(--vp-font-family-mono);
	font-size: 13px;
	line-height: 1.65;
	tab-size: 2;
	color: var(--vp-c-text-1);
	background: var(--vp-code-block-bg);
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	padding: 16px 18px;
	outline: none;
	transition: border-color 0.15s;
}

.preview-container {
	flex: 1;
	min-height: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	overflow: hidden;
	background: var(--vp-c-bg-soft);
}

.preview-page {
	overflow: hidden;
}

.preview-container.preview-loading {
	outline: 1.5px solid var(--vp-c-brand-1);
	outline-offset: 0;
	animation: outline-pulse 1s ease-in-out infinite;
}

@keyframes outline-pulse {
	0%,
	100% {
		outline-color: color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent);
	}
	50% {
		outline-color: var(--vp-c-brand-1);
	}
}

.preview-iframe {
	border: none;
	background: #fff;
	display: block;
	transform-origin: top left;
}

@media (max-width: 1024px) {
	.editor-layout {
		grid-template-columns: 1fr;
		height: auto;
	}

	.editor-pane {
		height: 45vh;
		min-height: 300px;
	}

	.preview-pane {
		height: 50vh;
		min-height: 350px;
	}
}
</style>

<style>
.verify-dialog {
	position: fixed;
	inset: 0;
	z-index: 200;
	width: 100%;
	max-width: 420px;
	margin: auto;
	padding: 0;
	border: 1px solid var(--vp-c-divider);
	border-radius: 12px;
	background-color: var(--vp-c-bg);
	color: var(--vp-c-text-1);
	box-shadow:
		0 25px 50px -12px rgba(0, 0, 0, 0.25),
		0 0 0 1px rgba(0, 0, 0, 0.05);
}

.verify-dialog::backdrop {
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(4px);
}

.verify-dialog[open] {
	display: flex;
	flex-direction: column;
	animation: verify-in 0.2s ease-out;
}

@keyframes verify-in {
	from {
		opacity: 0;
		transform: scale(0.96) translateY(8px);
	}
	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

.verify-dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.25rem 1rem;
	border-bottom: 1px solid var(--vp-c-divider);
	flex-shrink: 0;
}

.verify-dialog-title {
	margin: 0;
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--vp-c-text-1);
	border: none !important;
}

.verify-dialog-close {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 16px;
	background: transparent;
	color: var(--vp-c-text-2);
	cursor: pointer;
	transition: all 0.15s ease;
}

.verify-dialog-close:hover {
	background-color: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
}

.verify-dialog-body {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	padding: 1.25rem 1.5rem 1.5rem;
}

.verify-dialog-subtitle {
	margin: 0;
	font-size: 0.8125rem;
	color: var(--vp-c-text-2);
	text-align: center;
}

.verify-turnstile {
	display: flex;
	justify-content: center;
	min-height: 65px;
}
</style>
