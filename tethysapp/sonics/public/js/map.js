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
		opacity: 0.5,
		weight: 2
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

function map_events() {
	map.on('pointermove', function(evt) {
		if (evt.dragging) {
			return;
		}
		var pixel = map.getEventPixel(evt.originalEvent);
		var hit = map.forEachLayerAtPixel(pixel, function(layer) {
			if (layer == feature_layer) {
				current_layer = layer;
				return true;
			}
			}, {hitTolerance: 10});
		map.getTargetElement().style.cursor = hit ? 'pointer' : '';
	});
	const flyTo = (location, zoom, done) => {
				console.log(location)
				const duration = 2000;
				let view = map.getView()
				let parts = 2;
				let called = false;

				function callback(complete) {
					parts--;
					if (called) {
						return;
					}
					if (parts === 0 || !complete) {
						called = true;
						done(complete);
					}
				}

				view.animate(
					{
						center: location,
						duration: duration,
					},
					callback
				);
				view.animate(
					{
						zoom: zoom - 1,
						duration: duration / 2,
					},
					{
						zoom: zoom,
						duration: duration / 2,
					},
					callback
				);
			}

	map.on("singleclick", function(evt) {
		console.log('clicked!')
		if (map.getView().getZoom() <= 9.5) {
        flyTo(
			evt.coordinate,
			10,
			()=>{}
		);
        return
		} else {
			flyTo(
				evt.coordinate,
				map.getView().getZoom(),
				()=>{})
		}


		if (map.getTargetElement().style.cursor == "pointer") {

			var view = map.getView();
			var viewResolution = view.getResolution();
			var wms_url = current_layer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), { 'INFO_FORMAT': 'application/json' });
			console.log(wms_url)
			if (wms_url) {
				$("#obsgraph").modal('show');
				$('#hydrographs-chart').addClass('hidden');
				$('#dailyAverages-chart').addClass('hidden');
				$('#monthlyAverages-chart').addClass('hidden');
				$('#scatterPlot-chart').addClass('hidden');
				$('#scatterPlotLogScale-chart').addClass('hidden');
				$('#forecast-bc-chart').addClass('hidden');
				$('#hydrographs-loading').removeClass('hidden');
				$('#dailyAverages-loading').removeClass('hidden');
				$('#monthlyAverages-loading').removeClass('hidden');
				$('#scatterPlot-loading').removeClass('hidden');
				$('#scatterPlotLogScale-loading').removeClass('hidden');
				$('#forecast-bc-loading').removeClass('hidden');
				$("#station-info").empty()
				$('#download_observed_water_level').addClass('hidden');
				$('#download_simulated_bc_water_level').addClass('hidden');
				$('#download_forecast_bc').addClass('hidden');

				$.ajax({
					type: "GET",
					url: wms_url,
					dataType: 'json',
					success: function (result) {
						watershed = 'south_america' //OJO buscar como hacerla generica
						//subbasin = 'continental' //OJO buscar como hacerla generica
						subbasin = 'geoglows' //OJO buscar como hacerla generica
						var startdate = '';
						stationcode = result["features"][0]["properties"]["code"];
						stationname = result["features"][0]["properties"]["nombre"];
						//streamcomid = result["features"][0]["properties"]["COMID"];
						streamcomid = result["features"][0]["properties"]["new_COMID"];
						river = result["features"][0]["properties"]["Rio"];
						oldstationcode = result["features"][0]["properties"]["old_code"];
						stationcat = result["features"][0]["properties"]["categoria"];
						stationstatus = result["features"][0]["properties"]["estado"];

						$("#station-info").append('<h3 id="Station-Name-Tab">Current Station: '+ stationname
									+ '</h3><h5 id="Station-Code-Tab">Station Code: '
									+ stationcode + '</h3><h5 id="COMID-Tab">Station COMID: '
									+ streamcomid+ '</h5><h5>River: '+ river + '</h5>');

						get_requestData (watershed, subbasin, streamcomid, stationcode, oldstationcode, stationcat, stationstatus, stationname, startdate);
					},
					error: function(e){
					  console.log(e);
					  $('#hydrographs-loading').addClass('hidden');
					  $('#dailyAverages-loading').addClass('hidden');
					  $('#monthlyAverages-loading').addClass('hidden');
					  $('#scatterPlot-loading').addClass('hidden');
					  $('#scatterPlotLogScale-loading').addClass('hidden');
					  $('#forecast-bc-loading').addClass('hidden');
					}
				});
			}
		}

	});
}

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
    map_events();
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