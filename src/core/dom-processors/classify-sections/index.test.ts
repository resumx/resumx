import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { classifySections, sectionClassifier } from './index.js'
import type { PipelineContext } from '../types.js'

// Re-export classify function for easier testing
const classify = (text: string) => sectionClassifier.classify(text)

// =============================================================================
// Test Utilities
// =============================================================================

function parseHtml(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return {
		body: root,
		querySelector: (selector: string) => root.querySelector(selector),
		querySelectorAll: (selector: string) => root.querySelectorAll(selector),
	}
}

function createContext(): PipelineContext {
	return {
		config: {},
		env: { css: '' },
	}
}

// =============================================================================
// Tests: classifySections
// =============================================================================

describe('classifySections', () => {
	describe('basic classification', () => {
		it('adds data-section attribute to section elements', () => {
			const html =
				'<section id="work-experience"><h2>Work Experience</h2></section>'
			const result = classifySections(html, createContext())
			const doc = parseHtml(result)

			const section = doc.querySelector('section')
			expect(section).toBeTruthy()
			expect(section?.getAttribute('data-section')).toBe('work')
		})

		it('preserves original id attribute', () => {
			const html =
				'<section id="work-experience"><h2>Work Experience</h2></section>'
			const result = classifySections(html, createContext())
			const doc = parseHtml(result)

			const section = doc.querySelector('section')
			expect(section?.getAttribute('id')).toBe('work-experience')
			expect(section?.getAttribute('data-section')).toBe('work')
		})

		it('classifies multiple sections', () => {
			const html = `
				<section id="work-experience"><h2>Work Experience</h2></section>
				<section id="education"><h2>Education</h2></section>
				<section id="skills"><h2>Skills</h2></section>
			`
			const result = classifySections(html, createContext())
			const doc = parseHtml(result)

			const sections = doc.querySelectorAll('section')
			expect(sections.length).toBe(3)
			expect(sections[0].getAttribute('data-section')).toBe('work')
			expect(sections[1].getAttribute('data-section')).toBe('education')
			expect(sections[2].getAttribute('data-section')).toBe('skills')
		})
	})

	describe('section type mapping', () => {
		it.each([
			['Work Experience', 'work'],
			['Employment History', 'work'],
			['Professional Experience', 'work'],
			['Education', 'education'],
			['Academic Background', 'education'],
			['Skills', 'skills'],
			['Technical Skills', 'skills'],
			['Projects', 'projects'],
			['Portfolio', 'projects'],
			['Certifications', 'certificates'],
			['Awards', 'awards'],
			['Publications', 'publications'],
			['Languages', 'languages'],
			['Interests', 'interests'],
			['Hobbies', 'interests'],
			['References', 'references'],
			['Volunteering', 'volunteer'],
		])('classifies "%s" as %s', (heading, expectedType) => {
			const html = `<section><h2>${heading}</h2></section>`
			const result = classifySections(html, createContext())
			const doc = parseHtml(result)

			const section = doc.querySelector('section')
			expect(section?.getAttribute('data-section')).toBe(expectedType)
		})
	})

	describe('edge cases', () => {
		it('skips sections without h2', () => {
			const html = '<section id="no-heading"><p>Content</p></section>'
			const result = classifySections(html, createContext())
			const doc = parseHtml(result)

			const section = doc.querySelector('section')
			expect(section?.getAttribute('data-section')).toBeNull()
		})

		it('skips sections with empty h2', () => {
			const html = '<section><h2>   </h2></section>'
			const result = classifySections(html, createContext())
			const doc = parseHtml(result)

			const section = doc.querySelector('section')
			expect(section?.getAttribute('data-section')).toBeNull()
		})

		it('returns unchanged when no sections exist', () => {
			const html = '<div><p>Just content</p></div>'
			const result = classifySections(html, createContext())
			expect(result).toContain('Just content')
		})

		it('handles nested sections correctly', () => {
			const html = `
				<section id="work"><h2>Work</h2>
					<article class="entry"><h3>Job</h3></article>
				</section>
			`
			const result = classifySections(html, createContext())
			const doc = parseHtml(result)

			const section = doc.querySelector('section')
			expect(section?.getAttribute('data-section')).toBe('work')
		})
	})
})

// =============================================================================
// Tests: Section Classification (detailed regression tests)
// =============================================================================

describe('classify section headings', () => {
	describe('edge cases', () => {
		it('handles empty input', () => {
			const result = classify('')
			expect(typeof result).toBe('string')
		})

		it('handles mixed case', () => {
			expect(classify('WORK EXPERIENCE')).toBe('work')
			expect(classify('work experience')).toBe('work')
			expect(classify('Work Experience')).toBe('work')
		})

		it('handles special characters', () => {
			expect(classify('== Work Experience ==')).toBe('work')
			expect(classify('*** EDUCATION ***')).toBe('education')
			expect(classify('--Skills--')).toBe('skills')
		})
	})

	describe('basics section (summary/profile)', () => {
		it('classifies standard summary titles', () => {
			expect(classify('Summary')).toBe('basics')
			expect(classify('Professional Summary')).toBe('basics')
			expect(classify('Prof. Summary')).toBe('basics')
			expect(classify('Career Summary')).toBe('basics')
			expect(classify('Executive Summary')).toBe('basics')
			expect(classify('Overview')).toBe('basics')
			expect(classify('Profile')).toBe('basics')
		})

		it('classifies objective variations', () => {
			expect(classify('Career Objective')).toBe('basics')
			expect(classify('Objective')).toBe('basics')
			expect(classify('Professional Objective')).toBe('basics')
			expect(classify('Career Goal')).toBe('basics')
			expect(classify('Career Focus')).toBe('basics')
		})

		it('handles about me variations', () => {
			expect(classify('About Me')).toBe('basics')
			expect(classify('About')).toBe('basics')
			expect(classify('About Myself')).toBe('basics')
			expect(classify('Personal Bio')).toBe('basics')
			expect(classify('Introduction')).toBe('basics')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Bio')).toBe('basics')
			expect(classify('Sumary')).toBe('basics')
			expect(classify('Profesional Summary')).toBe('basics')
		})

		it('handles edge cases with extra text', () => {
			expect(classify('Brief Summary of My Qualifications')).toBe('basics')
			expect(classify('Short Introduction and Overview')).toBe('basics')
			expect(classify('My Professional Background Summary')).toBe('basics')
			expect(classify('Personal & Professional Summary')).toBe('basics')
		})
	})

	describe('work section', () => {
		it('classifies standard experience titles', () => {
			expect(classify('Experience')).toBe('work')
			expect(classify('Work Experience')).toBe('work')
			expect(classify('work experience')).toBe('work')
			expect(classify('Project Experience')).toBe('work')
			expect(classify('Professional Experience')).toBe('work')
			expect(classify('Employment History')).toBe('work')
			expect(classify('Work History')).toBe('work')
			expect(classify('Career History')).toBe('work')
			expect(classify('== Work Experience ==')).toBe('work')
			expect(classify('WORK EXPERIENCE')).toBe('work')
			expect(classify('Work Experience:')).toBe('work')
			expect(classify('My Professional Experience in the Industry')).toBe(
				'work',
			)
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Expereince')).toBe('work')
			expect(classify('Experiance')).toBe('work')
			expect(classify('Experence')).toBe('work')
			expect(classify('Work Experiance')).toBe('work')
		})

		it('handles variations with additional qualifiers', () => {
			expect(classify('Recent Work Experience')).toBe('work')
			expect(classify('Relevant Professional Experience')).toBe('work')
			expect(classify('Industry Experience')).toBe('work')
			expect(classify('Employment Timeline')).toBe('work')
			expect(classify('Job History')).toBe('work')
		})

		it('handles plural and singular forms', () => {
			expect(classify('Experiences')).toBe('work')
			expect(classify('Jobs')).toBe('work')
			expect(classify('Position')).toBe('work')
			expect(classify('Roles')).toBe('work')
		})

		it('handles professional appointments', () => {
			expect(classify('Appointments')).toBe('work')
			expect(classify('Professional Appointments')).toBe('work')
			expect(classify('Positions Held')).toBe('work')
			expect(classify('Previous Roles')).toBe('work')
		})
	})

	describe('education section', () => {
		it('classifies standard education titles', () => {
			expect(classify('Education')).toBe('education')
			expect(classify('Educational Background')).toBe('education')
			expect(classify('Academic Background')).toBe('education')
			expect(classify('Academic History')).toBe('education')
			expect(classify('Degrees')).toBe('education')
			expect(classify('Edu.')).toBe('education')
			expect(classify('EDUCATION')).toBe('education')
			expect(classify('*** EDUCATION ***')).toBe('education')
			expect(classify('EDUcation')).toBe('education')
			expect(classify('Academic Background and Achievements')).toBe('education')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Educaton')).toBe('education')
			expect(classify('Eduction')).toBe('education')
		})

		it('handles variations with institutions', () => {
			expect(classify('Schools Attended')).toBe('education')
			expect(classify('Universities')).toBe('education')
			expect(classify('College Education')).toBe('education')
			expect(classify('Academic Institutions')).toBe('education')
			expect(classify('Education History')).toBe('education')
		})

		it('handles plural form', () => {
			expect(classify('Educations')).toBe('education')
		})

		it('handles specific degree mentions', () => {
			expect(classify('Degrees Earned')).toBe('education')
			expect(classify('Academic Degrees')).toBe('education')
			expect(classify('Diplomas and Degrees')).toBe('education')
			expect(classify('Educational Qualifications')).toBe('education')
			expect(classify('Academic Achievements')).toBe('education')
			expect(classify('Education - Degrees')).toBe('education')
		})
	})

	describe('certificates section', () => {
		it('classifies standard certification titles', () => {
			expect(classify('Certifications')).toBe('certificates')
			expect(classify('Certificates')).toBe('certificates')
			expect(classify('Professional Certifications')).toBe('certificates')
			expect(classify('Credentials')).toBe('certificates')
			expect(classify('Licenses')).toBe('certificates')
			expect(classify('Cert')).toBe('certificates')
			expect(classify('Professional Training')).toBe('certificates')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Certs')).toBe('certificates')
			expect(classify('Certifcations')).toBe('certificates')
			expect(classify('Certificats')).toBe('certificates')
		})

		it('classifies course-related titles', () => {
			expect(classify('Courses')).toBe('certificates')
			expect(classify('Training')).toBe('certificates')
			expect(classify('Course Work')).toBe('certificates')
		})

		it('handles singular forms', () => {
			expect(classify('Certification')).toBe('certificates')
			expect(classify('License')).toBe('certificates')
			expect(classify('Course')).toBe('certificates')
		})

		it('handles specific certifications', () => {
			expect(classify('Technical Certifications')).toBe('certificates')
			expect(classify('Industry Certifications')).toBe('certificates')
			expect(classify('Professional Licenses')).toBe('certificates')
			expect(classify('Training Programs Completed')).toBe('certificates')
			expect(classify('Workshops Attended')).toBe('certificates')
		})
	})

	describe('skills section', () => {
		it('classifies standard skills titles', () => {
			expect(classify('Skills')).toBe('skills')
			expect(classify('Core Skills')).toBe('skills')
			expect(classify('Key Skills')).toBe('skills')
			expect(classify('Technical Skills')).toBe('skills')
			expect(classify('Professional Skills')).toBe('skills')
			expect(classify('professional Skills')).toBe('skills')
			expect(classify('Competencies')).toBe('skills')
			expect(classify('Skills And Abilities')).toBe('skills')
			expect(classify('Skills & Abilities')).toBe('skills')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Skils')).toBe('skills')
			expect(classify('Skillz')).toBe('skills')
		})

		it('handles expertise variations', () => {
			expect(classify('Areas of Expertise')).toBe('skills')
			expect(classify('Expertise')).toBe('skills')
			expect(classify('Specializations')).toBe('skills')
			expect(classify('Technical Expertise')).toBe('skills')
			expect(classify('Core Competencies')).toBe('skills')
			expect(classify('Specialties')).toBe('skills')
			expect(classify('--Skills--')).toBe('skills')
			expect(classify('Summary of Technical Skills and Knowledge')).toBe(
				'skills',
			)
		})

		it('handles singular form', () => {
			expect(classify('Skill')).toBe('skills')
			expect(classify('Capability')).toBe('skills')
			expect(classify('Competency')).toBe('skills')
		})

		it('handles industry-specific skills', () => {
			expect(classify('Technical Capabilities')).toBe('skills')
			expect(classify('Software Skills')).toBe('skills')
			expect(classify('Programming Skills')).toBe('skills')
			expect(classify('Design Competencies')).toBe('skills')
			expect(classify('Management Skills')).toBe('skills')
			expect(classify('Professional Abilities')).toBe('skills')
		})
	})

	describe('languages section', () => {
		it('classifies standard language titles', () => {
			expect(classify('Languages')).toBe('languages')
			expect(classify('Language Skills')).toBe('languages')
			expect(classify('Language Proficiency')).toBe('languages')
			expect(classify('Foreign Languages')).toBe('languages')
			expect(classify('Spoken Languages')).toBe('languages')
			expect(classify('Linguistic Skills')).toBe('languages')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Languges')).toBe('languages')
			expect(classify('Lang')).toBe('languages')
			expect(classify('Langauges')).toBe('languages')
		})

		it('handles singular form', () => {
			expect(classify('Language')).toBe('languages')
			expect(classify('Language Ability')).toBe('languages')
		})

		it('handles proficiency levels', () => {
			expect(classify('Language Fluency')).toBe('languages')
			expect(classify('Language Competencies')).toBe('languages')
			expect(classify('Linguistic Abilities')).toBe('languages')
			expect(classify('Languages Spoken & Written')).toBe('languages')
		})
	})

	describe('projects section', () => {
		it('classifies standard project titles', () => {
			expect(classify('Projects')).toBe('projects')
			expect(classify('Key Projects')).toBe('projects')
			expect(classify('Personal Projects')).toBe('projects')
			expect(classify('Professional Projects')).toBe('projects')
			expect(classify('Open Source Contributions')).toBe('projects')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Proj')).toBe('projects')
			expect(classify('Projcts')).toBe('projects')
			expect(classify('Projs')).toBe('projects')
			expect(classify('Projects (Selected)')).toBe('projects')
		})

		it('handles singular form', () => {
			expect(classify('Project')).toBe('projects')
			expect(classify('Project Portfolio')).toBe('projects')
		})

		it('handles portfolio variations', () => {
			expect(classify('Portfolio')).toBe('projects')
			expect(classify('Project Portfolio')).toBe('projects')
			expect(classify('Case Studies')).toBe('projects')
			expect(classify('Selected Projects')).toBe('projects')
			expect(classify('Project Highlights')).toBe('projects')
			expect(classify('Significant Projects')).toBe('projects')
		})

		it('handles field-specific projects', () => {
			expect(classify('Research Projects')).toBe('projects')
			expect(classify('Development Projects')).toBe('projects')
			expect(classify('Engineering Projects')).toBe('projects')
			expect(classify('Design Projects')).toBe('projects')
			expect(classify('Academic Projects')).toBe('projects')
			expect(classify('Client Projects')).toBe('projects')
		})
	})

	describe('interests section (hobbies)', () => {
		it('classifies standard hobby titles', () => {
			expect(classify('Hobbies')).toBe('interests')
			expect(classify('Interests')).toBe('interests')
			expect(classify('Personal Interests')).toBe('interests')
			expect(classify('Activities')).toBe('interests')
			expect(classify('Pastimes')).toBe('interests')
			expect(classify('Leisure Activities')).toBe('interests')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Hobies')).toBe('interests')
			expect(classify('Intrests')).toBe('interests')
		})

		it('handles singular form', () => {
			expect(classify('Hobby')).toBe('interests')
			expect(classify('Interest')).toBe('interests')
			expect(classify('Personal Activity')).toBe('interests')
		})

		it('handles extracurricular variations', () => {
			expect(classify('Extracurricular Activities')).toBe('interests')
			expect(classify('Outside Interests')).toBe('interests')
			expect(classify('Recreational Activities')).toBe('interests')
			expect(classify('Leisure')).toBe('interests')
		})
	})

	describe('references section', () => {
		it('classifies standard reference titles', () => {
			expect(classify('References')).toBe('references')
			expect(classify('Professional References')).toBe('references')
			expect(classify('Recommendations')).toBe('references')
			expect(classify('Referees')).toBe('references')
			expect(classify('Reference List')).toBe('references')
			expect(classify('Character References')).toBe('references')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Referances')).toBe('references')
			expect(classify('Refs')).toBe('references')
			expect(classify('Refernces')).toBe('references')
		})

		it('handles singular form', () => {
			expect(classify('Reference')).toBe('references')
			expect(classify('Referee')).toBe('references')
			expect(classify('Recommender')).toBe('references')
		})

		it('handles testimonial variations', () => {
			expect(classify('Testimonials')).toBe('references')
			expect(classify('Endorsements')).toBe('references')
			expect(classify('Letters of Recommendation')).toBe('references')
			expect(classify('References Available')).toBe('references')
			expect(classify('Recommendations & Testimonials')).toBe('references')
		})
	})

	describe('publications section', () => {
		it('classifies standard publication titles', () => {
			expect(classify('Publications')).toBe('publications')
			expect(classify('Published Work')).toBe('publications')
			expect(classify('Research Publications')).toBe('publications')
			expect(classify('Papers')).toBe('publications')
			expect(classify('Articles')).toBe('publications')
			expect(classify('Journals')).toBe('publications')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Pubs')).toBe('publications')
			expect(classify('Publcations')).toBe('publications')
		})

		it('handles singular form', () => {
			expect(classify('Publication')).toBe('publications')
			expect(classify('Published Paper')).toBe('publications')
			expect(classify('Research Article')).toBe('publications')
		})

		it('handles academic publication variations', () => {
			expect(classify('Research Papers')).toBe('publications')
			expect(classify('Published Articles')).toBe('publications')
			expect(classify('Journal Articles')).toBe('publications')
		})

		it('handles book and authorship titles', () => {
			expect(classify('Books')).toBe('publications')
			expect(classify('Authored Publications')).toBe('publications')
			expect(classify('Published Books')).toBe('publications')
			expect(classify('Written Works')).toBe('publications')
			expect(classify('Authorship')).toBe('publications')
		})
	})

	describe('volunteer section', () => {
		it('classifies standard volunteering titles', () => {
			expect(classify('Volunteering')).toBe('volunteer')
			expect(classify('Volunteer Experience')).toBe('volunteer')
			expect(classify('Community Service')).toBe('volunteer')
			expect(classify('Social Service')).toBe('volunteer')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Voluntering')).toBe('volunteer')
		})

		it('handles singular form', () => {
			expect(classify('Volunteer')).toBe('volunteer')
			expect(classify('Service Activity')).toBe('volunteer')
		})

		it('handles community involvement variations', () => {
			expect(classify('Community Involvement')).toBe('volunteer')
			expect(classify('Social Impact')).toBe('volunteer')
		})

		it('handles mentoring and advocacy', () => {
			expect(classify('Mentoring')).toBe('volunteer')
			expect(classify('Volunteer Mentorship')).toBe('volunteer')
			expect(classify('Community Advocacy')).toBe('volunteer')
			expect(classify('Service Learning')).toBe('volunteer')
		})
	})

	describe('awards section', () => {
		it('classifies standard award titles', () => {
			expect(classify('Awards')).toBe('awards')
			expect(classify('Prizes')).toBe('awards')
			expect(classify('Distinctions')).toBe('awards')
			expect(classify('Scholarships')).toBe('awards')
		})

		it('handles typos and abbreviations', () => {
			expect(classify('Awrds')).toBe('awards')
			expect(classify('Awds')).toBe('awards')
		})

		it('handles singular form', () => {
			expect(classify('Award')).toBe('awards')
			expect(classify('Prize')).toBe('awards')
			expect(classify('Honors')).toBe('awards')
		})

		it('handles grant and fellowship variations', () => {
			expect(classify('Fellowships')).toBe('awards')
			expect(classify('Grant Awards')).toBe('awards')
			expect(classify('Fellowship Awards')).toBe('awards')
			expect(classify('Funding Awards')).toBe('awards')
		})

		it('handles academic and competition recognitions', () => {
			expect(classify('Competitions Won')).toBe('awards')
			expect(classify('Trophies')).toBe('awards')
		})
	})
})
