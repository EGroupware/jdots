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
$GLOBALS['settings'] = array(
	'prefssection' => array(
		'type'   => 'section',
		'title'  => lang('Preferences for the %1 template set','Stylite'),
		'no_lang'=> true,
		'xmlrpc' => False,
		'admin'  => False,
	),
	'show_generation_time' => array(
		'type'   => 'check',
		'label'  => 'Show page generation time',
		'name'   => 'show_generation_time',
		'help'   => 'Show page generation time on the bottom of the page?',
		'xmlrpc' => False,
		'admin'  => False,
		'forced' => false,
	),
	'global_sidebar_width' => array(
		'type'   => 'check',
		'label'  => 'Sidebar menu width used globaly',
		'name'   => 'global_sidebar_width',
		'help'   => 'When checked, the width of the sidebar menu is stored for all applications',
		'xmlrpc' => false,
		'admin'  => false,
		'default'=> '1',
		'forced' => true,
	),
	'navbar_format' => false,	// not used in JDots (defined in common prefs)
);
