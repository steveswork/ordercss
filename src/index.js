import fs from 'fs';
import { dirname, join, parse, relative } from 'path';

import {
	JSX_EXT_PATTERN,
	OS_PATH_SEPARATOR_PATTERN,
	OUTPUT_FILENAME_IDENTIFIER
} from './constants';

import Order from './order-imports';

/**
 * @private
 * @param {FilePath} outputFilePath calculated absolute path of the output module to which the calculated CSS module name would be added
 * @returns {(cssPath: FilePath) => FilePath} a node compliant require expression with css module file path relative to the entry module
 */
const getCssModuleCalc = outputFilePath => {
	const outputDir = dirname( outputFilePath )
	return cssPath => {
		let name = relative( outputDir, cssPath )
		if( !name.startsWith( '.' ) ) {
			name = `./${ name }`;
		}
		name = name.replace( OS_PATH_SEPARATOR_PATTERN, '/' );
		return `require('${ name }');`;
	};
};

/**
 * @param {FilePath} entryModulePath root module absolute path (in a next.js application: could refer to the current page module)
 * @returns {FilePath[]} aggregated queue containing absolute paths to css import hierarchy from the leaf to the entry module.
 */
export const getCssImportOrder = entryModulePath => ( new Order( entryModulePath ) ).calculate();

/**
 * Generates a module output file in congruence with specifications stated in the `readme.md`
 *
 * @param {FilePath[]} cssImportPaths an ordered array of css module absolute paths
 * @param {FilePath} entryModulePath root module absolute path (in a next.js application: could refer to the current page module)
 */
export const generateOutputModule = ( cssImportPaths, entryModulePath ) => {
	let { dir, ext, name } = parse( entryModulePath );
	if( JSX_EXT_PATTERN.test( ext ) ) {
		ext = ext.slice( 0, -1 );
	}
	const outputFilePath = join( dir, `${ name }${ OUTPUT_FILENAME_IDENTIFIER }${ ext }` );
	const fileContents = cssImportPaths.map(
		getCssModuleCalc( outputFilePath )
	).join( '\n' ) + '\n';
	fs.writeFileSync( outputFilePath, fileContents );
};

/** @typedef {import("./order-imports").FilePath} FilePath */
