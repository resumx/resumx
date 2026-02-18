<script setup lang="ts">
/// <reference types="vite/client" />
import { ref, computed } from 'vue'

const icons = import.meta.glob('../../../assets/icons/*.svg', {
	eager: true,
	import: 'default',
}) as Record<string, string>

const entries = Object.entries(icons)
	.map(([path, url]) => {
		const slug = path
			.split('/')
			.pop()!
			.replace(/\.svg$/, '')
		return { slug, url }
	})
	.sort((a, b) => a.slug.localeCompare(b.slug))

const search = ref('')
const copied = ref<string | null>(null)

const filtered = computed(() => {
	const q = search.value.toLowerCase().trim()
	if (!q) return entries
	return entries.filter(e => e.slug.includes(q))
})

function copy(slug: string) {
	navigator.clipboard.writeText(`::${slug}::`)
	copied.value = slug
	setTimeout(() => {
		if (copied.value === slug) copied.value = null
	}, 1500)
}
</script>

<template>
	<div class="icon-gallery">
		<div class="icon-gallery-search">
			<input
				v-model="search"
				type="text"
				placeholder="Search built-in icons..."
				class="icon-gallery-input"
			/>
			<span class="icon-gallery-count">{{ filtered.length }} icons</span>
		</div>
		<div class="icon-gallery-grid">
			<button
				v-for="icon in filtered"
				:key="icon.slug"
				class="icon-gallery-item"
				:title="`::${icon.slug}:: — click to copy`"
				@click="copy(icon.slug)"
			>
				<img :src="icon.url" :alt="icon.slug" class="icon-gallery-img" />
				<span class="icon-gallery-slug">
					{{ copied === icon.slug ? 'Copied!' : icon.slug }}
				</span>
			</button>
		</div>
		<p v-if="filtered.length === 0" class="icon-gallery-empty">
			No icons match "<strong>{{ search }}</strong
			>"
		</p>
	</div>
</template>

<style scoped>
.icon-gallery {
	margin-top: 16px;
}

.icon-gallery-search {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
}

.icon-gallery-input {
	flex: 1;
	padding: 8px 12px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
	font-size: 14px;
	outline: none;
	transition: border-color 0.2s;
}

.icon-gallery-input:focus {
	border-color: var(--vp-c-brand-1);
}

.icon-gallery-input::placeholder {
	color: var(--vp-c-text-3);
}

.icon-gallery-count {
	font-size: 13px;
	color: var(--vp-c-text-3);
	white-space: nowrap;
}

.icon-gallery-grid {
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: 4px;
	max-height: 400px;
	overflow-y: auto;
}

.icon-gallery-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	padding: 12px 4px 8px;
	border: 1px solid transparent;
	border-radius: 8px;
	background: none;
	cursor: pointer;
	transition: all 0.15s;
}

.icon-gallery-item:hover {
	background: var(--vp-c-bg-soft);
	border-color: var(--vp-c-divider);
}

.icon-gallery-item:active {
	transform: scale(0.96);
}

.icon-gallery-img {
	max-width: 37px;
	height: 28px;
	object-fit: contain;
}

.icon-gallery-slug {
	font-size: 11px;
	color: var(--vp-c-text-2);
	text-align: center;
	word-break: break-all;
	line-height: 1.3;
}

.icon-gallery-empty {
	text-align: center;
	color: var(--vp-c-text-3);
	padding: 32px 0;
}
</style>
