/*! jQuery slabtext plugin v2.3 MIT/GPL2 @freqdec */
(function ($) {

	$.fn.slabText = function (options) {

		var settings = {
			// The ratio used when calculating the characters per line
			// (parent width / (font-size * fontRatio)).
			"fontRatio": 0.78,
			// Always recalculate the characters per line, not just when the
			// font-size changes? Defaults to true (CPU intensive)
			"forceNewCharCount": true,
			// Do we wrap ampersands in <span class="amp">
			"wrapAmpersand": true,
			// Under what pixel width do we remove the slabtext styling?
			"headerBreakpoint": null,
			"viewportBreakpoint": null,
			// Don't attach a resize event
			"noResizeEvent": false,
			// By many milliseconds do we throttle the resize event
			"resizeThrottleTime": 300,
			// The maximum pixel font size the script can set
			"maxFontSize": 999,
			// Do we try to tweak the letter-spacing or word-spacing?
			"postTweak": true,
			// Decimal precision to use when setting CSS values
			"precision": 3,
			// The min num of chars a line has to contain
			"minCharsPerLine": 0
		};

		// Add the slabtexted classname to the body to initiate the styling of
		// the injected spans
		$("body").addClass("slabtexted");

		return this.each(function () {

			if (options) {
				$.extend(settings, options);
			}
			;

			var $this = $(this),
				keepSpans = $("span.slabtext", $this).length,
				words = keepSpans ? [] : String($.trim($this.text())).replace(/\s{2,}/g, " ").split(" "),
				origFontSize = null,
				idealCharPerLine = null,
				fontRatio = settings.fontRatio,
				forceNewCharCount = settings.forceNewCharCount,
				headerBreakpoint = settings.headerBreakpoint,
				viewportBreakpoint = settings.viewportBreakpoint,
				postTweak = settings.postTweak,
				precision = settings.precision,
				resizeThrottleTime = settings.resizeThrottleTime,
				minCharsPerLine = settings.minCharsPerLine,
				resizeThrottle = null,
				viewportWidth = $(window).width(),
				headLink = $this.find("a:first").attr("href") || $this.attr("href"),
				linkTitle = headLink ? $this.find("a:first").attr("title") : "";

			if (!keepSpans && minCharsPerLine && words.join(" ").length < minCharsPerLine) {
				return;
			}
			;

			// Calculates the pixel equivalent of 1em within the current header
			var grabPixelFontSize = function () {
				var dummy = jQuery('<div style="display:none;font-size:1em;margin:0;padding:0;height:auto;line-height:1;border:0;">&nbsp;</div>').appendTo($this),
					emH = dummy.height();
				dummy.remove();
				return emH;
			};

			// Most of this function is a (very) stripped down AS3 to JS port of
			// the slabtype algorithm by Eric Loyer with the original comments
			// left intact
			// http://erikloyer.com/index.php/blog/the_slabtype_algorithm_part_1_background/
			var resizeSlabs = function resizeSlabs() {

				// Cache the parent containers width
				var parentWidth = $this.width(),
					fs;

				//Sanity check to prevent infinite loop
				if (parentWidth === 0) {
					return;
				}
				;

				// Remove the slabtextdone and slabtextinactive classnames to enable the inline-block shrink-wrap effect
				$this.removeClass("slabtextdone slabtextinactive");

				if (viewportBreakpoint && viewportBreakpoint > viewportWidth
					||
					headerBreakpoint && headerBreakpoint > parentWidth) {
					// Add the slabtextinactive classname to set the spans as inline
					// and to reset the font-size to 1em (inherit won't work in IE6/7)
					$this.addClass("slabtextinactive");
					return;
				}
				;

				fs = grabPixelFontSize();
				// If the parent containers font-size has changed or the "forceNewCharCount" option is true (the default),
				// then recalculate the "characters per line" count and re-render the inner spans
				// Setting "forceNewCharCount" to false will save CPU cycles...
				if (!keepSpans && (forceNewCharCount || fs != origFontSize)) {

					origFontSize = fs;

					var newCharPerLine = Math.min(60, Math.floor(parentWidth / (origFontSize * fontRatio))),
						wordIndex = 0,
						lineText = [],
						counter = 0,
						preText = "",
						postText = "",
						finalText = "",
						slice,
						preDiff,
						postDiff;

					if (newCharPerLine != idealCharPerLine) {
						idealCharPerLine = newCharPerLine;

						while (wordIndex < words.length) {

							postText = "";

							// build two strings (preText and postText) word by word, with one
							// string always one word behind the other, until
							// the length of one string is less than the ideal number of characters
							// per line, while the length of the other is greater than that ideal
							while (postText.length < idealCharPerLine) {
								preText = postText;
								postText += words[wordIndex] + " ";
								if (++wordIndex >= words.length) {
									break;
								}
								;
							}
							;

							// This bit hacks in a minimum characters per line test
							// on the last line
							if (minCharsPerLine) {
								slice = words.slice(wordIndex).join(" ");
								if (slice.length < minCharsPerLine) {
									postText += slice;
									preText = postText;
									wordIndex = words.length + 2;
								}
								;
							}
							;

							// calculate the character difference between the two strings and the
							// ideal number of characters per line
							preDiff = idealCharPerLine - preText.length;
							postDiff = postText.length - idealCharPerLine;

							// if the smaller string is closer to the length of the ideal than
							// the longer string, and doesn’t contain less than minCharsPerLine
							// characters, then use that one for the line
							if ((preDiff < postDiff) && (preText.length >= (minCharsPerLine || 2))) {
								finalText = preText;
								wordIndex--;
								// otherwise, use the longer string for the line
							} else {
								finalText = postText;
							}
							;

							// HTML-escape the text
							finalText = $('<div/>').text(finalText).html()

							// Wrap ampersands in spans with class `amp` for specific styling
							if (settings.wrapAmpersand) {
								finalText = finalText.replace(/&amp;/g, '<span class="amp">&amp;</span>');
							}
							;

							finalText = $.trim(finalText);

							lineText.push('<span class="slabtext">' + finalText + "</span>");
						}
						;

						$this.html(lineText.join(" "));
						// If we have a headLink, add it back just inside our target, around all the slabText spans
						if (headLink) {
							$this.wrapInner('<a href="' + headLink + '" ' + (linkTitle ? 'title="' + linkTitle + '" ' : '') + '/>');
						}
						;
					}
					;
				} else {
					// We only need the font-size for the resize-to-fit functionality
					// if not injecting the spans
					origFontSize = fs;
				}
				;

				$("span.slabtext", $this).each(function () {
					var $span = $(this),
					// the .text method appears as fast as using custom -data attributes in this case
						innerText = $span.text(),
						wordSpacing = innerText.split(" ").length > 1,
						diff,
						ratio,
						fontSize;

					if (postTweak) {
						$span.css({
							"word-spacing": 0,
							"letter-spacing": 0
						});
					}
					;

					ratio = parentWidth / $span.width();
					fontSize = parseFloat(this.style.fontSize) || origFontSize;

					$span.css("font-size", Math.min((fontSize * ratio).toFixed(precision), settings.maxFontSize) + "px");

					// Do we still have space to try to fill or crop
					diff = !!postTweak ? parentWidth - $span.width() : false;

					// A "dumb" tweak in the blind hope that the browser will
					// resize the text to better fit the available space.
					// Better "dumb" and fast...
					if (diff) {
						$span.css((wordSpacing ? 'word' : 'letter') + '-spacing', (diff / (wordSpacing ? innerText.split(" ").length - 1 : innerText.length)).toFixed(precision) + "px");
					}
					;
				});

				// Add the class slabtextdone to set a display:block on the child spans
				// and avoid styling & layout issues associated with inline-block
				$this.addClass("slabtextdone");
			};

			// Immediate resize
			resizeSlabs();

			if (!settings.noResizeEvent) {
				$(window).resize(function () {
					// Only run the resize code if the viewport width has changed.
					// we ignore the viewport height as it will be constantly changing.
					if ($(window).width() == viewportWidth) {
						return;
					}
					;

					viewportWidth = $(window).width();

					clearTimeout(resizeThrottle);
					resizeThrottle = setTimeout(resizeSlabs, resizeThrottleTime);
				});
			}
			;
		});
	};
})(jQuery);/*global jQuery */
/*jshint multistr:true browser:true */
/*!
 * FitVids 1.0.3
 *
 * Copyright 2013, Chris Coyier - http://css-tricks.com + Dave Rupert - http://daverupert.com
 * Credit to Thierry Koblentz - http://www.alistapart.com/articles/creating-intrinsic-ratios-for-video/
 * Released under the WTFPL license - http://sam.zoy.org/wtfpl/
 *
 * Date: Thu Sept 01 18:00:00 2011 -0500
 */

(function ($) {

	"use strict";

	$.fn.fitVids = function (options) {
		var settings = {
			customSelector: null
		};

		if (!document.getElementById('fit-vids-style')) {

			var div = document.createElement('div'),
				ref = document.getElementsByTagName('base')[0] || document.getElementsByTagName('script')[0],
				cssStyles = '&shy;<style>.fluid-width-video-wrapper{width:100%;position:relative;padding:0;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed {position:absolute;top:0;left:0;width:100%;height:100%;}</style>';

			div.className = 'fit-vids-style';
			div.id = 'fit-vids-style';
			div.style.display = 'none';
			div.innerHTML = cssStyles;

			ref.parentNode.insertBefore(div, ref);

		}

		if (options) {
			$.extend(settings, options);
		}

		return this.each(function () {
			var selectors = [
				"iframe[src*='player.vimeo.com']",
				"iframe[src*='youtube.com']",
				"iframe[src*='youtube-nocookie.com']",
				"iframe[src*='kickstarter.com'][src*='video.html']",
				"object",
				"embed"
			];

			if (settings.customSelector) {
				selectors.push(settings.customSelector);
			}

			var $allVideos = $(this).find(selectors.join(','));
			$allVideos = $allVideos.not("object object"); // SwfObj conflict patch

			$allVideos.each(function () {
				var $this = $(this);
				if (this.tagName.toLowerCase() === 'embed' && $this.parent('object').length || $this.parent('.fluid-width-video-wrapper').length) { return; }
				var height = ( this.tagName.toLowerCase() === 'object' || ($this.attr('height') && !isNaN(parseInt($this.attr('height'), 10))) ) ? parseInt($this.attr('height'), 10) : $this.height(),
					width = !isNaN(parseInt($this.attr('width'), 10)) ? parseInt($this.attr('width'), 10) : $this.width(),
					aspectRatio = height / width;
				if (!$this.attr('id')) {
					var videoID = 'fitvid' + Math.floor(Math.random() * 999999);
					$this.attr('id', videoID);
				}
				$this.wrap('<div class="fluid-width-video-wrapper"></div>').parent('.fluid-width-video-wrapper').css('padding-top', (aspectRatio * 100) + "%");
				$this.removeAttr('height').removeAttr('width');
			});
		});
	};
// Works with either jQuery or Zepto
})(window.jQuery || window.Zepto);
(function(root, factory) {
	if(typeof exports === 'object') {
		module.exports = factory();
	}
	else if(typeof define === 'function' && define.amd) {
		define('salvattore', [], factory);
	}
	else {
		root.salvattore = factory();
	}
}(this, function() {
	/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license */

	window.matchMedia || (window.matchMedia = function() {
		"use strict";

		// For browsers that support matchMedium api such as IE 9 and webkit
		var styleMedia = (window.styleMedia || window.media);

		// For those that don't support matchMedium
		if (!styleMedia) {
			var style       = document.createElement('style'),
				script      = document.getElementsByTagName('script')[0],
				info        = null;

			style.type  = 'text/css';
			style.id    = 'matchmediajs-test';

			script.parentNode.insertBefore(style, script);

			// 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
			info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

			styleMedia = {
				matchMedium: function(media) {
					var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

					// 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
					if (style.styleSheet) {
						style.styleSheet.cssText = text;
					} else {
						style.textContent = text;
					}

					// Test if media query is true or false
					return info.width === '1px';
				}
			};
		}

		return function(media) {
			return {
				matches: styleMedia.matchMedium(media || 'all'),
				media: media || 'all'
			};
		};
	}());
	;/*! matchMedia() polyfill addListener/removeListener extension. Author & copyright (c) 2012: Scott Jehl. Dual MIT/BSD license */
	(function(){
		// Bail out for browsers that have addListener support
		if (window.matchMedia && window.matchMedia('all').addListener) {
			return false;
		}

		var localMatchMedia = window.matchMedia,
			hasMediaQueries = localMatchMedia('only all').matches,
			isListening     = false,
			timeoutID       = 0,    // setTimeout for debouncing 'handleChange'
			queries         = [],   // Contains each 'mql' and associated 'listeners' if 'addListener' is used
			handleChange    = function(evt) {
				// Debounce
				clearTimeout(timeoutID);

				timeoutID = setTimeout(function() {
					for (var i = 0, il = queries.length; i < il; i++) {
						var mql         = queries[i].mql,
							listeners   = queries[i].listeners || [],
							matches     = localMatchMedia(mql.media).matches;

						// Update mql.matches value and call listeners
						// Fire listeners only if transitioning to or from matched state
						if (matches !== mql.matches) {
							mql.matches = matches;

							for (var j = 0, jl = listeners.length; j < jl; j++) {
								listeners[j].call(window, mql);
							}
						}
					}
				}, 30);
			};

		window.matchMedia = function(media) {
			var mql         = localMatchMedia(media),
				listeners   = [],
				index       = 0;

			mql.addListener = function(listener) {
				// Changes would not occur to css media type so return now (Affects IE <= 8)
				if (!hasMediaQueries) {
					return;
				}

				// Set up 'resize' listener for browsers that support CSS3 media queries (Not for IE <= 8)
				// There should only ever be 1 resize listener running for performance
				if (!isListening) {
					isListening = true;
					window.addEventListener('resize', handleChange, true);
				}

				// Push object only if it has not been pushed already
				if (index === 0) {
					index = queries.push({
						mql         : mql,
						listeners   : listeners
					});
				}

				listeners.push(listener);
			};

			mql.removeListener = function(listener) {
				for (var i = 0, il = listeners.length; i < il; i++){
					if (listeners[i] === listener){
						listeners.splice(i, 1);
					}
				}
			};

			return mql;
		};
	}());
	;// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

	(function() {
		var lastTime = 0;
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
				|| window[vendors[x]+'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame)
			window.requestAnimationFrame = function(callback, element) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				var id = window.setTimeout(function() { callback(currTime + timeToCall); },
					timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};

		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
	}());
	;var salvattore = (function (global, document, undefined) {
		"use strict";

		var self = {},
			grids = [],
			add_to_dataset = function(element, key, value) {
				// uses dataset function or a fallback for <ie10
				if (element.dataset) {
					element.dataset[key] = value;
				} else {
					element.setAttribute("data-" + key, value);
				}
				return;
			};

		self.obtain_grid_settings = function obtain_grid_settings(element) {
			// returns the number of columns and the classes a column should have,
			// from computing the style of the ::before pseudo-element of the grid.

			var computedStyle = global.getComputedStyle(element, ":before")
				, content = computedStyle.getPropertyValue("content").slice(1, -1)
				, matchResult = content.match(/^\s*(\d+)(?:\s?\.(.+))?\s*$/)
				, numberOfColumns
				, columnClasses
				;

			if (matchResult) {
				numberOfColumns = matchResult[1];
				columnClasses = matchResult[2];
				columnClasses = columnClasses? columnClasses.split(".") : ["column"];
			} else {
				matchResult = content.match(/^\s*\.(.+)\s+(\d+)\s*$/);
				columnClasses = matchResult[1];
				numberOfColumns = matchResult[2];
				if (numberOfColumns) {
					numberOfColumns = numberOfColumns.split(".");
				}
			}

			return {
				numberOfColumns: numberOfColumns,
				columnClasses: columnClasses
			};
		};


		self.add_columns = function add_columns(grid, items) {
			// from the settings obtained, it creates columns with
			// the configured classes and adds to them a list of items.

			var settings = self.obtain_grid_settings(grid)
				, numberOfColumns = settings.numberOfColumns
				, columnClasses = settings.columnClasses
				, columnsItems = new Array(+numberOfColumns)
				, columnsFragment = document.createDocumentFragment()
				, i = numberOfColumns
				, selector
				;

			while (i-- !== 0) {
				selector = "[data-columns] > *:nth-child(" + numberOfColumns + "n-" + i + ")";
				columnsItems.push(items.querySelectorAll(selector));
			}

			columnsItems.forEach(function append_to_grid_fragment(rows) {
				var column = document.createElement("div")
					, rowsFragment = document.createDocumentFragment()
					;

				column.className = columnClasses.join(" ");

				Array.prototype.forEach.call(rows, function append_to_column(row) {
					rowsFragment.appendChild(row);
				});
				column.appendChild(rowsFragment);
				columnsFragment.appendChild(column);
			});

			grid.appendChild(columnsFragment);
			add_to_dataset(grid, 'columns', numberOfColumns);
		};


		self.remove_columns = function remove_columns(grid) {
			// removes all the columns from a grid, and returns a list
			// of items sorted by the ordering of columns.

			var range = document.createRange();
			range.selectNodeContents(grid);

			var columns = Array.prototype.filter.call(range.extractContents().childNodes, function filter_elements(node) {
				return node instanceof global.HTMLElement;
			});

			var numberOfColumns = columns.length
				, numberOfRowsInFirstColumn = columns[0].childNodes.length
				, sortedRows = new Array(numberOfRowsInFirstColumn * numberOfColumns)
				;

			Array.prototype.forEach.call(columns, function iterate_columns(column, columnIndex) {
				Array.prototype.forEach.call(column.children, function iterate_rows(row, rowIndex) {
					sortedRows[rowIndex * numberOfColumns + columnIndex] = row;
				});
			});

			var container = document.createElement("div");
			add_to_dataset(container, 'columns', 0);

			sortedRows.filter(function filter_non_null(child) {
				return !!child;
			}).forEach(function append_row(child) {
				container.appendChild(child);
			});

			return container;
		};


		self.recreate_columns = function recreate_columns(grid) {
			// removes all the columns from the grid, and adds them again,
			// it is used when the number of columns change.

			global.requestAnimationFrame(function render_after_css_media_query_change() {
				self.add_columns(grid, self.remove_columns(grid));
			});
		};


		self.media_query_change = function media_query_change(mql) {
			// recreates the columns when a media query matches the current state
			// of the browser.

			if (mql.matches) {
				Array.prototype.forEach.call(grids, self.recreate_columns);
			}
		};


		self.get_css_rules = function get_css_rules(stylesheet) {
			// returns a list of css rules from a stylesheet

			var cssRules;
			try {
				cssRules = stylesheet.sheet.cssRules || stylesheet.sheet.rules;
			} catch (e) {
				return [];
			}

			return cssRules || [];
		};


		self.get_stylesheets = function get_stylesheets() {
			// returns a list of all the styles in the document (that are accessible).

			return Array.prototype.concat.call(
				Array.prototype.slice.call(document.querySelectorAll("style[type='text/css']")),
				Array.prototype.slice.call(document.querySelectorAll("link[rel='stylesheet']"))
			);
		};


		self.media_rule_has_columns_selector = function media_rule_has_columns_selector(rules) {
			// checks if a media query css rule has in its contents a selector that
			// styles the grid.

			var i = rules.length
				, rule
				;

			while (i--) {
				rule = rules[i];
				if (rule.selectorText && rule.selectorText.match(/\[data-columns\](.*)::?before$/)) {
					return true;
				}
			}

			return false;
		};


		self.scan_media_queries = function scan_media_queries() {
			// scans all the stylesheets for selectors that style grids,
			// if the matchMedia API is supported.

			var mediaQueries = [];

			if (!global.matchMedia) {
				return;
			}

			self.get_stylesheets().forEach(function extract_rules(stylesheet) {
				Array.prototype.forEach.call(self.get_css_rules(stylesheet), function filter_by_column_selector(rule) {
					if (rule.media && self.media_rule_has_columns_selector(rule.cssRules)) {
						mediaQueries.push(global.matchMedia(rule.media.mediaText));
					}
				});
			});

			mediaQueries.forEach(function listen_to_changes(mql) {
				mql.addListener(self.media_query_change);
			});
		};


		self.next_element_column_index = function next_element_column_index(grid) {
			// returns the index of the column where the given element must be added.

			var children = grid.children
				, m = children.length
				, highestRowCount
				, child
				, currentRowCount
				, i = children.length - 1
				;

			for (i; i >= 0; i--) {
				child = children[i];
				currentRowCount = child.children.length;
				if (i !== 0 && highestRowCount > currentRowCount) {
					break;
				} else if (i + 1 === m) {
					i = 0;
					break;
				}

				highestRowCount = currentRowCount;
			}

			return i;
		};


		self.create_list_of_fragments = function create_list_of_fragments(quantity) {
			// returns a list of fragments

			var fragments = new Array(quantity)
				, i = 0
				;

			while (i !== quantity) {
				fragments[i] = document.createDocumentFragment();
				i++;
			}

			return fragments;
		};


		self.append_elements = function append_elements(grid, elements) {
			// adds a list of elements to the end of a grid

			var columns = grid.children
				, numberOfColumns = columns.length
				, fragments = self.create_list_of_fragments(numberOfColumns)
				, columnIndex = self.next_element_column_index(grid)
				;

			elements.forEach(function append_to_next_fragment(element) {
				fragments[columnIndex].appendChild(element);
				if (columnIndex === numberOfColumns - 1) {
					columnIndex = 0;
				} else {
					columnIndex++;
				}
			});

			Array.prototype.forEach.call(columns, function insert_column(column, index) {
				column.appendChild(fragments[index]);
			});
		};


		self.prepend_elements = function prepend_elements(grid, elements) {
			// adds a list of elements to the start of a grid

			var columns = grid.children
				, numberOfColumns = columns.length
				, fragments = self.create_list_of_fragments(numberOfColumns)
				, columnIndex = numberOfColumns - 1
				;

			elements.forEach(function append_to_next_fragment(element) {
				var fragment = fragments[columnIndex];
				fragment.insertBefore(element, fragment.firstChild);
				if (columnIndex === 0) {
					columnIndex = numberOfColumns - 1;
				} else {
					columnIndex--;
				}
			});

			Array.prototype.forEach.call(columns, function insert_column(column, index) {
				column.insertBefore(fragments[index], column.firstChild);
			});

			// populates a fragment with n columns till the right
			var fragment = document.createDocumentFragment()
				, numberOfColumnsToExtract = elements.length % numberOfColumns
				;

			while (numberOfColumnsToExtract-- !== 0) {
				fragment.appendChild(grid.lastChild);
			}

			// adds the fragment to the left
			grid.insertBefore(fragment, grid.firstChild);
		};


		self.register_grid = function register_grid (grid) {
			if (global.getComputedStyle(grid).display === "none") {
				return;
			}

			// retrieve the list of items from the grid itself
			var range = document.createRange();
			range.selectNodeContents(grid);

			var items = document.createElement("div");
			items.appendChild(range.extractContents());


			add_to_dataset(items, 'columns', 0);
			self.add_columns(grid, items);
			grids.push(grid);
		};


		self.init = function init() {
			// adds required CSS rule to hide 'content' based
			// configuration.

			var css = document.createElement("style");
			css.innerHTML = "[data-columns]::before{visibility:hidden;position:absolute;font-size:1px;}";
			document.head.appendChild(css);

			// scans all the grids in the document and generates
			// columns from their configuration.

			var gridElements = document.querySelectorAll("[data-columns]");
			Array.prototype.forEach.call(gridElements, self.register_grid);
			self.scan_media_queries();
		};


		self.init();

		return {
			append_elements: self.append_elements,
			prepend_elements: self.prepend_elements,
			register_grid: self.register_grid
		};

	})(window, window.document);

	return salvattore;
}));/*------------------------------------------------------------------
 Copyright (c) 2013-2014 Viktor Bezdek
 - Released under The MIT License.

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
 ----------------------------------------------------------------*/

$(function () {
	var config = window.ghostentista.config;
	var siteURL = location.host;
	var internalLinksQuery = "a[href^='" + siteURL + "'], a[href^='/'], a[href^='./'], a[href^='../'], a[href^='#']";
	var $window = $(window);
	var $mainContent = $('#main-content');
	var $internalLinks = $(internalLinksQuery);
	var $relatedPostsContainer = $('#related-posts-container');
	var $logo = $('#site-head-content');
	var $header = $('#site-head');
	var $footerLinks = $('.get-connected p:first-child');

	$mainContent.fitVids();

	//---------------------------------------------------------------------
	// Config Stuff
	//---------------------------------------------------------------------

	// social profiles
	var socialProfiles = config.socialProfiles;
	if (socialProfiles.facebook != '') $footerLinks.append($('<a class="icon-facebook-circled" href="' + socialProfiles.facebook + '" target="_blank"></a>'));
	if (socialProfiles.email != '') $footerLinks.append($('<a class="icon-mail-circled" href="' + socialProfiles.email + '" target="_blank"></a>'));
	if (socialProfiles.twitter != '') $footerLinks.append($('<a class="icon-twitter-circled" href="' + socialProfiles.twitter + '" target="_blank"></a>'));
	if (socialProfiles.linkedIn != '') $footerLinks.append($('<a class="icon-linkedin-circled" href="' + socialProfiles.linkedIn + '" target="_blank"></a>'));
	if (socialProfiles.github != '') $footerLinks.append($('<a class="icon-github-circled" href="' + socialProfiles.github + '" target="_blank"></a>'));
	if (socialProfiles.pinterest != '') $footerLinks.append($('<a class="icon-pinterest-circled" href="' + socialProfiles.pinterest + '" target="_blank"></a>'));
	if (socialProfiles.instagram != '') $footerLinks.append($('<a class="icon-instagram-circled" href="' + socialProfiles.instagram + '" target="_blank"></a>'));
	if (config.logoBackground != '') $logo.css({background: config.logoBackground});

	// author bio
	if(!config.showAuthorOnPostDetail) $('section.author').remove();

	// theme & platform badge
	if(!config.showThemeBadge) $('p.poweredby').remove();

	// content to be added
	if(config.appendContent) $('body').append($(config.appendContent));

	// ios < 7 fixed position bug
	var ios = iOSversion();
	if (ios && ios[0] <= 6) $('body').addClass('no-fixed-elements')

	// logo position
	$window.scroll(function () {
		var logoHeight = $logo.height() + 40;
		var headerHeight = $header.height() - $window.scrollTop();

		// if we need to position logo
		if (headerHeight > logoHeight) {
			var marginTop = (headerHeight / 2 - logoHeight / 2) + 'px';
			$logo.parent().css({paddingTop: marginTop});
		}

		// if header is completely gone
		var $secondaryTitle = $('#secondaryTitle');
		$secondaryTitle.css({background: config.logoBackground});
		if (headerHeight <= 0) {
			if (!$secondaryTitle.hasClass('displayed')) {
				$secondaryTitle.addClass('displayed');
				$secondaryTitle.animate({top: '0px'}, 500);
			}
		}
		// if not
		else {
			if ($secondaryTitle.hasClass('displayed')) {
				$secondaryTitle.removeClass('displayed');
				$secondaryTitle.animate({top: '-200px'}, 500);
			}
		}

	});

	// create second header
	var siteName = $('#site-head h1').text().replace(/\s+/g, ' ');
	var slogan = $('#site-head h2').text().replace(/\s+/g, ' ');
	var header = $('<nav id="secondaryTitle"><div class="siteInfo"><h1>' + siteName + '</h1><h2>' + slogan + '</h2></div><a href="#top" id="scroll-to-top"></a></nav>');
	$('body').prepend(header);

	// scroll to top button
	$('#scroll-to-top').click(function (e) {
		e.preventDefault();
		$('html, body').animate({scrollTop: 0}, 200);
	});

	// resize does equalization of post titles
	$window.resize(function () {
		$window.trigger('scroll');
	});

	// if on home, saves related posts to local storage and removes the temporary element
	// if on post, displays related posts if available
	if ($relatedPostsContainer.length > 0) {
		var rp = $relatedPostsContainer.clone();
		$relatedPostsContainer.remove();
		localStorage.setItem('relatedPosts', JSON.stringify(rp.html()));
		setTimeout(scrollToContent, 200);
	} else {
		displayRelatedPosts();
	}

	// updates layout after init
	$window.trigger('scroll');
	$window.trigger('resize');
	setTimeout(function () {
		$('h2.post-title, h1.post-title').slabText({minCharsPerLine: 15});
		$('article.loading').each(function () {
			var $this = $(this);
			setTimeout(function () {
				$this.removeClass('loading');
				$window.trigger('resize');
			}, Math.random() * 200);
		});
	}, 200);


	// if on home, updates related posts in local storage
	// if on posts, displays related posts if available
	function displayRelatedPosts() {
		var related = JSON.parse(localStorage.getItem('relatedPosts'));
		var $nav = $('nav.related-posts ul');
		if (related.length > 0 && $nav.length > 0) {
			$nav.html(related);
		} else {
			$('nav.related-posts').remove();
		}
	}

	// scrolls down to start of content if marker is available
	function scrollToContent() {
		var contentAnchor = $("span[name='post-content']");
		if (contentAnchor.length > 0) {
			$('html,body').animate({scrollTop: contentAnchor.offset().top - 10}, 'slow');
		} else {
			$('html,body').animate({scrollTop: 0}, 'slow');
		}
	}

	// removes all css and style tags from loaded content to prevent reinitialization
	function dataFilter(data, type) {
		type = type || 'text';
		if (type == 'html' || type == 'text') {
			data = data.replace(/<link.*?\/>/gi, '');
			data = data.replace(/<script.*?>([\w\W]*?)<\/script>/gi, '');
			data = $(data).filter('#main-content').children().parent();
			return data.html();
		}

		return data;
	}

	// ios version detection helper (for annoying fixed pos bug in iOS < 7)
	// source: http://bit.ly/1c7F26O
	function iOSversion() {
		if (/iP(hone|od|ad)/.test(navigator.platform)) {
			// supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
			var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
			return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
		}
	}

	// Google Analytics
	if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1' && config.googleAnalytics) {

		(function (i, s, o, g, r, a, m) {
			i['GoogleAnalyticsObject'] = r;
			i[r] = i[r] || function () {
				(i[r].q = i[r].q || []).push(arguments)
			}, i[r].l = 1 * new Date();
			a = s.createElement(o),
				m = s.getElementsByTagName(o)[0];
			a.async = 1;
			a.src = g;
			m.parentNode.insertBefore(a, m)
		})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

		ga('create', config.googleAnalytics);
		ga('send', 'pageview');
	}

});

