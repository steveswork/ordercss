/** */
import d from './d';
import e from './d/e';

const VAL = 3 + d() + e();

const runC = () => {
	console.log( `Module C says the total is: ${ VAL }` );
	return VAL;
};

export default runC;
