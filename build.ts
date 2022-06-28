import { version, author, homepage } from './package.json';
import { writeFile, mkdir, chmod, readFile } from 'fs/promises';
import { join } from 'path';
import { build, buildSync } from 'esbuild';
import { transform as babel } from '@babel/core';
import { optionDefinitions } from './src/optionDefinitions';
import { wrapText } from './src/utils';

const SRC_PATH = join(__dirname, 'src');
const BUILD_PATH = join(SRC_PATH, '__generated__');
const WEB_PATH = join(__dirname, 'docs');
const CLI_BIN = join(__dirname, 'bin', 'bibtex-tidy');

// For Summary/Details HTML element and CSS variable support:
// * No IE versions
// * Edge 79+
// * Firefox 49+
// * Chrome 49+
// * Safari 10+
// TODO: test on browserstack

const BROWSER_TARGETS = {
	edge: '79',
	firefox: '49',
	chrome: '49',
	safari: '10',
};

const NODE_TARGET: string[] = ['node12'];

const banner: string[] = [
	`bibtex-tidy v${version}`,
	'https://github.com/FlamingTempura/bibtex-tidy',
	'',
	'DO NOT EDIT THIS FILE. This file is automatically generated',
	"using `npm run build`. Edit files in './src' then rebuild.",
];

const jsBanner: string[] = [
	'/**',
	...banner.map((line) => ` * ${line}`.trimEnd()),
	' **/',
	'',
];

const manpageBanner: string[] = banner.map((line) => `.\\ ${line}`.trimEnd());

async function generateOptionTypes() {
	const { outputFiles } = await build({
		entryPoints: [join(SRC_PATH, 'optionDefinitions.ts')],
		write: false,
		format: 'esm',
	});
	const bundle = new TextDecoder().decode(outputFiles[0].contents);
	// Bundle creates an export which eval doesn't know what to do with. Assign to
	// var instead.
	const options = eval(bundle.replace(/^export/m, 'const res = ') + '; res');

	const ts: string[] = [];

	ts.push(...jsBanner);
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

const NAME = `BibTeX Tidy v${version}`;
const DESCRIPTION = 'Cleaner and formatter for BibTeX files.';
const SYNOPSIS = 'bibtex-tidy [OPTION]... FILE.BIB';

async function generateCLIHelp() {
	const help: string[] = [
		`Usage: ${SYNOPSIS}`,
		`${NAME} - ${DESCRIPTION}`,
		'',
		'Options:',
		...formatOptions(2, 84),
		`Full documentation <${homepage}>`,
	];
	await writeFile(
		join(BUILD_PATH, 'manPage.ts'),
		jsBanner.join('\n') +
			`export const manPage = ${JSON.stringify(help, null, '\t')};`
	);
}

async function generateManPage() {
	await writeFile(
		'bibtex-tidy.0',
		[
			'NAME',
			`    ${NAME}`,
			'',
			'SYNOPSIS',
			`    ${SYNOPSIS}`,
			'',
			'DESCRIPTION',
			`    ${DESCRIPTION}`,
			'',
			'OPTIONS',
			...formatOptions(4, 65),
			'BUGS',
			`    ${homepage}`,
			'',
			'AUTHOR',
			`    ${author}`,
		].join('\n')
	);
}

async function generateReadme() {
	const readme = await readFile(join(__dirname, 'README.md'), 'utf8');
	await writeFile(
		join(__dirname, 'README.md'),
		readme.replace(
			/```manpage.*?```/s,
			'```manpage\n' + formatOptions(2, 84).join('\n') + '\n```'
		)
	);
}

function formatOptions(indent: number, lineWidth: number): string[] {
	return optionDefinitions.flatMap((opt) => {
		if (opt.deprecated) return [];

		const description: string[] = [];

		if (opt.description) {
			description.push(...opt.description.flatMap((line) => [line, '\n']));
		}

		if (opt.examples && opt.examples.length > 0) {
			description.push(
				'Examples:',
				opt.examples.filter((example) => example).join(', '),
				''
			);
		}

		return [
			Object.keys(opt.cli).join(', '),
			...description.flatMap((line) =>
				wrapText(line, lineWidth - indent - 4).map((line) => `    ${line}`)
			),
		].map((line) => `${' '.repeat(indent)}${line}`);
	});
}

async function buildJSBundle() {
	console.time('JS bundle built');
	const { outputFiles } = buildSync({
		entryPoints: ['./src/index.ts'],
		bundle: true,
		write: false,
		format: 'esm',
		banner: { js: jsBanner.join('\n') },
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
	const typeFiles = generateDtsBundle([
		{ filePath: './src/index.ts', output: { noBanner: true } },
	]);
	await writeFile('bibtex-tidy.d.ts', typeFiles[0]);
	console.timeEnd('Type declarations');
}

async function buildCLI() {
	console.time('CLI built');
	const { outputFiles } = await build({
		bundle: true,
		write: false,
		platform: 'node',
		banner: { js: jsBanner.join('\n') },
		target: NODE_TARGET,
		entryPoints: [join(SRC_PATH, 'cli.ts')],
	});
	await writeFile(CLI_BIN, '#!/usr/bin/env node\n' + outputFiles[0].text);
	await chmod(CLI_BIN, 0o755); // rwxr-xr-x
	console.timeEnd('CLI built');
}

async function buildWebBundle() {
	console.time('Web bundle built');
	const { outputFiles } = await build({
		platform: 'browser',
		entryPoints: ['./docs/index.ts'],
		bundle: true,
		write: false,
		banner: { js: jsBanner.join('\n') },
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
			generateCLIHelp(),
			generateReadme(),
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
