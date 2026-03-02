<script setup lang="ts">
import { ref, computed } from 'vue'

const nodes = [
	{ id: 'untagged', label: 'untagged', x: 340, y: 40, w: 100 },
	{ id: 'backend', label: '@backend', x: 180, y: 140, w: 100 },
	{ id: 'frontend', label: '@frontend', x: 410, y: 140, w: 110 },
	{ id: 'leadership', label: '@leadership', x: 580, y: 140, w: 120 },
	{ id: 'backend/node', label: '@backend/node', x: 100, y: 240, w: 130 },
	{ id: 'backend/jvm', label: '@backend/jvm', x: 260, y: 240, w: 120 },
	{ id: 'frontend/react', label: '@frontend/react', x: 410, y: 240, w: 140 },
	{ id: 'frontend/react/next', label: '@frontend/react/next', x: 320, y: 340, w: 170 },
	{ id: 'frontend/react/remix', label: '@frontend/react/remix', x: 510, y: 340, w: 180 }
]

const links = [
	{ source: 'untagged', target: 'backend' },
	{ source: 'untagged', target: 'frontend' },
	{ source: 'untagged', target: 'leadership' },
	{ source: 'backend', target: 'backend/node' },
	{ source: 'backend', target: 'backend/jvm' },
	{ source: 'frontend', target: 'frontend/react' },
	{ source: 'frontend/react', target: 'frontend/react/next' },
	{ source: 'frontend/react', target: 'frontend/react/remix' }
]

const selected = ref('frontend/react/next')

const allTags = nodes.filter(n => n.id !== 'untagged').map(n => n.id)

function getAncestors(tag: string): string[] {
	if (tag === 'untagged') return []
	const parts = tag.split('/')
	const result: string[] = []
	for (let i = 1; i < parts.length; i++) {
		result.push(parts.slice(0, i).join('/'))
	}
	return result
}

function getDescendants(tag: string): string[] {
	if (tag === 'untagged') return [] // untagged has no descendants in this model
	const prefix = tag + '/'
	return allTags.filter(id => id.startsWith(prefix))
}

const includedSet = computed(() => {
	const tag = selected.value
	const set = new Set<string>()
	set.add('untagged') // Always included
	if (tag !== 'untagged') {
		set.add(tag)
		for (const a of getAncestors(tag)) set.add(a)
		for (const d of getDescendants(tag)) set.add(d)
	}
	return set
})

type NodeState = 'self' | 'ancestor' | 'descendant' | 'excluded'

function nodeState(id: string): NodeState {
	if (id === 'untagged') {
		return selected.value === 'untagged' ? 'self' : 'ancestor'
	}
	if (id === selected.value) return 'self'
	if (!includedSet.value.has(id)) return 'excluded'
	if (getAncestors(selected.value).includes(id)) return 'ancestor'
	return 'descendant'
}

function linkState(source: string, target: string) {
	if (includedSet.value.has(source) && includedSet.value.has(target)) {
		return 'active'
	}
	return 'inactive'
}

function stateLabel(state: NodeState, id: string): string {
	if (id === 'untagged') return 'always'
	switch (state) {
		case 'self': return 'selected'
		case 'ancestor': return 'ancestor'
		case 'descendant': return 'descendant'
		case 'excluded': return 'excluded'
	}
}

function getPath(sourceId: string, targetId: string) {
	const s = nodes.find(n => n.id === sourceId)!
	const t = nodes.find(n => n.id === targetId)!
	const y1 = s.y + 18
	const y2 = t.y - 18
	const midY = (y1 + y2) / 2
	return `M ${s.x} ${y1} C ${s.x} ${midY}, ${t.x} ${midY}, ${t.x} ${y2}`
}
</script>

<template>
	<div class="tag-lineage">
		<div class="graph-container">
			<svg viewBox="0 0 680 390" width="100%" height="100%">
				<path
					v-for="l in links"
					:key="l.source + '-' + l.target"
					:d="getPath(l.source, l.target)"
					class="link"
					:class="linkState(l.source, l.target)"
				/>
				<g
					v-for="n in nodes"
					:key="n.id"
					:transform="`translate(${n.x}, ${n.y})`"
					class="node"
					:class="[nodeState(n.id), { selectable: n.id !== 'untagged' }]"
					@click="n.id !== 'untagged' && (selected = n.id)"
				>
					<rect
						:x="-n.w / 2"
						y="-18"
						:width="n.w"
						height="36"
						rx="6"
						class="node-bg"
					/>
					<text y="1" class="node-label">{{ n.label }}</text>
					<text y="31" class="node-badge">{{ stateLabel(nodeState(n.id), n.id) }}</text>
				</g>
			</svg>
		</div>
	</div>
</template>

<style scoped>
.tag-lineage {
	margin: 20px 0;
}

.graph-container {
	background: var(--vp-c-bg-soft);
	border-radius: 8px;
	padding: 24px 0 12px 0;
	overflow-x: auto;
}

.graph-container svg {
	min-width: 680px;
}

.link {
	fill: none;
	stroke-width: 2px;
	transition: all 0.3s ease;
}

.link.inactive {
	stroke: var(--vp-c-divider);
	opacity: 0.5;
}

.link.active {
	stroke: var(--vp-c-indigo-1);
}

.node {
	/* base node styles */
}

.node.selectable {
	cursor: pointer;
}

.node.selectable:hover .node-bg {
	stroke: var(--vp-c-green-1);
}

.node-bg {
	stroke-width: 1px;
	transition: all 0.3s ease;
}

.node-label {
	font-family: var(--vp-font-family-mono);
	font-size: 13px;
	text-anchor: middle;
	dominant-baseline: central;
	pointer-events: none;
	transition: all 0.3s ease;
}

.node-badge {
	font-family: var(--vp-font-family-base);
	font-size: 10px;
	text-anchor: middle;
	dominant-baseline: central;
	pointer-events: none;
	transition: all 0.3s ease;
	stroke: var(--vp-c-bg-soft);
	stroke-width: 4px;
	stroke-linejoin: round;
	paint-order: stroke fill;
}

/* Node States */
.node.self .node-bg {
	fill: var(--vp-c-green-soft);
	stroke: var(--vp-c-green-1);
}
.node.self .node-label {
	fill: var(--vp-c-green-1);
	font-weight: 600;
}
.node.self .node-badge {
	fill: var(--vp-c-green-1);
}

.node.ancestor .node-bg,
.node.descendant .node-bg {
	fill: var(--vp-c-indigo-soft);
	stroke: var(--vp-c-indigo-1);
}
.node.ancestor .node-label,
.node.descendant .node-label,
.node.ancestor .node-badge,
.node.descendant .node-badge {
	fill: var(--vp-c-indigo-1);
}

.node.excluded .node-bg {
	fill: var(--vp-c-bg-alt);
	stroke: var(--vp-c-divider);
}
.node.excluded .node-label {
	fill: var(--vp-c-text-3);
}
.node.excluded .node-badge {
	fill: var(--vp-c-text-3);
	opacity: 0.6;
}
</style>
