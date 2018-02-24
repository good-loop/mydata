import React, { Component } from 'react';

// FormControl removed in favour of basic <inputs> while debugging input lag
import {InputGroup, DropdownButton, MenuItem } from 'react-bootstrap';

import {assert, assMatch} from 'sjtest';
import _ from 'lodash';
import Enum from 'easy-enums';
import { setHash, XId } from 'wwutils';
import PV from 'promise-value';
import Dropzone from 'react-dropzone';

import DataStore from '../plumbing/DataStore';
import ActionMan from '../plumbing/ActionMan';
import ServerIO from '../plumbing/ServerIO';
import printer from '../utils/printer';
import C from '../C';


const Misc = {};

/**
E.g. "Loading your settings...""
*/
Misc.Loading = ({text}) => (
	<div>
		<span className="glyphicon glyphicon-cog spinning" /> Loading {text || ''}...
	</div>
);

/**
 * 
 * @param {
 * 	TODO?? noPadding: {Boolean} switch off Bootstrap's row padding.
 * }
 */
Misc.Col2 = ({children}) => (
	<div className='container-fluid'>
	<div className='row'>
		<div className='col-md-6 col-sm-6'>{children[0]}</div><div className='col-md-6 col-sm-6'>{children[1]}</div>
	</div>
	</div>);

const CURRENCY = {
	gbp: "£",
	usd: "$"
};
/**
 * Money span, falsy displays as 0
 * 
 * @param amount {Money|Number}
 */
Misc.Money = ({amount, minimumFractionDigits, maximumFractionDigits=2, maximumSignificantDigits}) => {
	if ( ! amount) amount = 0;
	if (_.isNumber(amount) || _.isString(amount)) {
		amount = {value: amount, currency:'GBP'};
	}
	let value = amount? amount.value : 0;
	if (maximumFractionDigits===0) { // because if maximumSignificantDigits is also set, these two can conflict
		value = Math.round(value);
	}
	let snum = new Intl.NumberFormat(Settings.locale, 
		{maximumFractionDigits, minimumFractionDigits, maximumSignificantDigits}
	).format(value);
	// let snum;	
	// if ( ! precision) {
	// 	let sv2 = amount.value.toFixed(2);
	// 	snum = printer.prettyNumber2_commas(sv2);
	// } else {	
	// 	snum = printer.prettyNumber(amount.value, precision);
	// }
	if ( ! minimumFractionDigits) {
		// remove .0 and .00
		if (snum.substr(snum.length-2) === '.0') snum = snum.substr(0, snum.length-2);
		if (snum.substr(snum.length-3) === '.00') snum = snum.substr(0, snum.length-3);
	}
	// pad .1 to .10
	if (snum.match(/\.\d$/)) snum += '0';
	const currencyCode = (amount.currency || 'gbp').toLowerCase();
	return (
		<span className='money'>
			<span className='currency-symbol'>{CURRENCY[currencyCode]}</span>
			<span className='amount'>{snum}</span>
		</span>
	);
};
/**
 * Handle a few formats, inc gson-turned-a-Time.java-object-into-json
 * null is also accepted.
 */
Misc.Time = ({time}) => {
	if ( ! time) return null;
	try {
		if (_.isString(time)) {
			return <span>{new Date(time).toLocaleDateString()}</span>;			
		}
		if (time.ut) {
			return <span>{new Date(time.ut).toLocaleDateString()}</span>;
		}
		return <span>{printer.str(time)}</span>;
	} catch(err) {
		return <span>{printer.str(time)}</span>;
	}
};

/** eg a Twitter logo */
Misc.Logo = ({service, size, transparent, bgcolor, color}) => {
	assert(service, 'Misc.Logo');
	if (service==='twitter' || service==='facebook'|| service==='instagram') {
		return <Misc.Icon fa={service+"-square"} size={size==='small'? '2x' : '4x'} className={'color-'+service} />;
	}
	let klass = "img-rounded logo";
	if (size) klass += " logo-"+size;
	let file = '/img/'+service+'-logo.svg';
	if (service === 'instagram') file = '/img/'+service+'-logo.png';
	if (service === C.app.service) {
		file = C.app.logo;
	}
	return (
		<img alt={service} data-pin-nopin="true" className={klass} src={file} />
	);
}; // ./Logo

/**
 * Font-Awesome or Glyphicon icons
 */
Misc.Icon = ({glyph, fa, size, className, ...other}) => {	
	if (glyph) {
		return (<span className={'glyphicon glyphicon-'+glyph
								+ (size? ' fa-'+size : '')
								+ (className? ' '+className : '')} 
					aria-hidden="true" {...other} />);
	}
	return (<i className={'fa fa-'+fa + (size? ' fa-'+size : '') + (className? ' '+className : '') } 
				aria-hidden="true" {...other} />);
};


/**
 * Input bound to DataStore
 * 
 * @param saveFn {Function} {path, prop, item, value} You are advised to wrap this with e.g. _.debounce(myfn, 500).
 * NB: we cant debounce here, cos it'd be a different debounce fn each time.
 * label {?String}
 * @param path {String[]} The DataStore path to item, e.g. [data, NGO, id]
 * @param item The item being edited. Can be null, and it will be fetched by path.
 * @param prop The field being edited 
 * @param dflt {?Object} default value Beware! This may not get saved if the user never interacts.
 * @param modelValueFromInput {?Function} See standardModelValueFromInput
 * @param required {?Boolean} If set, this field should be filled in before a form submit. 
* 		TODO mark that somehow
 */
Misc.PropControl = ({type="text", label, help, ...stuff}) => {
	// label / help? show it and recurse
	// NB: Checkbox has a different html layout :( -- handled below
	if ((label || help) && ! Misc.ControlTypes.ischeckbox(type)) {
		// Minor TODO help block id and aria-described-by property in the input
		return (<div className="form-group">
			{label? <label>{label}</label> : null}
			<Misc.PropControl type={type} {...stuff} />
			{help? <span className="help-block">{help}</span> : null}
		</div>);
	}
	let {prop, path, item, bg, dflt, saveFn, modelValueFromInput, ...otherStuff} = stuff;
	if ( ! modelValueFromInput) modelValueFromInput = standardModelValueFromInput;
	assert( ! type || Misc.ControlTypes.has(type), 'Misc.PropControl: '+type);
	assert(_.isArray(path), 'Misc.PropControl: not an array:'+path);
	assert(path.indexOf(null)===-1 && path.indexOf(undefined)===-1, 'Misc.PropControl: null in path '+path);
	// // item ought to match what's in DataStore - but this is too noisy when it doesn't
	// if (item && item !== DataStore.getValue(path)) {
	// 	console.warn("Misc.PropControl item != DataStore version", "path", path, "item", item);
	// }
	if ( ! item) {
		item = DataStore.getValue(path) || {};
	}
	let value = item[prop]===undefined? dflt : item[prop];
	const proppath = path.concat(prop);
	// Checkbox?
	if (Misc.ControlTypes.ischeckbox(type)) {
		const onChange = e => {
			// console.log("onchange", e); // minor TODO DataStore.onchange recognise and handle events
			const val = e && e.target && e.target.checked;
			DataStore.setValue(proppath, val);
			if (saveFn) saveFn({path, prop, item, value: val});		
		};
		return (<Checkbox checked={value} onChange={onChange} {...otherStuff} label={label} />);
	}
	if (value===undefined) value = '';
	// £s
	// NB: This is a bit awkward code -- is there a way to factor it out nicely?? The raw vs parsed/object form annoyance feels like it could be a common case.
	if (type === 'Money') {
		let acprops = {prop, value, path, proppath, item, bg, dflt, saveFn, modelValueFromInput, ...otherStuff};
		return <PropControlMoney {...acprops} />;
	} // ./£
	// text based
	const onChange = e => {
		console.log("event", e, e.type);
		// TODO a debounced property for "do ajax stuff" to hook into. HACK blur = do ajax stuff
		DataStore.setValue(['transient', 'doFetch'], e.type==='blur');	
		let mv = modelValueFromInput(e.target.value, type, e.type);
		DataStore.setValue(proppath, mv);
		if (saveFn) saveFn({path:path, value:mv});
		e.preventDefault();
		e.stopPropagation();
	};
	if (type === 'arraytext') {
		// Pretty hacky: Value stored as ["one", "two", "three"] but displayed as "one two three"
		// Currently used for entering list of unit-variants for publisher
		const arrayChange = e => {
			const oldString = DataStore.getValue(proppath);
			const newString = e.target.value;

			// Split into space-separated tokens
			let newValue = newString.split(' ');
			// Remove falsy entries, if deleting (ie newString is substring of oldString) but not if adding
			// allows us to go 'one' (['one']) -> "one " ('one', '') -> "one two" ('one', 'two')
			if (oldString.indexOf(newString) >= 0) {
				newValue = newValue.filter(val => val);
			}
			
			DataStore.setValue(proppath, newValue);
			if (saveFn) saveFn({path});
			e.preventDefault();
			e.stopPropagation();
		};
		return <FormControl type={type} name={prop} value={value.join(' ')} onChange={arrayChange} {...otherStuff} />;
	}
	if (type==='textarea') {
		return <textarea className="form-control" name={prop} onChange={onChange} {...otherStuff} value={value} />;
	}
	if (type==='json') {
		let spath = ['transient'].concat(proppath);
		let svalue = DataStore.getValue(spath) || JSON.stringify(value);
		const onJsonChange = e => {
			console.log("event", e.target && e.target.value, e, e.type);
			DataStore.setValue(spath, e.target.value);
			try {				
				let vnew = JSON.parse(e.target.value);
				DataStore.setValue(proppath, vnew);
				if (saveFn) saveFn({path:path});
			} catch(err) {
				console.warn(err);
				// TODO show error feedback
			}			
			e.preventDefault();
			e.stopPropagation();
		};
		return <textarea className="form-control" name={prop} onChange={onJsonChange} {...otherStuff} value={svalue} />;
	}
	if (type==='img') {
		return (<div>
			<FormControl type='url' name={prop} value={value} onChange={onChange} {...otherStuff} />
			<div className='pull-right' style={{background: bg, padding:bg?'20px':'0'}}><Misc.ImgThumbnail url={value} style={{background:bg}} /></div>
			<div className='clearfix' />
		</div>);
	}
	if (type==='url') {
		return (<div>
			<FormControl type='url' name={prop} value={value} onChange={onChange} onBlur={onChange} {...otherStuff} />
			<div className='pull-right'><small>{value? <a href={value} target='_blank'>open in a new tab</a> : null}</small></div>
			<div className='clearfix' />
		</div>);
	}
	// date
	// NB dates that don't fit the mold yyyy-MM-dd get ignored by the date editor. But we stopped using that
	//  && value && ! value.match(/dddd-dd-dd/)
	if (type==='date') {
		// parsing incomplete dates causes NaNs
		// let date = new Date(value);
		// let nvalue = date.getUTCFullYear()+'-'+oh(date.getUTCMonth())+'-'+oh(date.getUTCDate());
		// value = nvalue;
		let datePreview = value? 'not a valid date' : null;
		try {
			let date = new Date(value);
			datePreview = date.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
		} catch (er) {
			// bad date
		}
		// let's just use a text entry box -- c.f. bugs reported https://github.com/winterstein/sogive-app/issues/71 & 72
		// Encourage ISO8601 format
		if ( ! otherStuff.placeholder) otherStuff.placeholder = 'yyyy-mm-dd, e.g. today is '+isoDate(new Date());
		return (<div>
			<FormControl type='text' name={prop} value={value} onChange={onChange} {...otherStuff} />
			<div className='pull-right'><i>{datePreview}</i></div>
			<div className='clearfix' />
		</div>);
	}
	if (type==='select') {
		const options = otherStuff.options;
		const defaultValue = otherStuff.defaultValue;
		delete otherStuff.options;
		delete otherStuff.defaultValue;

		assert(options, 'Misc.PropControl: no options for select '+[prop, otherStuff]);
		assert(options.map, 'Misc.PropControl: options not an array '+options);
		// Make an option -> nice label function
		// the labels prop can be a map or a function
		let labels = otherStuff.labels;
		delete otherStuff.labels;		
		let labeller = v => v;
		if (labels) {
			labeller = _.isFunction(labels)? labels : v => labels[v] || v;
		}
		// make the options html
		let domOptions = options.map(option => <option key={"option_"+option} value={option} >{labeller(option)}</option>);
		let sv = value || defaultValue;
		return (
			<select className='form-control' name={prop} value={sv} onChange={onChange} {...otherStuff} >
				{sv? null : <option></option>}
				{domOptions}
			</select>
		);
	}
	// normal
	// NB: type=color should produce a colour picker :)
	return <FormControl type={type} name={prop} value={value} onChange={onChange} {...otherStuff} />;
}; //./PropControl

Misc.ControlTypes = new Enum("img imgUpload textarea text select autocomplete password email url color Money checkbox"
							+" yesNo location date year number arraytext address postcode json");

/**
 * Strip commas £/$/euro and parse float
 * @param {*} v 
 * @returns Number. undefined/null are returned as-is.
 */
const numFromAnything = v => {
	if (v===undefined || v===null) return v;
	if (_.isNumber(v)) return v;
	// strip any commas, e.g. 1,000
	if (_.isString(v)) {
		v = v.replace(/,/g, "");
		// £ / $ / euro
		v = v.replace(/^(-)?[£$\u20AC]/, "$1");
	}
	return parseFloat(v);
};

const Checkbox = ({label, value, size, onChange, ...otherStuff}) => {
	if (value===undefined) value = false;
	if ( ! size) size='lg'; // default large checkbox
	let style ={};
	if (size==='lg') {
		style.width='20px';
		style.height='80%';
	}
	assert( ! otherStuff.children, otherStuff);
	return (<div className="form-check">		
		<input style={style} className={'form-check-input'+(size?' form-control-'+size : '')} 
			type="checkbox" checked={value} onChange={onChange} {...otherStuff} />
		<label className='form-check-label'>{label}</label>
	</div>);
};

/**
 * Convert inputs (probably text) into the model's format (e.g. numerical)
 * @param eventType "change"|"blur" More aggressive edits should only be done on "blur"
 * @returns the model value/object to be stored in DataStore
 */
const standardModelValueFromInput = (inputValue, type, eventType) => {
	if ( ! inputValue) return inputValue;
	// numerical?
	if (type==='year') {
		return parseInt(inputValue);
	}
	if (type==='number') {
		return numFromAnything(inputValue);
	}
	// add in https:// if missing
	if (type==='url' && eventType==='blur') {
		if (inputValue.indexOf('://') === -1 && inputValue[0] !== '/' && 'http'.substr(0, inputValue.length) !== inputValue.substr(0,4)) {
			inputValue = 'https://'+inputValue;
		}
	}
	return inputValue;
};


/**
 * @param d {Date}
 * @returns {String}
 */
const isoDate = (d) => d.toISOString().replace(/T.+/, '');

/**
 * 
 * @param {
 * 	url: {?String} The image url. If falsy, return null
 * 	style: {?Object}
 * }
 */
Misc.ImgThumbnail = ({url, style}) => {
	if ( ! url) return null;
	// add in base (NB this works with style=null)
	style = Object.assign({width:'100px', maxHeight:'200px'}, style);
	return (<img className='img-thumbnail' style={style} alt='thumbnail' src={url} />);
};

Misc.VideoThumbnail = ({url}) => url? <video width={200} height={150} src={url} controls /> : null;

/**
 * This replaces the react-bootstrap version 'cos we saw odd bugs there. 
 * Plus since we're providing state handling, we don't need a full component.
 */
const FormControl = ({value, type, required, ...otherProps}) => {
	if (value===null || value===undefined) value = '';
	if (type==='color' && ! value) { 
		// workaround: this prevents a harmless but annoying console warning about value not being an rrggbb format
		return <input className='form-control' type={type} {...otherProps} />;	
	}
	// add css classes for required fields
	let klass = 'form-control'+ (required? (value? ' form-required' : ' form-required blank') : '');
	return <input className={klass} type={type} value={value} {...otherProps} />;
};

/** Hack: a debounced auto-save function for the save/publish widget */
const saveDraftFn = _.debounce(
	({type, id}) => {
		ActionMan.saveEdits(type, id);
		return true;
	}, 5000);


/**
 * Just a convenience for a Bootstrap panel
 */
Misc.Card = ({title, glyph, icon, children, onHeaderClick, collapse, titleChildren, ...props}) => {
	const h3 = (<h3 className="panel-title">{icon? <Misc.Icon glyph={glyph} fa={icon} /> : null} 
		{title || ''} {onHeaderClick? <Misc.Icon className='pull-right' glyph={'triangle-'+(collapse?'bottom':'top')} /> : null}
	</h3>);
	return (<div className="Card panel panel-default">
		<div className={onHeaderClick? "panel-heading btn-link" : "panel-heading"} onClick={onHeaderClick} >
				{h3}
				{ titleChildren }
		</div>
		<div className={'panel-body' + (collapse? ' collapse' : '') }>
			{children}
		</div>
	</div>);
};

/**
 * 
 * @param {?String} widgetName - Best practice is to give the widget a name.
 * @param {Misc.Card[]} children
 */
Misc.CardAccordion = ({widgetName, children, multiple, start}) => {
	// NB: React-BS provides Accordion, but it does not work with modular panel code. So sod that.
	// TODO manage state
	const wcpath = ['widget', widgetName || 'CardAccordion', 'open'];
	let open = DataStore.getValue(wcpath);
	if ( ! open) open = [true]; // default to first kid open
	if ( ! children) {
		return (<div className='CardAccordion'></div>);
	}
	assert(_.isArray(open), "Misc.jsx - CardAccordion - open not an array", open);
	// filter null, undefined
	children = children.filter(x => !! x);
	const kids = React.Children.map(children, (Kid, i) => {
		let collapse = ! open[i];
		let onHeaderClick = e => {
			if ( ! multiple) {
				// close any others
				open = [];
			}
			open[i] = collapse;
			DataStore.setValue(wcpath, open);
		};
		// clone with click
		return React.cloneElement(Kid, {collapse, onHeaderClick: onHeaderClick});
	});
	return (<div className='CardAccordion'>{kids}</div>);
};

/**
 * save buttons
 * TODO auto-save on edit -- copy from sogive
 */
Misc.SavePublishDiscard = ({type, id, hidden }) => {
	assert(C.TYPES.has(type), 'Misc.SavePublishDiscard');
	assMatch(id, String);
	let localStatus = DataStore.getLocalEditsStatus(type, id);
	let isSaving = C.STATUS.issaving(localStatus);	
	let item = DataStore.getData(type, id);
	// request a save?
	if (C.STATUS.isdirty(localStatus) && ! isSaving) {
		saveDraftFn({type,id});
	}
	// if nothing has been edited, then we can't publish, save, or discard
	// NB: modified is a persistent marker, managed by the server, for draft != published
	let noEdits = item && C.KStatus.isPUBLISHED(item.status) && C.STATUS.isclean(localStatus) && ! item.modified;
	// Sometimes we just want to autosave drafts!
	if (hidden) return <span />;
	const vis ={visibility: isSaving? 'visible' : 'hidden'};

	return (<div className='SavePublishDiscard' title={item && item.status}>
		<div><small>Status: {item && item.status}, Modified: {localStatus} {isSaving? "saving...":null}</small></div>
		<button className='btn btn-default' disabled={isSaving || C.STATUS.isclean(localStatus)} onClick={() => ActionMan.saveEdits(type, id)}>
			Save Edits <span className="glyphicon glyphicon-cd spinning" style={vis} />
		</button>
		&nbsp;
		<button className='btn btn-primary' disabled={isSaving || noEdits} onClick={() => ActionMan.publishEdits(type, id)}>
			Publish Edits <span className="glyphicon glyphicon-cd spinning" style={vis} />
		</button>
		&nbsp;
		<button className='btn btn-warning' disabled={isSaving || noEdits} onClick={() => ActionMan.discardEdits(type, id)}>
			Discard Edits <span className="glyphicon glyphicon-cd spinning" style={vis} />
		</button>
		&nbsp;
		<button className='btn btn-danger' disabled={isSaving} onClick={() => ActionMan.delete(type, id)} >
			Delete <span className="glyphicon glyphicon-cd spinning" style={vis} />
		</button>
	</div>);
};

/**
 * 
 * @param {Boolean} once If set, this button can only be clicked once.
 */
Misc.SubmitButton = ({path, url, once, className='btn btn-primary', onSuccess, children}) => {
	assMatch(url, String);
	assMatch(path, 'String[]');
	const tpath = ['transient','SubmitButton'].concat(path);

	let formData = DataStore.getValue(path);
	// DataStore.setValue(tpath, C.STATUS.loading);
	const params = {
		data: formData
	};
	const doSubmit = e => {
		DataStore.setValue(tpath, C.STATUS.saving);
		ServerIO.load(url, params)
			.then(res => {
				DataStore.setValue(tpath, C.STATUS.clean);
			}, err => {
				DataStore.setValue(tpath, C.STATUS.dirty);
			});
	};
	
	let localStatus = DataStore.getValue(tpath);
	// show the success message instead?
	if (onSuccess && C.STATUS.isclean(localStatus)) {
		return onSuccess;
	}
	let isSaving = C.STATUS.issaving(localStatus);	
	const vis ={visibility: isSaving? 'visible' : 'hidden'};
	let disabled = isSaving || (once && localStatus);
	let title ='Submit the form';
	if (disabled) title = isSaving? "saving..." : "Submitted :) To avoid errors, you cannot re-submit this form";	
	return (<button onClick={doSubmit} 
		className={className}
		disabled={disabled}
		title={title}
	>
		{children}
		<span className="glyphicon glyphicon-cd spinning" style={vis} />
	</button>);
};

export default Misc;
// // TODO rejig for export {
// 	PropControl: Misc.PropControl
// };
