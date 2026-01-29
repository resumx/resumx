import { describe, it, expect } from 'vitest'
import { compileTailwindCSS, extractClassNames } from './tailwind.js'

describe('tailwind', () => {
	describe('extractClassNames', () => {
		it('extracts class names from HTML class attributes', () => {
			const html = '<div class="text-blue-500 font-bold">Hello</div>'
			const classes = extractClassNames(html)
			expect(classes).toContain('text-blue-500')
			expect(classes).toContain('font-bold')
		})

		it('extracts class names from multiple elements', () => {
			const html = `
				<div class="bg-red-500">
					<span class="text-white px-4">Text</span>
				</div>
			`
			const classes = extractClassNames(html)
			expect(classes).toContain('bg-red-500')
			expect(classes).toContain('text-white')
			expect(classes).toContain('px-4')
		})

		it('handles single quotes in class attribute', () => {
			const html = "<div class='text-lg'>Hello</div>"
			const classes = extractClassNames(html)
			expect(classes).toContain('text-lg')
		})

		it('returns empty array for HTML without classes', () => {
			const html = '<div>Hello</div>'
			const classes = extractClassNames(html)
			expect(classes).toEqual([])
		})

		it('deduplicates class names', () => {
			const html = `
				<div class="text-blue-500">
					<span class="text-blue-500">Repeated</span>
				</div>
			`
			const classes = extractClassNames(html)
			const blueCount = classes.filter(c => c === 'text-blue-500').length
			expect(blueCount).toBe(1)
		})

		it('extracts classes with variants like hover: and focus:', () => {
			const html =
				'<button class="hover:bg-blue-600 focus:ring-2">Click</button>'
			const classes = extractClassNames(html)
			expect(classes).toContain('hover:bg-blue-600')
			expect(classes).toContain('focus:ring-2')
		})

		it('extracts arbitrary value classes', () => {
			const html = '<div class="w-[200px] text-[#ff0000]">Custom</div>'
			const classes = extractClassNames(html)
			expect(classes).toContain('w-[200px]')
			expect(classes).toContain('text-[#ff0000]')
		})
	})

	describe('compileTailwindCSS', () => {
		it('generates CSS for basic utility classes', async () => {
			const html = '<div class="text-blue-500 font-bold">Hello</div>'
			const css = await compileTailwindCSS(html)

			expect(css).toContain('.text-blue-500')
			expect(css).toContain('.font-bold')
		})

		it('generates CSS for spacing utilities', async () => {
			const html = '<div class="p-4 m-2 px-6">Spaced</div>'
			const css = await compileTailwindCSS(html)

			expect(css).toContain('.p-4')
			expect(css).toContain('.m-2')
			expect(css).toContain('.px-6')
		})

		it('generates CSS for flex utilities', async () => {
			const html = '<div class="flex items-center justify-between">Flex</div>'
			const css = await compileTailwindCSS(html)

			expect(css).toContain('.flex')
			expect(css).toContain('.items-center')
			expect(css).toContain('.justify-between')
		})

		it('generates CSS for hover variants', async () => {
			const html = '<button class="hover:bg-blue-600">Hover</button>'
			const css = await compileTailwindCSS(html)

			expect(css).toContain('hover\\:bg-blue-600')
			expect(css).toContain(':hover')
		})

		it('returns empty string for HTML without Tailwind classes', async () => {
			const html = '<div class="custom-class">No Tailwind</div>'
			const css = await compileTailwindCSS(html)

			// Should not contain any utility classes (only banner comment)
			expect(css).not.toContain('.custom-class')
		})

		it('generates CSS for responsive variants', async () => {
			const html = '<div class="md:text-lg lg:text-xl">Responsive</div>'
			const css = await compileTailwindCSS(html)

			expect(css).toContain('md\\:text-lg')
			expect(css).toContain('lg\\:text-xl')
		})
	})
})
