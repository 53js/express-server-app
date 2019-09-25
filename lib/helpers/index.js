const parseCorsOriginWhitelist = (envCorsOriginWhitelist) => {
	if (envCorsOriginWhitelist === undefined) return '*';
	if (envCorsOriginWhitelist === '') return '';
	if (envCorsOriginWhitelist === 'false') return false;
	if (envCorsOriginWhitelist === 'true') return true;

	const corsOriginWhitelist = envCorsOriginWhitelist.split(',').filter(Boolean).map((v) => {
		v = v.trim();
		const isRegex = v.match(/^\/(.+)\/$/);
		if (isRegex) {
			const reg = isRegex[1];
			return new RegExp(reg);
		}
		return v;
	});

	return corsOriginWhitelist.length === 1 ? corsOriginWhitelist[0] : corsOriginWhitelist;
};

exports.parseCorsOriginWhitelist = parseCorsOriginWhitelist;
