'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var colors = _interopDefault(require('colors'));
var jsdom = require('jsdom');
var diff = _interopDefault(require('fast-diff'));
var crypto = require('crypto');
var readline = _interopDefault(require('readline-sync'));

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

/**
 * Merges all objects provided as parameters into the first parameter object
 *
 * @param  {...Object} args list of arguments
 * @return {Object}         the merged object (same as first argument)
 */
function merge(target) {
	for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		args[_key - 1] = arguments[_key];
	}

	args.forEach(function (arg) {
		for (var all in arg) {
			if (typeof HTMLElement !== 'undefined' && arg instanceof HTMLElement || typeof propDetails(arg, all).value !== 'undefined' && (!target[all] || propDetails(target, all).writable)) {
				target[all] = arg[all];
			}
		}
	});

	return target;
}

function propDetails(obj, attribute) {
	return isObj(obj) && Object.getOwnPropertyDescriptor(obj, attribute) || {};
}

/**
 * Creates a diff of two JS objects. Includes attribute position check.
 *
 * @param  {Object} objA	the object to be compared
 * @param  {Object} objB 	the object to compare with
 * @return {Object,Boolean} false if both objects are deep equal, else the values of what is different
 */


function error$1(method, tag, parentException) {
	if (parentException) {
		throw new Error('Error while calling ' + method + ' function of ' + tag + ': ' + (parentException.message || parentException), parentException.fileName, parentException.lineNumber);
	} else {
		parentException = tag;
		throw new Error(method + ': ' + (parentException.message || parentException), parentException.fileName, parentException.lineNumber);
	}
}

/**
 * Checks if the given arguments are the provided types, if they do no match, an exception is thrown.
 *
 * @param  {Array} args 	list of arguments provided to callee
 * @param  {Array} types 	list of data types expected for the provided arguments
 * @param  {String} api  	name of the API (callee name)
 */


/**
 * makes sure that accessing attributes on an unknown data value is safe
 *
 * @param  {Mixed} obj 	data to made safe for attribute access
 * @return {Object}     will always return an object
 */


function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0;
		return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
	});
}
var isObj = function isObj(obj) {
	return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
};
var isFn = function isFn(fn) {
	return typeof fn === 'function';
};
var emptyFunc = function emptyFunc() {};

var eventQueue = {};

function trigger(name, data) {
	if (!eventQueue[name]) return;
	for (var index in eventQueue[name]) {
		name.indexOf('--event-') && trigger('--event-trigger', { name: name, fn: eventQueue[name][index], data: data });
		var result = eventQueue[name][index](data);
		if (result === false) break;
	}
}

function on(name, fn) {
	if (!eventQueue[name]) {
		eventQueue[name] = [];
	}
	eventQueue[name].push(fn);
	name.indexOf('--event-') && trigger('--event-register', { name: name, fn: fn });
}

function off(name, fn) {
	if (!isFn(fn)) {
		delete eventQueue[name];
		return name.indexOf('--event-') && trigger('--event-unregister', { name: name });
	}
	for (var index in eventQueue[name]) {
		if (eventQueue[name][index] === fn) {
			delete eventQueue[name][index];
			return name.indexOf('--event-') && trigger('--event-unregister', { name: name, fn: fn });
		}
	}
}

function one(name, fn) {
	on(name, function self() {
		fn.apply(this, arguments);
		off(name, self);
	});
}

function attachEvent(el, events, host) {
	if (!isFn(el.addEventListener)) return;
	var findEl = function findEl(selector, target) {
		var node = [].slice.call(el.querySelectorAll(selector));
		while (node.length > 0 && target !== host) {
			if (node.indexOf(target) >= 0) return node[node.indexOf(target)];
			target = target.parentNode;
		}
		return false;
	};
	events.forEach(function (eventObj) {
		Object.keys(eventObj.handlers).forEach(function (event) {
			el.addEventListener(event, function (e) {
				var target = void 0;
				if (eventObj.selector === ':host' || (target = findEl(eventObj.selector, e.target))) {
					target && (target.getHost = function () {
						return host.getHost();
					});
					eventObj.handlers[event].call(target || host, e);
				}
			}, false);
		});
	});
}

var tagFilter = [];
var tagsCreated = [];
var dataResolver = function dataResolver(attr, value) {
	return attr;
};

function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

function setDataResolver(resolver) {
	dataResolver = resolver;
}

function Tag(tagName, attributes, children) {
	tagName = tagName.toLowerCase();
	var tag = {
		tagName: tagName,
		attributes: attributes || {},
		children: children || []
	};
	if (tagFilter.indexOf(tagName) >= 0) tagsCreated.push(tag);
	return tag;
}

function getElementsByTagName(name, dom) {
	var result = [];
	name = (name || '').toLowerCase();
	if (typeof dom.getElementsByTagName === 'function') return [].slice.call(dom.getElementsByTagName(name));

	if (dom.children) {
		result = result.concat(dom.children.filter(function (child) {
			return child.tagName && child.tagName.toLowerCase() === name;
		}));
		dom.children.forEach(function (child) {
			result = result.concat(getElementsByTagName(name, child));
		});
	}
	return result;
}

function setFilter(filter) {
	tagFilter = filter;
}

function getTagsCreated() {
	var created = tagsCreated;
	tagsCreated = [];
	return created;
}

function getInnerHTML(node) {
	if (!node.children) return '';
	if (!isArray(node.children)) node.children = [node.children];

	return (isArray(node) && node || node.children).map(function (child) {
		if ((typeof child === 'undefined' ? 'undefined' : _typeof(child)) !== 'object') {
			return '' + child;
		} else if (isArray(child)) {
			return getInnerHTML(child);
		} else {
			var attributes = [''].concat(Object.keys(child.attributes).map(function (attr) {
				if (_typeof(child.attributes[attr]) === 'object') {
					return attr + '="--' + dataResolver(attr, child.attributes[attr]) + '--"';
				} else {
					return attr + '="' + child.attributes[attr] + '"';
				}
			}));
			return '<' + child.tagName + attributes.join(' ') + '>' + getInnerHTML(child) + '</' + child.tagName + '>';
		}
	}).join('');
}

function createElement(node, document) {
	var tag = void 0;
	if ((typeof node === 'undefined' ? 'undefined' : _typeof(node)) !== 'object') {
		tag = document.createTextNode('' + node);
	} else {
		tag = document.createElement(node.tagName);
		Object.keys(node.attributes).forEach(function (attr) {
			tag.setAttribute(attr, node.attributes[attr]);
		});
		if (node.__vdom) {
			trigger('--zino-initialize-node', { tag: tag, node: node });
		}
		tag.innerHTML = getInnerHTML(node);
	}

	return tag;
}

function applyDOM(dom, vdom, document) {
	if (!isArray(vdom)) {
		if (!isArray(vdom.children)) vdom.children = [vdom.children];
		if (vdom.tagName !== dom.tagName.toLowerCase()) {
			dom.parentNode.replaceChild(createElement(vdom, document), dom);
		} else {
			Object.keys(vdom.attributes).forEach(function (attr) {
				if (_typeof(vdom.attributes[attr]) !== 'object') {
					if (dom.getAttribute(attr) != vdom.attributes[attr]) {
						dom.setAttribute(attr, vdom.attributes[attr]);
					}
				} else {
					if (dom.getAttribute(attr) && dom.getAttribute(attr).match(/^--|--$/g)) {
						var id = dataResolver(attr, vdom.attributes[attr], dom.getAttribute(attr).replace(/^--|--$/g, ''));
						dom.setAttribute(attr, '--' + id + '--');
					}
				}
			});
			if (dom.attributes.length > Object.keys(vdom.attributes)) {
				[].forEach.call(dom.attributes, function (attr) {
					if (typeof vdom.attributes[attr.name] === 'undefined') {
						dom.removeAttribute(attr.name);
					}
				});
			}
		}
	}
	var children = isArray(vdom) ? vdom : vdom.children;
	children.forEach(function (node, index) {
		if (isArray(node)) return applyDOM(dom, node, document);
		if (typeof dom.childNodes[index] === 'undefined') {
			// does not exist
			dom.appendChild(createElement(node, document));
		} else if (dom.childNodes[index].nodeType === 3) {
			// is a text node
			if (typeof node === 'string' && dom.childNodes[index].nodeValue !== node) {
				dom.childNodes[index].nodeValue = node;
			} else if (typeof node !== 'string') {
				dom.replaceChild(createElement(node, document), dom.childNodes[index]);
			}
		} else if (dom.childNodes[index].nodeType === 1) {
			// is a normal HTML tag
			if ((typeof node === 'undefined' ? 'undefined' : _typeof(node)) === 'object') {
				applyDOM(dom.childNodes[index], node, document);
			} else {
				dom.replaceChild(createElement(node, document), dom.childNodes[index]);
			}
		}
	});
	if (dom.childNodes.length > children.length) {
		// remove superfluous child nodes
		[].slice.call(dom.childNodes, children.length).forEach(function (child) {
			return dom.removeChild(child);
		});
	}
}

var tagRegistry = {};
var dataRegistry = {};
var defaultFunctions = {
	'props': {},
	'mount': emptyFunc,
	'unmount': emptyFunc,
	'render': emptyFunc,

	getHost: function getHost() {
		return this;
	},
	setProps: function setProps(name, value) {
		var tag = this.getHost();
		if (isObj(name)) {
			merge(tag.props, name);
		} else {
			tag.props[name] = value;
		}
		if (!tag.mounting) {
			trigger('--zino-rerender-tag', tag);
		}
	}
};

var renderOptions = {
	resolveData: function resolveData(key, value, oldID) {
		var id = uuid();
		if (oldID) {
			// unregister old entry
			delete dataRegistry[oldID];
		}
		dataRegistry[id] = value;
		return id;
	}
};

function registerTag(fn, document) {
	var firstElement = fn(Tag),
	    tagName = firstElement.tagName;

	if (tagRegistry[tagName]) {
		// tag is already registered
		return;
	}

	handleStyles(firstElement);
	firstElement.functions = merge({}, defaultFunctions, firstElement.functions);
	tagRegistry[tagName] = firstElement;

	// initialize all occurences in provided context
	document && [].slice.call(getElementsByTagName(tagName, document)).forEach(function (tag) {
		return initializeTag(tag, tagRegistry[tagName]);
	});
}

function mount(tag, ignoreRender) {
	if (!tag.tagName) return;
	var entry = tagRegistry[tag.tagName.toLowerCase()];
	if (!entry || tag.getAttribute('__ready')) return;
	if (ignoreRender) entry.functions.render = emptyFunc;
	return initializeTag.call(ignoreRender ? { noEvents: true } : this, tag, entry);
}

function render(tag) {
	var subEvents = renderTag(tag);
	attachSubEvents(subEvents, tag);
}

function flushRegisteredTags() {
	tagRegistry = {};
}

function initializeTag(tag, registryEntry) {
	// check if the tag has been initialized already
	if (tag.__vdom || !registryEntry) return;
	var functions = registryEntry.functions,
	    isRendered = void 0;

	// if it has been pre-rendered
	if (tag.children.length > 0 && tag.children[0].attributes && tag.children[0].attributes['class'] === '-shadow-root') {
		var sibling = tag.children[1];
		// remove original HTML content
		if (sibling && sibling.className === '-original-root') {
			tag.__i = sibling.innerHTML;
			setElementAttr(sibling, tag);
			sibling.parentNode.removeChild(sibling);
		}
		isRendered = true;
	} else {
		tag.__i = tag.ownerDocument ? tag.innerHTML : getInnerHTML(tag);
		setElementAttr(tag);
		tag.innerHTML = '<div class="-shadow-root"></div>';
	}
	trigger('--zino-initialize-node', { tag: tag, node: functions });
	tag.__vdom = {};

	// render the tag's content
	var subEvents = !isRendered && renderTag.call(this, tag) || { events: [] };

	// attach events
	var hostEvents = [],
	    events = functions.events || [],
	    childEvents = Object.keys(events).filter(function (all) {
		var isNotSelf = all !== ':host' && all !== tag.tagName;
		if (!isNotSelf) hostEvents.push({ handlers: events[all], selector: all });
		return isNotSelf;
	}).map(function (e) {
		return { selector: e, handlers: events[e] };
	});

	subEvents.events = subEvents.events.concat({ childEvents: childEvents, hostEvents: hostEvents, tag: this && this.noEvents ? tag.tagName : tag });

	if (!tag.attributes.__ready) {
		if (isFn(tag.__s)) {
			tag.__s('__ready', true);
		} else {
			tag.attributes['__ready'] = true;
		}
	}
	if (!this || this.noEvents !== true) {
		// attach sub events
		attachSubEvents(subEvents, tag);
	} else {
		return subEvents;
	}
}

function initializeNode(_ref) {
	var tag = _ref.tag,
	    functions = _ref.node;

	// copy all defined functions/attributes
	for (var all in functions) {
		var entry = functions[all];
		if (['mount', 'unmount', 'events', 'render'].indexOf(all) < 0) {
			if (isFn(entry)) {
				tag[all] = entry.bind(tag);
			} else {
				tag[all] = entry;
			}
		}
	}
	// define basic properties
	Object.defineProperty(tag, 'body', {
		set: function set(val) {
			tag.__i = val;
			setElementAttr(tag);
			trigger('--zino-rerender-tag', tag.getHost());
		},
		get: function get() {
			return tag.__i;
		}
	});
	tag.__s = tag.setAttribute;
	tag.setAttribute = function (attr, val) {
		if (isFn(this.__s)) {
			this.__s(attr, val);
		} else {
			this.attributes[attr] = val;
		}
		trigger('--zino-rerender-tag', this);
	};

	// call mount callback
	tag.props = merge({}, functions.props, getAttributes(tag, true));

	if (tag.ownerDocument) {
		try {
			tag.mounting = true;
			functions.mount.call(tag);
			delete tag.mounting;
		} catch (e) {
			error$1('mount', tag.tagName, e);
		}
	}
}

function renderTag(tag) {
	var registryEntry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : tagRegistry[tag.tagName.toLowerCase()];

	var events = [],
	    renderCallbacks = [],
	    renderedSubElements = [],
	    renderedDOM = void 0;

	// do the actual rendering of the component
	setDataResolver(renderOptions.resolveData);
	var data = getAttributes(tag);
	if (isFn(registryEntry.render)) {
		setFilter(Object.keys(tagRegistry));
		renderedDOM = Tag('div', { 'class': '-shadow-root' }, registryEntry.render.call(tag, data));
	} else {
		throw new Error('No render function provided in component ' + tag.tagName);
	}

	// render all contained sub components
	renderedSubElements = renderedSubElements.concat(getTagsCreated());
	renderedSubElements.forEach(function (subEl) {
		var subElEvents = initializeTag.call({
			noRenderCallback: true,
			noEvents: true
		}, subEl, tagRegistry[subEl.tagName]);
		renderedSubElements = renderedSubElements.concat(getTagsCreated());
		events = events.concat(subElEvents.events);
		renderCallbacks = renderCallbacks.concat(subElEvents.renderCallbacks);
	});

	if (tag.attributes.__ready && tag.ownerDocument) {
		// has been rendered before, so just apply diff
		applyDOM(tag.children[0], renderedDOM, tag.ownerDocument);
	} else {
		// simply render everything inside
		if (tag.ownerDocument) {
			tag.children[0].innerHTML = getInnerHTML(renderedDOM);
		} else {
			tag.children[0] = renderedDOM;
		}
	}
	tag.__vdom = renderedDOM;
	tag.__subElements = renderedSubElements;

	renderedSubElements.length > 0 && (tag.querySelectorAll && [].slice.call(tag.querySelectorAll('[__ready]')) || renderedSubElements).forEach(function (subEl, index) {
		merge(subEl, renderedSubElements[index]);
		if (subEl.ownerDocument) {
			initializeNode({ tag: subEl, node: tagRegistry[subEl.tagName.toLowerCase()].functions });
		}
		renderedSubElements[index].getHost = defaultFunctions.getHost.bind(subEl);
	});

	if (!this || !this.noRenderCall) {
		renderCallbacks.forEach(function (callback) {
			return callback();
		});
		registryEntry.functions.render.call(tag);
	} else {
		renderCallbacks.push(registryEntry.functions.render.bind(tag));
	}
	return { events: events, renderCallbacks: renderCallbacks, data: data };
}

function attachSubEvents(subEvents, tag) {
	var count = {};
	subEvents.events.forEach(function (event) {
		var el = event.tag;
		if (!isObj(el)) {
			count[el] = (count[el] || 0) + 1;
			el = tag.querySelectorAll(el)[count[el] - 1];
		}
		if (!el.children[0].__eventsAttached) {
			attachEvent(el.children[0], event.childEvents, el);
			attachEvent(el, event.hostEvents, el);
			el.children[0].__eventsAttached = true;
		}
		isFn(el.onready) && el.onready();
	});
}

function unmountTag(tag) {
	var name = (tag.tagName || '').toLowerCase(),
	    entry = tagRegistry[name];
	if (entry) {
		[].forEach.call(tag.nodeType === 1 && tag.attributes || Object.keys(tag.attributes).map(function (attr) {
			return { name: attr, value: tag.attributes[attr] };
		}), function (attr) {
			// cleanup saved data
			if (attr.name.indexOf('data-') >= 0) {
				delete dataRegistry[attr.value];
			}
		});
		try {
			entry.functions.unmount.call(tag);
		} catch (e) {
			error$1('Unable to unmount tag ' + name, e);
		}
	}
}

function getAttributes(tag, propsOnly) {
	var attrs = { props: tag.props, element: tag.element, styles: tag.styles, body: tag.__i },
	    props = {};

	[].forEach.call(tag.nodeType === 1 && tag.attributes || Object.keys(tag.attributes).map(function (attr) {
		return { name: attr, value: tag.attributes[attr] };
	}), function (attribute) {
		var isComplex = attribute.name.indexOf('data-') >= 0 && typeof attribute.value === 'string' && attribute.value.substr(0, 2) === '--';
		attrs[attribute.name] || (attrs[attribute.name] = isComplex ? dataRegistry[attribute.value.replace(/^--|--$/g, '')] : attribute.value);
		if (attribute.name.indexOf('data-') === 0) {
			props[attribute.name.replace(/^data-/g, '').replace(/(\w)-(\w)/g, function (g, m1, m2) {
				return m1 + m2.toUpperCase();
			})] = attrs[attribute.name];
		}
	});

	if (propsOnly) return props;
	return attrs;
}

function setElementAttr(source) {
	var target = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : source;

	var baseAttrs = {};
	[].forEach.call(source.children, function (el) {
		if (!el.tagName) return;
		var name = el.tagName.toLowerCase();
		if (baseAttrs[name]) {
			if (!baseAttrs[name].isArray) {
				baseAttrs[name] = [baseAttrs[name]];
				baseAttrs[name].isArray = true;
			}
			baseAttrs[name].push(el);
		} else {
			baseAttrs[name] = el;
		}
	});
	target.element = baseAttrs;
}

function handleStyles(element) {
	var tagName = element.tagName;
	trigger('publish-style', (element.styles || []).map(function (style) {
		var code = style;
		return code.replace(/[\r\n]*([^@%\{;\}]+?)\{/gm, function (global, match) {
			var selectors = match.split(',').map(function (selector) {
				selector = selector.trim();
				if (selector.match(/:host\b/) || selector.match(new RegExp('^\\s*' + tagName + '\\b')) || selector.match(/^\s*(?:(?:\d+%)|(?:from)|(?:to)|(?:@\w+)|\})\s*$/)) {
					return selector;
				}
				return tagName + ' ' + selector;
			});
			return global.replace(match, selectors.join(','));
		}).replace(/:host\b/gm, tagName) + '\n';
	}).join('\n'));
}

on('--zino-initialize-node', initializeNode);
on('--zino-unmount-tag', unmountTag);
on('--zino-mount-tag', mount);

var tagRegExp = /<(\/?)([\w-]+)([^>]*?)(\/?)>/g;
var attrRegExp = /([\w_-]+)=(?:'([^']*?)'|"([^"]*?)")/g;
var commentRegExp = /<!--(?:[^-]|-[^-])*-->/g;
var syntax = /\{\{\s*([^\}]+)\s*\}\}\}?/g;
var safeAccess$1 = 'function safeAccess(obj, attrs, escape) {\n\tif (!attrs) return obj;\n\tif (attrs[0] === \'.\') {\n\t\treturn obj[attrs];\n\t}\n\tattrs = attrs.split(\'.\');\n\twhile (attrs.length > 0 && typeof (obj = obj[attrs.shift()]) !== \'undefined\');\n\tif (typeof obj === \'string\' && escape === true) {\n\t\treturn obj.replace(/&/g, \'&amp;\').replace(/</g, \'&lt;\').replace(/"/g, \'&quot;\').replace(/>/g, \'&gt;\');\n\t} else if (typeof obj === \'function\') {\n\t\treturn obj.call(instance);\n\t} else {\n\t\treturn obj || \'\';\n\t}\n}';
var toArray$1 = 'function toArray(data, value) {\n\tvar dataValue = safeAccess(data, value);\n\tif (dataValue) {\n\t\tif (Object.prototype.toString.call(dataValue) === \'[object Array]\') {\n\t\t\treturn dataValue;\n\t\t} else if (typeof dataValue === \'function\') {\n\t\t\treturn dataValue();\n\t\t} else return [dataValue];\n\t} else {\n\t\treturn [];\n\t}\n}';
var spread = 'function spread(array) {\n\tvar result = [];\n\tarray.forEach(function(entry) {\n\t\tresult = result.concat(entry);\n\t});\n\treturn result;\n}';
var merge$1 = 'function merge(target) {\n\t[].slice.call(arguments, 1).forEach(function (arg) {\n\t\tfor (var all in arg) {\n\t\t\ttarget[all] = arg[all];\n\t\t}\n\t});\n\n\treturn target;\n}';
var renderStyle = 'function renderStyle(value, context) {\n\tvar style = \'\';\n\t\ttransform = function(val) {\n\t\t\tif (typeof val === \'function\') return transform(val.apply(context));\n\t\t\treturn val + (typeof val === \'number\' && val !== null ? context.styles && context.styles.defaultUnit || \'px\' : \'\');\n\t\t};\n\n\tif (typeof value === \'object\') {\n\t\tfor (var all in value) {\n\t\t\tstyle += all.replace(/[A-Z]/g, function(g){ return \'-\' + g.toLowerCase()}) + \':\' + transform(value[all]) + \';\';\n\t\t}\n\t}\n\n\treturn style;\n}';
var baseCode = 'function(Tag) {\n\tvar instance = null;\n\t{{helperFunctions}}\n\n\treturn {\n\t\ttagName: \'{{tagName}}\',\n\t\t{{styles}}\n\t\trender: function(data) {\n\t\t\tinstance = this;\n\t\t\treturn [].concat({{render}})\n\t\t},\n\n\t\tfunctions: {{functions}}\n\t};\n}';

function parse(data) {
	var resultObject = {
		styles: [],
		helperFunctions: [safeAccess$1],
		tagName: '',
		render: '',
		functions: ''
	};
	var usesMerge = false,
	    usesRenderStyle = false,
	    usesSpread = false;
	var match = void 0,
	    lastIndex = 0,
	    level = 0,
	    tagStack = [];

	function getData() {
		return 'data' + (level === 0 ? '' : '$' + level);
	}

	function handleText(text) {
		var match = void 0,
		    result = '',
		    lastIndex = 0;

		if (!text.match(syntax)) {
			return result += "'" + text.substr(lastIndex).replace(/\n/g, '').replace(/'/g, '\\\'') + "', ";
		}
		while (match = syntax.exec(text)) {
			if (match.index < lastIndex) continue;
			var frag = text.substring(lastIndex, match.index).trim();
			if (frag.length > 0) {
				result += "'" + frag.replace(/\n/g, '').replace(/'/g, '\\\'') + "', ";
			}
			lastIndex = match.index + match[0].length;
			var key = match[1];
			var value = key.substr(1);
			if (key[0] === '#') {
				result += 'spread(toArray(' + getData() + ', \'' + value + '\').map(function (entry, index, arr) {\n\t\t\t\t\t\tvar data$' + (level + 1) + ' = merge({}, data' + (0 <= level ? '' : '$' + level) + ', {\'.\': entry, \'.index\': index, \'.length\': arr.length}, entry);\n\t\t\t\t\t\treturn [';
				level += 1;
				usesMerge = true;
				usesSpread = true;
			} else if (key[0] === '/') {
				result += '\'\']; })), ';
				level -= 1;
				if (level < 0) {
					throw new Error('Unexpected end of block: ' + key.substr(1));
				}
			} else if (key[0] === '!') {
				// ignore comments
				result += '';
			} else if (key[0] === '^') {
				result += '(safeAccess(' + getData() + ', \'' + value + '\') && (typeof safeAccess(' + getData() + ', \'' + value + '\') === \'boolean\' || safeAccess(' + getData() + ', \'' + value + '\').length > 0)) ? \'\' : spread([1].map(function() { var data$' + (level + 1) + ' = merge({}, data' + (0 <= level ? '' : '$' + level) + '); return [';
				usesSpread = true;
				level += 1;
			} else if (key[0] === '%') {
				result += key.substr(1).split(/\s*,\s*/).map(function (value) {
					return 'renderStyle(safeAccess(' + getData() + ', \'' + value + '\'), ' + getData() + ')';
				}).join(' + ');
				usesRenderStyle = true;
			} else if (key[0] === '+') {
				result += 'safeAccess(' + getData() + ', \'' + value + '\'), ';
			} else if (key[0] !== '{') {
				value = key;
				result += 'safeAccess(' + getData() + ', \'' + value + '\', true), ';
			} else {
				result += 'safeAccess(' + getData() + ', \'' + value + '\'), ';
			}
		}
		if (text.substr(lastIndex).length > 0) {
			result += "'" + text.substr(lastIndex).replace(/\n/g, '').replace(/'/g, '\\\'') + "', ";
		}
		return result;
	}

	function makeAttributes(attrs) {
		var attributes = '{';
		var attr = void 0;

		while (attr = attrRegExp.exec(attrs)) {
			if (attributes !== '{') attributes += ', ';
			attributes += '"' + attr[1].toLowerCase() + '": ' + handleText(attr[2] || attr[3]).replace(/,\s*$/, '');
		}
		return attributes + '}';
	}

	// clean up code
	data = data.replace(commentRegExp, '').replace(/<(script|style)[^>]*?>((?:.|\n)*?)<\/\1>/gi, function (g, x, m) {
		if (x === 'style') {
			resultObject.styles.push(m);
		} else {
			resultObject.functions += m.trim().replace(/;$/, '');
		}
		return '';
	}).trim();

	if (!data.match(tagRegExp)) {
		console.log(data);
		throw new Error('No proper component provided');
	}
	resultObject.tagName = data.match(/^<([\w_-]+)>/)[1].toLowerCase();

	while (match = tagRegExp.exec(data)) {
		if (match.index < lastIndex) continue;
		var text = data.substring(lastIndex, match.index).replace(/^[ \t]+|[ \t]$/g, ' ').trim();
		lastIndex = match.index + match[0].length;
		if (text.length > 0) {
			resultObject.render += handleText(text);
		}
		if (match[2] === resultObject.tagName) continue;
		if (match[1]) {
			// closing tag
			var expected = tagStack.pop();
			if (expected !== match[2]) {
				throw new Error('Unexpected end of tag: ' + match[2] + '; expected to end ' + expected);
			}
			resultObject.render = resultObject.render.replace(/,\s*$/g, '') + ')), ';
		} else {
			// opening tag
			tagStack.push(match[2]);
			var attributes = makeAttributes(match[3]);
			resultObject.render += 'new Tag(\'' + match[2] + '\', ' + attributes;
			if (!match[4]) {
				resultObject.render += ', [].concat(';
			} else {
				resultObject.render += '), ';
				tagStack.pop();
			}
		}
	}
	if (tagStack.length > 0) {
		throw new Error('Unclosed tags: ' + tagStack.join(', '));
	}
	if (level > 0) {
		throw new Error('Unexpected end of block');
	}
	if (data.substr(lastIndex).trim().length > 0) {
		resultObject.render += handleText(data.substr(lastIndex).replace(/^[ \t]+|[ \t]$/g, ' ').trim());
	}
	resultObject.render = resultObject.render.replace(/,\s*$/g, '');

	if (usesMerge) {
		resultObject.helperFunctions.push(merge$1);
		resultObject.helperFunctions.push(toArray$1);
	}
	if (usesSpread) {
		resultObject.helperFunctions.push(spread);
	}
	if (usesRenderStyle) {
		resultObject.helperFunctions.push(renderStyle);
	}
	resultObject.functions = resultObject.functions || '{}';
	resultObject.styles = resultObject.styles.length > 0 ? 'styles: ' + JSON.stringify(resultObject.styles) + ',' : '';
	resultObject.helperFunctions = resultObject.helperFunctions.join('\n');
	return baseCode.replace(syntax, function (g, m) {
		return resultObject[m];
	});
}

var sha1 = function sha1(data) {
	return crypto.createHash('sha1').update(data).digest('hex');
};
var fileName = null;

merge(global, {
	Zino: {
		trigger: trigger, on: on, off: off, one: one,
		import: emptyFunc,
		fetch: emptyFunc
	},
	require: function require() {
		return emptyFunc;
	},
	setTimeout: emptyFunc,
	setInterval: emptyFunc
});

function importTag(tagFile, document) {
	var data = fs.readFileSync(tagFile, 'utf-8');
	var code = void 0;
	try {
		// if we have HTML input
		if (data.trim().indexOf('<') === 0) {
			// convert it to JS
			data = parse(data);
		}
		code = new Function('return ' + data.replace(/\bZino.import\s*\(/g, 'Zino.import.call({path: ' + JSON.stringify(path.basename(tagFile)) + '}, ').trim().replace(/;$/, ''))();
	} catch (e) {
		e.message = 'Unable to import tag ' + tagFile + ': ' + e.message;
		throw e;
	}
	code && registerTag(code, document);
}

function clearImports() {
	flushRegisteredTags();
}

function matchesSnapshot() {
	for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
		args[_key] = arguments[_key];
	}

	if (isObj(args[0])) {
		var _args$ = args[0],
		    html = _args$.html,
		    _args$$props = _args$.props,
		    props = _args$$props === undefined ? {} : _args$$props,
		    _args$$name = _args$.name,
		    name = _args$$name === undefined ? '' : _args$$name,
		    _args$$callback = _args$.callback,
		    callback = _args$$callback === undefined ? function () {} : _args$$callback;
	} else {
		var html = args[0],
		    _args$2 = args[1],
		    props = _args$2 === undefined ? {} : _args$2,
		    _args$3 = args[2],
		    name = _args$3 === undefined ? '' : _args$3,
		    _args$4 = args[3],
		    callback = _args$4 === undefined ? function () {} : _args$4;
	}
	var code = new jsdom.JSDOM(html).window.document.body;

	name = name.replace(/[^a-zA-Z0-9._-]/g, '-');
	fileName = './test/snapshots/' + code.children[0].tagName.toLowerCase() + '-' + (name && name + '-' || '') + sha1(html + JSON.stringify(props) + callback.toString()).substr(0, 5);
	renderOptions.resolveData = function (key, value) {
		return sha1(key + '-' + JSON.stringify(value));
	};

	var _core$mount = mount(code.children[0], true),
	    events = _core$mount.events,
	    data = _core$mount.data;

	if (Object.keys(props).length > 0) {
		code.children[0].setProps(props);
	}

	callback(code.children[0]);

	var eventList = [];
	events = events.forEach(function (e) {
		return eventList = eventList.concat(e.childEvents, e.hostEvents);
	});
	events = Object.keys(eventList).map(function (el) {
		var obj = {};
		if (eventList[el]) {
			obj[eventList[el].selector] = Object.keys(eventList[el].handlers).map(function (event) {
				return '[' + event + ' ' + _typeof(eventList[el].handlers[event]) + ']' + eventList[el].handlers[event].name;
			});
		}
		return obj;
	});

	var resultString = code.children[0].outerHTML + '\n' + JSON.stringify({ data: data, events: events }, null, 2);
	resultString = resultString.replace(/\r\n/g, '\n');

	if (!fs.existsSync(path.dirname(fileName))) {
		fs.mkdirSync(path.dirname(fileName));
		writeResult(resultString);
	} else if (!fs.existsSync(fileName)) {
		writeResult(resultString);
	} else {
		var previousResult = fs.readFileSync(fileName, 'utf-8').replace(/\r/g, '');
		if (previousResult !== resultString) {
			// create a diff
			var diffResult = diff(previousResult, resultString);
			process.stderr.write('\nComponent ' + fileName + ' - snapshots don\'t match: \n');
			diffResult.forEach(function (part) {
				var color = part[0] === diff.DELETE ? 'red' : part[0] === diff.INSERT ? 'green' : 'gray';
				process.stderr.write(part[1][color]);
			});
			if (readline.question('\nDo you want to take the new snapshot as the reference snapshot (y/N)?') === 'y') {
				writeResult(resultString);
			} else {
				throw new Error('Snapshots don\'t match.');
			}
		}
	}
}
on('--zino-rerender-tag', render);

function writeResult(result) {
	fs.writeFileSync(fileName, result);
}

exports.importTag = importTag;
exports.clearImports = clearImports;
exports.matchesSnapshot = matchesSnapshot;
