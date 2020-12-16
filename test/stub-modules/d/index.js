import f from '../f';
import e from './e';
// -- require ("./style.css");

const VAL = 4 + f() + e();

const runD = () => {
	console.log( `Module D says the total is: ${ VAL }` );
	return VAL;
};

export default runD;
