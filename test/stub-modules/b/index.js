/*

hhhhhhhhhhhhhhhh''

jjjjjjjjjjjjjjjjj

9uuuuuuuuuuuuuuuuuuuuuuuuu */

// -- require './style.css'

import c from '../c';
import f from '../f';

const VAL = 2 + c() + f();

const runB = () => {
	console.log( `Module B says the total is: ${ VAL }` );
	return VAL;
};

export default runB;
