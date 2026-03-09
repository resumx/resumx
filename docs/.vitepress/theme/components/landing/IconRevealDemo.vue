<script setup lang="ts">
/// <reference types="vite/client" />

import { ref, computed, onMounted, onUnmounted } from 'vue'

const allIcons = import.meta.glob('../../../../../assets/icons/*.svg', {
	eager: true,
	import: 'default',
}) as Record<string, string>

const FEATURED = [
	'github',
	'react',
	'python',
	'docker',
	'figma',
	'rust',
	'aws',
	'go',
	'vue',
	'graphql',
	'tailwindcss',
	'vercel',
]

const icons = FEATURED.map((slug, i) => {
	const entry = Object.entries(allIcons).find(([p]) =>
		p.endsWith(`/${slug}.svg`),
	)
	return entry ? { slug, url: entry[1], i } : null
}).filter((v): v is { slug: string; url: string; i: number } => v !== null)

type Breakpoint = 'xs' | 'sm' | 'md' | 'ml' | 'lg' | 'xl'
const breakpoint = ref<Breakpoint>('xs')

const displayCount = computed(() => {
	switch (breakpoint.value) {
		case 'xs':
			return 8
		case 'ml':
			return 4
		case 'xl':
			return 12
		default:
			return 9
	}
})
const displayIcons = computed(() => icons.slice(0, displayCount.value))

let mediaQueries: { mq: MediaQueryList; bp: Breakpoint }[] = []

function updateBreakpoint() {
	const w = window.innerWidth
	if (w < 480) breakpoint.value = 'xs'
	else if (w < 640) breakpoint.value = 'sm'
	else if (w < 768) breakpoint.value = 'md'
	else if (w < 900) breakpoint.value = 'ml'
	else if (w < 1024) breakpoint.value = 'lg'
	else breakpoint.value = 'xl'
}

function onMediaChange() {
	const active = mediaQueries.find(({ mq }) => mq.matches)
	if (active) breakpoint.value = active.bp
}

onMounted(() => {
	mediaQueries = [
		{ mq: window.matchMedia('(max-width: 479px)'), bp: 'xs' },
		{ mq: window.matchMedia('(min-width: 480px) and (max-width: 639px)'), bp: 'sm' },
		{ mq: window.matchMedia('(min-width: 640px) and (max-width: 767px)'), bp: 'md' },
		{ mq: window.matchMedia('(min-width: 768px) and (max-width: 899px)'), bp: 'ml' },
		{ mq: window.matchMedia('(min-width: 900px) and (max-width: 1023px)'), bp: 'lg' },
		{ mq: window.matchMedia('(min-width: 1024px)'), bp: 'xl' },
	]
	updateBreakpoint()
	mediaQueries.forEach(({ mq }) => mq.addEventListener('change', onMediaChange))
})

onUnmounted(() => {
	mediaQueries.forEach(({ mq }) => mq.removeEventListener('change', onMediaChange))
})
</script>

<template>
	<div class="icon-grid icon-grid--visible" :class="`icon-grid--${breakpoint}`">
		<div
			v-for="icon in displayIcons"
			:key="icon.slug"
			class="icon-cell"
			:style="{ '--i': icon.i }"
		>
			<div class="icon-cell-visual">
				<img :src="icon.url" :alt="icon.slug" class="icon-cell-img" />
			</div>
			<code class="icon-cell-code">:{{ icon.slug }}:</code>
		</div>
	</div>
</template>

<style scoped>
.icon-grid {
	display: grid;
	gap: 0.75rem;
	justify-content: center;
	/* xs: 4x2 (8) under 480, sm/md: 5x2 (9) under 768, ml: 2x2 (4), lg: 3x3 (9), xl: 4x3 (12) */
	grid-template-columns: repeat(5, 1fr);
	grid-template-rows: repeat(2, 1fr);
}

.icon-grid--xs {
	grid-template-columns: repeat(4, 1fr);
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
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
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
	color: var(--vp-c-text-3);
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
