<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'

const GITHUB_REPO = 'resumx/resumx'
const GITHUB_BRANCH = 'main'
const DOCS_DIR = 'docs'

const { page } = useData()
const dropdownOpen = ref(false)
const copied = ref(false)

const relativePath = computed(() => page.value.relativePath)

const githubUrl = computed(
	() => `https://github.com/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${DOCS_DIR}/${relativePath.value}`,
)

const rawGithubUrl = computed(
	() => `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${DOCS_DIR}/${relativePath.value}`,
)

const aiPrompt = computed(
	() => `Read ${rawGithubUrl.value}, I want to ask questions about it.`,
)

function copyMarkdown() {
	// ClipboardItem with a Promise<Blob> preserves the user gesture while resolving data async.
	const textPromise = fetch(rawGithubUrl.value)
		.then((res) => (res.ok ? res.text() : rawGithubUrl.value))
		.then((text) => new Blob([text], { type: 'text/plain' }))

	navigator.clipboard
		.write([new ClipboardItem({ 'text/plain': textPromise })])
		.then(() => {
			copied.value = true
			setTimeout(() => (copied.value = false), 2000)
		})
		.catch(() => {})
}

function openInGitHub() {
	window.open(githubUrl.value, '_blank')
	dropdownOpen.value = false
}

function openInMarkdown() {
	window.open(rawGithubUrl.value, '_blank')
	dropdownOpen.value = false
}

function openInChatGPT() {
	const encoded = encodeURIComponent(aiPrompt.value)
	window.open(`https://chatgpt.com/?q=${encoded}`, '_blank')
	dropdownOpen.value = false
}

function openInClaude() {
	const encoded = encodeURIComponent(aiPrompt.value)
	window.open(`https://claude.ai/new?q=${encoded}`, '_blank')
	dropdownOpen.value = false
}

function openInCursor() {
	const encoded = encodeURIComponent(aiPrompt.value)
	window.location.href = `cursor://compose?text=${encoded}`
	dropdownOpen.value = false
}

function toggleDropdown() {
	dropdownOpen.value = !dropdownOpen.value
}

function closeDropdown() {
	dropdownOpen.value = false
}

const wrapper = ref<HTMLElement | null>(null)

function handleClickOutside(e: MouseEvent) {
	if (wrapper.value && !wrapper.value.contains(e.target as Node)) {
		dropdownOpen.value = false
	}
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
	<div ref="wrapper" class="doc-actions">
		<button class="action-btn copy-btn" @click="copyMarkdown" :title="copied ? 'Copied!' : 'Copy Markdown'">
			<svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
			<svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
			<span>{{ copied ? 'Copied!' : 'Copy Markdown' }}</span>
		</button>
		<div class="dropdown-wrapper">
			<button class="action-btn dropdown-trigger" @click="toggleDropdown">
				<span>Open</span>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
			</button>
			<Transition name="dropdown">
				<div v-if="dropdownOpen" class="dropdown-menu">
					<button class="dropdown-item" @click="openInGitHub">
						<!-- GitHub icon -->
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
						<span>Open in GitHub</span>
						<svg class="external-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
					</button>
					<button class="dropdown-item" @click="openInChatGPT">
						<!-- ChatGPT icon -->
						<svg width="18" height="18" viewBox="0 0 256 260" fill="currentColor"><path d="M239.184 106.203a64.72 64.72 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.72 64.72 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.67 64.67 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.77 64.77 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483m-97.56 136.338a48.4 48.4 0 0 1-31.105-11.255l1.535-.87l51.67-29.825a8.6 8.6 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601M37.158 197.93a48.35 48.35 0 0 1-5.781-32.589l1.534.921l51.722 29.826a8.34 8.34 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803M23.549 85.38a48.5 48.5 0 0 1 25.58-21.333v61.39a8.29 8.29 0 0 0 4.195 7.316l62.874 36.272l-21.845 12.636a.82.82 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405zm179.466 41.695l-63.08-36.63L161.73 77.86a.82.82 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.54 8.54 0 0 0-4.4-7.213m21.742-32.69l-1.535-.922l-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.72.72 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391zM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87l-51.67 29.825a8.6 8.6 0 0 0-4.246 7.367zm11.868-25.58L128.067 97.3l28.188 16.218v32.434l-28.086 16.218l-28.188-16.218z"/></svg>
						<span>Open in ChatGPT</span>
						<svg class="external-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
					</button>
					<button class="dropdown-item" @click="openInClaude">
						<!-- Claude / Anthropic icon -->
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.304 3.541h-3.672l6.696 16.918H24Zm-10.608 0L0 20.459h3.744l1.37-3.553h7.005l1.369 3.553h3.744L10.536 3.541Zm-.371 10.223L8.616 7.82l2.291 5.945Z"/></svg>
						<span>Open in Claude</span>
						<svg class="external-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
					</button>
					<button class="dropdown-item" @click="openInCursor">
						<!-- Cursor IDE icon -->
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.503.131L1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"/></svg>
						<span>Open in Cursor</span>
						<svg class="external-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
					</button>
					<div class="dropdown-divider" />
					<button class="dropdown-item" @click="openInMarkdown">
						<!-- Markdown icon -->
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.27 19.385H1.73A1.73 1.73 0 0 1 0 17.655V6.345a1.73 1.73 0 0 1 1.73-1.73h20.54A1.73 1.73 0 0 1 24 6.345v11.308a1.73 1.73 0 0 1-1.73 1.731zM5.769 15.923v-4.5l2.308 2.885l2.307-2.885v4.5h2.308V8.078h-2.308l-2.307 2.885l-2.308-2.885H3.46v7.847zM21.232 12h-2.309V8.077h-2.307V12h-2.308l3.461 4.039z"/></svg>
						<span>Open in Markdown</span>
						<svg class="external-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
					</button>
				</div>
			</Transition>
		</div>
	</div>
</template>

<style scoped>
.doc-actions {
	display: flex;
	align-items: center;
	gap: 0;
	float: right;
	margin-top: 4px;
}

.action-btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	font-size: 13px;
	font-weight: 500;
	color: var(--vp-c-text-2);
	background: var(--vp-c-bg);
	border: 1px solid var(--vp-c-divider);
	cursor: pointer;
	transition: all 0.2s ease;
	font-family: var(--vp-font-family-base);
	line-height: 1;
	height: 32px;
	box-sizing: border-box;
}

.action-btn:hover {
	color: var(--vp-c-text-1);
	background: var(--vp-c-bg-soft);
	border-color: var(--vp-c-border);
}

.copy-btn {
	border-radius: 8px 0 0 8px;
	border-right-color: transparent;
}

.copy-btn:hover {
	border-right-color: var(--vp-c-border);
}

.dropdown-trigger {
	border-radius: 0 8px 8px 0;
	padding: 6px 8px;
}

.dropdown-wrapper {
	position: relative;
}

.dropdown-menu {
	position: absolute;
	top: calc(100% + 6px);
	right: 0;
	min-width: 220px;
	background: var(--vp-c-bg-elv);
	border: 1px solid var(--vp-c-divider);
	border-radius: 10px;
	padding: 4px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
	z-index: 100;
}

.dark .dropdown-menu {
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 4px rgba(0, 0, 0, 0.2);
}

.dropdown-item {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 8px 10px;
	font-size: 13px;
	font-weight: 500;
	color: var(--vp-c-text-1);
	background: none;
	border: none;
	border-radius: 7px;
	cursor: pointer;
	transition: background 0.15s ease;
	font-family: var(--vp-font-family-base);
	text-align: left;
}

.dropdown-item:hover {
	background: var(--vp-c-bg-soft);
}

.dropdown-item .external-icon {
	margin-left: auto;
	color: var(--vp-c-text-3);
	opacity: 0.5;
}

.dropdown-divider {
	height: 1px;
	margin: 4px 6px;
	background: var(--vp-c-divider);
}

/* Transition */
.dropdown-enter-active {
	transition: all 0.15s ease-out;
}
.dropdown-leave-active {
	transition: all 0.1s ease-in;
}
.dropdown-enter-from,
.dropdown-leave-to {
	opacity: 0;
	transform: translateY(-4px) scale(0.98);
}
</style>
