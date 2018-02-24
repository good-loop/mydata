import React from 'react';
import {assert, assMatch} from 'sjtest';
import _ from 'lodash';

const Checkbox = ({label, checked, value, size, onChange, ...otherStuff}) => {
	// boolean value
	if (checked===null || checked===undefined) checked = !! value;
	
	// TODO move up and out
	if ( ! size) size='lg'; // default large checkbox
	let style ={};
	if (size==='lg') {
		style.width='20px';
		style.height='80%';
	}
	assert( ! otherStuff.children, otherStuff);
	return (<div className="form-check">		
		<input style={style} className={'form-check-input'+(size?' form-control-'+size : '')} 
			type="checkbox" value={""+value} checked={checked} onChange={onChange} {...otherStuff} />
		<label className='form-check-label'>{label}</label>
	</div>);
};

let BS = {
	Checkbox
};
export {Checkbox};
export default BS;
