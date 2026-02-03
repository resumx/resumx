import { describe, it, expect } from 'vitest'
import { extractRoles, filterByRole, resolveRoles } from './roles.js'

describe('roles SDK', () => {
	describe('extractRoles', () => {
		it('extracts single role from class attribute', () => {
			const html = '<div class="role:frontend">Content</div>'
			expect(extractRoles(html)).toEqual(['frontend'])
		})

		it('extracts multiple roles from same element', () => {
			const html = '<div class="role:frontend role:fullstack">Content</div>'
			const roles = extractRoles(html)
			expect(roles).toContain('frontend')
			expect(roles).toContain('fullstack')
		})

		it('extracts roles from multiple elements', () => {
			const html = `
				<div class="role:frontend">Frontend</div>
				<div class="role:backend">Backend</div>
				<div class="role:fullstack">Fullstack</div>
			`
			const roles = extractRoles(html)
			expect(roles).toContain('frontend')
			expect(roles).toContain('backend')
			expect(roles).toContain('fullstack')
		})

		it('returns unique roles (no duplicates)', () => {
			const html = `
				<div class="role:frontend">One</div>
				<div class="role:frontend">Two</div>
				<li class="role:frontend">Three</li>
			`
			const roles = extractRoles(html)
			expect(roles).toEqual(['frontend'])
		})

		it('returns empty array for HTML without roles', () => {
			const html = '<div class="highlight">No roles here</div>'
			expect(extractRoles(html)).toEqual([])
		})

		it('returns empty array for empty HTML', () => {
			expect(extractRoles('')).toEqual([])
		})

		it('ignores role: in text content (only extracts from class)', () => {
			const html = '<p>This mentions role:frontend but is not a class</p>'
			expect(extractRoles(html)).toEqual([])
		})

		it('handles role classes with other classes', () => {
			const html =
				'<div class="highlight role:frontend text-bold">Content</div>'
			expect(extractRoles(html)).toEqual(['frontend'])
		})

		it('handles nested elements with roles', () => {
			const html = `
				<div class="role:frontend">
					<span class="role:fullstack">Nested</span>
				</div>
			`
			const roles = extractRoles(html)
			expect(roles).toContain('frontend')
			expect(roles).toContain('fullstack')
		})

		it('extracts roles from list items', () => {
			const html = `
				<ul>
					<li class="role:frontend">React</li>
					<li class="role:backend">Node.js</li>
					<li>Common skill</li>
				</ul>
			`
			const roles = extractRoles(html)
			expect(roles).toContain('frontend')
			expect(roles).toContain('backend')
			expect(roles).toHaveLength(2)
		})
	})

	describe('filterByRole', () => {
		it('keeps elements matching the active role', () => {
			const html = '<div class="role:frontend">Frontend content</div>'
			const result = filterByRole(html, 'frontend')
			expect(result).toContain('Frontend content')
			expect(result).toContain('role:frontend')
		})

		it('removes elements not matching the active role', () => {
			const html = '<div class="role:backend">Backend content</div>'
			const result = filterByRole(html, 'frontend')
			expect(result).not.toContain('Backend content')
			expect(result).not.toContain('role:backend')
		})

		it('keeps elements without any role class (common content)', () => {
			const html = `
				<div class="role:frontend">Frontend</div>
				<div class="common">Common content</div>
				<div class="role:backend">Backend</div>
			`
			const result = filterByRole(html, 'frontend')
			expect(result).toContain('Frontend')
			expect(result).toContain('Common content')
			expect(result).not.toContain('Backend')
		})

		it('keeps elements with multiple roles if one matches', () => {
			const html = '<div class="role:frontend role:fullstack">Shared</div>'
			const result = filterByRole(html, 'frontend')
			expect(result).toContain('Shared')
		})

		it('handles list items correctly', () => {
			const html = `
				<ul>
					<li class="role:frontend">React</li>
					<li class="role:backend">Node.js</li>
					<li>Common skill</li>
				</ul>
			`
			const result = filterByRole(html, 'frontend')
			expect(result).toContain('React')
			expect(result).not.toContain('Node.js')
			expect(result).toContain('Common skill')
		})

		it('handles nested elements - removes parent removes children', () => {
			const html = `
				<div class="role:backend">
					<p>Backend paragraph</p>
					<span>Backend span</span>
				</div>
			`
			const result = filterByRole(html, 'frontend')
			expect(result).not.toContain('Backend paragraph')
			expect(result).not.toContain('Backend span')
		})

		it('handles fenced divs with role class', () => {
			const html = `
				<div class="role:frontend">
					<p>Frontend skills</p>
					<ul>
						<li>React</li>
						<li>TypeScript</li>
					</ul>
				</div>
			`
			const result = filterByRole(html, 'frontend')
			expect(result).toContain('Frontend skills')
			expect(result).toContain('React')
		})

		it('returns empty string when all content is filtered out', () => {
			const html = '<div class="role:backend">Backend only</div>'
			const result = filterByRole(html, 'frontend')
			expect(result.trim()).toBe('')
		})

		it('preserves HTML structure of remaining elements', () => {
			const html = `
				<article>
					<h2>Skills</h2>
					<div class="role:frontend">
						<h3>Frontend</h3>
					</div>
					<div class="role:backend">
						<h3>Backend</h3>
					</div>
				</article>
			`
			const result = filterByRole(html, 'frontend')
			expect(result).toContain('<article>')
			expect(result).toContain('<h2>Skills</h2>')
			expect(result).toContain('<h3>Frontend</h3>')
			expect(result).not.toContain('<h3>Backend</h3>')
		})

		it('handles span elements with role class', () => {
			const html =
				'<p>Experience: <span class="role:frontend">5 years React</span></p>'
			const result = filterByRole(html, 'frontend')
			expect(result).toContain('5 years React')
		})

		it('removes span elements not matching role', () => {
			const html =
				'<p>Experience: <span class="role:backend">3 years Node</span></p>'
			const result = filterByRole(html, 'frontend')
			expect(result).not.toContain('3 years Node')
			expect(result).toContain('Experience:')
		})
	})

	describe('resolveRoles', () => {
		it('returns explicit role as highest priority', () => {
			const result = resolveRoles({
				explicit: ['frontend'],
				configured: ['backend', 'fullstack'],
				discovered: ['frontend', 'backend', 'fullstack'],
			})
			expect(result).toEqual(['frontend'])
		})

		it('returns multiple explicit roles', () => {
			const result = resolveRoles({
				explicit: ['frontend', 'backend'],
				configured: ['fullstack'],
				discovered: ['frontend', 'backend', 'fullstack'],
			})
			expect(result).toEqual(['frontend', 'backend'])
		})

		it('returns configured roles if no explicit role', () => {
			const result = resolveRoles({
				configured: ['frontend', 'backend'],
				discovered: ['frontend', 'backend', 'fullstack'],
			})
			expect(result).toEqual(['frontend', 'backend'])
		})

		it('returns discovered roles if no explicit or configured', () => {
			const result = resolveRoles({
				discovered: ['frontend', 'backend', 'fullstack'],
			})
			expect(result).toEqual(['frontend', 'backend', 'fullstack'])
		})

		it('returns empty array if no roles at any level', () => {
			const result = resolveRoles({
				discovered: [],
			})
			expect(result).toEqual([])
		})

		it('handles empty configured array (falls through to discovered)', () => {
			const result = resolveRoles({
				configured: [],
				discovered: ['frontend', 'backend'],
			})
			expect(result).toEqual(['frontend', 'backend'])
		})

		it('handles empty explicit array (falls through to configured)', () => {
			const result = resolveRoles({
				explicit: [],
				configured: ['frontend'],
				discovered: ['frontend', 'backend'],
			})
			expect(result).toEqual(['frontend'])
		})

		it('explicit overrides even when configured exists', () => {
			const result = resolveRoles({
				explicit: ['fullstack'],
				configured: ['frontend', 'backend'],
				discovered: ['frontend', 'backend', 'fullstack'],
			})
			expect(result).toEqual(['fullstack'])
		})

		it('throws error when explicit role does not exist in discovered roles', () => {
			expect(() =>
				resolveRoles({
					explicit: ['nonexistent'],
					configured: ['frontend', 'backend'],
					discovered: ['frontend', 'backend'],
				}),
			).toThrow("role 'nonexistent' does not exist")
		})

		it('throws error when multiple explicit roles do not exist', () => {
			expect(() =>
				resolveRoles({
					explicit: ['frontend', 'typo1', 'typo2'],
					discovered: ['frontend', 'backend'],
				}),
			).toThrow("roles 'typo1', 'typo2' does not exist")
		})

		it('throws error when explicit role is typo of existing role', () => {
			expect(() =>
				resolveRoles({
					explicit: ['fronted'], // typo
					discovered: ['frontend', 'backend'],
				}),
			).toThrow("role 'fronted' does not exist")
		})

		it('includes available roles in error message', () => {
			expect(() =>
				resolveRoles({
					explicit: ['devops'],
					discovered: ['frontend', 'backend', 'fullstack'],
				}),
			).toThrow('Available roles: frontend, backend, fullstack')
		})

		it('allows explicit role that exists in discovered', () => {
			const result = resolveRoles({
				explicit: ['frontend'],
				discovered: ['frontend', 'backend'],
			})
			expect(result).toEqual(['frontend'])
		})

		it('allows explicit role in discovered even if not in configured', () => {
			// User can override configured filter with --role to render any discovered role
			const result = resolveRoles({
				explicit: ['fullstack'],
				configured: ['frontend'], // limited to frontend in frontmatter
				discovered: ['frontend', 'backend', 'fullstack'], // but fullstack exists in content
			})
			expect(result).toEqual(['fullstack'])
		})

		// Configured role validation tests
		it('throws error when configured role does not exist in discovered roles', () => {
			expect(() =>
				resolveRoles({
					configured: ['frontend', 'nonexistent'],
					discovered: ['frontend', 'backend'],
				}),
			).toThrow("role 'nonexistent' does not exist")
		})

		it('throws error when multiple configured roles do not exist', () => {
			expect(() =>
				resolveRoles({
					configured: ['frontend', 'full', 'devops'],
					discovered: ['frontend', 'backend', 'fullstack'],
				}),
			).toThrow("roles 'full', 'devops' does not exist")
		})

		it('includes available roles in configured error message', () => {
			expect(() =>
				resolveRoles({
					configured: ['typo'],
					discovered: ['frontend', 'backend'],
				}),
			).toThrow('Available roles: frontend, backend')
		})

		it('allows configured roles that all exist in discovered', () => {
			const result = resolveRoles({
				configured: ['frontend', 'backend'],
				discovered: ['frontend', 'backend', 'fullstack'],
			})
			expect(result).toEqual(['frontend', 'backend'])
		})

		it('throws error for configured role typo (e.g., full vs fullstack)', () => {
			expect(() =>
				resolveRoles({
					configured: ['frontend', 'full'], // typo: should be 'fullstack'
					discovered: ['frontend', 'backend', 'fullstack'],
				}),
			).toThrow("role 'full' does not exist")
		})
	})
})
