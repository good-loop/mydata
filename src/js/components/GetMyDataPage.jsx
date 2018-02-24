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
			<p>
				You have the legal right to see the data companies hold about you.
				Coming soon (this May) you'll get more legal rights to control your data.
				This MyData tool by Good-Loop helps you to use those rights!
			</p>
			<PickCompany />
			<YourDetails />
			<Authorise />
			<button className='btn btn-primary btn-lg' disabled >Get My Data</button>
			<p>Legally, the companies have 40 days to respond. We will let you know when they do. 
				And we will chase them if they don't.</p>
		</div>
	);
};

const cpath = ['misc', 'form', 'chosen'];

const PickCompany = ({}) => {
	let companies = [
		{id:'tesco', name: "Tesco", img: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/Tesco_Logo.svg/400px-Tesco_Logo.svg.png"},
		{id:'sainsburys', name: "Sainsbury's", img: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Sainsbury%27s_logo.png"}
	];
	let chosen = DataStore.getValue(cpath);
	if ( ! chosen) {
		chosen = [];
		DataStore.setValue(cpath, chosen);
	}
	return (<div><h3>Pick upto 3 Companies {chosen.length? <div className='badge badge-primary'>{chosen.length}</div> : null}</h3>			
		{companies.map(c => <CompanyButton key={c.id} company={c}/>)}
	</div>);
};

const CompanyButton = ({company}) => {
	let chosen = DataStore.getValue(cpath);
	let picked = chosen.filter(c => c.id === company.id).length !== 0;
	let mod = picked? chosen.filter(c => c.id !== company.id) :  chosen.concat(company);
	return (<button className={'btn btn-outline-primary'+(picked? ' active':'')}
		onClick={e => DataStore.setValue(cpath, mod) }>
	<img className='img-thumbnail' src={company.img} /><br/><small>{company.name}</small></button>);
}

const YourDetails = ({}) => {
	let chosen = DataStore.getValue(cpath);
	let path = ['misc', 'form'];
	return (<div>
	<h3>Enter Your Details</h3>
	<p>The company need enough data to reliably identify you, and we need an email to contact you when your data arrives.</p>
	<Misc.PropControl prop='name' path={path} label='Name' required />
	<Misc.PropControl prop='email' path={path} label='Email' type='email' required />
	<Misc.PropControl prop='address' path={path} label='Address' type='address' />
	{chosen.map(c => <Misc.PropControl key={c.id} prop={'customerIdFor'+c.id} path={path} label={'Customer ID with '+c.name+' if known'} />)}	
	</div>);
};

const Authorise = ({}) => {
	let path = ['misc', 'form'];
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
				<p>I authorise Good-Loop to:</p>
				<Misc.PropControl prop='permissionLetter' path={path} label='Send letters to these companies and handle any follow-up correspondence' type='checkbox' required />
				<Misc.PropControl prop='permissionGDPR' path={path} label='Ask for more data in May when the GPDR law comes in' type='checkbox' />
				<Misc.PropControl prop='permissionStore' path={path} label='Store my data for me when it arrives' type='checkbox' required />
				<Misc.PropControl prop='permissionEmail' path={path} label='Add my email to the mailing-list' type='checkbox' />
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
