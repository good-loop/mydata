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
	let formData = DataStore.getValue('misc', 'form') || {};
	formData.notify='daniel@sodash.com';
	formData.onSubmit='http://localmydata.good-loop.com/onSubmit';
	let ready = formData.name && formData.email && formData.permissionLetter && formData.permissionStore;

	return (
		<div className='container'>
			<h2>Get My Data!</h2>
			<p>
				You have the legal right to see the data companies hold about you.
				Coming soon (this May) you'll get more legal rights to control your data.
				This My-Data tool by Good-Loop helps you to use those rights!
			</p>
			<PickCompany />
			<YourDetails />
			<Authorise />
			<center>
				<Misc.SubmitButton className='btn-primary btn-lg mt-5 mb-5' disabled={ ! ready} 
					path={['misc', 'form']}
					title={ready? '' : "Please check you've filled in the form"}
					url='https://profiler.winterwell.com/form/getmydata'
					onSuccess={"Now check your email - we've sent a confirmation email: please click on the link."} 
				>
				Get My Data
				</Misc.SubmitButton>
			</center>
			<p>Legally, the companies have 40 days to respond. 
				We will let you know when they do. 
				And we will chase them if they don't.</p>
		</div>
	);
};

const cpath = ['misc', 'form', 'chosen'];

const PickCompany = ({}) => {
	let companies = [
		{id:'tesco', name: "Tesco", img: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/Tesco_Logo.svg/400px-Tesco_Logo.svg.png"},
		{id:'sainsburys', name: "Sainsbury's", img: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Sainsbury%27s_logo.png"},
		{id:'asda', name: "Asda", img: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Asda_logo.png"},
		{id:'morrisons', name: "Morrisons", img: "https://upload.wikimedia.org/wikipedia/en/thumb/8/82/MorrisonsLogo.svg/440px-MorrisonsLogo.svg.png"},
		{id:'aldi', name: "Aldi", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/AldiNord-WorldwideLogo.svg/200px-AldiNord-WorldwideLogo.svg.png"},

		{id:'google', name: "Google", img: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"},
		{id:'amazon', name: "Amazon", img: "https://upload.wikimedia.org/wikipedia/commons/7/70/Amazon_logo_plain.svg"},
		{id:'microsoft', name: "Microsoft", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/200px-Microsoft_logo_%282012%29.svg.png"},
		{id:'facebook', name: "Facebook", img: "https://upload.wikimedia.org/wikipedia/commons/c/c2/F_icon.svg"},
		{id:'apple', name: "Apple", img: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"},
	];
	let chosen = DataStore.getValue(cpath);
	if ( ! chosen) {
		chosen = [];
		DataStore.setValue(cpath, chosen);
	}
	return (<div><h3>1. Pick upto 3 Companies 
		{chosen.length? <div className={'badge '+(chosen.length > 3? 'badge-danger' : 'badge-primary')}>{chosen.length}</div> : null}
		</h3>			
		{companies.map(c => <CompanyButton key={c.id} company={c}/>)}
		<Misc.PropControl path={cpath} prop='otherCompany' label='Other' placeholder='Company name' />
	</div>);
};

const CompanyButton = ({company}) => {
	let chosen = DataStore.getValue(cpath);
	let picked = chosen.filter(c => c.id === company.id).length !== 0;
	let mod = picked? chosen.filter(c => c.id !== company.id) :  chosen.concat(company);
	return (<button className={'CompanyButton btn btn-outline-primary'+(picked? ' active':'')}
		onClick={e => DataStore.setValue(cpath, mod) }>
	<img className='img-thumbnail' src={company.img} /><br/><small>{company.name}</small></button>);
}

const YourDetails = ({}) => {
	let chosen = DataStore.getValue(cpath);
	let path = ['misc', 'form'];
	return (<div>
	<h3>2. Enter Your Details</h3>
	<p>The company need enough data to reliably identify you, and we need an email to contact you when your data arrives.</p>
	<Misc.PropControl prop='name' path={path} label='Name' required />
	<Misc.PropControl prop='email' path={path} label='Email' type='email' required />
	<Misc.PropControl prop='address' path={path} label='Address' type='address' />	
	{chosen.map(c => <Misc.PropControl key={c.id} prop={'customerIdFor'+c.id} path={path} label={'Customer ID with '+c.name+' if known'} />)}
	<Misc.PropControl prop='hat' path={path} label='HAT url (if you happen to have one)' type='url' />
	</div>);
};

const Authorise = ({}) => {
	let path = ['misc', 'form'];
	let formData = DataStore.getValue(path) || {};
	let email = 'your-email';

	return (<div>
		<h3>3. Authorise Action</h3>
		<div>
			<p>I authorise Good-Loop to:</p>
			<Misc.PropControl prop='permissionLetter' path={path} label='Send letters and emails to these companies, and handle any follow-up correspondence.' 
				type='checkbox' required />
			<div>Here is <a href={'getdata-letter.html'+(formData.hat? '#hat' : '')} target='_blank'>the formal letter</a> we send the companies.
			Good-Loop have kindly agreed to handle printing and pay the postage.</div>
			<Misc.PropControl prop='permissionGDPR' path={path} label='Ask for more data this summer when the law improves.' type='checkbox' />
			<Misc.PropControl prop='permissionStore' path={path} label='Store my data for me when it arrives.' type='checkbox' required />
			<Misc.PropControl prop='permissionEmail' path={path} label='Add my email to the mailing-list.' type='checkbox' />
		</div>
	</div>);
};


export default GetMyDataPage;
