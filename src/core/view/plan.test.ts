import { describe, it, expect } from 'vitest'
import { planRenders, type NamedView } from './plan.js'
import { resolveView } from './resolve.js'
import type { ResolvedView } from './types.js'

const BASE_VIEW: ResolvedView = resolveView([])
const OUTPUT = { dir: '/out', name: 'resume' }

describe('planRenders', () => {
	describe('viewName', () => {
		it('carries the named view name through to each plan', () => {
			const feView = resolveView([{ selects: ['frontend'] }])
			const namedViews: NamedView[] = [{ name: 'frontend', view: feView }]

			const plans = planRenders(namedViews, [], ['pdf'], OUTPUT)

			expect(plans[0]!.viewName).toBe('frontend')
		})

		it('is undefined when the named view has no name', () => {
			const namedViews: NamedView[] = [{ name: undefined, view: BASE_VIEW }]

			const plans = planRenders(namedViews, [], ['pdf'], OUTPUT)

			expect(plans[0]!.viewName).toBeUndefined()
		})

		it('is consistent across formats for the same named view', () => {
			const feView = resolveView([{ selects: ['frontend'] }])
			const namedViews: NamedView[] = [{ name: 'frontend', view: feView }]

			const plans = planRenders(namedViews, [], ['pdf', 'html'], OUTPUT)

			expect(plans[0]!.viewName).toBe('frontend')
			expect(plans[1]!.viewName).toBe('frontend')
		})
	})

	describe('no --for (base render)', () => {
		it('produces a single plan with no view suffix', () => {
			const namedViews: NamedView[] = [{ name: undefined, view: BASE_VIEW }]

			const plans = planRenders(namedViews, [], ['pdf'], OUTPUT)

			expect(plans).toHaveLength(1)
			expect(plans[0]!.outputPath).toBe('/out/resume.pdf')
			expect(plans[0]!.label).toBe('')
			expect(plans[0]!.view.selects).toBeNull()
		})

		it('produces one plan per format without view suffix', () => {
			const namedViews: NamedView[] = [{ name: undefined, view: BASE_VIEW }]

			const plans = planRenders(namedViews, [], ['pdf', 'html'], OUTPUT)

			expect(plans).toHaveLength(2)
			expect(plans[0]!.outputPath).toBe('/out/resume.pdf')
			expect(plans[1]!.outputPath).toBe('/out/resume.html')
		})
	})

	describe('--for with single tag', () => {
		it('includes the view name suffix even with a single named view', () => {
			const tagView = resolveView([{ selects: ['frontend'], pages: 1 }])
			const namedViews: NamedView[] = [{ name: 'frontend', view: tagView }]

			const plans = planRenders(namedViews, [], ['pdf'], OUTPUT)

			expect(plans).toHaveLength(1)
			expect(plans[0]!.outputPath).toBe('/out/resume-frontend.pdf')
			expect(plans[0]!.label).toBe('[frontend]')
			expect(plans[0]!.view.selects).toEqual(['frontend'])
			expect(plans[0]!.view.pages).toBe(1)
		})
	})

	describe('--for with multiple tags', () => {
		it('produces one plan per tag with view-name suffix', () => {
			const feView = resolveView([{ selects: ['frontend'] }])
			const beView = resolveView([{ selects: ['backend'], pages: 2 }])
			const namedViews: NamedView[] = [
				{ name: 'frontend', view: feView },
				{ name: 'backend', view: beView },
			]

			const plans = planRenders(namedViews, [], ['pdf'], OUTPUT)

			expect(plans).toHaveLength(2)
			expect(plans[0]!.outputPath).toBe('/out/resume-frontend.pdf')
			expect(plans[0]!.label).toBe('[frontend]')
			expect(plans[0]!.view.selects).toEqual(['frontend'])
			expect(plans[1]!.outputPath).toBe('/out/resume-backend.pdf')
			expect(plans[1]!.label).toBe('[backend]')
			expect(plans[1]!.view.pages).toBe(2)
		})

		it('each tag view carries its own resolved config', () => {
			const feView = resolveView([
				{ selects: ['frontend'], sections: { hide: ['publications'] } },
			])
			const beView = resolveView([
				{ selects: ['backend'], sections: { pin: ['skills'] } },
			])
			const namedViews: NamedView[] = [
				{ name: 'frontend', view: feView },
				{ name: 'backend', view: beView },
			]

			const plans = planRenders(namedViews, [], ['pdf'], OUTPUT)

			expect(plans[0]!.view.sections.hide).toEqual(['publications'])
			expect(plans[0]!.view.sections.pin).toEqual([])
			expect(plans[1]!.view.sections.hide).toEqual([])
			expect(plans[1]!.view.sections.pin).toEqual(['skills'])
		})
	})

	describe('lang dimension', () => {
		it('crosses named views with langs', () => {
			const feView = resolveView([{ selects: ['frontend'] }])
			const namedViews: NamedView[] = [{ name: 'frontend', view: feView }]

			const plans = planRenders(namedViews, ['en', 'fr'], ['pdf'], OUTPUT)

			expect(plans).toHaveLength(2)
			expect(plans[0]!.view.lang).toBe('en')
			expect(plans[1]!.view.lang).toBe('fr')
		})
	})

	describe('template output strategy', () => {
		it('expands view name into template', () => {
			const feView = resolveView([{ selects: ['frontend'] }])
			const namedViews: NamedView[] = [{ name: 'frontend', view: feView }]
			const tmpl = { template: '{view}/resume', cwd: '/proj' }

			const plans = planRenders(namedViews, [], ['pdf'], tmpl)

			expect(plans[0]!.outputPath).toBe('/proj/frontend/resume.pdf')
		})

		it('uses "default" for {view} when no view name is defined', () => {
			const namedViews: NamedView[] = [{ name: undefined, view: BASE_VIEW }]
			const tmpl = { template: 'out/{view}-resume', cwd: '/proj' }

			const plans = planRenders(namedViews, [], ['pdf'], tmpl)

			expect(plans[0]!.outputPath).toBe('/proj/out/default-resume.pdf')
		})

		it('uses "default" when {view} is the entire filename segment', () => {
			const feView = resolveView([{ selects: ['frontend'] }])
			const namedViews: NamedView[] = [
				{ name: undefined, view: BASE_VIEW },
				{ name: 'frontend', view: feView },
			]
			const tmpl = { template: '{format}/{view}', cwd: '/proj' }

			const plans = planRenders(namedViews, [], ['pdf'], tmpl)

			expect(plans).toHaveLength(2)
			expect(plans[0]!.outputPath).toBe('/proj/pdf/default.pdf')
			expect(plans[0]!.label).toBe('[default]')
			expect(plans[1]!.outputPath).toBe('/proj/pdf/frontend.pdf')
			expect(plans[1]!.label).toBe('[frontend]')
		})

		it('expands {format} into template for each format', () => {
			const namedViews: NamedView[] = [{ name: undefined, view: BASE_VIEW }]
			const tmpl = { template: 'out/{format}/resume', cwd: '/proj' }

			const plans = planRenders(namedViews, [], ['pdf', 'html'], tmpl)

			expect(plans).toHaveLength(2)
			expect(plans[0]!.outputPath).toBe('/proj/out/pdf/resume.pdf')
			expect(plans[1]!.outputPath).toBe('/proj/out/html/resume.html')
		})

		it('expands {format} in both directory and filename', () => {
			const namedViews: NamedView[] = [{ name: undefined, view: BASE_VIEW }]
			const tmpl = { template: '{format}/resume-{format}', cwd: '/proj' }

			const plans = planRenders(namedViews, [], ['pdf', 'html'], tmpl)

			expect(plans).toHaveLength(2)
			expect(plans[0]!.outputPath).toBe('/proj/pdf/resume-pdf.pdf')
			expect(plans[1]!.outputPath).toBe('/proj/html/resume-html.html')
		})

		it('combines {view} and {format} as extension-style suffix', () => {
			const feView = resolveView([{ selects: ['frontend'] }])
			const beView = resolveView([{ selects: ['backend'] }])
			const namedViews: NamedView[] = [
				{ name: 'frontend', view: feView },
				{ name: 'backend', view: beView },
			]
			const tmpl = { template: 'out/resume-{view}.{format}', cwd: '/proj' }

			const plans = planRenders(namedViews, [], ['pdf', 'html'], tmpl)

			expect(plans).toHaveLength(4)
			expect(plans[0]!.outputPath).toBe('/proj/out/resume-frontend.pdf')
			expect(plans[1]!.outputPath).toBe('/proj/out/resume-frontend.html')
			expect(plans[2]!.outputPath).toBe('/proj/out/resume-backend.pdf')
			expect(plans[3]!.outputPath).toBe('/proj/out/resume-backend.html')
		})
	})

	describe('templateDir output strategy', () => {
		it('expands {format} directory with auto-suffixed filename', () => {
			const feView = resolveView([{ selects: ['frontend'] }])
			const beView = resolveView([{ selects: ['backend'] }])
			const namedViews: NamedView[] = [
				{ name: 'frontend', view: feView },
				{ name: 'backend', view: beView },
			]
			const tmplDir = {
				templateDir: 'output/{format}',
				name: 'resume',
				cwd: '/proj',
			}

			const plans = planRenders(namedViews, [], ['pdf', 'html'], tmplDir)

			expect(plans).toHaveLength(4)
			expect(plans[0]!.outputPath).toBe('/proj/output/pdf/resume-frontend.pdf')
			expect(plans[1]!.outputPath).toBe(
				'/proj/output/html/resume-frontend.html',
			)
			expect(plans[2]!.outputPath).toBe('/proj/output/pdf/resume-backend.pdf')
			expect(plans[3]!.outputPath).toBe('/proj/output/html/resume-backend.html')
		})

		it('produces unsuffixed filename when no view name', () => {
			const namedViews: NamedView[] = [{ name: undefined, view: BASE_VIEW }]
			const tmplDir = {
				templateDir: 'output/{format}',
				name: 'resume',
				cwd: '/proj',
			}

			const plans = planRenders(namedViews, [], ['pdf', 'html'], tmplDir)

			expect(plans).toHaveLength(2)
			expect(plans[0]!.outputPath).toBe('/proj/output/pdf/resume.pdf')
			expect(plans[1]!.outputPath).toBe('/proj/output/html/resume.html')
		})

		it('adds lang suffix alongside view suffix', () => {
			const feView = resolveView([{ selects: ['frontend'] }])
			const namedViews: NamedView[] = [{ name: 'frontend', view: feView }]
			const tmplDir = {
				templateDir: 'output/{format}',
				name: 'resume',
				cwd: '/proj',
			}

			const plans = planRenders(namedViews, ['en', 'fr'], ['pdf'], tmplDir)

			expect(plans).toHaveLength(2)
			expect(plans[0]!.outputPath).toBe(
				'/proj/output/pdf/resume-frontend-en.pdf',
			)
			expect(plans[1]!.outputPath).toBe(
				'/proj/output/pdf/resume-frontend-fr.pdf',
			)
		})
	})
})
