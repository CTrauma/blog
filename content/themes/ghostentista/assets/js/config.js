/*------------------------------------------------------------------
 Copyright (c) 2013-2014 Viktor Bezdek
 - Released under The MIT License

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

window.ghostentista = {};
var config = {
	// links to your social profiles
	// note: empty link = button wont appear
	socialProfiles: {
		facebook: '', 					// ex: https://www.facebook.com/username
		twitter: 'http://www.twitter.com/chalktrauma', 					// ex: https://twitter.com/username
		github: 'https://github.com/CTrauma',						// ex: https://github.com/username
		email: 'scott@bitwise.ninja',						// ex: you@yourdomain.com
		linkedIn: 'https://www.linkedin.com/in/wscottdillman',					// ex: http://linkedin.com/in/username
		gplus: '', 						// ex: https://plus.google.com/something
		pinterest: '',					// ex: https://pinterest.com/username
		instagram: ''					// ex: http://instagram.com/username
	},
	showThemeBadge: true,				// Show or hide theme and platform credits
	showAuthorOnPostDetail: true,		// Show author bio on post detail
	googleAnalytics: '', 				// ex: UA-XXXXX-XX, if empty will not track anything
	logoBackground: 'rgba(66, 169, 199,0.75)',	// Enter anything which suits css background shorthand. Ex: #ffcc00, green
	appendContent: null					// HTML or text to be appended just before closing body tag
}

window.ghostentista.config = config;
