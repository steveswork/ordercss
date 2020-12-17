import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

import get from 'lodash.get';
import isEmpty from 'lodash.isempty';

import {
	LINE_BRK_PATTERN,
	OUTPUT_FILENAME_PATTERN,
	PATH_STR_EXP_MIN_LEN,
	REQUIRE_SOURCE_PATTERN,
	SCRIPT_EXTS,
	STYLE_EXTS,
	SOURCE_EXT_PATTERN,
	STYLE_LINE_MARKER
} from '../constants';

const PATH_SEPARATOR_PATTERN = /[\/\\]/;

/**
 * @private
 * @param {FilePath}  parentModulePath absolute path
 * @param {FilePath} childModulePath absolute or relative path
 * @returns {FilePath} absolute path
 */
const getChildAbsolutePath = ( parentModulePath, childModulePath ) => {
	const childPathTokens = childModulePath.split( PATH_SEPARATOR_PATTERN ).reverse();
	const dotPathTokens = [];
	let currentToken;
	while( childPathTokens.length ) {
		if( !/^\.+$/.test( childPathTokens[ childPathTokens.length - 1 ] ) ) {
			break;
		}
		currentToken = childPathTokens.pop();
		currentToken.length > 1 && dotPathTokens.push( '..' );
	}
	const args = [ dirname( parentModulePath ) ];
	dotPathTokens.length && args.push( dotPathTokens.join( '/' ) );
	childPathTokens.length && args.push( childPathTokens.reverse().join( '/' ) );
	return resolve( ...args );
};

/**
 * @private
 * @param {string} sourceExpression - an import or require expression expression
 * @returns {string} - requested source path string of source expression. e.g. "import x from '../../x';" => '../../x'
 */
const getImportPathFrom = sourceExpression => {
	let separator = '\'';
	let start = sourceExpression.indexOf( separator );
	if( start === -1 ) {
		separator = '"';
		start = sourceExpression.indexOf( separator );
	}
	if( start < 0 || start > sourceExpression.length - PATH_STR_EXP_MIN_LEN ) {
		return '';
	}
	const stop = sourceExpression.lastIndexOf( separator );
	return stop > start ? sourceExpression.slice( start + 1, stop ) : '';
};

/**
 * Removes comment line preceding program statements bypassing comment non referenced
 * css imports and requireds. This mutates the argument. @see readme.text on how to
 * comment non-referenced css imports and requireds to this strip bypass compliance.
 *
 * @private
 * @param {string[]} sourceCodeLines - lines of code in source file
 * @returns {string[]} - remaining lines of source code after top comment strip
 */
const stripTopCommentary = sourceCodeLines => {
	const lines = sourceCodeLines.reverse();
	let inPreCodeCommentBlock;
	let currentIndex = lines.length - 1;
	while( currentIndex > -1 ) {
		inPreCodeCommentBlock = inPreCodeCommentBlock || (
			lines[ currentIndex ].startsWith( '/*' )
		);
		if( inPreCodeCommentBlock ) {
			inPreCodeCommentBlock = !lines.splice( currentIndex, 1 ).pop().endsWith( '*/' );
			currentIndex--;
			continue;
		}
		if( lines[ currentIndex ].startsWith( '//' ) ) {
			!STYLE_LINE_MARKER.test( lines[ currentIndex ] ) &&
			lines.splice( currentIndex, 1 );
			currentIndex--;
			continue;
		}
		break;
	}
	return lines.reverse();
};

/**
 * @param {FilePath} modulePath module absolute path
 * @returns {{
 * 		isValidPath: boolean,
 * 		lines: string[]
 * }} modulePath validity and lines of source file logic text read
 */
const getSourceCodeLines = modulePath => {
	let text;
	try {
		text = readFileSync( modulePath, 'utf-8' )
	} catch( e ) {
		if( e.message.startsWith( 'ENOENT' ) ) {
			return { isValidPath: false };
		}
		throw e;
	}
	return {
		isValidPath: true,
		lines: stripTopCommentary( text.trim().split( LINE_BRK_PATTERN ) )
	};
};

/**
 * @param {string[]} lines code lines
 * @returns {string} a single import statement
 */
const dequeueImportStatement = lines => {
	const stmtTokens = [];
	let curToken;
	do {
		curToken = lines.shift();
		stmtTokens.push( curToken );
	} while( !/[',"];?$/.test( curToken ) && lines.length );
	return stmtTokens.join( ' ' ).replace( /\s+/, ' ' );
};

/**
 * @param {FilePath[]} styleOutputList a list into which to collect all non-referenced CSS import source paths mentioned in the current module
 * @param {FilePath} ownerPath absolute path of the current module containing the import/require expressions
 * @returns {(sourceExpression: string) => void} Registrar
 * @see getImportPathFrom for further details on sourceExpression registrar argument
 */
const getStylePathRegistrar = ( styleOutputList, ownerPath ) => sourceExpression => {
	const path = getImportPathFrom( sourceExpression );
	if( !path.startsWith( '.' ) || !STYLE_EXTS.some( ext => path.endsWith( ext ) ) ) {
		return;
	}
	styleOutputList.push( getChildAbsolutePath( ownerPath, path ) );
};

/**
 * @param {ScriptImport[]} scriptOutputList a list into which to collect all possible script file paths for script import source paths mentioned in the current module
 * @param {FilePath} ownerPath absolute path of the current module containing the import/require expressions
 * @returns {(sourceExpression: string) => void} Registrar
 * @see getImportPathFrom for further details on the sourceExpression registrar argument
 * @see ScriptImportEntry for further details on contents of an import graph entry
 */
const getScriptPathRegistrar = ( scriptOutputList, ownerPath ) => sourceExpression => {
	const path = getImportPathFrom( sourceExpression );
	if( !path.startsWith( '.' ) || OUTPUT_FILENAME_PATTERN.test( path ) ) {
		return;
	}
	const extMatch = path.match( SOURCE_EXT_PATTERN );
	if( extMatch !== null ) {
		SCRIPT_EXTS.includes( extMatch[ 1 ] ) && scriptOutputList.push(
			getChildAbsolutePath( ownerPath, path )
		);
		return;
	}
	let absolutePathPrefix = getChildAbsolutePath( ownerPath, path );
	const paths = [];
	if( /\.\/?$/.test( path ) ) {
		absolutePathPrefix = join( path, '/index' );
	}
	for( const scriptExt of SCRIPT_EXTS ) {
		paths.push( `${ absolutePathPrefix }${ scriptExt }` );
		!path.endsWith( 'index' ) && paths.push(
			join( absolutePathPrefix, `/index${ scriptExt }` )
		)
	}
	scriptOutputList.push({ key: path, paths });
};

/**
 * @param {FilePath} modulePath absolute path of the current module whose dependencies are being collected
 * @returns {{
 * 		isValidPath: boolean,
 * 		scripts: ScriptImportEntry[],
 * 		styles: FilePath[]
 * }} Module dependency import absolute file paths for scripts and styles
 */
const pullJsDependencyPaths = modulePath => {
	const { isValidPath, lines } = getSourceCodeLines( modulePath );
	if( lines === undefined ) {
		return { isValidPath, scripts: [], styles: [] };
	}
	const scripts = [];
	const styles = [];
	const registerScriptPath = getScriptPathRegistrar( scripts, modulePath );
	const registerStylePath = getStylePathRegistrar( styles, modulePath );
	while( lines.length ) {
		if( lines[ 0 ].startsWith( 'import ' ) ) {
			registerScriptPath( dequeueImportStatement( lines ));
			continue;
		}
		if( STYLE_LINE_MARKER.test( lines[ 0 ] ) ) {
			registerStylePath( lines.shift() );
			continue;
		}
		break;
	}
	const requiredPaths = [];
	while( lines.length ) {
		const paths = lines.shift().match( REQUIRE_SOURCE_PATTERN );
		paths !== null && requiredPaths.push( ...paths );
	}
	requiredPaths.length && Array
		.from( new Set( requiredPaths ) )
		.forEach( registerScriptPath );
	return({ isValidPath, scripts, styles });
};

/**
 * @param {FilePath[][]} graph
 * @param {{[x:string]: FilePath[]}} cssMap contains a list of css  absolute paths per js/ts module where the key equals js/ts module absolute path
 * @param {FilePath} entryModulePath  entry module absolute path
 * @returns {FilePath[]} Ordered absolute paths of css module imports queue from the deepest nested import to the entry module imports
 */
const buildCssDependencyQueue = ( graph, cssMap, entryModulePath ) => {
	if( isEmpty( cssMap ) ) {
		return [];
	}
	const dependencyQueue = new Set();
	const enqueue = entryKey => {
		( entryKey in cssMap ) &&
		cssMap[ entryKey ].forEach(
			d => dependencyQueue.add( d )
		);
	}
	if( isEmpty( get( graph, '[0][0]' ) ) ) {
		enqueue( entryModulePath );
		return Array.from( dependencyQueue );
	}
	const visitedMap = {};
	for( let g = graph.length; g--; ) {
		for( const modulePath of graph[ g ] ) {
			if( modulePath in visitedMap ) {
				continue;
			}
			visitedMap[ modulePath ] = true;
			enqueue( modulePath );
		}
	}
	if( !( entryModulePath in visitedMap ) ) {
		enqueue( entryModulePath );
	}
	return Array.from( dependencyQueue );
};

/**
 * @param {FilePath[][]} graph js/ts import graph containing js/ts absolute paths
 * @param {{[x:string]: FilePath[]}} cssMap contains a list of css absolute paths per js/ts module import path argument where key equals js/ts module import path argument
 * @param {FilePath} modulePath js/ts module absolute path
 * @param {FilePath} [sourcePath] source path string parameter supplied for import/require expression in the module source code
 * @param {number} [depth=0]
 * @returns {{
 * 		redundant?: boolean,
 * 		success: boolean
 * }} module build attempt outcome
 */
const buildImportGraphInto = (
	graph, cssMap, modulePath, depth = 0
) => {
	if( modulePath in cssMap ) {
		return {
			redundant: true,
			success: false
		};
	}
	const {
		isValidPath, scripts, styles
	} = pullJsDependencyPaths( modulePath );
	if( isValidPath === false ) {
		return { success: isValidPath };
	}
	cssMap[ modulePath ] = styles;
	if( isEmpty( scripts ) ) {
		return { success: true };
	}
	if( !Array.isArray( graph[ depth ] ) ) {
		graph[ depth ] = [];
	}
	for( let { paths } of scripts ) {
		const existingMatch = paths.find( p => p in cssMap );
		if( !isEmpty( existingMatch ) ) {
			paths = [ existingMatch ];
		}
		for( const path of paths ) {
			const result = buildImportGraphInto(
				graph, cssMap, path, depth + 1
			);
			if( result.success || result.redundant ) {
				graph[ depth ].push( path );
				break;
			}
		}
	};
	return { success: true };
};

class CssOrder {
	/**
	 * Creates an instance of CssOrder.
	 * @constructor
	 * @memberof CssOrder
 	 * @param {FilePath} entryModulePath entry module absolute path
	 */
	constructor( entryModulePath ) {
		this.entryModulePath = resolve( entryModulePath );
		this.orderedCssPaths = [];
	}
}

/**
 * @memberof CssOrder
 * @returns {FilePath[]} Ordered css import queue from the deepest nested import to the entry module imports
 */
CssOrder.prototype.calculate = function () {
	if( OUTPUT_FILENAME_PATTERN.test( this.entryModulePath ) ) {
		return this.orderedCssPaths;
	}
	const importGraph = [];
	const cssImportMap = {};
	buildImportGraphInto( importGraph, cssImportMap, this.entryModulePath );
	this.orderedCssPaths = buildCssDependencyQueue( importGraph, cssImportMap, this.entryModulePath );
	return this.orderedCssPaths;
};

export default CssOrder;

/** @typedef {string} FilePath */
/**
 * `ScriptImportGraphEntry.key` refers to source path argument of the import/require expression
 * `ScriptImportGraphEntry.paths` refers to all possible supported script matches for such source path argument
 * @typedef {{
 * 		key: string,
 * 		paths: FilePath[]
 * }} ScriptImportEntry
 */
