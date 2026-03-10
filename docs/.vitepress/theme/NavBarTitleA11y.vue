<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
	const link = document.querySelector(
		'.VPNavBarTitle a.title',
	) as HTMLAnchorElement | null
	if (link && !link.getAttribute('aria-label')) {
		link.setAttribute('aria-label', 'Resumx')
	}
})
</script>

<template>
	<!-- No visible output; only sets aria-label on nav bar title link for screen readers -->
</template>
