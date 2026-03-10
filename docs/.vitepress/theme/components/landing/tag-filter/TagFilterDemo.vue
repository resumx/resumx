<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Bullet {
	text: string
	tags: string[]
}

const bullets: Bullet[] = [
	{
		text: 'Built real-time analytics pipeline processing 2M events/day',
		tags: ['backend'],
	},
	{
		text: 'Redesigned dashboard UI with React, improving load time by 60%',
		tags: ['frontend'],
	},
	{
		text: 'Built RAG-powered search reducing support tickets by 73%',
		tags: ['ai', 'backend'],
	},
	{
		text: 'Implemented design system used across 12 internal tools',
		tags: ['frontend'],
	},
	{
		text: 'Fine-tuned ranking model improving recommendation CTR by 35%',
		tags: ['ai'],
	},
]

/** Filter cycle: single tags, combos (frontend+ai, backend+ai, frontend+backend), only-X; never all three. */
const FILTER_CYCLE: { id: string; dwellMs: number }[] = [
	{ id: 'all', dwellMs: 1_200 },
	{ id: 'frontend', dwellMs: 900 },
	{ id: 'backend', dwellMs: 900 },
	{ id: 'ai', dwellMs: 900 },
	{ id: 'frontend+ai', dwellMs: 1_100 },
	{ id: 'backend+ai', dwellMs: 1_100 },
	{ id: 'frontend+backend', dwellMs: 1_100 },
	{ id: 'only-frontend', dwellMs: 1_000 },
	{ id: 'only-backend', dwellMs: 1_000 },
	{ id: 'only-ai', dwellMs: 1_000 },
]

const activeFilter = ref('all')
let advanceTimeoutId: ReturnType<typeof setTimeout> | null = null

function scheduleAdvance() {
	const idx = FILTER_CYCLE.findIndex(f => f.id === activeFilter.value)
	const nextIdx = (idx + 1) % FILTER_CYCLE.length
	const next = FILTER_CYCLE[nextIdx]
	activeFilter.value = next.id
	advanceTimeoutId = setTimeout(scheduleAdvance, next.dwellMs)
}

function startAutoAdvance() {
	advanceTimeoutId = setTimeout(scheduleAdvance, FILTER_CYCLE[0].dwellMs)
}

/** Tags that are part of the current filter (for highlighting in code). */
const activeTags = computed((): string[] => {
	const v = activeFilter.value
	if (v === 'all') return []
	if (v === 'frontend' || v === 'only-frontend') return ['frontend']
	if (v === 'backend' || v === 'only-backend') return ['backend']
	if (v === 'ai' || v === 'only-ai') return ['ai']
	if (v === 'frontend+ai') return ['frontend', 'ai']
	if (v === 'backend+ai') return ['backend', 'ai']
	if (v === 'frontend+backend') return ['frontend', 'backend']
	return []
})

function matches(bullet: Bullet): boolean {
	const v = activeFilter.value
	if (v === 'all') return true
	if (v === 'frontend') return bullet.tags.includes('frontend')
	if (v === 'backend') return bullet.tags.includes('backend')
	if (v === 'ai') return bullet.tags.includes('ai')
	if (v === 'frontend+ai')
		return bullet.tags.includes('frontend') || bullet.tags.includes('ai')
	if (v === 'backend+ai')
		return bullet.tags.includes('backend') || bullet.tags.includes('ai')
	if (v === 'frontend+backend')
		return bullet.tags.includes('frontend') || bullet.tags.includes('backend')
	if (v === 'only-frontend')
		return bullet.tags.length === 1 && bullet.tags[0] === 'frontend'
	if (v === 'only-backend')
		return bullet.tags.length === 1 && bullet.tags[0] === 'backend'
	if (v === 'only-ai')
		return bullet.tags.length === 1 && bullet.tags[0] === 'ai'
	return true
}

function tagDisplay(tag: string): string {
	return `{.@${tag}}`
}

function isTagActive(tag: string): boolean {
	return activeTags.value.includes(tag)
}

function isTagDimmed(tag: string): boolean {
	return activeTags.value.length > 0 && !activeTags.value.includes(tag)
}

onMounted(() => {
	startAutoAdvance()
})

onUnmounted(() => {
	if (advanceTimeoutId != null) clearTimeout(advanceTimeoutId)
})
</script>

<template>
	<div class="tag-filter-demo">
		<!-- Split panels -->
		<div class="panels">
			<!-- Code panel -->
			<div class="panel panel-code">
				<div class="panel-chrome">
					<span class="chrome-dot chrome-dot--red" />
					<span class="chrome-dot chrome-dot--yellow" />
					<span class="chrome-dot chrome-dot--green" />
					<span class="chrome-filename">experience.md</span>
				</div>
				<div class="code-body">
					<div class="code-line code-line--heading">
						<span class="line-num">1</span>
						<span class="code-text">
							<span class="tok-heading">### Acme Corp</span>
							<span class="tok-dim"> — </span>
							<span class="tok-heading">Senior Engineer</span>
						</span>
					</div>
					<div class="code-line code-line--meta">
						<span class="line-num">2</span>
						<span class="code-text">
							<span class="tok-italic">_Jan 2024 – Present_</span>
						</span>
					</div>
					<div class="code-line code-line--empty">
						<span class="line-num">3</span>
						<span class="code-text" />
					</div>
					<div
						v-for="(bullet, i) in bullets"
						:key="i"
						class="code-line"
						:class="{
							'code-line--match': matches(bullet),
							'code-line--dim': !matches(bullet) && activeFilter !== 'all',
						}"
					>
						<span class="line-num">{{ i + 4 }}</span>
						<span class="code-text">
							<span class="tok-bullet">- </span>
							<span class="tok-text">{{ bullet.text }}</span>
							<span class="tok-space"> </span>
							<span
								v-for="tag in bullet.tags"
								:key="tag"
								class="tok-attr"
								:class="{
									'tok-attr--active': isTagActive(tag),
									'tok-attr--dim': isTagDimmed(tag),
								}"
								>{{ tagDisplay(tag) }}</span
							>
						</span>
					</div>
				</div>
			</div>

			<!-- Preview panel -->
			<div class="panel panel-preview">
				<div class="panel-chrome panel-chrome--light">
					<span class="chrome-dot chrome-dot--red" />
					<span class="chrome-dot chrome-dot--yellow" />
					<span class="chrome-dot chrome-dot--green" />
					<span class="chrome-filename">Preview</span>
				</div>
				<div class="preview-body">
					<div class="preview-header">
						<h4 class="preview-company">Acme Corp</h4>
						<span class="preview-role">Senior Engineer</span>
						<span class="preview-date">Jan 2024 – Present</span>
					</div>
					<ul class="preview-bullets">
						<li
							v-for="(bullet, i) in bullets"
							:key="i"
							class="preview-bullet"
							:class="{
								'preview-bullet--visible': matches(bullet),
								'preview-bullet--hidden': !matches(bullet),
							}"
							:style="{
								transitionDelay: matches(bullet) ? `${i * 40}ms` : '0ms',
							}"
						>
							{{ bullet.text }}
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.tag-filter-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 1rem;
	border: 1px solid var(--vp-c-divider);
	border-radius: 10px;
	background-image: repeating-linear-gradient(
		135deg,
		transparent,
		transparent 10px,
		var(--vp-c-divider) 10px,
		var(--vp-c-divider) 11px
	);
}

/* ---- Panels ---- */
.panels {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	min-height: 290px;
}

@media (max-width: 768px) {
	.panels {
		grid-template-columns: 1fr;
	}
}

.panel {
	border-radius: 10px;
	overflow: hidden;
	border: 1px solid var(--vp-c-divider);
}

/* ---- Chrome header ---- */
.panel-chrome {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 10px 14px;
	background: var(--vp-code-block-bg);
	border-bottom: 1px solid var(--vp-c-divider);
}

.panel-chrome--light {
	background: var(--vp-c-bg);
}

.chrome-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	flex-shrink: 0;
}

.chrome-dot--red {
	background: #ff5f57;
}
.chrome-dot--yellow {
	background: #febc2e;
}
.chrome-dot--green {
	background: #28c840;
}

.chrome-filename {
	font-size: 0.75rem;
	font-weight: 500;
	color: var(--vp-c-text-2);
	font-family: var(--vp-font-family-mono);
	margin-left: 6px;
}

/* ---- Code panel ---- */
.panel-code {
	background: var(--vp-code-block-bg);
}

.code-body {
	padding: 14px 0;
	font-family: var(--vp-font-family-mono);
	font-size: 0.8125rem;
	line-height: 1.7;
	overflow-x: auto;
}

.code-line {
	display: flex;
	padding: 0 14px;
	transition:
		opacity 0.25s ease,
		background 0.25s ease;
	border-left: 3px solid transparent;
}

.code-line--match {
	background: rgba(74, 222, 128, 0.06);
	border-left-color: var(--vp-c-green-1);
}

.code-line--dim {
	opacity: 0.35;
}

.line-num {
	display: inline-block;
	width: 24px;
	text-align: right;
	color: var(--vp-c-text-3);
	opacity: 0.5;
	user-select: none;
	flex-shrink: 0;
	margin-right: 14px;
}

.code-text {
	flex: 1;
	min-width: 0;
	white-space: nowrap;
}

.tok-heading {
	color: var(--vp-c-text-1);
	font-weight: 600;
}

.tok-dim {
	color: var(--vp-c-text-3);
}

.tok-italic {
	color: var(--vp-c-text-2);
	font-style: italic;
}

.tok-bullet {
	color: var(--vp-c-text-3);
}

.tok-text {
	color: var(--vp-c-text-1);
}

.tok-space {
	display: inline;
}

.tok-attr {
	color: var(--vp-c-text-3);
	font-style: italic;
	transition:
		color 0.25s ease,
		opacity 0.25s ease,
		background 0.25s ease;
	border-radius: 3px;
	padding: 0 2px;
	margin-left: 2px;
}

.tok-attr--active {
	color: var(--vp-c-brand-1);
	background: var(--vp-c-brand-soft);
}

.tok-attr--dim {
	opacity: 0.35;
}

/* ---- Preview panel ---- */
.panel-preview {
	background: var(--vp-c-bg);
}

.preview-body {
	padding: 20px 20px 24px;
	min-height: 18em;
}

.preview-header {
	margin-bottom: 12px;
}

.preview-company {
	font-size: 0.9375rem;
	font-weight: 600;
	color: var(--vp-c-text-1);
	margin: 0;
	line-height: 1.3;
	border: none !important;
}

.preview-role {
	font-size: 0.8125rem;
	color: var(--vp-c-text-2);
	margin-right: 8px;
}

.preview-date {
	font-size: 0.8125rem;
	color: var(--vp-c-text-2);
}

.preview-bullets {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
}

.preview-bullet {
	font-size: 0.8125rem;
	line-height: 1.55;
	color: var(--vp-c-text-1);
	padding: 4px 0 4px 16px;
	position: relative;
	transition:
		opacity 0.25s ease,
		max-height 0.3s ease,
		padding 0.3s ease,
		margin 0.3s ease;
	max-height: 80px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.preview-bullet::before {
	content: '';
	position: absolute;
	left: 4px;
	top: 11px;
	width: 4px;
	height: 4px;
	border-radius: 50%;
	background: var(--vp-c-text-3);
	transition: background 0.25s ease;
}

.preview-bullet--visible {
	opacity: 1;
}

.preview-bullet--hidden {
	opacity: 0;
	max-height: 0;
	padding-top: 0;
	padding-bottom: 0;
	margin: 0;
}
</style>
