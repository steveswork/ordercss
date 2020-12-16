require = require( 'esm' )( module );
require( './src/cli' ).runCli( `${ process.cwd() }/test/stub-modules/index.js` );
