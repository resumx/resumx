<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import type { DefaultTheme } from 'vitepress/theme'

const { theme } = useData()
const route = useRoute()

const groupText = computed(() => {
	const sidebar = theme.value.sidebar as DefaultTheme.SidebarItem[] | undefined
	if (!sidebar) return null

	const path = route.path
	for (const group of sidebar) {
		if (!group.items) continue
		const match = group.items.some(item => {
			if (!item.link) return false
			// Normalize: add base and strip .html so "/what-is-resumx" matches route paths like "/guide/what-is-resumx.html"
			const normalized = withBase(item.link.replace(/\.html$/, ''))
			return (
				path === normalized
				|| path === normalized + '.html'
				|| path === normalized + '/'
			)
		})
		if (match) return group.text ?? null
	}
	return null
})
</script>

<template>
	<p v-if="groupText" class="sidebar-group-label">{{ groupText }}</p>
</template>

<style scoped>
@font-face {
	font-family: 'Geist Mono';
	src: url('../../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2')
		format('woff2');
	font-weight: 100 900;
	font-display: swap;
}

.sidebar-group-label {
	text-transform: uppercase;
	letter-spacing: 0.05em;
	font-size: 0.75rem;
	font-weight: 500;
	color: var(--vp-c-brand-3);
	margin: 0;
	padding: 0;
	margin-bottom: 0.5em;
	font-family: 'Geist Mono', var(--vp-font-family-mono);
}
</style>
