export interface DocumentContext {
	content: string
	icons?: Record<string, string>
	tagMap?: Record<string, string[]>
	contentTags?: string[]
	baseDir: string
}
