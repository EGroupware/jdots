<?php
/**
 * EGroupware: jdots template
 *
 * @link http://www.egroupware.org
 * @package jdots
 * @author Andreas Stöckel
 * @author Ralf Becker <rb@egroupware.org>
 * @author Nathan Gray <ng@egroupware.org>
 * @license http://opensource.org/licenses/gpl-license.php GPL - GNU General Public License
 * @version $Id$
 */

$GLOBALS['egw_info']['template']['jdots']['name']      = 'jdots';
$GLOBALS['egw_info']['template']['jdots']['title']     = 'jDots';
$GLOBALS['egw_info']['template']['jdots']['version']   = '16.1';

$GLOBALS['egw_info']['template']['jdots']['author'] = array(
	array('name' => 'Andreas Stoeckel'),
	array('name' => 'Ralf Becker', 'email' => 'rb@egroupware.org'),
	array('name' => 'Nathan Gray', 'email' => 'ng@egroupware.org'),
);
$GLOBALS['egw_info']['template']['jdots']['license'] = 'GPL';
$GLOBALS['egw_info']['template']['jdots']['icon'] = "jdots/images/jdots-logo.png";
$GLOBALS['egw_info']['template']['jdots']['maintainer'] = array(
   array('name' => 'EGroupware GmbH', 'url' => 'http://www.egroupware.org/')
);
$GLOBALS['egw_info']['template']['jdots']['description'] = "jDots was the  jQuery based default template set for EGroupware EPL 11.1.";
$GLOBALS['egw_info']['template']['jdots']['windowed'] = true;
$GLOBALS['egw_info']['template']['jdots']['icon'] = 'jdots/images/epl.png';

// Dependencies for this template to work
$GLOBALS['egw_info']['template']['pixelegg']['depends'][] = array(
	'appname' => 'api',
	'versions' => Array('16.1')
);
