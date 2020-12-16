import e from './d/e';

const VAL = 6 + e();

const runF = () => {
	console.log( `Module F says the total is: ${ VAL }` );
	return VAL;
};

export default runF;
