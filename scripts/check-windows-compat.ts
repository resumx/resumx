/**
 * Reject filenames containing characters that are invalid on Windows.
 * Used as a lint-staged command: receives staged file paths as argv.
 */
const WINDOWS_INVALID = /[<>:"|?*]/

const violations = process.argv
	.slice(2)
	.filter(file =>
		file.split('/').some(segment => WINDOWS_INVALID.test(segment)),
	)

if (violations.length > 0) {
	console.error('Windows-incompatible filenames detected:')
	for (const f of violations) console.error(`  ${f}`)
	process.exit(1)
}
