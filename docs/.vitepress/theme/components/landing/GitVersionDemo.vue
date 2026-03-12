<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

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

/** Ordered top-to-bottom in tree so scroll progress moves highlight downward. */
const versions: Array<{
	label: string
	branch: string
	commitHash?: string
	command: string
}> = [
	{
		label: 'HEAD',
		branch: '',
		commitHash: 'a1b2c3d',
		command: 'git resumx resume.md',
	},
	{
		label: 'sent/stripe-2026-02',
		branch: 'sent/stripe-2026-02',
		command: 'git resumx sent/stripe-2026-02:resume.md',
	},
	{
		label: 'main',
		branch: '',
		commitHash: 'i7j8k9l',
		command: 'git resumx i7j8k9l:resume.md',
	},
	{
		label: 'sent/google-2026-01',
		branch: 'sent/google-2026-01',
		command: 'git resumx sent/google-2026-01:resume.md',
	},
	{
		label: 'main',
		branch: '',
		commitHash: 'q3r4s5t',
		command: 'git resumx q3r4s5t:resume.md',
	},
	{
		label: 'init',
		branch: '',
		commitHash: 'u6v7w8x',
		command: 'git resumx u6v7w8x:resume.md',
	},
]

const active = ref(0)
const sectionRef = ref<HTMLElement | null>(null)
const SCROLL_TRIGGER_ID = 'git-version-demo'

const activeCommand = computed(() => versions[active.value].command)

function updateActiveFromProgress(progress: number) {
	const index = Math.min(
		versions.length - 1,
		Math.floor(progress * versions.length),
	)
	active.value = index
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

onMounted(() => {
	import('gsap/ScrollTrigger').then(({ ScrollTrigger: ST }) => {
		import('gsap').then(({ gsap }) => {
			gsap.registerPlugin(ST)
			const el = sectionRef.value
			if (!el) return
			const st = ST.create({
				trigger: el,
				start: 'top 70%',
				end: 'bottom 80%',
				id: SCROLL_TRIGGER_ID,
				onUpdate: self => updateActiveFromProgress(self.progress),
			})
			updateActiveFromProgress(st.progress)
		})
	})
})
onUnmounted(() => {
	import('gsap/ScrollTrigger').then(({ ScrollTrigger: ST }) => {
		ST.getById(SCROLL_TRIGGER_ID)?.kill()
	})
})
</script>

<template>
	<section ref="sectionRef" class="git-demo">
		<div class="tree-panel">
			<div class="command-header">
				<span class="pill-prompt">$</span>
				<span class="pill-text">{{ activeCommand }}</span>
			</div>
			<div class="tree-body">
				<template v-for="c in commits" :key="c.hash">
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
	</section>
</template>

<style scoped>
.git-demo {
	--git-blue: #3794ff;
	--git-blue-soft: rgba(55, 148, 255, 0.15);
	width: 100%;
}

/* ---- Command header ---- */
.command-header {
	display: flex;
	align-items: center;
	gap: 6px;
	font-family: var(--vp-font-family-mono);
	font-size: 0.75rem;
	line-height: 1;
	padding: 10px 14px;
	border-bottom: 1px solid var(--vp-c-divider);
	background: var(--vp-c-bg);
	overflow: hidden;
}

.pill-prompt {
	color: var(--git-blue);
	flex-shrink: 0;
}

.pill-text {
	color: var(--vp-c-text-1);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	min-width: 0;
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
</style>
