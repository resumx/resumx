/**
 * Heuristic tightness test for page-fit.
 *
 * Starts with a resume that overflows 1 page, then removes one content
 * line at a time from the bottom. After each removal, fitToPages must
 * produce a single-page result with less than MAX_BLANK pixels of
 * unused space. If any step exceeds the threshold, the algorithm
 * needs fixing, not the threshold.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateHtml } from '../html-generator.js'
import { getBundledThemePath, DEFAULT_THEME } from '../themes.js'
import { fitToPages } from './index.js'
import { getContentHeight, readComputedValues } from './measure.js'
import { A4_HEIGHT_PX, A4_WIDTH_PX, IN_TO_PX } from './types.js'
import { browserPool } from '../browser-pool.js'

// ── Constants ──────────────────────────────────────────────────────────────

const REMOVALS = 30
const MAX_BLANK = 10 // px
const CSS_PATH = getBundledThemePath(DEFAULT_THEME)!
const TEMP_RESUME_MD = readFileSync(
	resolve(process.cwd(), 'tests/fixtures/page-fit-temp-resume.md'),
	'utf8',
).trim()

// ── Test resume ────────────────────────────────────────────────────────────
//
// Realistic resume with mixed content: headings, bullets, definition lists.
// Must overflow 1 page at default zurich theme settings (~1.3 pages).

const RESUME_MD = `
# Jordan Mitchell

jordan.mitchell@email.com | +1 555-234-5678 | linkedin.com/in/jordanmitchell | github.com/jordanmitchell

## Education

### Massachusetts Institute of Technology

_Bachelor of Science in Computer Science, Minor in Mathematics_

- Cumulative GPA: 3.89, Dean's List all semesters, Phi Beta Kappa Honor Society
- Relevant coursework: Distributed Systems, Machine Learning, Computer Networks, Database Systems
- Teaching Assistant for Introduction to Algorithms (6.006) for three consecutive semesters

## Work Experience

### Stripe

_Senior Software Engineer, Payments Infrastructure_

- Designed and implemented high-throughput payment processing pipeline handling 10M+ daily transactions
- Reduced payment processing latency by 45% through architectural redesign of the settlement engine
- Led migration of legacy monolith to event-driven microservices architecture serving 200+ internal clients
- Mentored team of 5 junior engineers through code reviews, pair programming, and technical design sessions
- Implemented comprehensive observability stack with distributed tracing, metrics dashboards, and alerting

### Dropbox

_Software Engineering Intern, Storage Platform_

- Built automated data integrity verification system scanning 500TB+ of distributed storage daily
- Developed internal CLI tool for storage cluster diagnostics adopted by 50+ engineers across the organization
- Optimized block deduplication algorithm reducing storage costs by 12% across production clusters
- Contributed to open-source sync engine improving conflict resolution for collaborative editing workflows

### Amazon Web Services

_Software Development Engineer Intern, EC2 Networking_

- Implemented network packet tracing tool for debugging VPC connectivity issues in production environments
- Created automated regression test suite covering 200+ network configuration edge cases
- Presented technical design review to senior leadership resulting in project adoption across three teams

### Palantir Technologies

_Software Engineering Intern, Forward Deployed Engineering_

- Developed data pipeline processing 2TB+ daily for government intelligence analytics platform
- Built interactive geospatial visualization dashboard using D3.js and MapboxGL for mission-critical operations
- Implemented role-based access control system with fine-grained permissions across 50+ data sources
- Reduced query response time by 70% through query optimization and materialized view strategies

## Projects

### DistributedKV: Fault-Tolerant Key-Value Store

- Built Raft consensus implementation in Go with automatic leader election and log replication
- Achieved 99.99% availability under network partition scenarios with linearizable read consistency
- Implemented snapshot-based compaction reducing log storage overhead by 80% in long-running clusters

### StreamQL: Real-Time Analytics Query Engine

- Developed streaming SQL engine processing 100K+ events per second with sub-millisecond latency
- Built custom query optimizer with cost-based join reordering and predicate pushdown optimizations
- Integrated with Apache Kafka and PostgreSQL for hybrid real-time and historical data analysis

### SecureChat: End-to-End Encrypted Messaging

- Implemented Signal Protocol with double ratchet algorithm for forward secrecy and post-compromise security
- Built cross-platform client with React Native supporting offline message queuing and group conversations
- Deployed on AWS with auto-scaling infrastructure handling 10K+ concurrent WebSocket connections

### PacketScope: Network Traffic Analyzer

- Built real-time packet capture and analysis tool processing 10Gbps traffic with BPF filters
- Implemented protocol dissectors for HTTP/2, gRPC, and WebSocket with automatic flow reconstruction
- Created anomaly detection engine using statistical models to identify network intrusions

## Technical Skills

Languages
: TypeScript, JavaScript, Python, Go, Java, Rust, SQL, GraphQL

Frameworks
: React, Node.js, Express.js, FastAPI, Spring Boot, Next.js, gRPC

Cloud and DevOps
: AWS, GCP, Docker, Kubernetes, Terraform, GitHub Actions, CircleCI

Databases
: PostgreSQL, MongoDB, Redis, DynamoDB, Elasticsearch, Apache Kafka

Testing and Observability
: Jest, Vitest, Playwright, Prometheus, Grafana, OpenTelemetry, Datadog

## Awards and Recognition

### Winner, MIT HackMIT Hackathon

- Built AI-powered accessibility tool generating alt text for web images using computer vision
- Awarded first place among 200+ teams for technical innovation and social impact

### Dean's Undergraduate Research Award

- Received funding for research on Byzantine fault-tolerant consensus in heterogeneous networks
- Published findings at ACM Symposium on Principles of Distributed Computing

`.trim()

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Remove `count` content lines from the bottom of the markdown.
 * Blank lines are skipped (removing them doesn't change content height).
 */
function removeContentLines(md: string, count: number): string {
	if (count === 0) return md
	const lines = md.split('\n')
	const contentIndices: number[] = []
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim() !== '') contentIndices.push(i)
	}
	const toRemove = new Set(contentIndices.slice(-count))
	return lines.filter((_, i) => !toRemove.has(i)).join('\n')
}

/**
 * Measure blank space (px) at the bottom of a fitted single-page resume.
 * Loads the HTML in a browser, reads content height and page margins,
 * then returns: usable page height - content height.
 */
async function measureBlank(html: string): Promise<number> {
	const browser = await browserPool.acquire()
	try {
		const page = await browser.newPage()
		try {
			await page.setViewportSize({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX })
			await page.setContent(html, { waitUntil: 'networkidle' })
			const contentHeight = await getContentHeight(page)
			const values = await readComputedValues(page)
			const capacity = A4_HEIGHT_PX - 2 * values['page-margin-y'] * IN_TO_PX
			return capacity - contentHeight
		} finally {
			await page.close()
		}
	} finally {
		browserPool.release(browser)
	}
}

// ── Test ────────────────────────────────────────────────────────────────────

describe('page-fit heuristic: tightness', () => {
	afterAll(async () => {
		await browserPool.closeAll()
	})

	it(
		'produces a tight fit as content is progressively removed',
		async () => {
			const results: { removal: number; blank: number }[] = []

			for (let i = 0; i < REMOVALS; i++) {
				const md = removeContentLines(RESUME_MD, i)
				const html = await generateHtml(md, { cssPath: CSS_PATH })
				const result = await fitToPages(html, 1)

				expect(result.finalPages).toBe(1)

				const blank = await measureBlank(result.html)
				results.push({ removal: i, blank })
			}

			// Log all results for debugging before asserting
			console.table(results)

			for (const { removal, blank } of results) {
				expect(
					blank,
					`removal ${removal}: blank ${blank.toFixed(1)}px exceeds ${MAX_BLANK}px`,
				).toBeLessThan(MAX_BLANK)
			}
		},
		{ timeout: 300_000 },
	)

	it(
		'produces a tight fit with Adrian Sterling resume',
		async () => {
			const ADRIAN_RESUME = `---
themes: [zurich]
pages: 1
style:
    font-size: 10pt
---

# Adrian Sterling

[+1 555-123-4567](tel:+15551234567) | <adrian.sterling@email.com> | [in/adriansterling](https://linkedin.com/in/adriansterling) | [adriansterling](https://github.com/adriansterling)

## Education{.text-blue-900}

### Stanford University <!----> Sept 2018 - June 2022

***Bachelor of Science in Computer Science, Summa Cum Laude***

- Cumulative GPA: 3.82 |  Dean's List (2019-2022) | Computer Science Excellence Award
- Advanced coursework: Distributed Systems, Advanced Algorithms, Compiler Design, Applied Cryptography
- President, Computer Science Student Association (2021-2025) — Led 200+ members, organized FAANG speaker series

## Work Experience

### ::google:: Google <!----> June 2022 - Present

_Senior Software Engineer, Infrastructure Platform Team_ <!----> San Francisco, CA

- Architected distributed microservices orchestration platform with ::devicon:kubernetes:: [Kubernetes]{.text-[#326ce5]} and ::skill-icons:docker:: [Docker]{.text-[#2396ed]}
- Reduced deployment latency by [60%]{.underline .decoration-dotted} across 50+ services Reduced deployment latency by [60%]{.underline .decoration-dotted} across 50+ services
- Led cloud-native migration on ::devicon:googlecloud:: [Google Cloud]{.text-[#557ebf]}, improving scalability [300%]{.underline .decoration-dotted} and saving [$2M]{.underline .decoration-dotted} annually
- Built CI/CD pipeline with Cloud Build, ::logos:terraform-icon:: [Terraform]{.text-[#4040b2]}, GitOps reducing release cycles to 2 days

### PwC [July 2021 - May 2022]{.float-right}

_Software Engineer, Core Infrastructure_ [San Francisco, CA]{.float-right}

- Built full-stack features for social platform (2B+ users) using [::mdi:react:: React]{.text-[#007ACC]}, ::skill-icons:expressjs-dark:: [Express.js]{text-[#242938]}, ::skill-icons:mongodb:: [MongoDB]{.text-[#023430]}
- Impacted 50M+ monthly active users
- Designed high-performance APIs with ::logos:nodejs-icon:: Node.js handling 1M+ QPS at 99.99% uptime
- Developed automated testing with ::logos:jestjs:: Jest and ::logos:cypress-icon:: Cypress, improving coverage from 45% to 85%

## Projects

### CloudTask: Distributed Task Management System _(Team of 4)_

- Built scalable task orchestration with \`React\`, \`FastAPI\`, \`PostgreSQL\`, \`Redis\`
- Implemented job scheduling with exactly-once processing semantics
- [Live Demo](https://cloudtask.example.com) | [GitHub](https://github.com/adriansterling/cloudtask) | [Demo Video](https://youtu.be/example123)

### AI Code Assistant _(Individual)_

- Implemented advanced AST analysis with 92% accuracy rate
- Published to Marketplace: 1,000+ installations, 4.8/5 rating, top trending 3 weeks
- [Marketplace](https://marketplace.visualstudio.com/items?itemName=adriansterling.ai-assistant) | [GitHub](https://github.com/adriansterling/ai-code-assistant)

### Advanced Weather Intelligence Platform _(Individual)_

[View Site](https://example.com){.after:content-['_↗'] .text-blue-600}

- Responsive design built with [::mdi:react:: **React**]{.text-sky-700} and [**Tailwind CSS**]{.text-sky-700}
- Implemented geolocation services with predictive analytics and \`Chart.js\` visualizations
- [Live Demo](https://weather.adriansterling.dev) | [GitHub](https://github.com/adriansterling/weather-dashboard)

## Competitions, Honors and Awards

### Winner — National Collegiate Hackathon [\\[Nov 2021\\]]{.float-right}

- Led team to build cross-platform \`React Native\` app with \`Firebase\` backend in 48-hour sprint
- Application adopted by 500+ users and featured in TechCrunch
- Application adopted by 500+ users and featured in TechCrunch

### Finalist — Google Code Jam [\\[Aug 2020\\]]{.float-right}

- Top 500 globally out of 30,000+ competitive programmers in algorithmic competition
- Solved complex NP-complete problems under time constraints

## Professional Certifications

### AWS Certified Solutions Architect – Associate — Amazon Web Services [\\[Mar 2023\\]]{.float-right}

### AWS Certified Developer – Associate — Amazon Web Services [\\[Jan 2023\\]]{.float-right}

## Technical Skills

Languages
: TypeScript, JavaScript, Python, Java, SQL, GraphQL, HTML/CSS

Frameworks
: React, Vue.js, Node.js, Express.js, FastAPI, Flask, Spring Boot, Next.js

Databases
: PostgreSQL, MongoDB, MySQL, Redis, DynamoDB

Cloud & DevOps
: AWS (EC2, S3, Lambda, RDS, ECS), Docker, Kubernetes, Terraform, GitHub Actions, CI/CD

Tools & Other
: Git, Linux, Nginx, WebSocket, REST APIs, Microservices, Jest, Cypress
`

			const results: {
				removal: number
				blank: number
				finalPages: number
				marginY?: string
			}[] = []

			for (let i = 0; i < REMOVALS; i++) {
				const md = removeContentLines(ADRIAN_RESUME, i)
				const html = await generateHtml(md, { cssPath: CSS_PATH })
				const result = await fitToPages(html, 1)

				if (result.finalPages === 1) {
					const blank = await measureBlank(result.html)
					results.push({
						removal: i,
						blank,
						finalPages: result.finalPages,
						marginY: result.adjustments['page-margin-y'],
					})
				} else {
					// Some removals are impossible to fit within one page.
					expect(result.finalPages).toBeGreaterThan(1)
					const marginY = result.adjustments['page-margin-y']
					if (marginY) {
						expect(parseFloat(marginY)).toBeLessThanOrEqual(0.6)
					}
					results.push({
						removal: i,
						blank: Number.NaN,
						finalPages: result.finalPages,
						marginY,
					})
				}
			}

			// Log all results for debugging before asserting
			console.table(results)

			for (const { removal, blank, finalPages } of results) {
				if (finalPages !== 1) continue
				expect(
					blank,
					`removal ${removal}: blank ${blank.toFixed(1)}px exceeds ${MAX_BLANK}px`,
				).toBeLessThan(MAX_BLANK)
			}
		},
		{ timeout: 300_000 },
	)

	it(
		'stays tight around one-line boundary for .temp/resume.md',
		async () => {
			const results: { removal: number; blank: number; finalPages: number }[] =
				[]
			for (let i = 0; i <= 15; i++) {
				const md = removeContentLines(TEMP_RESUME_MD, i)
				const html = await generateHtml(md, { cssPath: CSS_PATH })
				const result = await fitToPages(html, 1)
				if (result.finalPages === 1) {
					const blank = await measureBlank(result.html)
					results.push({ removal: i, blank, finalPages: result.finalPages })
				} else {
					results.push({
						removal: i,
						blank: Number.NaN,
						finalPages: result.finalPages,
					})
				}
			}
			console.table(results)
			const hasOverflow = results.some(r => r.finalPages > 1)
			const hasFit = results.some(r => r.finalPages === 1)
			expect(hasOverflow).toBe(true)
			expect(hasFit).toBe(true)
			for (const { removal, blank, finalPages } of results) {
				if (finalPages !== 1) continue
				expect(
					blank,
					`temp resume removal ${removal}: blank ${blank.toFixed(1)}px exceeds ${MAX_BLANK}px`,
				).toBeLessThan(MAX_BLANK)
			}
		},
		{ timeout: 120_000 },
	)
})
