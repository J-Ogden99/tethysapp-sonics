// const mapObj = L.map("map", {
//     zoom: 5,
//     minZoom: 2,
//     boxZoom: true,
//     maxBounds: L.latLngBounds(L.latLng(-21.651818, -83.561734), L.latLng(2.306838, -66.047344)),
//     center: [-9.006221, -74.664082],
// })
// let REACHID
// let CURRENTDATE
// let mapMarker = null
// let controlsObj
// let SelectedSegment = L.geoJSON(false, { weight: 5, color: "#00008b" }).addTo(mapObj)
//
// const basemapsJson = {
//     "ESRI Topographic": L.esri.basemapLayer("Topographic").addTo(mapObj),
//     "ESRI Terrain": L.layerGroup([
//         L.esri.basemapLayer("Terrain"),
//         L.esri.basemapLayer("TerrainLabels")
//     ]),
//     "ESRI Grey": L.esri.basemapLayer("Gray")
// }

// Getting the csrf token
function get_requestData (watershed, subbasin, streamcomid, stationcode, oldstationcode, stationcat, stationstatus, stationname, startdate){
  getdata = {
      'watershed': watershed,
      'subbasin': subbasin,
      'streamcomid': streamcomid,
      'stationcode':stationcode,
      'oldstationcode':oldstationcode,
      'stationcat':stationcat,
      'stationstatus':stationstatus,
      'stationname': stationname,
  };
  $.ajax({
      url: 'get-request-data',
      type: 'GET',
      data: getdata,
      error: function() {
          $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the data</strong></p>');
          $('#info').removeClass('hidden');
          console.log(e);
          $('#hydrographs-loading').addClass('hidden');
          $('#dailyAverages-loading').addClass('hidden');
          $('#monthlyAverages-loading').addClass('hidden');
          $('#scatterPlot-loading').addClass('hidden');
          $('#scatterPlotLogScale-loading').addClass('hidden');
          $('#forecast-bc-loading').addClass('hidden');
          setTimeout(function () {
              $('#info').addClass('hidden')
          }, 5000);
      },
      success: function (data) {
        console.log(data)
        get_hydrographs (watershed, subbasin, streamcomid, stationcode, oldstationcode, stationcat, stationstatus, stationname, startdate);

      }
  })

}

var feature_layer;
var current_layer;
var map;
var wmsLayer;
var wmsLayer2;

let $loading = $('#view-file-loading');
var m_downloaded_historical_streamflow = false;

function toggleAcc(layerID) {
    let layer = wms_layers[layerID];
    if (document.getElementById(`wmsToggle${layerID}`).checked) {
        // Turn the layer and legend on
        layer.setVisible(true);
        $("#wmslegend" + layerID).show(200);
    } else {
        layer.setVisible(false);
        $("#wmslegend" + layerID).hide(200);

    }
}

function init_map() {

	var base_layer = new ol.layer.Tile({
		source: new ol.source.BingMaps({
			key: 'eLVu8tDRPeQqmBlKAjcw~82nOqZJe2EpKmqd-kQrSmg~AocUZ43djJ-hMBHQdYDyMbT-Enfsk0mtUIGws1WeDuOvjY4EXCH-9OK3edNLDgkc',
			imagerySet: 'Road'
			//            imagerySet: 'AerialWithLabels'
		})
	});

	var streams = new ol.layer.Image({
		source: new ol.source.ImageWMS({
			url: 'https://geoserver.hydroshare.org/geoserver/HS-9b6a7f2197ec403895bacebdca4d0074/wms',
			params: { 'LAYERS': 'south_america-peru-geoglows-drainage_line' },
			serverType: 'geoserver',
			crossOrigin: 'Anonymous'
		}),
		opacity: 0.5
	});

	wmsLayer = streams;

	// var stations = new ol.layer.Image({
	// 	source: new ol.source.ImageWMS({
	// 		url: 'https://geoserver.hydroshare.org/geoserver/HS-9b6a7f2197ec403895bacebdca4d0074/wms',
	// 		params: { 'LAYERS': 'SENAMHI_Stations_RT_v2' },
	// 		serverType: 'geoserver',
	// 		crossOrigin: 'Anonymous'
	// 	})
	// });

	// wmsLayer2 = stations;

	// feature_layer = stations;

	map = new ol.Map({
		target: 'map',
		layers: [base_layer, streams], //, stations],
		view: new ol.View({
			center: ol.proj.fromLonLat([-76, -10]),
			zoom: 5
		})
	});

}

let ajax_url = 'https://geoserver.hydroshare.org/geoserver/wfs?request=GetCapabilities';

let capabilities = $.ajax(ajax_url, {
	type: 'GET',
	data:{
		service: 'WFS',
		version: '1.0.0',
		request: 'GetCapabilities',
		outputFormat: 'text/javascript'
	},
	success: function() {
		let x = capabilities.responseText
		.split('<FeatureTypeList>')[1]
		.split('HS-9b6a7f2197ec403895bacebdca4d0074:SENAMHI_Stations_RT_v2')[1]
		.split('LatLongBoundingBox')[1]
		.split('/></FeatureType>')[0];

		let minx = Number(x.split('"')[1]);
		let miny = Number(x.split('"')[3]);
		let maxx = Number(x.split('"')[5]);
		let maxy = Number(x.split('"')[7]);

		minx = minx + 2;
		miny = miny + 2;
		maxx = maxx - 2;
		maxy = maxy - 2;

		let extent = ol.proj.transform([minx, miny], 'EPSG:4326', 'EPSG:3857').concat(ol.proj.transform([maxx, maxy], 'EPSG:4326', 'EPSG:3857'));

		map.getView().fit(extent, map.getSize());
	}
});

$(function() {
	// $("#app-content-wrapper").removeClass('show-nav');
	// $(".toggle-nav").removeClass('toggle-nav');

	// //make sure active Plotly plots resize on window resize
    // window.onresize = function() {
    //     $('#graph .modal-body .tab-pane.active .js-plotly-plot').each(function(){
    //         Plotly.Plots.resize($(this)[0]);
    //     });
    // };
    init_map();
    // map_events();
    // resize_graphs();

    // $('#datesSelect').change(function() { //when date is changed
	//
    //     //var sel_val = ($('#datesSelect option:selected').val()).split(',');
    //     sel_val = $("#datesSelect").val()
	//
    //     //var startdate = sel_val[0];
    //     var startdate = sel_val;
    //     startdate = startdate.replace("-","");
    //     startdate = startdate.replace("-","");

        // $loading.removeClass('hidden');
        // get_time_series_bc(watershed, subbasin, streamcomid, stationcode, oldstationcode, stationcat, stationstatus, stationname, startdate);
    // });

});