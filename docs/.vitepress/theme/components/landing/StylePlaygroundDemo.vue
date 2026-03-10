<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

const SKILLS = [
	{ term: 'Languages', values: 'TypeScript, Python' },
	{ term: 'Frameworks', values: 'React, Node.js, Express' },
	{ term: 'Tools', values: 'Docker, AWS, Git' },
]

const ROW_H = 42
const ROW_GAP = 12
const GRID_ROW_H = 46
const COL_GAP_PCT = 2.5

const gridOn = ref(false)

const colorIdx = ref(0)
const COLOR_DISPLAY = ["'#333'", "'#2563eb'", "'#c43218'"]
const COLOR_CSS = ['', '#2563eb', '#c43218']

const alignIdx = ref(0)
const ALIGN_DISPLAY = ['left', 'center', 'right']

const borderIdx = ref(0)
const BORDER_DISPLAY = ['1.5px solid currentColor', 'none']

interface FmOption {
	key: string
	values: string[]
	index: Ref<number>
}

const FM_OPTIONS: FmOption[] = [
	{ key: 'section-title-color', values: COLOR_DISPLAY, index: colorIdx },
	{ key: 'section-title-align', values: ALIGN_DISPLAY, index: alignIdx },
	{ key: 'section-title-border', values: BORDER_DISPLAY, index: borderIdx },
]

const headingStyle = computed((): Record<string, string> => {
	const s: Record<string, string> = {}
	if (COLOR_CSS[colorIdx.value]) s.color = COLOR_CSS[colorIdx.value]
	if (borderIdx.value > 0) s.borderBottomColor = 'transparent'
	return s
})

const ALIGN_LEFT: Record<string, string> = {
	left: '0%',
	center: '50%',
	right: '100%',
}
const ALIGN_TX: Record<string, string> = {
	left: '0%',
	center: '-50%',
	right: '-100%',
}

const headingTextStyle = computed((): Record<string, string> => {
	const align = ALIGN_DISPLAY[alignIdx.value]
	return {
		left: ALIGN_LEFT[align],
		transform: `translateX(${ALIGN_TX[align]})`,
	}
})

const containerHeight = computed(() => {
	if (gridOn.value) return `${GRID_ROW_H}px`
	return `${SKILLS.length * ROW_H + (SKILLS.length - 1) * ROW_GAP}px`
})

function skillStyle(index: number): Record<string, string> {
	const colW = (100 - COL_GAP_PCT * (SKILLS.length - 1)) / SKILLS.length
	if (gridOn.value) {
		return {
			top: '0',
			left: `${index * (colW + COL_GAP_PCT)}%`,
			width: `${colW}%`,
		}
	}
	return {
		top: `${index * (ROW_H + ROW_GAP)}px`,
		left: '0',
		width: '100%',
	}
}

const fmEngaged = ref(false)
const contentEngaged = ref(false)

interface AutoStep {
	apply: () => void
	dwell: number
}

const AUTO_STEPS: AutoStep[] = [
	{ apply() { colorIdx.value = 1 }, dwell: 2000 },
	{ apply() { alignIdx.value = 1 }, dwell: 2000 },
	{ apply() { borderIdx.value = 1 }, dwell: 2000 },
	{
		apply() {
			colorIdx.value = 0
			alignIdx.value = 0
			borderIdx.value = 0
		},
		dwell: 2500,
	},
]

let stepIdx = 0
let autoTimer: ReturnType<typeof setTimeout> | null = null

function tick() {
	if (fmEngaged.value) return
	AUTO_STEPS[stepIdx].apply()
	const { dwell } = AUTO_STEPS[stepIdx]
	stepIdx = (stepIdx + 1) % AUTO_STEPS.length
	autoTimer = setTimeout(tick, dwell)
}

function stopAuto() {
	if (autoTimer != null) {
		clearTimeout(autoTimer)
		autoTimer = null
	}
}

function cycleOption(opt: FmOption) {
	if (!fmEngaged.value) {
		fmEngaged.value = true
		stopAuto()
	}
	opt.index.value = (opt.index.value + 1) % opt.values.length
}

function toggleGrid() {
	contentEngaged.value = true
	gridOn.value = !gridOn.value
}

onMounted(() => {
	autoTimer = setTimeout(tick, 1500)
})

onUnmounted(() => {
	stopAuto()
})
</script>

<template>
	<div class="style-playground">
		<div class="playground-doc">
			<!-- Frontmatter block -->
			<div class="fm-block">
				<div class="fm-delim">---</div>
				<div class="fm-root">style:</div>
				<div
					v-for="(opt, i) in FM_OPTIONS"
					:key="opt.key"
					class="fm-line"
					:class="{ 'fm-line--changed': opt.index.value > 0 }"
					role="button"
					tabindex="0"
					@click="cycleOption(opt)"
					@keydown.enter.space.prevent="cycleOption(opt)"
				>
					<span class="fm-indent">&nbsp;&nbsp;</span>
					<span class="fm-key">{{ opt.key }}:</span>
					<Transition name="val" mode="out-in">
						<span
							class="fm-val"
							:key="opt.values[opt.index.value]"
						>
							{{ opt.values[opt.index.value] }}
						</span>
					</Transition>
				</div>
				<div class="fm-delim">---</div>
			</div>

			<!-- Content area: click toggles grid -->
			<div
				class="content-area"
				role="button"
				tabindex="0"
				@click="toggleGrid"
				@keydown.enter.space.prevent="toggleGrid"
			>
				<Transition name="hint-fade">
					<span
						v-if="!contentEngaged"
						class="click-hint"
						aria-hidden="true"
					>
						<svg width="40" height="40" viewBox="0 0 24 24"><path fill="currentColor" d="M17 9h2v3h-2zm-4-2h2v4h-2zM9 3h2v8H9zM5 3h2v10H5zm14 6h2v2h-2zm-4-2h2v2h-2zm-4 0h2v2h-2zM7 1h2v2H7zM3 11h2v2H3zm-2 2h2v2H1zm0 2h2v2H1zm2 2h2v2H3zm2 2h2v2H5zm2 2h12v2H7zm12-2h2v2h-2zm2-8h2v8h-2zM5 13h2v2H5zm2 2h2v2H7z"/></svg>
					</span>
				</Transition>

				<!-- Section heading mockup -->
				<div class="doc-heading" :style="headingStyle">
					<span class="doc-heading-text" :style="headingTextStyle">Technical Skills</span>
				</div>

				<!-- Fence open -->
				<div class="ann-line">
					<span class="ann-fence">::: </span>
					<span class="ann-brace">{</span>
					<span
						class="ann-classes"
						:class="{ 'ann-classes--on': gridOn }"
						>.grid .grid-cols-3</span
					>
					<span class="ann-brace">}</span>
				</div>

				<!-- Skills: absolute positioned -->
				<div class="doc-skills" :style="{ height: containerHeight }">
					<div
						v-for="(skill, i) in SKILLS"
						:key="skill.term"
						class="skill-group"
						:style="skillStyle(i)"
					>
						<div class="skill-term">{{ skill.term }}</div>
						<div class="skill-values">{{ skill.values }}</div>
					</div>
				</div>

				<!-- Fence close -->
				<div class="ann-line ann-line--close">
					<span class="ann-fence">:::</span>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.style-playground {
	border: 1px solid var(--vp-c-divider);
	border-radius: 10px;
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

.playground-doc {
	background: var(--vp-c-bg);
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	overflow: hidden;
}

/* --- Frontmatter block --- */
.fm-block {
	font-family: var(--vp-font-family-mono);
	font-size: 0.8rem;
	line-height: 1.6;
	padding: 0.75rem 1.25rem;
	border-bottom: 1px solid var(--vp-c-divider);
	background: color-mix(in srgb, var(--vp-c-bg-soft) 50%, var(--vp-c-bg));
}

.fm-delim {
	color: var(--vp-c-text-2);
	opacity: 0.7;
}

.fm-root {
	color: var(--vp-c-text-2);
}

.fm-line {
	cursor: pointer;
	border-radius: 4px;
	padding: 4px 6px;
	margin: 0 -6px;
	transition: background 0.12s ease;
	white-space: nowrap;
}

.fm-line:hover {
	background: var(--vp-c-default-soft);
}

.fm-key {
	color: var(--vp-c-text-1);
}

.fm-val {
	display: inline-block;
	margin-left: 0.5ch;
	color: var(--vp-c-text-3);
	transition: color 0.2s ease;
}

.fm-line--changed .fm-val {
	color: var(--vp-c-brand-1);
}

/* --- Click hint icon --- */
.click-hint {
	position: absolute;
	top: 50%;
	left: 50%;
	margin-top: -20px;
	margin-left: -20px;
	color: var(--vp-c-text-1);
	transform-origin: 50% 85%;
	animation: hint-tap 1.6s ease-in-out infinite;
	pointer-events: none;
}

@keyframes hint-tap {
	0%,
	100% {
		transform: rotate(0deg) scale(1);
	}
	40% {
		transform: rotate(8deg) scale(0.92);
	}
	55% {
		transform: rotate(0deg) scale(1);
	}
	70% {
		transform: rotate(8deg) scale(0.92);
	}
	85% {
		transform: rotate(0deg) scale(1);
	}
}

.hint-fade-enter-active {
	transition: opacity 0.3s ease;
}

.hint-fade-leave-active {
	transition: opacity 0.4s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
	opacity: 0;
}

/* Value swap animation */
.val-enter-active,
.val-leave-active {
	transition:
		opacity 0.12s ease,
		transform 0.12s ease;
}

.val-enter-from {
	opacity: 0;
	transform: translateY(3px);
}

.val-leave-to {
	opacity: 0;
	transform: translateY(-3px);
}

/* --- Content area --- */
.content-area {
	position: relative;
	padding: 1rem 1.25rem;
	cursor: pointer;
	transition: background 0.15s ease;
}

.content-area:hover {
	background: color-mix(in srgb, var(--vp-c-default-soft) 40%, transparent);
}

/* --- Fence annotations --- */
.ann-line {
	font-family: var(--vp-font-family-mono);
	font-size: 0.72rem;
	line-height: 1.7;
	color: var(--vp-c-text-3);
	white-space: nowrap;
	margin-bottom: 0.5rem;
}

.ann-line--close {
	margin-bottom: 0;
	margin-top: 0.5rem;
}

@media (max-width: 511px) {
	.ann-line--close {
		margin-top: 1.5rem;
	}
}

.ann-fence,
.ann-brace {
	color: var(--vp-c-text-3);
}

/* --- Class token reveal --- */
.ann-classes {
	display: inline-block;
	max-width: 0;
	opacity: 0;
	overflow: hidden;
	vertical-align: bottom;
	white-space: nowrap;
	color: var(--vp-c-brand-1);
	transition:
		max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1),
		opacity 0.25s ease;
}

.ann-classes--on {
	max-width: 22ch;
	opacity: 0.8;
	transition:
		max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1),
		opacity 0.35s ease 0.12s;
}

/* --- Resume content mockup --- */
.doc-heading {
	position: relative;
	font-size: 1rem;
	font-weight: 700;
	color: var(--vp-c-text-1);
	margin: 0 0 0.625rem;
	padding-bottom: 3px;
	line-height: 1.4;
	height: 1.6em;
	border-bottom: 1.5px solid currentColor;
	transition:
		color 0.3s ease,
		border-bottom-color 0.3s ease;
}

.doc-heading-text {
	position: absolute;
	white-space: nowrap;
	transition:
		left 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.doc-skills {
	position: relative;
	transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.skill-group {
	position: absolute;
	transition:
		top 0.5s cubic-bezier(0.4, 0, 0.2, 1),
		left 0.5s cubic-bezier(0.4, 0, 0.2, 1),
		width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.skill-term {
	font-size: 0.8125rem;
	font-weight: 600;
	color: var(--vp-c-text-1);
	margin-bottom: 1px;
}

.skill-values {
	font-size: 0.8125rem;
	color: var(--vp-c-text-2);
	line-height: 1.5;
}

/* --- Responsive --- */
@media (max-width: 640px) {
	.style-playground {
		padding: 0.5rem;
	}

	.fm-block {
		padding: 0.5rem 1rem;
		font-size: 0.65rem;
	}

	.content-area {
		padding: 0.75rem 1rem;
	}

	.doc-heading {
		font-size: 0.9375rem;
	}

	.skill-term,
	.skill-values {
		font-size: 0.75rem;
	}

	.ann-line {
		font-size: 0.65rem;
	}
}
</style>
