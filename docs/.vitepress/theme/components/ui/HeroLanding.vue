<script setup lang="ts">
import { ref, onMounted } from 'vue'
import InfiniteSlider from './InfiniteSlider.vue'
import FooterLanding from './FooterLanding.vue'
import DemoCard from '../landing/DemoCard.vue'
import IconRevealDemo from '../landing/IconRevealDemo.vue'
import TagFilterDemo from '../landing/tag-filter/TagFilterDemo.vue'
import PageFitDemo from '../landing/page-fit/PageFitDemo.vue'
import GitVersionDemo from '../landing/GitVersionDemo.vue'
import StyleCarousel from '../landing/StyleCarousel.vue'

const GITHUB_RELEASES_API =
	'https://api.github.com/repos/resumx/resumx/releases/latest'
const badgeText = ref<string>("v0.1.1 released — see what's new")

onMounted(() => {
	fetch(GITHUB_RELEASES_API)
		.then(res => (res.ok ? res.json() : Promise.reject(res)))
		.then((data: { tag_name?: string }) => {
			if (data?.tag_name) {
				badgeText.value = `${data.tag_name} released — see what's new`
			}
		})
		.catch(() => {
			// Keep fallback on network error or no releases
		})
})

const tools = [
	{ name: 'Cursor', icon: '/images/logos/cursor.svg', invert: true },
	{
		name: 'Gemini',
		icon: '/images/logos/gemini-light.svg',
		darkIcon: '/images/logos/gemini-dark.svg',
		invert: false,
	},
	{
		name: 'GitHub Copilot',
		icon: '/images/logos/github-copilot.svg',
		invert: true,
	},
	{
		name: 'Claude',
		icon: '/images/logos/claude-light.svg',
		darkIcon: '/images/logos/claude-dark.svg',
		invert: false,
	},
	{ name: 'OpenAI', icon: '/images/logos/openai.svg', invert: true },
	{
		name: 'Antigravity',
		icon: '/images/logos/antigravity-light.svg',
		darkIcon: '/images/logos/antigravity-dark.svg',
		invert: false,
	},
	{
		name: 'OpenClaw',
		icon: '/images/logos/openclaw-light.png',
		darkIcon: '/images/logos/openclaw-dark.png',
		invert: false,
	},
	{
		name: 'OpenCode',
		icon: '/images/logos/opencode-light.svg',
		darkIcon: '/images/logos/opencode-dark.svg',
		invert: false,
	},
]
</script>

<template>
	<div class="hero-landing">
		<!-- Hero Section -->
		<section class="hero-section">
			<!-- Top radial gradient (desktop only) -->
			<div aria-hidden="true" class="hero-shade">
				<div class="hero-shade-inner" />
			</div>

			<!-- Outer bold faded borders (desktop only) -->
			<div aria-hidden="true" class="hero-borders">
				<div class="hero-border-line hero-border-line--left" />
				<div class="hero-border-line hero-border-line--right" />
			</div>

			<!-- Main content -->
			<div class="hero-content">
				<!-- Inner content faded borders -->
				<div aria-hidden="true" class="hero-content-borders">
					<div class="hero-content-line hero-content-line--lo" />
					<div class="hero-content-line hero-content-line--ro" />
					<div class="hero-content-line hero-content-line--li" />
					<div class="hero-content-line hero-content-line--ri" />
				</div>

				<!-- Badge -->
				<a
					class="hero-badge"
					href="https://github.com/resumx/resumx/releases"
					target="_blank"
					rel="noopener"
				>
					<!-- Rocket icon -->
					<svg
						class="hero-icon hero-icon--muted"
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
						<path
							d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
						/>
						<path
							d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
						/>
						<path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
						<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
					</svg>
					<span class="hero-badge-text">{{ badgeText }}</span>
					<span class="hero-badge-divider" />
					<!-- Arrow right icon -->
					<svg
						class="hero-icon hero-badge-arrow"
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
						<path d="M5 12h14" />
						<path d="m12 5 7 7-7 7" />
					</svg>
				</a>

				<!-- Heading -->
				<h1 class="hero-heading">
					Stop Tweaking Themes.<br class="hero-heading-br" />
					Start Getting Interviews.
				</h1>

				<!-- Subtitle -->
				<p class="hero-subtitle">
					Layout and styling on autopilot, so you focus on content.
				</p>

				<!-- Buttons -->
				<div class="hero-buttons">
					<a
						class="hero-btn hero-btn--secondary"
						href="https://github.com/resumx/resumx"
						target="_blank"
						rel="noopener"
					>
						<!-- GitHub icon -->
						<svg
							class="hero-icon hero-btn-icon--start"
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
							/>
						</svg>
						View GitHub
					</a>
					<a class="hero-btn hero-btn--primary" href="/guide/quick-start">
						Get Started
						<!-- Arrow right icon -->
						<svg
							class="hero-icon hero-btn-icon--end"
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
					</a>
				</div>
			</div>
		</section>

		<!-- Compatible With Section -->
		<section class="logos-section">
			<h2 class="logos-heading">Compatible with</h2>
			<div class="logos-container">
				<div class="logos-cloud">
					<InfiniteSlider :gap="48" reverse :duration="30">
						<span v-for="tool in tools" :key="tool.name" class="tool-badge">
							<img
								v-if="!tool.darkIcon"
								:src="tool.icon"
								:alt="tool.name"
								:class="['tool-icon', { 'tool-icon--invert': tool.invert }]"
								loading="lazy"
							/>
							<template v-else>
								<img
									:src="tool.icon"
									:alt="tool.name"
									class="tool-icon tool-icon--light-only"
									loading="lazy"
								/>
								<img
									:src="tool.darkIcon"
									:alt="tool.name"
									class="tool-icon tool-icon--dark-only"
									loading="lazy"
								/>
							</template>
						</span>
					</InfiniteSlider>
				</div>
			</div>
		</section>

		<section class="features-section">
			<PageFitDemo />
			<div class="features-bento">
				<DemoCard
					label="Targeting"
					heading="One file, every role"
					subtitle="Tag bullets with {.@frontend}, {.@backend}, or both. Filter at build time."
					header-align="left"
				>
					<TagFilterDemo />
				</DemoCard>

				<DemoCard
					label="Icons"
					heading="Icons, typed"
					subtitle="200k+ built-in shortcodes render into crisp SVGs automatically."
					header-align="right"
				>
					<IconRevealDemo />
				</DemoCard>
			</div>

			<DemoCard
				label="Version Control"
				heading="Every version you sent, recoverable."
				subtitle="Each submission lives on its own Git branch. Check out any past version and rebuild it in one command."
			>
				<GitVersionDemo />
			</DemoCard>
			<DemoCard
				label="Typography"
				heading="Every knob. No friction."
				subtitle="Fonts, colors, spacing, layout. All configurable from your Markdown file."
			>
				<StyleCarousel />
			</DemoCard>
		</section>

		<FooterLanding />
	</div>
</template>

<!-- Global overrides for VitePress page layout when hero is present -->
<style>
.VPPage:has(.hero-landing) .container {
	max-width: none !important;
}

.VPPage:has(.hero-landing) .content {
	padding: 0 !important;
}

.VPPage:has(.hero-landing) .vp-doc {
	padding: 0 !important;
}

.VPPage:has(.hero-landing) {
	padding-bottom: 0 !important;
}

.VPPage:has(.hero-landing) + .VPFooter {
	display: none;
}

.dark .tool-icon--invert {
	filter: brightness(0) invert(1);
}

.tool-icon--dark-only {
	display: none;
}

.dark .tool-icon--light-only {
	display: none;
}

.dark .tool-icon--dark-only {
	display: inline;
}
</style>

<style scoped>
/* ---- Animation ---- */
@keyframes fade-slide-in {
	from {
		opacity: 0;
		transform: translateY(2.5rem);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* ---- Landing wrapper ---- */
.hero-landing {
	width: 100%;
	overflow-x: hidden;
}

.hero-landing a {
	color: inherit !important;
	text-decoration: none !important;
}

/* ---- Hero Section ---- */
.hero-section {
	position: relative;
	margin: 0 auto;
	width: 100%;
	max-width: 64rem;
}

/* Top radial gradient */
.hero-shade {
	display: none;
	position: absolute;
	inset: 0;
	isolation: isolate;
	overflow: hidden;
	contain: strict;
}

@media (min-width: 1024px) {
	.hero-shade {
		display: block;
	}
}

.hero-shade-inner {
	position: absolute;
	inset: 0;
	top: -3.5rem;
	isolation: isolate;
	z-index: -10;
	background: radial-gradient(
		35% 80% at 49% 0%,
		var(--vp-c-default-soft),
		transparent
	);
	contain: strict;
}

/* Outer bold faded borders */
.hero-borders {
	display: none;
	position: absolute;
	inset: 0;
	margin: 0 auto;
	min-height: 100vh;
	width: 100%;
	max-width: 64rem;
}

@media (min-width: 1024px) {
	.hero-borders {
		display: block;
	}
}

.hero-border-line {
	position: absolute;
	top: 0;
	bottom: 0;
	z-index: 10;
	height: 100%;
	width: 1px;
	background-color: var(--vp-c-divider);
	mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
	-webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
}

.hero-border-line--left {
	left: 0;
}

.hero-border-line--right {
	right: 0;
}

/* ---- Main content ---- */
.hero-content {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	padding: 6rem 1.25rem 6rem;
}

@media (min-width: 640px) {
	.hero-content {
		gap: 1.25rem;
		padding: 6rem 1.5rem 5rem;
	}
}

@media (min-width: 1024px) {
	.hero-content {
		padding: 8rem 2rem 7.5rem;
	}
}

/* Inner content faded borders */
.hero-content-borders {
	position: absolute;
	inset: 0;
	z-index: -1;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

.hero-content-line {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 1px;
	background: linear-gradient(
		to bottom,
		transparent,
		var(--vp-c-divider),
		var(--vp-c-divider)
	);
}

.hero-content-line--lo {
	left: 1rem;
}
.hero-content-line--ro {
	right: 1rem;
}
.hero-content-line--li {
	left: 2rem;
	opacity: 0.5;
}
.hero-content-line--ri {
	right: 2rem;
	opacity: 0.5;
}

@media (min-width: 768px) {
	.hero-content-line--lo {
		left: 2rem;
	}
	.hero-content-line--ro {
		right: 2rem;
	}
	.hero-content-line--li {
		left: 3rem;
	}
	.hero-content-line--ri {
		right: 3rem;
	}
}

/* ---- Icons ---- */
.hero-icon {
	flex-shrink: 0;
}

.hero-icon--muted {
	color: var(--vp-c-text-3);
}

/* ---- Badge ---- */
.hero-badge {
	display: flex;
	width: fit-content;
	align-items: center;
	gap: 0.375rem;
	border-radius: 9999px;
	border: 1px solid var(--vp-c-divider);
	background-color: var(--vp-c-bg-soft);
	padding: 0.1875rem 0.375rem 0.1875rem 0.5rem;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	transition: all 0.15s ease-out;
	animation: fade-slide-in 0.5s ease-out 0.5s backwards;
	max-width: 100%;
	box-sizing: border-box;
}

@media (min-width: 640px) {
	.hero-badge {
		gap: 0.75rem;
		padding: 0.25rem 0.75rem;
	}
}

.hero-badge-text {
	font-size: 0.625rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

@media (min-width: 640px) {
	.hero-badge-text {
		font-size: 0.75rem;
	}
}

.hero-badge-divider {
	display: block;
	height: 1rem;
	border-left: 1px solid var(--vp-c-divider);
}

@media (min-width: 640px) {
	.hero-badge-divider {
		height: 1.25rem;
	}
}

.hero-badge .hero-icon {
	width: 10px;
	height: 10px;
}

@media (min-width: 640px) {
	.hero-badge .hero-icon {
		width: 12px;
		height: 12px;
	}
}

.hero-badge-arrow {
	transition: transform 0.15s ease-out;
}

.hero-badge:hover .hero-badge-arrow {
	transform: translateX(0.25rem);
}

/* ---- Heading ---- */
.hero-heading {
	text-wrap: balance;
	text-align: center;
	font-size: 1.75rem;
	line-height: 1.15;
	font-weight: 700;
	letter-spacing: -0.025em;
	margin: 0;
	padding: 0 0.5rem;
	border: none !important;
	animation: fade-slide-in 0.5s ease-out 0.1s backwards;
}

.hero-heading-br {
	display: none;
}

@media (min-width: 640px) {
	.hero-heading {
		font-size: 2.25rem;
		padding: 0;
	}
	.hero-heading-br {
		display: block;
	}
}

@media (min-width: 768px) {
	.hero-heading {
		font-size: 3rem;
	}
}

@media (min-width: 1024px) {
	.hero-heading {
		font-size: 3.75rem;
	}
}

/* ---- Subtitle ---- */
.hero-subtitle {
	margin: 0 auto;
	max-width: 32rem;
	text-align: center;
	font-size: 0.9375rem;
	color: var(--vp-c-text-2);
	letter-spacing: 0.025em;
	line-height: 1.6;
	padding: 0 0.5rem;
	animation: fade-slide-in 0.5s ease-out 0.2s backwards;
}

@media (min-width: 640px) {
	.hero-subtitle {
		font-size: 1.0625rem;
		padding: 0;
	}
}

@media (min-width: 768px) {
	.hero-subtitle {
		font-size: 1.25rem;
	}
}

/* ---- Buttons ---- */
.hero-buttons {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.625rem;
	padding-top: 0.5rem;
	width: 100%;
	animation: fade-slide-in 0.5s ease-out 0.3s backwards;
}

@media (min-width: 480px) {
	.hero-buttons {
		flex-direction: row;
		gap: 0.75rem;
		width: auto;
	}
}

.hero-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 9999px;
	padding: 0.625rem 2rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition:
		background-color 0.15s,
		border-color 0.15s;
	line-height: 1.5;
	width: 100%;
	max-width: 16rem;
}

@media (min-width: 480px) {
	.hero-btn {
		width: auto;
		max-width: none;
	}
}

.hero-landing .hero-btn--secondary {
	border: 1px solid var(--vp-c-divider);
	background-color: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1) !important;
	padding-right: 2.1rem;
}

.hero-landing .hero-btn--secondary:hover {
	background-color: var(--vp-c-default-soft);
}

.hero-landing .hero-btn--primary {
	border: 1px solid transparent;
	background-color: var(--vp-c-text-1);
	color: var(--vp-c-bg) !important;
}

.hero-landing .hero-btn--primary:hover {
	background-color: var(--vp-c-text-2);
}

.hero-btn-icon--start {
	margin-right: 0.3rem;
}

.hero-btn-icon--end {
	margin-left: 0.5rem;
}

/* ---- Features Section ---- */
.features-section {
	margin: 3rem 3rem 0;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	margin: 0 auto;
	padding: 1.5rem 0.5rem 2rem;
}

@media (min-width: 1024px) {
	.features-section {
		margin: 4rem 4rem 0;
		padding: 2rem 1.5rem 3rem;
	}
}

.features-bento {
	display: grid;
	grid-template-columns: 1fr;
}

@media (min-width: 768px) {
	.features-bento {
		grid-template-columns: 1.5fr 1fr;
	}
}

@media (min-width: 640px) {
	.features-section {
		padding: 2.5rem 2rem 4rem;
	}
}

/* ---- Logos Section ---- */
.logos-section {
	position: relative;
	border-top: 1px solid var(--vp-c-divider);
	padding: 1.25rem 1rem 2rem;
}

@media (min-width: 640px) {
	.logos-section {
		padding: 1.5rem 1.5rem 2.5rem;
	}
}

.logos-heading {
	text-align: center;
	font-weight: 500;
	font-size: 0.9375rem;
	color: var(--vp-c-text-3);
	letter-spacing: -0.025em;
	margin-bottom: 0.75rem;
}

@media (min-width: 640px) {
	.logos-heading {
		font-size: 1.125rem;
		margin-bottom: 1rem;
	}
}

@media (min-width: 768px) {
	.logos-heading {
		font-size: 1.25rem;
	}
}

.logos-container {
	position: relative;
	z-index: 10;
	margin: 0 auto;
	max-width: 56rem;
}

.logos-cloud {
	overflow: hidden;
	padding: 1rem 0;
	mask-image: linear-gradient(to right, transparent, black, transparent);
	-webkit-mask-image: linear-gradient(
		to right,
		transparent,
		black,
		transparent
	);
}

.tool-badge {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	pointer-events: none;
	user-select: none;
	white-space: nowrap;
}

.tool-icon {
	height: 1.5rem;
	width: auto;
	object-fit: contain;
	flex-shrink: 0;
}

@media (min-width: 768px) {
	.tool-icon {
		height: 1.75rem;
	}
}

.tool-name {
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--vp-c-text-2);
	letter-spacing: -0.01em;
}

@media (min-width: 768px) {
	.tool-name {
		font-size: 1rem;
	}
}
</style>
