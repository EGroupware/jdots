/**
 * eGroupware JavaScript Framework
 *
 * @link http://www.egroupware.org
 * @author Andreas Stoeckel <as@stylite.de>
 * @version $Id$
 */


/**
 * Class: egw_fw
 * The egw_fw class is the base framework class. It wraps around all egw_fw_ui and
 * egw_fw_classes. It creates both, a side bar and a tab area and cares about linking.
 */


/**
 * The constructor of the egw_fw class.
 *
 * @param string _sidemenuId specifies the name of the div container which should contain the sidebar menu
 * @param string _tabsId specifies the name of the div container which should cotain the tab area
 * @param string _webserverUrl specifies the egroupware root url
 */
function egw_fw(_sidemenuId, _tabsId, _webserverUrl)
{
	/* Get the base div */
	this.sidemenuDiv = document.getElementById(_sidemenuId);
	this.tabsDiv = document.getElementById(_tabsId);
	this.webserverUrl = _webserverUrl;
	window.egw_webserverUrl = _webserverUrl;

	this.sidemenuUi = null;
	this.tabsUi = null;

	this.applications = new Array();

	if (this.sidemenuDiv && this.tabsDiv)
	{
		//Create the sidemenu and the tabs area
		this.sidemenuUi = new egw_fw_ui_sidemenu(this.sidemenuDiv);
		this.tabsUi = new egw_fw_ui_tabs(this.tabsDiv);

		this.loadApplications("home.jdots_framework.ajax_navbar_apps");
	}
}

/**
 * tabCloseClickCallback is used internally by egw_fw in order to handle clicks
 * on the close button of every tab.
 *
 * @param egw_fw_ui_tab _sender specifies the tab ui object, the user has clicked
 */
egw_fw.prototype.tabCloseClickCallback = function(_sender)
{
	//Save references to the application and the tabsUi as "this" will be deleted
	var app = this.tag;
	var tabsUi = this.parent;

	//At least one tab must stay open
	if (tabsUi.tabs.length > 1)
	{
		tabsUi.removeTab(this);
		app.tab = null;

		//Activate the new application in the sidebar menu
		app.parentFw.sidemenuUi.open(tabsUi.activeTab.tag.sidemenuEntry);
	}

	tabsUi.setCloseable(tabsUi.tabs.length > 1);
}

/**
 * tabClickCallback is used internally by egw_fw in order to handle clicks on
 * a tab.
 *
 * @param egw_fw_ui_tab _sender specifies the tab ui object, the user has clicked
 */
egw_fw.prototype.tabClickCallback = function(_sender)
{
	this.parent.showTab(this);
	this.tag.sidemenuEntry.parent.open(this.tag.sidemenuEntry);
}

/**
 * applicationClickCallback is used internally by egw_fw in order to handle clicks on
 * an application in the sidebox menu.
 *
 * @param egw_fw_ui_tab _sender specifies the tab ui object, the user has clicked
 */
egw_fw.prototype.applicationClickCallback = function(_sender)
{
	if (this.tag.hasSideboxMenuContent)
	{
		this.parent.open(this);
	}

	//If the application this sidemenu entry belongs to doesn't have a tab now,
	//create one
	if (this.tag.tab == null)
	{
		this.tag.tab = this.tag.parentFw.tabsUi.addTab(this.tag.icon,
			this.tag.parentFw.tabClickCallback, this.tag.parentFw.tabCloseClickCallback,
			this.tag);
		this.tag.tab.setContent("<iframe src=\"" + this.tag.execName + 
			(this.tag.execName.indexOf('?') >= 0 ? '&' : '?') + 'framecontent=1' + 
			"\" style=\"width:100%; height:700px; border:none;\"></iframe>");
		this.tag.tab.setTitle(this.tag.displayName);

		//Display the close buttons if one than more tab is visible
		this.tag.tab.parent.setCloseable(this.tag.tab.parent.tabs.length > 1);
	}

	//Show the tab belonging to the application
	this.tag.tab.parent.showTab(this.tag.tab);
}

/**
 * loadApplicationsCallback is internally used by egw_fw in order to handle the
 * receiving of the application list.
 *
 * @param object apps contains the parsed JSON data describing the applications.
 *	The JSON object should have the following structure
 *		apps = array[
 *			{
 *				string name (the internal name of the application)
 *				string title (the name of the application how it should be viewed)
 *				string icon (path to the icon of the application)
 *				string url (path to the application) //TODO: Change this
 *				[boolean isDefault] (whether this entry is the default entry which should be opened)
 *			}
 *		]
 */
egw_fw.prototype.loadApplicationsCallback = function(apps)
{
	var defaultAppEntry = null;

	//Iterate through the application array returned
	for (i = 0; i < apps.length; i++)
	{
		this.applications[i] = new egw_fw_class_application(this, 
			apps[i].name, apps[i].title, apps[i].icon, apps[i].url);

		//Create a sidebox menu entry for each application
		this.applications[i].sidemenuEntry = this.sidemenuUi.addEntry(
			this.applications[i].displayName, this.applications[i].icon,
			this.applicationClickCallback, this.applications[i]);

		//If this entry is the default entry, show it using the click callback
		if (apps[i].isDefault && (apps[i].isDefault === true))
		{
			defaultAppEntry = this.applications[i].sidemenuEntry;
		}
	}

	if (defaultAppEntry)
		this.applicationClickCallback.call(defaultAppEntry, null);
}

/**
 * loadApplications refreshes the list of applications. Upon calling, all existing applications
 * will be deleted from the list, and all open tabs will be closed. Then an AJAX request to the
 * given URL will be send in order to obtain the application list with JSON encoding.
 *
 * @param string _menuaction specifies the menuaction
 */
egw_fw.prototype.loadApplications = function(_menuaction)
{
	//Close all open tabs, remove all applications from the application list
	this.sidemenuUi.clean();
	this.tabsUi.clean();

	//Perform an AJAX request loading all available applications
	var req = new egw_json_request(_menuaction)
	req.sendRequest(true, this.loadApplicationsCallback, this);
}

/**
 * Goes through all applications and returns the application with the specified name.
 * @param string _name the name of the application which should be returned.
 * @return object or null if application is not found.
 */
egw_fw.prototype.getApplicationByName = function(_name)
{
	for (var i = 0; i < this.applications.length; i++)
	{
		if (this.applications[i].appName == _name)
		{
			return this.applications[i];
		}
	}

	return null;
}

/**
 * Sets the sidebox data of an application
 * @param object _app the application whose sidebox content should be set.
 * @param object _data an array/object containing the data of the sidebox content
 * @param string _md5 an md5 hash of the sidebox menu content: Only if this hash differs between two setSidebox calles, the sidebox menu will be updated.
 */
egw_fw.prototype.setSidebox = function(_app, _data, _md5)
{
	if ((_app != null) && (_app.sidebox_md5 != _md5))
	{
		//Parse the sidebox data
		if (_data != null)
		{
			var contDiv = document.createElement('div');
			for (var i = 0; i < _data.length; i++)
			{
				var catContent = '';
				for (var j = 0; j < _data[i].entries.length; j++)
				{
					if (_data[i].entries[j].item_link == '')
					{
						catContent += _data[i].entries[j].lang_item;
					}
					else
					{					
						catContent += '<li><a href="' + _data[i].entries[j].item_link + 
							'">' + _data[i].entries[j].lang_item + '</a></li>';
					}
				}
				if (catContent != '')
				{
					var categoryUi = new egw_fw_ui_category(contDiv, _data[i].menu_name, catContent);
				}
			}
			_app.sidemenuEntry.setContent(contDiv);
		}

		_app.hasSideboxMenuContent = true;
		_app.sidemenuEntry.parent.open(_app.sidemenuEntry);
	}
}

/*egw_fw.prototype.link*/

function egw_link(_link, _app)
{
	alert('LINK: ' + _link + ' APP: ' + _app);
}

