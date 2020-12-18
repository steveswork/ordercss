import { resolve } from 'path';

import chalk from 'chalk';

import isEmpty from 'lodash.isempty';

import { generateOutputModule, getCssImportOrder } from '.';

const getAbsolutePath = (() => {
	const cwd = process.cwd();
	return path => resolve( cwd, path );
})();

/** @param {FilePath[]} entryModulePaths */
export const runCli = entryModulePaths => {
	const realEntryPaths = entryModulePaths.map( getAbsolutePath );
	const orderedCssPaths = getCssImportOrder( realEntryPaths );
	if( isEmpty( orderedCssPaths ) ) {
		console.warn( chalk.yellow.bold(
			'No compliantly commented CSS imports detected in the generated dependency graph.'
		) );
		return;
	}
	console.info( '\n\n%s:', chalk.blue.underline.bold( 'Ordered CSS Import Listing' ) );
	console.log( orderedCssPaths.join( '\n' ) );
	console.info( chalk.blue.bold( 'Listing completed.' ) );
	try {
		generateOutputModule( orderedCssPaths, realEntryPaths.slice( -1 ).pop() );
		console.log( chalk.green.bold( 'Module update completed.' ) );
	} catch ( e ) {
		console.log( '\n\n%s', chalk.yellow.bold( 'Unsuccessful module update attempt.' ) );
		console.error( chalk.red.bold( e.message ) );
		console.log( e );
	}
	console.log( '%s\n\n', chalk.bold( 'DONE.' ) );
};

const cli = () => {
	const entryModulePath = process.argv.slice( 2 );
	try {
		if( isEmpty( entryModulePath ) ) {
			throw new TypeError( 'No entry module path supplied.' );
		}
		runCli( entryModulePath );
	} catch( e ) {
		console.error( chalk.red.bold( e.message ) );
		console.log( e );
		console.log( '\n\n' );
		process.exit( 1 );
	}
};

export default cli;

/** @typedef {import("./order-imports/index").FilePath} FilePath */
