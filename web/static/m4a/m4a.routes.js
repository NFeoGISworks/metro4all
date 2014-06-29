(function ($, m4a) {
    m4a.routes = {};

    $.extend(m4a.routes, {

        COLORS: {
            "#ed1b35": 1,
            "#44b85c": 2,
            "#0078bf": 3,
            "#19c1f3": 4,
            "#894e35": 5,
            "#f58631": 6,
            "#8e479c": 7,
            "#ffcb31": 8,
            "#a1a2a3": 9,
            "#b3d445": 10,
            "#79cdcd": 11,
            "#acbfe1": 12
        },

        buildRoutes: function (data) {
            var context = this,
                routes = data.result;

            // Кнопки переключения маршрутов
            $.each(routes, function (i, item) {
                $('.pagination').append('<li data-route-id="' + i +
                    '"><a href="javascript:void(0)">' + (i + 1) + '</a></li>');
            });

            // Обработчики нажатия кнопок
            $('.pagination li').click(function (event, zoom) {
                var $this = $(this),
                    route_index = parseInt($this.data('route-id'), 10);
                $('.pagination li').removeClass('active');
                $this.addClass('active');
                m4a.view.$routePanel.empty();
                context.showRoute(routes, route_index);
                if (zoom === undefined) {
                    context.zoomRoute(routes[route_index].route);
                }
                // m4a.view.$document.triggerHandler('/url/update', ['route', route_index + 1]);
            });
        },


        fillBarriers: function (barriers) {
            var c = "";
            c += "<ul class='obstacles'>";
            c += "<li><strong>" + m4a.resources.routes.wch_w + "</strong> " +
                m4a.resources.routes.wch_w1 + barriers['max_width'] + m4a.resources.routes.wch_w2 + "</li>";
            if ((barriers['min_step'] == 0) && (barriers['min_step_ramp'] == 0)) {
                c += "<li class='empty'>" + m4a.resources.routes.n_str + "</li>";
            } else {
                c += "<li><strong>" + m4a.resources.routes.stps + "</strong> " + barriers['min_step'] + "</li>";
                c += "<li><strong>" + m4a.resources.routes.n_ramp + "</strong> " + barriers['min_step_ramp'] + "</li>";
            }
            c += "<li>" + {true: m4a.resources.routes.elev_y, false: m4a.resources.routes.elev_n}[barriers['lift']];

            // Лифт
            if (barriers['lift']) {
                c += m4a.resources.routes.elev_y_1 + barriers['lift_minus_step'] + m4a.resources.routes.elev_y_2;
            }
            c += "</li>";

            // Аппарели
            if ((barriers['min_rail_width']) && (barriers['max_rail_width'])) {
                c += "<li><strong>" + m4a.resources.routes.min_max + "</strong> "
                    + barriers['min_rail_width'] + " &ndash; " + barriers['max_rail_width'] + m4a.resources.routes.cm;
            } else {
                c += "<li class='empty'>" + m4a.resources.routes.no_r;
            }
            c += "</li>";

            // Наклонные поверхности
            if (barriers['max_angle']) {
                c += "<li><strong>" + m4a.resources.routes.slope + "</strong> "
                    + barriers['max_angle'] + "&deg;";
            } else {
                c += "<li class='empty'>" + m4a.resources.routes.no_lev_surf;
            }
            c += "</li>";
            c += "</ul>";
            return c;
        },

        schemeIconTemplate: Mustache.compile('{{#schemeExists}}<a class="scheme"' +
            ' href="{{path}}" data-lightbox="{{schemeExists}}" title="{{name}}"></a>{{/schemeExists}}'),

        zoomRoute: function(route) {
            // Охват на маршрут
            var xmin = route[0].coordinates[1],
                ymin = route[0].coordinates[0],
                xmax = route[0].coordinates[1],
                ymax = route[0].coordinates[0];
            $.each(route, function (i, item) {
                xmin = (item.coordinates[1]) < xmin ? item.coordinates[1] : xmin;
                ymin = (item.coordinates[0]) < ymin ? item.coordinates[0] : ymin;
                xmax = (item.coordinates[1]) > xmax ? item.coordinates[1] : xmax;
                ymax = (item.coordinates[0]) > ymax ? item.coordinates[0] : ymax;
            });
            m4a.viewmodel.mainMap.fitBounds([
                [ymin, xmin],
                [ymax, xmax]
            ]);
        },

        showRoute: function (routes, index) {
            // Вывод списка станций, входящих в маршрут
            var context = this,
                content = "<ul class='route'>",
                lineClass = routes[index].route && routes[index].route.length > 0 ?
                    ' line-' + m4a.routes.COLORS[routes[index].route[0].station_line.color] : '';

            content += "<li class='enter" + lineClass + "'>" + m4a.resources.routes.entr;
            if (routes[index].portals.portal_from) {
                var barriers = routes[index].portals.portal_from.barriers;
                if (barriers) {
                    content += this.fillBarriers(barriers);
                }
            } else {
                content += "<ul class='obstacles'>";
                content += "<li>" + m4a.resources.routes.obt_arent_sh_en + "</li>";
                content += "</ul>";
            }
            content += "</li>";

            $.each(routes[index].route, function (i, item) {
                var condition = (i == 0) ? item.station_type == 'regular' :
                    (item.station_type == 'regular' && routes[index].route[i - 1].station_type != 'interchange')

                if (condition) {
                    content += "<li class=" + "'station line-" + m4a.routes.COLORS[item.station_line.color] + "'>" + item.station_name +
                        context.schemeIconTemplate({
                            schemeExists: item.schema,
                            path: m4a.viewmodel.pathToSchemes + item.schema,
                            name: item.station_name
                        }) +
                        "</li>"
                } else if (item.station_type == 'interchange') {
                    content += "<li class=" + "'transition from-line-" + m4a.routes.COLORS[item.station_line.color] + " to-line-" +
                        m4a.routes.COLORS[routes[index].route[i + 1].station_line.color] + "'>" + item.station_name +
                        " (" + item.station_line.name + ")" + " &rarr; " + routes[index].route[i + 1].station_name +
                        " (" + routes[index].route[i + 1].station_line.name + ")" +
                        context.schemeIconTemplate({
                            schemeExists: routes[index].route[i + 1].schema,
                            path: m4a.viewmodel.pathToSchemes + routes[index].route[i + 1].schema,
                            name: routes[index].route[i + 1].station_name
                        })
                    if (item.barriers) {
                        content += context.fillBarriers(item.barriers);
                    }
                    content += "</li>"
                }
            });

            content += "<li class='exit'>" + m4a.resources.routes.exit;
            if (routes[index].portals.portal_to) {
                var barriers = routes[index].portals.portal_to.barriers;
                if (barriers) {
                    content += this.fillBarriers(barriers);
                }
            } else {
                content += "<ul class='obstacles'>";
                content += "<li>" + m4a.resources.routes.obt_arent_sh_ex + "</li>";
                content += "</ul>";
            }
            content += "</li>";
            content += "</ul>";
            m4a.view.$routePanel.append(content);

            // Отображение маршрута на карте
            if (typeof route !== 'undefined') {
                m4a.viewmodel.mainMap.removeLayer(route);
            }
            route = L.layerGroup();
            $.each(routes[index].route, function (i, item) {
            // Маркеры станций
                route.addLayer(L.marker(
                    item.coordinates,
                    {
                        icon: L.divIcon({
                            className: 'marker-station marker-line-' + m4a.routes.COLORS[item.station_line.color] +
                                (i == 0 ? ' marker-enter' : (i == (routes[index].route.length - 1) ? ' marker-exit' : '')),
                            iconSize: [16, 16]
                        })
                    }).bindLabel(item.station_name)
                ).addTo(m4a.viewmodel.mainMap);

                // Сегменты маршрута
                if (i != 0) {
                    route.addLayer(
                        L.polyline(
                            [routes[index].route[i - 1].coordinates, item.coordinates],
                            {
                                color: item.station_line.color,
                                opacity: 1
                            })
                    ).addTo(m4a.viewmodel.mainMap);
                }
            });
        }
    })
})(jQuery, m4a)