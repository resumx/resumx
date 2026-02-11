#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { renderCommand, type RenderCommandOptions } from './commands/render.js'
import { initCommand, type InitCommandOptions } from './commands/init.js'
import { ejectCommand, type EjectCommandOptions } from './commands/eject.js'
import { themeCommand, type ThemeCommandOptions } from './commands/theme.js'
import {
	validateCommand,
	type ValidateCommandOptions,
} from './commands/validate.js'

const program = new Command()

// Helper to strip ANSI codes for width calculation
function stripAnsi(str: string): string {
	return str.replace(/\u001b\[[0-9;]*m/g, '')
}

// Colorized help output
program.configureHelp({
	subcommandTerm: cmd => chalk.blue(cmd.name()),
	argumentTerm: arg => chalk.blue(`<${arg.name()}>`),
	optionTerm: option => {
		const flags = option.flags.split(', ')
		return flags
			.map(flag => {
				const parts = flag.split(/\s+/)
				const opt = parts[0]
				const arg = parts[1]
				return chalk.blue(opt) + (arg ? ' ' + chalk.dim(arg) : '')
			})
			.join(chalk.dim(', '))
	},
	formatHelp: (cmd, helper) => {
		// Calculate pad width using plain text (no ANSI codes)
		const plainTerms: string[] = []
		for (const arg of helper.visibleArguments(cmd)) {
			plainTerms.push(`<${arg.name()}>`)
		}
		for (const opt of helper.visibleOptions(cmd)) {
			plainTerms.push(opt.flags)
		}
		for (const sub of helper.visibleCommands(cmd)) {
			plainTerms.push(sub.name())
		}
		const termWidth = Math.max(...plainTerms.map(t => t.length), 0)
		const helpWidth = helper.helpWidth || 80
		const itemIndentWidth = 2
		const itemSeparatorWidth = 2

		function formatItem(term: string, description: string): string {
			// Calculate padding based on plain text width
			const plainTerm = stripAnsi(term)
			const padding = termWidth - plainTerm.length + itemSeparatorWidth
			const fullText = term + ' '.repeat(padding) + description
			return helper.wrap(
				fullText,
				helpWidth - itemIndentWidth,
				termWidth + itemSeparatorWidth,
			)
		}

		function formatList(textArray: string[]): string {
			return textArray.join('\n').replace(/^/gm, ' '.repeat(itemIndentWidth))
		}

		const output: string[] = []

		// Usage
		const usage = helper.commandUsage(cmd)
		output.push(chalk.bold.underline('Usage:') + ' ' + chalk.green(usage))
		output.push('')

		// Description
		const desc = helper.commandDescription(cmd)
		if (desc) {
			output.push(desc)
			output.push('')
		}

		// Arguments
		const args = helper.visibleArguments(cmd).map(arg => {
			return formatItem(
				helper.argumentTerm(arg),
				helper.argumentDescription(arg),
			)
		})
		if (args.length > 0) {
			output.push(chalk.bold.underline('Arguments:'))
			output.push(formatList(args))
			output.push('')
		}

		// Options
		const opts = helper.visibleOptions(cmd).map(opt => {
			return formatItem(helper.optionTerm(opt), helper.optionDescription(opt))
		})
		if (opts.length > 0) {
			output.push(chalk.bold.underline('Options:'))
			output.push(formatList(opts))
			output.push('')
		}

		// Commands
		const cmds = helper.visibleCommands(cmd).map(sub => {
			return formatItem(
				helper.subcommandTerm(sub),
				helper.subcommandDescription(sub),
			)
		})
		if (cmds.length > 0) {
			output.push(chalk.bold.underline('Commands:'))
			output.push(formatList(cmds))
			output.push('')
		}

		return output.join('\n')
	},
})

program
	.name('resumx')
	.description('Minimal markdown resume builder')
	.version('0.1.0')
	.allowExcessArguments(false)

// Default action: render
program
	.argument('[file]', 'Markdown file to render', 'resume.md')
	.option(
		'-t, --theme <name>',
		'Theme(s) to use (name or path, repeatable)',
		collectWithCommas,
		[],
	)
	.option('-o, --output <name>', 'Output filename (without extension)')
	.option(
		'--var <name=value>',
		'Override CSS variable (repeatable)',
		collect,
		[],
	)
	.option(
		'--role <name>',
		'Generate for specific role(s) only (repeatable)',
		collectWithCommas,
		[],
	)
	.option(
		'-f, --format <name>',
		'Output format(s): pdf, html, docx, png (repeatable, comma-separated)',
		collectWithCommas,
		[],
	)
	.option('-w, --watch', 'Watch for changes and rebuild')
	.action(async (file: string, options: RenderCommandOptions) => {
		// Don't run render if a subcommand was called
		await renderCommand(file, options)
	})

// init command
program
	.command('init [filename]')
	.description('Create a new resume from template (default: resume.md)')
	.option('--force', 'Overwrite existing file without prompting')
	.action(async (filename: string | undefined, options: InitCommandOptions) => {
		await initCommand(filename, options)
	})

// eject command
program
	.command('eject [theme]')
	.description('Copy a bundled theme to ./themes/ for customization')
	.option('--force', 'Overwrite existing local theme')
	.action(async (theme: string | undefined, options: EjectCommandOptions) => {
		await ejectCommand(theme, options)
	})

// theme command
program
	.command('theme [name]')
	.description('List themes, show theme info, or set defaults')
	.option('-d, --default <name>', 'Set the default theme')
	.option(
		'--set <name=value>',
		'Set default variable override for theme (repeatable)',
		collect,
		[],
	)
	.option('-r, --reset <variable>', 'Reset specific theme variable to default')
	.option('--reset-all', 'Reset all theme variable overrides to defaults')
	.action(async (name: string | undefined, options: ThemeCommandOptions) => {
		// Map 'set' to 'var' for the command handler
		if (options.set && options.set.length > 0) {
			options.var = options.set
		}
		await themeCommand(name, options)
	})

// validate command
program
	.command('validate [file]')
	.description('Validate resume structure and content')
	.option('--strict', 'Exit with error if any issues exist')
	.option(
		'--min-severity <level>',
		'Minimum severity to display (critical/warning/note/bonus)',
		'bonus',
	)
	.action(async (file: string | undefined, options: ValidateCommandOptions) => {
		await validateCommand(file ?? 'resume.md', options)
	})

// Helper to collect repeatable options (no comma splitting - for values that may contain commas)
function collect(value: string, previous: string[]): string[] {
	return previous.concat([value])
}

// Helper to collect repeatable options with comma-separated support (for theme/role)
function collectWithCommas(value: string, previous: string[]): string[] {
	const values = value
		.split(',')
		.map(v => v.trim())
		.filter(v => v.length > 0)
	return previous.concat(values)
}

// Show help when no arguments provided
if (process.argv.length === 2) {
	program.help()
}

program.parseAsync().catch((err: unknown) => {
	const message = err instanceof Error ? err.message : String(err)
	console.error(chalk.red(`error: ${message}`))
	process.exit(1)
})
