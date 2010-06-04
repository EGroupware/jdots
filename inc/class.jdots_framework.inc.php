<?php
/**
 * Stylite: jdots template
 *
 * @link http://www.stylite.de
 * @package jdots
 * @author Andreas Stöckel <as@stylite.de>
 * @author Ralf Becker <rb@stylite.de>
 * @author Nathan Gray <ng@stylite.de>
 * @version $Id$
 */

/**
* Stylite jdots template
*/
class jdots_framework extends egw_framework
{
	/**
	* Contains array with linked icons in the topmenu
	*
	* @var mixed
	* @access public
	*/
	var $topmenu_icon_arr = array();

	/**
	 * Whether javascript:egw_link_handler calls (including given app) should be returned by the "link" function
	 * or just the link
	 * 
	 * @var string
	 */
	private static $link_app;

	/**
	* Contains array of information for additional topmenu items added
	* by hooks
	*/
	private static $hook_items = array();
	
	/**
	* Constructor
	*
	* @param string $template='idots' name of the template
	* @return idots_framework
	*/
	function __construct($template='jdots')
	{
		parent::__construct($template);		// call the constructor of the extended class
		
		$this->template_dir = '/jdots';		// we are packaged as an application
	}
	
	/**
	 * Extract applicaton name from given url (incl. GET parameters)
	 * 
	 * @param string $url
	 * @return string appname or NULL if it could not be detected (eg. constructing javascript urls)
	 */
	public static function app_from_url($url)
	{
		if (preg_match('/menuaction=([a-z0-9_-]+)\./i',$url,$matches))
		{
			return $matches[1];
		}
		if (preg_match('/\/([^\/]+)\/([^\/]+\.php)?(\?|\/|$)/',$url,$matches))
		{
			return $matches[1];
		}
		//error_log(__METHOD__."('$url') could NOT detect application!");
		return null;
	}

	/**
	 * Link url generator
	 *
	 * @param string	$string	The url the link is for
	 * @param string|array	$extravars	Extra params to be passed to the url
	 * @param string $link_app=null if appname or true, some templates generate a special link-handler url
	 * @return string	The full url after processing
	 */
	static function link($url = '', $extravars = '', $link_app=null)
	{
		if (is_null($link_app)) $link_app = self::$link_app;
		$link = parent::link($url,$extravars);
		// $link_app === true --> detect application, otherwise use given application
		if ($link_app && (is_string($link_app) || ($link_app = self::app_from_url($link))))
		{
			$link = "javascript:egw_link_handler('$link','$link_app');";
		}
		return $link;		
	}

	/**
	 * Redirects direct to a generated link
	 *
	 * @param string	$string	The url the link is for
	 * @param string|array	$extravars	Extra params to be passed to the url
	 */
	static function redirect_link($url = '',$extravars='')
	{
		egw::redirect(parent::link($url, $extravars));
	}

	/**
	 * Private var to store website_title between calls of header() and footer()
	 * 
	 * @var string
	 */
	private $website_title;

	/**
	 * Returns the html-header incl. the opening body tag
	 *
	 * @return string with html
	 */
	function header()
	{
		// make sure header is output only once
		if (self::$header_done) return '';
		self::$header_done = true;

		// add a content-type header to overwrite an existing default charset in apache (AddDefaultCharset directiv)
		header('Content-type: text/html; charset='.translation::charset());

		// catch error echo'ed before the header, ob_start'ed in the header.inc.php
		$content = ob_get_contents();
		ob_end_clean();

		// the instanciation of the template has to be here and not in the constructor,
		// as the old Template class has problems if restored from the session (php-restore)
		// todo: check if this is still true
		$this->tpl = new Template(common::get_tpl_dir('jdots'));
		$this->tpl->set_file(array('_head' => 'head.tpl'));
		$this->tpl->set_block('_head','head');
		$this->tpl->set_block('_head','framework');
		
		// include needed javascript files
		$js = $GLOBALS['egw']->js;
		$js->validate_file('.','egw_fw','jdots');
		$js->validate_file('.','egw_fw_ui','jdots');
		$js->validate_file('.','egw_fw_classes','jdots');
		$js->validate_file('jquery','jquery');
		$js->validate_file('jquery','jquery-ui');
		$js->validate_file('.','egw_json');

		$GLOBALS['egw']->jscalendar;
		$this->tpl->set_var($vars = $this->_get_header());
		$this->website_title = $vars['website_title'];
		$this->tpl->set_var($this->_get_navbar($this->_get_navbar_apps()));
		
		$this->tpl->set_var(array(
			'home_title' => $GLOBALS['egw_info']['apps']['home']['title'],
			'manual_title' => $GLOBALS['egw_info']['apps']['manual']['title'],
			'preferences_title' => $GLOBALS['egw_info']['apps']['preferences']['title'],
			'logout_title' => lang('Logout'),
		));
		
		$content .= $this->tpl->fp('out','head').$content;
		
		if (!isset($_GET['cd']) || $_GET['cd'] != 'yes')
		{
			return $content;
		}
		// add framework div's
		$this->tpl->set_var($this->_get_footer());
		$content .= $this->tpl->fp('out','framework');
		$content .= self::footer();
		
		echo $content;
		common::egw_exit();
	}

	/**
	* Returns the html from the body-tag til the main application area (incl. opening div tag)
	*
	* @return string with html
	*/
	function navbar()
	{
		if (self::$navbar_done) return '';
		self::$navbar_done = true;

		return ""; //"<h1>Navbar</h1>";
	}

	/**
	* displays a login screen
	*
	* @param string $extra_vars for login url
	*/
	function login_screen($extra_vars)
	{
		_debug_array($extra_vars);
	}

	/**
	* displays a login denied message
	*/
	function denylogin_screen()
	{
		return "Login not possible";
	}

	/**
	 * Array containing sidebox menus by applications and menu-name
	 * 
	 * @var array
	 */
	private $sideboxes;

	/**
	 * Should calls the first call to self::sidebox create an opened menu
	 * 
	 * @var boolean
	 */
	private $sidebox_menu_opened = true;

	/**
	 * Callback for sideboxes hooks, collects the data in a private var
	 *
	 * @param string $appname
	 * @param string $menu_title
	 * @param array $file
	 */
	public function sidebox($appname,$menu_title,$file)
	{
		if (!isset($file['menuOpened'])) $file['menuOpened'] = (boolean)$this->sidebox_menu_opened;
		$this->sidebox_menu_opened = false;

		$this->sideboxes[$appname][$menu_title] = $file;
	}

	/**
	 * Return sidebox data for an application
	 * 
	 * @param $appname
	 * @return array of array(
	 * 		'menu_name' => (string),	// translated title to display
	 * 		'opened'    => (boolean),	// menu opend or closed
	 *  	'entries'   => array(
	 *			array(
	 *				'lang_item' => translated menu item or html, i item_link === false
	 * 				'icon_or_star' => url of bullet images, or false for none
	 *  			'item_link' => url or false (lang_item contains complete html)
	 *  			'target' => target attribute fragment, ' target="..."' 
	 *			),
	 *			// more entries
	 *		),
	 * 	),
	 *	array (
	 *		// next menu
	 *	)
	 */
	public function get_sidebox($appname)
	{
		if (!isset($this->sideboxes[$appname]))
		{
			self::$link_app = $appname;
			// allow other apps to hook into sidebox menu of an app, hook-name: sidebox_$appname
			$this->sidebox_menu_opened = true;
			$GLOBALS['egw']->hooks->process('sidebox_'.$appname,array($appname),true);	// true = call independent of app-permissions
			
			// calling the old hook
			$this->sidebox_menu_opened = true;
			$GLOBALS['egw']->hooks->single('sidebox_menu',$appname);
			self::$link_app = null;
		}

		//If there still is no sidebox content, return null here
		if (!isset($this->sideboxes[$appname]))
		{
			return null;
		}

		$data = array();
		foreach($this->sideboxes[$appname] as $menu_name => &$file)
		{
			$current_menu = array(
				'menu_name' => $menu_name,
				'entries' => array(),
				'opened' => (boolean)$file['menuOpened'],
			);
			unset($file['menuOpened']);

			foreach($file as $item_text => $item_link)
			{
				if($item_text === '_NewLine_' || $item_link === '_NewLine_')
				{
					continue;
				}
				if (strtolower($item_text) == 'grant access' && $GLOBALS['egw_info']['server']['deny_user_grants_access'])
				{
					continue;
				}
		
				$var = array();
				$var['icon_or_star'] = $GLOBALS['egw_info']['server']['webserver_url'] . $this->template_dir.'/images/bullet.png';
				$var['target'] = '';
				if(is_array($item_link))
				{
					if(isset($item_link['icon']))
					{
						$app = isset($item_link['app']) ? $item_link['app'] : $appname;
						$var['icon_or_star'] = $item_link['icon'] ? common::image($app,$item_link['icon']) : False;
					}
					$var['lang_item'] = isset($item_link['no_lang']) && $item_link['no_lang'] ? $item_link['text'] : lang($item_link['text']);
					$var['item_link'] = $item_link['link'];
					if ($item_link['target'])
					{
						if (strpos($item_link['target'], 'target=') !== false)
						{
							$var['target'] = $item_link['target'];
						}
						else
						{
							$var['target'] = ' target="' . $item_link['target'] . '"';
						}
					}
				}
				else
				{
					$var['lang_item'] = lang($item_text);
					$var['item_link'] = $item_link;
				}
				$current_menu['entries'][] = $var;
			}
			$data[] = $current_menu;
		}
		return $data;
	}
	
	/**
	 * Ajax callback to store opened/closed status of menu's within one apps sidebox
	 * 
	 * @param string $app
	 * @param string $menu_name
	 * @param boolean $opened true = user opened menu, false = user closed it
	 * @todo implement storing and using stored values in get_sidebox
	 */
	public function ajax_sidebox_menu_opened($app,$menu_name,$opened)
	{
		
	}
	
	/**
	 * Return sidebox data for an application
	 * 
	 * Format see get_sidebox()
	 * 
	 * @param $appname
	 */
	public function ajax_sidebox($appname)
	{
		$response = egw_json_response::get();
		$response->data($this->get_sidebox($appname));
	}

	/**
	 * Prepare an array with apps used to render the navbar
	 * 
	 * @return array of array(
	 *  'name'  => app / directory name
	 * 	'title' => translated application title
	 *  'url'   => url to call for index
	 *  'icon'  => icon name
	 *  'icon_app' => application of icon
	 *  'icon_hover' => hover-icon, if used by template
	 *  'target'=> ' target="..."' attribute fragment to open url in target, popup or ''
	 * )
	 */
	public function ajax_navbar_apps()
	{
		$apps = parent::_get_navbar_apps();

		unset($apps['logout']);	// never display it
		if (isset($apps['about'])) $apps['about']['noNavbar'] = true;
		if (isset($apps['preferences'])) $apps['preferences']['noNavbar'] = true;
		if (isset($apps['manual'])) $apps['manual']['noNavbar'] = true;

		if (!($default_app = $GLOBALS['egw_info']['user']['preferences']['common']['default_app']))
		{
			$default_app = 'home';
		}
		if (isset($apps[$default_app]))
		{
			$apps[$default_app]['isDefault'] = true;
		}
		$response = egw_json_response::get();
		$response->data(array_values($apps));
	}
	
	/**
	 * Returns the html from the closing div of the main application area to the closing html-tag
	 *
	 * @return string
	 */
	function footer()
	{
		$vars = $this->_get_footer();

		$script = '';
		//Set the sidebox content
		if (!isset($_GET['cd']) || $_GET['cd'] != 'yes')
		{
			$app = $GLOBALS['egw_info']['flags']['currentapp'];
			$content = json_encode($this->get_sidebox($app));
			$md5 = md5($content);
			$script .= '<script type="text/javascript">
	if (typeof window.parent.framework != "undefined")
	{
		var app = window.parent.framework.getApplicationByName("'.$app.'");
		window.parent.framework.setSidebox(app,'.$content.',"'.$md5.'");
		window.parent.framework.setWebsiteTitle(app,"'.htmlspecialchars($this->website_title).'");
	}
</script>';
		}
		return $script."\n</body>\n</html>\n";
	}
}
