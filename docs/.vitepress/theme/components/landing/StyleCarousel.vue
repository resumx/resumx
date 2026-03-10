<script setup lang="ts">
/// <reference types="vite/client" />
import { ref, computed, onMounted, onUnmounted } from 'vue'

const galleryImages = import.meta.glob('../../../../../gallery/png/*.png', {
	eager: true,
	import: 'default',
}) as Record<string, string>

interface Theme {
	slug: string
	image: string
}

const SLUGS = ['default', 'oxford', 'seattle', 'tokyo', 'zurich'] as const

const themes: Theme[] = SLUGS.map(slug => {
	const entry = Object.entries(galleryImages).find(([p]) =>
		p.endsWith(`/${slug}.png`),
	)
	if (!entry) throw new Error(`Missing gallery image: ${slug}`)
	return { slug, image: entry[1] }
})

const active = ref(0)
const hovering = ref(false)
const viewportEl = ref<HTMLElement>()
const vpWidth = ref(800)

let timer: ReturnType<typeof setInterval> | null = null
let resizeObs: ResizeObserver | null = null
let goingForward = true

const AUTO_MS = 4000
const GAP_PX = 16

const slideW = computed(() => {
	const vw = vpWidth.value
	if (vw >= 1024) return (vw - GAP_PX * 4) / 5.5
	if (vw >= 640) return (vw - GAP_PX * 2) / 3.5
	return vw * 0.55
})

const vpHeightPx = computed(() => {
	const frameH = slideW.value * (297 / 210)
	return Math.round(Math.max(frameH + 40, 280))
})

const maxVisible = computed(() => (vpWidth.value >= 1024 ? 2 : 1))

function go(i: number) {
	active.value = Math.max(0, Math.min(themes.length - 1, i))
}

function next() {
	if (active.value < themes.length - 1) active.value++
}

function prev() {
	if (active.value > 0) active.value--
}

function autoAdvance() {
	const max = themes.length - 1
	if (goingForward) {
		if (active.value >= max) {
			goingForward = false
			active.value--
		} else {
			active.value++
		}
	} else {
		if (active.value <= 0) {
			goingForward = true
			active.value++
		} else {
			active.value--
		}
	}
}

function resetTimer() {
	if (timer) clearInterval(timer)
	timer = setInterval(() => {
		if (!hovering.value) autoAdvance()
	}, AUTO_MS)
}

onMounted(() => {
	resetTimer()
	if (viewportEl.value) {
		vpWidth.value = viewportEl.value.clientWidth
		resizeObs = new ResizeObserver(entries => {
			vpWidth.value = entries[0].contentRect.width
		})
		resizeObs.observe(viewportEl.value)
	}
})

onUnmounted(() => {
	if (timer) clearInterval(timer)
	if (resizeObs) resizeObs.disconnect()
})

let startX = 0

function onPointerDown(e: PointerEvent) {
	startX = e.clientX
}

function onPointerUp(e: PointerEvent) {
	const dx = e.clientX - startX
	if (Math.abs(dx) < 40) return
	if (dx < 0) next()
	else prev()
	resetTimer()
}

function slideStyle(i: number): Record<string, string> {
	const diff = i - active.value
	const abs = Math.abs(diff)
	const offset = diff * (slideW.value + GAP_PX)

	let scale: number
	let opacity: number

	if (abs === 0) {
		scale = 1
		opacity = 1
	} else if (abs === 1) {
		scale = 0.92
		opacity = 0.65
	} else if (abs <= maxVisible.value) {
		scale = 0.85
		opacity = 0.4
	} else {
		scale = 0.8
		opacity = 0
	}

	return {
		transform: `translateX(calc(-50% + ${offset}px)) scale(${scale})`,
		opacity: String(opacity),
		zIndex: String(10 - abs),
		pointerEvents: abs === 0 ? 'auto' : 'none',
	}
}
</script>

<template>
	<div
		class="style-carousel"
		@mouseenter="hovering = true"
		@mouseleave="hovering = false"
	>
		<div
			ref="viewportEl"
			class="carousel-viewport"
			:style="{ height: vpHeightPx + 'px' }"
			@pointerdown="onPointerDown"
			@pointerup="onPointerUp"
		>
			<div
				v-for="(theme, i) in themes"
				:key="theme.slug"
				class="carousel-slide"
				:style="slideStyle(i)"
			>
				<div class="slide-frame" :style="{ width: slideW + 'px' }">
					<img
						:src="theme.image"
						:alt="`${theme.slug} theme`"
						class="slide-img"
						loading="lazy"
						draggable="false"
					/>
				</div>
			</div>
		</div>

		<button
			class="nav-btn nav-btn--prev"
			:class="{ 'nav-btn--disabled': active === 0 }"
			aria-label="Previous theme"
			@click="prev(); resetTimer()"
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
				<path d="m15 18-6-6 6-6" />
			</svg>
		</button>
		<button
			class="nav-btn nav-btn--next"
			:class="{ 'nav-btn--disabled': active === themes.length - 1 }"
			aria-label="Next theme"
			@click="next(); resetTimer()"
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
				<path d="m9 18 6-6-6-6" />
			</svg>
		</button>

		<div class="carousel-dots">
			<button
				v-for="(theme, i) in themes"
				:key="theme.slug"
				class="carousel-dot"
				:class="{ active: i === active }"
				:aria-label="`${theme.slug} theme`"
				@click="go(i); resetTimer()"
			/>
		</div>
	</div>
</template>

<style scoped>
.style-carousel {
	position: relative;
}

.carousel-viewport {
	position: relative;
	overflow: hidden;
	cursor: grab;
	touch-action: pan-y;
}

.carousel-slide {
	position: absolute;
	left: 50%;
	top: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	transition:
		transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
		opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-frame {
	aspect-ratio: 210 / 297;
	border-radius: 8px;
	overflow: hidden;
	background: #fff;
	border: 1px solid var(--vp-c-divider);
	box-shadow:
		0 2px 16px rgba(0, 0, 0, 0.07),
		0 1px 3px rgba(0, 0, 0, 0.04);
}

.slide-img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
	user-select: none;
}

/* Nav buttons — hidden on mobile, swipe handles it */
.nav-btn {
	position: absolute;
	top: 50%;
	transform: translateY(calc(-50% - 0.75rem));
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: 1px solid var(--vp-c-divider);
	background: var(--vp-c-bg);
	color: var(--vp-c-text-2);
	display: none;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition:
		border-color 0.2s ease,
		color 0.2s ease,
		box-shadow 0.2s ease,
		opacity 0.2s ease;
	z-index: 20;
}

@media (min-width: 640px) {
	.nav-btn {
		display: flex;
	}
}

.nav-btn:hover:not(.nav-btn--disabled) {
	border-color: var(--vp-c-text-3);
	color: var(--vp-c-text-1);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.nav-btn--disabled {
	opacity: 0.3;
	cursor: default;
	pointer-events: none;
}

.nav-btn--prev {
	left: 0.5rem;
}

.nav-btn--next {
	right: 0.5rem;
}

@media (min-width: 1024px) {
	.nav-btn--prev {
		left: 1rem;
	}
	.nav-btn--next {
		right: 1rem;
	}
}

/* Dots: min 24px touch target for accessibility */
.carousel-dots {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
	padding-top: 1rem;
}

.carousel-dot {
	width: 24px;
	height: 24px;
	min-width: 24px;
	min-height: 24px;
	border-radius: 50%;
	border: none;
	background: var(--vp-c-divider);
	cursor: pointer;
	transition:
		background 0.25s ease,
		transform 0.25s ease;
	padding: 0;
	position: relative;
}

.carousel-dot::before {
	content: '';
	position: absolute;
	inset: 50%;
	width: 8px;
	height: 8px;
	margin: -4px 0 0 -4px;
	border-radius: 50%;
	background-color: var(--vp-c-divider);
	transition: background 0.25s ease, transform 0.25s ease;
}

.carousel-dot:hover::before {
	background-color: var(--vp-c-text-3);
}

.carousel-dot.active::before {
	background-color: var(--vp-c-brand-1);
	transform: scale(1.25);
}

.carousel-dot:hover {
	background: transparent;
}

.carousel-dot.active {
	background: transparent;
}
</style>
