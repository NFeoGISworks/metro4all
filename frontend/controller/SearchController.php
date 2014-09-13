<?php

class SearchController
{
	var $currentCity;

	function actions()
	{
		$action = request_str('action');
		if(method_exists($this, $action.'Action')) {
			return call_user_func(array($this, $action.'Action'));
		} else {
			return $this->defaultAction();
		}
	}

	function setCity($currentCity)
	{
		$this->currentCity = $currentCity;
	}

	function defaultAction()
	{
		$page = new PageCommon(s('Metro4all'));

		$page->addResource('style', 'vendor/select2-3.4.2/select2.css');
		$page->addResource('script', 'vendor/select2-3.4.2/select2.js');
		$page->addResource('script', 'vendor/select2-3.4.2/select2_locale_ru.js');

		$page->addResource('style', 'vendor/leaflet-0.6.4/leaflet.css');
		$page->addResource('style', 'vendor/leaflet-0.6.4/leaflet.ie.css', 'lte IE 8');
		$page->addResource('script', 'vendor/leaflet-0.6.4/leaflet.js');

		$page->addResource('style', 'http://demo.nextgis.ru/metro4all/static/leaflet.label.css');

        $page->addResource('style', 'http://demo.nextgis.ru/metro4all/static/lightbox2/css/lightbox.css');

		$page->addResource('style', 'css/m4a.css');

        $city = Core::$config['cities'][$this->currentCity];

        $globalConfig = 'var global_config = {
              mainmap: {"center": [' . $city['lat'] . ',' . $city['lon'] . '], "zoom": 10 },
              city: "' . $this->currentCity . '",
              route_css_class: "' . $city['route_css_class'] . '",
              language: "' . Core::$config['current_language'] . '"
        }';

		$html = '
<div class="row">
      <div class="col-md-9">
      <form id="mainform" role="form">
      <div class="col-md-4">
        <legend>' . s('From') . '</legend>
        <div class="form-group">
          <div style="white-space:nowrap">
            <input id="metroStartStation" name="station_from" type="hidden" style="max-width: 87%;">
            <button id="metroStartStationExtent" type="button" class="btn" title="' . s('Zoom to') . '" disabled style="padding:0;background-color:transparent"><span class="glyphicon glyphicon-screenshot" style="font-size:19px"></span></button>
          </div>
        </div>
        <div class="form-group">
          <input class="form-control" id="metroStartInputName" type="text" placeholder="' . s('Choose entrance on the map') . '" disabled>
          <input name="portal_from" class="form-control" id="metroStartInputID" type="hidden">
        </div>
      </div>
      <div class="col-md-4">
        <legend>' . s('To') . '</legend>
        <div class="form-group">
          <div style="white-space:nowrap">
            <input id="metroEndStation" name="station_to" type="hidden" style="max-width: 87%;">
            <button id="metroEndStationExtent" type="button" class="btn" title="' . s('Zoom to') . '" disabled style="padding:0;background-color:transparent"><span class="glyphicon glyphicon-screenshot" style="font-size:19px"></span></button>
          </div>
        </div>
        <div class="form-group">
          <input class="form-control" id="metroEndInputName" type="text" placeholder="' . s('Choose exit on the map') . '" disabled>
          <input name="portal_to" class="form-control" id="metroEndInputID" type="hidden">
        </div>
      </div>
        <div class="col-md-4">
        <legend>' . s('Limitations') . '</legend>
        <div class="btn-group profiles" data-toggle="buttons">
          <label id="profile_man" class="btn btn-default profile" data-profile="man" data-type="sample" title="' . s('I am walking') . '">
            <input type="radio" name="options" id="option1">
          </label>
          <label id="profile_wheelchair" class="btn btn-default profile" data-profile="wheelchair" data-type="input" title="' . s('I am on a wheelchair') . '">
            <input type="radio" name="options" id="option2">
          </label>
          <label id="profile_trolley" class="btn btn-default profile" data-profile="trolley" data-type="input" title="' . s('I am with a cart') . '">
            <input type="radio" name="options" id="option3">
          </label>
        </div>
        <div class="profile-descr"></div>
      </div>
      </form>
      <div class="clearfix"></div>
      <span>&nbsp;</spn>
      <div id="map">
          <div id="mainMap" style="height: 480px;"></div>
      </div>
      </div>
      <div class="col-md-3">
        <legend>' . s('Route') . '</legend>
        <ul class="route-paging pagination pagination-sm"></ul>
        <div id="routePanel" class="city-' . $this->currentCity . '"></div>
      </div>
    </div>

	<script> var ajax="http://' . Core::$config['http_domain'] .  '/ajax/"; </script>

	<script>' . $globalConfig . '</script>
	<script src="http://demo.nextgis.ru/metro4all/static/TileLayer.Grayscale.js"></script>
	<script src="http://demo.nextgis.ru/metro4all/static/mustache/mustache.js"></script>
	<script src="http://demo.nextgis.ru/metro4all/static/imagesloaded/imagesloaded.pkgd.min.js"></script>
	<script src="http://demo.nextgis.ru/metro4all/static/m4a/m4a.config.js"></script>

	<script>
		m4a.viewmodel.pathToSchemes = "http://demo.nextgis.ru/metro4all/data/" + global_config.city + "/schemes/";
	</script>

    <script src="http://demo.nextgis.ru/metro4all/static/TileLayer.Grayscale.js"></script>
    <script src="http://demo.nextgis.ru/metro4all/static/leaflet.label.js"></script>
    <script src="http://demo.nextgis.ru/metro4all/static/lightbox2/js/lightbox.js"></script>

    <script src="http://demo.nextgis.ru/metro4all/static/m4a/translations/m4a.' . Core::$config['current_language'] . '.js"></script>
    <script src="http://demo.nextgis.ru/metro4all/static/m4a/m4a.loader.js"></script>
    <script src="http://demo.nextgis.ru/metro4all/static/m4a/m4a.stations.js"></script>
    <script src="http://demo.nextgis.ru/metro4all/static/m4a/m4a.url.js"></script>
    <script src="http://demo.nextgis.ru/metro4all/static/m4a/m4a.profiles.js"></script>
    <script src="http://demo.nextgis.ru/metro4all/static/m4a/m4a.routes.js"></script>
    <script src="http://demo.nextgis.ru/metro4all/static/m4a/inline.js"></script>
    <script src="http://demo.nextgis.ru/metro4all/static/blockui/jquery.blockUI.js"></script>';

		return $page->start() . $html . $page->stop();
	}
}

