// zino.js
/**
	This library enables you to use custom tags, similar to web components, without any additional polyfills.

	Importing custom tags on page via:

		<link type="zino/tag" href="..."/>

	Properties

	events
	props
	render
	mount
	unmount
	styles
	setProps
	...

	Exports:

		- import(url[, callback[, props]])
			- url - URL to load the element from, if not loaded yet
			- callback - callback function to call when the tag has been loaded

		- trigger(event[, data])
			- event - name of the event to trigger
			- data - data to send with the event (optional)

			Triggers the given event

		- on(event, callback)
			- event - name of the event to listen for
			- callback - callback function to call when the event is triggered

			Listens for the given event and calls the callback for every occurrence.
			Any data sent with the trigger will be directly given into the callback.

		- one(event, callback)
			- event - name of the event to listen for
			- callback - callback function to call when the event is triggered

			Listens for the given event and calls the callback only for the first
			occurrence. Any data sent with the trigger will be directly given into
			the callback.

		- off(event, callback)
			- event - name of the event to listen for
			- callback - function to remove as event listener

			Removes the event listener for the given event

		- fetch(url, callback)
			- url - from where to fetch some content/data?
			- callback(data, err) - function to call once successful

			Do a very simple AJAX call (supports only GET). The response body will
			be handed into the callback function as data. If an error occurs, the err parameter will be filled with the server's response status code.
*/
(function(exports, win, doc) {
	'use strict';

	var tagLibrary = {},

		// read utilities
		utils = require('utils'),
		$ = utils.domQuery,
		merge = utils.merge,
		fetch = utils.fetch,
		_ = utils.safeAccess,
		emptyFunc = utils.emptyFunc,
		checkParams = utils.checkParams,
		error = utils.error,

		// retrieves all attributes that can be used for rendering
		getAttributes = require('attributes'),
		parser = require('parser'),
		loader = require('loader'),

		setProps = function(name, value) {
			if (typeof name === 'object') {
				merge(this.props, name);
			} else {
				this.props[name] = value;
			}
			renderInstance(tagLibrary[this.tagName], this);
		},

		tagObserver = new MutationObserver(function(records) {
			records.forEach(function(record) {
				var added = record.addedNodes, removed = record.removedNodes;
				if (added.length > 0) {
					[].forEach.call(added, function(tag) {
						tag.querySelectorAll && $('*', tag).concat(tag).forEach(function(subTag) {
							if (tagLibrary[subTag.tagName]) {
								try {
									initializeInstance(subTag);
								} catch (e) {
									error('Unable to mount tag ' + subTag.tagName, e);
								}
							}
						});
					});
				} else if (removed.length > 0) {
					[].forEach.call(removed, function(tag) {
						tag.querySelectorAll && $('*', tag).concat(tag).forEach(function(subTag) {
							if (tagLibrary[subTag.tagName]) {
								[].forEach.call(subTag.attributes, function(attr) {
									// cleanup saved data
									if (attr.name.indexOf('data-') >= 0 && Zino.__data) {
										delete Zino.__data[attr.value];
									}
								});
								try {
									tagLibrary[subTag.tagName].functions.unmount.call(subTag);
								} catch (e) {
									error('Unable to unmount tag ' + subTag.tagName, e);
								}
							}
						});
					});
				}
			});
		}),

		// renders an element instance from scratch
		renderInstance = function(tagDescription, tag) {
			var events = tagDescription.functions.events || [],

				attachEvent = function(el, events) {
					events = typeof events !== 'number' ? events : this;
					el.getHost = function() { return tag; };
					for (var each in events) {
						checkParams([events[each]], ['function'], 'event ' + each + ' for tag ' + tag.tagName);
						el.addEventListener(each, events[each].bind(el), false);
					}
				},

				getFocus = function(el, /*private*/selector) {
					if (!el) {
						return null;
					}
					selector = 	el.nodeName +
						(el.id && ('#' + el.id) || '') +
						(el.name && ('[name=' + el.name + ']') || '') +
						(el.className && ('.' + el.className.replace(/\s/g, '.')) || '');

					return {
						selector: el.parentNode && el.parentNode !== tag ? getFocus(el.parentNode).selector + ' > ' + selector : selector,
						value: el.value
					};
				},
				restoreFocus = function(path, /*private*/el) {
					if (path) {
						el = $(path.selector, tag)[0];
						if (el) {
							el.value = path.value || '';
							el.focus();
						}
					}
					return el || tag;
				},

				path = _(doc.activeElement).nodeName === 'INPUT' && getFocus(doc.activeElement),

				code = parser(tagDescription.code, getAttributes(tag), merge, tag),
				content = doc.createDocumentFragment(),
				div = doc.createElement('div'),
				isNew = false;

			if (!tag.isRendered) {
				div.className = '-shadow-root';
				content.appendChild(div);
				$('div', content)[0].innerHTML = code;
				tag.replaceChild(content, tag.firstChild);
			} else {
				delete tag.isRendered;
			}

			try {
				if (tagDescription.functions.render.call(tag) !== false && !tag.getAttribute('__ready')) {
					tag['__s']('__ready', true);
					if (typeof tag.onready === 'function') {
						try {
							tag.onready.apply(tag);
						} catch(e) {
							error('onready', tag.tagName, e);
						};
					}
					isNew = true;
				}
			} catch(e) {
				error('render', tag.tagName, e);
			}
			restoreFocus(path);

			// attach events
			checkParams([events], ['object'], 'event definition for tag ' + tag.tagName);
			for (var all in events) {
				if (all !== ':host' && all !== tag.tagName) {
					$(all, tag).forEach(attachEvent, events[all]);
				} else if (isNew) {
					attachEvent(tag, events[all]);
				}
			}
		},

		initializeInstance = function(tag, props) {
			var tagDescription = tagLibrary[tag.tagName],
				firstEl,

				getBaseAttrs = function(obj) {
					var baseAttrs = {};
					[].forEach.call(obj.children, function (el) {
						var name = el.nodeName.toLowerCase();
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
					return baseAttrs;
				};
			if (tag['__s']) return;

			for (var all in tagDescription.functions) {
				if (['events', 'mount', 'unmount'].indexOf(all) < 0) {
					if (typeof tagDescription.functions[all] !== 'function') {
						tag[all] = tagDescription.functions[all];
					} else {
						tag[all] = tagDescription.functions[all].bind(tag);
					}
				}
			}

			tag['__s'] = tag['__s'] || tag.setAttribute;
			tag['__i'] = '';
			firstEl = tag.firstElementChild;
			if (_(firstEl).className === '-shadow-root') {
				var sibling = firstEl.nextSibling, copy;
				while (sibling && sibling.className !== '-original-root') { sibling = sibling.nextSibling; }
				if (sibling) {
					tag['__i'] = sibling.innerHTML;
					copy = sibling.cloneNode(true);
					sibling.parentNode.removeChild(sibling);
					tag.element = getBaseAttrs(copy);
				}

				tag.isRendered = true;
			} else {
				tag['__i'] = tag.innerHTML;
				tag.element = getBaseAttrs(tag);
				tag.innerHTML = '<div class="-shadow-root"></div>';
			}

			Object.defineProperty(tag, 'body', {
				set: function(val) {
					tag['__i'] = val;
					renderInstance(tagDescription, tag);
				},
				get: function() { return tag['__i']; }
			});
			try {
				Object.defineProperty(tag, 'innerHTML', {
					set: function(val) {
						tag['__i'] = val;
						renderInstance(tagDescription, tag);
					},
					get: function() { return tag['__i']; }
				});
			} catch(e) {
				// browser does not support overriding innerHTML
				console.warn(e, 'Your browser does not support overriding innerHTML. Please use `element.body` instead of `element.innerHTML`.');
			}
			tag.setAttribute = function(attr, val) {
				tag['__s'](attr, val);
				renderInstance(tagDescription, tag);
			};

			// pre-set props, if given
			tag.props = merge({}, tagDescription.functions.props, getAttributes(tag, true), props || {});

			// fire the mount event callback
			try {
				tagDescription.functions.mount.call(tag);
			} catch (e) {
				error('mount', tag.tagName, e);
			}

			// render the tag's content
			renderInstance(tagDescription, tag);
		},

		getTagFromCode = function(code) {
			var frag = doc.createDocumentFragment(),
				firstEl;
			frag.appendChild(doc.createElement('div'));
			frag.firstChild.innerHTML = code;
			firstEl = frag.firstChild.firstElementChild;
			code = code.replace(/<([^>]+)>/g, function(g, m) {
				var tagName = m.split(' ')[0];
				if (tagName[0] === '/') tagName = tagName.substr(1);
				if (tagName === firstEl.tagName.toLowerCase() || tagName.toLowerCase() === 'link') {
					return '';
				}
				return g;
			}).replace(/<style[^>]*>(?:[^\s]|[^\S])*?<\/style>/g, '').replace(/<script[^>]*>(?:[^\s]|[^\S])*?<\/script>/g, '');
			firstEl.code = code;
			return firstEl;
		},

		registerTag = function(code, initializeAll) {
			var name = code.tagName;
			if (tagLibrary[name]) {
				return;
			}

			($('link', code) || []).forEach(function(link) {
				if (link.type === 'stylesheet') {
					link.id = name + '-external-styles';
					doc.head.appendChild(link);
				}
			});
			var style = doc.createElement('style');
			style.id = name + '-styles';
			style.innerHTML = loader.handleStyles(name, $('style', code));
			doc.head.appendChild(style);

			tagLibrary[name] = {
				functions: loader.handleScripts(name, $('script', code), doc.head.appendChild, setProps, merge, code.path),
				code: code.code,
				path: code.path
			};

			if (initializeAll !== false) {
				$(name).forEach(function(tag) {
					!tag['__s'] && initializeInstance(tag);
				});
			}
		};

	// initialize all tags that are supposed to be pre-loaded via link tag
	$('link[rel="zino-tag"]').forEach(function(tag) {
		fetch(tag.href, function(code) {
			code = getTagFromCode(code);
			if (code) code.path = tag.href.replace(/[^\/]+$/g, '');
			registerTag(code);
		}, true);
	});

	tagObserver.observe(doc.body, {
		subtree: true,
		childList: true
	});

	// export the dynamic tag loading & mounting functions
	exports.import = function(url, cb, props) {
		var me = this;
		checkParams(arguments, ['string'], 'Zino.import: URL expected');
		cb = cb || emptyFunc;
		fetch((me.path || '') + url, function(code) {
			var tag = getTagFromCode(code);
			if (tag) tag.path = (me.path || '') + url.replace(/[^\/]+$/g, '');
			registerTag(tag, false);
			$(tag.tagName).forEach(function(el) {
				initializeInstance(el, props);
			});
			cb();
		}, true);
	};
	// event handling
	exports.trigger = function(eventName, data) {
			var eventObj;
			checkParams(arguments, ['string'], 'Zino.trigger');
			try {
				eventObj = new CustomEvent(eventName, {detail: data})
			} catch(ex) {
				eventObj = document.createEvent('CustomEvent');
				eventObj.initCustomEvent(eventName, false, false, data);
			}
			this.dispatchEvent(eventObj);
		}.bind(win);
	exports.on = function(eventName, cb) {
			checkParams(arguments, ['string', 'function'], 'Zino.on');
			this.addEventListener(eventName, function(e) {
				cb(e.detail);
			}, false);
		}.bind(win);
	exports.one = function(eventName, cb) {
			checkParams(arguments, ['string', 'function'], 'Zino.one');
			var _this = this,
				remove = function(e) {
					cb(e.detail);
					_this.removeEventListener(eventName, remove);
				};
			_this.addEventListener(eventName, remove, false);
		}.bind(win);
	exports.off = function(event, cb) {
			checkParams(arguments, ['string', 'function'], 'Zino.off');
			this.removeEventListener(event, cb);
		}.bind(win);
	// some util functions
	exports.fetch = fetch;
}(this.exports || (window.Zino = (window.Zino || {})), window, document));
