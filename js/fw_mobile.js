/**
 * eGroupware jdots mobile framework object
 * @package framework
 * @author Hadi Nategh <hn@stylite.de>
 * @copyright Stylite AG 2014
 * @description Create jdots mobile framework
 */

"use strict";
/*egw:uses
	jquery.jquery;
	/phpgwapi/js/jquery/TouchSwipe/jquery.touchSwipe.js;
	framework.fw_base;
	framework.fw_browser;
	framework.fw_ui;
	egw_fw_classes;
	egw_inheritance.js;
*/
(function(window){
	/**
	 * 
	 * @type @exp;fw_ui_sidemenu_entry@call;extend
	 */
	var mobile_ui_sidemenu_entry = fw_ui_sidemenu_entry.extend({
		
		/**
		 * Override fw_ui_sidemenu_entry class constructor
		 * 
		 * @returns {undefined}
		 */
		init: function(_a)
		{
			this._super.apply(this,arguments);
			var self = this;
			var $sidebarMenu = $j(document.createElement("span"));
			$sidebarMenu
				.addClass('egw_fw_mobile_sidebarMenu')
				.swipe({
					tap:function()
					{
						self.toggleMenu();
					}
				})
				.appendTo(this.headerDiv);
		},
	});
	
	/**
	 * 
	 * @type @exp;fw_ui_sidemenu@call;extend
	 */
	var mobile_ui_sidemenu = fw_ui_sidemenu.extend({
		
		/**
		 * 
		 * @returns {undefined}
		 */
		init: function()
		{
			this._super.apply(this,arguments);
			var $baseDiv = $j(this.baseDiv);
			$baseDiv.swipe({
				swipe: function (e, direction,distance)
				{

					switch (direction)
					{
						case "up":
						case "down":
							if ($baseDiv.css('overflow') == 'hidden')
								$baseDiv.css('overflow-y','auto');
							break;	
						case "left":
							if (distance >= 100)
							{
								framework.toggleMenu();
							}
							
							break;
						 case "right":	
							 framework.toggleMenu();
					}
				},
				swipeStatus:function(event, phase, direction, distance, duration, fingers)
				{
					switch (direction)
					{

						
						
					}
				},
				allowPageScroll: "vertical",
			});
			// Do not attach sidebox application entries
			$j(this.elemDiv).detach();
		},
		/**
		 * Adds an entry to the sidemenu.
		 * @param {type} _name specifies the title of the new sidemenu entry
		 * @param {type} _icon specifies the icon displayed aside the title
		 * @param {type} _callback specifies the function which should be called when a callback is clicked
		 * @param {type} _tag extra data
		 * @param {type} _app application name
		 * 
		 * @returns {jdots_ui_sidemenu_entry}
		 */
		addEntry: function(_name, _icon, _callback, _tag, _app)
		{
		   //Create a new sidemenu entry and add it to the list
		   var entry = new mobile_ui_sidemenu_entry(this, this.baseDiv, this.elemDiv, _name, _icon,
			   _callback, _tag, _app);
		   this.entries[this.entries.length] = entry;

		   return entry;
		},

		/**
		 * Hide sidebar menu and top toolbar
		 */
		disable: function ()
		{
			$j(this.baseDiv).hide();
			$j('#egw_fw_top_toolbar').hide();
		},
		
		/**
		 * * Show sidebar menu and top toolbar
		 */
		enable: function ()
		{
			$j(this.baseDiv).show();
			$j('#egw_fw_top_toolbar').show();
		}
	});
	
	/**
	 * popup frame constructor
	 */
	var popupFrame = Class.extend({
		init:function(_iframe)
		{
			this.popupContainer = document.getElementsByClassName('egw_fw_mobile_popup_container');
			this.popupFrame = _iframe;
		},
		/**
		 * 
		 * @param {type} _url
		 * @param {type} _width
		 * @param {type} _height
		 * @param {type} _posX
		 * @param {type} _posY
		 * @returns {undefined}
		 */
		open: function(_url,_width,_height,_posX,_posY)
		{
			//Open iframe with the url
			this.popupFrame.src = _url;
			var self = this;
			var $popupContainer = $j(this.popupContainer);
			//this.resize(this.popupFrame,_width,_height,_posX,_posY);
			$j(this.popupFrame).on('load', function (){
				
				// set the popup toolbar position
				$j('.egw_fw_mobile_popup_toolbar').offset({top:this.offsetTop,left:this.offsetLeft});
				// bind click handler to close button
				$j('#egw_fw_mobile_popup_close').click(function (){
						self.popupFrame.contentWindow.close();
					});
					
				// Overrride window close function	
				this.contentWindow.close = $j.proxy(function ()
				{
					this.close();
				},self);
			});
			$popupContainer.show();
			
		},
		close: function ()
		{
			this.popupFrame.src = ''
			$j(this.popupContainer).hide();
		},
		
		resize: function (elem,_width,_height,_posX,_posY)
		{
			var $elem = $j(elem);
			if (_width && _height )
			{
				$elem.width(_width);
				$elem.height(_width);
			}
			if (_posX && _posY)
			{
				$elem.offset({top:_posX,left:_posY});
			}
				
		}
	});
	
	/**
	 * mobile framework object defenition
	 * here we can add framework methods and also override fw_base methods if it is neccessary
	 * @type @exp;fw_base@call;extend
	 */
	var fw_mobile = fw_base.extend({
		/**
		 * jdots framework constructor
		 * 
		 * @param {string} _sidemenuId sidebar menu div id
		 * @param {string} _tabsId tab area div id
		 * @param {string} _webserverUrl specifies the egroupware root url
		 * @param {function} _sideboxSizeCallback 
		 * @param {int} _sideboxStartSize sidebox start size
		 * @param {int} _sideboxMinSize sidebox minimum size
		 */
		init:function (_sidemenuId, _tabsId, _webserverUrl, _sideboxSizeCallback, _sideboxStartSize, _baseContainer, _mobileMenu, _popupFrame)
		{
			// call fw_base constructor, in order to build basic DOM elements
			this._super.apply(this,arguments);
			var self = this;
			
			//Bind handler to orientation change
			$j(window).on("orientationchange",function(event){
				self.orientation(event);
			});
			this.popupFrame = document.getElementById( _popupFrame);
			this.popupFrameUi = new popupFrame(this.popupFrame);
			
			this.baseContainer = document.getElementById(_baseContainer);
			this.mobileMenu = document.getElementById(_mobileMenu);
			var $mobileMenu = $j(this.mobileMenu).swipe({
				tap:function()
				{
					self.toggleMenu();
				}
			});
			if (this.sidemenuDiv && this.tabsDiv)
			{
				//Create the sidemenu, the tabs area
				this.sidemenuUi = new mobile_ui_sidemenu(this.sidemenuDiv);
				this.tabsUi = new egw_fw_ui_tabs(this.tabsDiv);
				
				var egw_script = document.getElementById('egw_script_id');
				var apps = egw_script ? egw_script.getAttribute('data-navbar-apps') : null;
				this.loadApplications(JSON.parse(apps));
			}
			
			this.sideboxSizeCallback(_sideboxStartSize);
		},
		
		/**
		 * 
		 * @returns {undefined}
		 */
		setSidebox:function()
		{
			this._super.apply(this,arguments);
			this.setSidebarState(this.activeApp.preferences.toggleMenu);
		},
		
		/**
		 * Check if the device is in landscape orientation
		 * 
		 * @returns {boolean} returns true if the device orientation is on landscape otherwise return false(protrait)
		 */
		isLandscape: function ()
		{
			//if there's no window.orientation then the default is landscape
			var orient = true;
			if (typeof window.orientation != 'undefined')
			{
				orient = window.orientation & 2?true:false;
			}
			return orient;
		},
		
		/**
		 * Arranging toolbar icons according to device orientation
		 * 
		 * @param {string} _orientation in order to determine which box should be transfered {"top"|"side"}.
		 * default value is landscape
		 */
		arrangeToolbar: function (_orientation)
		{
			var orientation = _orientation || 'landscape';
			var $toolbar = $j('#egw_fw_top_toolbar');
			//tabs container
			var $tabs = $j('.egw_fw_ui_tabs_header');
			
			if (orientation === 'landscape')
			{
				$toolbar.css('height','auto');
				this.toggleMenuResizeHandler(this.getToggleMenuState() === "off"?72:280);
				$tabs.appendTo('#egw_fw_sidemenu');
				// Remove tabs header portriat's specific styles
				$tabs.removeClass('tabs-header-portrait-collapsed');
			}
			else
			{
				$toolbar.css('height','60px');
				$tabs.appendTo($toolbar);
				this.toggleMenuResizeHandler(this.getToggleMenuState() === "off"?1:280);
				if (this.getToggleMenuState() === "off")
				{
					$tabs.addClass('tabs-header-portrait-collapsed');
				}
				else
				{
					$tabs.removeClass('tabs-header-portrait-collapsed');
				}
				//Tabs are scrollable
				if ($tabs[0].scrollHeight > $tabs.height())
				{
					$tabs.addClass('egw-fw-tabs-scrollable');
				}
			}
		},
		
		/**
		 * Orientation on change method
		 * @param {event} _event orientation event
		 */
		orientation: function (_event)
		{
			this.arrangeToolbar(this.isLandscape()?'landscape':'portrait');
		},
		
		/**
		 * Toggle sidebar menu
		 * @param {int} _delay delaying of toggleClass
		 */
		toggleMenu: function (_state)
		{
			var state = _state || this.getToggleMenuState();
			var collapseSize = this.isLandscape()?72:1;
			var expandSize = 280;
			var $toggleMenu = $j(this.baseContainer);
			var $tabs =  $j('.egw_fw_ui_tabs_header');
			if (state === 'on')
			{
				$toggleMenu.addClass('sidebar-toggle');
				if (!this.isLandscape()) $tabs.addClass('tabs-header-portrait-collapsed');
				this.toggleMenuResizeHandler(collapseSize);
				this.setToggleMenuState('off');
				
			}
			else
			{
				$toggleMenu.removeClass('sidebar-toggle');
				this.toggleMenuResizeHandler(expandSize);
				this.setToggleMenuState('on');
				if (!this.isLandscape()) $tabs.removeClass('tabs-header-portrait-collapsed');
			}
		},
		
		/**
		 * Gets the active app toggleMenu state value
		 *
		 * @returns {string} returns state value off | on
		 */
		getToggleMenuState: function ()
		{
			var $toggleMenu = $j(this.baseContainer);
			var state = ''
			if (typeof this.activeApp.preferences.toggleMenu!='undefined')
			{
				state = this.activeApp.preferences.toggleMenu;
			}
			else
			{
				state = $toggleMenu.hasClass('sidebar-toggle')?'off':'on';
					
			}
			return state;
		},
		
		/**
		 * Sets toggle menu state value
		 * @param {string} _state toggle state value, either off|on
		 */
		setToggleMenuState: function (_state)
		{
			if (_state === 'on' || _state === 'off')
			{
				this.activeApp.preferences['toggleMenu'] = _state;
				egw.set_preference(this.activeApp.appName,'egw_fw_mobile',this.activeApp.preferences);
			}
			else
			{
				egw().debug("error","The toggle menu value must be either on | off");
			}
		},
		/**
		 * set sidebar state
		 * @param {type} _state
		 * @returns {undefined}
		 */
		setSidebarState: function(_state)
		{
			var $toggleMenu = $j(this.baseContainer);
			if (_state === 'off')
			{
				$toggleMenu.addClass('sidebar-toggle');
				this.toggleMenuResizeHandler(72);
			}
			else
			{
				$toggleMenu.removeClass('sidebar-toggle');
				this.toggleMenuResizeHandler(280);
			}
		},
		
		/**
		 * 
		 * @returns {undefined}
		 */
		loadApplications: function (apps)
		{
			var restore = this._super.apply(this, arguments);
			var activeApp = '';

			//Now actually restore the tabs by passing the application, the url, whether
			//this is an legacyApp (null triggers the application default), whether the
			//application is hidden (only the active tab is shown) and its position
			//in the tab list.
			for (var app in this.applications)
			{
				if (typeof restore[app] == 'undefined')
				{
					restore[app]= {
						app:this.applications[app],
						url:this.applications[app].url
					};
				}
				if (restore[app].active !='undefined' && restore[app].active)
				{
					activeApp = app;
				}
				this.applicationTabNavigate(restore[app].app, restore[app].url, app == activeApp?false:true,
					-1);
			}
			//Set the current state of the tabs and activate TabChangeNotification.
			this.serializedTabState = egw.jsonEncode(this.assembleTabList());
		
			// Transfer tabs to the sidebar
			var $tabs = $j('.egw_fw_ui_tabs_header');
			$tabs.appendTo(this.sidemenuDiv);
			
			// Disable loader, if present
			$j('#egw_fw_loading').hide();
		},
		
		/**
		 * Sets the active framework application to the application specified by _app
		 *
		 * @param {egw_fw_class_application} _app application object
		 */
		setActiveApp: function(_app)
		{
			this._super.apply(this,arguments);
			
			this.activeApp.preferences = egw.preference('egw_fw_mobile',this.activeApp.appName)||{};
		},
		
		/**
		 * applicationClickCallback is used internally by fw_mobile in order to handle clicks on
		 * sideboxmenu
		 *
		 * @param {egw_fw_ui_tab} _sender specifies the tab ui object, the user has clicked
		 */
		applicationClickCallback: function(_sender)
		{
			this._super.apply(this,arguments);
		},
		
		/**
		 * tabClickCallback is used internally by egw_fw in order to handle clicks on
		 * a tab.
		 *
		 * @param {egw_fw_ui_tab} _sender specifies the tab ui object, the user has clicked
		 */
		tabClickCallback: function(_sender)
		{
		   this._super.apply(this,arguments);
		   
		   framework.setSidebarState(this.tag.preferences.toggleMenu);
		},
		
		
		toggleMenuResizeHandler:function(_size)
		{
			var size= _size || 280;
			this.sideboxSizeCallback(size);
			this.appData.browser.callResizeHandler();
		},
		
		/**
		 * Callback to calculate height of browser iframe or div
		 *
		 * @param {object} _iframe dom node of iframe or null for div
		 * @returns number in pixel
		 */
		getIFrameHeight: function(_iframe)
		{
			var height = this._super.apply(this, arguments);
			height +=  jQuery('#egw_fw_sidebar').offset().top;
			
			return height+40;
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
				_app.tab = this.tabsUi.addTab(_app.icon, this.tabClickCallback, function(){},
					_app, _pos);
				_app.tab.setTitle(_app.displayName);
			}
		},
		
		/**
		 * Opens popup window at the center inside an iframe
		 * 
		 * @param {type} _url popup url
		 * @param {type} _windowName name of popup window
		 * @param {type} _width width of window
		 * @param {type} _height height of window
		 * @param {type} _status 
		 * @param {type} _app application which popup belongs to it
		 * @param {type} _returnID
		 * @returns {window} returns window
		*/
		egw_openWindowCentered2: function(_url, _windowName, _width, _height, _status, _app, _returnID)
		{
			if (typeof _returnID == 'undefined') _returnID = false;
			var windowWidth = egw_getWindowOuterWidth();
			var windowHeight = egw_getWindowOuterHeight();

			var positionLeft = (windowWidth/2)-(_width/2)+egw_getWindowLeft();
			var positionTop  = (windowHeight/2)-(_height/2)+egw_getWindowTop();

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

			framework.popupFrameUi.open(_url,_width,_height,positionLeft,positionTop);
			
			
			var windowID = framework.popupFrame.contentWindow;
			
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

		
	});
	
	/**
	* Initialise mobile framework
	* @param {int} _size width size which sidebox suppose to be open
	* @param {boolean} _fixedFrame make either the frame fixed or resizable
	*/
	egw_LAB.wait(function() {
		function egw_setSideboxSize(_size,_fixedFrame)
		{
			var fixedFrame = _fixedFrame || false;
			var frameSize = _size;
			var sidebar = document.getElementById('egw_fw_sidebar');
			var mainFrame = document.getElementById('egw_fw_main');
			if (fixedFrame)
			{
				frameSize = 0;
				sidebar.style.zIndex = 999;
			}
			mainFrame.style.marginLeft = frameSize + 'px';
			sidebar.style.width = _size + 'px';
		}

		$j(document).ready(function() {
			window.framework = new fw_mobile("egw_fw_sidemenu", "egw_fw_tabs", 
					window.egw_webserverUrl, egw_setSideboxSize, 280, 'egw_fw_basecontainer', 'egw_fw_menu', 'egw_fw_mobile_popupFrame');
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
