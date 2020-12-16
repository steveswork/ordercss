import { resolve } from 'path';

import chalk from 'chalk';

import isEmpty from 'lodash.isempty';

import { generateOutputModule, getCssImportOrder } from '.';

const cli = () => {
	const entryModulePath = process.argv[ 2 ];
	try {
		if( isEmpty( entryModulePath ) ) {
			throw new TypeError( 'No entry module path supplied.' );
		}
		const realEntryPath = resolve( process.cwd(), entryModulePath );
		const orderedCssPaths = getCssImportOrder( realEntryPath );
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
			generateOutputModule( orderedCssPaths, realEntryPath );
			console.log( chalk.green.bold( 'Module update completed.' ) );
		} catch ( e ) {
			console.log( '\n\n%s', chalk.yellow.bold( 'Unsuccessful module update attempt.' ) );
			console.error( chalk.red.bold( e.message ) );
			console.log( e );
		}
		console.log( '%s\n\n', chalk.bold( 'DONE.' ) );
	} catch( e ) {
		console.error( chalk.red.bold( e.message ) );
		console.log( e );
		console.log( '\n\n' );
		process.exit( 1 );
	}
};

export default cli;
