$(document).ready(function () {
    m4a.loader.init();

    var url = m4a.viewmodel.url.proxy || m4a.viewmodel.url,
        viewmodel = m4a.viewmodel,
        view = m4a.view;

    viewmodel.mainMap = L.map('mainMap').setView(global_config.mainmap.center, global_config.mainmap.zoom);
    viewmodel.mainMap.setMaxBounds(global_config.mainmap.maxBounds);
    (new L.Control.Extent()).addTo(viewmodel.mainMap);
    viewmodel.stationMarkers = [];
    viewmodel.lineSegments = null;

    // Скрываем выходы на низких масштабных уровнях
    viewmodel.mainMap.on('zoomend', function (e) {
        var map = viewmodel.mainMap,
            zoom = map.getZoom(),
            portals_in = m4a.stations.portals.in.layer,
            portals_out = m4a.stations.portals.out.layer,
            portalsSelected = m4a.stations.portalsSelected;

        if (zoom < 15) {
            if (map.hasLayer(portals_in)) {
                map.removeLayer(portals_in);
                if (portalsSelected.in.marker) { portalsSelected.in.marker.addTo(map); }
            }
            if (map.hasLayer(portals_out)) {
                map.removeLayer(portals_out);
                if (portalsSelected.out.marker) { portalsSelected.out.marker.addTo(map); }
            }
        }
        if (zoom >= 15) {
            if (!map.hasLayer(portals_in) && portals_in) { map.addLayer(portals_in); }
            if (!map.hasLayer(portals_out) && portals_out) { map.addLayer(portals_out); }
        }
    });

    $.ajax(url + global_config.language + "/" + global_config.city + "/stations").done(function (data) {

        $.ajax(url + "data/" + global_config.city + "/lines.geojson").done(function (lines) {

            // Отрисовываем линии на карте (начало)
            if (typeof lines == 'string' || lines instanceof String) {
                lines = JSON.parse(lines);
            }
            if ((global_config.city != "ams") && (global_config.city != "vog")) {
                viewmodel.lineSegments = L.geoJson(lines, {
                    style: function(feature) {
                        return {
                            opacity: 1,
                            color: feature.properties.color,
                            clickable: false
                        };
                    }
                });
            } else {
                // Multiline metro system hack ---
                var ends = [],
                    lineColors = {
                        "ams": [null, '#44b85c', '#f58631', '#ed1b35', '#ffcb31'],
                        "vog": [null, '#ed1b35', '#0078bf']
                    }[global_config.city],
                    lineWeight = 6;

                viewmodel.lineSegments = L.featureGroup();

                function addStop(ll) {
                    for(var i=0, found=false; i<ends.length && !found; i++) {
                        found = (ends[i].lat == ll.lat && ends[i].lng == ll.lng);
                    }
                    if(!found) {
                        ends.push(ll);
                    }
                }

                lines.features.forEach(function(lineSegment) {
                    segmentCoords = L.GeoJSON.coordsToLatLngs(lineSegment.geometry.coordinates, 0);
                    linesOnSegment = lineSegment.properties.lines.split(',');
                    segmentWidth = linesOnSegment.length * (lineWeight + 1);

                    // Белая обводка
                    L.polyline(segmentCoords, {
                        color: '#fff',
                        weight: segmentWidth + 3,
                        opacity: 1,
                        clickable: false
                    }).addTo(viewmodel.lineSegments);

                    // Собственно линии
                    for(var j=0;j<linesOnSegment.length;j++) {
                        L.polyline(segmentCoords, {
                            color: lineColors[linesOnSegment[j]],
                            weight: lineWeight,
                            opacity: 1,
                            clickable: false,
                            offset: j * (lineWeight + 1) - (segmentWidth / 2) + ((lineWeight + 1) / 2)
                        }).addTo(viewmodel.lineSegments);
                    }

                    addStop(segmentCoords[segmentCoords.length - 1]);
                });

                // Сочленения линий
                ends.forEach(function(endCoords) {
                    var circle = L.circleMarker(endCoords, {
                        color: '#ccc',
                        fillColor: '#ccc',
                        fillOpacity: 0.9,
                        radius: 10,
                        weight: 2,
                        opacity: 0.9,
                        clickable: false
                    }).addTo(viewmodel.lineSegments);
                });
                // Amsterdam lines hack END ---
            }
            viewmodel.lineSegments.addTo(viewmodel.mainMap);
            // Отрисовываем линии на карте (конец)

            var sortResults = function(results, container, query) {
                var filteredResults = [];
                for (var i = 0; i < results.length; i++) {
                    var r = results[i];
                    if (!r.children || r.children.length > 0) filteredResults.push(r);
                }
                return filteredResults;
            };

            var matcher = function(term, text) {
                term = Select2.util.stripDiacritics(''+term).toUpperCase().replace(/Ё/g, 'Е');
                text = Select2.util.stripDiacritics(''+text).toUpperCase().replace(/Ё/g, 'Е');
                return text.indexOf(term) >= 0;
            };

            var defaultOptions = {
                width: "100%",
                data: data,
                sortResults: sortResults,
                matcher: matcher
            };

            m4a.view.$metroStartStation.select2(defaultOptions);
            m4a.view.$metroEndStation.select2(defaultOptions);

            // Поле выбора станции входа
            view.$metroStartStation.on("change", function () {
                m4a.stations.setStartStation(this.value);
                m4a.stations.updatePortalsByAjax(this.value, 'in')
                    .done(function(data){
                        view.$metroStartStationExtent.trigger('click');
                    });
                view.$metroStartStationExtent.prop("disabled", false);
                m4a.view.$document.triggerHandler('/url/update', ['route', 1]);
                $("#mainform").submit();
            });

            // Поле выбора станции выхода
            view.$metroEndStation.on("change", function () {
                m4a.stations.setEndStation(this.value);
                m4a.stations.updatePortalsByAjax(this.value, 'out')
                    .done(function(data){
                        view.$metroEndStationExtent.trigger('click');
                    });
                view.$metroEndStationExtent.prop("disabled", false);
                m4a.view.$document.triggerHandler('/url/update', ['route', 1]);
                $("#mainform").submit();
            });

            // Кнопка перехода к охвату станции входа
            view.$metroStartStationExtent.on("click", function () {
                m4a.viewmodel.mainMap.fitBounds(m4a.stations.portals['in']['layer'].getBounds());
            });

            // Кнопка перехода к охвату станции выхода
            view.$metroEndStationExtent.on("click", function () {
                m4a.viewmodel.mainMap.fitBounds(m4a.stations.portals['out']['layer'].getBounds());
            });

            // Карта для отображения маршрутов
            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: "Map data &copy; <a href='http://osm.org'>OpenStreetMap</a> contributors",
                maxZoom: 18
            }).addTo(m4a.viewmodel.mainMap);

            // Отрисовываем станции на карте
            $.each(data.results, function(i, line) {
                $.each(line.children, function(j, station) {
                    var stationMarker = L.marker([station.lat, station.lon], {
                        icon: L.divIcon({
                            iconSize: [16, 16],
                            className: "marker-station marker-line-" + m4a.routes.COLORS[line.color]
                        }),
                        riseOnHover: true
                    })
                    .bindLabel(station.text)
                    .on('click', m4a.stations.selectStationFromMap.bind(station));
                    stationMarker.addTo(viewmodel.mainMap);
                    viewmodel.stationMarkers.push(stationMarker);
                });
            });

            $("#mainform").submit(function (from_url) {
                var view = m4a.view,
                    start_station = view.$metroStartStation.val(),
                    end_station = view.$metroEndStation.val();
                    portal_in = view.$metroStartInputID.val();
                    portal_out = view.$metroEndInputID.val(),
                    route = m4a.url.getURLParameter('route'),
                    profile = m4a.url.getURLParameter('profile');

                if (start_station.length == 0 || end_station.length == 0) {
                    // todo: use bootstrap
                    console.log(m4a.resources.inline.start_st);
                } else if (start_station == end_station) {
                    console.log(m4a.resources.inline.eq_st);
                } else {
                    $('.pagination').empty();
                    $('#routePanel').empty();

                    $.blockUI({ message: 'Processing...' });
                    $.ajax({
                        dataType: "json",
                        url: url + global_config.language + "/" + global_config.city + "/routes/search",
                        data: $("#mainform").serialize()
                    }).done(function (data) {
                        m4a.routes.buildRoutes(data);
                        var routeEl = route ? $('.pagination li').eq(route - 1) : $('.pagination li').first();
                        profile && m4a.profiles.selectProfile(profile);

                        // Активируем первый маршрут
                        // Охват на маршрут включаем только в случае, если выбраны оба выхода
                        if ((start_station && end_station) && !((portal_in && !portal_out) || (!portal_in && portal_out))) {
                            routeEl.trigger('click');
                        } else {
                            routeEl.trigger('click', [false]);
                        }

                        $.unblockUI();

                        m4a.viewmodel.mainMap.fire("zoomend");
                    });
                }
                return false;
            });

            m4a.url.parse();
        });
    });
});
