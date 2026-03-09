<script setup lang="ts">
withDefaults(
	defineProps<{
		label: string
		heading: string
		subtitle: string
		headerAlign?: 'left' | 'center' | 'right'
	}>(),
	{ headerAlign: 'center' }
)
</script>

<template>
	<div class="demo-card demo-card--visible">
		<div class="demo-card-header" :class="`demo-card-header--${headerAlign}`">
			<span class="demo-card-label">{{ label }}</span>
			<h3 class="demo-card-heading">{{ heading }}</h3>
			<p class="demo-card-subtitle">{{ subtitle }}</p>
		</div>
		<slot />
	</div>
</template>

<style scoped>
.demo-card {
	padding: 2rem 2rem 1.75rem;
	opacity: 0;
	transform: translateY(2rem);
	transition:
		opacity 0.6s ease-out,
		transform 0.6s ease-out;
}

.demo-card--visible {
	opacity: 1;
	transform: translateY(0);
}

.demo-card-header {
	text-align: center;
	margin-bottom: 1.75rem;
}

.demo-card-header--left {
	text-align: left;
}

.demo-card-header--left .demo-card-subtitle {
	margin-left: 0;
	margin-right: 0;
}

.demo-card-header--right {
	text-align: right;
}

.demo-card-header--right .demo-card-subtitle {
	margin-left: auto;
	margin-right: 0;
}

.demo-card-label {
	display: inline-block;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--vp-c-brand-1);
	margin-bottom: 0.5rem;
}

.demo-card-heading {
	font-size: 1.75rem;
	font-weight: 700;
	color: var(--vp-c-text-1);
	margin: 0 0 0.5rem;
	line-height: 1.35;
	letter-spacing: -0.025em;
	border: none !important;
}

.demo-card-subtitle {
	font-size: 0.9375rem;
	color: var(--vp-c-text-2);
	margin: 0 auto;
	max-width: 36rem;
	line-height: 1.6;
}

@media (min-width: 640px) {
	.demo-card-heading {
		font-size: 2.25rem;
	}
}

@media (max-width: 640px) {
	.demo-card {
		padding: 1.5rem 1.25rem 1.25rem;
	}
}
</style>
