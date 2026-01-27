import { describe, it, expect } from 'vitest'
import { resolveCssImports } from './css-resolver.js'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

type VirtualFileMap = Record<string, string>

function withTempDir<T>(fn: (dir: string) => T): T {
	const dir = mkdtempSync(join(tmpdir(), 'css-resolver-'))
	try {
		return fn(dir)
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
}

function writeVirtualFiles(baseDir: string, files: VirtualFileMap): void {
	for (const [relativePath, content] of Object.entries(files)) {
		const absolutePath = join(baseDir, relativePath)
		mkdirSync(dirname(absolutePath), { recursive: true })
		writeFileSync(absolutePath, content, 'utf-8')
	}
}

describe('resolveCssImports', () => {
	it('should resolve imports in a virtual directory structure', () => {
		withTempDir(dir => {
			const mainCSS =
				"@import './base.css';\n@import './reset.css';\n\n.main { padding: 1rem; }"
			const baseCSS = ':root { --color: blue; }'
			const resetCSS = 'body { margin: 0; }'

			writeVirtualFiles(dir, {
				'main.css': mainCSS,
				'base.css': baseCSS,
				'reset.css': resetCSS,
			})

			const result = resolveCssImports(join(dir, 'main.css'))

			expect(result).toBe(`${baseCSS}\n${resetCSS}\n\n.main { padding: 1rem; }`)
		})
	})

	it('should resolve single @import statement', () => {
		withTempDir(dir => {
			const baseCSS = 'body { margin: 0; }'
			const mainCSS = `@import './base.css';\n\nh1 { color: red; }`

			writeVirtualFiles(dir, {
				'main.css': mainCSS,
				'base.css': baseCSS,
			})

			const result = resolveCssImports(join(dir, 'main.css'))

			expect(result).toBe(`${baseCSS}\n\nh1 { color: red; }`)
		})
	})

	it('should resolve multiple @import statements', () => {
		withTempDir(dir => {
			const resetCSS = '* { box-sizing: border-box; }'
			const typographyCSS = 'body { font-family: sans-serif; }'
			const mainCSS = `
@import './reset.css';
@import './typography.css';

h1 { color: blue; }
`
			writeVirtualFiles(dir, {
				'main.css': mainCSS,
				'reset.css': resetCSS,
				'typography.css': typographyCSS,
			})

			const result = resolveCssImports(join(dir, 'main.css'))

			expect(result).toBe(
				`\n${resetCSS}\n${typographyCSS}\n\nh1 { color: blue; }\n`,
			)
		})
	})

	it('should handle nested imports recursively', () => {
		withTempDir(dir => {
			const colorsCSS = ':root { --primary: blue; }'
			const variablesCSS = `@import './colors.css';\n:root { --spacing: 1rem; }`
			const mainCSS = `@import './variables.css';\n\nbody { margin: 0; }`

			writeVirtualFiles(dir, {
				'main.css': mainCSS,
				'variables.css': variablesCSS,
				'colors.css': colorsCSS,
			})

			const result = resolveCssImports(join(dir, 'main.css'))

			expect(result).toBe(
				`${colorsCSS}\n:root { --spacing: 1rem; }\n\nbody { margin: 0; }`,
			)
		})
	})

	it('should resolve imports from subdirectories', () => {
		withTempDir(dir => {
			const iconsCSS = '.icon { display: inline-block; }'
			const mainCSS = `@import './common/icons.css';\n\nbody { margin: 0; }`

			writeVirtualFiles(dir, {
				'main.css': mainCSS,
				'common/icons.css': iconsCSS,
			})

			const result = resolveCssImports(join(dir, 'main.css'))

			expect(result).toBe(`${iconsCSS}\n\nbody { margin: 0; }`)
		})
	})

	it('should handle parent directory imports', () => {
		withTempDir(dir => {
			const sharedCSS = '.shared { color: gray; }'
			const nestedCSS = `@import '../shared.css';\n\n.nested { margin: 1rem; }`

			writeVirtualFiles(dir, {
				'nested/style.css': nestedCSS,
				'shared.css': sharedCSS,
			})

			const result = resolveCssImports(join(dir, 'nested/style.css'))

			expect(result).toBe(`${sharedCSS}\n\n.nested { margin: 1rem; }`)
		})
	})

	it('should handle both single and double quotes', () => {
		withTempDir(dir => {
			const file1CSS = '.file1 { color: red; }'
			const file2CSS = '.file2 { color: blue; }'
			const mainCSS = `@import './file1.css';\n@import "./file2.css";\n\nbody { margin: 0; }`

			writeVirtualFiles(dir, {
				'main.css': mainCSS,
				'file1.css': file1CSS,
				'file2.css': file2CSS,
			})

			const result = resolveCssImports(join(dir, 'main.css'))

			expect(result).toBe(`${file1CSS}\n${file2CSS}\n\nbody { margin: 0; }`)
		})
	})

	it('should detect and throw on circular imports', () => {
		withTempDir(dir => {
			const aCSS = `@import './b.css';\n.a { color: red; }`
			const bCSS = `@import './a.css';\n.b { color: blue; }`

			writeVirtualFiles(dir, {
				'a.css': aCSS,
				'b.css': bCSS,
			})

			expect(() => {
				resolveCssImports(join(dir, 'a.css'))
			}).toThrow(/Circular import detected/)
		})
	})

	it('should throw error for missing import file', () => {
		withTempDir(dir => {
			const mainCSS = `@import './nonexistent.css';\n\nbody { margin: 0; }`

			writeVirtualFiles(dir, {
				'main.css': mainCSS,
			})

			expect(() => {
				resolveCssImports(join(dir, 'main.css'))
			}).toThrow(/Failed to resolve import/)
			expect(() => {
				resolveCssImports(join(dir, 'main.css'))
			}).toThrow(/nonexistent\.css/)
		})
	})

	it('should throw error for missing main CSS file', () => {
		withTempDir(dir => {
			expect(() => {
				resolveCssImports(join(dir, 'nonexistent.css'))
			}).toThrow(/CSS file not found/)
		})
	})

	it('should skip URL imports (leave as-is)', () => {
		withTempDir(dir => {
			const mainCSS = `\
@import 'https://fonts.googleapis.com/css?family=Roboto';
@import "http://example.com/style.css";
@import '//cdn.example.com/reset.css';

body { margin: 0; }
`
			writeVirtualFiles(dir, {
				'main.css': mainCSS,
			})

			const result = resolveCssImports(join(dir, 'main.css'))

			// URL imports should remain unchanged
			expect(result).toBe(mainCSS)
		})
	})

	it('should preserve CSS comments', () => {
		withTempDir(dir => {
			const baseCSS = '/* Base styles */\nbody { margin: 0; }'
			const mainCSS = `/* Main styles */\n@import './base.css';\n\nh1 { color: red; }`

			writeVirtualFiles(dir, {
				'main.css': mainCSS,
				'base.css': baseCSS,
			})

			const result = resolveCssImports(join(dir, 'main.css'))

			expect(result).toBe(`/* Main styles */\n${baseCSS}\n\nh1 { color: red; }`)
		})
	})

	it('should handle empty CSS files', () => {
		withTempDir(dir => {
			const emptyCSS = ''
			const mainCSS = `@import './empty.css';\n\nbody { margin: 0; }`

			writeVirtualFiles(dir, {
				'main.css': mainCSS,
				'empty.css': emptyCSS,
			})

			const result = resolveCssImports(join(dir, 'main.css'))

			expect(result).toBe(`${emptyCSS}\n\nbody { margin: 0; }`)
		})
	})

	it('should handle imports with whitespace variations', () => {
		withTempDir(dir => {
			const baseCSS = 'body { margin: 0; }'
			const mainCSS = `\
@import './base.css';
@import   './base.css'  ;
@import './base.css';

h1 { color: red; }
`
			writeVirtualFiles(dir, {
				'main.css': mainCSS,
				'base.css': baseCSS,
			})

			const result = resolveCssImports(join(dir, 'main.css'))
			expect(result).toBe(
				`${baseCSS}\n${baseCSS}\n${baseCSS}\n\nh1 { color: red; }\n`,
			)
		})
	})
})
