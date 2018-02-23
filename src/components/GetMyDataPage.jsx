import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert} from 'sjtest';
import Login from 'you-again';
import printer from '../utils/printer.js';
import C from '../C.js';
import Roles from '../Roles';
import Misc from './Misc';
import {stopEvent} from 'wwutils';
import ShareWidget, {ShareLink} from './ShareWidget';
import DataStore from '../plumbing/DataStore';

const GetMyDataPage = () => {
	return (
		<div className=''>
			<h2>Get My Data!</h2>
		</div>
	);
};

export default GetMyDataPage;
