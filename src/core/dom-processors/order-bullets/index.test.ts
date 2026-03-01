import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { orderBullets } from './index.js'
import type { BulletOrder } from '../../view/types.js'

function parseHtml(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	return document.getElementById('root')!
}

function run(
	html: string,
	bulletOrder: BulletOrder,
	selects: string[] | null,
	tagMap?: Record<string, string[]>,
): string {
	return orderBullets(bulletOrder, selects, tagMap)(html)
}

function liTexts(html: string): string[] {
	const root = parseHtml(html)
	return Array.from(root.querySelectorAll('li')).map(
		li => li.textContent?.trim() ?? '',
	)
}

describe('orderBullets', () => {
	describe('bullet-order: none', () => {
		it('preserves document order', () => {
			const html = `
				<ul>
					<li class="@backend">Backend work</li>
					<li>General work</li>
					<li class="@frontend">Frontend work</li>
				</ul>
			`
			const result = run(html, 'none', ['backend', 'frontend'])
			expect(liTexts(result)).toEqual([
				'Backend work',
				'General work',
				'Frontend work',
			])
		})

		it('preserves order even with tagMap', () => {
			const html = `
				<ul>
					<li class="@scalability">Scalability</li>
					<li>General</li>
					<li class="@latency">Latency</li>
				</ul>
			`
			const tagMap = { general: ['latency', 'scalability'] }
			const result = run(html, 'none', ['general'], tagMap)
			expect(liTexts(result)).toEqual(['Scalability', 'General', 'Latency'])
		})
	})

	describe('bullet-order: tag', () => {
		it('promotes tagged bullets to top, sorted by selects declaration order', () => {
			const html = `
				<ul>
					<li>General work</li>
					<li class="@distributed-systems">Distributed systems work</li>
					<li class="@backend">Backend work</li>
					<li>Another general item</li>
				</ul>
			`
			const result = run(html, 'tag', ['backend', 'distributed-systems'])
			expect(liTexts(result)).toEqual([
				'Backend work',
				'Distributed systems work',
				'General work',
				'Another general item',
			])
		})

		it('treats as none when selects is null', () => {
			const html = `
				<ul>
					<li class="@backend">Backend work</li>
					<li>General work</li>
					<li class="@frontend">Frontend work</li>
				</ul>
			`
			const result = run(html, 'tag', null)
			expect(liTexts(result)).toEqual([
				'Backend work',
				'General work',
				'Frontend work',
			])
		})

		it('reorders each <ul> independently', () => {
			const html = `
				<ul>
					<li>A general</li>
					<li class="@backend">A backend</li>
				</ul>
				<ul>
					<li>B general</li>
					<li class="@backend">B backend</li>
				</ul>
			`
			const result = run(html, 'tag', ['backend'])
			const root = parseHtml(result)
			const uls = root.querySelectorAll('ul')

			const firstUlTexts = Array.from(uls[0].querySelectorAll('li')).map(li =>
				li.textContent?.trim(),
			)
			const secondUlTexts = Array.from(uls[1].querySelectorAll('li')).map(li =>
				li.textContent?.trim(),
			)

			expect(firstUlTexts).toEqual(['A backend', 'A general'])
			expect(secondUlTexts).toEqual(['B backend', 'B general'])
		})

		it('preserves source order among bullets with equal rank', () => {
			const html = `
				<ul>
					<li>General 1</li>
					<li class="@backend">Backend B</li>
					<li class="@backend">Backend A</li>
					<li>General 2</li>
				</ul>
			`
			const result = run(html, 'tag', ['backend'])
			expect(liTexts(result)).toEqual([
				'Backend B',
				'Backend A',
				'General 1',
				'General 2',
			])
		})

		it('handles empty selects array as identity', () => {
			const html = `
				<ul>
					<li class="@backend">Backend</li>
					<li>General</li>
				</ul>
			`
			const result = run(html, 'tag', [])
			expect(liTexts(result)).toEqual(['Backend', 'General'])
		})

		it('handles ul with no tagged bullets (no change)', () => {
			const html = `
				<ul>
					<li>First</li>
					<li>Second</li>
					<li>Third</li>
				</ul>
			`
			const result = run(html, 'tag', ['backend'])
			expect(liTexts(result)).toEqual(['First', 'Second', 'Third'])
		})

		it('sorts by tag declaration order from composed tag', () => {
			const html = `
				<ul>
					<li>General work</li>
					<li class="@scalability">Scalability work</li>
					<li class="@latency">Latency work</li>
					<li class="@docker">Docker work</li>
				</ul>
			`
			const tagMap = {
				general: ['latency', 'k8s', 'docker', 'scalability'],
			}
			const result = run(html, 'tag', ['general'], tagMap)
			expect(liTexts(result)).toEqual([
				'Latency work',
				'Docker work',
				'Scalability work',
				'General work',
			])
		})

		it('respects selects order for direct tags', () => {
			const html = `
				<ul>
					<li>Untagged</li>
					<li class="@backend">Backend</li>
					<li class="@frontend">Frontend</li>
				</ul>
			`
			const result = run(html, 'tag', ['frontend', 'backend'])
			expect(liTexts(result)).toEqual(['Frontend', 'Backend', 'Untagged'])
		})

		it('orders by selects index when composed tag expands', () => {
			const html = `
				<ul>
					<li>General</li>
					<li class="@backend">Backend</li>
					<li class="@frontend">Frontend</li>
				</ul>
			`
			const tagMap = {
				fullstack: ['frontend', 'backend'],
			}
			const result = run(html, 'tag', ['fullstack'], tagMap)
			expect(liTexts(result)).toEqual(['Frontend', 'Backend', 'General'])
		})

		it('separates priority across selects entries with expansion', () => {
			const html = `
				<ul>
					<li>Untagged</li>
					<li class="@leadership">Leadership</li>
					<li class="@frontend">Frontend</li>
					<li class="@backend">Backend</li>
				</ul>
			`
			const tagMap = {
				fullstack: ['frontend', 'backend'],
			}
			const result = run(html, 'tag', ['fullstack', 'leadership'], tagMap)
			expect(liTexts(result)).toEqual([
				'Frontend',
				'Backend',
				'Leadership',
				'Untagged',
			])
		})

		it('handles recursive compositions', () => {
			const html = `
				<ul>
					<li>Untagged</li>
					<li class="@leadership">Leadership</li>
					<li class="@frontend">Frontend</li>
					<li class="@backend">Backend</li>
				</ul>
			`
			const tagMap = {
				fullstack: ['frontend', 'backend'],
				'startup-cto': ['fullstack', 'leadership'],
			}
			const result = run(html, 'tag', ['startup-cto'], tagMap)
			expect(liTexts(result)).toEqual([
				'Frontend',
				'Backend',
				'Leadership',
				'Untagged',
			])
		})

		it('works without tagMap (direct tag matching)', () => {
			const html = `
				<ul>
					<li>General</li>
					<li class="@backend">Backend</li>
				</ul>
			`
			const result = run(html, 'tag', ['backend'])
			expect(liTexts(result)).toEqual(['Backend', 'General'])
		})

		it('orders bullet with multiple tags by best matching priority', () => {
			const html = `
				<ul>
					<li>General</li>
					<li class="@frontend @backend">Fullstack bullet</li>
					<li class="@backend">Backend only</li>
				</ul>
			`
			const result = run(html, 'tag', ['frontend', 'backend'])
			expect(liTexts(result)).toEqual([
				'Fullstack bullet',
				'Backend only',
				'General',
			])
		})

		it('handles empty UL gracefully', () => {
			const html = '<ul></ul>'
			const result = run(html, 'tag', ['backend'])
			expect(liTexts(result)).toEqual([])
		})

		it('ignores non-matching tags', () => {
			const html = `
				<ul>
					<li class="@devops">DevOps</li>
					<li>Untagged</li>
				</ul>
			`
			const result = run(html, 'tag', ['frontend', 'backend'])
			expect(liTexts(result)).toEqual(['DevOps', 'Untagged'])
		})
	})
})
