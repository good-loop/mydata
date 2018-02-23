import React from 'react';

import AccountMenu from './AccountMenu';

/**
 * 
 * @param {*} page The current page
 */
const NavBar = ({currentPage, pageNames}) => {
	// make the page links
	let pageLinks = pageNames.map( p => <NavLink currentPage={currentPage} targetPage={p} key={'li_'+p} />);
	return (
		<nav className="navbar navbar-fixed-top navbar-inverse">
			<div className="container">
				<div className="navbar-header" title="Dashbrd">
					<button
						type="button"
						className="navbar-toggle collapsed"
						data-toggle="collapse"
						data-target="#navbar"
						aria-expanded="false"
						aria-controls="navbar"
					>
						<span className="sr-only">Toggle navigation</span>
						<span className="icon-bar" />
						<span className="icon-bar" />
						<span className="icon-bar" />
					</button>
					<a className="" href="#dashboard">
						<img alt="DataLog logo" style={{maxWidth:'100px',maxHeight:'50px'}} src="img/logo.png" />
					</a>
				</div>
				<div id="navbar" className="navbar-collapse collapse">
					<ul className="nav navbar-nav">
						{pageLinks}
					</ul>
					<div>
						<AccountMenu active={currentPage === 'account'} />
					</div>
				</div>
			</div>
		</nav>
	);
};
// ./NavBar

const NavLink = ({currentPage, targetPage}) => {
	return (<li className={currentPage === targetPage? 'active' : ''}>
				<a className="nav-item nav-link" href={'#'+targetPage} >
					{targetPage}
				</a>
			</li>);
};

export default NavBar;
