<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

interface StepData {
	lineCount?: number
	codeHtmlAdded: string
	codeHtmlRemoved: string
}

interface Manifest {
	steps: StepData[]
}

const step = ref(0)
const direction = ref<'forward' | 'backward'>('forward')
const showArrowIndicator = ref(false)
let arrowIndicatorTimeout: ReturnType<typeof setTimeout> | null = null
const manifest = ref<Manifest | null>(null)
const codeBody = ref<HTMLDivElement>()
const sliderTrack = ref<HTMLDivElement>()
const isDragging = ref(false)
const hoverStep = ref<number | null>(null)
const userHasEngaged = ref(false)
let autoIntervalId: ReturnType<typeof setInterval> | null = null

const AUTO_STEP_MS = 1500

onMounted(async () => {
	const res = await fetch('/demos/page-fit/manifest.json')
	manifest.value = (await res.json()) as Manifest
	document.addEventListener('pointermove', onPointerMove)
	document.addEventListener('pointerup', onPointerUp)
	startAutoPlay()
})

onUnmounted(() => {
	document.removeEventListener('pointermove', onPointerMove)
	document.removeEventListener('pointerup', onPointerUp)
	stopAutoPlay()
})

function startAutoPlay() {
	if (!manifest.value || userHasEngaged.value) return
	stopAutoPlay()
	const maxStep = manifest.value.steps.length - 1
	if (maxStep <= 0) return
	let goingForward = true
	autoIntervalId = setInterval(() => {
		if (!manifest.value) return
		const max = manifest.value.steps.length - 1
		if (goingForward) {
			if (step.value >= max) {
				goingForward = false
				step.value = Math.max(0, max - 1)
			} else {
				step.value += 1
			}
		} else {
			if (step.value <= 0) {
				goingForward = true
				step.value = Math.min(1, max)
			} else {
				step.value -= 1
			}
		}
	}, AUTO_STEP_MS)
}

function stopAutoPlay() {
	if (autoIntervalId != null) {
		clearInterval(autoIntervalId)
		autoIntervalId = null
	}
}

function stepFromPointer(e: PointerEvent): number {
	const track = sliderTrack.value!
	const rect = track.getBoundingClientRect()
	const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
	const maxStep = manifest.value!.steps.length - 1
	return Math.round(ratio * maxStep)
}

function onPointerDown(e: PointerEvent) {
	e.preventDefault()
	userHasEngaged.value = true
	stopAutoPlay()
	isDragging.value = true
	step.value = stepFromPointer(e)
}

function onPointerMove(e: PointerEvent) {
	if (!isDragging.value) return
	step.value = stepFromPointer(e)
}

function onPointerUp() {
	isDragging.value = false
}

function onTrackHover(e: MouseEvent) {
	if (isDragging.value || !manifest.value) return
	const track = sliderTrack.value!
	const rect = track.getBoundingClientRect()
	const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
	const maxStep = manifest.value.steps.length - 1
	const snapped = Math.round(ratio * maxStep)
	hoverStep.value = snapped !== step.value ? snapped : null
}

function onTrackLeave() {
	hoverStep.value = null
}

const thumbPercent = computed(() => {
	if (!manifest.value) return 0
	const maxStep = manifest.value.steps.length - 1
	return maxStep > 0 ? (step.value / maxStep) * 100 : 0
})

const hoverPercent = computed(() => {
	if (hoverStep.value == null || !manifest.value) return null
	const maxStep = manifest.value.steps.length - 1
	return maxStep > 0 ? (hoverStep.value / maxStep) * 100 : 0
})

const currentCodeHtml = computed(() => {
	if (!manifest.value) return ''
	const s = manifest.value.steps[step.value]
	return direction.value === 'forward' ? s.codeHtmlAdded : s.codeHtmlRemoved
})

watch(step, (newVal, oldVal) => {
	direction.value = newVal >= oldVal ? 'forward' : 'backward'
	if (oldVal !== undefined && newVal !== oldVal) {
		if (arrowIndicatorTimeout) clearTimeout(arrowIndicatorTimeout)
		showArrowIndicator.value = true
		arrowIndicatorTimeout = setTimeout(() => {
			showArrowIndicator.value = false
			arrowIndicatorTimeout = null
		}, 550)
	}
})

</script>

<template>
	<section v-if="manifest" class="page-fit-demo">
		<div class="demo-header">
			<span class="demo-label">Auto Page Fitting</span>
			<h2 class="demo-heading">Add content freely. Layout adapts.</h2>
			<p class="demo-subtitle">
				Drag the slider to add more content. The layout compresses automatically
				to keep everything on one page.
			</p>
		</div>

		<div class="demo-panels">
			<div class="code-panel">
				<div class="panel-chrome">
					<span class="dot dot-r" />
					<span class="dot dot-y" />
					<span class="dot dot-g" />
					<span class="panel-title">resume.md</span>
				</div>
				<div ref="codeBody" class="code-body" v-html="currentCodeHtml" />
			</div>

			<div class="resume-panel">
				<div class="panel-chrome">
					<span class="dot dot-r" />
					<span class="dot dot-y" />
					<span class="dot dot-g" />
					<span class="panel-title">Preview</span>
				</div>
				<div class="resume-body">
					<img
						v-for="(_, i) in manifest.steps"
						:key="i"
						:src="`/demos/page-fit/step${i + 1}.png`"
						:class="['resume-img', { active: i === step }]"
						alt="Resume preview"
					/>
				</div>
			</div>
		</div>

		<div class="slider-row">
			<span class="slider-label">
				<span class="slider-arrow-indicator-wrap">
					<Transition name="arrow-indicator">
						<span
							v-if="showArrowIndicator"
							:class="['slider-arrow-indicator', direction === 'forward' ? 'arrow-up' : 'arrow-down']"
							aria-hidden="true"
						>
							<svg
								v-if="direction === 'forward'"
								class="arrow-svg"
								viewBox="0 0 12 12"
								aria-hidden="true"
							>
								<path d="M6 2L2 10h8L6 2z" fill="#34c759" />
							</svg>
							<svg
								v-else
								class="arrow-svg"
								viewBox="0 0 12 12"
								aria-hidden="true"
							>
								<path d="M6 10L2 2h8L6 10z" fill="var(--vp-c-brand-1)" />
							</svg>
						</span>
					</Transition>
				</span>
				<span class="slider-label-number-wrap">
					<Transition :name="direction === 'forward' ? 'label-up' : 'label-down'">
						<span :key="step" class="slider-label-number">{{ manifest.steps[step].lineCount }}</span>
					</Transition>
				</span>
				<span class="slider-label-static">lines</span>
			</span>
			<div
				ref="sliderTrack"
				class="slider-track"
				@pointerdown="onPointerDown"
				@mousemove="onTrackHover"
				@mouseleave="onTrackLeave"
			>
				<div class="slider-fill" :style="{ width: thumbPercent + '%' }" />
				<div class="slider-thumb" :style="{ left: thumbPercent + '%' }" />
				<div
					v-if="hoverPercent != null"
					class="slider-thumb slider-thumb-ghost"
					:style="{ left: hoverPercent + '%' }"
				/>
			</div>
		</div>
	</section>
</template>

<style scoped>
.page-fit-demo {
	padding: 1.5rem 1rem;
}

@media (min-width: 640px) {
	.page-fit-demo {
		padding: 2rem 2rem;
	}
}

.demo-header {
	text-align: center;
	margin-bottom: 1rem;
}

@media (min-width: 768px) {
	.demo-header {
		margin-bottom: 2rem;
	}
}

.demo-label {
	display: inline-block;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--vp-c-brand-1);
	margin-bottom: 0.5rem;
}

.demo-heading {
	font-size: 1.75rem;
	font-weight: 700;
	letter-spacing: -0.025em;
	line-height: 1.35;
	margin: 0 0 0.5rem;
	border: none !important;
}

@media (min-width: 640px) {
	.demo-heading {
		font-size: 2.25rem;
	}
}

.demo-subtitle {
	margin: 0 auto;
	max-width: 36rem;
	font-size: 0.9375rem;
	color: var(--vp-c-text-2);
	line-height: 1.6;
}

.demo-panels {
	display: grid;
	grid-template-columns: 1fr;
	gap: 10px;
	margin-bottom: 1rem;
	border-radius: 10px;
	border: 1px solid var(--vp-c-divider);
	padding: 0.85rem;
	background-color: var(--vp-c-bg);
	background-image: repeating-linear-gradient(
		135deg,
		transparent,
		transparent 10px,
		var(--vp-c-divider) 10px,
		var(--vp-c-divider) 11px
	);
}

@media (min-width: 768px) {
	.demo-panels {
		grid-template-columns: 1fr minmax(calc((600px - 2.5rem) * 210 / 297), auto);
		grid-template-rows: 600px;
		gap: 16px;
		padding: 0.85rem;
	}
}

.panel-chrome {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 10px 14px;
	background: var(--vp-c-bg-soft);
	border-bottom: 1px solid var(--vp-c-divider);
}

.dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
}

.dot-r {
	background: #ff5c5f;
}

.dot-y {
	background: #fac800;
}

.dot-g {
	background: #34c759;
}

.panel-title {
	font-size: 0.75rem;
	color: var(--vp-c-text-2);
	margin-left: 6px;
	font-family: var(--vp-font-family-base);
}

/* Code panel */
.code-panel {
	border: 1px solid var(--vp-c-divider);
	border-radius: 10px;
	overflow: hidden;
	background: var(--vp-code-block-bg);
	display: flex;
	flex-direction: column;
	max-height: 180px;
}

@media (min-width: 768px) {
	.code-panel {
		max-height: none;
	}
}

.code-body {
	padding: 8px 0;
	font-family: var(--vp-font-family-mono);
	font-size: 11px;
	line-height: 1.5;
	color: var(--vp-c-text-1);
	overflow-y: auto;
	flex: 1;
	min-height: 0;
	scrollbar-width: none;
	-ms-overflow-style: none;
}

.code-body::-webkit-scrollbar {
	display: none;
}

.code-body :deep(.code-line) {
	padding: 0 8px;
	white-space: pre;
}

.code-body :deep(.line-new) {
	background: rgba(166, 227, 161, 0.1);
	border-left: 2px solid #a6e3a1;
}

.code-body :deep(.line-del) {
	background: rgba(243, 139, 168, 0.1);
	border-left: 2px solid #f38ba8;
}

.code-body :deep(.ln) {
	color: #4b5563;
	user-select: none;
	display: inline-block;
	width: 20px;
	text-align: right;
	margin-right: 8px;
}

.code-body :deep(.hl-delim) {
	color: #89b4fa;
}
.code-body :deep(.hl-h1) {
	color: #0e7490;
	font-weight: bold;
}
.code-body :deep(.hl-h2) {
	color: #0e7490;
}
.code-body :deep(.hl-h3) {
	color: #0b6b84;
}
.code-body :deep(.hl-dash) {
	color: #b45309;
}
.code-body :deep(.hl-meta) {
	color: #5c6370;
	font-style: italic;
}
.code-body :deep(.hl-pages-key) {
	color: #c73e5c;
	font-weight: bold;
}
.code-body :deep(.hl-pages-val) {
	color: #1e6b2e;
	font-weight: bold;
}
.code-body :deep(.hl-key) {
	color: #7c3aed;
}
.code-body :deep(.hl-val) {
	color: #1e6b2e;
}

/* Resume panel */
.resume-panel {
	border: 1px solid var(--vp-c-divider);
	border-radius: 10px;
	overflow: hidden;
	background: var(--vp-c-bg-soft);
	display: flex;
	flex-direction: column;
}

.resume-body {
	position: relative;
	overflow: hidden;
	width: 100%;
	aspect-ratio: 210 / 297;
	max-height: 260px;
	background: #fff;
}

@media (min-width: 768px) {
	.resume-body {
		flex: 1;
		min-height: 0;
		max-height: none;
		width: auto;
		align-self: center;
	}
}

.resume-img {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: contain;
	opacity: 0;
	transition: opacity 0.25s ease 0.17s;
	pointer-events: none;
}

.resume-img.active {
	opacity: 1;
}

/* Slider */
.slider-row {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 0.5rem 0;
	min-height: 24px;
}

.slider-label {
	position: relative;
	display: inline-flex;
	align-items: center;
	font-size: 0.8125rem;
	font-weight: 600;
	color: var(--vp-c-text-1);
	min-width: 5rem;
	height: 24px;
}

.slider-arrow-indicator-wrap {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 24px;
	margin-right: 2px;
	flex-shrink: 0;
}

.slider-arrow-indicator {
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.slider-arrow-indicator .arrow-svg {
	width: 14px;
	height: 14px;
	display: block;
}

.slider-arrow-indicator.arrow-up {
	animation: arrow-fade-in-up 0.5s ease-out;
}

.slider-arrow-indicator.arrow-down {
	animation: arrow-fade-in-down 0.5s ease-out;
}

@keyframes arrow-fade-in-up {
	from {
		opacity: 0;
		transform: translateY(4px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes arrow-fade-in-down {
	from {
		opacity: 0;
		transform: translateY(-4px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.arrow-indicator-enter-active {
	transition: opacity 0.25s ease-out;
}

.arrow-indicator-leave-active {
	transition: opacity 0.2s ease-in;
}

.arrow-indicator-enter-from,
.arrow-indicator-leave-to {
	opacity: 0;
}

.slider-label-number-wrap {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	position: relative;
	width: 3ch;
	height: 24px;
	overflow: visible;
	text-align: right;
	flex-shrink: 0;
}

.slider-label-number {
	display: block;
	width: 100%;
	text-align: right;
	line-height: 24px;
}

.slider-label-static {
	flex-shrink: 0;
	margin-left: 0.3em;
	white-space: nowrap;
	line-height: 24px;
}

/* Forward: new label slides down in, old slides down out */
.label-down-enter-active,
.label-down-leave-active {
	transition:
		transform 0.5s ease-out,
		opacity 0.5s ease-out;
}
.label-down-enter-from,
.label-down-leave-to {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
}
.label-down-enter-from {
	transform: translateY(-100%);
	opacity: 0;
}
.label-down-leave-to {
	transform: translateY(100%);
	opacity: 0;
}

/* Backward: new label slides up in, old slides up out */
.label-up-enter-active,
.label-up-leave-active {
	transition:
		transform 0.5s ease-out,
		opacity 0.5s ease-out;
}
.label-up-enter-from,
.label-up-leave-to {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
}
.label-up-enter-from {
	transform: translateY(100%);
	opacity: 0;
}
.label-up-leave-to {
	transform: translateY(-100%);
	opacity: 0;
}

.slider-track {
	flex: 1;
	height: 6px;
	background: var(--vp-c-divider);
	border-radius: 3px;
	cursor: pointer;
	position: relative;
	touch-action: none;
}

.slider-track::before {
	content: '';
	position: absolute;
	inset: -14px 0;
}

.slider-fill {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	border-radius: 3px;
	background: var(--vp-c-text-3);
	transition: width 0.5s ease-in-out;
	pointer-events: none;
}

.slider-thumb {
	position: absolute;
	top: 50%;
	width: 18px;
	height: 18px;
	border-radius: 50%;
	background: var(--vp-c-text-2);
	border: 2px solid var(--vp-c-bg);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
	transform: translate(-50%, -50%);
	transition: left 0.5s ease-in-out;
	pointer-events: none;
}

.slider-thumb-ghost {
	opacity: 0.35;
	box-shadow: none;
}
</style>
