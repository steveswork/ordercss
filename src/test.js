import fs from 'fs';
import { join } from 'path';

import { OUTPUT_FILENAME_IDENTIFIER } from './constants';

import { generateOutputModule, getCssImportOrder } from '.';

describe( 'generateOutputModule(...)', () => {
	let writeFileSyncSpy;
	const cssImportPathsStub = [ 'a', 'b', 'c', 'd', 'e' ];
	const entryModuleDir = `${ process.cwd() }/test/stub-modules`;
	const expectedOutputFile = join( entryModuleDir, `/index${ OUTPUT_FILENAME_IDENTIFIER }.js` );
	beforeAll(() => {
		writeFileSyncSpy = jest.spyOn( fs, 'writeFileSync' ).mockImplementation( jest.fn );
		generateOutputModule( cssImportPathsStub, join( entryModuleDir, '/index.js' ) );
	});
	it( 'converts css import path string argument into output file contents of `require css` calls', () => expect(
		JSON
			.stringify( writeFileSyncSpy.mock.calls[ 0 ][ 1 ] )
			.match( /require\('[^)]+'\);\\n/g )
	).toHaveLength( cssImportPathsStub.length ) );
	it(
		`writes to a specific ${ OUTPUT_FILENAME_IDENTIFIER.replace( /_/g, ' ' ).trim() } script file in the entry module directory`,
		() => expect( writeFileSyncSpy.mock.calls[ 0 ][ 0 ] ).toEqual( expectedOutputFile )
	);
	it( 'writes to an output file in the entry module directory', () => expect( writeFileSyncSpy ).toBeCalled() );
	afterAll(() => writeFileSyncSpy.mockRestore() );
});

describe( 'getCssImportOrder(...)', () => {
	const testStubDir = `${ process.cwd() }/test/stub-modules/`;
	const actual = getCssImportOrder( `${ testStubDir }index.js` );
	it( 'returns absolute paths of all css module imports in the script module import graph', () => {
		expect( actual ).toHaveLength( 3 );
	});
	it( 'returns css used from the lowest level script dependency up to the dependent scripts', () => {
		const relDirs = [ '/d/e/', '/d/', '/b/' ];
		actual.forEach(( f, i ) => expect( f ).toEqual(
			join( testStubDir, relDirs[ i ], 'style.css' )
		));
	});
	it( 'curates the entry module css module imports as well', () => {
		const paths = getCssImportOrder( `${ testStubDir }/d/e/index.js` );
		expect( paths ).toHaveLength( 1 );
		expect( paths[ 0 ] ).toEqual( join( testStubDir, '/d/e/style.css' ) );
	});
	it( 'curates css module imports in ancestry line different from the entry module', () => {
		const paths = getCssImportOrder( `${ testStubDir }/b/index.js` );
		expect( paths ).toHaveLength( 3 );
		expect( paths[ 0 ] ).toEqual( join( testStubDir, '/d/e/style.css' ) );
		expect( paths[ 1 ] ).toEqual( join( testStubDir, '/d/style.css' ) );
	});
});
