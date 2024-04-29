function asm(hljs) {
	return {
		case_insensitive: true,
		keywords: "section global extern db dd dq dw times resb resw resd resq",
		contains: [
			{
				scope: 'string',
				begin: '"', end: '"'
			},
			hljs.COMMENT(
				'/\\*',
				'\\*/',
			)
		]
	}
};

module.exports = asm;
