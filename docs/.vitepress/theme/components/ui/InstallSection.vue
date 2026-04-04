<template>
	<section class="install-section">
		<h2 class="install-heading">Get started in 30 seconds</h2>
		<div class="install-steps">
			<div class="install-step">
				<span class="install-step-label">Install</span>
				<div class="install-code">
					<code>npm install -g @resumx/resumx</code>
				</div>
			</div>
			<div class="install-step">
				<span class="install-step-label">Init</span>
				<div class="install-code">
					<code>resumx init resume.md</code>
				</div>
			</div>
			<div class="install-step">
				<span class="install-step-label">Edit</span>
				<div class="install-code">
					<code>resumx resume.md --watch</code>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped>
/* Match demo heading inset: .features-section pad + DemoCard pad */
.install-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	box-sizing: border-box;
	padding: 3rem 1.75rem 1rem;
	margin: 0 auto;
}

@media (min-width: 640px) {
	.install-section {
		padding: 4rem 4rem 1.5rem;
	}
}

@media (min-width: 1280px) {
	.install-section {
		margin: 0 4rem;
		padding: 4rem 3.5rem 1.5rem;
	}
}

.install-heading {
	text-align: center;
	font-weight: 700;
	font-size: 1.5rem;
	color: var(--vp-c-text-1);
	letter-spacing: -0.025em;
	margin: 0;
	border: none !important;
}

@media (min-width: 640px) {
	.install-heading {
		font-size: 1.75rem;
	}
}

.install-steps {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
	max-width: 36rem;
}

.install-step {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
}

@media (min-width: 480px) {
	.install-step {
		gap: 0.75rem;
	}
}

.install-step-label {
	flex-shrink: 0;
	width: 3.5rem;
	font-size: 0.6875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--vp-c-text-3);
	text-align: right;
}

@media (min-width: 480px) {
	.install-step-label {
		width: 5rem;
		font-size: 0.75rem;
	}
}

.install-code {
	flex: 1;
	min-width: 0;
	padding: 0.625rem 1rem;
	border-radius: 0.5rem;
	background-color: var(--vp-c-bg-soft);
	border: 1px solid var(--vp-c-divider);
	font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
	font-size: 0.8125rem;
	color: var(--vp-c-text-1);
	overflow-x: auto;
	white-space: nowrap;
}

@media (min-width: 640px) {
	.install-code {
		font-size: 0.875rem;
	}
}
</style>
