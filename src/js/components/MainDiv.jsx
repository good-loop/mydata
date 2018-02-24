import React, { Component } from 'react';
import Login from 'you-again';
import { assert } from 'sjtest';
import { getUrlVars } from 'wwutils';
import _ from 'lodash';

// Plumbing
import DataStore from '../plumbing/DataStore.js';
import C from '../C';
// Templates
import MessageBar from './MessageBar';
import NavBar from './NavBar';
import LoginWidget from './LoginWidget';
// Pages
import AccountPage from './AccountPage';
import GetMyDataPage from './GetMyDataPage';

// Actions


const PAGES = {
	getmydata: GetMyDataPage,
	account: AccountPage,
};

const DEFAULT_PAGE = 'getmydata';


/**
		Top-level: tabs
*/
class MainDiv extends Component {

	componentWillMount() {
		// redraw on change
		const updateReact = (mystate) => this.setState({});
		DataStore.addListener(updateReact);

		Login.app = Login.isLoggedIn()? Login.getUser().app : C.app.service;
		// Set up login watcher here, at the highest level		
		Login.change(() => {
			// ?? should we store and check for "Login was attempted" to guard this??
			if (Login.isLoggedIn()) {
				// close the login dialog on success
				DataStore.setShow('LoginWidget', false);
				Login.app = Login.getUser().app;
			} else {
				// poke React via DataStore (e.g. for Login.error)
				DataStore.update({});
			}
			this.setState({});
		});

		Login.verify();
	}


	render() {
		let path = DataStore.getValue('location', 'path');
		let page = path[0] || DEFAULT_PAGE; //const { page, pageProps } = this.state;
		// console.log("TODO page from path?", path, page);
		// assert(page, this.props);
		let Page = PAGES[page];		
		assert(Page, page);

		let msgs = Object.values(DataStore.getValue('misc', 'messages-for-user') || {});
		return (
			<div>
				<div className="container avoid-navbar">
					<MessageBar messages={msgs} />
					<div id={page}>
						<Page />
					</div>
				</div>
				<LoginWidget logo={C.app.service} title={'Welcome to '+C.app.name} />
			</div>
		);
	}
}

export default MainDiv;
