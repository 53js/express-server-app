const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cliPath = path.resolve(__dirname, '../../bin/express-server-app.js');

describe('express-server-app CLI', () => {
	it('should print usage for unknown commands instead of crashing', () => {
		const res = spawnSync(process.execPath, [cliPath, 'nope'], {
			encoding: 'utf8',
		});

		expect(res.status).toBe(1);
		expect(res.stderr).toContain('Unknown command: nope');
		expect(res.stderr).toContain('Usage: express-server-app <debug|dist|start|test> [args...]');
		expect(res.stderr).not.toContain('TypeError');
	});

	it('should pass dist arguments without shell injection', () => {
		const res = spawnSync(process.execPath, [cliPath, 'dist', '; printf injected'], {
			encoding: 'utf8',
		});

		expect(res.status).not.toBe(0);
		expect(res.stdout).not.toContain('injected');
		expect(res.stderr).not.toContain('injected');
	});
});
