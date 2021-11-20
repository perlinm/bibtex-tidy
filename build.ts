import { version } from './package.json';
import { writeFile, mkdir, chmod, readFile } from 'fs/promises';
import { join } from 'path';
import esbuild from 'esbuild';
import { transform as babel } from '@babel/core';
import { optionDefinitions } from './src/optionDefinitions';
import { wrapText } from './src/utils';

const SRC_PATH = join(__dirname, 'src');
const BUILD_PATH = join(SRC_PATH, '__generated__');
const WEB_PATH = join(__dirname, 'docs');
const CLI_BIN = join(__dirname, 'bin', 'bibtex-tidy');

const MANPAGE_LINE_WIDTH = 84;
const MANPAGE_LEFT_COLUMN_WIDTH = 27;

// For BigInt support:
// * No IE version supports BigInt
// * Edge 79+
// * Firefox 68+
// * Safari 14+
// * Chrome 67+
// All tested on browserstack. Bibtext tidy looks and works correctly.

const BROWSER_TARGETS = {
	edge: '79',
	firefox: '68',
	chrome: '67',
	safari: '14',
};

const NODE_TARGET = ['node12'];

const banner = `/**
 * bibtex-tidy v${version}
 * https://github.com/FlamingTempura/bibtex-tidy
 *
 * DO NOT EDIT THIS FILE. This file is automatically generated
 * using \`npm run build\`. Edit files in './src' then rebuild.
 **/
`;

async function generateOptionTypes() {
	const { outputFiles } = await esbuild.build({
		entryPoints: [join(SRC_PATH, 'optionDefinitions.ts')],
		write: false,
		format: 'esm',
	});
	const bundle = new TextDecoder().decode(outputFiles[0].contents);
	// Bundle creates an export which eval doesn't know what to do with. Assign to
	// var instead.
	const options = eval(bundle.replace(/^export/m, 'const res = ') + '; res');

	const ts = [];

	ts.push(banner);
	ts.push('export type BibTeXTidyOptions = {');
	for (const opt of options.optionDefinitions) {
		ts.push('\t/**');
		ts.push(`\t * ${opt.title}`);
		if (opt.description) {
			ts.push('\t *');
			for (const line of opt.description) {
				ts.push(`\t * ${line}`);
			}
		}
		ts.push('\t */');
		ts.push(`\t${opt.key}?: ${opt.type};`);
	}
	ts.push('};');
	ts.push('');

	await writeFile(join(BUILD_PATH, 'optionsType.ts'), ts.join('\n'));
}

async function generateVersionFile() {
	await writeFile(
		join(BUILD_PATH, 'version.ts'),
		`export const version = "${version}";`
	);
}

async function generateManPage() {
	const manPage: string[] = [];
	manPage.push(`Usage: bibtex-tidy [OPTION]... FILE.BIB`);
	manPage.push(
		`BibTeX Tidy v${version} - cleaner and formatter for BibTeX files.\n`
	);
	manPage.push('Options:');

	for (const opt of optionDefinitions) {
		if (opt.deprecated) continue;

		const left = wrapText(
			Object.keys(opt.cli).join(', '),
			MANPAGE_LEFT_COLUMN_WIDTH - 2
		);

		const leftColumn: string[] = left.map((line) => `  ${line}`);

		const desc: string[] = [];
		if (opt.description) {
			desc.push(...opt.description);
		}
		if (opt.examples && opt.examples.length > 0) {
			desc.push('Examples:', ...opt.examples.filter((example) => example));
		}

		const rightColumn = desc.flatMap((line) =>
			wrapText(line, MANPAGE_LINE_WIDTH - MANPAGE_LEFT_COLUMN_WIDTH)
		);

		for (let i = 0; i < Math.max(rightColumn.length, leftColumn.length); i++) {
			manPage.push(
				(
					(leftColumn[i] ?? '').padEnd(MANPAGE_LEFT_COLUMN_WIDTH) +
					(rightColumn[i] ?? '')
				).trimEnd()
			);
		}

		manPage.push('');
	}
	manPage.push(
		'Full documentation <https://github.com/FlamingTempura/bibtex-tidy>'
	);

	await writeFile(
		join(BUILD_PATH, 'manPage.ts'),
		banner + `export const manPage = ${JSON.stringify(manPage, null, '\t')};`
	);

	await writeFile('bibtex-tidy.0', manPage.join('\n'));

	const readme = await readFile(join(__dirname, 'README.md'), 'utf8');
	await writeFile(
		join(__dirname, 'README.md'),
		readme.replace(
			/```manpage.*?```/s,
			'```manpage\n' + manPage.join('\n') + '\n```'
		)
	);
}

async function buildJSBundle() {
	console.time('JS bundle built');
	const { outputFiles } = esbuild.buildSync({
		entryPoints: ['./src/index.ts'],
		bundle: true,
		write: false,
		format: 'esm',
		banner: { js: banner },
	});
	const bundle = outputFiles[0];
	const result = babel(bundle.text, {
		presets: [['@babel/env', { targets: BROWSER_TARGETS }]],
		compact: false,
	});
	if (!result?.code) throw new Error('Expected babel output');
	await writeFile(
		'bibtex-tidy.js',
		result.code + `\nmodule.exports = exports.default;`
	);
	console.timeEnd('JS bundle built');
}

import { generateDtsBundle } from 'dts-bundle-generator';

async function buildTypeDeclarations() {
	console.time('Type declarations');
	const typeFiles = generateDtsBundle([{ filePath: './src/index.ts' }]);
	await writeFile('bibtex-tidy.d.ts', typeFiles[0]);
	console.timeEnd('Type declarations');
}

async function buildCLI() {
	console.time('CLI built');
	await esbuild.build({
		bundle: true,
		platform: 'node',
		banner: { js: '#!/usr/bin/env node\n' + banner },
		outfile: CLI_BIN,
		target: NODE_TARGET,
		entryPoints: [join(SRC_PATH, 'cli.ts')],
	});
	await chmod(CLI_BIN, 0o755); // rwxr-xr-x
	console.timeEnd('CLI built');
}

async function buildWebBundle() {
	console.time('Web bundle built');
	const { outputFiles } = await esbuild.build({
		platform: 'browser',
		entryPoints: ['./docs/index.ts'],
		bundle: true,
		write: false,
		banner: { js: banner },
	});
	const bundle = outputFiles[0];
	const result = babel(bundle.text, {
		presets: [['@babel/env', { targets: BROWSER_TARGETS }]],
		compact: false,
	});
	if (!result?.code) throw new Error('Expected babel output');
	await writeFile(join(WEB_PATH, 'bundle.js'), result.code);
	console.timeEnd('Web bundle built');
}

mkdir(BUILD_PATH, { recursive: true })
	.then(() =>
		Promise.all([
			generateOptionTypes(),
			generateVersionFile(),
			generateManPage(),
		])
	)
	.then(() =>
		Promise.all([
			!process.argv.includes('--no-defs') ? buildTypeDeclarations() : undefined,
			buildJSBundle(),
			buildCLI(),
			buildWebBundle(),
		])
	);
