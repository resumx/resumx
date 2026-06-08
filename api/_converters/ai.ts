import {
	generateText,
	type FilePart,
	type ModelMessage,
	type TextPart,
} from 'ai'

export type ConversionInput =
	| { kind: 'text'; text: string; label: string }
	| { kind: 'file'; buffer: Buffer; mimeType: string; label: string }

const NOT_A_RESUME_MESSAGE =
	'This document is not a resume. Please upload a resume.'

/** Thrown when the AI determines the document is not a resume. */
export class NotAResumeError extends Error {
	constructor(message: string = NOT_A_RESUME_MESSAGE) {
		super(message)
		this.name = 'NotAResumeError'
	}
}

const NOT_A_RESUME_PREFIX = 'NOT_A_RESUME'

const SYSTEM_PROMPT = `You convert resumes into Resumx Markdown. Output ONLY the Markdown, no explanations or code fences.

## When to refuse

If the document is clearly NOT a resume (e.g. recipe, article, blog post, cover letter, form letter, invoice, contract), do not convert it. Output exactly on the first line:
${NOT_A_RESUME_PREFIX}
Do not add any explanation or reason after it.

## Your job

Translate the FORMAT, not reorganize the CONTENT. Preserve the user's structure exactly:
- Keep their section order (if Work comes before Education, keep it that way)
- Keep their date format (don't normalize "January 2020" to "Jan 2020")
- Keep their entry ordering (if job title comes before company, preserve that)
- Keep their contact info style and delimiter
- Keep their bullet wording verbatim
- Keep their section names (don't rename "Professional Experience" to "Work Experience")

The only thing you change is the markup syntax.

## Resumx Markdown Syntax Reference

Frontmatter:
\`\`\`
---
pages: 1 or 2
---
\`\`\`

Set \`pages: 2\` when the resume has 5+ work entries, or 20+ bullet points, or clearly dense content that would overflow a single page. Otherwise use \`pages: 1\`.

Name (always H1):
\`# Full Name\`

Contact line (pipe-separated, links where appropriate):
\`[email](mailto:email) | [linkedin.com/in/user](https://linkedin.com/in/user) | Location\`

Section headings (H2):
\`## Section Name\`

Entries (H3 with \`||\` for right-aligned content like dates):
\`### Company Name || Jan 2020 - Present\`

Subtitles (italic with \`||\` for right-aligned content like location):
\`_Job Title_ || San Francisco, CA\`

Bullets:
\`- Achievement text\`

Skills as definition lists:
\`\`\`
Languages
: JavaScript, TypeScript, Python
\`\`\`

## Key syntax rules

- \`||\` splits a line into left/right columns. Use for dates, locations, or any right-aligned text.
- \`_text_\` for italic (roles, degrees). Use underscores, not asterisks.
- Links: \`[display](url)\`, email: \`[x@y.com](mailto:x@y.com)\`, phone: \`[num](tel:num)\`
- Always include \`pages\` in frontmatter. Choose 1 or 2 based on content density (see above).
`

function buildUserMessages(input: ConversionInput): ModelMessage[] {
	if (input.kind === 'text') {
		return [
			{
				role: 'user',
				content: `Convert this ${input.label} resume to Resumx Markdown:\n\n${input.text}`,
			},
		]
	}

	const content: Array<TextPart | FilePart> = [
		{
			type: 'text',
			text: `Convert this ${input.label} resume to Resumx Markdown:`,
		},
		{
			type: 'file',
			mediaType: input.mimeType,
			data: input.buffer,
			filename: 'resume.pdf',
		},
	]

	return [{ role: 'user', content }]
}

export async function convertWithAI(input: ConversionInput): Promise<string> {
	if (!process.env['AI_GATEWAY_API_KEY']) {
		throw new Error('AI_GATEWAY_API_KEY not configured')
	}

	const model =
		process.env['RESUME_TO_RESUMX_MARKDOWN_MODEL'] ?? 'google/gemini-3.5-flash'

	const { text } = await generateText({
		model,
		system: SYSTEM_PROMPT,
		messages: buildUserMessages(input),
		maxOutputTokens: 8192,
		providerOptions: {
			google: {
				thinkingConfig: {
					thinkingLevel: 'minimal',
				},
			},
		},
	})

	const trimmed = text
		.replace(/^```\w*\n/, '')
		.replace(/\n```$/, '')
		.trim()

	if (!trimmed) {
		throw new Error('AI returned empty response')
	}

	if (trimmed.toUpperCase().startsWith(NOT_A_RESUME_PREFIX)) {
		throw new NotAResumeError()
	}

	return trimmed
}
