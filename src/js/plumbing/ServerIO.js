/** 
 * Wrapper for server calls.
 *
 */
import _ from 'lodash';
import $ from 'jquery';
import {SJTest, assert, assMatch} from 'sjtest';
import {XId, encURI} from 'wwutils';
import C from '../C.js';

import Login from 'you-again';

// Try to avoid using this for modularity!
import DataStore from './DataStore';
import Messaging, {notifyUser} from './Messaging';

// Error Logging - but only the first error
window.onerror = _.once(function(messageOrEvent, source, lineno, colno, error) {
	// NB: source & line num are not much use in a minified file
	let msg = error? ""+error+"\n\n"+error.stack : ""+messageOrEvent;
	$.ajax('/log', {data: {
		msg: msg,
		type: "error"
	}});
});

const ServerIO = {};
export default ServerIO;

// for debug
window.ServerIO = ServerIO;
const BURL = '/';

ServerIO.DATALOG_ENDPOINT = C.HTTPS+'://'+C.SERVER_TYPE+'lg.good-loop.com/data';

/**
 * Submits an AJAX request. This is the key base method
 *
 * @param {String} url The url to which the request should be made.
 *
 * @param {Object} [params] Optional map of settings to modify the request.
 * See <a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax</a> for details.
 * IMPORTANT: To specify form data, use params.data
 *
 * {
 * 	// Our parameters
 * 	swallow: true to swallow any messages returned by the server.   
 * 
 * 	// jQuery parameters (partial notes only)
 * 	data: {Object} data to send - this should be a simple key -> primitive-value map.   
 * 	xhr: {Function} Used for special requests, e.g. file upload
 * }
 *
 * @returns A <a href="http://api.jquery.com/jQuery.ajax/#jqXHR">jqXHR object</a>.
**/
ServerIO.load = function(url, params) {
	assMatch(url,String);
	console.log("ServerIO.load", url, params);
	params = ServerIO.addDefaultParams(params);
	if ( ! params.data) params.data = {};
	// sanity check: no Objects except arrays
	_.values(params.data).map(
		v => assert( ! _.isObject(v) || _.isArray(v), v)
	);
	// add the base
	if (url.substring(0,4) !== 'http' && ServerIO.base) {
		url = ServerIO.base + url;
	}
	params.url = url;
	// send cookies & add auth
	Login.sign(params);
	// debug: add stack
	if (window.DEBUG) {
		try {
			const stack = new Error().stack;			
			// stacktrace, chop leading "Error at Object." bit
			params.data.stacktrace = (""+stack).replace(/\s+/g,' ').substr(16);
		} catch(error) {
			// oh well
		}
	}
	// Make the ajax call
	let defrd = $.ajax(params); // The AJAX request.
	if (params.swallow) {
		// no message display
		return defrd;
	}
	defrd = defrd
			.then(ServerIO.handleMessages)
			.fail(function(response, huh, bah) {
				console.error('fail',url,params,response,huh,bah);
				let msg = {
					id: 'error from '+params.url,
					type:'error', 
					text: (response && response.responseText) || "Could not load "+params.url+" from the server"
				};
				if (response.status === 404) {
					msg.text = "404: Sadly that content could not be found.";
				}
				// HACK hide details
				if (msg.text.indexOf('\n----') !== -1) {
					let i = msg.text.indexOf('\n----');
					msg.details = msg.text.substr(i);
					msg.text = msg.text.substr(0, i);
				}
				// bleurgh - a frameworky dependency
			notifyUser(msg);
				return response;
		});
	return defrd;
};


ServerIO.post = function(url, data) {
	return ServerIO.load(url, {data, method:'POST'});
};

ServerIO.handleMessages = function(response) {
	console.log('handleMessages',response);
	const newMessages = response && response.messages;
	if ( ! newMessages || newMessages.length===0) {
		return response;
	}
	newMessages.forEach(msg => notifyUser(msg));
	return response;
};

ServerIO.addDefaultParams = function(params) {
	if ( ! params) params = {};
	if ( ! params.data) params.data = {};
	return params;
};
