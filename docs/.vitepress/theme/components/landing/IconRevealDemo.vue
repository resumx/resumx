<script setup lang="ts">
/// <reference types="vite/client" />

import { ref, computed, onMounted, onUnmounted, reactive, nextTick } from 'vue'

const allIcons = import.meta.glob('../../../../../assets/icons/*.svg', {
	eager: true,
	import: 'default',
}) as Record<string, string>

const INITIAL = [
	'mongodb',
	'react',
	'python',
	'docker',
	'ts',
	'spring',
	'azure',
	'go',
	'vue',
	'kotlin',
	'swift',
	'laravel',
]

const EXTRA = [
	'redis',
	'svelte',
	'nextjs',
	'nodejs',
	'codeforces',
	'java',
	'ruby',
	'n8n',
	'git',
	'figma',
	'dart',
	'scala',
	'elixir',
	'gcp',
	'sass',
	'google',
	'k8s',
	'kibana',
	'nginx',
	'ocaml',
	'blender',
	'claude',
	'd3',
	'fastapi',
	'gradio',
	'haskell',
	'hrt',
	'meta',
	'netflix',
	'qt',
	'rails',
	'tesla',
	'adobe',
	'bain',
	'sap',
	'sst',
	'trpc',
	'pug',
	'pgsql',
	'kaggle',
	'julia',
	'etcd',
	'delphi',
]

type Icon = { slug: string; url: string }

function resolve(slug: string): Icon | null {
	const entry = Object.entries(allIcons).find(([p]) =>
		p.endsWith(`/${slug}.svg`),
	)
	return entry ? { slug, url: entry[1] } : null
}

const initialIcons = INITIAL.map(resolve).filter((v): v is Icon => v !== null)
const extraIcons = EXTRA.map(resolve).filter((v): v is Icon => v !== null)

const slots = ref<Icon[]>([...initialIcons])
const pool = ref<Icon[]>([...extraIcons])
const fadingSlots = reactive(new Set<number>())

type Breakpoint = 'xs' | 'ms' | 'ml' | 'lg' | 'xl'
const breakpoint = ref<Breakpoint>('xs')

const displayCount = computed(() => {
	switch (breakpoint.value) {
		case 'xs':
			return 8
		case 'ms':
			return 10
		case 'ml':
			return 4
		case 'xl':
			return 12
		default:
			return 9
	}
})
const displaySlots = computed(() =>
	slots.value.slice(0, displayCount.value).map((icon, i) => ({ ...icon, i })),
)

let mediaQueries: { mq: MediaQueryList; bp: Breakpoint }[] = []

function updateBreakpoint() {
	const w = window.innerWidth
	if (w < 480) breakpoint.value = 'xs'
	else if (w <= 767) breakpoint.value = 'ms'
	else if (w < 900) breakpoint.value = 'ml'
	else if (w < 1024) breakpoint.value = 'lg'
	else breakpoint.value = 'xl'
}

function onMediaChange() {
	const active = mediaQueries.find(({ mq }) => mq.matches)
	if (active) breakpoint.value = active.bp
}

const FADE_MS = 500
const SWAP_INTERVAL_MS = 1400
const INITIAL_DELAY_MS = 0
let swapTimer: ReturnType<typeof setInterval> | undefined

function pickSwapCount(): number {
	const r = Math.random()
	if (r < 0.6) return 1
	if (r < 0.9) return 2
	return 3
}

function swapRandomSlots() {
	const count = displayCount.value
	if (pool.value.length === 0) return

	const n = Math.min(pickSwapCount(), count, pool.value.length)
	const chosen: number[] = []

	while (chosen.length < n) {
		const idx = Math.floor(Math.random() * count)
		if (!fadingSlots.has(idx) && !chosen.includes(idx)) chosen.push(idx)
		if (chosen.length + fadingSlots.size >= count) break
	}

	for (const slotIdx of chosen) {
		fadingSlots.add(slotIdx)

		setTimeout(async () => {
			const old = slots.value[slotIdx]
			const pickIdx = Math.floor(Math.random() * pool.value.length)
			const replacement = pool.value[pickIdx]

			pool.value.splice(pickIdx, 1)
			pool.value.push(old)
			slots.value[slotIdx] = replacement

			await nextTick()
			fadingSlots.delete(slotIdx)
		}, FADE_MS)
	}
}

onMounted(() => {
	mediaQueries = [
		{ mq: window.matchMedia('(max-width: 479px)'), bp: 'xs' },
		{ mq: window.matchMedia('(min-width: 480px) and (max-width: 767px)'), bp: 'ms' },
		{ mq: window.matchMedia('(min-width: 768px) and (max-width: 899px)'), bp: 'ml' },
		{ mq: window.matchMedia('(min-width: 900px) and (max-width: 1023px)'), bp: 'lg' },
		{ mq: window.matchMedia('(min-width: 1024px)'), bp: 'xl' },
	]
	updateBreakpoint()
	mediaQueries.forEach(({ mq }) => mq.addEventListener('change', onMediaChange))

	setTimeout(() => {
		swapTimer = setInterval(swapRandomSlots, SWAP_INTERVAL_MS)
	}, INITIAL_DELAY_MS)
})

onUnmounted(() => {
	mediaQueries.forEach(({ mq }) => mq.removeEventListener('change', onMediaChange))
	if (swapTimer) clearInterval(swapTimer)
})
</script>

<template>
	<div class="icon-grid icon-grid--visible" :class="`icon-grid--${breakpoint}`">
		<div
			v-for="(icon, idx) in displaySlots"
			:key="idx"
			class="icon-cell"
			:style="{ '--i': icon.i }"
		>
			<div
				class="icon-cell-inner"
				:class="{ 'icon-cell-inner--hidden': fadingSlots.has(idx) }"
			>
				<div class="icon-cell-visual">
					<img :src="icon.url" :alt="icon.slug" class="icon-cell-img" />
				</div>
				<code class="icon-cell-code">:{{ icon.slug }}:</code>
			</div>
		</div>
	</div>
</template>

<style scoped>
.icon-grid {
	display: grid;
	gap: 0.75rem;
	justify-content: center;
	/* xs: 4x2 (8) under 480, ms: 5x2 (10) 480–767, ml: 2x2 (4), lg: 3x3 (9), xl: 4x3 (12) */
	grid-template-columns: repeat(5, 1fr);
	grid-template-rows: repeat(2, 1fr);
}

.icon-grid--xs {
	grid-template-columns: repeat(4, 1fr);
	grid-template-rows: repeat(2, 1fr);
}

.icon-grid--ms {
	grid-template-columns: repeat(5, 1fr);
	grid-template-rows: repeat(2, 1fr);
}

.icon-grid--ml {
	grid-template-columns: repeat(2, 1fr);
	grid-template-rows: repeat(2, 1fr);
}

.icon-grid--lg {
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: repeat(3, 1fr);
}

.icon-grid--xl {
	grid-template-columns: repeat(4, 1fr);
	grid-template-rows: repeat(3, 1fr);
}

.icon-cell {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0.75rem;
	min-width: 0;
	aspect-ratio: 1;
	border-radius: 12px;
	background: var(--vp-c-bg);
	border: 1px solid var(--vp-c-divider);
	transition:
		border-color 0.2s,
		box-shadow 0.2s;
}

.icon-cell-inner {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	transition: opacity 350ms ease;
}

.icon-cell-inner--hidden {
	opacity: 0;
}

.icon-cell:hover {
	border-color: var(--vp-c-brand-soft);
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.icon-cell-visual {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.25rem;
	height: 2.25rem;
}

.icon-cell-img {
	width: 2rem;
	height: 2rem;
	object-fit: contain;
	opacity: 0;
	transform: scale(0);
}

.icon-grid--visible .icon-cell-img {
	animation: icon-pop 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
	animation-delay: calc(var(--i) * 80ms);
}

@keyframes icon-pop {
	0% {
		opacity: 0;
		transform: scale(0);
	}
	100% {
		opacity: 1;
		transform: scale(1);
	}
}

.icon-cell-code {
	font-size: 0.6875rem;
	font-family: var(--vp-font-family-mono);
	color: #4b5563;
	background: none;
	padding: 0;
	line-height: 1;
	opacity: 0;
	transform: translateY(4px);
}

.icon-grid--visible .icon-cell-code {
	animation: label-in 0.35s ease-out forwards;
	animation-delay: calc(var(--i) * 80ms + 150ms);
}

.dark .icon-cell-code {
	color: var(--vp-c-text-3);
}

@keyframes label-in {
	0% {
		opacity: 0;
		transform: translateY(4px);
	}
	100% {
		opacity: 1;
		transform: translateY(0);
	}
}

@media (max-width: 640px) {
	.icon-grid {
		gap: 0.5rem;
	}

	.icon-cell {
		padding: 0.5rem;
		border-radius: 10px;
	}

	.icon-cell-visual {
		width: 1.75rem;
		height: 1.75rem;
	}

	.icon-cell-img {
		width: 1.5rem;
		height: 1.5rem;
	}

	.icon-cell-code {
		font-size: 0.5625rem;
	}
}
</style>
