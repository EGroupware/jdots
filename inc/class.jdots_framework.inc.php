<?php
/**
 * Stylite: jdots template
 *
 * @link http://www.stylite.de
 * @package jdots
 * @author Andreas Stöckel <as@stylite.de>
 * @author Ralf Becker <rb@stylite.de>
 * @author Nathan Gray <ng@stylite.de>
 * @license http://opensource.org/licenses/gpl-license.php GPL - GNU General Public License
 * @version $Id$
 */

use EGroupware\Api;

/**
* Stylite jdots template
*/
class jdots_framework extends Api\Framework\Ajax
{
	/**
	 * Appname used to include javascript code
	 */
	const JS_INCLUDE_APP = 'jdots';
	/**
	 * Appname used for everything else
	 */
	const APP = 'jdots';

	/**
	 * Constructor
	 *
	 * Overwritten to set own app/template name (parent can NOT use static::APP!)
	 *
	 * @param string $template ='pixelegg' name of the template
	 */
	function __construct($template=self::APP)
	{
		parent::__construct($template);		// call the constructor of the extended class

		$this->template_dir = '/'.$template;		// we are packaged as an application
	}

	/**
	 * Overwrite to add our customizable colors
	 *
	 * @see Api\Framework::_get_css()
	 * @return array
	 */
	public function _get_css()
	{
		$ret = parent::_get_css();

		// color to use
		$color = str_replace('custom',$GLOBALS['egw_info']['user']['preferences']['common']['template_custom_color'],
			$GLOBALS['egw_info']['user']['preferences']['common']['template_color']);
		// use active tab or header, beside sidebox
		if (($use_active_tab = $color[0] == '@')) $color = substr($color,1);

		if (preg_match('/^(#[0-9A-F]+|[A-Z]+)$/i',$color))	// a little xss check
		{
			$ret['app_css'] .= "
/**
 * theme changes to color jdots for color: $color
 */
.egw_fw_ui_sidemenu_entry_header_active, .egw_fw_ui_sidemenu_entry_content, .egw_fw_ui_sidemenu_entry_header:hover {
	background-color: $color;
	border-color: $color;
}
.egw_fw_ui_sidemenu_entry_header_active, .egw_fw_ui_sidemenu_entry_header:hover {
	background-image: url(jdots/images/gradient30transparent.png);
}
.egw_fw_ui_sidemenu_entry_content {
	background-image: url(jdots/images/gradient10transparent.png);
}
div .egw_fw_ui_sidemenu_entry_content > div {
	background-color: #ffffff;
}".($use_active_tab ? "
.egw_fw_ui_tab_header_active {
	background-image: url(jdots/images/gradient30transparent.png);
	background-color: $color;
}
" : "
.egw_fw_ui_tabs_header {
	background-image: url(jdots/images/gradient22transparent.png);
	background-color: $color;
}");
		}
		return $ret;
	}
}
