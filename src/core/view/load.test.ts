import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { discoverViewFiles, loadViewFile, loadAllViews } from './load.js'

function withTempDir<T>(fn: (dir: string) => T): T {
	const dir = mkdtempSync(join(tmpdir(), 'view-load-test-'))
	try {
		return fn(dir)
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
}

describe('discoverViewFiles', () => {
	it('finds .view.yaml files in the base directory', () => {
		withTempDir(dir => {
			writeFileSync(join(dir, 'stripe.view.yaml'), 'stripe-swe: {}')
			writeFileSync(join(dir, 'resume.md'), '# Hi')

			const files = discoverViewFiles(dir)

			expect(files).toHaveLength(1)
			expect(files[0]).toContain('stripe.view.yaml')
		})
	})

	it('recursively finds nested .view.yaml files', () => {
		withTempDir(dir => {
			mkdirSync(join(dir, 'views', 'active'), { recursive: true })
			writeFileSync(join(dir, 'top.view.yaml'), 'top: {}')
			writeFileSync(
				join(dir, 'views', 'active', 'nested.view.yaml'),
				'nested: {}',
			)

			const files = discoverViewFiles(dir)

			expect(files).toHaveLength(2)
		})
	})

	it('returns empty array for non-existent directory', () => {
		expect(discoverViewFiles('/nonexistent')).toEqual([])
	})

	it('returns empty array when no .view.yaml files exist', () => {
		withTempDir(dir => {
			writeFileSync(join(dir, 'resume.md'), '# Hi')

			expect(discoverViewFiles(dir)).toEqual([])
		})
	})

	it('ignores non-.view.yaml files', () => {
		withTempDir(dir => {
			writeFileSync(join(dir, 'config.yaml'), 'key: value')
			writeFileSync(join(dir, 'views.yaml'), 'key: value')
			writeFileSync(join(dir, 'stripe.view.yaml'), 'stripe-swe: {}')

			const files = discoverViewFiles(dir)

			expect(files).toHaveLength(1)
			expect(files[0]).toContain('stripe.view.yaml')
		})
	})

	it('returns files in sorted order', () => {
		withTempDir(dir => {
			writeFileSync(join(dir, 'z.view.yaml'), 'z: {}')
			writeFileSync(join(dir, 'a.view.yaml'), 'a: {}')

			const files = discoverViewFiles(dir)

			expect(files[0]).toContain('a.view.yaml')
			expect(files[1]).toContain('z.view.yaml')
		})
	})
})

describe('loadViewFile', () => {
	it('loads a view file with multiple views', () => {
		withTempDir(dir => {
			const file = join(dir, 'stripe.view.yaml')
			writeFileSync(
				file,
				`stripe-swe:
  selects: [backend, distributed-systems]
  pages: 1
stripe-pm:
  selects: [frontend, leadership]
`,
			)

			const views = loadViewFile(file)

			expect(Object.keys(views)).toEqual(['stripe-swe', 'stripe-pm'])
			expect(views['stripe-swe']).toEqual({
				selects: ['backend', 'distributed-systems'],
				pages: 1,
			})
			expect(views['stripe-pm']).toEqual({
				selects: ['frontend', 'leadership'],
			})
		})
	})

	it('loads a view with all fields', () => {
		withTempDir(dir => {
			const file = join(dir, 'full.view.yaml')
			writeFileSync(
				file,
				`full:
  selects: [backend]
  sections:
    hide: [publications]
    pin: [skills, work]
  pages: 1
  bullet-order: tag
  vars:
    tagline: Stream Processing
  style:
    accent-color: '#2563eb'
  format: html
  output: ./dist/full
  css:
    - custom.css
`,
			)

			const views = loadViewFile(file)

			expect(views['full']).toEqual({
				selects: ['backend'],
				sections: { hide: ['publications'], pin: ['skills', 'work'] },
				pages: 1,
				bulletOrder: 'tag',
				vars: { tagline: 'Stream Processing' },
				style: { 'accent-color': '#2563eb' },
				format: 'html',
				output: './dist/full',
				css: ['custom.css'],
			})
		})
	})

	it('returns empty object for empty file', () => {
		withTempDir(dir => {
			const file = join(dir, 'empty.view.yaml')
			writeFileSync(file, '')

			expect(loadViewFile(file)).toEqual({})
		})
	})

	it('handles view with null value (no config)', () => {
		withTempDir(dir => {
			const file = join(dir, 'bare.view.yaml')
			writeFileSync(file, 'bare-view:\n')

			const views = loadViewFile(file)

			expect(views['bare-view']).toEqual({})
		})
	})

	it('handles view without selects (no content filter)', () => {
		withTempDir(dir => {
			const file = join(dir, 'no-selects.view.yaml')
			writeFileSync(
				file,
				`one-pager:
  sections:
    pin: [skills, work]
  pages: 1
`,
			)

			const views = loadViewFile(file)

			expect(views['one-pager']!.selects).toBeUndefined()
			expect(views['one-pager']!.pages).toBe(1)
		})
	})

	it('handles view with empty selects array', () => {
		withTempDir(dir => {
			const file = join(dir, 'untagged.view.yaml')
			writeFileSync(
				file,
				`generic:
  selects: []
  pages: 1
`,
			)

			const views = loadViewFile(file)

			expect(views['generic']!.selects).toEqual([])
		})
	})

	it('throws on invalid YAML syntax', () => {
		withTempDir(dir => {
			const file = join(dir, 'bad.view.yaml')
			writeFileSync(file, '{ invalid yaml: [')

			expect(() => loadViewFile(file)).toThrow(/Invalid YAML/)
		})
	})

	it('throws on non-object YAML (e.g. array)', () => {
		withTempDir(dir => {
			const file = join(dir, 'array.view.yaml')
			writeFileSync(file, '- item1\n- item2')

			expect(() => loadViewFile(file)).toThrow(/expected a YAML mapping/)
		})
	})

	it('throws on invalid view config with view name and file path', () => {
		withTempDir(dir => {
			const file = join(dir, 'bad-config.view.yaml')
			writeFileSync(
				file,
				`bad-view:
  pages: -1
`,
			)

			expect(() => loadViewFile(file)).toThrow(/Invalid view 'bad-view'/)
		})
	})

	it('handles single string selects (coerced to array)', () => {
		withTempDir(dir => {
			const file = join(dir, 'single.view.yaml')
			writeFileSync(
				file,
				`single:
  selects: backend
`,
			)

			const views = loadViewFile(file)

			expect(views['single']!.selects).toEqual(['backend'])
		})
	})

	it('handles single string css (coerced to array)', () => {
		withTempDir(dir => {
			const file = join(dir, 'css.view.yaml')
			writeFileSync(
				file,
				`styled:
  css: custom.css
`,
			)

			const views = loadViewFile(file)

			expect(views['styled']!.css).toEqual(['custom.css'])
		})
	})

	it('validates format enum values', () => {
		withTempDir(dir => {
			const file = join(dir, 'bad-format.view.yaml')
			writeFileSync(
				file,
				`bad:
  format: invalid
`,
			)

			expect(() => loadViewFile(file)).toThrow(/Invalid view 'bad'/)
		})
	})
})

describe('loadAllViews', () => {
	it('loads and merges views from multiple files', () => {
		withTempDir(dir => {
			writeFileSync(
				join(dir, 'stripe.view.yaml'),
				`stripe-swe:
  selects: [backend]
`,
			)
			writeFileSync(
				join(dir, 'netflix.view.yaml'),
				`netflix-fe:
  selects: [frontend]
`,
			)

			const views = loadAllViews(dir)

			expect(Object.keys(views).sort()).toEqual(['netflix-fe', 'stripe-swe'])
		})
	})

	it('throws on duplicate view names across files', () => {
		withTempDir(dir => {
			writeFileSync(
				join(dir, 'a.view.yaml'),
				`duplicate:
  selects: [backend]
`,
			)
			writeFileSync(
				join(dir, 'b.view.yaml'),
				`duplicate:
  selects: [frontend]
`,
			)

			expect(() => loadAllViews(dir)).toThrow(/Duplicate view name 'duplicate'/)
		})
	})

	it('returns empty object when no view files exist', () => {
		withTempDir(dir => {
			expect(loadAllViews(dir)).toEqual({})
		})
	})

	it('loads views from nested directories', () => {
		withTempDir(dir => {
			mkdirSync(join(dir, 'views'), { recursive: true })
			writeFileSync(
				join(dir, 'views', 'nested.view.yaml'),
				`nested-view:
  pages: 1
`,
			)

			const views = loadAllViews(dir)

			expect(views['nested-view']).toEqual({ pages: 1 })
		})
	})
})
