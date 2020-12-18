import { join } from 'path';

import CssOrder from '.';

describe( 'CssOrder', () => {
	const relDirs = [ '/d/e/', '/d/', '/b/' ];
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
		actual.forEach(( f, i ) => expect( f ).toEqual(
			join( testStubDir, relDirs[ i ], 'style.css' )
		));
	});
	it( 'was created successfully', () => {
		expect( cssOrder instanceof CssOrder ).toEqual( true );
	});
	it( 'can aggregate in hierarchy css import file paths from multiple script entry module paths', () => {
		const _relDirs = [ ...relDirs, '/b/z' ];
		( new CssOrder([
			`${ testStubDir }d/e/index.js`,
			`${ testStubDir }index.js`
		])).calculate().forEach(( f, i ) => expect( f ).toEqual(
			join( testStubDir, _relDirs[ i ], 'style.css' )
		));
	});
});
