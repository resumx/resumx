/**
 * DOM Processor Pipeline Types
 *
 * Defines the context and processor interfaces for the HTML transformation pipeline.
 */

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
	/** Active role for content filtering */
	activeRole?: string
	/** Available roles from content */
	roles?: string[]
}

/**
 * Derived environment values computed at runtime
 */
export interface PipelineEnv {
	/** Resolved CSS content */
	css: string
}

/**
 * Context passed to each processor in the pipeline
 */
export interface PipelineContext {
	/** User configuration from CLI/frontmatter */
	config: PipelineConfig
	/** Derived runtime environment */
	env: PipelineEnv
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
