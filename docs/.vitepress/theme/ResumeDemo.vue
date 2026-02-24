<script setup lang="ts">
import { ref } from 'vue'

type Phase = 'idle' | 'running' | 'done'
type Color = 'green' | 'cyan' | 'dim' | 'yellow'

interface Segment {
	t: string
	c?: Color
}

interface OutputLine {
	segments: Segment[]
	delay: number
}

const phase = ref<Phase>('idle')
const visibleLines = ref(0)

function combo(label: string): OutputLine {
	return {
		segments: [
			{ t: `  ${label} ` },
			{ t: 'HTML' },
			{ t: ' \u2713', c: 'green' },
			{ t: '  PDF' },
			{ t: ' \u2713', c: 'green' },
		],
		delay: 60,
	}
}

const outputLines: OutputLine[] = [
	{ segments: [{ t: 'No issues found', c: 'green' }], delay: 200 },
	{
		segments: [{ t: 'Building resume from: ' }, { t: 'resume.md', c: 'cyan' }],
		delay: 150,
	},
	{ segments: [{ t: '' }], delay: 80 },
	combo('[backend, zurich]  '),
	combo('[frontend, zurich] '),
	combo('[fullstack, zurich]'),
	combo('[backend, oxford]  '),
	combo('[frontend, oxford] '),
	combo('[fullstack, oxford]'),
	{ segments: [{ t: '' }], delay: 80 },
	{
		segments: [
			{ t: 'Done!', c: 'green' },
			{ t: ' 12 files \u2192 ' },
			{ t: 'output/', c: 'cyan' },
			{ t: ' (Time: 1.36s)', c: 'dim' },
		],
		delay: 200,
	},
]

function disableLinks(e: Event) {
	try {
		const iframe = e.target as HTMLIFrameElement
		const doc = iframe.contentWindow?.document
		if (!doc) return

		const style = doc.createElement('style')
		style.textContent = `
			@media (max-width: 640px) {
				html {
					font-size: 10px !important;
				}
			}
		`
		doc.head.appendChild(style)

		doc.addEventListener('click', event => {
			if ((event.target as HTMLElement).closest('a')) {
				event.preventDefault()
			}
		})
	} catch {
		// cross-origin
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
	if (phase.value !== 'idle') return
	phase.value = 'running'

	for (let i = 0; i < outputLines.length; i++) {
		await sleep(outputLines[i].delay)
		visibleLines.value = i + 1
	}

	await sleep(300)
	phase.value = 'done'
}
</script>

<template>
	<div class="resume-demo">
		<div
			class="terminal"
			:class="{ clickable: phase === 'idle' }"
			role="button"
			:tabindex="phase === 'idle' ? 0 : undefined"
			@click="run"
			@keydown.enter="run"
		>
			<div class="terminal-body">
				<div class="command-line">
					<span class="prompt">$</span>
					<span class="command">resumx resume.md --format html,pdf</span>
					<span class="run-btn" :class="{ hidden: phase !== 'idle' }" aria-hidden="true">Run</span>
				</div>
				<div class="output-wrapper" :class="{ expanded: phase !== 'idle' }">
				<div class="output">
					<div
						v-for="(line, i) in outputLines.slice(0, visibleLines)"
						:key="i"
						class="output-line"
					>
						<span v-for="(seg, j) in line.segments" :key="j" :class="seg.c">{{
							seg.t
						}}</span>
						<span
							v-if="i === visibleLines - 1 && phase === 'running'"
							class="cursor-blink"
							>_</span
						>
					</div>
				</div>
				</div>
			</div>
		</div>

		<figure class="preview-figure">
			<iframe
				src="/samples/resumx-snippet-frontend-zurich.html"
				class="resume-preview"
				@load="disableLinks"
			/>
			<figcaption>
				Rendered sample of the snippet above, frontend role.
			</figcaption>
		</figure>
	</div>
</template>

<style scoped>
.resume-demo {
	margin: 16px 0;
}

.terminal {
	position: relative;
	background: var(--vp-code-block-bg);
	border-radius: 8px;
	overflow: auto;
	font-family: var(--vp-font-family-mono);
	font-size: 14px;
	line-height: 1.7;
	outline: none;
}

.terminal.clickable {
	cursor: pointer;
}

.terminal.clickable:hover,
.terminal.clickable:focus-visible {
	box-shadow: 0 0 0 1px var(--vp-c-indigo-1);
}

.terminal-body {
	padding: 20px 24px;
}

.command-line {
	display: flex;
	align-items: center;
	gap: 8px;
}

.prompt {
	color: var(--vp-c-green-1);
	user-select: none;
	flex-shrink: 0;
}

.command {
	color: var(--vp-c-text-1);
	flex: 1;
	min-width: 0;
}

.run-btn {
	flex-shrink: 0;
	padding: 4px 14px;
	font-size: 12px;
	font-weight: 600;
	font-family: var(--vp-font-family-base);
	color: var(--vp-c-white);
	background: var(--vp-c-indigo-1);
	border-radius: 6px;
	line-height: 1.5;
	pointer-events: none;
	transition: opacity 0.2s ease, background 0.2s ease;
}

.run-btn.hidden {
	opacity: 0;
}

.terminal.clickable:hover .run-btn {
	background: var(--vp-c-indigo-2);
}

.output-wrapper {
	display: grid;
	grid-template-rows: 0fr;
	transition: grid-template-rows 0.3s ease-out;
}

.output-wrapper.expanded {
	grid-template-rows: 1fr;
}

.output {
	overflow: hidden;
	padding-top: 0;
	color: var(--vp-c-text-2);
}

.output-wrapper.expanded .output {
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid var(--vp-c-divider);
}

.output-line {
	white-space: pre;
	min-height: 1.6em;
}

.green {
	color: var(--vp-c-green-1);
}

.cyan {
	color: var(--vp-c-indigo-1);
}

.dim {
	color: var(--vp-c-text-3);
}

.yellow {
	color: var(--vp-c-yellow-1);
}

.cursor-blink {
	animation: blink 0.8s step-end infinite;
	color: var(--vp-c-text-2);
}

@keyframes blink {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0;
	}
}

.preview-figure {
	margin-top: 16px;
}

.resume-preview {
	width: 100%;
	height: 350px;
	border: 1px solid var(--vp-c-gray-soft);
	border-radius: 8px;
	transition: border-color 0.2s ease-out;
}

.resume-preview:hover {
	border-color: var(--vp-c-gray-1);
}

.preview-figure figcaption {
	margin-top: 8px;
	text-align: center;
	font-size: 13px;
	color: var(--vp-c-text-3);
}

</style>
