<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import InfiniteSlider from './InfiniteSlider.vue'
import FooterLanding from './FooterLanding.vue'
import DemoCard from '../landing/DemoCard.vue'
import IconRevealDemo from '../landing/IconRevealDemo.vue'
import TagFilterDemo from '../landing/tag-filter/TagFilterDemo.vue'
import MultiTargetDemo from '../landing/MultiTargetDemo.vue'
import PageFitDemo from '../landing/page-fit/PageFitDemo.vue'
import GitVersionDemo from '../landing/GitVersionDemo.vue'
import StylePlaygroundDemo from '../landing/StylePlaygroundDemo.vue'
import ConvertDialog from '../convert/ConvertDialog.vue'
import InstallSection from './InstallSection.vue'

const showConvertDialog = ref(false)

const GITHUB_STATS_API = '/api/github-stats'
const badgeText = ref('Free & open source')
const starCount = ref<string | null>(null)

function formatStarCount(count: number): string {
	if (count >= 1000) {
		const k = count / 1000
		return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`
	}
	return String(count)
}

function openConvertDialog() {
	showConvertDialog.value = true
	history.replaceState(null, '', '#import')
}

function closeConvertDialog() {
	showConvertDialog.value = false
	history.replaceState(null, '', window.location.pathname)
}

const GLYPH_CHARS = [
	'#',
	'---',
	'>',
	'**',
	'- [ ]',
	'{.@}',
	'##',
	'```',
	'|',
	'||',
]
// How deep the virtual box is. Higher = more small/faint particles (realistic
// perspective where most volume is far away). 0 = uniform, no depth bias.
const BOX_DEPTH = 3.5

const PARTICLE_BREAKPOINTS: [minWidth: number, count: number][] = [
	[1440, 55],
	[1024, 40],
	[640, 28],
	[0, 18],
]

interface Particle {
	id: number
	char: string
	x: number
	y: number
	size: number
	opacity: number
	duration: number
	delay: number
	dx: number
	dy: number
	rot: number
}

function rand(min: number, max: number): number {
	return Math.random() * (max - min) + min
}

const particlePool = Array.from({ length: 55 }, (_, i): Particle => {
	const z = 1 + Math.random() * BOX_DEPTH
	const depth =
		BOX_DEPTH > 0 ?
			(1 / z - 1 / (1 + BOX_DEPTH)) / (1 - 1 / (1 + BOX_DEPTH))
		:	Math.random()
	const jitter = (base: number, spread: number) =>
		Math.max(0, Math.min(1, base + rand(-spread, spread)))

	const sizeT = jitter(depth, 0.2)
	const opacityT = jitter(depth, 0.25)
	const speedT = jitter(depth, 0.2)
	const driftScale = 0.4 + speedT * 0.6

	return {
		id: i,
		char: GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)],
		x: rand(0, 100),
		y: rand(0, 100),
		size: 0.6 + sizeT * 0.45,
		opacity: 0.03 + opacityT * 0.13,
		duration: 18 - speedT * 10,
		delay: rand(-20, 0),
		dx: rand(-80, 80) * driftScale,
		dy: rand(-100, -30) * driftScale,
		rot: rand(-25, 25),
	}
})

const viewportWidth = ref(1024)
const particles = computed(() => {
	const count =
		PARTICLE_BREAKPOINTS.find(([w]) => viewportWidth.value >= w)?.[1] ?? 18
	return particlePool.slice(0, count)
})

const formats = [
	{ name: 'PDF', color: '#c2410c' },
	{ name: 'HTML', color: '#ea580c' },
	{ name: 'DOCX', color: '#2563eb' },
]
const activeFormat = ref(0)
let formatFlipId: ReturnType<typeof setInterval> | null = null

const pageFitSectionRef = ref<HTMLElement | null>(null)
const PAGE_FIT_SCROLL_TRIGGER_ID = 'page-fit-scale'

/** Page-fit scroll spring: initial scale when element enters (tune these). */
const PAGE_FIT_INITIAL_SCALE = 0.8
const PAGE_FIT_INITIAL_SCALE_SMALL = 0.92
const PAGE_FIT_SMALL_SCREEN_MAX_WIDTH = 640
/** Page-fit tint: strength of the entrance background (0 = none, 1 = full). Tune this. */
const PAGE_FIT_TINT_STRENGTH = 0.5
/** Spring config: tension (stiffness) and friction (damping). Higher friction = more damp. */
const SPRING_TENSION = 40
const SPRING_FRICTION = 9

let resizeHandler: (() => void) | undefined
let pageFitSpringTrigger: { progress: number; kill: () => void } | null = null
type TickerCb = (time?: number, deltaTime?: number) => void
let pageFitTickerRef: TickerCb | null = null

onMounted(() => {
	fetch(GITHUB_STATS_API)
		.then(res => (res.ok ? res.json() : Promise.reject(res)))
		.then(
			(data: {
				latestTag?: string | null
				stargazersCount?: number | null
			}) => {
				if (data?.latestTag) {
					badgeText.value = `${data.latestTag} released — see what's new`
				}
				if (data?.stargazersCount != null) {
					starCount.value = formatStarCount(data.stargazersCount)
				}
			},
		)
		.catch(() => {})

	viewportWidth.value = window.innerWidth
	resizeHandler = () => {
		viewportWidth.value = window.innerWidth
	}
	window.addEventListener('resize', resizeHandler)

	formatFlipId = setInterval(() => {
		activeFormat.value = (activeFormat.value + 1) % formats.length
	}, 1500)

	if (window.location.hash === '#import') {
		openConvertDialog()
	}

	import('gsap/ScrollTrigger').then(({ ScrollTrigger: ST }) => {
		import('gsap').then(({ gsap }) => {
			gsap.registerPlugin(ST)
			const el = pageFitSectionRef.value
			if (!el) return
			const isSmall = window.innerWidth <= PAGE_FIT_SMALL_SCREEN_MAX_WIDTH
			const initialScale =
				isSmall ? PAGE_FIT_INITIAL_SCALE_SMALL : PAGE_FIT_INITIAL_SCALE
			gsap.set(el, { scale: initialScale, transformOrigin: '50% 50%' })
			el.style.setProperty('--page-fit-tint', String(PAGE_FIT_TINT_STRENGTH))
			const st = ST.create({
				trigger: el,
				start: 'top bottom',
				end: 'top 60%',
				id: PAGE_FIT_SCROLL_TRIGGER_ID,
			})
			pageFitSpringTrigger = st as unknown as {
				progress: number
				kill: () => void
			}
			let currentScale = initialScale
			let velocity = 0
			const ticker: TickerCb = (_time?, deltaTime?) => {
				if (!pageFitSpringTrigger) return
				const progress = pageFitSpringTrigger.progress
				const initial =
					window.innerWidth <= PAGE_FIT_SMALL_SCREEN_MAX_WIDTH ?
						PAGE_FIT_INITIAL_SCALE_SMALL
					:	PAGE_FIT_INITIAL_SCALE
				const targetScale = initial + progress * (1 - initial)
				const dt = Math.min((deltaTime ?? 16) / 1000, 0.05)
				velocity +=
					(targetScale - currentScale) * SPRING_TENSION * dt
					- velocity * SPRING_FRICTION * dt
				currentScale += velocity * dt
				currentScale = Math.max(initial - 0.1, Math.min(1.5, currentScale))
				gsap.set(el, { scale: currentScale })
				el.style.setProperty(
					'--page-fit-tint',
					String((1 - progress) * PAGE_FIT_TINT_STRENGTH),
				)
			}
			pageFitTickerRef = ticker
			gsap.ticker.add(ticker)
		})
	})
})
onUnmounted(() => {
	if (resizeHandler) window.removeEventListener('resize', resizeHandler)
	if (formatFlipId != null) clearInterval(formatFlipId)
	if (pageFitTickerRef) {
		import('gsap').then(({ gsap }) => gsap.ticker.remove(pageFitTickerRef!))
		pageFitTickerRef = null
	}
	import('gsap/ScrollTrigger').then(({ ScrollTrigger: ST }) => {
		ST.getById(PAGE_FIT_SCROLL_TRIGGER_ID)?.kill()
		pageFitSpringTrigger = null
	})
})

function scrollToFeatures() {
	const el = document.querySelector('.features-section')
	if (!el) return
	const target = el.getBoundingClientRect().top + window.scrollY
	const start = window.scrollY
	const distance = target - start
	const duration = 1200
	let startTime: number | null = null

	function springEase(t: number): number {
		return 1 - Math.pow(1 - t, 4) * Math.cos(t * Math.PI * 0.8)
	}

	function step(time: number) {
		if (startTime === null) startTime = time
		const elapsed = time - startTime
		const t = Math.min(elapsed / duration, 1)
		window.scrollTo(0, start + distance * springEase(t))
		if (t < 1) requestAnimationFrame(step)
	}

	requestAnimationFrame(step)
}

const tools = [
	{ name: 'Cursor', icon: '/images/logos/cursor.svg', invert: true },
	{
		name: 'Claude',
		icon: '/images/logos/claude-light.svg',
		darkIcon: '/images/logos/claude-dark.svg',
		invert: false,
	},
	{
		name: 'OpenClaw',
		icon: '/images/logos/openclaw-light.png',
		darkIcon: '/images/logos/openclaw-dark.png',
		invert: false,
	},
	{
		name: 'Gemini',
		icon: '/images/logos/gemini-light.svg',
		darkIcon: '/images/logos/gemini-dark.svg',
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
		name: 'GitHub Copilot',
		icon: '/images/logos/github-copilot.svg',
		invert: true,
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
	<main class="hero-landing">
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

				<!-- Floating Markdown glyphs (particle field) -->
				<div aria-hidden="true" class="hero-glyphs">
					<span
						v-for="p in particles"
						:key="p.id"
						class="hero-glyph"
						:style="{
							left: p.x + '%',
							top: p.y + '%',
							fontSize: p.size + 'rem',
							animationDuration: p.duration + 's',
							animationDelay: p.delay + 's',
							'--glyph-dx': p.dx + 'px',
							'--glyph-dy': p.dy + 'px',
							'--glyph-rot': p.rot + 'deg',
							'--glyph-o': p.opacity,
						}"
						>{{ p.char }}</span
					>
				</div>

				<!-- Badge -->
				<a
					class="hero-badge"
					href="https://github.com/resumx/resumx/releases/latest"
					target="_blank"
					rel="noopener"
				>
					<!-- Code icon (signals open source, reads clearly at small size) -->
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
						<polyline points="16 18 22 12 16 6" />
						<polyline points="8 6 2 12 8 18" />
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
					Let
					<span class="hero-heading-claude">
						<img
							src="/images/logos/claude-light.svg"
							alt=""
							width="24"
							height="24"
							class="hero-heading-claude-logo hero-heading-claude-logo--light-only"
						/>
						<img
							src="/images/logos/claude-dark.svg"
							alt=""
							width="24"
							height="24"
							class="hero-heading-claude-logo hero-heading-claude-logo--dark-only"
						/>
					</span>
					write your resume. Resumx makes it perfect.
				</h1>

				<!-- Subtitle -->
				<p class="hero-subtitle">
					Write in Markdown. Get a perfectly fitted
					<span class="hero-format-rotator">
						<span
							v-for="(fmt, i) in formats"
							:key="fmt.name"
							class="hero-format-word"
							:class="{ 'hero-format-word--active': i === activeFormat }"
							:style="{ color: fmt.color }"
							>{{ fmt.name }}</span
						></span
					><br />No layout fiddling.
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
						<span
							class="hero-btn-text--mobile-only"
							style="padding-right: 0.5rem"
							>View GitHub</span
						>
						<span v-if="starCount" class="hero-btn-star-count">
							<!-- Star icon -->
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="13"
								height="13"
								viewBox="0 0 24 24"
								fill="currentColor"
								stroke="none"
							>
								<path
									d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								/>
							</svg>
							{{ starCount }}
						</span>
					</a>
					<a
						class="hero-btn hero-btn--primary hero-btn--mobile-only"
						href="#features"
						@click.prevent="scrollToFeatures()"
					>
						See it in action
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
							<path d="M12 5v14" />
							<path d="m5 12 7 7 7-7" />
						</svg>
					</a>
					<a
						class="hero-btn hero-btn--primary hero-btn--desktop-only"
						href="/playground"
					>
						Playground
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
							<path
								d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
							/>
						</svg>
					</a>
				</div>

				<p class="hero-import-link">
					Already have a resume?
					<a href="#import" @click.prevent="openConvertDialog()">Import it</a>
				</p>
			</div>
		</section>

		<ConvertDialog :open="showConvertDialog" @close="closeConvertDialog()" />

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
			<div ref="pageFitSectionRef" class="page-fit-section-wrap">
				<PageFitDemo />
			</div>
			<div class="features-bento">
			<DemoCard
				label="Targeting"
				heading="Tag it. Filter it. Nail it."
				subtitle="Tag, mix and match, ship a tailored resume for every role."
				description="Markdown source with bullet points tagged {.@backend}, {.@frontend}, and {.@ai} next to a PDF preview. Selecting a target like 'frontend' filters the output to show only matching bullets such as Dashboard redesign and Design system."
				header-align="left"
			>
				<TagFilterDemo />
			</DemoCard>

			<DemoCard
				label="Icons"
				heading="Icons, typed."
				subtitle="200k+ icons, just type a shortcode."
				description="Grid of technology icons rendered from Markdown shortcodes: :mongodb:, :react:, :python:, :docker:, :ts:, :spring:, :azure:, :go:, and many more from a library of over 200,000 icons."
				header-align="right"
			>
				<IconRevealDemo />
			</DemoCard>
			</div>

		<DemoCard
			label="Styling"
			heading="Make it yours."
			subtitle="30+ style options. Tailwind classes supported. No CSS needed."
			description="Interactive style editor showing YAML frontmatter options like section-title-color, section-title-align, and section-title-border with a live preview. Clicking each option cycles through values and the resume preview updates instantly. Tailwind utility classes like .grid and .grid-cols-3 are also supported."
		>
			<StylePlaygroundDemo />
		</DemoCard>

		<div class="features-bento features-bento--tailor-git">
			<DemoCard
				label="Tailoring"
				heading="Your resume is a database."
				description="Terminal running 'resumx resume.md --for stripe-infra, vercel-swe, startup-cto' which generates three separate tailored PDFs from a single Markdown file in about one second. Each target filters tagged content to produce a role-specific resume."
				header-align="left"
			>
				<template #subtitle>
					Your resume is a database, each application is a query.<br />Tailoring
					doesn't require separate files.
				</template>
				<MultiTargetDemo />
			</DemoCard>

			<DemoCard
				label="Version Control"
				heading="Time travel for your resume."
				description="Git commit history for a resume: commits like 'feat: add ML pipeline metrics', 'feat: tailor for Stripe', 'refactor: rewrite summary', and branch tags like sent/stripe-2026-02 and sent/google-2026-01. Any past version can be rendered with 'git resumx resume.md'."
				header-align="right"
			>
				<template #subtitle>
					Your resume lives in Git. Render any past commit in one command.
				</template>
				<GitVersionDemo />
			</DemoCard>
		</div>
		</section>

	<InstallSection />

	<section class="bottom-cta">
		<div class="hero-buttons">
			<a
				class="hero-btn hero-btn--primary bottom-cta-playground"
				href="/playground"
			>
				Playground
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
						<path
							d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
						/>
					</svg>
				</a>
			</div>
		</section>
	</main>
	<FooterLanding />
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

/* Match VitePress dark mode: class is on html. Use html selectors so correct
   logo shows when page loads in dark mode. */
.tool-icon--dark-only {
	display: none;
}

html:not(.dark) .tool-icon--dark-only {
	display: none !important;
}

html.dark .tool-icon--light-only {
	display: none !important;
}

html.dark .tool-icon--dark-only {
	display: inline !important;
}

.hero-heading-claude-logo--dark-only {
	display: none;
}

html:not(.dark) .hero-heading-claude-logo--dark-only {
	display: none !important;
}

html.dark .hero-heading-claude-logo--light-only {
	display: none !important;
}

html.dark .hero-heading-claude-logo--dark-only {
	display: inline !important;
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

/* ---- Floating glyphs (particle field) ---- */
@keyframes glyph-drift {
	0% {
		transform: translate(0, 0) rotate(0deg);
		opacity: var(--glyph-o);
	}
	20% {
		transform: translate(
				calc(var(--glyph-dx) * 0.3),
				calc(var(--glyph-dy) * 0.5)
			)
			rotate(calc(var(--glyph-rot) * 0.4));
	}
	50% {
		transform: translate(var(--glyph-dx), var(--glyph-dy))
			rotate(var(--glyph-rot));
		opacity: calc(var(--glyph-o) * 1.3);
	}
	80% {
		transform: translate(
				calc(var(--glyph-dx) * -0.3),
				calc(var(--glyph-dy) * 0.4)
			)
			rotate(calc(var(--glyph-rot) * -0.5));
	}
	100% {
		transform: translate(0, 0) rotate(0deg);
		opacity: var(--glyph-o);
	}
}

.hero-glyphs {
	position: absolute;
	inset: 0;
	z-index: -1;
	pointer-events: none;
	overflow: hidden;
}

.hero-glyph {
	position: absolute;
	font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
	color: var(--vp-c-text-3);
	white-space: nowrap;
	user-select: none;
	will-change: transform;
	opacity: var(--glyph-o);
	animation: glyph-drift ease-in-out infinite;
	--glyph-dx: 0px;
	--glyph-dy: 0px;
	--glyph-rot: 0deg;
	--glyph-o: 0.15;
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
	gap: 0.25rem;
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
		gap: 0.5rem;
		padding: 0.25rem 0.75rem;
	}
}

.hero-badge-text {
	font-size: 0.75rem;
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

@media (min-width: 1280px) {
	.hero-heading {
		font-size: 3.75rem;
	}
}

.hero-heading-claude {
	display: inline-flex;
	align-items: center;
	white-space: nowrap;
	transform: translateY(0.09em);
	opacity: 0.84;
}

.hero-heading-claude-logo {
	height: 0.902em;
	width: auto;
	object-fit: contain;
	flex-shrink: 0;
	vertical-align: middle;
}

/* ---- Subtitle ---- */
.hero-subtitle {
	margin: 0 auto;
	max-width: 32rem;
	text-align: center;
	font-size: 0.875rem;
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

/* ---- Format rotator ---- */
.hero-format-rotator {
	display: inline-block;
	position: relative;
	width: 4.5ch;
	height: 1.6em;
	vertical-align: bottom;
	overflow: hidden;
}

.hero-format-word {
	position: absolute;
	left: 0;
	top: 0;
	text-align: left;
	opacity: 0;
	transform: translateY(60%);
	transition:
		opacity 0.3s ease,
		transform 0.3s ease;
}

.hero-format-word--active {
	opacity: 1;
	transform: translateY(0);
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
	.hero-btn-text--mobile-only {
		display: none;
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

.hero-landing .hero-buttons .hero-btn--secondary {
	order: -1;
}

.hero-btn--primary {
	order: 0;
}

.hero-btn--desktop-only {
	display: none;
}

@media (min-width: 768px) {
	.hero-btn--mobile-only {
		display: none;
	}
	.hero-btn--desktop-only {
		display: inline-flex;
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

.hero-btn-star-count {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	margin-left: 0.15rem;
	padding-left: 0.5rem;
	vertical-align: text-top;
	border-left: 1px solid var(--vp-c-divider);
}

.hero-btn-icon--start {
	margin-right: 0.3rem;
}

.hero-btn-icon--end {
	margin-left: 0.5rem;
}

/* ---- Import link ---- */
.hero-import-link {
	margin: 0;
	font-size: 0.8125rem;
	color: var(--vp-c-text-3);
	animation: fade-slide-in 0.5s ease-out 0.4s backwards;
}

.hero-import-link a {
	color: var(--vp-c-brand-1) !important;
	text-decoration: underline !important;
	text-underline-offset: 2px;
	cursor: pointer;
}

.hero-import-link a:hover {
	color: var(--vp-c-brand-2) !important;
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

/* Neutral elevation tint: light mode = darker white, dark mode = lighter black */
.page-fit-section-wrap {
	--page-fit-elevation: color-mix(in srgb, var(--vp-c-bg) 78%, black);
	position: relative;
	border-radius: 3rem;
	overflow: hidden;
	background: color-mix(
		in srgb,
		var(--page-fit-elevation) calc(var(--page-fit-tint, 1) * 100%),
		transparent
	);
}

@media (max-width: 640px) {
	.page-fit-section-wrap {
		border-radius: 1.5rem;
	}
}

.dark .page-fit-section-wrap {
	--page-fit-elevation: color-mix(in srgb, var(--vp-c-bg) 92%, white);
}

@media (min-width: 1280px) {
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

/* Tailoring + Version Control: two columns, each card only as tall as its content */
.features-bento--tailor-git {
	grid-template-columns: 1fr;
}

@media (min-width: 860px) {
	.features-bento--tailor-git {
		grid-template-columns: 3fr 3fr;
		grid-template-rows: fit-content(100%) fit-content(100%);
	}

	.features-bento--tailor-git .demo-card {
		grid-row: span 2;
		display: grid;
		grid-template-rows: subgrid;
		padding: 2rem 2rem 1.75rem;
	}

	.features-bento--tailor-git .demo-card .demo-card-header {
		margin-bottom: 0;
		align-self: start;
		padding-bottom: 1.75rem;
	}

	.features-bento--tailor-git .demo-card .demo-card-body {
		align-self: start;
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
	color: var(--vp-c-text-2);
	letter-spacing: -0.025em;
	margin-bottom: 0.75rem;
	border-top-style: none !important;
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

/* ---- Bottom CTA ---- */
.bottom-cta {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	padding: 2.5rem 1rem 1rem;
}

@media (min-width: 640px) {
	.bottom-cta {
		padding: 3rem 1.5rem 1.5rem;
	}
}

.bottom-cta-playground {
	display: inline-flex;
}
</style>
