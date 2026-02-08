import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { classifyHeader, isContactBlock } from './index.js'
import type { PipelineContext } from '../types.js'

// =============================================================================
// Test Utilities
// =============================================================================

function parseHtml(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return {
		body: root,
		document,
		querySelector: (selector: string) => root.querySelector(selector),
		querySelectorAll: (selector: string) => root.querySelectorAll(selector),
	}
}

/**
 * Create an element from HTML string for testing isContactBlock
 */
function createElement(html: string): Element {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	return document.getElementById('root')!.firstElementChild!
}

function createContext(): PipelineContext {
	return {
		config: {},
		env: { css: '' },
	}
}

// =============================================================================
// Tests: isContactBlock (segment classification)
// =============================================================================

describe('isContactBlock', () => {
	describe('positive cases - should detect as contact', () => {
		it.each([
			// Email links
			[
				'email with mailto',
				'<p><a href="mailto:john@example.com">john@example.com</a></p>',
			],
			// Phone links
			[
				'phone with tel',
				'<p><a href="tel:+15551234567">+1 555-123-4567</a></p>',
			],
			// Social profiles
			[
				'linkedin profile',
				'<p><a href="https://linkedin.com/in/john">LinkedIn</a></p>',
			],
			['github profile', '<p><a href="https://github.com/john">GitHub</a></p>'],
			[
				'twitter profile',
				'<p><a href="https://twitter.com/john">Twitter</a></p>',
			],
			['x.com profile', '<p><a href="https://x.com/john">X</a></p>'],
			// Multiple contact items
			[
				'email and linkedin',
				'<p><a href="mailto:john@x.com">Email</a> | <a href="https://linkedin.com/in/john">LinkedIn</a></p>',
			],
			// Blockquote with contacts
			[
				'blockquote with email and social',
				'<blockquote><a href="mailto:a@b.com">a@b.com</a> | <a href="https://github.com/x">GitHub</a></blockquote>',
			],
			// With location
			[
				'contact with location',
				'<p><a href="mailto:x@y.com">x@y.com</a> | San Francisco, CA</p>',
			],
		])('%s', (_, html) => {
			const el = createElement(html)
			expect(isContactBlock(el)).toBe(true)
		})
	})

	describe('negative cases - should NOT detect as contact', () => {
		it.each([
			// Plain text without contact signals
			['job title only', '<p>Senior Software Engineer</p>'],
			['tagline', '<p>Experienced Product Manager</p>'],
			['summary sentence', '<p>Passionate about building great products.</p>'],
			// Skills list (looks like contact structure but no contact content)
			['skills list', '<p>React | Node.js | TypeScript | AWS</p>'],
			// Generic links without social domains
			[
				'portfolio link',
				'<p>See my work at <a href="https://portfolio.dev">portfolio.dev</a></p>',
			],
			// Summary with embedded link
			[
				'summary with link',
				'<p>I contribute to <a href="https://example.com/project">this project</a></p>',
			],
			// No links at all
			['location only', '<p>San Francisco, CA</p>'],
		])('%s', (_, html) => {
			const el = createElement(html)
			expect(isContactBlock(el)).toBe(false)
		})
	})

	describe('edge cases - mixed content', () => {
		it('wraps when contact segments equal content segments', () => {
			// "Manager" (content: -1) + "email" (contact: +1) = 0, should wrap
			const el = createElement(
				'<p>Manager | <a href="mailto:x@y.com">x@y.com</a></p>',
			)
			expect(isContactBlock(el)).toBe(true)
		})

		it('wraps when job title accompanies contact info', () => {
			// Job titles like "Senior Engineer at Google" should NOT trigger prose detection
			// since they commonly appear in contact lines
			const el = createElement(
				'<p>Senior Engineer at Google | <a href="mailto:x@y.com">x@y.com</a></p>',
			)
			expect(isContactBlock(el)).toBe(true)
		})

		it('does not wrap prose with embedded email mention', () => {
			// Single segment, no pipe separators, but has mailto
			// "Reach out at x@y.com to discuss" is one segment with contact signal
			// BUT the segment classifier needs to check the SEGMENT, not the whole HTML
			const el = createElement(
				'<p>Reach out at <a href="mailto:x@y.com">x@y.com</a> to discuss</p>',
			)
			// This is tricky - segment is "Reach out at x@y.com to discuss" which is content
			// but HTML has mailto: so it passes the gate
			// The segment doesn't match email pattern (has surrounding text)
			// so classifySegment returns -1
			// Total: -1, which is < 0, so NO wrap
			expect(isContactBlock(el)).toBe(false)
		})
	})

	describe('prose detection threshold', () => {
		it('does not penalize 3-word job titles like "Senior Software Developer"', () => {
			const el = createElement(
				'<p>Senior Software Developer | <a href="mailto:x@y.com">x@y.com</a></p>',
			)
			// 3 words should NOT trigger prose detection, so this should be contact
			expect(isContactBlock(el)).toBe(true)
		})

		it('does not penalize 4-word job titles', () => {
			const el = createElement(
				'<p>Lead Principal Software Engineer | <a href="mailto:x@y.com">x@y.com</a></p>',
			)
			expect(isContactBlock(el)).toBe(true)
		})

		it('does not penalize 5-word phrases', () => {
			const el = createElement(
				'<p>Senior Staff Software Engineer Lead | <a href="mailto:x@y.com">x@y.com</a></p>',
			)
			expect(isContactBlock(el)).toBe(true)
		})

		it('penalizes 6+ substantial word prose as content', () => {
			// "Passionate developer building scalable distributed systems daily" has 6 substantial words (>2 chars)
			const el = createElement(
				'<p>Passionate developer building scalable distributed systems daily | <a href="mailto:x@y.com">x@y.com</a></p>',
			)
			expect(isContactBlock(el)).toBe(false)
		})
	})
})

// =============================================================================
// Tests: classifyHeader - Address Wrapping
// =============================================================================

describe('classifyHeader - address wrapping', () => {
	describe('basic wrapping', () => {
		it('wraps contact blockquote in address element', () => {
			const html = `
				<header>
					<h1>John Doe</h1>
					<blockquote><a href="mailto:john@example.com">john@example.com</a> | <a href="https://linkedin.com/in/john">LinkedIn</a></blockquote>
				</header>
				<h2>Experience</h2>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const address = doc.querySelector('header address')
			expect(address).toBeTruthy()
			expect(address?.querySelector('a[href^="mailto:"]')).toBeTruthy()
		})

		it('wraps contact paragraph in address element', () => {
			const html = `
				<header>
					<h1>John Doe</h1>
					<p><a href="mailto:john@example.com">john@example.com</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('header address')).toBeTruthy()
			expect(doc.querySelector('header p')).toBeNull() // p should be replaced
		})

		it('preserves element attributes when wrapping', () => {
			const html = `
				<header>
					<h1>Name</h1>
					<p class="contact-info" id="main-contact"><a href="mailto:x@y.com">x@y.com</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const address = doc.querySelector('address')
			expect(address?.getAttribute('class')).toBe('contact-info')
			expect(address?.getAttribute('id')).toBe('main-contact')
		})
	})

	describe('non-wrapping cases', () => {
		it('does not wrap h1 element', () => {
			const html = `
				<header>
					<h1><a href="https://linkedin.com/in/john">John Doe</a></h1>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('header h1')).toBeTruthy()
			expect(doc.querySelector('header address')).toBeNull()
		})

		it('does not wrap summary paragraphs', () => {
			const html = `
				<header>
					<h1>John Doe</h1>
					<p>Experienced software engineer with 10 years of experience.</p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('header p')).toBeTruthy()
			expect(doc.querySelector('header address')).toBeNull()
		})

		it('does not wrap skills lists', () => {
			const html = `
				<header>
					<h1>John Doe</h1>
					<p>React | TypeScript | Node.js | AWS</p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('header p')).toBeTruthy()
			expect(doc.querySelector('header address')).toBeNull()
		})

		it('does not double-wrap existing address elements', () => {
			const html = `
				<header>
					<h1>Name</h1>
					<address><a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			// Should still have exactly one address, not nested
			expect(doc.querySelectorAll('address').length).toBe(1)
			expect(doc.querySelector('address address')).toBeNull()
		})
	})

	describe('without header element', () => {
		it('returns unchanged when no header exists', () => {
			const html = '<div><p>No header</p></div>'
			const result = classifyHeader(html, createContext())
			expect(result).toBe(html)
		})
	})

	describe('multiple elements', () => {
		it('wraps contact but not summary when both present', () => {
			const html = `
				<header>
					<h1>John Doe</h1>
					<p><a href="mailto:x@y.com">x@y.com</a> | <a href="https://linkedin.com/in/john">LinkedIn</a></p>
					<p>Passionate engineer seeking new opportunities.</p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('header address')).toBeTruthy()
			expect(doc.querySelector('header p')).toBeTruthy() // Summary preserved as p
			expect(doc.querySelectorAll('header > *').length).toBe(3) // h1, address, p
		})
	})

	describe('edge cases', () => {
		it('returns empty string unchanged', () => {
			expect(classifyHeader('', createContext())).toBe('')
		})

		it('returns whitespace-only unchanged', () => {
			const input = '   \n\t  '
			expect(classifyHeader(input, createContext())).toBe(input)
		})

		it('handles header with only h1', () => {
			const html = '<header><h1>John Doe</h1></header>'
			const result = classifyHeader(html, createContext())
			expect(result).toContain('<h1')
			expect(result).toContain('John Doe')
		})
	})

	describe('location-based merging', () => {
		it('detects "City, ST" format as location', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p><a href="mailto:x@y.com">x@y.com</a> | San Francisco, CA</p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)
			expect(doc.querySelector('header address')).toBeTruthy()
		})

		it('detects multi-word cities like Hong Kong via cities.json', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p>Hong Kong</p>
					<p><a href="mailto:x@y.com">x@y.com</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			// Both elements should be merged into one address
			expect(doc.querySelectorAll('header address').length).toBe(1)
			expect(doc.querySelector('header address')?.textContent).toContain(
				'Hong Kong',
			)
		})

		it('detects single-word cities like Singapore via cities.json', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p>Singapore</p>
					<p><a href="mailto:x@y.com">x@y.com</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelectorAll('header address').length).toBe(1)
			expect(doc.querySelector('header address')?.textContent).toContain(
				'Singapore',
			)
		})

		it('detects "Remote" as a location term', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p>Remote</p>
					<p><a href="mailto:x@y.com">x@y.com</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelectorAll('header address').length).toBe(1)
			expect(doc.querySelector('header address')?.textContent).toContain(
				'Remote',
			)
		})

		it('detects "Hybrid" as a location term', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p>Hybrid</p>
					<p><a href="mailto:x@y.com">x@y.com</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('header address')?.textContent).toContain(
				'Hybrid',
			)
		})

		it('does NOT classify "Java Developer" as location (false positive prevention)', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p>Java Developer</p>
					<p><a href="mailto:x@y.com">x@y.com</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			// "Java Developer" should NOT be merged - it should remain as p
			expect(doc.querySelector('header p')).toBeTruthy()
			expect(doc.querySelector('header p')?.textContent).toContain(
				'Java Developer',
			)
		})

		it('does NOT classify "Senior Software Engineer" as location', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p>Senior Software Engineer</p>
					<p><a href="mailto:x@y.com">x@y.com</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('header p')).toBeTruthy()
			expect(doc.querySelector('header p')?.textContent).toContain(
				'Senior Software Engineer',
			)
		})
	})

	describe('merging multiple contact elements', () => {
		it('merges consecutive contact elements into single address', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p><a href="tel:+15551234567">555-123-4567</a></p>
					<p><a href="mailto:x@y.com">x@y.com</a></p>
					<p><a href="https://linkedin.com/in/john">LinkedIn</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			// Should have exactly one address containing all contact info
			expect(doc.querySelectorAll('header address').length).toBe(1)
			const address = doc.querySelector('header address')
			expect(address?.querySelector('a[href^="tel:"]')).toBeTruthy()
			expect(address?.querySelector('a[href^="mailto:"]')).toBeTruthy()
			expect(address?.querySelector('a[href*="linkedin.com"]')).toBeTruthy()
		})

		it('preserves <p> structure when merging multiple contact elements', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p><a href="tel:+15551234567">555-123-4567</a></p>
					<p><a href="mailto:x@y.com">x@y.com</a></p>
					<p><a href="https://linkedin.com/in/john">LinkedIn</a></p>
					<p><a href="https://github.com/john">GitHub</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const address = doc.querySelector('header address')!
			// Each contact should remain in its own <p> inside the <address>
			const paragraphs = address.querySelectorAll('p')
			expect(paragraphs.length).toBe(4)
			expect(paragraphs[0]?.querySelector('a[href^="tel:"]')).toBeTruthy()
			expect(paragraphs[1]?.querySelector('a[href^="mailto:"]')).toBeTruthy()
			expect(
				paragraphs[2]?.querySelector('a[href*="linkedin.com"]'),
			).toBeTruthy()
			expect(paragraphs[3]?.querySelector('a[href*="github.com"]')).toBeTruthy()
		})

		it('includes adjacent location-only elements in merged address', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p>Tokyo</p>
					<p><a href="tel:+15551234567">555-123-4567</a></p>
					<p><a href="mailto:x@y.com">x@y.com</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelectorAll('header address').length).toBe(1)
			expect(doc.querySelector('header address')?.textContent).toContain(
				'Tokyo',
			)
		})

		it('does not merge non-adjacent elements', () => {
			const html = `
				<header>
					<h1>John</h1>
					<p><a href="mailto:x@y.com">x@y.com</a></p>
					<p>Experienced developer building great products for users.</p>
					<p><a href="https://linkedin.com/in/john">LinkedIn</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			// Should have two separate addresses since summary breaks the run
			expect(doc.querySelectorAll('header address').length).toBe(2)
		})
	})

	describe('social platform coverage', () => {
		it.each([
			['linkedin.com', 'https://linkedin.com/in/user'],
			['github.com', 'https://github.com/user'],
			['gitlab.com', 'https://gitlab.com/user'],
			['twitter.com', 'https://twitter.com/user'],
			['x.com', 'https://x.com/user'],
			['stackoverflow.com', 'https://stackoverflow.com/users/123'],
			['dribbble.com', 'https://dribbble.com/user'],
			['behance.net', 'https://behance.net/user'],
			['medium.com', 'https://medium.com/@user'],
			['dev.to', 'https://dev.to/user'],
			['codepen.io', 'https://codepen.io/user'],
			['bitbucket.org', 'https://bitbucket.org/user'],
		])('detects %s as contact', (domain, url) => {
			const html = `
				<header>
					<h1>Name</h1>
					<p><a href="${url}">${domain}</a></p>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('header address')).toBeTruthy()
		})
	})
})

// =============================================================================
// Tests: classifyHeader - Field Classification
// =============================================================================

describe('classifyHeader - field classification', () => {
	describe('name field', () => {
		it('adds data-field="name" to h1 in header', () => {
			const html = '<header><h1>John Doe</h1></header>'
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const h1 = doc.querySelector('h1')
			expect(h1?.getAttribute('data-field')).toBe('name')
		})

		it('preserves h1 content', () => {
			const html = '<header><h1>John Doe</h1></header>'
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('h1')?.textContent).toBe('John Doe')
		})
	})

	describe('email field', () => {
		it('adds data-field="email" to mailto links', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address><a href="mailto:john@example.com">john@example.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const emailLink = doc.querySelector('a[href^="mailto:"]')
			expect(emailLink?.getAttribute('data-field')).toBe('email')
		})
	})

	describe('phone field', () => {
		it('adds data-field="phone" to tel links', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address><a href="tel:+15551234567">555-123-4567</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const phoneLink = doc.querySelector('a[href^="tel:"]')
			expect(phoneLink?.getAttribute('data-field')).toBe('phone')
		})
	})

	describe('social profile fields', () => {
		it.each([
			['https://linkedin.com/in/johndoe', 'linkedin', 'johndoe'],
			['https://github.com/johndoe', 'github', 'johndoe'],
			['https://twitter.com/johndoe', 'x', 'johndoe'],
			['https://x.com/johndoe', 'x', 'johndoe'],
			['https://gitlab.com/johndoe', 'gitlab', 'johndoe'],
			[
				'https://stackoverflow.com/users/123/johndoe',
				'stackoverflow',
				'johndoe',
			],
			['https://dribbble.com/johndoe', 'dribbble', 'johndoe'],
			['https://behance.net/johndoe', 'behance', 'johndoe'],
			['https://medium.com/@johndoe', 'medium', 'johndoe'],
			['https://dev.to/johndoe', 'devto', 'johndoe'],
			['https://codepen.io/johndoe', 'codepen', 'johndoe'],
			['https://bitbucket.org/johndoe', 'bitbucket', 'johndoe'],
		])(
			'marks %s as profiles with network=%s and username=%s',
			(url, network, username) => {
				const html = `
				<header>
					<h1>John</h1>
					<address><a href="${url}">Profile</a></address>
				</header>
			`
				const result = classifyHeader(html, createContext())
				const doc = parseHtml(result)

				const link = doc.querySelector(`a[href="${url}"]`)
				expect(link?.getAttribute('data-field')).toBe('profiles')
				expect(link?.getAttribute('data-network')).toBe(network)
				expect(link?.getAttribute('data-username')).toBe(username)
			},
		)

		it('extracts username from YouTube channel URL', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address><a href="https://youtube.com/@johndoe">YouTube</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const link = doc.querySelector('a')
			expect(link?.getAttribute('data-network')).toBe('youtube')
			expect(link?.getAttribute('data-username')).toBe('johndoe')
		})
	})

	describe('url field', () => {
		it('adds data-field="url" to generic http links', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address><a href="https://johndoe.com">My Website</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const link = doc.querySelector('a[href="https://johndoe.com"]')
			expect(link?.getAttribute('data-field')).toBe('url')
		})

		it('does not override social profile detection', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address><a href="https://github.com/johndoe">GitHub</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const link = doc.querySelector('a')
			expect(link?.getAttribute('data-field')).toBe('profiles')
			expect(link?.getAttribute('data-network')).toBe('github')
		})
	})

	describe('multiple contacts', () => {
		it('classifies all contact types in one header', () => {
			const html = `
				<header>
					<h1>John Doe</h1>
					<address>
						<a href="tel:+15551234567">555-123-4567</a> |
						<a href="mailto:john@example.com">john@example.com</a> |
						<a href="https://linkedin.com/in/johndoe">LinkedIn</a> |
						<a href="https://github.com/johndoe">GitHub</a>
					</address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('h1')?.getAttribute('data-field')).toBe('name')
			expect(
				doc.querySelector('a[href^="tel:"]')?.getAttribute('data-field'),
			).toBe('phone')
			expect(
				doc.querySelector('a[href^="mailto:"]')?.getAttribute('data-field'),
			).toBe('email')

			const linkedinLink = doc.querySelector('a[href*="linkedin.com"]')
			expect(linkedinLink?.getAttribute('data-field')).toBe('profiles')
			expect(linkedinLink?.getAttribute('data-network')).toBe('linkedin')

			const githubLink = doc.querySelector('a[href*="github.com"]')
			expect(githubLink?.getAttribute('data-field')).toBe('profiles')
			expect(githubLink?.getAttribute('data-network')).toBe('github')
		})
	})

	describe('edge cases', () => {
		it('handles header without address', () => {
			const html = '<header><h1>John Doe</h1></header>'
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelector('h1')?.getAttribute('data-field')).toBe('name')
		})

		it('handles header without h1', () => {
			const html = `
				<header>
					<address><a href="mailto:john@example.com">Email</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			expect(
				doc.querySelector('a[href^="mailto:"]')?.getAttribute('data-field'),
			).toBe('email')
		})
	})

	describe('location field', () => {
		it('marks "City, ST" format as location', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address><a href="mailto:x@y.com">x@y.com</a> | San Francisco, CA</address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const locationSpan = doc.querySelector('[data-field="location"]')
			expect(locationSpan).toBeTruthy()
			expect(locationSpan?.textContent).toBe('San Francisco, CA')
		})

		it('marks multi-word cities like Hong Kong as location', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address>Hong Kong | <a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const locationSpan = doc.querySelector('[data-field="location"]')
			expect(locationSpan).toBeTruthy()
			expect(locationSpan?.textContent).toBe('Hong Kong')
		})

		it('marks single-word cities like Singapore as location', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address>Singapore | <a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const locationSpan = doc.querySelector('[data-field="location"]')
			expect(locationSpan).toBeTruthy()
			expect(locationSpan?.textContent).toBe('Singapore')
		})

		it('marks single-word cities like Tokyo as location', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address>Tokyo | <a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const locationSpan = doc.querySelector('[data-field="location"]')
			expect(locationSpan).toBeTruthy()
			expect(locationSpan?.textContent).toBe('Tokyo')
		})

		it('marks "Remote" as location', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address>Remote | <a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const locationSpan = doc.querySelector('[data-field="location"]')
			expect(locationSpan).toBeTruthy()
			expect(locationSpan?.textContent).toBe('Remote')
		})

		it('marks "Hybrid" as location', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address>Hybrid | <a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const locationSpan = doc.querySelector('[data-field="location"]')
			expect(locationSpan).toBeTruthy()
			expect(locationSpan?.textContent).toBe('Hybrid')
		})

		it('does NOT mark "Java Developer" as location (false positive prevention)', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address>Java Developer | <a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			// Should NOT have location for "Java Developer"
			const locationSpans = doc.querySelectorAll('[data-field="location"]')
			for (const span of Array.from(locationSpans)) {
				expect(span.textContent).not.toBe('Java Developer')
			}
		})

		it('does NOT mark "Senior Software Engineer" as location', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address>Senior Software Engineer | <a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const locationSpans = doc.querySelectorAll('[data-field="location"]')
			for (const span of Array.from(locationSpans)) {
				expect(span.textContent).not.toBe('Senior Software Engineer')
			}
		})
	})

	describe('summary field', () => {
		it('marks substantial text outside address as summary', () => {
			const html = `
				<header>
					<h1>John Doe</h1>
					<p>Experienced software engineer passionate about building great products.</p>
					<address><a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const summaryEl = doc.querySelector('[data-field="summary"]')
			expect(summaryEl).toBeTruthy()
			expect(summaryEl?.textContent).toContain('Experienced software engineer')
		})

		it('marks substantial unclassified text inside address as summary', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address>Passionate about building scalable systems | <a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			const summarySpan = doc.querySelector('[data-field="summary"]')
			expect(summarySpan).toBeTruthy()
			expect(summarySpan?.textContent).toContain('Passionate about building')
		})

		it('does not mark short text as summary', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address>Dev | <a href="mailto:x@y.com">x@y.com</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			// "Dev" is too short (< 10 chars) to be marked as summary
			const summarySpan = doc.querySelector('[data-field="summary"]')
			expect(summarySpan).toBeNull()
		})

		it('does not mark separators as summary', () => {
			const html = `
				<header>
					<h1>John</h1>
					<address><a href="mailto:x@y.com">x@y.com</a> | <a href="https://github.com/john">GitHub</a></address>
				</header>
			`
			const result = classifyHeader(html, createContext())
			const doc = parseHtml(result)

			// Separators should not be marked as summary
			const summarySpan = doc.querySelector('[data-field="summary"]')
			expect(summarySpan).toBeNull()
		})
	})
})
