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

			<PickCompany />
			<YourDetails />
			<Authorise />

		</div>
	);
};

const PickCompany = ({}) => {
	return (<div><h3>Pick a Company</h3>
		Tesco
		Sainsburys		
	</div>);
};

const YourDetails = ({}) => {
	return (<div>
	<h3>Enter Your Details</h3></div>);
};

const Authorise = ({}) => {
	let path = ['misc', 'form', 'auth'];
	return (<div>
		<h3>Authorise Action</h3>
		<Misc.Col2>
			<div>
				<Misc.PropControl prop='letter' path={path} label='Send this letter' type='checkbox' />
				<Misc.PropControl prop='store' path={path} label='Store my data for me when it is sent' type='checkbox' />
				<Misc.PropControl prop='joinList' path={path} label='Join the MyData mailing list' type='checkbox' />
			</div>
			<div>
				This is the letter we'll send for you.
			
			</div>
		</Misc.Col2>
	</div>);
};


export default GetMyDataPage;
