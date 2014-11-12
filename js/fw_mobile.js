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
		init: function()
		{
			this._super.apply(this,arguments);
			
		}
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
		init: function(_baseDiv, _sortCallback)
		{
			this._super.apply(this,arguments);
			
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
		 * @param {string} _splitterId splitter div id
		 * @param {string} _webserverUrl specifies the egroupware root url
		 * @param {function} _sideboxSizeCallback 
		 * @param {int} _sideboxStartSize sidebox start size
		 * @param {int} _sideboxMinSize sidebox minimum size
		 */
		init:function (_sidemenuId, _tabsId, _splitterId, _webserverUrl, _sideboxSizeCallback, _sideboxStartSize, _sideboxMinSize)
		{
			// call fw_base constructor, in order to build basic DOM elements
			this._super.apply(this,arguments);
			
			if (this.sidemenuDiv && this.tabsDiv)
			{
				//Wrap a scroll area handler around the applications
				this.scrollAreaUi = new egw_fw_ui_scrollarea(this.sidemenuDiv);

				//Create the sidemenu, the tabs area and the splitter
				this.sidemenuUi = new mobile_ui_sidemenu(this.scrollAreaUi.contentDiv,
					this.sortCallback);
				this.tabsUi = new egw_fw_ui_tabs(this.tabsDiv);
				
				var egw_script = document.getElementById('egw_script_id');
				var apps = egw_script ? egw_script.getAttribute('data-navbar-apps') : null;
				this.loadApplications(JSON.parse(apps));
			}

			_sideboxSizeCallback(_sideboxStartSize);
		},
		
		/**
		 * 
		 * @returns {undefined}
		 */
		loadApplications: function (apps)
		{
			this._super.apply(this, arguments);
			
			//Now actually restore the tabs by passing the application, the url, whether
			//this is an legacyApp (null triggers the application default), whether the
			//application is hidden (only the active tab is shown) and its position
			//in the tab list.
			for (var i = 0; i < apps.length; i++)
			{
				this.applicationTabNavigate(
					apps[i].app, apps[i].url, i != 0,
					apps[i].position);
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
			window.framework = new fw_mobile("egw_fw_sidemenu", "egw_fw_tabs", "egw_fw_splitter",
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
