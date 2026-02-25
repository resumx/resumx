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
	/** Active target for content filtering */
	activeTarget?: string
	/** Target composition map from frontmatter (composed target name -> constituent targets) */
	targetMap?: Record<string, string[]>
	/** Active language for content filtering */
	activeLang?: string
	/** Available targets from content */
	targets?: string[]
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
