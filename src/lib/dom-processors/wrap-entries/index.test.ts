import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { wrapEntries } from './index.js'
import type { PipelineContext } from '../types.js'

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Create a minimal pipeline context for testing
 */
function createContext(): PipelineContext {
	return {
		config: {},
		env: { css: '' },
	}
}

/**
 * Normalize HTML by removing whitespace-only text nodes for structural comparison
 */
function normalizeHtml(html: string): string {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!

	// Remove whitespace-only text nodes recursively
	function removeWhitespaceNodes(node: Node) {
		const children = Array.from(node.childNodes)
		for (const child of children) {
			if (child.nodeType === 3 && child.textContent?.trim() === '') {
				node.removeChild(child)
			} else if (child.nodeType === 1) {
				removeWhitespaceNodes(child)
			}
		}
	}
	removeWhitespaceNodes(root)

	return root.innerHTML
}

/**
 * Assert that actual HTML matches expected HTML structurally
 * (ignores whitespace differences)
 */
function expectStructure(actual: string, expected: string) {
	expect(normalizeHtml(actual)).toBe(normalizeHtml(expected))
}

/**
 * Helper to run wrapEntries with default context
 */
function wrap(html: string): string {
	return wrapEntries(html, createContext())
}

// =============================================================================
// Tests: wrapEntries
// =============================================================================

describe('wrapEntries', () => {
	describe('basic entry wrapping', () => {
		it('wraps h3 and following content in article element inside entries div', () => {
			const input = '<h3>Company Name</h3><p>Role details</p>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Company Name</h3>
						<p>Role details</p>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('wraps h3 with ul content', () => {
			const input = '<h3>Project Name</h3><ul><li>Feature</li></ul>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Project Name</h3>
						<ul><li>Feature</li></ul>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})
	})

	describe('multiple entries', () => {
		it('creates multiple articles for multiple h3s inside entries div', () => {
			const input =
				'<h3>Google</h3><p>Engineer</p><h3>Meta</h3><p>Developer</p>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Google</h3>
						<p>Engineer</p>
					</article>
					<article class="entry">
						<h3>Meta</h3>
						<p>Developer</p>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('maintains entry order matching h3 order', () => {
			const input =
				'<h3>First</h3><p>A</p><h3>Second</h3><p>B</p><h3>Third</h3><p>C</p>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>First</h3>
						<p>A</p>
					</article>
					<article class="entry">
						<h3>Second</h3>
						<p>B</p>
					</article>
					<article class="entry">
						<h3>Third</h3>
						<p>C</p>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})
	})

	describe('entry boundary detection', () => {
		it('stops entry at next h3', () => {
			const input = '<h3>Google</h3><p>Role 1</p><h3>Meta</h3><p>Role 2</p>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Google</h3>
						<p>Role 1</p>
					</article>
					<article class="entry">
						<h3>Meta</h3>
						<p>Role 2</p>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('stops entry at h2 element', () => {
			const input = '<h3>Entry</h3><p>Content</p><h2>New Section</h2>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Entry</h3>
						<p>Content</p>
					</article>
				</div>
				<h2>New Section</h2>
			`

			expectStructure(wrap(input), expected)
		})

		it('stops entry at hr element', () => {
			const input = '<h3>Entry</h3><p>Content</p><hr><h3>Another</h3>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Entry</h3>
						<p>Content</p>
					</article>
					<article class="entry">
						<h3>Another</h3>
					</article>
				</div>
				<hr>
			`

			expectStructure(wrap(input), expected)
		})
	})

	describe('section handling', () => {
		it('wraps entries inside section elements with entries div', () => {
			const input = `
				<section id="experience">
					<h2>Experience</h2>
					<h3>Google</h3><p>Engineer</p>
					<h3>Meta</h3><p>Developer</p>
				</section>
			`

			const expected = `
				<section id="experience">
					<h2>Experience</h2>
					<div class="entries">
						<article class="entry">
							<h3>Google</h3>
							<p>Engineer</p>
						</article>
						<article class="entry">
							<h3>Meta</h3>
							<p>Developer</p>
						</article>
					</div>
				</section>
			`

			expectStructure(wrap(input), expected)
		})

		it('handles multiple sections each with entries', () => {
			const input = `
				<section id="experience"><h2>Experience</h2><h3>Job</h3><p>Details</p></section>
				<section id="projects"><h2>Projects</h2><h3>Project</h3><p>Info</p></section>
			`

			const expected = `
				<section id="experience">
					<h2>Experience</h2>
					<div class="entries">
						<article class="entry">
							<h3>Job</h3>
							<p>Details</p>
						</article>
					</div>
				</section>
				<section id="projects">
					<h2>Projects</h2>
					<div class="entries">
						<article class="entry">
							<h3>Project</h3>
							<p>Info</p>
						</article>
					</div>
				</section>
			`

			expectStructure(wrap(input), expected)
		})
	})

	describe('element attribute preservation', () => {
		it('preserves classes on h3 elements', () => {
			const input =
				'<h3 class="text-blue-500 font-bold">Company</h3><p>Content</p>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3 class="text-blue-500 font-bold">Company</h3>
						<p>Content</p>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('preserves id on h3 elements', () => {
			const input = '<h3 id="custom-id">Entry</h3><p>Content</p>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3 id="custom-id">Entry</h3>
						<p>Content</p>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('preserves attributes on content elements', () => {
			const input =
				'<h3>Skills</h3><ul class="skill-list"><li data-level="5">Python</li></ul>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Skills</h3>
						<ul class="skill-list"><li data-level="5">Python</li></ul>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})
	})

	describe('complex entry content', () => {
		it('groups h3 with following p and ul', () => {
			const input = `
				<h3>Google</h3>
				<p><em>Senior Engineer</em></p>
				<ul>
					<li>Built systems</li>
					<li>Led team</li>
				</ul>
			`

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Google</h3>
						<p><em>Senior Engineer</em></p>
						<ul>
							<li>Built systems</li>
							<li>Led team</li>
						</ul>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('groups h3 with blockquote and list', () => {
			const input = `
				<h3>Project Name</h3>
				<blockquote><p>React, TypeScript</p></blockquote>
				<ul><li>Feature 1</li></ul>
			`

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Project Name</h3>
						<blockquote><p>React, TypeScript</p></blockquote>
						<ul><li>Feature 1</li></ul>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('handles deeply nested content within entries', () => {
			const input = `
				<h3>Entry</h3>
				<div class="container">
					<ul>
						<li><strong>Bold</strong> text</li>
						<li><span class="highlight">Span</span></li>
					</ul>
				</div>
			`

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Entry</h3>
						<div class="container">
							<ul>
								<li><strong>Bold</strong> text</li>
								<li><span class="highlight">Span</span></li>
							</ul>
						</div>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})
	})

	describe('edge cases', () => {
		it('handles empty content after h3', () => {
			const input = '<h3>Empty Entry</h3>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Empty Entry</h3>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('returns unchanged when no h3 exists', () => {
			const input = '<p>Just paragraphs</p><div>And divs</div>'

			const expected = '<p>Just paragraphs</p><div>And divs</div>'

			expectStructure(wrap(input), expected)
		})

		it('handles section with only h2 (no h3s)', () => {
			const input = `
				<section id="skills">
					<h2>Technical Skills</h2>
					<dl>
						<dt>Languages</dt>
						<dd>TypeScript, Python</dd>
					</dl>
				</section>
			`

			const expected = `
				<section id="skills">
					<h2>Technical Skills</h2>
					<dl>
						<dt>Languages</dt>
						<dd>TypeScript, Python</dd>
					</dl>
				</section>
			`

			expectStructure(wrap(input), expected)
		})

		it('does not wrap h3 inside header element', () => {
			const input = '<header><h3>Contact</h3></header><h3>Entry</h3>'

			const expected = `
				<header><h3>Contact</h3></header>
				<div class="entries">
					<article class="entry">
						<h3>Entry</h3>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('handles content with role classes', () => {
			const input =
				'<h3>Entry</h3><p class="role:frontend">Frontend work</p><p class="role:backend">Backend work</p>'

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Entry</h3>
						<p class="role:frontend">Frontend work</p>
						<p class="role:backend">Backend work</p>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})
	})

	describe('prose/summary content', () => {
		it('wraps h3 + prose paragraph + bullet list into one entry', () => {
			const input = `
				<h3>Google</h3>
				<p>Built scalable backend services for Google Cloud Platform.</p>
				<ul>
					<li>Led team of 5 engineers</li>
					<li>Improved system reliability by 40%</li>
				</ul>
			`

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Google</h3>
						<p>Built scalable backend services for Google Cloud Platform.</p>
						<ul>
							<li>Led team of 5 engineers</li>
							<li>Improved system reliability by 40%</li>
						</ul>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('wraps h3 + bullet list + prose after bullets into one entry', () => {
			const input = `
				<h3>Meta</h3>
				<ul>
					<li>Developed new features</li>
					<li>Reduced latency by 30%</li>
				</ul>
				<p>Key contributor to the infrastructure modernization initiative.</p>
			`

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Meta</h3>
						<ul>
							<li>Developed new features</li>
							<li>Reduced latency by 30%</li>
						</ul>
						<p>Key contributor to the infrastructure modernization initiative.</p>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('wraps h3 + multiple paragraphs + bullet list into one entry', () => {
			const input = `
				<h3>Startup Inc</h3>
				<p><em>Senior Engineer</em></p>
				<p>Joined as the second engineering hire and helped scale the platform.</p>
				<ul>
					<li>Designed microservice architecture</li>
					<li>Mentored junior developers</li>
				</ul>
			`

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>Startup Inc</h3>
						<p><em>Senior Engineer</em></p>
						<p>Joined as the second engineering hire and helped scale the platform.</p>
						<ul>
							<li>Designed microservice architecture</li>
							<li>Mentored junior developers</li>
						</ul>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('keeps prose in separate entries when separated by h3', () => {
			const input = `
				<h3>First Role</h3>
				<p>Summary of first role.</p>
				<ul><li>Achievement 1</li></ul>
				<h3>Second Role</h3>
				<p>Summary of second role.</p>
				<ul><li>Achievement 2</li></ul>
			`

			const expected = `
				<div class="entries">
					<article class="entry">
						<h3>First Role</h3>
						<p>Summary of first role.</p>
						<ul><li>Achievement 1</li></ul>
					</article>
					<article class="entry">
						<h3>Second Role</h3>
						<p>Summary of second role.</p>
						<ul><li>Achievement 2</li></ul>
					</article>
				</div>
			`

			expectStructure(wrap(input), expected)
		})
	})

	describe('container-agnostic wrapping', () => {
		it('wraps h3s inside a non-section container (div)', () => {
			const input = `
				<div class="custom-wrapper">
					<h3>Entry A</h3>
					<p>Details A</p>
					<h3>Entry B</h3>
					<p>Details B</p>
				</div>
			`

			const expected = `
				<div class="custom-wrapper">
					<div class="entries">
						<article class="entry">
							<h3>Entry A</h3>
							<p>Details A</p>
						</article>
						<article class="entry">
							<h3>Entry B</h3>
							<p>Details B</p>
						</article>
					</div>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('wraps h3s in different containers independently', () => {
			const input = `
				<div class="group-a">
					<h3>Entry A</h3>
					<p>Details A</p>
				</div>
				<div class="group-b">
					<h3>Entry B</h3>
					<p>Details B</p>
				</div>
			`

			const expected = `
				<div class="group-a">
					<div class="entries">
						<article class="entry">
							<h3>Entry A</h3>
							<p>Details A</p>
						</article>
					</div>
				</div>
				<div class="group-b">
					<div class="entries">
						<article class="entry">
							<h3>Entry B</h3>
							<p>Details B</p>
						</article>
					</div>
				</div>
			`

			expectStructure(wrap(input), expected)
		})

		it('wraps h3 nested inside intermediate element within a section (not a direct child)', () => {
			const input = `
				<section id="experience">
					<h2>Experience</h2>
					<div class="inner">
						<h3>Nested Entry</h3>
						<p>This h3 is not a direct child of the section</p>
					</div>
				</section>
			`

			const expected = `
				<section id="experience">
					<h2>Experience</h2>
					<div class="inner">
						<div class="entries">
							<article class="entry">
								<h3>Nested Entry</h3>
								<p>This h3 is not a direct child of the section</p>
							</article>
						</div>
					</div>
				</section>
			`

			expectStructure(wrap(input), expected)
		})

		it('wraps h3s inside blockquote container', () => {
			const input = `
				<blockquote>
					<h3>Quoted Entry</h3>
					<p>Content inside blockquote</p>
				</blockquote>
			`

			const expected = `
				<blockquote>
					<div class="entries">
						<article class="entry">
							<h3>Quoted Entry</h3>
							<p>Content inside blockquote</p>
						</article>
					</div>
				</blockquote>
			`

			expectStructure(wrap(input), expected)
		})

		it('wraps h3 inside deeply nested containers', () => {
			const input = `
				<section id="experience">
					<h2>Experience</h2>
					<div class="outer">
						<div class="inner">
							<h3>Deep Entry</h3>
							<p>Several levels deep</p>
							<ul><li>Still found</li></ul>
						</div>
					</div>
				</section>
			`

			const expected = `
				<section id="experience">
					<h2>Experience</h2>
					<div class="outer">
						<div class="inner">
							<div class="entries">
								<article class="entry">
									<h3>Deep Entry</h3>
									<p>Several levels deep</p>
									<ul><li>Still found</li></ul>
								</article>
							</div>
						</div>
					</div>
				</section>
			`

			expectStructure(wrap(input), expected)
		})
	})

	describe('real-world resume patterns', () => {
		it('handles work experience entry pattern', () => {
			const input = `
				<section id="work-experience">
					<h2>Work Experience</h2>
					<h3>Google <span class="float-right">2022 - Present</span></h3>
					<p><em>Senior Software Engineer</em> <span class="float-right">San Francisco, CA</span></p>
					<ul>
						<li>Built distributed systems</li>
						<li>Led team of 5 engineers</li>
					</ul>
					<h3>Meta <span class="float-right">2020 - 2022</span></h3>
					<p><em>Software Engineer</em></p>
					<ul>
						<li>Developed features</li>
					</ul>
				</section>
			`

			const expected = `
				<section id="work-experience">
					<h2>Work Experience</h2>
					<div class="entries">
						<article class="entry">
							<h3>Google <span class="float-right">2022 - Present</span></h3>
							<p><em>Senior Software Engineer</em> <span class="float-right">San Francisco, CA</span></p>
							<ul>
								<li>Built distributed systems</li>
								<li>Led team of 5 engineers</li>
							</ul>
						</article>
						<article class="entry">
							<h3>Meta <span class="float-right">2020 - 2022</span></h3>
							<p><em>Software Engineer</em></p>
							<ul>
								<li>Developed features</li>
							</ul>
						</article>
					</div>
				</section>
			`

			expectStructure(wrap(input), expected)
		})

		it('handles project entry pattern', () => {
			const input = `
				<section id="projects">
					<h2>Projects</h2>
					<h3>CloudTask <em>(Team of 4)</em></h3>
					<blockquote><p>React, FastAPI, PostgreSQL</p></blockquote>
					<ul>
						<li>Built scalable system</li>
						<li><a href="https://github.com/...">GitHub</a></li>
					</ul>
				</section>
			`

			const expected = `
				<section id="projects">
					<h2>Projects</h2>
					<div class="entries">
						<article class="entry">
							<h3>CloudTask <em>(Team of 4)</em></h3>
							<blockquote><p>React, FastAPI, PostgreSQL</p></blockquote>
							<ul>
								<li>Built scalable system</li>
								<li><a href="https://github.com/...">GitHub</a></li>
							</ul>
						</article>
					</div>
				</section>
			`

			expectStructure(wrap(input), expected)
		})

		it('handles certification entry pattern', () => {
			const input = `
				<section id="certifications">
					<h2>Certifications</h2>
					<h3>AWS Solutions Architect <span class="float-right">[Mar 2023]</span></h3>
					<h3>AWS Developer <span class="float-right">[Jan 2023]</span></h3>
				</section>
			`

			const expected = `
				<section id="certifications">
					<h2>Certifications</h2>
					<div class="entries">
						<article class="entry">
							<h3>AWS Solutions Architect <span class="float-right">[Mar 2023]</span></h3>
						</article>
						<article class="entry">
							<h3>AWS Developer <span class="float-right">[Jan 2023]</span></h3>
						</article>
					</div>
				</section>
			`

			expectStructure(wrap(input), expected)
		})
	})
})
