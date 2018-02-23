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
	let email = 'your-email';
	let dataDetails = 'The contact details you hold for me. Profiling data on me. Transaction history data. Meta-data about me and my behaviour.';
	let letterText = `Dear Sir or Madam

Subject Access Request

I am currently one of your customers - email address ${email}
I request information about me that I am entitled to under the Data Protection Act 1998 relating to: 

${dataDetails}

I would like the information through a .csv download or by your providing API access.								

If you need any more information from me, or a fee, please let me know as soon as possible by email to ??. I have appointed Good-Loop to handle my correspondence on this matter.

A request for information under the Data Protection Act 1998 should be responded to within 40 days. If you do not normally deal with these requests, please pass this letter to your Data Protection Officer. If you need advice on dealing with this request, the Information Commissioner's Office can assist you and can be contacted on 0303 123 1113 or at ico.org.uk

Yours faithfully,
${name}`;
	
	return (<div>
		<h3>Authorise Action</h3>
		<Misc.Col2>
			<div>
				<Misc.PropControl prop='permissionLetter' path={path} label='Send this letter' type='checkbox' />
				<Misc.PropControl prop='permissionStore' path={path} label='Store my data for me when it is sent' type='checkbox' />
				<Misc.PropControl prop='permissionJoinList' path={path} label='Join the MyData mailing list' type='checkbox' />
			</div>
			<div>
				This is the letter we'll send for you. 
				Good-Loop have kindly agreed to handle printing and pay the postage.
				<Misc.PropControl prop='letterText' path={path} label='The Letter' type='textarea' />
			</div>
		</Misc.Col2>
	</div>);
};


export default GetMyDataPage;
