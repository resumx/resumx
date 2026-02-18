export default {
	plugins: [
		'removeXMLProcInst',
		'removeComments',
		'removeDoctype',
		{ name: 'inlineStyles', params: { onlyMatchedOnce: false } },
		'convertStyleToAttrs',
		'removeStyleElement',
		'removeDimensions',
	],
}
