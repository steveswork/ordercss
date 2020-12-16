

import { join } from 'path';

import CssOrder from '.';

describe( 'CssOrder', () => {
	const testStubDir = `${ process.cwd() }/test/stub-modules/`;
	const cssOrder = new CssOrder( `${ testStubDir }index.js` );
	const actual = cssOrder.calculate();
	it( 'was created successfully', () => {
		expect( cssOrder instanceof CssOrder ).toEqual( true );
	});
	it( 'returns absolute paths of all css module imports in the script module import graph', () => {
		expect( actual ).toHaveLength( 3 );
	});
	it( 'returns css used from the lowest level script dependency up to the dependent scripts', () => {
		const relDirs = [ '/d/e/', '/d/', '/b/' ];
		actual.forEach(( f, i ) => expect( f ).toEqual(
			join( testStubDir, relDirs[ i ], 'style.css' )
		));
	});
});
