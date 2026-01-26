#!/usr/bin/env node

import { Command } from 'commander'
import { renderCommand, type RenderCommandOptions } from './commands/render.js'
import { initCommand, type InitCommandOptions } from './commands/init.js'
import { ejectCommand, type EjectCommandOptions } from './commands/eject.js'
import { styleCommand, type StyleCommandOptions } from './commands/style.js'

const program = new Command()

program
	.name('m8')
	.description('Minimal markdown resume builder')
	.version('0.1.0')
	.allowExcessArguments(false)

// Default action: render
program
	.argument('[file]', 'Markdown file to render', 'resume.md')
	.option('-s, --style <name>', 'Style to use (name or path)')
	.option('-o, --output <name>', 'Output filename (without extension)')
	.option(
		'--var <name=value>',
		'Override CSS variable (repeatable)',
		collect,
		[],
	)
	.option('--pdf', 'Output PDF only')
	.option('--html', 'Output HTML only')
	.option('--word', 'Output Word document only')
	.option('--all', 'Output all formats (PDF, HTML, Word)')
	.option('-w, --watch', 'Watch for changes and rebuild')
	.action(async (file: string, options: RenderCommandOptions) => {
		// Don't run render if a subcommand was called
		await renderCommand(file, options)
	})

// init command
program
	.command('init [filename]')
	.description('Create a new resume from template (default: resume.md)')
	.option('-f, --force', 'Overwrite existing file without prompting')
	.action(async (filename: string | undefined, options: InitCommandOptions) => {
		await initCommand(filename, options)
	})

// eject command
program
	.command('eject [style]')
	.description('Copy a bundled style to ./styles/ for customization')
	.option('-f, --force', 'Overwrite existing local style')
	.action(async (style: string | undefined, options: EjectCommandOptions) => {
		await ejectCommand(style, options)
	})

// style command
program
	.command('style [name]')
	.description('List styles, show style info, or set defaults')
	.option('-d, --default <name>', 'Set the default style')
	.option(
		'--set <name=value>',
		'Set default variable override for style (repeatable)',
		collect,
		[],
	)
	.option('-r, --reset <variable>', 'Reset specific style variable to default')
	.option('--reset-all', 'Reset all style variable overrides to defaults')
	.action(async (name: string | undefined, options: StyleCommandOptions) => {
		// Map 'set' to 'var' for the command handler
		if (options.set && options.set.length > 0) {
			options.var = options.set
		}
		await styleCommand(name, options)
	})

// Helper to collect repeatable options
function collect(value: string, previous: string[]): string[] {
	return previous.concat([value])
}

// Show help when no arguments provided
if (process.argv.length === 2) {
	program.help()
}

program.parse()
