/**
 * DOM Processor Pipeline Types
 *
 * Defines the context and processor interfaces for the HTML transformation pipeline.
 */

import type { SectionType } from '../../core/section-types.js'

export interface PipelineSectionsConfig {
	hide?: SectionType[]
	pin?: SectionType[]
}

/**
 * User configuration from CLI flags and frontmatter
 */
export interface PipelineConfig {
	/** Path to source markdown file */
	sourcePath?: string
	/** Output formats to generate */
	formats?: string[]
	/** Style name or path */
	style?: string
	/** CSS variable overrides */
	variables?: Record<string, string>
	/** Section hiding and pinning config */
	sections?: PipelineSectionsConfig
	/** Active tag for content filtering */
	activeTag?: string
	/** Tag composition map from frontmatter (composed tag name -> constituent tags) */
	tagMap?: Record<string, string[]>
	/** Active language for content filtering */
	activeLang?: string
	/** Available tags from content */
	tags?: string[]
}

/**
 * Context passed to each processor in the pipeline
 */
export interface PipelineContext {
	/** User configuration from CLI/frontmatter */
	config: PipelineConfig
}

/**
 * A DOM processor transforms HTML structurally
 */
export interface DOMProcessor {
	/** Processor name for debugging/logging */
	name: string
	/** Transform HTML using the pipeline context */
	process: (html: string, ctx: PipelineContext) => string
}
