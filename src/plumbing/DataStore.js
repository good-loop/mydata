
import C from '../C.js';
import _ from 'lodash';
import {getId, getType} from '../data/DataClass';
import {assert,assMatch} from 'sjtest';
import {yessy, getUrlVars, parseHash, modifyHash, toTitleCase} from 'wwutils';
import PV from 'promise-value';

/**
 * Hold data in a simple json tree, and provide some utility methods to update it - and to attach a listener.
 * E.g. in a top-of-the-app React container, you might do `DataStore.addListener((mystate) => this.setState(mystate));`
 */
class Store {	

	constructor() {
		this.callbacks = [];
		// init the "canonical" categories		
		this.appstate = {
			data:{}, 
			/** 
			 * What are you looking at? 
			 * This is for transient focus. It is NOT for navigation parameters
			 *  -- location and getUrlValue() are better for navigational focus.
			*/
			focus:{}, 
			/** e.g. form settings */
			widget:{}, 
			/**
			 * nav state, stored in the url (this gives nice shareable deep-linking urls)
			 */
			location:{}, 
			misc:{}
		};
		// init url vars
		this.parseUrlVars(window.location);
		// and listen to changes
		window.addEventListener('hashchange', e => {
			// console.warn("hash change - update DataStore", window.location);
			this.parseUrlVars(window.location);
			return true;
		});
	}

	/**
	 * Keep navigation state in the url, after the hash, so we have shareable urls.
	 * To set a nav variable, use setUrlValue(key, value);
	 * 
	 * Stored as location: { path: String[], params: {key: value} }
	 */
	parseUrlVars(url) {		
		let {path, params} = parseHash();
		// peel off eg publisher/myblog		
		let location = {};
		location.path = path;
		let page = path? path[0] : null;
		if (page) {
			// page/slug? DEPRECATED If so, store in DataStore focus
			const ptype = toTitleCase(page); // hack publisher -> Publisher			
			this.setValue(['focus', ptype], path[1]);			
		}
		location.page = page;
		if (path.length > 2) location.slug = path[1];
		if (path.length > 3) location.subslug = path[2];		
		location.params = params;
		this.setValue(['location'], location);
	}

	/**
	 * Set a key=value in the url for navigation. This modifies the window.location and DataStore.appstore.location.params, and does an update.
	 * @param {String} key 
	 * @param {String} value 
	 */
	setUrlValue(key, value) {
		assMatch(key, String);
		if (value) assMatch(value, "String|Boolean|Number");
		// the modifyHash hack is in setValue() so that Misc.PropControl can use it too
		this.setValue(['location', 'params', key], value);
	}

	/**
	 * Get a parameter setting from the url. Convenience for appstate.location.params.key. This is to match setUrlValue.
	 * See also getValue('location','path') for the path.
	 * @param {String} key 
	 */
	getUrlValue(key) {
		assMatch(key, String);
		return this.getValue(['location', 'params', key]);
	}

	/**
	 * It is a good idea to wrap your callback in _.debounce()
	 */
	addListener(callback) {
		this.callbacks.push(callback);
	}

	/**
	 * Update and trigger the on-update callbacks.
	 * @param newState {?Object} This will do an overwrite merge with the existing state.
	 * Note: This means you cannot delete/clear an object using this - use direct modification instead.
	 * Can be null, which still triggers the on-update callbacks.
	 */
	update(newState) {
		console.log('update', newState);
		if (newState) {
			_.merge(this.appstate, newState);
		}
		this.callbacks.forEach(fn => fn(this.appstate));
	}

	/**
	 * Convenience for getting from the data sub-node (as opposed to e.g. focus or misc) of the state tree.
	 * type, id
	 * Warning: This does NOT load data from the server.
	 * @returns a "data-item", such as a person or document, or undefined.
	 */
	getData(type, id) {
		assert(C.TYPES.has(type), "DataStore.getData bad type: "+type);
		assert(id, "DataStore.getData - No id?! getData "+type);
		let item = this.appstate.data[type][id];
		return item;
	}

	/**
	 * 
	 */
	setData(item, update = true) {
		assert(item && getType(item) && getId(item), item, "DataStore.js setData()");
		assert(C.TYPES.has(getType(item)), item);
		this.setValue(['data', getType(item), getId(item)], item, update);
	}

	/**
	 * the DataStore path for this item, or null
	 */
	getPath(item) {
		if ( ! item) return null;
		if ( ! C.TYPES.has(getType(item))) return null;
		if ( ! getId(item)) return null;
		return ['data', getType(item), getId(item)];
	}

	getValue(...path) {
		assert(_.isArray(path), "DataStore.getValue - "+path);
		// If a path array was passed in, use it correctly.
		if (path.length===1 && _.isArray(path[0])) {
			path = path[0];
		}
		assert(this.appstate[path[0]], 
			"DataStore.getValue: "+path[0]+" is not a json element in appstate - As a safety check against errors, the root element must already exist to use getValue()");		
		let tip = this.appstate;
		for(let pi=0; pi < path.length; pi++) {
			let pkey = path[pi];			
			assert(pkey || pkey===0, "DataStore.getValue: "+path); // no falsy in a path - except that 0 is a valid key
			let newTip = tip[pkey];
			// Test for hard null -- falsy are valid values
			if (newTip===null || newTip===undefined) return null;
			tip = newTip;
		}
		return tip;
	}

	/**
	 * Update a single path=value.
	 * 
	 * Unlike update(), this can set {} or null values.
	 * 
	 * It also has a hack, where edits to [data, type, id, ...] (i.e. edits to data items) will
	 * also set the modified flag, [transient, type, id, localStatus] = dirty.
	 * This is a total hack, but handy.
	 * 
	 * @param {String[]} path This path will be created if it doesn't exist (except if value===null)
	 * @param {*} value The new value. Can be null to null-out a value.
	 * @param {boolean} update Set to false to switch off sending out an update. Set to true to force an update even if it looks like a no-op.
	 * undefined is true-without-force
	 */
	// TODO handle setValue(pathbit, pathbit, pathbit, value) too
	setValue(path, value, update) {
		assert(_.isArray(path), "DataStore.setValue: "+path+" is not an array.");
		assert(this.appstate[path[0]], 
			"DataStore.setValue: "+path[0]+" is not a node in appstate - As a safety check against errors, the root node must already exist to use setValue()");
		// console.log('DataStore.setValue', path, value);
		const oldVal = this.getValue(path);
		if (oldVal === value && update !== true && ! _.isObject(value)) {
			// The no-op test only considers String and Number 'cos in place edits of objects are common and would cause problems here.
			// console.log("setValue no-op", path, value, "NB: beware of in-place edits - use update=true to force an update");
			return;
		}

		// HACK: modify the url?
		if (path[0] === 'location' && path[1] === 'params') {
			let newParams = {};
			assert(path.length === 3, "DataStore.js - path should be location.params.key "+path[3]);
			newParams[path[2]] = value;
			modifyHash(null, newParams);
		}

		let tip = this.appstate;
		for(let pi=0; pi < path.length; pi++) {
			let pkey = path[pi];
			if (pi === path.length-1) {
				// Set it!
				tip[pkey] = value;
				break;
			}
			assert(pkey || pkey===0, "falsy in path "+path.join(" -> ")); // no falsy in a path - except that 0 is a valid key
			let newTip = tip[pkey];
			if ( ! newTip) {
				if (value===null) {
					// don't make path for null values
					return;
				}
				newTip = tip[pkey] = {};
			}
			tip = newTip;
		}
		// HACK: update a data value => mark it as modified (but not for deletes)
		if (is(oldVal) && is(value) && path[0] === 'data' && path.length > 2 && DataStore.DATA_MODIFIED_PROPERTY) {
			// chop path down to [data, type, id]
			const itemPath = path.slice(0, 3);
			const item = this.getValue(itemPath);
			if (getType(item) && getId(item)) {
				this.setLocalEditsStatus(getType(item), getId(item), C.STATUS.dirty, false);
			}
		}
		if (update !== false) {
			console.log("setValue -> update", path, value);
			this.update();
		}
	} // ./setValue()

	/**
	 * Has a data item been modified since loading?
	 * @param {*} type 
	 * @param {*} id 
	 * @return "dirty", "clean", etc. -- see C.STATUS
	 */
	getLocalEditsStatus(type, id) {
		assert(C.TYPES.has(type), "DataStore.getLocalEditsStatus "+type);
		assert(id, "DataStore.getLocalEditsStatus: No id?! getData "+type);
		return this.getValue('transient', type, id, DataStore.DATA_MODIFIED_PROPERTY);
	}
	/**
	 * Has a data item been modified since loading?
	 * @param {C.TYPES} type 
	 * @param {!String} id 
	 * @param {C.STATUS} status
	 * @return "dirty", "clean", etc. -- see C.STATUS
	 */
	setLocalEditsStatus(type, id, status, update) {
		assert(C.TYPES.has(type));
		assert(C.STATUS.has(status));
		assert(id, "DataStore.setLocalEditsStatus: No id?! getData "+type);
		if ( ! DataStore.DATA_MODIFIED_PROPERTY) return null;
		return this.setValue(['transient', type, id, DataStore.DATA_MODIFIED_PROPERTY], status, update);
	}


	/**
	* Set widget.thing.show
	 * @param {String} thing The name of the widget.
	 * @param {Boolean} showing 
	 */
	setShow(thing, showing) {
		assMatch(thing, String);
		this.setValue(['widget', thing, 'show'], showing);
	}

	/**
	 * Convenience for widget.thing.show
	 * @param {String} widgetName 
	 * @returns {boolean} true if widget is set to show
	 */
	getShow(widgetName) {
		assMatch(widgetName, String);
		return this.getValue('widget', widgetName, 'show');
	}

	/**
	* Set focus.type Largely @deprecated by url-values (which give deep-linking)
	 * @param {?String} id
	 */
	setFocus(type, id) {
		assert(C.TYPES.has(type), "DataStore.setFocus");
		assert( ! id || _.isString(id), "DataStore.setFocus: "+id);
		this.setValue(['focus', type], id);
	}

	/**
	 * Largely @deprecated by url-values (which give deep-linking)
	 */
	getFocus(type) {
		assert(C.TYPES.has(type), "DataStore.getFocus");
		return this.getValue('focus', type);
	}

	/**
	 * Get hits from the cargo, and store them under data.type.id
	 * @param {*} res 
	 */
	updateFromServer(res) {
		console.log("updateFromServer", res);
		if ( ! res.cargo) {			
			return res; // return for chaining .then()
		}
		// must be bound to the store
		assert(this && this.appstate, "DataStore.updateFromServer: Use with .bind(DataStore)");
		let hits = res.cargo && res.cargo.hits;
		if ( ! hits && res.cargo) {			
			hits = [res.cargo]; // just the one?
		}
		let itemstate = {data:{}};
		hits.forEach(item => {
			try {
				let type = getType(item);
				if ( ! type) {
					// 
					console.log("skip server object w/o type", item);
					return;
				}
				assert(C.TYPES.has(type), "DataStore.updateFromServer: type:"+type, item);
				let typemap = itemstate.data[type];
				if ( ! typemap) {
					typemap = {};
					itemstate.data[type] = typemap;
				}
				if (item.id) {
					typemap[item.id] = item;
				} else if (item["@id"]) {
					// bleurgh, thing.org style ids -- which are asking for trouble :(
					typemap[item["@id"]] = item;
				} else {
					console.warn("No id?!", item, "from", res);
				}
			} catch(err) {
				// swallow and carry on
				console.error(err);
			}
		});
		this.update(itemstate);
		return res;
	} //./updateFromServer()


	/**
	 * get local, or fetch by calling fetchFn (but only once). 
	 * Does not call update here and now, so it can be used inside a React render().
	 * 
	 * Warning: This will not modify appstate except for the path given, and transient.
	 * So if you fetch a list of data items, they will not be stored into appstate.data.
	 * The calling method should do this. 
	 * NB: an advantage of this is that the server can return partial data (e.g. search results)
	 * without over-writing the fuller data.
	 * 
	 * @param path {String[]}
	 * @param fetchFn {Function} () -> Promise/value, which will be wrapped using promise-value PV()
	 * fetchFn MUST return the value for path, or a promise for it. It should NOT set DataStore itself.
	 * As a convenience hack, this method will extract `cargo` from fetchFn's return, so it can be used
	 * that bit more easily with Winterwell's "standard" json api back-end.
	 * @param messaging {?Boolean} If true, try to use Messaging.js to notify the user of failures.
	 * @returns {?value, promise} (see promise-value.js)
	 */
	fetch(path, fetchFn, messaging=true) { // TODO allow retry after 10 seconds
		let item = this.getValue(path);
		if (item!==null && item!==undefined) { 
			// Note: falsy or an empty list/object is counted as valid. It will not trigger a fresh load
			return PV(item);
		}
		// only ask once
		const fpath = ['transient', 'PromiseValue'].concat(path);
		const prevpv = this.getValue(fpath);
		if (prevpv) return prevpv;	
		let promiseOrValue = fetchFn();
		assert(promiseOrValue!==undefined, "fetchFn passed to DataStore.fetch() should return a promise or a value. Got: undefined. Missing return statement?");
		// Use PV to standardise the output from fetchFn()
		let pvPromiseOrValue = PV(promiseOrValue);
		// process the result async
		let promiseWithCargoUnwrap = pvPromiseOrValue.promise.then(res => {
			if ( ! res) return res;
			// HACK handle WW standard json wrapper: check success and unwrap cargo 			
			if (res.success === false) {
				// pass it to the fail() handler
				throw new Error(JSON.stringify(res.errors));
			}
			// TODO let's make unwrap a configurable setting
			if (res.cargo) {
				console.log("unwrapping cargo to store at "+path, res);
				res = res.cargo;
			}			
			return res;
		}).fail(err => {
			// what if anything to do here??
			console.warn("DataStore fetch fail", path, err);
			if (messaging && DataStore.Messaging && DataStore.Messaging.notifyUser) {
				DataStore.Messaging.notifyUser(err);
			}
			return err;
		});
		// wrap this promise as a PV
		const pv = PV(promiseWithCargoUnwrap);
		pv.promise.then(res => {
			// set the DataStore
			// This is done after the cargo-unwrap PV has resolved. So any calls to fetch() during render will get a resolved PV
			// even if res is null.
			this.setValue(path, res); // this should trigger an update (typically a React render update)
			// finally, clear the promise from DataStore
			this.setValue(fpath, null, false);
			return res;
		});
		this.setValue(fpath, pv, false);
		return pv;
	} // ./fetch()

	/**
	 * Remove any list(s) stored under ['list', type].
	 * 
	 * These lists are often cached results from the server - this method is called to invalidate the cache
	 * (and probably force a reload via other application-level code).
	 * 
	 * If more fine-grained control is provided, just call `setValue(['list', blah], null);` directly.
	 */
	invalidateList(type) {
		assMatch(type, String);
		const listWas = this.getValue(['list', type]);
		if (listWas) {
			this.setValue(['list', type], null);
			console.log('publish -> invalidate list', type, listWas);
		} else {
			console.log('publish -> no lists to invalidate');
		}
		// also remove any promises for these lists -- see fetch()		
		let ppath = ['transient', 'PromiseValue', 'list', type];
		this.setValue(ppath, null, false);
	}

} // ./Store

// NB: this is also in wwutils, but npm or something is being weird about versioning. Feb 2018
const is = x => x !== undefined && x !== null;

const DataStore = new Store();
// switch on data item edits => modified flag
DataStore.DATA_MODIFIED_PROPERTY = 'localStatus';
export default DataStore;
// accessible to debug
if (typeof(window) !== 'undefined') window.DataStore = DataStore;

/**
 * Store all the state in one big object??
 */
DataStore.update({
	data: {
		NGO: {},
		User: {},
		Donation: {}
	},
	draft: {
		NGO: {},
		User: {}
	},
	// Use list to store search results
	list: {

	},
	focus: {
		NGO: null,
		User: null,
	},	
	widget: {},
	misc: {
	},
	/** status of server requests, for displaying 'loading' spinners 
	 * Normally: transient.$item_id.status
	*/
	transient: {}
});
