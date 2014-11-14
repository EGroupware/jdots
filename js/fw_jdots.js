/**
 * eGroupware Framework jdots object
 * @package framework
 * @author Hadi Nategh <hn@stylite.de>
 * @author Andreas Stoeckel <as@stylite.de>
 * @copyright Stylite AG 2014
 * @description Create jdots framework
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
	var jdots_ui_sidemenu_entry = fw_ui_sidemenu_entry.extend({
		
		/**
		 * Override fw_ui_sidemenu_entry class constructor
		 * 
		 * @returns {undefined}
		 */
		init: function()
		{
			this._super.apply(this,arguments);
			
			this.setBottomLine(this.parent.entries);
			//Make the base Div sortable. Set all elements with the style "egw_fw_ui_sidemenu_entry_header"
			//as handle
			if($j(this.elemDiv).data('uiSortable'))
			{
				$j(this.elemDiv).sortable("destroy");
			}
			$j(this.elemDiv).sortable({
				handle: ".egw_fw_ui_sidemenu_entry_header",
				distance: 15,
				start: function(event, ui)
				{
					var parent = ui.item.context._parent;
					parent.isDraged = true;
					parent.parent.startDrag.call(parent.parent);
				},
				stop: function(event, ui)
				{
					var parent = ui.item.context._parent;
					parent.parent.stopDrag.call(parent.parent);
					parent.parent.refreshSort.call(parent.parent);
				},
				opacity: 0.7,
				axis: 'y'
			});
		},
		
		/**
		 * setBottomLine marks this element as the bottom element in the application list.
		 * This adds the egw_fw_ui_sidemenu_entry_content_bottom/egw_fw_ui_sidemenu_entry_header_bottom CSS classes
		 * which should care about adding an closing bottom line to the sidemenu. These classes are removed from
		 * all other entries in the side menu.
		 * @param {type} _entryList is a reference to the list which contains the sidemenu_entry entries.
		 */
	   setBottomLine: function(_entryList)
	   {
		   //If this is the last tab in the tab list, the bottom line must be closed
		   for (var i = 0; i < _entryList.length; i++)
		   {
			   $j(_entryList[i].contentDiv).removeClass("egw_fw_ui_sidemenu_entry_content_bottom");
			   $j(_entryList[i].headerDiv).removeClass("egw_fw_ui_sidemenu_entry_header_bottom");
		   }
		   $j(this.contentDiv).addClass("egw_fw_ui_sidemenu_entry_content_bottom");
		   $j(this.headerDiv).addClass("egw_fw_ui_sidemenu_entry_header_bottom");
	   }
	});
	
	/**
	 * 
	 * @type @exp;fw_ui_sidemenu@call;extend
	 */
	var jdots_ui_sidemenu = fw_ui_sidemenu.extend({
		
		/**
		 * 
		 * @returns {undefined}
		 */
		init: function(_baseDiv, _sortCallback)
		{
			this._super.apply(this,arguments);
			this.sortCallback = _sortCallback;
		},
		/**
		 * 
		 * @returns {undefined}
		 */
		startDrag: function()
		{
			if (this.activeEntry)
			{
				$j(this.activeEntry.marker).show();
				$j(this.elemDiv).sortable("refresh");
			}
		},
		
		/**
		 * 
		 * @returns {undefined}
		 */
		stopDrag: function()
		{
			if (this.activeEntry)
			{
				$j(this.activeEntry.marker).hide();
				$j(this.elemDiv).sortable("refresh");
			}
		},

		/**
		 * Called by the sidemenu elements whenever they were sorted. An array containing
		 * the sidemenu_entries ui-objects is generated and passed to the sort callback
		 */
		refreshSort: function()
		{
			//Step through all children of elemDiv and add all markers to the result array
			var resultArray = new Array();
			this._searchMarkers(resultArray, this.elemDiv.childNodes);

			//Call the sort callback with the array containing the sidemenu_entries
			this.sortCallback(resultArray);
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
		   var entry = new jdots_ui_sidemenu_entry(this, this.baseDiv, this.elemDiv, _name, _icon,
			   _callback, _tag, _app);
		   this.entries[this.entries.length] = entry;

		   return entry;
		},

	});
	
	/**
	 * jdots framework object defenition
	 * here we can add framework methods and also override fw_base methods if it is neccessary
	 * @type @exp;fw_base@call;extend
	 */
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
		init:function (_sidemenuId, _tabsId, _webserverUrl, _sideboxSizeCallback, _splitterId, _sideboxStartSize, _sideboxMinSize)
		{
			// call fw_base constructor, in order to build basic DOM elements
			this._super.apply(this,arguments);
			
			this.splitterDiv = document.getElementById(_splitterId);
			if (this.sidemenuDiv && this.tabsDiv && this.splitterDiv)
			{
				//Wrap a scroll area handler around the applications
				this.scrollAreaUi = new egw_fw_ui_scrollarea(this.sidemenuDiv);

				//Create the sidemenu, the tabs area and the splitter
				this.sidemenuUi = new jdots_ui_sidemenu(this.scrollAreaUi.contentDiv,
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
		},
		
		/**
		 * 
		 * @returns {undefined}
		 */
		loadApplications: function (apps)
		{
			var restore = this._super.apply(this, arguments);
			
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

			//Set the current state of the tabs and activate TabChangeNotification.
			this.serializedTabState = egw.jsonEncode(this.assembleTabList());
			this.notifyTabChangeEnabled = true;
			
			this.scrollAreaUi.update();
			// Disable loader, if present
			$j('#egw_fw_loading').hide();

		},
		
		/**
		 * 
		 * @param {type} _app
		 * @returns {undefined}
		 */
		setActiveApp: function(_app)
		{
			this._super.apply(this, arguments);
			
			if (_app == _app.parentFw.activeApp)
			{
				//Set the sidebox width if a application specific sidebox width is set
				if (_app.sideboxWidth !== false)
				{
					this.sideboxSizeCallback(_app.sideboxWidth);
					this.splitterUi.constraints[0].size = _app.sideboxWidth;

				}
				_app.parentFw.scrollAreaUi.update();
				_app.parentFw.scrollAreaUi.setScrollPos(0);
			}
			//Resize the scroll area...
			this.scrollAreaUi.update();

			//...and scroll to the top
			this.scrollAreaUi.setScrollPos(0);
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
		 * Sets the sidebox data of an application
		 * @param {object} _app the application whose sidebox content should be set.
		 * @param {object} _data an array/object containing the data of the sidebox content
		 * @param {string} _md5 an md5 hash of the sidebox menu content: Only if this hash differs between two setSidebox calles, the sidebox menu will be updated.
		 */
		setSidebox: function(_app, _data, _md5)
		{
			this._super.apply(this,arguments);
			
			if (typeof _app == 'string') _app = this.getApplicationByName(_app);
			//Set the sidebox width if a application specific sidebox width is set
			if (_app == _app.parentFw.activeApp && _app.sideboxWidth !== false )
			{
				this.splitterUi.constraints[0].size = _app.sideboxWidth;
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
			this._super.apply(this, arguments);
			this.checkTabOverflow();
			
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
			window.framework = new fw_jdots("egw_fw_sidemenu", "egw_fw_tabs",
					window.egw_webserverUrl, egw_setSideboxSize,"egw_fw_splitter", 255, 215);	// should be identical to jdots_framework::(DEFAULT|MIN)_SIDEBAR_WIDTH
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
