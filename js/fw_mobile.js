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
				.click(function(){
					self.toggleMenu();
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
					}
				},
				swipeStatus:function(event, phase, direction, distance, duration, fingers)
				{
					switch (direction)
					{

						case "left":
						//	$baseDiv.css('transform', 'translate3d(' + -distance + 'px,0px,0px)');
							break;
						 case "right":
						//	$baseDiv.css('transform', 'translate3d(' + distance + 'px,0px,0px)');
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
		 * Transfer tabs function takes carre of transfering all application tabs handlers either to sidebox or topBox
		 * 
		 * @param {string} _orientation in order to determine which box should be transfered {"top"|"side"}.
		 *	default value is "side"
		 */
		transferTabs: function(_orientation)
		{
			var orientation = _orientation || "side";
			
			var $tabs = $j('.egw_fw_ui_tabs_header');
			
			$tabs.appendTo(this.baseDiv);
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
		init:function (_sidemenuId, _tabsId, _webserverUrl, _sideboxSizeCallback, _sideboxStartSize, _baseContainer, _mobileMenu)
		{
			// call fw_base constructor, in order to build basic DOM elements
			this._super.apply(this,arguments);
			var self = this;
			this.baseContainer = document.getElementById(_baseContainer);
			this.mobileMenu = document.getElementById(_mobileMenu);
			var $mobileMenu = $j(this.mobileMenu).click(function(){
				self.toggleMenu();
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
		 * Toggle sidebar menu
		 * @returns {undefined}
		 */
		toggleMenu: function ()
		{
			var $toggleMenu = $j(this.baseContainer);
			var toggleState = $toggleMenu.hasClass('sidebarToggle');
			$toggleMenu.toggleClass('sidebarToggle',1);
			if (toggleState)
			{
				this.toggleMenuResizeHandler(280);
			}
			else
			{
				this.toggleMenuResizeHandler(72);
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
			
			this.sidemenuUi.transferTabs('side');
			// Disable loader, if present
			$j('#egw_fw_loading').hide();
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
		},
		
		
		toggleMenuResizeHandler:function(_size)
		{
			var size= _size || 255;
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
			
			return height;
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

	});
	
	/**
	* Initialise mobile framework
	*/
	egw_LAB.wait(function() {
		function egw_setSideboxSize(_size)
		{
			document.getElementById('egw_fw_main').style.marginLeft = _size + 'px';
			document.getElementById('egw_fw_sidebar').style.width = _size + 'px';
		}

		$j(document).ready(function() {
			window.framework = new fw_mobile("egw_fw_sidemenu", "egw_fw_tabs", 
					window.egw_webserverUrl, egw_setSideboxSize, 255, 'egw_fw_basecontainer', 'egw_fw_menu');
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
