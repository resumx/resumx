<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Commit {
	hash: string
	message: string
	isHead?: boolean
	branchOff?: string
}

const commits: Commit[] = [
	{
		hash: 'a1b2c3d',
		message: 'feat: add ML pipeline metrics',
		isHead: true,
	},
	{
		hash: 'e4f5g6h',
		message: 'feat: tailor for Stripe',
		branchOff: 'sent/stripe-2026-02',
	},
	{ hash: 'i7j8k9l', message: 'refactor: rewrite summary' },
	{
		hash: 'm0n1o2p',
		message: 'feat: tailor for Google',
		branchOff: 'sent/google-2026-01',
	},
	{ hash: 'q3r4s5t', message: 'feat: add Acme Corp role' },
	{ hash: 'u6v7w8x', message: 'init: create resume' },
]

type TagLineType = 'prompt' | 'output' | 'success' | 'blank' | 'tag' | 'tagmsg'

interface TagTerminalLine {
	type: TagLineType
	text: string
}

const versions: Array<{
	label: string
	branch: string
	commitHash?: string
	terminal: TagTerminalLine[]
}> = [
	{
		label: 'sent/stripe-2026-02',
		branch: 'sent/stripe-2026-02',
		terminal: [
			{
				type: 'prompt',
				text: '> git resumx sent/stripe-2026-02:resume.md',
			},
			{ type: 'tag', text: '  sent/stripe-2026-02' },
			{
				type: 'tagmsg',
				text: '  Tailored for L5 infra, emphasized Kafka + distributed systems',
			},
			{ type: 'blank', text: '' },
			{ type: 'success', text: '  No issues found' },
			{ type: 'output', text: '  Building resume from: stdin' },
			{ type: 'blank', text: '' },
			{ type: 'output', text: '    PDF \u2713' },
			{ type: 'blank', text: '' },
			{
				type: 'success',
				text: '  Done! 1 file \u2192 output/ (Time: 879ms)',
			},
			{ type: 'prompt', text: '>' },
		],
	},
	{
		label: 'sent/google-2026-01',
		branch: 'sent/google-2026-01',
		terminal: [
			{
				type: 'prompt',
				text: '> git resumx sent/google-2026-01:resume.md',
			},
			{ type: 'tag', text: '  sent/google-2026-01' },
			{
				type: 'tagmsg',
				text: '  Focused on API design, highlighted OAuth + rate limiting',
			},
			{ type: 'blank', text: '' },
			{ type: 'success', text: '  No issues found' },
			{ type: 'output', text: '  Building resume from: stdin' },
			{ type: 'blank', text: '' },
			{ type: 'output', text: '    PDF \u2713' },
			{ type: 'blank', text: '' },
			{
				type: 'success',
				text: '  Done! 1 file \u2192 output/ (Time: 921ms)',
			},
			{ type: 'prompt', text: '>' },
		],
	},
	{
		label: 'main',
		branch: '',
		commitHash: 'i7j8k9l',
		terminal: [
			{ type: 'prompt', text: '> git resumx i7j8k9l:resume.md' },
			{ type: 'blank', text: '' },
			{ type: 'success', text: '  No issues found' },
			{ type: 'output', text: '  Building resume from: stdin' },
			{ type: 'blank', text: '' },
			{ type: 'output', text: '    PDF \u2713' },
			{ type: 'blank', text: '' },
			{
				type: 'success',
				text: '  Done! 1 file \u2192 output/ (Time: 812ms)',
			},
			{ type: 'prompt', text: '>' },
		],
	},
]

const FLIP_MS = 1800
const active = ref(0)
let flipId: ReturnType<typeof setInterval> | null = null

function startFlip() {
	stopFlip()
	flipId = setInterval(() => {
		active.value = (active.value + 1) % versions.length
	}, FLIP_MS)
}

function stopFlip() {
	if (flipId != null) {
		clearInterval(flipId)
		flipId = null
	}
}

function isBranchActive(name: string): boolean {
	return versions[active.value].branch === name
}

function isCommitActive(commit: Commit): boolean {
	const v = versions[active.value]
	if (v.commitHash != null) return commit.hash === v.commitHash
	return commit.branchOff != null && v.branch === commit.branchOff
}

function isRowDimmed(commit: Commit): boolean {
	return !isCommitActive(commit)
}

onMounted(() => startFlip())
onUnmounted(() => stopFlip())
</script>

<template>
	<section class="git-demo">
		<div class="demo-panels">
			<!-- Terminal panel -->
			<div class="terminal-panel">
				<div class="terminal-body">
					<div
						v-for="(ver, vi) in versions"
						:key="ver.label"
						class="terminal-frame"
						:class="{ active: vi === active }"
					>
						<div
							v-for="(line, li) in ver.terminal"
							:key="li"
							class="term-line"
							:class="`term-line--${line.type}`"
						>
							{{ line.text }}
						</div>
					</div>
				</div>
			</div>

			<!-- Git tree panel -->
			<div class="tree-panel">
				<div class="tree-body">
					<template v-for="(c, ci) in commits" :key="c.hash">
						<!-- Commit row -->
						<div
							class="tree-row tree-row--commit"
							:class="{
								'tree-row--dim': isRowDimmed(c),
								'tree-row--active': isCommitActive(c),
							}"
						>
							<div class="gutter">
								<div
									class="commit-node"
									:class="{
										'commit-node--head': c.isHead,
										'commit-node--glow': isCommitActive(c),
									}"
								/>
							</div>
							<div class="row-content">
								<code class="commit-hash">{{ c.hash }}</code>
								<span class="commit-msg">{{ c.message }}</span>
							</div>
						</div>

						<!-- Fork row -->
						<div
							v-if="c.branchOff"
							class="tree-row tree-row--fork"
							:class="{
								'tree-row--fork-glow': isBranchActive(c.branchOff),
								'tree-row--dim': !isBranchActive(c.branchOff),
							}"
						>
							<div class="gutter gutter--fork" />
							<div class="row-content">
								<div
									class="fork-dot"
									:class="{
										'fork-dot--glow': isBranchActive(c.branchOff),
									}"
								/>
								<span
									class="fork-label"
									:class="{
										'fork-label--glow': isBranchActive(c.branchOff),
									}"
									>{{ c.branchOff }}</span
								>
							</div>
						</div>
					</template>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped>
.git-demo {
	--git-blue: #3794ff;
	--git-blue-soft: rgba(55, 148, 255, 0.15);
}

@media (min-width: 640px) {
	.git-demo {
		padding: 2rem;
	}
}

/* ---- Panels container ---- */
.demo-panels {
	display: grid;
	grid-template-columns: 1fr;
	gap: 10px;
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
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		padding: 0.85rem;
	}
}

/* ---- Terminal panel ---- */
.terminal-panel {
	border: 1px solid var(--vp-c-divider);
	border-radius: 10px;
	overflow: hidden;
	background: var(--vp-code-block-bg);
	display: flex;
	flex-direction: column;
}

.terminal-body {
	position: relative;
	font-family: var(--vp-font-family-mono);
	font-size: 0.8125rem;
	line-height: 1.7;
	min-height: 12rem;
}

.terminal-frame {
	position: absolute;
	inset: 0;
	padding: 14px;
	opacity: 0;
	transition: opacity 0.4s ease;
	pointer-events: none;
}

.terminal-frame.active {
	opacity: 1;
	pointer-events: auto;
}

.term-line--prompt {
	color: var(--vp-c-text-1);
}

.term-line--output {
	color: var(--vp-c-text-2);
}

.term-line--success {
	color: #0f766e;
}

.term-line--tag {
	color: var(--vp-c-text-2);
}

.term-line--tagmsg {
	color: var(--vp-c-text-1);
	font-weight: 600;
}

.term-line--blank {
	height: 1.7em;
}

/* ---- Git tree panel ---- */
.tree-panel {
	border: 1px solid var(--vp-c-divider);
	border-radius: 10px;
	overflow: hidden;
	background: var(--vp-c-bg);
	display: flex;
	flex-direction: column;
}

.tree-body {
	padding: 14px 14px 14px 0;
	display: flex;
	flex-direction: column;
}

/* ---- Tree rows ---- */
.tree-row {
	display: flex;
	align-items: center;
	transition: opacity 0.4s ease;
}

.tree-row--dim {
	opacity: 0.35;
}

.tree-row--commit {
	padding: 5px 0;
}

.tree-row--fork {
	padding: 3px 0;
}

/* ---- Gutter (trunk line column) ---- */
.gutter {
	width: 32px;
	flex-shrink: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	align-self: stretch;
	position: relative;
}

.gutter::before {
	content: '';
	position: absolute;
	left: 50%;
	top: 0;
	bottom: 0;
	width: 1px;
	transform: translateX(-50%);
	background: var(--git-blue);
}

.tree-row:first-child .gutter::before {
	top: 50%;
}

.tree-row:last-child .gutter::before {
	bottom: 50%;
}

/* Fork arm: horizontal line from trunk to content */
.gutter--fork::after {
	content: '';
	position: absolute;
	left: 50%;
	top: 50%;
	width: calc(50% + 5px);
	height: 1px;
	transform: translateY(-50%);
	background: var(--vp-c-divider);
	transition: background 0.4s ease;
}

.tree-row--fork-glow .gutter--fork::after {
	background: var(--git-blue);
}

/* ---- Commit node ---- */
.commit-node {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	border: 2px solid var(--git-blue);
	background: var(--git-blue);
	position: relative;
	z-index: 1;
	flex-shrink: 0;
	transition:
		border-color 0.4s ease,
		background 0.4s ease,
		box-shadow 0.4s ease;
}

.commit-node--head {
	border-color: var(--git-blue);
	background: var(--vp-c-bg);
}

.commit-node--glow {
	box-shadow: 0 0 0 4px var(--git-blue-soft);
}

/* ---- Row content ---- */
.row-content {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.commit-hash {
	font-family: var(--vp-font-family-mono);
	font-size: 0.6875rem;
	color: var(--git-blue) !important;
	flex-shrink: 0;
	background: none;
	padding: 0;
}

.commit-msg {
	font-size: 0.75rem;
	color: #4b5563 !important;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	min-width: 0;
}

/* ---- Fork dot and label ---- */
.fork-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	border: 2px solid var(--git-blue);
	background: var(--git-blue);
	flex-shrink: 0;
	transition:
		border-color 0.4s ease,
		background 0.4s ease,
		box-shadow 0.4s ease;
}

.fork-dot--glow {
	border-color: var(--git-blue);
	box-shadow: 0 0 0 3px var(--git-blue-soft);
}

.fork-label {
	font-family: var(--vp-font-family-mono);
	font-size: 0.6875rem;
	color: #4b5563 !important;
	transition: color 0.4s ease;
	white-space: nowrap;
}

.fork-label--glow {
	color: var(--git-blue) !important;
}

.dark .commit-hash {
	color: var(--git-blue);
}
.dark .commit-msg {
	color: var(--vp-c-text-2);
}
.dark .fork-label {
	color: var(--vp-c-text-3);
}
.dark .fork-label--glow {
	color: var(--git-blue);
}
.dark .term-line--success {
	color: #2dd4bf;
}
</style>
