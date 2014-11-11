/**
 * eGroupware Framework jdots object
 * @package framework
 * @author Hadi Nategh <hn@stylite.de>
 * @copyright Stylite AG 2014
 * @description Create jdots framework
 */

"use strict";
/*egw:uses
	jquery.jquery;
	framework.fw_base;
	framework.fw_browser;
	egw_fw_classes;
	egw_inheritance.js;
*/
(function(window){
	
	// Extention of fw_browser class to be able to override objects 
	// and methods inside browser object specificly for template.
	var jdots_browser = fw_browser.extend({
		// Here we can override methods
	});
	
	//jdots framework object defenition
	//here we can add framework methods and also override fw_base methods if it is neccessary
	var fw_jdots = fw_base.extend({
		/**
		 * jdots framework constructor
		 * 
		 * @param {string} _sidemenuId sidebar menu div id
		 * @param {string} _tabsId tab area div id
		 * @param {string} _splitterId splitter div id
		 * @param {string} _webserverUrl specifies the egroupware root url
		 * @param {function} _sideboxSizeCallback 
		 * @param {int} _sideboxStartSize sidebox start size
		 * @param {int} _sideboxMinSize sidebox minimum size
		 */
		init:function (_sidemenuId, _tabsId, _splitterId, _webserverUrl, _sideboxSizeCallback, _sideboxStartSize, _sideboxMinSize)
		{
			/* Get the base div */
			this.sidemenuDiv = document.getElementById(_sidemenuId);
			this.tabsDiv = document.getElementById(_tabsId);
			this.splitterDiv = document.getElementById(_splitterId);
			this.webserverUrl = _webserverUrl;
			this.sideboxSizeCallback = _sideboxSizeCallback;
			window.egw_webserverUrl = _webserverUrl;

			this.serializedTabState = '';
			this.notifyTabChangeEnabled = false;

			this.sidemenuUi = null;
			this.tabsUi = null;

			this.applications = new Object();
			this.activeApp = null;

			if (this.sidemenuDiv && this.tabsDiv && this.splitterDiv)
			{
				//Wrap a scroll area handler around the applications
				this.scrollAreaUi = new egw_fw_ui_scrollarea(this.sidemenuDiv);

				//Create the sidemenu, the tabs area and the splitter
				this.sidemenuUi = new egw_fw_ui_sidemenu(this.scrollAreaUi.contentDiv,
					this.sortCallback);
				this.tabsUi = new egw_fw_ui_tabs(this.tabsDiv);
				this.splitterUi = new egw_fw_ui_splitter(this.splitterDiv,
					EGW_SPLITTER_VERTICAL, this.splitterResize,
					[
						{
							"size": _sideboxStartSize,
							"minsize": _sideboxMinSize,
							"maxsize": 0
						}
					], this);

				var egw_script = document.getElementById('egw_script_id');
				var apps = egw_script ? egw_script.getAttribute('data-navbar-apps') : null;
				this.loadApplications(JSON.parse(apps));
			}

			_sideboxSizeCallback(_sideboxStartSize);

			//Register the resize handler
			$j(window).resize(function(){window.framework.resizeHandler();});

			//Register the global alert handler
			window.egw_alertHandler = this.alertHandler;

			//Register the key press handler
			//$j(document).keypress(this.keyPressHandler);

			//Override the old egw_openWindowCentered2
			window.egw_openWindowCentered2 = this.egw_openWindowCentered2;

			//Override the app_window function
			window.egw_appWindow = this.egw_appWindow;

			// Override the egw_appWindowOpen function
			window.egw_appWindowOpen = this.egw_appWindowOpen;

			// Override the egw_getAppName function
			window.egw_getAppName = this.egw_getAppName;
		},
		
		/**
		 * Function called whenever the sidemenu entries are sorted
		 * @param {type} _entriesArray
		 */
		sortCallback: function(_entriesArray)
		{
			//Create an array with the names of the applications in their sort order
			var name_array = [];
			for (var i = 0; i < _entriesArray.length; i++)
			{
				name_array.push(_entriesArray[i].tag.appName);
			}

			//Send the sort order to the server via ajax
			var req = egw.jsonq('home.jdots_framework.ajax_appsort', [name_array]);
		},
		
		/**
		 * 
		 * @param {type} _width
		 * @returns {undefined}
		 */
		splitterResize: function(_width)
		{
			if (this.tag.activeApp)
			{
				var req = egw.jsonq(
					this.tag.activeApp.getMenuaction('ajax_sideboxwidth'),
					[this.tag.activeApp.internalName, _width]
				);

				//If there are no global application width values, set the sidebox width of
				//the application every time the splitter is resized
				if (this.tag.activeApp.sideboxWidth !== false)
				{
					this.tag.activeApp.sideboxWidth = _width;
				}
			}
			this.tag.sideboxSizeCallback(_width);

			// Notify app about change
			if(this.tag.activeApp && this.tag.activeApp.browser != null)
			{
				this.tag.activeApp.browser.callResizeHandler();
			}
		},
	   
		/**
		 * tabCloseClickCallback is used internally by egw_fw in order to handle clicks
		 * on the close button of every tab.
		 *
		 * @param {egw_fw_ui_tab} _sender specifies the tab ui object, the user has clicked
		 */
		tabCloseClickCallback: function(_sender)
		{
			//Save references to the application and the tabsUi as "this" will be deleted
			var app = this.tag;
			var tabsUi = this.parent;

			//At least one tab must stay open
			if (tabsUi.tabs.length > 1)
			{
				//Tell the browser object to browse to an empty page, which will trigger the
				//unload handler
				app.browser.blank();

				this.tag.parentFw.notifyTabChangeEnabled = false;

				tabsUi.removeTab(this);
				app.tab = null;
				app.browser = null;

				if (app.sidemenuEntry)
					app.sidemenuEntry.hideAjaxLoader();

				//Set the active application to the application of the currently active tab
				app.parentFw.setActiveApp(tabsUi.activeTab.tag);

				this.tag.parentFw.notifyTabChangeEnabled = true;

				this.tag.parentFw.notifyTabChange();
			}

			tabsUi.setCloseable(tabsUi.tabs.length > 1);

			//As a new tab might remove a row from the tab header, we have to resize all tab content browsers
			 this.tag.parentFw.resizeHandler();
		 },
	   
		/**
		 * 
		 */
		resizeHandler: function()
		{
			// Tabs overflow needs to be checked again
			this.checkTabOverflow();
			//Resize the browser area of the applications
			for (var app in this.applications)
			{
				if (this.applications[app].browser != null)
				{
					this.applications[app].browser.resize();
				}
			}
			//Update the scroll area
			this.scrollAreaUi.update();		   
		},
	   
		/**
		 * Callback to calculate height of browser iframe or div
		 *
		 * @param {object} _iframe dom node of iframe or null for div
		 * @returns number in pixel
		 */
		getIFrameHeight: function(_iframe)
		{
			var $header = $j(this.tabsUi.appHeaderContainer);
			var height = $j(this.sidemenuDiv).height()-this.tabsUi.appHeaderContainer.outerHeight();
			return height;
		},
		
		/**
		 * tabClickCallback is used internally by egw_fw in order to handle clicks on
		 * a tab.
		 *
		 * @param {egw_fw_ui_tab} _sender specifies the tab ui object, the user has clicked
		 */
		tabClickCallback: function(_sender)
		{
		   //Set the active application in the framework
		   this.tag.parentFw.setActiveApp(this.tag);
		},

		/**
		 * applicationClickCallback is used internally by egw_fw in order to handle clicks on
		 * an application in the sidebox menu.
		 *
		 * @param {egw_fw_ui_tab} _sender specifies the tab ui object, the user has clicked
		 */
		applicationClickCallback: function(_sender)
		{
			this.tag.parentFw.applicationTabNavigate(this.tag, this.tag.indexUrl);
		},

		/**
		 * Creates an ordered list with all opened tabs and whether the tab is currently active
		 */
		assembleTabList: function()
		{
			var result = [];
			for (var i = 0; i < this.tabsUi.tabs.length; i++)
			{
				var tab = this.tabsUi.tabs[i];
				result[i] = {
					'appName': tab.tag.appName,
					'active': tab == this.tabsUi.activeTab
				};
			}

			return result;
		},

		notifyTabChange: function()
		{
			// Call the "resize" function of the currently active app
			if (this.activeApp)
			{
				var browser = this.activeApp.browser;
				if (browser)
				{
					window.setTimeout(function() {
						browser.callResizeHandler();

						// Focus the current window so that keyboard input is forwarderd
						// to it. The timeout is needed, as this is function is often
						// called by the click on a jdots-tab. And that click immediately
						// focuses the outer window again.
						if (browser.iframe && browser.iframe.contentWindow)
						{
							browser.iframe.contentWindow.focus();
						}
						else
						{
							window.focus();
						}
					}, 100);
				}
			}

			if (this.notifyTabChangeEnabled)
			{
				//Send the current tab list to the server
				var data = this.assembleTabList();

				//Serialize the tab list and check whether it really has changed since the last
				//submit
				var serialized = egw.jsonEncode(data);
				if (serialized != this.serializedTabState)
				{
					this.serializedTabState = serialized;

					var request = egw.jsonq("home.jdots_framework.ajax_tab_changed_state", [data]);
				}
			}
		},


		/**
		 * 
		 * @param {app object} _app
		 * @param {int} _pos
		 * Checks whether the application already owns a tab and creates one if it doesn't exist
		 */
		createApplicationTab: function(_app, _pos)
		{
			//Default the pos parameter to -1
			if (typeof _pos == 'undefined')
				_pos = -1;

			if (_app.tab == null)
			{
				//Create the tab
				_app.tab = this.tabsUi.addTab(_app.icon, this.tabClickCallback, this.tabCloseClickCallback,
					_app, _pos);
				_app.tab.setTitle(_app.displayName);

				//Set the tab closeable if there's more than one tab
				this.tabsUi.setCloseable(this.tabsUi.tabs.length > 1);

				// Check for too many tabs, and adjust width if needed
				this.checkTabOverflow();
			}
		},

		/**
		 * Check to see if the tab header will overflow and want to wrap.
		 * Deal with it by setting some smaller widths on the tabs.
		 */
		checkTabOverflow: function()
		{
			var width = 0;
			var outer_width = $j(this.tabsUi.contHeaderDiv).width();
			var spans = $j(this.tabsUi.contHeaderDiv).children('span');
			spans.css('max-width','');
			spans.each(function() { width += $j(this).outerWidth(true);});
			if(width > outer_width)
			{
				var max_width = Math.floor(outer_width / this.tabsUi.contHeaderDiv.childElementCount) -
					(spans.outerWidth(true) - spans.width());
				spans.css('max-width',max_width + 'px');
			}
		},

		/**
		 * Navigate to the tab of an application (opening the tab if not yet open)
		 *
		 * @param {egw_fw_class_application} _app
		 * @param {string} _url optional url, default index page of app
		 * @param {bool} _hidden specifies, whether the application should be set active
		 *   after opening the tab
		 * @param {int} _pos
		 */
		applicationTabNavigate: function(_app, _url, _hidden, _pos)
		{
			//Default the post parameter to -1
			if (typeof _pos == 'undefined')
				_pos = -1;

			//Create the tab for that application
			this.createApplicationTab(_app, _pos);

			if (typeof _url == 'undefined' || _url == null)
			{
				_url = _app.indexUrl;
			}
			else if (_app.browser != null &&
				// check if app has its own linkHandler
				!(this.applications[_app.appName].app_refresh) &&
				_app.browser.iframe == null && _url == _app.browser.currentLocation)
			{
				// Just do an egw_refresh to avoid a full reload
				egw_refresh('',_app.appName);
				//Show the application tab
				if (_app.tab)
				{
					this.setActiveApp(_app);
				}
				return;
			}

			if (_app.browser == null)
			{
				//Create a new browser ui and set it as application tab callback
				var callback = new egw_fw_class_callback(this, this.getIFrameHeight);
				_app.browser = new jdots_browser(_app, callback);
				_app.tab.setContent(_app.browser.baseDiv);
			}

			if (typeof _hidden == 'undefined' || !_hidden)
			{
				_app.browser.browse(_url);
				this.setActiveApp(_app);
			}
			else
			{
				this.notifyTabChange();
			}
		},
		

		/**
		 * @param {string} _url
		 * Tries to obtain the application from a menuaction
		 */
		parseAppFromUrl: function(_url)
		{
			var _app = null;

			//Read the menuaction parts from the url and check whether the first part
			//of the url contains a valid app name
			var matches = _url.match(/menuaction=([a-z0-9_-]+)\./i);
			if (matches && (_app = this.getApplicationByName(matches[1])))
			{
				return _app;
			}

			//Check the url for a scheme of "/app/something.php" and check this one for a valid app
			//name
			var matches = _url.match(/\/([^\/]+)\/[^\/]+\.php/i);
			if (matches && (_app = this.getApplicationByName(matches[1])))
			{
				return _app;
			}

			return null;
		},

		/**
		 * loadApplications refreshes the list of applications. Upon calling, all existing applications
		 * will be deleted from the list, and all open tabs will be closed.
		 *
		 * @param {array} apps array of objects per application with following attributes:
		 *	- string name application name
		 *	- string title application title as displayed to user
		 *	- string icon url of application icon
		 *	- string url index url of application
		 *	- int opened order of open tabs starting with 0, not set for closed apps
		 *	- boolean active true for the active app
		 *	- boolean noNavbar true if application is NOT shown in navigation
		 *	- boolean isDefault default app of user (currently not used)
		 */
		loadApplications: function(apps)
		{
			//Close all open tabs, remove all applications from the application list
			this.sidemenuUi.clean();
			this.tabsUi.clean();

			var defaultApp = null;
			var restore = new Object;
			var restore_count = 0;

			var mkRestoreEntry = function(_app, _pos, _url, _active) {
				return {
					'app': _app,
					'position': _pos,
					'url': _url,
					'active': _active
				};
			};

			//Iterate through the application array returned
			for (var i = 0; i < apps.length; i++)
			{
				var app = apps[i];

				// Retrieve the application base url
				var baseUrl = false;
				if (typeof app.baseUrl == 'string')
				{
					baseUrl = app.baseUrl;
				}

				// Compute the instance internal name
				var internalName = app.name;
				if (typeof app.internalName == 'string')
				{
					internalName = app.internalName;
				}

				this.appData = new egw_fw_class_application(this,
					app.name, app.title, app.icon, app.url, app.sideboxwidth,
					baseUrl, internalName);

				//Create a sidebox menu entry for each application
				if (!app.noNavbar)
				{
					this.appData.sidemenuEntry = this.sidemenuUi.addEntry(
						this.appData.displayName, this.appData.icon,
						this.applicationClickCallback, this.appData, app.name);
				}

				//If this entry is the default entry, show it using the click callback
				if (app.isDefault && (app.isDefault === true) && (restore.length == 0))
				{
					defaultApp = this.appData;
				}

				//If the opened field is set, add the application to the restore array.
				if ((typeof app.opened != 'undefined') && (app.opened !== false))
				{
					defaultApp = null;

					var url = null;
					if (typeof app.openOnce != 'undefined' && app.openOnce)
						url = app.openOnce;

					restore[this.appData.appName] = mkRestoreEntry(this.appData, app.opened,
						url, app.active ? 1 : 0);
					restore_count += 1;
				}

				this.applications[this.appData.appName] = this.appData;
			}

			//Processing of the url or the defaultApp is now deactivated.

		/*	// check if a menuaction or app is specified in the url --> display that
			var _app = this.parseAppFromUrl(window.location.href);
			if (_app)
			{
				//If this app is already opened, don't change its position. Otherwise
				//add it to the end of the tab list
				var appPos = restore_count;
				if (typeof restore[_app.appName] != 'undefined')
					appPos = restore[_app.appName].position;

				restore[_app.appName] = mkRestoreEntry(_app, appPos,
					window.location.href.replace(/&?cd=yes/,''), 2);
			}*/

			// else display the default application
			if (defaultApp && restore_count == 0)
			{
				restore[defaultApp.appName] = mkRestoreEntry(defaultApp, 0, null, 1);
			}

			//Generate an array with all tabs which shall be restored sorted in by
			//their active state

			//Fill in the sorted_restore array...
			var sorted_restore = [];
			for (this.appName in restore)
				sorted_restore[sorted_restore.length] = restore[this.appName];

			//...and sort it
			sorted_restore.sort(function (a, b) {
				return ((a.active < b.active) ? 1 : ((a.active == b.active) ? 0 : -1));
			});

			//Now actually restore the tabs by passing the application, the url, whether
			//this is an legacyApp (null triggers the application default), whether the
			//application is hidden (only the active tab is shown) and its position
			//in the tab list.
			for (var i = 0; i < sorted_restore.length; i++)
				this.applicationTabNavigate(
					sorted_restore[i].app, sorted_restore[i].url, i != 0,
					sorted_restore[i].position);

			this.scrollAreaUi.update();

			//Set the current state of the tabs and activate TabChangeNotification.
			this.serializedTabState = egw.jsonEncode(this.assembleTabList());
			this.notifyTabChangeEnabled = true;

			// Disable loader, if present
			$j('#egw_fw_loading').hide();
		},

		/**
		 * Goes through all applications and returns the application with the specified name.
		 * @param {string} _name the name of the application which should be returned.
		 * @return object or null if application is not found.
		 */
		getApplicationByName: function(_name)
		{
			if (typeof this.applications[_name] != 'undefined')
			{
				return this.applications[_name];
			}

			return null;
		},

		/**
		 * @param {function} _opened
		 * Sends sidemenu entry category open/close information to the server using an AJAX request
		 */
		categoryOpenCloseCallback: function(_opened)
		{
			egw.set_preference(this.tag.appName, 'jdots_sidebox_'+this.catName, _opened);
		},

		categoryAnimationCallback: function()
		{
			this.tag.parentFw.scrollAreaUi.update();
		},

		/**
		 * Sets the sidebox data of an application
		 * @param {object} _app the application whose sidebox content should be set.
		 * @param {object} _data an array/object containing the data of the sidebox content
		 * @param {string} _md5 an md5 hash of the sidebox menu content: Only if this hash differs between two setSidebox calles, the sidebox menu will be updated.
		 */
		setSidebox: function(_app, _data, _md5)
		{
			if (typeof _app == 'string') _app = this.getApplicationByName(_app);

			if ((_app != null) && (_app.sidebox_md5 != _md5) && (_app.sidemenuEntry != null))
			{
				//Parse the sidebox data
				if (_data != null)
				{
					var contDiv = document.createElement('div');
					var contJS = ''; //new Array();
					for (var i = 0; i < _data.length; i++)
					{
						var catContent = '';
						for (var j = 0; j < _data[i].entries.length; j++)
						{
							/* As jquery executes all script tags which are found inside
							   the html and removes them afterwards, we have to seperate the
							   javaScript from the html in lang_item and add it manually. */
							this.html = new Object();
							this.html.html = _data[i].entries[j].lang_item;
							this.html.js = '';

							egw_seperateJavaScript(this.html);
							contJS += this.html.js;//contJS.concat(html.js);

							if (_data[i].entries[j].icon_or_star)
							{
								catContent += '<div class="egw_fw_ui_sidemenu_listitem"><img class="egw_fw_ui_sidemenu_listitem_icon" src="' + _data[i].entries[j].icon_or_star + '" />';
							}
							if (_data[i].entries[j].item_link == '')
							{
								catContent += this.html.html;
							}
							else
							{
								var link = _data[i].entries[j].item_link;
								if (link)
								{
									catContent += '<a href="' + link +
										(_data[i].entries[j].target ? '" target="'+_data[i].entries[j].target : '') +
										'">' + this.html.html + '</a>';
								}
							}
							if (_data[i].entries[j].icon_or_star)
							{
								catContent += '</div>';
							}
						}

						/* Append the category content */
						if (catContent != '')
						{
							var categoryUi = new egw_fw_ui_category(contDiv,_data[i].menu_name,
								_data[i].title, catContent, this.categoryOpenCloseCallback,
								this.categoryAnimationCallback, _app);

							//Lookup whether this entry was opened before. If no data is
							//stored about this, use the information we got from the server
							var opened = egw.preference('jdots_sidebox_'+_data[i].menu_name, _app.appName);
							if (typeof opened == 'undefined')
							{
								opened = _data[i].opened;
							}

							if (opened)
							{
								categoryUi.open(true);
							}
						}
					}
					// Stop ajax loader spinner icon in case there's no data and still is not stopped
					if (_data.length <= 0) _app.sidemenuEntry.hideAjaxLoader();
					//Rewrite all form actions if they contain some javascript
					var forms = $j('form', contDiv).toArray();
					for (var i = 0; i < forms.length; ++i)
					{
						var form = forms[i];
						if (form.action.indexOf('javascript:') == 0)
						{
							var action = form.action.match(/\('([^']*)/)[0].substr(2);
							form.action = action;
							form.target = 'egw_app_iframe_' + this.parseAppFromUrl(action).appName;
						}
					}

					_app.sidemenuEntry.setContent(contDiv);
					_app.sidebox_md5 = _md5;

					//console.log(contJS);
					$j(contDiv).append(contJS);
				}

				_app.hasSideboxMenuContent = true;

				//Only view the sidemenu content if this is really the active application
				if (_app == _app.parentFw.activeApp)
				{
					//Set the sidebox width if a application specific sidebox width is set
					if (_app.sideboxWidth !== false)
					{
						this.sideboxSizeCallback(_app.sideboxWidth);
						this.splitterUi.constraints[0].size = _app.sideboxWidth;
					}
					_app.sidemenuEntry.parent.open(_app.sidemenuEntry);
					_app.parentFw.scrollAreaUi.update();
					_app.parentFw.scrollAreaUi.setScrollPos(0);

					// reliable init sidebox, as app.js might initialise earlier
					if (typeof app[_app.appName] == 'object')
					{
						var sidebox = $j('#favorite_sidebox_'+_app.appName, this.sidemenuDiv);
						var self = this;
						var currentAppName = _app.appName;
						// make sidebox
						sidebox.children().sortable({

							items:'li:not([data-id$="add"])',
							placeholder:'ui-fav-sortable-placeholder',
							update: function (event, ui)
							{
								var favSortedList = jQuery(this).sortable('toArray', {attribute:'data-id'});

								egw().set_preference(currentAppName,'fav_sort_pref',favSortedList);
							}
						});
						if (sidebox.length) app[_app.appName]._init_sidebox.call(app[_app.appName], sidebox);
					}
				}
			}
		},

		/**
		 * Sets the website title of an application
		 * @param {object} _app the application whose title should be set.
		 * @param {string} _title title to set
		 * @param {object} _header
		 */
		setWebsiteTitle: function(_app, _title, _header)
		{
			if (typeof _app == 'string') _app = this.getApplicationByName(_app);

			if (_app) {
				_app.website_title = _title;

				// only set app_header if different from app-name
				if (_header && _header != egw.lang(_app.appName))
				{
					_app.app_header = _header;
				}
				else
				{
					_app.app_header = '';
				}
				if (_app == this.activeApp)
					this.refreshAppTitle();
			}
		},

		/**
		 * Display an error or regular message
		 *
		 * @param {string} _msg message to show
		 * @param {string} _type 'error', 'warning' or 'success' (default)
		 */
		setMessage: function(_msg, _type)
		{
			if (typeof _type == 'undefined')
				_type = _msg.match(/error/i) ? 'error' : 'success';

			if (this.messageTimer)
			{
				window.clearTimeout(this.messageTimer);
				delete this.messageTimer;
			}

			this.tabsUi.setAppHeader(_msg, _type+'_message');
			this.resizeHandler();

			if (_type != 'error')	// clear message again after some time, if no error
			{
				var self = this;
				this.messageTimer = window.setTimeout(function() {
					self.refreshAppTitle.call(self);
				}, 5000);
			}
		},

		refreshAppTitle: function()
		{
			if (this.activeApp)
			{
				if (this.messageTimer)
				{
					window.clearTimeout(this.messageTimer);
					delete this.messageTimer;
				}

				this.tabsUi.setAppHeader(this.activeApp.app_header);
				document.title = this.activeApp.website_title;
			}

			this.resizeHandler();
		},

		/**
		 * Change timezone and refresh current app
		 * @param _tz
		 */
		tzSelection: function(_tz)
		{
			//Perform an AJAX request to tell server
			var req = egw.json('home.jdots_framework.ajax_tz_selection.template',[_tz],null,null,false); // false = synchron
			req.sendRequest();

			if (this.activeApp.browser)
			{
				this.activeApp.browser.reload();
			}
		},

		linkHandler: function(_link, _app, _useIframe, _linkSource)
		{
			//Determine the app string from the application parameter
			var app = null;
			if (_app && typeof _app == 'string')
			{
				app = this.getApplicationByName(_app);
			}

			if (!app)
			{
				//The app parameter was false or not a string or the application specified did not exists.
				//Determine the target application from the link that had been passed to this function
				app = this.parseAppFromUrl(_link);
			}

			if (app)
			{
				this.applicationTabNavigate(app, _link);
			}
			else
			{
				//Display some error messages to have visible feedback
				if (typeof _app == 'string')
				{
					egw_alertHandler('Application "' + _app + '" not found.',
						'The application "' + _app + '" the link "' + _link + '" points to is not registered.');
				}
				else
				{
					egw_alertHandler("No appropriate target application has been found.",
						"Target link: " + _link);
				}
			}
		},

		egw_openWindowCentered2: function(_url, _windowName, _width, _height, _status, _app, _returnID)
		{
			if (typeof _returnID == 'undefined') _returnID = false;
			var windowWidth = egw_getWindowOuterWidth();
			var windowHeight = egw_getWindowOuterHeight();

			var positionLeft = (windowWidth/2)-(_width/2)+egw_getWindowLeft();
			var positionTop  = (windowHeight/2)-(_height/2)+egw_getWindowTop();

			//Determine the window the popup should be opened in - normally this is the iframe of the currently active application
			var parentWindow = window;
			var navigate = false;
			if (typeof _app != 'undefined' && _app !== false)
			{
				var appEntry = framework.getApplicationByName(_app);
				if (appEntry && appEntry.browser == null)
				{
					navigate = true;
					framework.applicationTabNavigate(appEntry, 'about:blank');
				}
			}
			else
			{
				var appEntry = framework.activeApp;
			}

			if (appEntry != null && appEntry.browser.iframe != null)
				parentWindow = appEntry.browser.iframe.contentWindow;

			var windowID = parentWindow.open(_url, _windowName, "width=" + _width + ",height=" + _height +
				",screenX=" + positionLeft + ",left=" + positionLeft + ",screenY=" + positionTop + ",top=" + positionTop +
				",location=no,menubar=no,directories=no,toolbar=no,scrollbars=yes,resizable=yes,status="+_status);

			// inject framework and egw object, because opener might not yet be loaded and therefore has no egw object!
			windowID.egw = window.egw;
			windowID.framework = framework;

			if (navigate)
			{
				window.setTimeout("framework.applicationTabNavigate(framework.activeApp, framework.activeApp.indexUrl);", 500);
			}

			if (_returnID === false)
			{
				// return nothing
			}
			else
			{
				return windowID;
			}
		},

		egw_appWindow: function(_app)
		{
			var app = framework.getApplicationByName(_app);
			var result = window;
			if (app != null && app.browser != null && app.browser.iframe != null)
			{
				result = app.browser.iframe.contentWindow;
			}
			return result;
		},

		egw_appWindowOpen: function(_app, _url)
		{
			if (typeof _url == "undefined") {
				_url = "about:blank";
			}

			// Do a global location change if the given application name is null (as this function
			// is called by egw_json.js redirect handler, where the _app parameter defaults to null)
			if (_app == null) {
				window.location = _url;
			}

			var app = null;
			if (typeof _app == "string") {
				app = framework.getApplicationByName(_app);
			} else {
				app = _app;
			}

			if (app != null) {
				framework.applicationTabNavigate(app, _url);
			}
		},

		egw_getAppName: function()
		{
			return framework.activeApp.appName;
		}
	});
	
	/**
	* Initialise framework
	*/
	egw_LAB.wait(function() {
		function egw_setSideboxSize(_size)
		{
			document.getElementById('egw_fw_main').style.marginLeft = _size + 'px';
			document.getElementById('egw_fw_sidebar').style.width = _size + 'px';
		}

		$j(document).ready(function() {
			window.framework = new fw_jdots("egw_fw_sidemenu", "egw_fw_tabs", "egw_fw_splitter",
					window.egw_webserverUrl, egw_setSideboxSize, 255, 215);	// should be identical to jdots_framework::(DEFAULT|MIN)_SIDEBAR_WIDTH
			window.callManual = window.framework.callManual;
			jQuery('#egw_fw_print').click(function(){window.framework.print();});
			jQuery('#egw_fw_logout').click(function(){ window.framework.redirect(this.getAttribute('data-logout-url')); });
			jQuery('form[name^="tz_selection"]').children().on('change', function(){framework.tzSelection(this.value);	return false;});
			window.egw.link_quick_add('quick_add');

			// allowing javascript urls in topmenu and sidebox only under CSP by binding click handlers to them
			var href_regexp = /^javascript:([^\(]+)\((.*)?\);?$/;
			jQuery('#egw_fw_topmenu_items,#egw_fw_topmenu_info_items,#egw_fw_sidemenu,#egw_fw_footer').on('click','a[href^="javascript:"]',function(ev){
				ev.stopPropagation();	// do NOT execute regular event, as it will violate CSP, when handler does NOT return false
				var matches = this.href.match(href_regexp);
				var args = [];
				if (matches.length > 1 && matches[2] !== undefined)
				{
					try {
						args = JSON.parse('['+matches[2]+']');
					}
					catch(e) {	// deal with '-encloded strings (JSON allows only ")
						args = JSON.parse('['+matches[2].replace(/','/g, '","').replace(/((^|,)'|'(,|$))/g, '$2"$3')+']');
					}
				}
				args.unshift(matches[1]);
				et2_call.apply(this, args);
				return false;	// IE11 seems to require this, ev.stopPropagation() does NOT stop link from being executed
			});
		});
	});

	
})(window);
