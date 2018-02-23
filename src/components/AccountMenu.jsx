import React from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import Login from 'you-again';

import C from '../C';
import DataStore from '../plumbing/DataStore.js';
import {LoginLink} from './LoginWidget.jsx';

// import {XId,yessy,uid} from '../js/util/orla-utils.js';

import Misc from './Misc';

const doLogout = () => {
	Login.logout();
};

/*
The top-right menu
*/
const AccountMenu = ({pending, active}) => {
	if (pending) return <Misc.Loading />;

	if ( ! Login.isLoggedIn()) {
		return (<ul id='top-right-menu' className="nav navbar-nav navbar-right">
				<li>
					<LoginLink />
				</li>
		</ul>);
	}

	let user = Login.getUser();
	return (
		<ul id='top-right-menu' className="nav navbar-nav navbar-right">
			<li className={'dropdown' + (active? ' active' : '')}>
				<a className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
					{ user.name || user.xid }&nbsp;
					<span className="caret" />
				</a>
				<ul className="dropdown-menu">
					<li><a href="#account">Account</a></li>
					<li role="separator" className="divider" />
					<li><a href="#dashboard" onClick={() => doLogout()}>Log out</a></li>
				</ul>
			</li>
		</ul>
	);
};

export default AccountMenu;
