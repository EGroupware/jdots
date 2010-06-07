<!-- BEGIN head --><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> 
<html xml:lang="{lang_code}" xmlns="http://www.w3.org/1999/xhtml"{dir_code}> 
	<head>
		<title>{website_title}</title>
		<meta http-equiv="content-type" content="text/html; charset={charset}" />
		<meta name="keywords" content="EGroupware" />
		<meta name="description" content="EGroupware" />
		<meta name="keywords" content="EGroupware" />
		<meta name="copyright" content="Stylite GmbH 2010, see http://www.stylite.de/EPL" />
		<meta name="language" content="{lang_code}" />
		<meta name="author" content="Stylite GmbH www.stylite.de" />
		{meta_robots}
		<link rel="icon" href="{img_icon}" type="image/x-ico" />
		<link rel="shortcut icon" href="{img_shortcut}" />
		<link href="{theme_css}" type="text/css" rel="StyleSheet" />
		<link href="{print_css}" type="text/css" media="print" rel="StyleSheet" />
		{pngfix}
		<style type="text/css">
			{app_css}
		</style>
		{css_file}
		{java_script}
	</head>
	<body {body_tags}>
		{include_wz_tooltip}
<!-- END head -->
<!-- BEGIN framework -->
		<div id="egw_fw_basecontainer"> 
			<div id="egw_fw_sidebar"> 
				<div id="divLogo"><a href="{logo_url}" target="_blank"><img src="{logo_file}" title="{logo_title}" alt="EGroupware"/></a></div>
				<div id="egw_fw_sidemenu"></div> 
			</div> 
			<div id="egw_fw_topmenu">
				<div id="egw_fw_topmenu_items">{topmenu_items}</div>
				<div id="egw_fw_topmenu_info_items">{topmenu_info_items}</div>
			</div> 
			<div id="egw_fw_main"> 
				<div id="egw_fw_tabs" /> 
			</div>
		</div> 
		<div id="egw_fw_footer">{powered_by}</div>
 
		<script type="text/javascript"> 
			var
				framework = null;

			$(document).ready(function() {
				framework = new egw_fw("egw_fw_sidemenu", "egw_fw_tabs", "{webserver_url}");
			}
			);
		</script>

<!-- END framework -->
