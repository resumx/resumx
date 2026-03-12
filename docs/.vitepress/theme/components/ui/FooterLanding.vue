<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import FlickeringGrid from './FlickeringGrid.vue'

const isTablet = ref(false)
let mq: MediaQueryList | null = null

function onMqChange(e: MediaQueryListEvent | MediaQueryList) {
	isTablet.value = e.matches
}

onMounted(() => {
	mq = window.matchMedia('(max-width: 1024px)')
	isTablet.value = mq.matches
	mq.addEventListener('change', onMqChange)
})

onUnmounted(() => {
	mq?.removeEventListener('change', onMqChange)
})

const columns = [
	{
		title: 'Essentials',
		links: [
			{ text: 'Quick Start', href: '/guide/quick-start' },
			{ text: 'Syntax', href: '/guide/syntax' },
		],
	},
	{
		title: 'Features',
		links: [
			{ text: 'Fit to Page', href: '/guide/fit-to-page' },
			{ text: 'Tags & Views', href: '/guide/tags' },
			{ text: 'AI Tailoring', href: '/guide/ai-tailoring-workflows' },
			{ text: 'Icons', href: '/guide/icons' },
		],
	},
	{
		title: 'Resources',
		links: [
			{ text: 'Resume Playbook', href: '/playbook/resume-length' },
			{ text: 'CLI Reference', href: '/guide/cli-reference' },
			{
				text: 'GitHub',
				href: 'https://github.com/resumx/resumx',
				external: true,
			},
		],
	},
]
</script>

<template>
	<footer class="landing-footer">
		<div class="footer-top">
			<div class="footer-brand">
				<a href="/" class="footer-logo">
					<img
						src="/images/resumx-wordmark-light.svg"
						alt="Resumx"
						class="footer-logo-img footer-logo-img--light"
					/>
					<img
						src="/images/resumx-wordmark-dark.svg"
						alt="Resumx"
						class="footer-logo-img footer-logo-img--dark"
					/>
				</a>
				<p class="footer-tagline">
					Markdown-first resume builder. Write once, tailor for every
					job.
				</p>
			</div>
			<div class="footer-columns">
				<div
					v-for="column in columns"
					:key="column.title"
					class="footer-column"
				>
					<h3 class="footer-column-title">{{ column.title }}</h3>
					<ul class="footer-column-links">
						<li
							v-for="link in column.links"
							:key="link.text"
							class="footer-link-item"
						>
							<a
								:href="link.href"
								class="footer-link"
								:target="link.external ? '_blank' : undefined"
								:rel="
									link.external ? 'noopener' : undefined
								"
							>
								{{ link.text }}
								<svg
									v-if="link.external"
									class="footer-external-icon"
									xmlns="http://www.w3.org/2000/svg"
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M7 7h10v10" />
									<path d="M7 17 17 7" />
								</svg>
							</a>
						</li>
					</ul>
				</div>
			</div>
		</div>
		<div class="footer-grid-wrapper">
			<div class="footer-grid-fade" />
			<div class="footer-grid-inner">
				<FlickeringGrid
					:text="isTablet ? 'Resumx' : 'Resumx'"
					:font-size="isTablet ? 60 : 90"
					:square-size="2"
					:grid-gap="isTablet ? 2 : 3"
					color="#6B7280"
					:max-opacity="0.3"
					:flicker-chance="0.1"
				/>
			</div>
		</div>
	</footer>
</template>

<style scoped>
.landing-footer {
	border-top: 1px solid var(--vp-c-divider);
	margin-top: 12rem;
}

.footer-top {
	display: flex;
	flex-direction: column;
	gap: 2.5rem;
	padding: 2.5rem 1.25rem;
	max-width: 64rem;
	margin: 0 auto;
}

@media (min-width: 768px) {
	.footer-top {
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		padding: 3rem 2rem;
	}
}

.footer-brand {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	max-width: 18rem;
}

.footer-logo {
	display: inline-block;
}

.footer-logo-img {
	height: 1.25rem;
}

/* Match VitePress dark mode: class is on html. Use html selectors so correct
   logo shows when page loads in dark mode. */
.footer-logo-img--light {
	display: inline;
}
.footer-logo-img--dark {
	display: none;
}
html.dark .footer-logo-img--light {
	display: none;
}
html.dark .footer-logo-img--dark {
	display: inline;
}

.footer-tagline {
	margin: 0;
	font-size: 0.875rem;
	line-height: 1.6;
	color: var(--vp-c-text-2);
}

.footer-columns {
	display: flex;
	flex-wrap: wrap;
	gap: 2rem;
}

@media (min-width: 768px) {
	.footer-columns {
		gap: 3rem;
	}
}

.footer-column {
	min-width: 8rem;
}

.footer-column-title {
	margin: 0 0 0.75rem;
	font-size: 0.8125rem;
	font-weight: 600;
	color: var(--vp-c-text-1);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.footer-column-links {
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.footer-link-item {
	margin: 0;
	list-style: none !important;
}

.footer-link {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.875rem;
	color: var(--vp-c-text-2) !important;
	text-decoration: none !important;
	transition: color 0.15s;
}

.footer-link:hover {
	color: var(--vp-c-text-1) !important;
}

.footer-external-icon {
	flex-shrink: 0;
	opacity: 0.5;
}

.footer-grid-wrapper {
	position: relative;
	width: 100%;
	height: 10rem;
	margin-top: 1.5rem;
}

@media (min-width: 768px) {
	.footer-grid-wrapper {
		height: 14rem;
		margin-top: 2rem;
	}
}

.footer-grid-fade {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		to bottom,
		var(--vp-c-bg),
		transparent
	);
	z-index: 1;
	pointer-events: none;
}

.footer-grid-inner {
	position: absolute;
	inset: 0;
	margin: 0 1.5rem;
}
</style>
