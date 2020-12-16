import e from './d/e';
import b from './b';
import c from './c';

const VAL = 1 + e() + b() + c();

const runA = () => {
	console.log( `Module A says the total is: ${ VAL }` );
	return VAL;
};

export default runA;
