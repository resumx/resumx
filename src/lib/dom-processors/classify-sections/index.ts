/**
 * Classify Sections Processor
 *
 * Adds data-section attribute to <section> elements based on their h2 heading text,
 * classified to JSON Resume section types (work, education, skills, etc.).
 *
 * This enables CSS selectors like section[data-section="work"] for styling,
 * regardless of the actual heading text ("Work Experience", "Employment History", etc.)
 */

import { parseHTML } from 'linkedom'
import type { PipelineContext } from '../types.js'
import { Classifier } from '../../classifier/index.js'

/**
 * Section types aligned with JSON Resume schema
 * @see https://jsonresume.org/schema
 */
export type SectionType =
	| 'basics' // summary, profile, objective, about
	| 'work' // experience, employment, career
	| 'volunteer' // volunteering, community service
	| 'education' // academic, degrees, schools
	| 'awards' // prizes, distinctions, scholarships
	| 'certificates' // certifications, licenses, training
	| 'publications' // papers, articles, books
	| 'skills' // competencies, expertise, abilities
	| 'languages' // spoken languages, fluency
	| 'interests' // hobbies, activities, pastimes
	| 'references' // recommendations, referees
	| 'projects' // portfolio, case studies

/**
 * Stop words for resume section heading classification
 */
const SECTION_STOP_WORDS = new Set([
	'of',
	'for',
	'my',
	'and',
	'or',
	'&',
	'the',
	'in',
	'to',
	'at',
	'by',
	'with',
	'as',
	'from',
	'up',
	'down',
	'out',
	'over',
	'under',
	'again',
	'further',
	'then',
	'all',
	'any',
	'some',
])

/**
 * Category keyword examples for section classification
 * Each section type maps to keywords that commonly appear in resume headings
 */
const SECTION_EXAMPLES: Record<SectionType, string[]> = {
	basics: [
		'summary',
		'overview',
		'profile',
		'objective',
		'statement',
		'goal',
		'bio',
		'intro',
		'about',
		'focus',
	],
	work: [
		'work',
		'experience',
		'employment',
		'career',
		'job',
		'role',
		'position',
		'appointment',
	],
	volunteer: [
		'volunteering',
		'volunteer',
		'charity',
		'service',
		'social',
		'unpaid',
		'community',
		'nonprofit',
	],
	education: [
		'education',
		'educational',
		'academic',
		'school',
		'college',
		'university',
		'degree',
		'study',
	],
	awards: [
		'award',
		'prize',
		'distinction',
		'scholarship',
		'laureate',
		'fellowship',
		'competition',
		'trophy',
		'honor',
	],
	certificates: [
		'certificate',
		'certification',
		'qualification',
		'credential',
		'license',
		'training',
		'course',
		'workshop',
	],
	publications: [
		'publication',
		'publish',
		'paper',
		'article',
		'journal',
		'book',
		'authorship',
		'written',
	],
	skills: [
		'skill',
		'competency',
		'expertise',
		'ability',
		'strength',
		'capability',
		'specialize',
		'knowledge',
	],
	languages: ['language', 'spoken', 'linguistic', 'multilingual'],
	interests: [
		'hobby',
		'interest',
		'activity',
		'pastime',
		'leisure',
		'passion',
		'extracurricular',
		'recreation',
	],
	references: [
		'reference',
		'recommendation',
		'referee',
		'endorsement',
		'testimonial',
		'recommender',
	],
	projects: ['project', 'portfolio', 'case', 'contribution'],
}

/**
 * Classifier instance for resume sections
 * Exported for testing and direct classification use
 */
export const sectionClassifier = new Classifier({
	examples: SECTION_EXAMPLES,
	preprocessor: {
		stopWords: SECTION_STOP_WORDS,
	},
})

/**
 * Add data-section attributes to section elements
 *
 * @param html - Input HTML string (after wrapSections processor)
 * @param _ctx - Pipeline context (unused by this processor)
 * @returns HTML with data-section attributes added
 */
export function classifySections(html: string, _ctx: PipelineContext): string {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!

	// Find all section elements
	const sections = Array.from(root.querySelectorAll('section'))

	for (const section of sections) {
		// Get the h2 text for classification
		const h2 = section.querySelector('h2')
		if (!h2) continue

		const headingText = h2.textContent?.trim()
		if (!headingText) continue

		// Classify and add attribute
		const sectionType = sectionClassifier.classify(headingText)
		section.setAttribute('data-section', sectionType)
	}

	return root.innerHTML
}
