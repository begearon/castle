;
(function () {
    "use strict";

    var as_widget_manager,
        qs_params = (function(elem, params) {
        function add(param) { params[param.shift().replace("?", "")] = decodeURIComponent(param.join("=")); }
        while (elem.length) { add(elem.pop().split("=")); }
        return params;
    }(String(window.location.search || "").split("&amp").join("&").split("&"), {})),
    debug = qs_params.debug,
    module_id = "shell";

    function log(msg, color) {
        if (!debug) { return; }
        color = color || "amber";
        msg = module_id + ": " + msg;
        console.log("%c" + msg, "color:" + color + ";font-weight:bold;");
    }

    log("Starting. Creates the API for window.as_widget_manager.");
    function Dispatcher(api) {
        api = api || {};
        var eventListeners = {};
        function addEventListener(event, func) {
            if (typeof func === "function") {
                eventListeners[event] = eventListeners[event] || [];
                eventListeners[event].push(func);
            }
        }
        function removeEventListener(event, func) {
            var listeners = eventListeners[event] || [],
                i,
                len = listeners.length;
            for (i = 0; i < len; i += 1) {
                if (listeners[i] === func) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
        function dispatchEvent(event) {
            log("dispatching event " + event.type, "#00B2EE");
            var eventType = event.type,
                listeners = eventListeners[eventType] || [],
                j,
                len = listeners.length,
                loop = listeners.concat();
            function getFunction(callback) {
                if (typeof callback === "function") {
                    return callback;
                }
                return function () { return; };
            }
            for (j = 0; j < len; j += 1) {
                getFunction(loop[j])(event);
            }
        }
        api.addEventListener = addEventListener;
        api.removeEventListener = removeEventListener;
        api.dispatchEvent = dispatchEvent;
        return api;
    }
    as_widget_manager = window.as_widget_manager || (function () {
        var api = {},
            libraries = {},
            config = {},
            modules = {},
            core = new Dispatcher();
            core.util = {
                dispatcher: Dispatcher
            };
            core.getModule = function (id) { return modules[id]; };
            core.getConfig = function () { return config; };
            core.getQSParams = function () { return core.util.shallow_extend(qs_params); };
        api.setAPI = function(key) {
            core.api_key = key;
        };
        api.add_library = function (id, lib) {
            libraries[id] = libraries[id] || lib;
        };
        api.get_library = function (id) {
            return libraries[id];
        };
        api.addUtil = function (id, func) {
            core.util[id] = core.util[id] || func;
        };
        api.setDefaultConfig = function (defaults) {
            config = core.util.shallow_extend(config, defaults);
            api.setDefaultConfig = function () { return; };
        };
        api.init = function (init_config) {
            core.util.shallow_extend(config, init_config);
            api.init = function () {};
            if (config.secureInit) {
                api.addModule = function() { return false; };
            }
        };
        api.addModule = function (id, module) {
            modules[id] = modules[id] || module(id, core);
            module.id = id;
            return true;
        };
        api.addEventListener = function(event, func){
            core.addEventListener(event,func);
        };
        api.removeEventListener = function(event, func){
            core.addEventListener(event,func);
        };
        return api;
    }());
    window.as_widget_manager = window.as_widget_manager || as_widget_manager;
}());
;
(function () {
    "use strict";
    window.as_widget_manager.addUtil("shallow_extend", function shallow_extend() {
        var args = Array.prototype.slice.call(arguments, 0).reverse(), obj = args.pop();
        function map(n_obj) {
            var name;
            for (name in n_obj) {
                if (n_obj.hasOwnProperty(name)) {
                    obj[name] = n_obj[name];
                }
            }
        }
        while (args.length) { map(args.pop()); }
        return obj;
    });
    window.as_widget_manager.addUtil("get_mapper", function get_mapper(from, to) {
        return {
            search: function (search, as, def) {
                var test = from;
                search.push(as);
                function check(val) {
                    while (search.length && val === undefined) {
                        val = test[search.pop()];
                    }
                    return val || def;
                }
                test = check();
                if (test !== undefined) {
                    to[as] = test;
                }
                return this;
            },
            add: function (as, def) {
                if (from.hasOwnProperty(as)) {
                    to[as] = from[as];
                } else if (def !== undefined) {
                    to[as] = def;
                }
                return this;
            }
        };
    });
    window.as_widget_manager.addUtil("createQS", function (props) {
        var qs_params = [], p;
        function get() { return p + "=" + encodeURIComponent(props[p]); }
        for (p in props) {
            if (props.hasOwnProperty(p)) {
                qs_params.push(get(p));
            }
        }
        return "?" + qs_params.join("&");
    });
    window.as_widget_manager.addUtil("resolve", function (map, obj) {
        try {
            map = map.split(".").reverse();
            while (map.length && obj) {
                obj = obj[map.pop()];
            }
        } catch (e) {
            return false;
        }
        return obj;
    });
}());window.as_widget_manager.addModule("ingestion", function (module_id, core) {
    "use strict";
    var api = {},
        qs_params = core.getQSParams(),
        debug = qs_params.debug,
        environment = {
            referrer: window.document.referrer.replace(/http[s]*:\/\//g, "") || "direct",
            landingPage: window.location.href.replace(/http[s]*:\/\//g, "") || "",
            protocol: window.location.protocol
        };
    function log(msg, color) {
        if (!debug) { return; }
        color = color || "green";
        msg = module_id + ": " + msg;
        console.log("%c" + msg, "color:" + color + ";font-weight:bold;");
    }
    function prepare_attributes(o_attr) {
        var attr = {}, a, n;
        for (a in o_attr) {
            if (o_attr.hasOwnProperty(a)) {
                if ( !(a.indexOf("de-") === 0  || a == "embed-type") ) {
                         n = a.replace(/-/g, "_").replace("data_as_", "").replace("data_", "");
                } else {
                         n = a;
                }
                attr[n] = o_attr[a];
            }
        }
        return attr;
    }
    function prepare_player_data(dom_elements) {
        var p;
        for (p in dom_elements) {
            if (dom_elements.hasOwnProperty(p)) {
                dom_elements[p] = prepare_attributes(dom_elements[p]);
            }
        }
        return dom_elements;
    }

    function getDomain(domain) {
        return environment.protocol + "//" + domain;
    }

    function sanitize(id, config, init_config) {
        var sanitized_data = {}, map;
        config = core.util.shallow_extend({}, config, init_config);
        map = core.util.get_mapper(config, sanitized_data);
        map.search(["project_uuid", "project_id", "p"], "projectUUID")
           .search(["asset_uuid", "asset_id"], "assetUUID")
           .search(["videoUUID", "program_uuid", "v", "programUUID"], "video_uuid")
           .search(["seriesUUID"], "series_uuid")
           .search(["event_uuid", "event_id"], "eventUUID")
           .search(["widget_host", "widget_ak_host"], "widgetAkHost")
           .search(["appasset_appstudio"], "appstudioAssets")
           .search(["client_api", "API"], "clientAPI")
           .search(["service_base", "de_service_base"], "serviceBase")
           .search(["auto_play", "autoplay"], "autoPlay", "true")
           .search(["piksel_debug"], "debug")
           .search(["delivery_type"], "deliveryType")
           .search(["language"], "lang", "us_en")
           .add("csig")
           .add("sig")
           .add("player_id")
           .add("width")
           .add("height")
           .add("analyticsConfigURL", "http://ma198-r.analytics.edgesuite.net/config/beacon-4896.xml?beaconVersion=1.1");
        if (qs_params.hasOwnProperty("debugPiksel")) {
            config.debug = qs_params.debugPiksel;
        }
        //look for csig or sig >> call webservice
        sanitized_data.id = id;
        sanitized_data.clientAPI = core.api_key || sanitized_data.clientAPI;
        if(sanitized_data.hasOwnProperty('csig') || sanitized_data.hasOwnProperty('sig')){
            core.addEventListener('kewegoDataLoaded', function kewegoDataLoaded(event){
                if (event.payload.id === id) {
                    core.removeEventListener('kewegoDataLoaded', kewegoDataLoaded);
                    core.dispatchEvent({type:'dataSanitized',payload:core.util.shallow_extend({}, config, init_config, sanitized_data)});
                }
            });
            core.dispatchEvent({type:'resolveKewego', payload:sanitized_data});
            return;
        }
        core.dispatchEvent({type:'dataSanitized',payload:core.util.shallow_extend({}, config, init_config, sanitized_data)});
        return;
    }
    function get_player_data(id, params, init_config) {
        function tryHTML() {
            return (params.forceHTML === "true"
                || params.html_default === true
                || params.html_default === "true"
                || qs_params.html_default === "true"
                || params.force_html === "true"
                || params.forceHTML === true
                || qs_params.forceHTML === "true"
            ) ? true : false;
        }
        function getJSONURL(callback) {
            callback = callback || "";
            return getDomain(params.serviceBase) + "/ws/get_appstudio_player_json" + callback + "/" + params.player_id + ".json";
        }
        function getSWFURL() {
            return getDomain(params.appstudioAssets) + "/app/AppLoader.swf?src=" + getJSONURL();
        }
        function getFlashParams() {
            return {
                "movie": getSWFURL(),
                "pluginspage": getDomain("www.adobe.com/go/getflashplayer"),
                "align": "middle",
                "allowscriptAccess": "always",
                "quality": "high",
                "allowFullScreen": "true",
                "wmode": "transparent",
                "bgcolor": "#FFFFFF",
                "menu": "false"
            };
        }
        function getFlashVars() {
            //TODO: Figure out how to route / enable "as_widget_manager.route"
            function isLive() {
                return (
                    params.hasOwnProperty("eventUUID") ||
                    params.hasOwnProperty("series_uuid")
                ) ? true : false
            }

            var flashvars = {
                    scaleMODE: "letterbox",
                    r: "as_widget_manager.route",
                    src: getJSONURL(),
                    widgetId: params.player_id,
                    clientAPI: params.clientAPI,
                    serviceBase: getDomain(params.serviceBase)
                },
                map = core.util.get_mapper(params, flashvars),
                baseURL = getDomain(params.serviceBase) ,
                embedURL = baseURL  + "/ws/get_appstudio_embed/v1/",
                key;
            if (isLive()) {
                if (params.hasOwnProperty("series_uuid")) {
                    map.add("series_uuid")
                       .add("getEmbed", embedURL += "liveseries/series_uuid/" + params.series_uuid + ".xml");
                } else if (params.hasOwnProperty("event_uuid")) {
                    map.add("eventUUID")
                       .add("getEmbed", embedURL += "liveevent/event_uuid/" + params.series_uuid + ".xml");
                }
                map.add("analyticsConfigURL", "http://player.piksel.com/templates/MediaAnalytics/analytics_live_prod_19.xml");
            } else {
                if (params.hasOwnProperty("projectUUID")) {
                    map.add("projectUUID");
                    if (params.hasOwnProperty("video_uuid")) {
                        map.add("video_uuid")
                           .add("getEmbed", embedURL += "liveevent/event_uuid/" + params.series_uuid + ".xml");
                    } else {
                        map.add("getEmbed", embedURL += "liveseries/series_uuid/" + params.series_uuid + ".xml");
                    }
                } else if (params.hasOwnProperty("assetUUID")) {
                    map.add("assetUUID")
                       .add("getEmbed", embedURL += "liveevent/event_uuid/" + params.series_uuid + ".xml");
                }

                if (params.hasOwnProperty("embed-type")) {
                    flashvars['embedType'] = params["embedType"];
                }

                for( key in params) {
                    if( key.indexOf( "de-" ) === 0) {
                        flashvars[key] = params[key];
                    }
                }

                map.add("analyticsConfigURL", "http://player.piksel.com/templates/MediaAnalytics/MediaSuiteProdOnDemand.xml");
            }

            map.add("widgetAkHost")
               .add("autoPlay")
               .add("debug")
               .add("deliveryType")
               .add("lang")
               .add("width")
               .add("height");

            flashvars.isVW = "true";
            return flashvars;
        }
        function getHTMLVars(vars) {
            function getDim(dim) { return (dim.indexOf("%") !== -1) ? "" : dim; }
            vars = vars || getFlashVars();
            vars.referralUrl = environment.landingPage;
            vars.pageReferrer = environment.referrer;
            vars.widgetAkHost = params.widgetAkHost;
            vars.width = getDim(String(vars.width));
            vars.height = getDim(String(vars.height));
            vars.id = playerDiv;
            vars.src = getJSONURL("/callback/KickUtils.scriptLoadCallbacks[0]");
            return core.util.createQS(vars);
        }
        var data = {},playerDiv;
        function processSanitizedData() {
            playerDiv = params.id + "_player";
            data.swfParams = {
                swfURL: getSWFURL(),
                playerDivID: playerDiv,
                width: params.width,
                height: params.height,
                version: "10",
                EXPRESS_INSTALL: environment.protocol + "//" + params.widgetAkHost + "/kickFlash/scripts/expressInstall2.swf?2",
                flashvars: getFlashVars(),
                params: getFlashParams(),
                attributes: { id: playerDiv, name: playerDiv }
            };
            data.html_default = tryHTML(params);
            data.get_iframe_src = function () {
                return '//' + params.widgetAkHost + '/kickFlash/js/compiler/v2/iframe.html' + getHTMLVars();
            };
            data.id = params.id;
            core.dispatchEvent({type:'playerDataReady',payload:data});
        }
        core.addEventListener('dataSanitized', function dataSanitized(event){
            if (id === event.payload.id) {
                core.removeEventListener('dataSanitized', dataSanitized);
                params = event.payload;
                processSanitizedData();
            }
        });
        sanitize(id, params, init_config);
    }
    api.sanitize = sanitize;
    api.prepare_attributes = prepare_attributes;
    api.prepare_player_data = prepare_player_data;
    api.get_player_data = get_player_data;
    return api;
});
window.as_widget_manager.addModule("player", function (module_id, core) {
    "use strict";
    log("Adding Module Player.");
    var api = {},
        qs_params = core.getQSParams(),
        debug = qs_params.debug,
        app = window.as_widget_manager,
        player_instances = {},
        ingestion = core.getModule("ingestion");

    function log(msg, color) {
        if (!debug) { return; }
        color = color || "blue";
        msg = module_id + ": " + msg;
        console.log("%c" + msg, "color:" + color + ";font-weight:bold;");
    }

    function create_player(config_data, data, render_function) {
        log("create_player");
        var player = player_instances[data.id];
        function dispatch_player_event(type) {
            player.dispatchEvent({
                type: type,
                payload: {
                    player: player,
                    config_data: config_data
                }
            });
        }
        function update_user_token(user_token) {
            log("update_user_token");
            user_token.data = data;
            user_token.status = "pre-render";
            user_token.render = function () {
                var config = core.getConfig(),
                    embedType = "0";
                if(typeof data['embed-type'] != 'undefined') {
                    embedType = data['embed-type'];
                    config_data.swfParams.flashvars['embedType'] = data['embed-type'];
                } else if(typeof data['embed_type'] != 'undefined') {
                    embedType = data['embed-type'];
                    config_data.swfParams.flashvars['embedType'] = data['embed_type'];
                }
                if(typeof data['program_uuid'] != 'undefined') {
                    config_data.swfParams.flashvars['program_uuid'] = data['program_uuid'];
                }

                if(typeof data['project_uuid'] != 'undefined') {
                    config_data.swfParams.flashvars['projectUUID'] = data['project_uuid'];
                }

                if(typeof data['embed-uuid'] != 'undefined') {
                    config_data.swfParams.flashvars['embed_uuid'] = data['embed-uuid'];
                }

                if(typeof data['embed_uuid'] != 'undefined') {
                    config_data.swfParams.flashvars['embed_uuid'] = data['embed_uuid'];
                }

                if ((config.html_5_player_ids && config.html_5_player_ids[data.player_id]) || embedType == "1") {
                    config_data.swfParams.flashvars['html5_player_id_properties'] = null;

                    if(typeof data.player_id != "undefined") {
                        if(embedType == "1") {
                            config_data.swfParams.flashvars['html5_player_id'] = data.player_id;
                        } else {
                            if(typeof config.html_5_player_ids !="undefined" ) {
                                config_data.swfParams.flashvars['html5_player_id'] = config.html_5_player_ids[data.player_id];
                            }
                        }
                    }

                    if(typeof config.html_5_player_properties != "undefined" &&  config.html_5_player_properties!=null) {
                        if(typeof config.html_5_player_properties[config.html_5_player_ids[data.player_id]]) {
                            config_data.swfParams.flashvars['html5_player_id_properties'] = config.html_5_player_properties[config.html_5_player_ids[data.player_id]];
                        }
                    }

                   player.getElement = config.render_html5_player(data.id, config_data.swfParams.flashvars);
                } else if (typeof config.render_flash_player === "function") {
                    var getElement = config.render_flash_player(data.id, config_data.swfParams, config_data.html_default);
                    player.getElement = player.getElement || getElement;
                } else {
                    console.error("no render function found.");
                }
            };
            return user_token;
        }
        player.id = data.id;
        player.divId = config_data.swfParams.playerDivID;
        config_data.swfParams.callback = function (e) {
            log("swfParams.callback: ");
            var render_html_player = core.getConfig().render_html_player;
            if (e.success === false) {
                if (typeof render_html_player === "function") {
                    player.getElement = render_html_player(player.divId, config_data.get_iframe_src(), {
                        width: config_data.swfParams.width,
                        height: config_data.swfParams.height
                    });
                }
                player.isFlash = false;
            } else {
                player.isFlash = true;
            }
            player.status = "rendered";
            function getElement() {
                log("getElement");
                if (typeof player.getElement === "function") {
                    player.element = player.getElement();
                } else if (e && typeof e.ref === "object") {
                    player.element = e.ref;
                } else {
                    setTimeout(function () {
                        getElement();
                    }, 100);
                }
            }
            player.config_data = config_data;
            setTimeout(function () {
                log("swfParams: Dispatching player rendered event. ");
                dispatch_player_event("PLAYER_RENDERED");
            }, 0);
        };
        player.user_token = update_user_token(player.user_token);
        log("swfParams: Dispatching player added event. ");
        core.dispatchEvent({
            type: "PLAYER_ADDED",
            payload: {
                player: player,
                config_data: config_data
            }
        });
        //window.player_test = player;
        if (player.user_token.auto_render === true) {
            setTimeout(player.user_token.render, 0);
        }
        return player.user_token;
    }
    app.poll_dom = function (className, callback, discover_elements) {
        log("as_widget_manager.poll_dom: ");
        discover_elements = discover_elements || core.getConfig().discover_elements;
        discover_elements(className, function (data) {
            callback(ingestion.prepare_player_data(data));
        });
    };
    function init_player(id, init_config) {
        var player = new core.util.dispatcher(),
            user_token = new core.util.dispatcher();
        user_token.api = {};
        user_token.data = init_config;
        user_token.status = "pre-ingestion";
        user_token.auto_render = false;
        user_token.render = function () {
            user_token.auto_render = true;
        };
        player_instances[id] = player;
        init_config.id = id;
        user_token.api = {};
        player.user_token = user_token;

        return player;
    }
    app.create_player = function (id, init_config, render_function) {
        log("as_widget_manager.create_player: ");
        var player = init_player(id, init_config);
        core.addEventListener('playerDataReady', function addPlayer(event){
            if (event.payload.id === id) {
                core.removeEventListener('playerDataReady', addPlayer);
                log("as_widget_manager. Player data ready:");
                var player = create_player(event.payload, init_config, render_function);
                player.id = player.id || id;
                core.dispatchEvent({type:"PLAYER_CREATED",payload:player});
            }
        });
       ingestion.get_player_data(id, core.getConfig(), init_config);
       return player.user_token;
    };
    app.create_players = function (className, callback, discover_elements) {
        app.poll_dom(className, function (elements) {
            var id;
            for (id in elements) {
                if (elements.hasOwnProperty(id)) {
                    elements[id] = app.create_player(id, elements[id]);
                }
            }
            callback(elements);
        }, discover_elements);
    };
    api.create_player = create_player;
    return api;
});
window.as_widget_manager.addModule("external_interfacebridge", function (module_id, core) {
    "use strict";
    var api = {},
        qs_params = core.getQSParams(),
        debug = qs_params.debug,
        players = {};
    function log(msg, color) {
        if (!debug) { return; }
        color = color || "cyan";
        msg = module_id + ": " + msg;
        console.log("%c" + msg, "color:" + color + ";font-weight:bold;");
    }
    function getId(arr) {
        arr.pop();
        return arr.join("_");
    }
    function route(event) {
        var id = getId(event.address.split("_")),
            player = players[id],
            args;
        if (event.hasOwnProperty("method")) {
            args = event.arguments;
            player.bind(args);
        } else {
            player.user_token.dispatchEvent({
                type: event.type,
                payload: event.payload
            });
        }
    }
    window.as_widget_manager.route = route;
    function checkMessage(event) {
        if (typeof event.data === "string") {return;}
        var data = event.data || {},
            args = event.data.arguments,
            player = players[getId(data.iframeId.split("_"))],
            method = data.method || "";
        function dispatchEvent(data) {
            player.user_token.dispatchEvent({
                type: data.type,
                payload: data.payload
            });
        }
        if (data && player && method) {
            if (method === "dispatchEvent") {
                dispatchEvent(args.shift());
            } else if (method === "addMethod") {
                player.bind(data.arguments);
            } else {
                console.warn("uncaught " + data.method);
            }
        }
    }
    if (typeof window.addEventListener === "function") {
        window.addEventListener('message', checkMessage, false);
    }
    function get_player_bind_method(player) {
        function dispatchMethodReady(method) {
            player.dispatchEvent({
                type: "methodReady",
                payload: {
                    methodName: method
                }
            });
        }
        return function (methodName) {
            player.user_token.api[methodName] = function () {
                var params = [],
                    message = {
                        id : player.divId,
                        method : methodName
                    };
                message.arguments = params.splice.call(arguments, 0);
                try {
                    player.element = player.element || player.getElement();
                    if (player.isFlash) {
                        player.element.ingestMessage(message);
                    } else {
                        return player.element.contentWindow.postMessage(message, '*');
                    }
                } catch (e) {
                    console.error("no access to player object");
                }
            };
            dispatchMethodReady(methodName);
        };
    }
    core.addEventListener("PLAYER_ADDED", function (event) {
        var player = event.payload.player;
        players[player.id] = player;
        player.addEventListener("PLAYER_RENDERED", function (event) {
            player.bind = get_player_bind_method(player);
        });
    });
    return api;
});
/*
 Cases
 CSID only = make call and set projectUUID
 SID only (only allowed if we already have projectUUID) >> SID service call using retrieved projectUUID to set programID
 CSID & SID (presumably we don't have projectUUID otherwise why pass in CSID? If we do have projectUUID, should we skip the CSID call?)
 >> CSID service call to get projectUUID >> SID service call using retrieved projectUUID to set programID
 **/
window.as_widget_manager.addModule("kewego", function(module_id, core) {
    "use strict";
    var api = {},
        qs_params = core.getQSParams(),
        debug = qs_params.debug;
    var config = core.getConfig();
    var serviceURL;
    var wm = window.as_widget_manager;
    var service = null;
    var environment = {
        referrer: window.document.referrer.replace(/http[s]*:\/\//g, "") || "direct",
        landingPage: window.location.href.replace(/http[s]*:\/\//g, "") || "",
        protocol: window.location.protocol
    };
    function log(msg, color) {
        if (!debug) {
            return;
        }
        color = color || "purple";
        msg = module_id + ": " + msg;
        console.log("%c" + msg, "color:" + color + ";font-weight:bold;");
    }
    function getDomain(domain) {
        return environment.protocol + "//" + domain;
    }

    function resolve(event) {
        var data = event.payload;
        //pass back the updated data object
        function onDataResolved() {
            core.dispatchEvent({type: 'kewegoDataLoaded', payload: data});
        }

        function onCSIGResult(result) {
            onWSResult(result);
            if (result.response.WsVodProjectResponse) {
                data.projectUUID = result.response.WsVodProjectResponse.project[0].uuid;
            }
            //if there is no SID, we are done, pass back the results
            if (!data.sig) {
                log("csig loaded, no sig");
                onDataResolved();
            } else { //make the SID service call
                log("resolve sig");
                resolveSIG();
            }
        }

        function onSIGResult(result) {
            var program,
                response;
            onWSResult(result);
            if (result.response.WsProgramResponse) {
                response = result.response.WsProgramResponse;
                program = response.program || response.programs[0];
                data.video_uuid = result.response.WsProgramResponse.program.uuid;
            }
            onDataResolved();
        }

        function onWSResult(result) {
            if (result.response.failure) {
                var failure = result.response.failure;
                console.error("kewego_integration.js: Details: %s. Reason: %s. For URL %s", failure.details, failure.reason, serviceURL);
            }
        }

        function addCSIG(data) {
            var api_hash = {
                "5c73afee-f220-11e3-b265-005056865f49": "csig_volkswagen",
                "c43b1cbb-fc82-11e3-b265-005056865f49": "csig_volkswagen_7",
                "95969c70-fc83-11e3-b265-005056865f49": "csig_volkswagen_africa",
                "186fb339-fca8-11e3-b265-005056865f49": "csig_volkswagen_beetle",
                "6fe076a1-7c8f-11e4-90f2-005056865f49": "csig_volkswagen_carnet",
                "3a724b42-fca9-11e3-b265-005056865f49": "csig_volkswagen_china_group",
                "98ec852a-fca9-11e3-b265-005056865f49": "csig_volkswagen_china_svw",
                "b832b377-06b0-11e4-b265-005056865f49": "csig_volkswagen_de",
                "f419687a-06b1-11e4-b265-005056865f49": "csig_volkswagen_eastern_europe",
                "bb5d9388-0b7a-11e4-b265-005056865f49": "csig_volkswagen_europe",
                "deee6d3a-0b7b-11e4-b265-005056865f49": "csig_volkswagen_fareast",
                "824d373d-0b7c-11e4-b265-005056865f49": "csig_volkswagen_golf_gti",
                "28080ea9-0b7d-11e4-b265-005056865f49": "csig_volkswagen_international",
                "c1a34d59-0b7d-11e4-b265-005056865f49": "csig_volkswagen_light",
                "c90a76b1-0b7f-11e4-b265-005056865f49": "csig_volkswagen_longlead",
                "4d7abbdf-0b80-11e4-b265-005056865f49": "csig_volkswagen_microsites",
                "78a5181d-0b80-11e4-b265-005056865f49": "csig_volkswagen_near_east",
                "1712680e-0b81-11e4-b265-005056865f49": "csig_volkswagen_north_america",
                "3ee88a7a-0b81-11e4-b265-005056865f49": "csig_volkswagen_nutzfahrzeuge",
                "17ea6c7c-0b82-11e4-b265-005056865f49": "csig_volkswagen_south_america"
            }
            data.csig = api_hash[data.clientAPI];
        }

        //resolves to videoUUID
        function resolveSIG() {
            log('resolveSIG: ' + data.sig);
            //player.piksel.com/ws/ws_program/api/b832b377-06b0-11e4-b265-005056865f49/mode/json/apiv/5?refid=iLyROoafYIee&prefid=9824bhqgpo9h4
            serviceURL = getDomain(config.de_service_base) + '/ws/ws_program/api/' + config.API + '/mode/json/apiv/5?refid=' + data.csig + '&prefid=' + data.sig;
            service.ajax({url: serviceURL, dataType: 'json', success: onSIGResult});
        }

        //resolves to projectUUID
        function resolveCSIG() {
            log('resolveCSIG: ' + data.csig);
            serviceURL = getDomain(config.de_service_base) + '/ws/ws_vod_project/api/' + config.API + '/mode/json/apiv/5?referenceId=' + data.csig;
            service.ajax({url: serviceURL, dataType: 'json', success: onCSIGResult});
        }

        function onWSError(request, status, error) {
            log("onWSError: Status %s. Error %s.", status, error);
        }
        if (!service) {
            service = wm.get_library('jquery');
        }
        if (data.sig && !data.csig) {
            addCSIG(data);
        }
        if (data.csig && !data.projectUUID) {
            resolveCSIG();
        } else if (data.projectUUID && data.sig) {
            resolveSIG();
        } else {
            //todo Probably really should not be here as we either have the info we need,
            // but to keep the create process going, need to dispatch this event.
            onDataResolved();
        }
    }
    core.addEventListener('resolveKewego', resolve);
return api;
});

as_widget_manager.setDefaultConfig({
    de_service_base: "player.piksel.com",
    appasset_appstudio: "appasset.appstudio.piksel.com",
    widget_ak_host: "www.appstudio.piksel.com",
    vod_beacon: "http://ma198-r.analytics.edgesuite.net/config/beacon-4896.xml?beaconVersion=1.1",
    live_beacon: "http://ma198-r.analytics.edgesuite.net/config/beacon-4896.xml?beaconVersion=1.1",
    API: "7acd9375-611d-11e4-b265-005056865f49",
    API_VERSION: "4.0",
    video_player_class: "as_video_player",
    html_5_player_ids: {
      "test": "apu9bf1u",
    },
    "html_5_player_properties": {
      "apu9bf1u": {
      "de-delivery-type": "Akamai HD",
      "de-inserts": "true",
      "de-metadata": "true",
      "de-repeatvideo": "true",
      "de-share": "true",
      "de-bitrate": "true",
      "de-categorybar": "false",
      "de-playlist": "false",
      "de-repeatvideoslate": "true",
      "de-shareslate": "true",
      "de-responsive": "true",
      "de-playertype": "single",
      "de-ganalytics": "true",
      "de-panalytics": "true",
      "de-xanalytics": "false",
      "de-md-button": "false",
      "de-md-hidden": "true",
      "de-md-inline": "false",
      "de-language": "browser",
      "de-sh-facebook": "true",
      "de-sh-twitter": "true",
      "de-sh-linkedin": "false",
      "de-sh-link": "true",
      "de-settingsmenu": "false",
      "de-autoplay": "false",
    },
      "j8fvnt34": {
      "de-delivery-type": "Akamai HD",
      "de-inserts": "true",
      "de-ganalytics": "true",
      "de-panalytics": "true",
      "de-xanalytics": "true",
      "de-metadata": "false",
      "de-repeatvideo": "false",
      "de-share": "true",
      "de-bitrate": "true",
      "de-categorybar": "false",
      "de-playlist": "false",
      "de-repeatvideoslate": "false",
      "de-shareslate": "false",
      "de-responsive": "false",
      "de-playertype": "single",
      "de-md-button": "false",
      "de-md-hidden": "true",
      "de-md-inline": "false",
      "de-language": "browser",
      "de-sh-facebook": "true",
      "de-sh-twitter": "true",
      "de-sh-linkedin": "false",
      "de-sh-link": "true",
      "de-settingsmenu": "false",
      "de-autoplay": "false",
    },
      "ao196pe7": {
      "de-delivery-type": "Akamai HD",
      "de-inserts": "true",
      "de-ganalytics": "true",
      "de-panalytics": "true",
      "de-xanalytics": "true",
      "de-metadata": "true",
      "de-repeatvideo": "false",
      "de-share": "true",
      "de-bitrate": "false",
      "de-categorybar": "false",
      "de-playlist": "false",
      "de-repeatvideoslate": "false",
      "de-shareslate": "false",
      "de-responsive": "false",
      "de-md-button": "false",
      "de-md-hidden": "true",
      "de-md-inline": "false",
      "de-playertype": "single",
      "de-language": "browser",
      "de-sh-facebook": "true",
      "de-sh-twitter": "true",
      "de-sh-linkedin": "false",
      "de-sh-link": "true",
      "de-settingsmenu": "false",
      "de-autoplay": "false",
    },
      "pme9u8c2": {
      "de-delivery-type": "Akamai HD",
      "de-playertype": "category",
      "de-ganalytics": "true",
      "de-panalytics": "true",
      "de-xanalytics": "false",
      "de-bitrate": "true",
      "de-inserts": "true",
      "de-responsive": "false",
      "de-share": "true",
      "de-shareslate": "true",
      "de-repeatvideo": "true",
      "de-repeatvideoslate": "true",
      "de-metadata": "true",
      "de-md-button": "false",
      "de-md-hidden": "true",
      "de-md-inline": "true",
      "de-playlist": "true",
      "de-pl-nextControl": "false",
      "de-pl-playNext": "false",
      "de-pl-continueAfterLast": "false",
      "de-pl-random": "false",
      "de-pl-playSelected": "true",
      "de-pl-inline": "true",
      "de-pl-hidden": "false",
      "de-pl-slate": "true",
      "de-pl-slateText": "Play next video",
      "de-categorybar": "true",
      "de-cb-hidden": "false",
      "de-cb-location": "inline",
      "de-cb-title": "Category Bar",
      "de-language": "browser",
      "de-sh-facebook": "true",
      "de-sh-twitter": "true",
      "de-sh-linkedin": "false",
      "de-sh-link": "true",
      "de-autoplay": "false",
    },
      "fkg507js": {
      "de-delivery-type": "Akamai HD",
      "de-inserts": "true",
      "de-ganalytics": "true",
      "de-panalytics": "true",
      "de-xanalytics": "true",
      "de-metadata": "true",
      "de-repeatvideo": "true",
      "de-bitrate": "true",
      "de-playlist": "true",
      "de-repeatvideoslate": "true",
      "de-responsive": "false",
      "de-playertype": "playlist",
      "de-share": "true",
      "de-shareslate": "true",
      "de-md-button": "false",
      "de-md-hidden": "false",
      "de-md-inline": "true",
      "de-pl-nextControl": "true",
      "de-pl-playNext": "false",
      "de-pl-continueAfterLast": "false",
      "de-pl-random": "false",
      "de-pl-playSelected": "true",
      "de-pl-inline": "true",
      "de-pl-hidden": "false",
      "de-pl-slate": "true",
      "de-pl-slateText": "Play Next",
      "de-language": "browser",
      "de-sh-facebook": "true",
      "de-sh-twitter": "true",
      "de-sh-linkedin": "false",
      "de-sh-link": "true",
      "de-autoplay": "true",
    },
      "c7kdtn2w": {
      "de-delivery-type": "Akamai HD",
      "de-playertype": "single",
      "de-ganalytics": "true",
      "de-panalytics": "true",
      "de-responsive": "true",
      "de-inserts": "true",
      "de-language": "browser",
      "de-xanalytics": "false",
      "de-bitrate": "false",
      "de-share": "false",
      "de-shareslate": "false",
      "de-repeatvideo": "false",
      "de-repeatvideoslate": "false",
      "de-sh-facebook": "false",
      "de-sh-twitter": "false",
      "de-sh-linkedin": "false",
      "de-sh-link": "false",
      "de-autoplay": "false",
    },
    }
});(function(s,n){function I(a){var b=a.length,d=c.type(a);return c.isWindow(a)?false:a.nodeType===1&&b?true:d==="array"||d!=="function"&&(b===0||typeof b==="number"&&b>0&&b-1 in a)}function la(a){var b=hb[a]={};c.each(a.match(S)||[],function(a,c){b[c]=true});return b}function Ba(a,b,d,e){if(c.acceptData(a)){var g=c.expando,h=typeof b==="string",m=a.nodeType,i=m?c.cache:a,f=m?a[g]:a[g]&&g;if(f&&i[f]&&(e||i[f].data)||!(h&&d===n)){f||(m?a[g]=f=p.pop()||c.guid++:f=g);if(!i[f]&&(i[f]={},!m))i[f].toJSON=
c.noop;if(typeof b==="object"||typeof b==="function")e?i[f]=c.extend(i[f],b):i[f].data=c.extend(i[f].data,b);a=i[f];if(!e){if(!a.data)a.data={};a=a.data}d!==n&&(a[c.camelCase(b)]=d);h?(d=a[b],d==null&&(d=a[c.camelCase(b)])):d=a;return d}}}function La(a,b,d){if(c.acceptData(a)){var e,g,h,m=a.nodeType,i=m?c.cache:a,f=m?a[c.expando]:c.expando;if(i[f]){if(b&&(h=d?i[f]:i[f].data)){c.isArray(b)?b=b.concat(c.map(b,c.camelCase)):b in h?b=[b]:(b=c.camelCase(b),b=b in h?[b]:b.split(" "));for(e=0,g=b.length;e<
g;e++)delete h[b[e]];if(!(d?ca:c.isEmptyObject)(h))return}if(!d&&(delete i[f].data,!ca(i[f])))return;m?c.cleanData([a],true):c.support.deleteExpando||i!=i.window?delete i[f]:i[f]=null}}}function ma(a,b,d){if(d===n&&a.nodeType===1)if(d="data-"+b.replace(Ib,"-$1").toLowerCase(),d=a.getAttribute(d),typeof d==="string"){try{d=d==="true"?true:d==="false"?false:d==="null"?null:+d+""===d?+d:Jb.test(d)?c.parseJSON(d):d}catch(e){}c.data(a,b,d)}else d=n;return d}function ca(a){for(var b in a)if(!(b==="data"&&
c.isEmptyObject(a[b]))&&b!=="toJSON")return false;return true}function Y(){return true}function D(){return false}function Ma(a,b){do a=a[b];while(a&&a.nodeType!==1);return a}function na(a,b,d){b=b||0;if(c.isFunction(b))return c.grep(a,function(a,c){return!!b.call(a,c,a)===d});else if(b.nodeType)return c.grep(a,function(a){return a===b===d});else if(typeof b==="string"){var e=c.grep(a,function(a){return a.nodeType===1});if(Kb.test(b))return c.filter(b,e,!d);else b=c.filter(b,e)}return c.grep(a,function(a){return c.inArray(a,
b)>=0===d})}function oa(a){var b=ib.split("|"),a=a.createDocumentFragment();if(a.createElement)for(;b.length;)a.createElement(b.pop());return a}function Ca(a){var b=a.getAttributeNode("type");a.type=(b&&b.specified)+"/"+a.type;return a}function L(a){var b=Lb.exec(a.type);b?a.type=b[1]:a.removeAttribute("type");return a}function Da(a,b){for(var d,e=0;(d=a[e])!=null;e++)c._data(d,"globalEval",!b||c._data(b[e],"globalEval"))}function Z(a,b){if(b.nodeType===1&&c.hasData(a)){var d,e,g;e=c._data(a);var h=
c._data(b,e),m=e.events;if(m)for(d in delete h.handle,h.events={},m)for(e=0,g=m[d].length;e<g;e++)c.event.add(b,d,m[d][e]);if(h.data)h.data=c.extend({},h.data)}}function x(a,b){var d,e,g=0,h=typeof a.getElementsByTagName!==q?a.getElementsByTagName(b||"*"):typeof a.querySelectorAll!==q?a.querySelectorAll(b||"*"):n;if(!h)for(h=[],d=a.childNodes||a;(e=d[g])!=null;g++)!b||c.nodeName(e,b)?h.push(e):c.merge(h,x(e,b));return b===n||b&&c.nodeName(a,b)?c.merge([a],h):h}function $(a){if(Sa.test(a.type))a.defaultChecked=
a.checked}function Ea(a,b){if(b in a)return b;for(var c=b.charAt(0).toUpperCase()+b.slice(1),e=b,g=jb.length;g--;)if(b=jb[g]+c,b in a)return b;return e}function u(a,b){a=b||a;return c.css(a,"display")==="none"||!c.contains(a.ownerDocument,a)}function J(a,b){for(var d,e,g,h=[],m=0,i=a.length;m<i;m++)if(e=a[m],e.style)if(h[m]=c._data(e,"olddisplay"),d=e.style.display,b){if(!h[m]&&d==="none")e.style.display="";e.style.display===""&&u(e)&&(h[m]=c._data(e,"olddisplay",r(e.nodeName)))}else if(!h[m]&&(g=
u(e),d&&d!=="none"||!g))c._data(e,"olddisplay",g?d:c.css(e,"display"));for(m=0;m<i;m++)if(e=a[m],e.style&&(!b||e.style.display==="none"||e.style.display===""))e.style.display=b?h[m]||"":"none";return a}function T(a,b,c){return(a=Mb.exec(b))?Math.max(0,a[1]-(c||0))+(a[2]||"px"):b}function Fa(a,b,d,e,g){for(var b=d===(e?"border":"content")?4:b==="width"?1:0,h=0;b<4;b+=2)d==="margin"&&(h+=c.css(a,d+fa[b],true,g)),e?(d==="content"&&(h-=c.css(a,"padding"+fa[b],true,g)),d!=="margin"&&(h-=c.css(a,"border"+
fa[b]+"Width",true,g))):(h+=c.css(a,"padding"+fa[b],true,g),d!=="padding"&&(h+=c.css(a,"border"+fa[b]+"Width",true,g)));return h}function B(a,b,d){var e=true,g=b==="width"?a.offsetWidth:a.offsetHeight,h=ga(a),m=c.support.boxSizing&&c.css(a,"boxSizing",false,h)==="border-box";if(g<=0||g==null){g=ha(a,b,h);if(g<0||g==null)g=a.style[b];if(Na.test(g))return g;e=m&&(c.support.boxSizingReliable||g===a.style[b]);g=parseFloat(g)||0}return g+Fa(a,b,d||(m?"border":"content"),e,h)+"px"}function r(a){var b=f,
d=kb[a];if(!d){d=M(a,b);if(d==="none"||!d)Ga=(Ga||c("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(b.documentElement),b=(Ga[0].contentWindow||Ga[0].contentDocument).document,b.write("<!doctype html><html><body>"),b.close(),d=M(a,b),Ga.detach();kb[a]=d}return d}function M(a,b){var d=c(b.createElement(a)).appendTo(b.body),e=c.css(d[0],"display");d.remove();return e}function pa(a,b,d,e){var g;if(c.isArray(b))c.each(b,function(b,c){d||Nb.test(a)?
e(a,c):pa(a+"["+(typeof c==="object"?b:"")+"]",c,d,e)});else if(!d&&c.type(b)==="object")for(g in b)pa(a+"["+g+"]",b[g],d,e);else e(a,b)}function ia(a){return function(b,d){typeof b!=="string"&&(d=b,b="*");var e,g=0,h=b.toLowerCase().match(S)||[];if(c.isFunction(d))for(;e=h[g++];)e[0]==="+"?(e=e.slice(1)||"*",(a[e]=a[e]||[]).unshift(d)):(a[e]=a[e]||[]).push(d)}}function K(a,b,d,e){function g(i){var f;h[i]=true;c.each(a[i]||[],function(a,c){var i=c(b,d,e);if(typeof i==="string"&&!m&&!h[i])return b.dataTypes.unshift(i),
g(i),false;else if(m)return!(f=i)});return f}var h={},m=a===Ta;return g(b.dataTypes[0])||!h["*"]&&g("*")}function aa(a,b){var d,e,g=c.ajaxSettings.flatOptions||{};for(e in b)b[e]!==n&&((g[e]?a:d||(d={}))[e]=b[e]);d&&c.extend(true,a,d);return a}function U(){try{return new s.XMLHttpRequest}catch(a){}}function N(){setTimeout(function(){qa=n});return qa=c.now()}function ta(a,b){c.each(b,function(b,c){for(var g=(Ha[b]||[]).concat(Ha["*"]),h=0,m=g.length;h<m;h++)if(g[h].call(a,b,c))break})}function va(a,
b,d){var e,g=0,h=Oa.length,m=c.Deferred().always(function(){delete i.elem}),i=function(){if(e)return false;for(var b=qa||N(),b=Math.max(0,f.startTime+f.duration-b),c=1-(b/f.duration||0),d=0,g=f.tweens.length;d<g;d++)f.tweens[d].run(c);m.notifyWith(a,[f,c,b]);return c<1&&g?b:(m.resolveWith(a,[f]),false)},f=m.promise({elem:a,props:c.extend({},b),opts:c.extend(true,{specialEasing:{}},d),originalProperties:b,originalOptions:d,startTime:qa||N(),duration:d.duration,tweens:[],createTween:function(b,d){var e=
c.Tween(a,f.opts,b,d,f.opts.specialEasing[b]||f.opts.easing);f.tweens.push(e);return e},stop:function(b){var c=0,d=b?f.tweens.length:0;if(e)return this;for(e=true;c<d;c++)f.tweens[c].run(1);b?m.resolveWith(a,[f,b]):m.rejectWith(a,[f,b]);return this}}),d=f.props;for(Pa(d,f.opts.specialEasing);g<h;g++)if(b=Oa[g].call(f,a,d,f.opts))return b;ta(f,d);c.isFunction(f.opts.start)&&f.opts.start.call(a,f);c.fx.timer(c.extend(i,{elem:a,anim:f,queue:f.opts.queue}));return f.progress(f.opts.progress).done(f.opts.done,
f.opts.complete).fail(f.opts.fail).always(f.opts.always)}function Pa(a,b){var i;var d,e,g,h,m;for(g in a)if(e=c.camelCase(g),h=b[e],d=a[g],c.isArray(d)&&(h=d[1],i=a[g]=d[0],d=i),g!==e&&(a[e]=d,delete a[g]),(m=c.cssHooks[e])&&"expand"in m)for(g in d=m.expand(d),delete a[e],d)g in a||(a[g]=d[g],b[g]=h);else b[e]=h}function w(a,b,c,e,g){return new w.prototype.init(a,b,c,e,g)}function V(a,b){for(var c,e={height:a},g=0,b=b?1:0;g<4;g+=2-b)c=fa[g],e["margin"+c]=e["padding"+c]=a;if(b)e.opacity=e.width=a;
return e}function v(a){return c.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:false}var da,Ia,q=typeof n,f=s.document,j=s.location,k={},p=[],l=p.concat,E=p.push,A=p.slice,H=p.indexOf,y=k.toString,ja=k.hasOwnProperty,ea="1.9.1".trim,c=function(a,b){return new c.fn.init(a,b,Ia)},Q=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,S=/\S+/g,Ob=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,Pb=/^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,mb=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,Qb=/^[\],:{}\s]*$/,Rb=/(?:^|:|,)(?:\s*\[)+/g,
Sb=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,Tb=/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,Ub=/^-ms-/,Vb=/-([\da-z])/gi,Wb=function(a,b){return b.toUpperCase()},O=function(a){if(f.addEventListener||a.type==="load"||f.readyState==="complete")nb(),c.ready()},nb=function(){f.addEventListener?(f.removeEventListener("DOMContentLoaded",O,false),s.removeEventListener("load",O,false)):(f.detachEvent("onreadystatechange",O),s.detachEvent("onload",O))};c.fn=c.prototype={jquery:"1.9.1",constructor:c,
init:function(a,b,d){var e;if(!a)return this;if(typeof a==="string")if((e=a.charAt(0)==="<"&&a.charAt(a.length-1)===">"&&a.length>=3?[null,a,null]:Pb.exec(a))&&(e[1]||!b)){if(e[1]){if(b=b instanceof c?b[0]:b,c.merge(this,c.parseHTML(e[1],b&&b.nodeType?b.ownerDocument||b:f,true)),mb.test(e[1])&&c.isPlainObject(b))for(e in b)if(c.isFunction(this[e]))this[e](b[e]);else this.attr(e,b[e])}else{if((b=f.getElementById(e[2]))&&b.parentNode){if(b.id!==e[2])return d.find(a);this.length=1;this[0]=b}this.context=
f;this.selector=a}return this}else return!b||b.jquery?(b||d).find(a):this.constructor(b).find(a);else if(a.nodeType)return this.context=this[0]=a,this.length=1,this;else if(c.isFunction(a))return d.ready(a);if(a.selector!==n)this.selector=a.selector,this.context=a.context;return c.makeArray(a,this)},selector:"",length:0,size:function(){return this.length},toArray:function(){return A.call(this)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a){a=
c.merge(this.constructor(),a);a.prevObject=this;a.context=this.context;return a},each:function(a,b){return c.each(this,a,b)},ready:function(a){c.ready.promise().done(a);return this},slice:function(){return this.pushStack(A.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,a=+a+(a<0?b:0);return this.pushStack(a>=0&&a<b?[this[a]]:[])},map:function(a){return this.pushStack(c.map(this,function(b,c){return a.call(b,c,b)}))},
end:function(){return this.prevObject||this.constructor(null)},push:E,sort:[].sort,splice:[].splice};c.fn.init.prototype=c.fn;c.extend=c.fn.extend=function(){var a,b,d,e,g,h=arguments[0]||{},m=1,i=arguments.length,f=false;typeof h==="boolean"&&(f=h,h=arguments[1]||{},m=2);typeof h!=="object"&&!c.isFunction(h)&&(h={});i===m&&(h=this,--m);for(;m<i;m++)if((g=arguments[m])!=null)for(e in g)a=h[e],d=g[e],h!==d&&(f&&d&&(c.isPlainObject(d)||(b=c.isArray(d)))?(b?(b=false,a=a&&c.isArray(a)?a:[]):a=a&&c.isPlainObject(a)?
a:{},h[e]=c.extend(f,a,d)):d!==n&&(h[e]=d));return h};c.extend({isReady:false,readyWait:1,holdReady:function(a){a?c.readyWait++:c.ready(true)},ready:function(a){if(!(a===true?--c.readyWait:c.isReady)){if(!f.body)return setTimeout(c.ready);c.isReady=true;a!==true&&--c.readyWait>0||(da.resolveWith(f,[c]),c.fn.trigger&&c(f).trigger("ready").off("ready"))}},isFunction:function(a){return c.type(a)==="function"},isArray:Array.isArray||function(a){return c.type(a)==="array"},isWindow:function(a){return a!=
null&&a==a.window},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return a==null?String(a):typeof a==="object"||typeof a==="function"?k[y.call(a)]||"object":typeof a},isPlainObject:function(a){if(!a||c.type(a)!=="object"||a.nodeType||c.isWindow(a))return false;try{if(a.constructor&&!ja.call(a,"constructor")&&!ja.call(a.constructor.prototype,"isPrototypeOf"))return false}catch(b){return false}for(var d in a);return d===n||ja.call(a,d)},isEmptyObject:function(a){for(var b in a)return false;
return true},error:function(a){throw Error(a);},parseHTML:function(a,b,d){if(!a||typeof a!=="string")return null;typeof b==="boolean"&&(d=b,b=false);var b=b||f,e=mb.exec(a),d=!d&&[];if(e)return[b.createElement(e[1])];e=c.buildFragment([a],b,d);d&&c(d).remove();return c.merge([],e.childNodes)},parseJSON:function(a){if(s.JSON&&s.JSON.parse)return s.JSON.parse(a);if(a===null)return a;if(typeof a==="string"&&(a=c.trim(a))&&Qb.test(a.replace(Sb,"@").replace(Tb,"]").replace(Rb,"")))return(new Function("return "+
a))();c.error("Invalid JSON: "+a)},parseXML:function(a){var b,d;if(!a||typeof a!=="string")return null;try{s.DOMParser?(d=new DOMParser,b=d.parseFromString(a,"text/xml")):(b=new ActiveXObject("Microsoft.XMLDOM"),b.async="false",b.loadXML(a))}catch(e){b=n}(!b||!b.documentElement||b.getElementsByTagName("parsererror").length)&&c.error("Invalid XML: "+a);return b},noop:function(){},globalEval:function(a){a&&c.trim(a)&&(s.execScript||function(a){s.eval.call(s,a)})(a)},camelCase:function(a){return a.replace(Ub,
"ms-").replace(Vb,Wb)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var e,g=0,h=a.length;e=I(a);if(c)if(e)for(;g<h;g++){if(e=b.apply(a[g],c),e===false)break}else for(g in a){if(e=b.apply(a[g],c),e===false)break}else if(e)for(;g<h;g++){if(e=b.call(a[g],g,a[g]),e===false)break}else for(g in a)if(e=b.call(a[g],g,a[g]),e===false)break;return a},trim:ea&&!ea.call("\ufeff\u00a0")?function(a){return a==null?"":ea.call(a)}:function(a){return a==
null?"":(a+"").replace(Ob,"")},makeArray:function(a,b){var d=b||[];a!=null&&(I(Object(a))?c.merge(d,typeof a==="string"?[a]:a):E.call(d,a));return d},inArray:function(a,b,c){var e;if(b){if(H)return H.call(b,a,c);e=b.length;for(c=c?c<0?Math.max(0,e+c):c:0;c<e;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,b){var c=b.length,e=a.length,g=0;if(typeof c==="number")for(;g<c;g++)a[e++]=b[g];else for(;b[g]!==n;)a[e++]=b[g++];a.length=e;return a},grep:function(a,b,c){for(var e,g=[],h=0,m=a.length,
c=!!c;h<m;h++)e=!!b(a[h],h),c!==e&&g.push(a[h]);return g},map:function(a,b,c){var e,g=0,h=a.length,m=[];if(I(a))for(;g<h;g++)e=b(a[g],g,c),e!=null&&(m[m.length]=e);else for(g in a)e=b(a[g],g,c),e!=null&&(m[m.length]=e);return l.apply([],m)},guid:1,proxy:function(a,b){var d,e;typeof b==="string"&&(e=a[b],b=a,a=e);if(!c.isFunction(a))return n;d=A.call(arguments,2);e=function(){return a.apply(b||this,d.concat(A.call(arguments)))};e.guid=a.guid=a.guid||c.guid++;return e},access:function(a,b,d,e,g,h,m){var i=
0,f=a.length,j=d==null;if(c.type(d)==="object")for(i in g=true,d)c.access(a,b,i,d[i],true,h,m);else if(e!==n&&(g=true,c.isFunction(e)||(m=true),j&&(m?(b.call(a,e),b=null):(j=b,b=function(a,b,d){return j.call(c(a),d)})),b))for(;i<f;i++)b(a[i],d,m?e:e.call(a[i],i,b(a[i],d)));return g?a:j?b.call(a):f?b(a[0],d):h},now:function(){return(new Date).getTime()}});c.ready.promise=function(a){if(!da)if(da=c.Deferred(),f.readyState==="complete")setTimeout(c.ready);else if(f.addEventListener)f.addEventListener("DOMContentLoaded",
O,false),s.addEventListener("load",O,false);else{f.attachEvent("onreadystatechange",O);s.attachEvent("onload",O);var b=false;try{b=s.frameElement==null&&f.documentElement}catch(d){}b&&b.doScroll&&function g(){if(!c.isReady){try{b.doScroll("left")}catch(a){return setTimeout(g,50)}nb();c.ready()}}()}return da.promise(a)};c.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){k["[object "+b+"]"]=b.toLowerCase()});Ia=c(f);var hb={};c.Callbacks=function(a){var a=
typeof a==="string"?hb[a]||la(a):c.extend({},a),b,d,e,g,h,m,i=[],f=!a.once&&[],j=function(c){d=a.memory&&c;e=true;h=m||0;m=0;g=i.length;for(b=true;i&&h<g;h++)if(i[h].apply(c[0],c[1])===false&&a.stopOnFalse){d=false;break}b=false;i&&(f?f.length&&j(f.shift()):d?i=[]:k.disable())},k={add:function(){if(i){var e=i.length;(function Ja(b){c.each(b,function(b,d){var e=c.type(d);e==="function"?(!a.unique||!k.has(d))&&i.push(d):d&&d.length&&e!=="string"&&Ja(d)})})(arguments);b?g=i.length:d&&(m=e,j(d))}return this},
remove:function(){i&&c.each(arguments,function(a,d){for(var e;(e=c.inArray(d,i,e))>-1;)i.splice(e,1),b&&(e<=g&&g--,e<=h&&h--)});return this},has:function(a){return a?c.inArray(a,i)>-1:!(!i||!i.length)},empty:function(){i=[];return this},disable:function(){i=f=d=n;return this},disabled:function(){return!i},lock:function(){f=n;d||k.disable();return this},locked:function(){return!f},fireWith:function(a,c){c=c||[];c=[a,c.slice?c.slice():c];if(i&&(!e||f))b?f.push(c):j(c);return this},fire:function(){k.fireWith(this,
arguments);return this},fired:function(){return!!e}};return k};c.extend({Deferred:function(a){var b=[["resolve","done",c.Callbacks("once memory"),"resolved"],["reject","fail",c.Callbacks("once memory"),"rejected"],["notify","progress",c.Callbacks("memory")]],d="pending",e={state:function(){return d},always:function(){g.done(arguments).fail(arguments);return this},then:function(){var a=arguments;return c.Deferred(function(d){c.each(b,function(b,f){var j=f[0],k=c.isFunction(a[b])&&a[b];g[f[1]](function(){var a=
k&&k.apply(this,arguments);if(a&&c.isFunction(a.promise))a.promise().done(d.resolve).fail(d.reject).progress(d.notify);else d[j+"With"](this===e?d.promise():this,k?[a]:arguments)})});a=null}).promise()},promise:function(a){return a!=null?c.extend(a,e):e}},g={};e.pipe=e.then;c.each(b,function(a,c){var f=c[2],j=c[3];e[c[1]]=f.add;j&&f.add(function(){d=j},b[a^1][2].disable,b[2][2].lock);g[c[0]]=function(){g[c[0]+"With"](this===g?e:this,arguments);return this};g[c[0]+"With"]=f.fireWith});e.promise(g);
a&&a.call(g,g);return g},when:function(a){var b=0,d=A.call(arguments),e=d.length,g=e!==1||a&&c.isFunction(a.promise)?e:0,h=g===1?a:c.Deferred(),m=function(a,b,c){return function(d){b[a]=this;c[a]=arguments.length>1?A.call(arguments):d;c===f?h.notifyWith(b,c):--g||h.resolveWith(b,c)}},f,j,k;if(e>1){f=Array(e);j=Array(e);for(k=Array(e);b<e;b++)d[b]&&c.isFunction(d[b].promise)?d[b].promise().done(m(b,k,d)).fail(h.reject).progress(m(b,j,f)):--g}g||h.resolveWith(k,d);return h.promise()}});c.support=function(){var a,
b,d,e,g,h,m,i=f.createElement("div");i.setAttribute("className","t");i.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";b=i.getElementsByTagName("*");d=i.getElementsByTagName("a")[0];if(!b||!d||!b.length)return{};e=f.createElement("select");g=e.appendChild(f.createElement("option"));b=i.getElementsByTagName("input")[0];d.style.cssText="top:1px;float:left;opacity:.5";a={getSetAttribute:i.className!=="t",leadingWhitespace:i.firstChild.nodeType===3,tbody:!i.getElementsByTagName("tbody").length,
htmlSerialize:!!i.getElementsByTagName("link").length,style:/top/.test(d.getAttribute("style")),hrefNormalized:d.getAttribute("href")==="/a",opacity:/^0.5/.test(d.style.opacity),cssFloat:!!d.style.cssFloat,checkOn:!!b.value,optSelected:g.selected,enctype:!!f.createElement("form").enctype,html5Clone:f.createElement("nav").cloneNode(true).outerHTML!=="<:nav></:nav>",boxModel:f.compatMode==="CSS1Compat",deleteExpando:true,noCloneEvent:true,inlineBlockNeedsLayout:false,shrinkWrapBlocks:false,reliableMarginRight:true,
boxSizingReliable:true,pixelPosition:false};b.checked=true;a.noCloneChecked=b.cloneNode(true).checked;e.disabled=true;a.optDisabled=!g.disabled;try{delete i.test}catch(j){a.deleteExpando=false}b=f.createElement("input");b.setAttribute("value","");a.input=b.getAttribute("value")==="";b.value="t";b.setAttribute("type","radio");a.radioValue=b.value==="t";b.setAttribute("checked","t");b.setAttribute("name","t");d=f.createDocumentFragment();d.appendChild(b);a.appendChecked=b.checked;a.checkClone=d.cloneNode(true).cloneNode(true).lastChild.checked;
i.attachEvent&&(i.attachEvent("onclick",function(){a.noCloneEvent=false}),i.cloneNode(true).click());for(m in{submit:true,change:true,focusin:true})i.setAttribute(d="on"+m,"t"),a[m+"Bubbles"]=d in s||i.attributes[d].expando===false;i.style.backgroundClip="content-box";i.cloneNode(true).style.backgroundClip="";a.clearCloneStyle=i.style.backgroundClip==="content-box";c(function(){var b,c,d=f.getElementsByTagName("body")[0];if(d){b=f.createElement("div");b.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";
d.appendChild(b).appendChild(i);i.innerHTML="<table><tr><td></td><td>t</td></tr></table>";c=i.getElementsByTagName("td");c[0].style.cssText="padding:0;margin:0;border:0;display:none";h=c[0].offsetHeight===0;c[0].style.display="";c[1].style.display="none";a.reliableHiddenOffsets=h&&c[0].offsetHeight===0;i.innerHTML="";i.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;";
a.boxSizing=i.offsetWidth===4;a.doesNotIncludeMarginInBodyOffset=d.offsetTop!==1;if(s.getComputedStyle)a.pixelPosition=(s.getComputedStyle(i,null)||{}).top!=="1%",a.boxSizingReliable=(s.getComputedStyle(i,null)||{width:"4px"}).width==="4px",c=i.appendChild(f.createElement("div")),c.style.cssText=i.style.cssText="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",c.style.marginRight=c.style.width="0",i.style.width="1px",a.reliableMarginRight=
!parseFloat((s.getComputedStyle(c,null)||{}).marginRight);if(typeof i.style.zoom!==q&&(i.innerHTML="",i.style.cssText="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;width:1px;padding:1px;display:inline;zoom:1",a.inlineBlockNeedsLayout=i.offsetWidth===3,i.style.display="block",i.innerHTML="<div></div>",i.firstChild.style.width="5px",a.shrinkWrapBlocks=i.offsetWidth!==3,a.inlineBlockNeedsLayout))d.style.zoom=1;d.removeChild(b);
i=null}});b=e=d=g=d=b=null;return a}();var Jb=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,Ib=/([A-Z])/g;c.extend({cache:{},expando:"jQuery"+("1.9.1"+Math.random()).replace(/\D/g,""),noData:{embed:true,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:true},hasData:function(a){a=a.nodeType?c.cache[a[c.expando]]:a[c.expando];return!!a&&!ca(a)},data:function(a,b,c){return Ba(a,b,c)},removeData:function(a,b){return La(a,b)},_data:function(a,b,c){return Ba(a,b,c,true)},_removeData:function(a,b){return La(a,
b,true)},acceptData:function(a){if(a.nodeType&&a.nodeType!==1&&a.nodeType!==9)return false;var b=a.nodeName&&c.noData[a.nodeName.toLowerCase()];return!b||b!==true&&a.getAttribute("classid")===b}});c.fn.extend({data:function(a,b){var d,e,g=this[0],h=0,m=null;if(a===n){if(this.length&&(m=c.data(g),g.nodeType===1&&!c._data(g,"parsedAttrs"))){for(d=g.attributes;h<d.length;h++)e=d[h].name,e.indexOf("data-")||(e=c.camelCase(e.slice(5)),ma(g,e,m[e]));c._data(g,"parsedAttrs",true)}return m}return typeof a===
"object"?this.each(function(){c.data(this,a)}):c.access(this,function(b){if(b===n)return g?ma(g,a,c.data(g,a)):null;this.each(function(){c.data(this,a,b)})},null,b,arguments.length>1,null,true)},removeData:function(a){return this.each(function(){c.removeData(this,a)})}});c.extend({queue:function(a,b,d){var e;if(a)return b=(b||"fx")+"queue",e=c._data(a,b),d&&(!e||c.isArray(d)?e=c._data(a,b,c.makeArray(d)):e.push(d)),e||[]},dequeue:function(a,b){var b=b||"fx",d=c.queue(a,b),e=d.length,g=d.shift(),h=
c._queueHooks(a,b),m=function(){c.dequeue(a,b)};g==="inprogress"&&(g=d.shift(),e--);if(h.cur=g)b==="fx"&&d.unshift("inprogress"),delete h.stop,g.call(a,m,h);!e&&h&&h.empty.fire()},_queueHooks:function(a,b){var d=b+"queueHooks";return c._data(a,d)||c._data(a,d,{empty:c.Callbacks("once memory").add(function(){c._removeData(a,b+"queue");c._removeData(a,d)})})}});c.fn.extend({queue:function(a,b){var d=2;typeof a!=="string"&&(b=a,a="fx",d--);return arguments.length<d?c.queue(this[0],a):b===n?this:this.each(function(){var d=
c.queue(this,a,b);c._queueHooks(this,a);a==="fx"&&d[0]!=="inprogress"&&c.dequeue(this,a)})},dequeue:function(a){return this.each(function(){c.dequeue(this,a)})},delay:function(a,b){a=c.fx?c.fx.speeds[a]||a:a;return this.queue(b||"fx",function(b,c){var g=setTimeout(b,a);c.stop=function(){clearTimeout(g)}})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var d,e=1,g=c.Deferred(),h=this,m=this.length,f=function(){--e||g.resolveWith(h,[h])};typeof a!=="string"&&(b=a,a=n);
for(a=a||"fx";m--;)if((d=c._data(h[m],a+"queueHooks"))&&d.empty)e++,d.empty.add(f);f();return g.promise(b)}});var wa,ob,Ua=/[\t\r\n]/g,Xb=/\r/g,Yb=/^(?:input|select|textarea|button|object)$/i,Zb=/^(?:a|area)$/i,pb=/^(?:checked|selected|autofocus|autoplay|async|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped)$/i,Va=/^(?:checked|selected)$/i,W=c.support.getSetAttribute,Wa=c.support.input;c.fn.extend({attr:function(a,b){return c.access(this,c.attr,a,b,arguments.length>1)},
removeAttr:function(a){return this.each(function(){c.removeAttr(this,a)})},prop:function(a,b){return c.access(this,c.prop,a,b,arguments.length>1)},removeProp:function(a){a=c.propFix[a]||a;return this.each(function(){try{this[a]=n,delete this[a]}catch(b){}})},addClass:function(a){var b,d,e,g,h,m=0,f=this.length;b=typeof a==="string"&&a;if(c.isFunction(a))return this.each(function(b){c(this).addClass(a.call(this,b,this.className))});if(b)for(b=(a||"").match(S)||[];m<f;m++)if(d=this[m],e=d.nodeType===
1&&(d.className?(" "+d.className+" ").replace(Ua," "):" ")){for(h=0;g=b[h++];)e.indexOf(" "+g+" ")<0&&(e+=g+" ");d.className=c.trim(e)}return this},removeClass:function(a){var b,d,e,g,h,m=0,f=this.length;b=arguments.length===0||typeof a==="string"&&a;if(c.isFunction(a))return this.each(function(b){c(this).removeClass(a.call(this,b,this.className))});if(b)for(b=(a||"").match(S)||[];m<f;m++)if(d=this[m],e=d.nodeType===1&&(d.className?(" "+d.className+" ").replace(Ua," "):"")){for(h=0;g=b[h++];)for(;e.indexOf(" "+
g+" ")>=0;)e=e.replace(" "+g+" "," ");d.className=a?c.trim(e):""}return this},toggleClass:function(a,b){var d=typeof a,e=typeof b==="boolean";return c.isFunction(a)?this.each(function(d){c(this).toggleClass(a.call(this,d,this.className,b),b)}):this.each(function(){if(d==="string")for(var g,h=0,m=c(this),f=b,j=a.match(S)||[];g=j[h++];)f=e?f:!m.hasClass(g),m[f?"addClass":"removeClass"](g);else if(d===q||d==="boolean")this.className&&c._data(this,"__className__",this.className),this.className=this.className||
a===false?"":c._data(this,"__className__")||""})},hasClass:function(a){for(var a=" "+a+" ",b=0,c=this.length;b<c;b++)if(this[b].nodeType===1&&(" "+this[b].className+" ").replace(Ua," ").indexOf(a)>=0)return true;return false},val:function(a){var b,d,e,g=this[0];if(arguments.length)return e=c.isFunction(a),this.each(function(b){var g=c(this);if(this.nodeType===1&&(b=e?a.call(this,b,g.val()):a,b==null?b="":typeof b==="number"?b+="":c.isArray(b)&&(b=c.map(b,function(a){return a==null?"":a+""})),d=c.valHooks[this.type]||
c.valHooks[this.nodeName.toLowerCase()],!d||!("set"in d)||d.set(this,b,"value")===n))this.value=b});else if(g){if((d=c.valHooks[g.type]||c.valHooks[g.nodeName.toLowerCase()])&&"get"in d&&(b=d.get(g,"value"))!==n)return b;b=g.value;return typeof b==="string"?b.replace(Xb,""):b==null?"":b}}});c.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){for(var b,d=a.options,e=a.selectedIndex,g=(a=a.type==="select-one"||e<0)?null:
[],h=a?e+1:d.length,f=e<0?h:a?e:0;f<h;f++)if(b=d[f],(b.selected||f===e)&&(c.support.optDisabled?!b.disabled:b.getAttribute("disabled")===null)&&(!b.parentNode.disabled||!c.nodeName(b.parentNode,"optgroup"))){b=c(b).val();if(a)return b;g.push(b)}return g},set:function(a,b){var d=c.makeArray(b);c(a).find("option").each(function(){this.selected=c.inArray(c(this).val(),d)>=0});if(!d.length)a.selectedIndex=-1;return d}}},attr:function(a,b,d){var e,g,h;g=a.nodeType;if(a&&!(g===3||g===8||g===2)){if(typeof a.getAttribute===
q)return c.prop(a,b,d);if(g=g!==1||!c.isXMLDoc(a))b=b.toLowerCase(),e=c.attrHooks[b]||(pb.test(b)?ob:wa);if(d!==n)if(d===null)c.removeAttr(a,b);else return e&&g&&"set"in e&&(h=e.set(a,d,b))!==n?h:(a.setAttribute(b,d+""),d);else return e&&g&&"get"in e&&(h=e.get(a,b))!==null?h:(typeof a.getAttribute!==q&&(h=a.getAttribute(b)),h==null?n:h)}},removeAttr:function(a,b){var d,e,g=0,h=b&&b.match(S);if(h&&a.nodeType===1)for(;d=h[g++];)e=c.propFix[d]||d,pb.test(d)?!W&&Va.test(d)?a[c.camelCase("default-"+d)]=
a[e]=false:a[e]=false:c.attr(a,d,""),a.removeAttribute(W?d:e)},attrHooks:{type:{set:function(a,b){if(!c.support.radioValue&&b==="radio"&&c.nodeName(a,"input")){var d=a.value;a.setAttribute("type",b);if(d)a.value=d;return b}}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,
b,d){var e,g,h=a.nodeType;if(a&&!(h===3||h===8||h===2)){if(h!==1||!c.isXMLDoc(a))b=c.propFix[b]||b,g=c.propHooks[b];return d!==n?g&&"set"in g&&(e=g.set(a,d,b))!==n?e:a[b]=d:g&&"get"in g&&(e=g.get(a,b))!==null?e:a[b]}},propHooks:{tabIndex:{get:function(a){var b=a.getAttributeNode("tabindex");return b&&b.specified?parseInt(b.value,10):Yb.test(a.nodeName)||Zb.test(a.nodeName)&&a.href?0:n}}}});ob={get:function(a,b){var d=c.prop(a,b),e=typeof d==="boolean"&&a.getAttribute(b);return(d=typeof d==="boolean"?
Wa&&W?e!=null:Va.test(b)?a[c.camelCase("default-"+b)]:!!e:a.getAttributeNode(b))&&d.value!==false?b.toLowerCase():n},set:function(a,b,d){b===false?c.removeAttr(a,d):Wa&&W||!Va.test(d)?a.setAttribute(!W&&c.propFix[d]||d,d):a[c.camelCase("default-"+d)]=a[d]=true;return d}};if(!Wa||!W)c.attrHooks.value={get:function(a,b){var d=a.getAttributeNode(b);return c.nodeName(a,"input")?a.defaultValue:d&&d.specified?d.value:n},set:function(a,b,d){if(c.nodeName(a,"input"))a.defaultValue=b;else return wa&&wa.set(a,
b,d)}};if(!W)wa=c.valHooks.button={get:function(a,b){var c=a.getAttributeNode(b);return c&&(b==="id"||b==="name"||b==="coords"?c.value!=="":c.specified)?c.value:n},set:function(a,b,c){var e=a.getAttributeNode(c);e||a.setAttributeNode(e=a.ownerDocument.createAttribute(c));e.value=b+="";return c==="value"||b===a.getAttribute(c)?b:n}},c.attrHooks.contenteditable={get:wa.get,set:function(a,b,c){wa.set(a,b===""?false:b,c)}},c.each(["width","height"],function(a,b){c.attrHooks[b]=c.extend(c.attrHooks[b],
{set:function(a,c){if(c==="")return a.setAttribute(b,"auto"),c}})});c.support.hrefNormalized||(c.each(["href","src","width","height"],function(a,b){c.attrHooks[b]=c.extend(c.attrHooks[b],{get:function(a){a=a.getAttribute(b,2);return a==null?n:a}})}),c.each(["href","src"],function(a,b){c.propHooks[b]={get:function(a){return a.getAttribute(b,4)}}}));if(!c.support.style)c.attrHooks.style={get:function(a){return a.style.cssText||n},set:function(a,b){return a.style.cssText=b+""}};if(!c.support.optSelected)c.propHooks.selected=
c.extend(c.propHooks.selected,{get:function(){return null}});if(!c.support.enctype)c.propFix.enctype="encoding";c.support.checkOn||c.each(["radio","checkbox"],function(){c.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value}}});c.each(["radio","checkbox"],function(){c.valHooks[this]=c.extend(c.valHooks[this],{set:function(a,b){if(c.isArray(b))return a.checked=c.inArray(c(a).val(),b)>=0}})});var Xa=/^(?:input|select|textarea)$/i,$b=/^key/,ac=/^(?:mouse|contextmenu)|click/,
qb=/^(?:focusinfocus|focusoutblur)$/,rb=/^([^.]*)(?:\.(.+)|)$/;c.event={global:{},add:function(a,b,d,e,g){var h,f,i,j,k,p,o,l,Ja;if(i=c._data(a)){if(d.handler)j=d,d=j.handler,g=j.selector;if(!d.guid)d.guid=c.guid++;if(!(f=i.events))f=i.events={};if(!(k=i.handle))k=i.handle=function(a){return typeof c!==q&&(!a||c.event.triggered!==a.type)?c.event.dispatch.apply(k.elem,arguments):n},k.elem=a;b=(b||"").match(S)||[""];for(i=b.length;i--;){h=rb.exec(b[i])||[];l=p=h[1];Ja=(h[2]||"").split(".").sort();h=
c.event.special[l]||{};l=(g?h.delegateType:h.bindType)||l;h=c.event.special[l]||{};p=c.extend({type:l,origType:p,data:e,handler:d,guid:d.guid,selector:g,needsContext:g&&c.expr.match.needsContext.test(g),namespace:Ja.join(".")},j);if(!(o=f[l]))if(o=f[l]=[],o.delegateCount=0,!h.setup||h.setup.call(a,e,Ja,k)===false)a.addEventListener?a.addEventListener(l,k,false):a.attachEvent&&a.attachEvent("on"+l,k);if(h.add&&(h.add.call(a,p),!p.handler.guid))p.handler.guid=d.guid;g?o.splice(o.delegateCount++,0,p):
o.push(p);c.event.global[l]=true}a=null}},remove:function(a,b,d,e,g){var h,f,i,j,k,n,o,p,l,q,A,r=c.hasData(a)&&c._data(a);if(r&&(n=r.events)){b=(b||"").match(S)||[""];for(k=b.length;k--;)if(i=rb.exec(b[k])||[],l=A=i[1],q=(i[2]||"").split(".").sort(),l){o=c.event.special[l]||{};l=(e?o.delegateType:o.bindType)||l;p=n[l]||[];i=i[2]&&RegExp("(^|\\.)"+q.join("\\.(?:.*\\.|)")+"(\\.|$)");for(j=h=p.length;h--;)if(f=p[h],(g||A===f.origType)&&(!d||d.guid===f.guid)&&(!i||i.test(f.namespace))&&(!e||e===f.selector||
e==="**"&&f.selector))p.splice(h,1),f.selector&&p.delegateCount--,o.remove&&o.remove.call(a,f);j&&!p.length&&((!o.teardown||o.teardown.call(a,q,r.handle)===false)&&c.removeEvent(a,l,r.handle),delete n[l])}else for(l in n)c.event.remove(a,l+b[k],d,e,true);c.isEmptyObject(n)&&(delete r.handle,c._removeData(a,"events"))}},trigger:function(a,b,d,e){var g,h,m,i,j,k,p=[d||f],o=ja.call(a,"type")?a.type:a;j=ja.call(a,"namespace")?a.namespace.split("."):[];m=g=d=d||f;if(!(d.nodeType===3||d.nodeType===8)&&
!qb.test(o+c.event.triggered)){o.indexOf(".")>=0&&(j=o.split("."),o=j.shift(),j.sort());h=o.indexOf(":")<0&&"on"+o;a=a[c.expando]?a:new c.Event(o,typeof a==="object"&&a);a.isTrigger=true;a.namespace=j.join(".");a.namespace_re=a.namespace?RegExp("(^|\\.)"+j.join("\\.(?:.*\\.|)")+"(\\.|$)"):null;a.result=n;if(!a.target)a.target=d;b=b==null?[a]:c.makeArray(b,[a]);j=c.event.special[o]||{};if(e||!(j.trigger&&j.trigger.apply(d,b)===false)){if(!e&&!j.noBubble&&!c.isWindow(d)){i=j.delegateType||o;if(!qb.test(i+
o))m=m.parentNode;for(;m;m=m.parentNode)p.push(m),g=m;if(g===(d.ownerDocument||f))p.push(g.defaultView||g.parentWindow||s)}for(k=0;(m=p[k++])&&!a.isPropagationStopped();)a.type=k>1?i:j.bindType||o,(g=(c._data(m,"events")||{})[a.type]&&c._data(m,"handle"))&&g.apply(m,b),(g=h&&m[h])&&c.acceptData(m)&&g.apply&&g.apply(m,b)===false&&a.preventDefault();a.type=o;if(!e&&!a.isDefaultPrevented()&&(!j._default||j._default.apply(d.ownerDocument,b)===false)&&!(o==="click"&&c.nodeName(d,"a"))&&c.acceptData(d)&&
h&&d[o]&&!c.isWindow(d)){(g=d[h])&&(d[h]=null);c.event.triggered=o;try{d[o]()}catch(l){}c.event.triggered=n;g&&(d[h]=g)}return a.result}}},dispatch:function(a){var a=c.event.fix(a),b,d,e,g,h=[],f=A.call(arguments);b=(c._data(this,"events")||{})[a.type]||[];var i=c.event.special[a.type]||{};f[0]=a;a.delegateTarget=this;if(!(i.preDispatch&&i.preDispatch.call(this,a)===false)){h=c.event.handlers.call(this,a,b);for(b=0;(e=h[b++])&&!a.isPropagationStopped();){a.currentTarget=e.elem;for(g=0;(d=e.handlers[g++])&&
!a.isImmediatePropagationStopped();)if(!a.namespace_re||a.namespace_re.test(d.namespace))if(a.handleObj=d,a.data=d.data,d=((c.event.special[d.origType]||{}).handle||d.handler).apply(e.elem,f),d!==n&&(a.result=d)===false)a.preventDefault(),a.stopPropagation()}i.postDispatch&&i.postDispatch.call(this,a);return a.result}},handlers:function(a,b){var d,e,g,h,f=[],i=b.delegateCount,j=a.target;if(i&&j.nodeType&&(!a.button||a.type!=="click"))for(;j!=this;j=j.parentNode||this)if(j.nodeType===1&&(j.disabled!==
true||a.type!=="click")){g=[];for(h=0;h<i;h++)e=b[h],d=e.selector+" ",g[d]===n&&(g[d]=e.needsContext?c(d,this).index(j)>=0:c.find(d,this,null,[j]).length),g[d]&&g.push(e);g.length&&f.push({elem:j,handlers:g})}i<b.length&&f.push({elem:this,handlers:b.slice(i)});return f},fix:function(a){if(a[c.expando])return a;var b,d,e;b=a.type;var g=a,h=this.fixHooks[b];h||(this.fixHooks[b]=h=ac.test(b)?this.mouseHooks:$b.test(b)?this.keyHooks:{});e=h.props?this.props.concat(h.props):this.props;a=new c.Event(g);
for(b=e.length;b--;)d=e[b],a[d]=g[d];if(!a.target)a.target=g.srcElement||f;if(a.target.nodeType===3)a.target=a.target.parentNode;a.metaKey=!!a.metaKey;return h.filter?h.filter(a,g):a},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){if(a.which==null)a.which=b.charCode!=null?b.charCode:b.keyCode;return a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
filter:function(a,b){var c,e,g=b.button,h=b.fromElement;if(a.pageX==null&&b.clientX!=null)c=a.target.ownerDocument||f,e=c.documentElement,c=c.body,a.pageX=b.clientX+(e&&e.scrollLeft||c&&c.scrollLeft||0)-(e&&e.clientLeft||c&&c.clientLeft||0),a.pageY=b.clientY+(e&&e.scrollTop||c&&c.scrollTop||0)-(e&&e.clientTop||c&&c.clientTop||0);if(!a.relatedTarget&&h)a.relatedTarget=h===a.target?b.toElement:h;if(!a.which&&g!==n)a.which=g&1?1:g&2?3:g&4?2:0;return a}},special:{load:{noBubble:true},click:{trigger:function(){if(c.nodeName(this,
"input")&&this.type==="checkbox"&&this.click)return this.click(),false}},focus:{trigger:function(){if(this!==f.activeElement&&this.focus)try{return this.focus(),false}catch(a){}},delegateType:"focusin"},blur:{trigger:function(){if(this===f.activeElement&&this.blur)return this.blur(),false},delegateType:"focusout"},beforeunload:{postDispatch:function(a){if(a.result!==n)a.originalEvent.returnValue=a.result}}},simulate:function(a,b,d,e){a=c.extend(new c.Event,d,{type:a,isSimulated:true,originalEvent:{}});
e?c.event.trigger(a,null,b):c.event.dispatch.call(b,a);a.isDefaultPrevented()&&d.preventDefault()}};c.removeEvent=f.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,false)}:function(a,b,c){b="on"+b;a.detachEvent&&(typeof a[b]===q&&(a[b]=null),a.detachEvent(b,c))};c.Event=function(a,b){if(!(this instanceof c.Event))return new c.Event(a,b);a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===false||a.getPreventDefault&&
a.getPreventDefault()?Y:D):this.type=a;b&&c.extend(this,b);this.timeStamp=a&&a.timeStamp||c.now();this[c.expando]=true};c.Event.prototype={isDefaultPrevented:D,isPropagationStopped:D,isImmediatePropagationStopped:D,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=Y;if(a)a.preventDefault?a.preventDefault():a.returnValue=false},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=Y;if(a)a.stopPropagation&&a.stopPropagation(),a.cancelBubble=true},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=
Y;this.stopPropagation()}};c.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){c.event.special[a]={delegateType:b,bindType:b,handle:function(a){var e,g=a.relatedTarget,h=a.handleObj;if(!g||g!==this&&!c.contains(this,g))a.type=h.origType,e=h.handler.apply(this,arguments),a.type=b;return e}}});if(!c.support.submitBubbles)c.event.special.submit={setup:function(){if(c.nodeName(this,"form"))return false;c.event.add(this,"click._submit keypress._submit",function(a){a=a.target;if((a=c.nodeName(a,
"input")||c.nodeName(a,"button")?a.form:n)&&!c._data(a,"submitBubbles"))c.event.add(a,"submit._submit",function(a){a._submit_bubble=true}),c._data(a,"submitBubbles",true)})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&c.event.simulate("submit",this.parentNode,a,true))},teardown:function(){if(c.nodeName(this,"form"))return false;c.event.remove(this,"._submit")}};if(!c.support.changeBubbles)c.event.special.change={setup:function(){if(Xa.test(this.nodeName)){if(this.type===
"checkbox"||this.type==="radio")c.event.add(this,"propertychange._change",function(a){if(a.originalEvent.propertyName==="checked")this._just_changed=true}),c.event.add(this,"click._change",function(a){if(this._just_changed&&!a.isTrigger)this._just_changed=false;c.event.simulate("change",this,a,true)});return false}c.event.add(this,"beforeactivate._change",function(a){a=a.target;Xa.test(a.nodeName)&&!c._data(a,"changeBubbles")&&(c.event.add(a,"change._change",function(a){this.parentNode&&!a.isSimulated&&
!a.isTrigger&&c.event.simulate("change",this.parentNode,a,true)}),c._data(a,"changeBubbles",true))})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox")return a.handleObj.handler.apply(this,arguments)},teardown:function(){c.event.remove(this,"._change");return!Xa.test(this.nodeName)}};c.support.focusinBubbles||c.each({focus:"focusin",blur:"focusout"},function(a,b){var d=0,e=function(a){c.event.simulate(b,a.target,c.event.fix(a),true)};
c.event.special[b]={setup:function(){d++===0&&f.addEventListener(a,e,true)},teardown:function(){--d===0&&f.removeEventListener(a,e,true)}}});c.fn.extend({on:function(a,b,d,e,g){var h,f;if(typeof a==="object"){typeof b!=="string"&&(d=d||b,b=n);for(h in a)this.on(h,b,d,a[h],g);return this}d==null&&e==null?(e=b,d=b=n):e==null&&(typeof b==="string"?(e=d,d=n):(e=d,d=b,b=n));if(e===false)e=D;else if(!e)return this;if(g===1)f=e,e=function(a){c().off(a);return f.apply(this,arguments)},e.guid=f.guid||(f.guid=
c.guid++);return this.each(function(){c.event.add(this,a,e,d,b)})},one:function(a,b,c,e){return this.on(a,b,c,e,1)},off:function(a,b,d){var e;if(a&&a.preventDefault&&a.handleObj)return e=a.handleObj,c(a.delegateTarget).off(e.namespace?e.origType+"."+e.namespace:e.origType,e.selector,e.handler),this;if(typeof a==="object"){for(e in a)this.off(e,b,a[e]);return this}if(b===false||typeof b==="function")d=b,b=n;d===false&&(d=D);return this.each(function(){c.event.remove(this,a,d,b)})},bind:function(a,
b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,e){return this.on(b,a,c,e)},undelegate:function(a,b,c){return arguments.length===1?this.off(a,"**"):this.off(b,a||"**",c)},trigger:function(a,b){return this.each(function(){c.event.trigger(a,b,this)})},triggerHandler:function(a,b){var d=this[0];if(d)return c.event.trigger(a,b,d,true)}});(function(a,b){var d,e,g,h,f,i,j,k,n;function o(a){return la.test(a+"")}function p(){var a,b=[];return a=function(c,
d){b.push(c+=" ")>t.cacheLength&&delete a[b.shift()];return a[c]=d}}function l(a){a[F]=true;return a}function q(a){var b=P.createElement("div");try{return a(b)}catch(c){return false}finally{}}function r(a,b,c,g){var h,f,m,i,j;(b?b.ownerDocument||b:I)!==P&&xa(b);b=b||P;c=c||[];if(!a||typeof a!=="string")return c;if((i=b.nodeType)!==1&&i!==9)return[];if(!C&&!g){if(h=ma.exec(a))if(m=h[1])if(i===9)if((f=b.getElementById(m))&&f.parentNode){if(f.id===m)return c.push(f),c}else return c;else{if(b.ownerDocument&&
(f=b.ownerDocument.getElementById(m))&&K(b,f)&&f.id===m)return c.push(f),c}else if(h[2])return ea.apply(c,O.call(b.getElementsByTagName(a),0)),c;else if((m=h[3])&&d&&b.getElementsByClassName)return ea.apply(c,O.call(b.getElementsByClassName(m),0)),c;if(e&&!v.test(a)){h=true;f=F;m=b;j=i===9&&a;if(i===1&&b.nodeName.toLowerCase()!=="object"){i=H(a);(h=b.getAttribute("id"))?f=h.replace(pa,"\\$&"):b.setAttribute("id",f);f="[id='"+f+"'] ";for(m=i.length;m--;)i[m]=f+z(i[m]);m=ba.test(a)&&b.parentNode||b;
j=i.join(",")}if(j)try{return ea.apply(c,O.call(m.querySelectorAll(j),0)),c}catch(k){}finally{h||b.removeAttribute("id")}}}var o;a:{a=a.replace(T,"$1");f=H(a);if(!g&&f.length===1){h=f[0]=f[0].slice(0);if(h.length>2&&(o=h[0]).type==="ID"&&b.nodeType===9&&!C&&t.relative[h[1].type]){b=t.find.ID(o.matches[0].replace(ra,sa),b)[0];if(!b){o=c;break a}a=a.slice(h.shift().value.length)}for(i=W.needsContext.test(a)?0:h.length;i--;){o=h[i];if(t.relative[m=o.type])break;if(m=t.find[m])if(g=m(o.matches[0].replace(ra,
sa),ba.test(h[0].type)&&b.parentNode||b)){h.splice(i,1);a=g.length&&z(h);if(!a){ea.apply(c,O.call(g,0));o=c;break a}break}}}Ya(a,f)(g,b,C,c,ba.test(a));o=c}return o}function A(a,b){var c=b&&a,d=c&&(~b.sourceIndex||aa)-(~a.sourceIndex||aa);if(d)return d;if(c)for(;c=c.nextSibling;)if(c===b)return-1;return a?1:-1}function s(a){return function(b){return b.nodeName.toLowerCase()==="input"&&b.type===a}}function E(a){return function(b){var c=b.nodeName.toLowerCase();return(c==="input"||c==="button")&&b.type===
a}}function u(a){return l(function(b){b=+b;return l(function(c,d){for(var e,g=a([],c.length,b),h=g.length;h--;)if(c[e=g[h]])c[e]=!(d[e]=c[e])})})}function H(a,b){var c,d,e,g,h,f,m;if(h=V[a+" "])return b?0:h.slice(0);h=a;f=[];for(m=t.preFilter;h;){if(!c||(d=fa.exec(h)))d&&(h=h.slice(d[0].length)||h),f.push(e=[]);c=false;if(d=ga.exec(h))c=d.shift(),e.push({value:c,type:d[0].replace(T," ")}),h=h.slice(c.length);for(g in t.filter)if((d=W[g].exec(h))&&(!m[g]||(d=m[g](d))))c=d.shift(),e.push({value:c,type:g,
matches:d}),h=h.slice(c.length);if(!c)break}return b?h.length:h?r.error(a):V(a,f).slice(0)}function z(a){for(var b=0,c=a.length,d="";b<c;b++)d+=a[b].value;return d}function y(a,b,c){var d=b.dir,e=c&&d==="parentNode",g=$++;return b.first?function(b,c,g){for(;b=b[d];)if(b.nodeType===1||e)return a(b,c,g)}:function(b,c,h){var f,m,i,sb=D+" "+g;if(h)for(;b=b[d];){if((b.nodeType===1||e)&&a(b,c,h))return true}else for(;b=b[d];)if(b.nodeType===1||e)if(i=b[F]||(b[F]={}),(m=i[d])&&m[0]===sb){if((f=m[1])===true||
f===B)return f===true}else if(m=i[d]=[sb],m[1]=a(b,c,h)||B,m[1]===true)return true}}function Za(a){return a.length>1?function(b,c,d){for(var e=a.length;e--;)if(!a[e](b,c,d))return false;return true}:a[0]}function w(a,b,c,d,e){for(var g,h=[],f=0,m=a.length,i=b!=null;f<m;f++)if(g=a[f])if(!c||c(g,d,e))h.push(g),i&&b.push(f);return h}function $a(a,b,c,d,e,g){d&&!d[F]&&(d=$a(d));e&&!e[F]&&(e=$a(e,g));return l(function(g,h,f,m){var i,j,o=[],k=[],n=h.length,l;if(!(l=g)){l=b||"*";for(var p=f.nodeType?[f]:
f,q=[],ua=0,Ra=p.length;ua<Ra;ua++)r(l,p[ua],q);l=q}l=a&&(g||!b)?w(l,o,a,f,m):l;p=c?e||(g?a:n||d)?[]:h:l;c&&c(l,p,f,m);if(d){i=w(p,k);d(i,[],f,m);for(f=i.length;f--;)if(j=i[f])p[k[f]]=!(l[k[f]]=j)}if(g){if(e||a){if(e){i=[];for(f=p.length;f--;)if(j=p[f])i.push(l[f]=j);e(null,p=[],i,m)}for(f=p.length;f--;)if((j=p[f])&&(i=e?X.call(g,j):o[f])>-1)g[i]=!(h[i]=j)}}else p=w(p===h?p.splice(n,p.length):p),e?e(null,h,p,m):ea.apply(h,p)})}function x(a){var b,c,d,e=a.length,g=t.relative[a[0].type];c=g||t.relative[" "];
for(var h=g?1:0,f=y(function(a){return a===b},c,true),m=y(function(a){return X.call(b,a)>-1},c,true),i=[function(a,c,d){return!g&&(d||c!==J)||((b=c).nodeType?f(a,c,d):m(a,c,d))}];h<e;h++)if(c=t.relative[a[h].type])i=[y(Za(i),c)];else{c=t.filter[a[h].type].apply(null,a[h].matches);if(c[F]){for(d=++h;d<e;d++)if(t.relative[a[d].type])break;return $a(h>1&&Za(i),h>1&&z(a.slice(0,h-1)).replace(T,"$1"),c,h<d&&x(a.slice(h,d)),d<e&&x(a=a.slice(d)),d<e&&z(a))}i.push(c)}return Za(i)}function bc(a,b){var c=0,
d=b.length>0,e=a.length>0,g=function(g,h,f,m,i){var j,o,k=[],p=0,l="0",n=g&&[],q=i!=null,ua=J,Ra=g||e&&t.find.TAG("*",i&&h.parentNode||h),A=D+=ua==null?1:Math.random()||0.1;q&&(J=h!==P&&h,B=c);for(;(i=Ra[l])!=null;l++){if(e&&i){for(j=0;o=a[j++];)if(o(i,h,f)){m.push(i);break}q&&(D=A,B=++c)}d&&((i=!o&&i)&&p--,g&&n.push(i))}p+=l;if(d&&l!==p){for(j=0;o=b[j++];)o(n,k,h,f);if(g){if(p>0)for(;l--;)!n[l]&&!k[l]&&(k[l]=da.call(m));k=w(k)}ea.apply(m,k);q&&!g&&k.length>0&&p+b.length>1&&r.uniqueSort(m)}q&&(D=
A,J=ua);return n};return d?l(g):g}function S(){}var ya,B,t,Q,L,Ya,za,J,xa,P,R,C,v,G,M,K,ja,F="sizzle"+-new Date,I=a.document;d=void 0;e=void 0;g=void 0;h=void 0;f=void 0;i=void 0;j=void 0;k=void 0;n=void 0;var D=0,$=0,U=p(),V=p(),Y=p(),ka=typeof b,aa=-2147483648,N=[],da=N.pop,ea=N.push,O=N.slice,X=N.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]===a)return b;return-1},N="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+".replace("w","w#"),ca="\\[[\\x20\\t\\r\\n\\f]*((?:\\\\.|[\\w-]|[^\\x00-\\xa0])+)[\\x20\\t\\r\\n\\f]*(?:([*^$|!~]?=)[\\x20\\t\\r\\n\\f]*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+
N+")|)|)[\\x20\\t\\r\\n\\f]*\\]",Z=":((?:\\\\.|[\\w-]|[^\\x00-\\xa0])+)(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+ca.replace(3,8)+")*)|.*)\\)|)",T=RegExp("^[\\x20\\t\\r\\n\\f]+|((?:^|[^\\\\])(?:\\\\.)*)[\\x20\\t\\r\\n\\f]+$","g"),fa=/^[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/,ga=/^[\x20\t\r\n\f]*([\x20\t\r\n\f>+~])[\x20\t\r\n\f]*/,ha=RegExp(Z),ia=RegExp("^"+N+"$"),W={ID:/^#((?:\\.|[\w-]|[^\x00-\xa0])+)/,CLASS:/^\.((?:\\.|[\w-]|[^\x00-\xa0])+)/,NAME:/^\[name=['"]?((?:\\.|[\w-]|[^\x00-\xa0])+)['"]?\]/,
TAG:RegExp("^("+"(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+".replace("w","w*")+")"),ATTR:RegExp("^"+ca),PSEUDO:RegExp("^"+Z),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\([\\x20\\t\\r\\n\\f]*(even|odd|(([+-]|)(\\d*)n|)[\\x20\\t\\r\\n\\f]*(?:([+-]|)[\\x20\\t\\r\\n\\f]*(\\d+)|))[\\x20\\t\\r\\n\\f]*\\)|)","i"),needsContext:RegExp("^[\\x20\\t\\r\\n\\f]*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\([\\x20\\t\\r\\n\\f]*((?:-\\d)?\\d*)[\\x20\\t\\r\\n\\f]*\\)|)(?=[^-]|$)","i")},ba=/[\x20\t\r\n\f]*[+~]/,
la=/^[^{]+\{\s*\[native code/,ma=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,na=/^(?:input|select|textarea|button)$/i,oa=/^h\d$/i,pa=/'|\\/g,qa=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,ra=/\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,sa=function(a,b){var c="0x"+b-65536;return c!==c?b:c<0?String.fromCharCode(c+65536):String.fromCharCode(c>>10|55296,c&1023|56320)};try{O.call(I.documentElement.childNodes,0)}catch(ta){O=function(a){for(var b,c=[];b=this[a++];)c.push(b);return c}}L=r.isXML=function(a){return(a=
a&&(a.ownerDocument||a).documentElement)?a.nodeName!=="HTML":false};xa=r.setDocument=function(a){var c=a?a.ownerDocument||a:I;if(c===P||c.nodeType!==9||!c.documentElement)return P;P=c;R=c.documentElement;C=L(c);g=q(function(a){a.appendChild(c.createComment(""));return!a.getElementsByTagName("*").length});h=q(function(a){a.innerHTML="<select></select>";a=typeof a.lastChild.getAttribute("multiple");return a!=="boolean"&&a!=="string"});d=q(function(a){a.innerHTML="<div class='hidden e'></div><div class='hidden'></div>";
if(!a.getElementsByClassName||!a.getElementsByClassName("e").length)return false;a.lastChild.className="e";return a.getElementsByClassName("e").length===2});f=q(function(a){a.id=F+0;a.innerHTML="<a name='"+F+"'></a><div name='"+F+"'></div>";R.insertBefore(a,R.firstChild);var b=c.getElementsByName&&c.getElementsByName(F).length===2+c.getElementsByName(F+0).length;i=!c.getElementById(F);R.removeChild(a);return b});t.attrHandle=q(function(a){a.innerHTML="<a href='#'></a>";return a.firstChild&&typeof a.firstChild.getAttribute!==
ka&&a.firstChild.getAttribute("href")==="#"})?{}:{href:function(a){return a.getAttribute("href",2)},type:function(a){return a.getAttribute("type")}};i?(t.find.ID=function(a,b){if(typeof b.getElementById!==ka&&!C){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},t.filter.ID=function(a){var b=a.replace(ra,sa);return function(a){return a.getAttribute("id")===b}}):(t.find.ID=function(a,c){if(typeof c.getElementById!==ka&&!C){var d=c.getElementById(a);return d?d.id===a||typeof d.getAttributeNode!==
ka&&d.getAttributeNode("id").value===a?[d]:b:[]}},t.filter.ID=function(a){var b=a.replace(ra,sa);return function(a){return(a=typeof a.getAttributeNode!==ka&&a.getAttributeNode("id"))&&a.value===b}});t.find.TAG=g?function(a,b){if(typeof b.getElementsByTagName!==ka)return b.getElementsByTagName(a)}:function(a,b){var c,d=[],e=0,g=b.getElementsByTagName(a);if(a==="*"){for(;c=g[e++];)c.nodeType===1&&d.push(c);return d}return g};t.find.NAME=f&&function(a,b){if(typeof b.getElementsByName!==ka)return b.getElementsByName(name)};
t.find.CLASS=d&&function(a,b){if(typeof b.getElementsByClassName!==ka&&!C)return b.getElementsByClassName(a)};G=[];v=[":focus"];if(e=o(c.querySelectorAll))q(function(a){a.innerHTML="<select><option selected=''></option></select>";a.querySelectorAll("[selected]").length||v.push("\\[[\\x20\\t\\r\\n\\f]*(?:checked|disabled|ismap|multiple|readonly|selected|value)");a.querySelectorAll(":checked").length||v.push(":checked")}),q(function(a){a.innerHTML="<input type='hidden' i=''/>";a.querySelectorAll("[i^='']").length&&
v.push("[*^$]=[\\x20\\t\\r\\n\\f]*(?:\"\"|'')");a.querySelectorAll(":enabled").length||v.push(":enabled",":disabled");a.querySelectorAll("*,:x");v.push(",.*:")});(j=o(M=R.matchesSelector||R.mozMatchesSelector||R.webkitMatchesSelector||R.oMatchesSelector||R.msMatchesSelector))&&q(function(a){k=M.call(a,"div");M.call(a,"[s!='']:x");G.push("!=",Z)});v=RegExp(v.join("|"));G=RegExp(G.join("|"));K=o(R.contains)||R.compareDocumentPosition?function(a,b){var c=a.nodeType===9?a.documentElement:a,d=b&&b.parentNode;
return a===d||!(!d||!(d.nodeType===1&&(c.contains?c.contains(d):a.compareDocumentPosition&&a.compareDocumentPosition(d)&16)))}:function(a,b){if(b)for(;b=b.parentNode;)if(b===a)return true;return false};ja=R.compareDocumentPosition?function(a,b){var d;return a===b?(za=true,0):(d=b.compareDocumentPosition&&a.compareDocumentPosition&&a.compareDocumentPosition(b))?d&1||a.parentNode&&a.parentNode.nodeType===11?a===c||K(I,a)?-1:b===c||K(I,b)?1:0:d&4?-1:1:a.compareDocumentPosition?-1:1}:function(a,b){var d,
e=0;d=a.parentNode;var g=b.parentNode,h=[a],f=[b];if(a===b)return za=true,0;else if(!d||!g)return a===c?-1:b===c?1:d?-1:g?1:0;else if(d===g)return A(a,b);for(d=a;d=d.parentNode;)h.unshift(d);for(d=b;d=d.parentNode;)f.unshift(d);for(;h[e]===f[e];)e++;return e?A(h[e],f[e]):h[e]===I?-1:f[e]===I?1:0};za=false;[0,0].sort(ja);n=za;return P};r.matches=function(a,b){return r(a,null,null,b)};r.matchesSelector=function(a,b){(a.ownerDocument||a)!==P&&xa(a);b=b.replace(qa,"='$1']");if(j&&!C&&(!G||!G.test(b))&&
!v.test(b))try{var c=M.call(a,b);if(c||k||a.document&&a.document.nodeType!==11)return c}catch(d){}return r(b,P,null,[a]).length>0};r.contains=function(a,b){(a.ownerDocument||a)!==P&&xa(a);return K(a,b)};r.attr=function(a,b){var c;(a.ownerDocument||a)!==P&&xa(a);C||(b=b.toLowerCase());return(c=t.attrHandle[b])?c(a):C||h?a.getAttribute(b):((c=a.getAttributeNode(b))||a.getAttribute(b))&&a[b]===true?b:c&&c.specified?c.value:null};r.error=function(a){throw Error("Syntax error, unrecognized expression: "+
a);};r.uniqueSort=function(a){var b,c=[],d=1,e=0;za=!n;a.sort(ja);if(za){for(;b=a[d];d++)b===a[d-1]&&(e=c.push(d));for(;e--;)a.splice(c[e],1)}return a};Q=r.getText=function(a){var b,c="",d=0;if(b=a.nodeType)if(b===1||b===9||b===11)if(typeof a.textContent==="string")return a.textContent;else for(a=a.firstChild;a;a=a.nextSibling)c+=Q(a);else{if(b===3||b===4)return a.nodeValue}else for(;b=a[d];d++)c+=Q(b);return c};t=r.selectors={cacheLength:50,createPseudo:l,match:W,find:{},relative:{">":{dir:"parentNode",
first:true}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:true},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){a[1]=a[1].replace(ra,sa);a[3]=(a[4]||a[5]||"").replace(ra,sa);a[2]==="~="&&(a[3]=" "+a[3]+" ");return a.slice(0,4)},CHILD:function(a){a[1]=a[1].toLowerCase();a[1].slice(0,3)==="nth"?(a[3]||r.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*(a[3]==="even"||a[3]==="odd")),a[5]=+(a[7]+a[8]||a[3]==="odd")):a[3]&&r.error(a[0]);return a},PSEUDO:function(a){var b,c=!a[5]&&a[2];if(W.CHILD.test(a[0]))return null;
if(a[4])a[2]=a[4];else if(c&&ha.test(c)&&(b=H(c,true))&&(b=c.indexOf(")",c.length-b)-c.length))a[0]=a[0].slice(0,b),a[2]=c.slice(0,b);return a.slice(0,3)}},filter:{TAG:function(a){if(a==="*")return function(){return true};a=a.replace(ra,sa).toLowerCase();return function(b){return b.nodeName&&b.nodeName.toLowerCase()===a}},CLASS:function(a){var b=U[a+" "];return b||(b=RegExp("(^|[\\x20\\t\\r\\n\\f])"+a+"([\\x20\\t\\r\\n\\f]|$)"))&&U(a,function(a){return b.test(a.className||typeof a.getAttribute!==
ka&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){d=r.attr(d,a);if(d==null)return b==="!=";if(!b)return true;d+="";return b==="="?d===c:b==="!="?d!==c:b==="^="?c&&d.indexOf(c)===0:b==="*="?c&&d.indexOf(c)>-1:b==="$="?c&&d.slice(-c.length)===c:b==="~="?(" "+d+" ").indexOf(c)>-1:b==="|="?d===c||d.slice(0,c.length+1)===c+"-":false}},CHILD:function(a,b,c,d,e){var g=a.slice(0,3)!=="nth",h=a.slice(-4)!=="last",f=b==="of-type";return d===1&&e===0?function(a){return!!a.parentNode}:
function(b,c,m){var i,j,o,k,l,c=g!==h?"nextSibling":"previousSibling",p=b.parentNode,n=f&&b.nodeName.toLowerCase(),m=!m&&!f;if(p){if(g){for(;c;){for(j=b;j=j[c];)if(f?j.nodeName.toLowerCase()===n:j.nodeType===1)return false;l=c=a==="only"&&!l&&"nextSibling"}return true}l=[h?p.firstChild:p.lastChild];if(h&&m){m=p[F]||(p[F]={});i=m[a]||[];k=i[0]===D&&i[1];o=i[0]===D&&i[2];for(j=k&&p.childNodes[k];j=++k&&j&&j[c]||(o=k=0)||l.pop();)if(j.nodeType===1&&++o&&j===b){m[a]=[D,k,o];break}}else if(m&&(i=(b[F]||
(b[F]={}))[a])&&i[0]===D)o=i[1];else for(;j=++k&&j&&j[c]||(o=k=0)||l.pop();)if((f?j.nodeName.toLowerCase()===n:j.nodeType===1)&&++o)if(m&&((j[F]||(j[F]={}))[a]=[D,o]),j===b)break;o-=e;return o===d||o%d===0&&o/d>=0}}},PSEUDO:function(a,b){var c,d=t.pseudos[a]||t.setFilters[a.toLowerCase()]||r.error("unsupported pseudo: "+a);if(d[F])return d(b);return d.length>1?(c=[a,a,"",b],t.setFilters.hasOwnProperty(a.toLowerCase())?l(function(a,c){for(var e,g=d(a,b),h=g.length;h--;)e=X.call(a,g[h]),a[e]=!(c[e]=
g[h])}):function(a){return d(a,0,c)}):d}},pseudos:{not:l(function(a){var b=[],c=[],d=Ya(a.replace(T,"$1"));return d[F]?l(function(a,b,c,e){for(var e=d(a,null,e,[]),g=a.length;g--;)if(c=e[g])a[g]=!(b[g]=c)}):function(a,e,g){b[0]=a;d(b,null,g,c);return!c.pop()}}),has:l(function(a){return function(b){return r(a,b).length>0}}),contains:l(function(a){return function(b){return(b.textContent||b.innerText||Q(b)).indexOf(a)>-1}}),lang:l(function(a){ia.test(a||"")||r.error("unsupported lang: "+a);a=a.replace(ra,
sa).toLowerCase();return function(b){var c;do if(c=C?b.getAttribute("xml:lang")||b.getAttribute("lang"):b.lang)return c=c.toLowerCase(),c===a||c.indexOf(a+"-")===0;while((b=b.parentNode)&&b.nodeType===1);return false}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===R},focus:function(a){return a===P.activeElement&&(!P.hasFocus||P.hasFocus())&&!(!a.type&&!a.href&&!~a.tabIndex)},enabled:function(a){return a.disabled===false},disabled:function(a){return a.disabled===
true},checked:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&!!a.checked||b==="option"&&!!a.selected},selected:function(a){return a.selected===true},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeName>"@"||a.nodeType===3||a.nodeType===4)return false;return true},parent:function(a){return!t.pseudos.empty(a)},header:function(a){return oa.test(a.nodeName)},input:function(a){return na.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&
a.type==="button"||b==="button"},text:function(a){var b;return a.nodeName.toLowerCase()==="input"&&a.type==="text"&&((b=a.getAttribute("type"))==null||b.toLowerCase()===a.type)},first:u(function(){return[0]}),last:u(function(a,b){return[b-1]}),eq:u(function(a,b,c){return[c<0?c+b:c]}),even:u(function(a,b){for(var c=0;c<b;c+=2)a.push(c);return a}),odd:u(function(a,b){for(var c=1;c<b;c+=2)a.push(c);return a}),lt:u(function(a,b,c){for(b=c<0?c+b:c;--b>=0;)a.push(b);return a}),gt:u(function(a,b,c){for(c=
c<0?c+b:c;++c<b;)a.push(c);return a})}};for(ya in{radio:true,checkbox:true,file:true,password:true,image:true})t.pseudos[ya]=s(ya);for(ya in{submit:true,reset:true})t.pseudos[ya]=E(ya);Ya=r.compile=function(a,b){var c,d=[],e=[],g=Y[a+" "];if(!g){b||(b=H(a));for(c=b.length;c--;)g=x(b[c]),g[F]?d.push(g):e.push(g);g=Y(a,bc(e,d))}return g};t.pseudos.nth=t.pseudos.eq;t.filters=S.prototype=t.pseudos;t.setFilters=new S;xa();r.attr=c.attr;c.find=r;c.expr=r.selectors;c.expr[":"]=c.expr.pseudos;c.unique=r.uniqueSort;
c.text=r.getText;c.isXMLDoc=r.isXML;c.contains=r.contains})(s);var cc=/Until$/,dc=/^(?:parents|prev(?:Until|All))/,Kb=/^.[^:#\[\.,]*$/,tb=c.expr.match.needsContext,ec={children:true,contents:true,next:true,prev:true};c.fn.extend({find:function(a){var b,d,e,g=this.length;if(typeof a!=="string")return e=this,this.pushStack(c(a).filter(function(){for(b=0;b<g;b++)if(c.contains(e[b],this))return true}));d=[];for(b=0;b<g;b++)c.find(a,this[b],d);d=this.pushStack(g>1?c.unique(d):d);d.selector=(this.selector?
this.selector+" ":"")+a;return d},has:function(a){var b,d=c(a,this),e=d.length;return this.filter(function(){for(b=0;b<e;b++)if(c.contains(this,d[b]))return true})},not:function(a){return this.pushStack(na(this,a,false))},filter:function(a){return this.pushStack(na(this,a,true))},is:function(a){return!!a&&(typeof a==="string"?tb.test(a)?c(a,this.context).index(this[0])>=0:c.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){for(var d,e=0,g=this.length,h=[],f=tb.test(a)||typeof a!==
"string"?c(a,b||this.context):0;e<g;e++)for(d=this[e];d&&d.ownerDocument&&d!==b&&d.nodeType!==11;){if(f?f.index(d)>-1:c.find.matchesSelector(d,a)){h.push(d);break}d=d.parentNode}return this.pushStack(h.length>1?c.unique(h):h)},index:function(a){return!a?this[0]&&this[0].parentNode?this.first().prevAll().length:-1:typeof a==="string"?c.inArray(this[0],c(a)):c.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var d=typeof a==="string"?c(a,b):c.makeArray(a&&a.nodeType?[a]:a),d=c.merge(this.get(),d);return this.pushStack(c.unique(d))},
addBack:function(a){return this.add(a==null?this.prevObject:this.prevObject.filter(a))}});c.fn.andSelf=c.fn.addBack;c.each({parent:function(a){return(a=a.parentNode)&&a.nodeType!==11?a:null},parents:function(a){return c.dir(a,"parentNode")},parentsUntil:function(a,b,d){return c.dir(a,"parentNode",d)},next:function(a){return Ma(a,"nextSibling")},prev:function(a){return Ma(a,"previousSibling")},nextAll:function(a){return c.dir(a,"nextSibling")},prevAll:function(a){return c.dir(a,"previousSibling")},
nextUntil:function(a,b,d){return c.dir(a,"nextSibling",d)},prevUntil:function(a,b,d){return c.dir(a,"previousSibling",d)},siblings:function(a){return c.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return c.sibling(a.firstChild)},contents:function(a){return c.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:c.merge([],a.childNodes)}},function(a,b){c.fn[a]=function(d,e){var g=c.map(this,b,d);cc.test(a)||(e=d);e&&typeof e==="string"&&(g=c.filter(e,g));g=this.length>
1&&!ec[a]?c.unique(g):g;this.length>1&&dc.test(a)&&(g=g.reverse());return this.pushStack(g)}});c.extend({filter:function(a,b,d){d&&(a=":not("+a+")");return b.length===1?c.find.matchesSelector(b[0],a)?[b[0]]:[]:c.find.matches(a,b)},dir:function(a,b,d){for(var e=[],a=a[b];a&&a.nodeType!==9&&(d===n||a.nodeType!==1||!c(a).is(d));)a.nodeType===1&&e.push(a),a=a[b];return e},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var ib="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
fc=/ jQuery\d+="(?:null|\d+)"/g,ub=RegExp("<(?:"+ib+")[\\s/>]","i"),ab=/^\s+/,vb=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,wb=/<([\w:]+)/,xb=/<tbody/i,gc=/<|&#?\w+;/,hc=/<(?:script|style|link)/i,Sa=/^(?:checkbox|radio)$/i,ic=/checked\s*(?:[^=]|=\s*.checked.)/i,yb=/^$|\/(?:java|ecma)script/i,Lb=/^true\/(.*)/,jc=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,G={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],
param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:c.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},bb=oa(f).appendChild(f.createElement("div"));G.optgroup=G.option;G.tbody=G.tfoot=G.colgroup=G.caption=G.thead;G.th=G.td;c.fn.extend({text:function(a){return c.access(this,function(a){return a===n?c.text(this):this.empty().append((this[0]&&
this[0].ownerDocument||f).createTextNode(a))},null,a,arguments.length)},wrapAll:function(a){if(c.isFunction(a))return this.each(function(b){c(this).wrapAll(a.call(this,b))});if(this[0]){var b=c(a,this[0].ownerDocument).eq(0).clone(true);this[0].parentNode&&b.insertBefore(this[0]);b.map(function(){for(var a=this;a.firstChild&&a.firstChild.nodeType===1;)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){return c.isFunction(a)?this.each(function(b){c(this).wrapInner(a.call(this,
b))}):this.each(function(){var b=c(this),d=b.contents();d.length?d.wrapAll(a):b.append(a)})},wrap:function(a){var b=c.isFunction(a);return this.each(function(d){c(this).wrapAll(b?a.call(this,d):a)})},unwrap:function(){return this.parent().each(function(){c.nodeName(this,"body")||c(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,true,function(a){(this.nodeType===1||this.nodeType===11||this.nodeType===9)&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,
true,function(a){(this.nodeType===1||this.nodeType===11||this.nodeType===9)&&this.insertBefore(a,this.firstChild)})},before:function(){return this.domManip(arguments,false,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,false,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var d,e=0;(d=this[e])!=null;e++)if(!a||c.filter(a,[d]).length>0)!b&&d.nodeType===1&&c.cleanData(x(d)),
d.parentNode&&(b&&c.contains(d.ownerDocument,d)&&Da(x(d,"script")),d.parentNode.removeChild(d));return this},empty:function(){for(var a,b=0;(a=this[b])!=null;b++){for(a.nodeType===1&&c.cleanData(x(a,false));a.firstChild;)a.removeChild(a.firstChild);if(a.options&&c.nodeName(a,"select"))a.options.length=0}return this},clone:function(a,b){a=a==null?false:a;b=b==null?a:b;return this.map(function(){return c.clone(this,a,b)})},html:function(a){return c.access(this,function(a){var d=this[0]||{},e=0,g=this.length;
if(a===n)return d.nodeType===1?d.innerHTML.replace(fc,""):n;if(typeof a==="string"&&!hc.test(a)&&(c.support.htmlSerialize||!ub.test(a))&&(c.support.leadingWhitespace||!ab.test(a))&&!G[(wb.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(vb,"<$1></$2>");try{for(;e<g;e++)if(d=this[e]||{},d.nodeType===1)c.cleanData(x(d,false)),d.innerHTML=a;d=0}catch(h){}}d&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(a){!c.isFunction(a)&&typeof a!=="string"&&(a=c(a).not(this).detach());return this.domManip([a],
true,function(a){var d=this.nextSibling,e=this.parentNode;e&&(c(this).remove(),e.insertBefore(a,d))})},detach:function(a){return this.remove(a,true)},domManip:function(a,b,d){var a=l.apply([],a),e,g,h,f,i=0,j=this.length,k=this,p=j-1,o=a[0],q=c.isFunction(o);if(q||!(j<=1||typeof o!=="string"||c.support.checkClone||!ic.test(o)))return this.each(function(c){var e=k.eq(c);q&&(a[0]=o.call(this,c,b?e.html():n));e.domManip(a,b,d)});if(j&&(f=c.buildFragment(a,this[0].ownerDocument,false,this),e=f.firstChild,
f.childNodes.length===1&&(f=e),e)){b=b&&c.nodeName(e,"tr");h=c.map(x(f,"script"),Ca);for(g=h.length;i<j;i++)e=f,i!==p&&(e=c.clone(e,true,true),g&&c.merge(h,x(e,"script"))),d.call(b&&c.nodeName(this[i],"table")?this[i].getElementsByTagName("tbody")[0]||this[i].appendChild(this[i].ownerDocument.createElement("tbody")):this[i],e,i);if(g){f=h[h.length-1].ownerDocument;c.map(h,L);for(i=0;i<g;i++)if(e=h[i],yb.test(e.type||"")&&!c._data(e,"globalEval")&&c.contains(f,e))e.src?c.ajax({url:e.src,type:"GET",
dataType:"script",async:false,global:false,"throws":true}):c.globalEval((e.text||e.textContent||e.innerHTML||"").replace(jc,""))}f=e=null}return this}});c.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){c.fn[a]=function(a){for(var e=0,g=[],h=c(a),f=h.length-1;e<=f;e++)a=e===f?this:this.clone(true),c(h[e])[b](a),E.apply(g,a.get());return this.pushStack(g)}});c.extend({clone:function(a,b,d){var e,g,h,f,i,j=c.contains(a.ownerDocument,
a);c.support.html5Clone||c.isXMLDoc(a)||!ub.test("<"+a.nodeName+">")?h=a.cloneNode(true):(bb.innerHTML=a.outerHTML,bb.removeChild(h=bb.firstChild));if((!c.support.noCloneEvent||!c.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!c.isXMLDoc(a)){e=x(h);i=x(a);for(f=0;(g=i[f])!=null;++f)if(e[f]){var k=e[f],p=void 0,o=void 0,l=void 0;if(k.nodeType===1){p=k.nodeName.toLowerCase();if(!c.support.noCloneEvent&&k[c.expando]){l=c._data(k);for(o in l.events)c.removeEvent(k,o,l.handle);k.removeAttribute(c.expando)}if(p===
"script"&&k.text!==g.text)Ca(k).text=g.text,L(k);else if(p==="object"){if(k.parentNode)k.outerHTML=g.outerHTML;if(c.support.html5Clone&&g.innerHTML&&!c.trim(k.innerHTML))k.innerHTML=g.innerHTML}else if(p==="input"&&Sa.test(g.type)){if(k.defaultChecked=k.checked=g.checked,k.value!==g.value)k.value=g.value}else if(p==="option")k.defaultSelected=k.selected=g.defaultSelected;else if(p==="input"||p==="textarea")k.defaultValue=g.defaultValue}}}if(b)if(d){i=i||x(a);e=e||x(h);for(f=0;(g=i[f])!=null;f++)Z(g,
e[f])}else Z(a,h);e=x(h,"script");e.length>0&&Da(e,!j&&x(a,"script"));return h},buildFragment:function(a,b,d,e){for(var g,h,f,i,j,k,p=a.length,o=oa(b),l=[],n=0;n<p;n++)if((h=a[n])||h===0)if(c.type(h)==="object")c.merge(l,h.nodeType?[h]:h);else if(gc.test(h)){f=f||o.appendChild(b.createElement("div"));i=(wb.exec(h)||["",""])[1].toLowerCase();k=G[i]||G._default;f.innerHTML=k[1]+h.replace(vb,"<$1></$2>")+k[2];for(g=k[0];g--;)f=f.lastChild;!c.support.leadingWhitespace&&ab.test(h)&&l.push(b.createTextNode(ab.exec(h)[0]));
if(!c.support.tbody)for(g=(h=i==="table"&&!xb.test(h)?f.firstChild:k[1]==="<table>"&&!xb.test(h)?f:0)&&h.childNodes.length;g--;)c.nodeName(j=h.childNodes[g],"tbody")&&!j.childNodes.length&&h.removeChild(j);c.merge(l,f.childNodes);for(f.textContent="";f.firstChild;)f.removeChild(f.firstChild);f=o.lastChild}else l.push(b.createTextNode(h));f&&o.removeChild(f);c.support.appendChecked||c.grep(x(l,"input"),$);for(n=0;h=l[n++];)if(!(e&&c.inArray(h,e)!==-1)&&(a=c.contains(h.ownerDocument,h),f=x(o.appendChild(h),
"script"),a&&Da(f),d))for(g=0;h=f[g++];)yb.test(h.type||"")&&d.push(h);return o},cleanData:function(a,b){for(var d,e,g,h,f=0,i=c.expando,j=c.cache,k=c.support.deleteExpando,l=c.event.special;(d=a[f])!=null;f++)if(b||c.acceptData(d))if(h=(g=d[i])&&j[g]){if(h.events)for(e in h.events)l[e]?c.event.remove(d,e):c.removeEvent(d,e,h.handle);j[g]&&(delete j[g],k?delete d[i]:typeof d.removeAttribute!==q?d.removeAttribute(i):d[i]=null,p.push(g))}}});var Ga,ga,ha,cb=/alpha\([^)]*\)/i,kc=/opacity\s*=\s*([^)]*)/,
lc=/^(top|right|bottom|left)$/,mc=/^(none|table(?!-c[ea]).+)/,zb=/^margin/,Mb=RegExp("^("+Q+")(.*)$","i"),Na=RegExp("^("+Q+")(?!px)[a-z%]+$","i"),nc=RegExp("^([+-])=("+Q+")","i"),kb={BODY:"block"},oc={position:"absolute",visibility:"hidden",display:"block"},Ab={letterSpacing:0,fontWeight:400},fa=["Top","Right","Bottom","Left"],jb=["Webkit","O","Moz","ms"];c.fn.extend({css:function(a,b){return c.access(this,function(a,b,g){var h,f={},i=0;if(c.isArray(b)){h=ga(a);for(g=b.length;i<g;i++)f[b[i]]=c.css(a,
b[i],false,h);return f}return g!==n?c.style(a,b,g):c.css(a,b)},a,b,arguments.length>1)},show:function(){return J(this,true)},hide:function(){return J(this)},toggle:function(a){var b=typeof a==="boolean";return this.each(function(){(b?a:u(this))?c(this).show():c(this).hide()})}});c.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=ha(a,"opacity");return c===""?"1":c}}}},cssNumber:{columnCount:true,fillOpacity:true,fontWeight:true,lineHeight:true,opacity:true,orphans:true,widows:true,zIndex:true,
zoom:true},cssProps:{"float":c.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,b,d,e){if(a&&!(a.nodeType===3||a.nodeType===8||!a.style)){var g,h,f,i=c.camelCase(b),j=a.style,b=c.cssProps[i]||(c.cssProps[i]=Ea(j,i));f=c.cssHooks[b]||c.cssHooks[i];if(d!==n){h=typeof d;if(h==="string"&&(g=nc.exec(d)))d=(g[1]+1)*g[2]+parseFloat(c.css(a,b)),h="number";if(!(d==null||h==="number"&&isNaN(d)))if(h==="number"&&!c.cssNumber[i]&&(d+="px"),!c.support.clearCloneStyle&&d===""&&b.indexOf("background")===
0&&(j[b]="inherit"),!f||!("set"in f)||(d=f.set(a,d,e))!==n)try{j[b]=d}catch(k){}}else return f&&"get"in f&&(g=f.get(a,false,e))!==n?g:j[b]}},css:function(a,b,d,e){var g,h;h=c.camelCase(b);b=c.cssProps[h]||(c.cssProps[h]=Ea(a.style,h));(h=c.cssHooks[b]||c.cssHooks[h])&&"get"in h&&(g=h.get(a,true,d));g===n&&(g=ha(a,b,e));g==="normal"&&b in Ab&&(g=Ab[b]);return d===""||d?(a=parseFloat(g),d===true||c.isNumeric(a)?a||0:g):g},swap:function(a,b,c,e){var g,h={};for(g in b)h[g]=a.style[g],a.style[g]=b[g];
c=c.apply(a,e||[]);for(g in b)a.style[g]=h[g];return c}});s.getComputedStyle?(ga=function(a){return s.getComputedStyle(a,null)},ha=function(a,b,d){var e,g=(d=d||ga(a))?d.getPropertyValue(b)||d[b]:n,h=a.style;if(d&&(g===""&&!c.contains(a.ownerDocument,a)&&(g=c.style(a,b)),Na.test(g)&&zb.test(b)))a=h.width,b=h.minWidth,e=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=d.width,h.width=a,h.minWidth=b,h.maxWidth=e;return g}):f.documentElement.currentStyle&&(ga=function(a){return a.currentStyle},ha=function(a,
b,c){var e,g,h=(c=c||ga(a))?c[b]:n,f=a.style;h==null&&f&&f[b]&&(h=f[b]);if(Na.test(h)&&!lc.test(b)){c=f.left;if(g=(e=a.runtimeStyle)&&e.left)e.left=a.currentStyle.left;f.left=b==="fontSize"?"1em":h;h=f.pixelLeft+"px";f.left=c;if(g)e.left=g}return h===""?"auto":h});c.each(["height","width"],function(a,b){c.cssHooks[b]={get:function(a,e,g){if(e)return a.offsetWidth===0&&mc.test(c.css(a,"display"))?c.swap(a,oc,function(){return B(a,b,g)}):B(a,b,g)},set:function(a,e,g){var h=g&&ga(a);return T(a,e,g?Fa(a,
b,g,c.support.boxSizing&&c.css(a,"boxSizing",false,h)==="border-box",h):0)}}});if(!c.support.opacity)c.cssHooks.opacity={get:function(a,b){return kc.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?0.01*parseFloat(RegExp.$1)+"":b?"1":""},set:function(a,b){var d=a.style,e=a.currentStyle,g=c.isNumeric(b)?"alpha(opacity="+b*100+")":"",h=e&&e.filter||d.filter||"";d.zoom=1;if((b>=1||b==="")&&c.trim(h.replace(cb,""))===""&&d.removeAttribute)if(d.removeAttribute("filter"),b===""||e&&!e.filter)return;
d.filter=cb.test(h)?h.replace(cb,g):h+" "+g}};c(function(){if(!c.support.reliableMarginRight)c.cssHooks.marginRight={get:function(a,b){if(b)return c.swap(a,{display:"inline-block"},ha,[a,"marginRight"])}};!c.support.pixelPosition&&c.fn.position&&c.each(["top","left"],function(a,b){c.cssHooks[b]={get:function(a,e){if(e)return e=ha(a,b),Na.test(e)?c(a).position()[b]+"px":e}}})});if(c.expr&&c.expr.filters)c.expr.filters.hidden=function(a){return a.offsetWidth<=0&&a.offsetHeight<=0||!c.support.reliableHiddenOffsets&&
(a.style&&a.style.display||c.css(a,"display"))==="none"},c.expr.filters.visible=function(a){return!c.expr.filters.hidden(a)};c.each({margin:"",padding:"",border:"Width"},function(a,b){c.cssHooks[a+b]={expand:function(c){for(var e=0,g={},c=typeof c==="string"?c.split(" "):[c];e<4;e++)g[a+fa[e]+b]=c[e]||c[e-2]||c[0];return g}};if(!zb.test(a))c.cssHooks[a+b].set=T});var pc=/%20/g,Nb=/\[\]$/,Bb=/\r?\n/g,qc=/^(?:submit|button|image|reset|file)$/i,rc=/^(?:input|select|textarea|keygen)/i;c.fn.extend({serialize:function(){return c.param(this.serializeArray())},
serializeArray:function(){return this.map(function(){var a=c.prop(this,"elements");return a?c.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!c(this).is(":disabled")&&rc.test(this.nodeName)&&!qc.test(a)&&(this.checked||!Sa.test(a))}).map(function(a,b){var d=c(this).val();return d==null?null:c.isArray(d)?c.map(d,function(a){return{name:b.name,value:a.replace(Bb,"\r\n")}}):{name:b.name,value:d.replace(Bb,"\r\n")}}).get()}});c.param=function(a,b){var d,e=[],g=function(a,b){b=
c.isFunction(b)?b():b==null?"":b;e[e.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};b===n&&(b=c.ajaxSettings&&c.ajaxSettings.traditional);if(c.isArray(a)||a.jquery&&!c.isPlainObject(a))c.each(a,function(){g(this.name,this.value)});else for(d in a)pa(d,a[d],b,g);return e.join("&").replace(pc,"+")};c.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),
function(a,b){c.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}});c.fn.hover=function(a,b){return this.mouseenter(a).mouseleave(b||a)};var ba,X,db=c.now(),eb=/\?/,sc=/#.*$/,Cb=/([?&])_=[^&]*/,tc=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,uc=/^(?:GET|HEAD)$/,vc=/^\/\//,Db=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,Eb=c.fn.load,Fb={},Ta={},Gb="*/".concat("*");try{X=j.href}catch(Ac){X=f.createElement("a"),X.href="",X=X.href}ba=Db.exec(X.toLowerCase())||[];c.fn.load=function(a,
b,d){if(typeof a!=="string"&&Eb)return Eb.apply(this,arguments);var e,g,h,f=this,i=a.indexOf(" ");i>=0&&(e=a.slice(i,a.length),a=a.slice(0,i));c.isFunction(b)?(d=b,b=n):b&&typeof b==="object"&&(h="POST");f.length>0&&c.ajax({url:a,type:h,dataType:"html",data:b}).done(function(a){g=arguments;f.html(e?c("<div>").append(c.parseHTML(a)).find(e):a)}).complete(d&&function(a,b){f.each(d,g||[a.responseText,b,a])});return this};c.each("ajaxStart,ajaxStop,ajaxComplete,ajaxError,ajaxSuccess,ajaxSend".split(","),
function(a,b){c.fn[b]=function(a){return this.on(b,a)}});c.each(["get","post"],function(a,b){c[b]=function(a,e,g,h){c.isFunction(e)&&(h=h||g,g=e,e=n);return c.ajax({url:a,type:b,dataType:h,data:e,success:g})}});c.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:X,type:"GET",isLocal:/^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(ba[1]),global:true,processData:true,async:true,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Gb,text:"text/plain",
html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":s.String,"text html":true,"text json":c.parseJSON,"text xml":c.parseXML},flatOptions:{url:true,context:true}},ajaxSetup:function(a,b){return b?aa(aa(a,c.ajaxSettings),b):aa(c.ajaxSettings,a)},ajaxPrefilter:ia(Fb),ajaxTransport:ia(Ta),ajax:function(a,b){function d(a,b,d,e){var g,l,E,u,t=b;
if(H!==2){H=2;i&&clearTimeout(i);k=n;f=e||"";z.readyState=a>0?4:0;if(d){u=o;var e=z,w,y,v,x,D=u.contents,B=u.dataTypes,lb=u.responseFields;for(x in lb)x in d&&(e[lb[x]]=d[x]);for(;B[0]==="*";)B.shift(),y===n&&(y=u.mimeType||e.getResponseHeader("Content-Type"));if(y)for(x in D)if(D[x]&&D[x].test(y)){B.unshift(x);break}if(B[0]in d)v=B[0];else{for(x in d){if(!B[0]||u.converters[x+" "+B[0]]){v=x;break}w||(w=x)}v=v||w}v?(v!==B[0]&&B.unshift(v),u=d[v]):u=void 0}if(a>=200&&a<300||a===304)if(o.ifModified&&
((d=z.getResponseHeader("Last-Modified"))&&(c.lastModified[h]=d),(d=z.getResponseHeader("etag"))&&(c.etag[h]=d)),a===204)g=true,t="nocontent";else if(a===304)g=true,t="notmodified";else{a:{l=o;E=u;var Q,C,t={};w=0;y=l.dataTypes.slice();v=y[0];l.dataFilter&&(E=l.dataFilter(E,l.dataType));if(y[1])for(C in l.converters)t[C.toLowerCase()]=l.converters[C];for(;d=y[++w];)if(d!=="*"){if(v!=="*"&&v!==d){C=t[v+" "+d]||t["* "+d];if(!C)for(Q in t)if(g=Q.split(" "),g[1]===d&&(C=t[v+" "+g[0]]||t["* "+g[0]])){C===
true?C=t[Q]:t[Q]!==true&&(d=g[0],y.splice(w--,0,d));break}if(C!==true)if(C&&l["throws"])E=C(E);else try{E=C(E)}catch(G){g={state:"parsererror",error:C?G:"No conversion from "+v+" to "+d};break a}}v=d}g={state:"success",data:E}}t=g.state;l=g.data;E=g.error;g=!E}else if(E=t,a||!t)t="error",a<0&&(a=0);z.status=a;z.statusText=(b||t)+"";g?r.resolveWith(p,[l,t,z]):r.rejectWith(p,[z,t,E]);z.statusCode(s);s=n;j&&q.trigger(g?"ajaxSuccess":"ajaxError",[z,o,g?l:E]);A.fireWith(p,[z,t]);j&&(q.trigger("ajaxComplete",
[z,o]),--c.active||c.event.trigger("ajaxStop"))}}typeof a==="object"&&(b=a,a=n);var b=b||{},e,g,h,f,i,j,k,l,o=c.ajaxSetup({},b),p=o.context||o,q=o.context&&(p.nodeType||p.jquery)?c(p):c.event,r=c.Deferred(),A=c.Callbacks("once memory"),s=o.statusCode||{},E={},u={},H=0,w="canceled",z={readyState:0,getResponseHeader:function(a){var b;if(H===2){if(!l)for(l={};b=tc.exec(f);)l[b[1].toLowerCase()]=b[2];b=l[a.toLowerCase()]}return b==null?null:b},getAllResponseHeaders:function(){return H===2?f:null},setRequestHeader:function(a,
b){var c=a.toLowerCase();H||(a=u[c]=u[c]||a,E[a]=b);return this},overrideMimeType:function(a){if(!H)o.mimeType=a;return this},statusCode:function(a){var b;if(a)if(H<2)for(b in a)s[b]=[s[b],a[b]];else z.always(a[z.status]);return this},abort:function(a){a=a||w;k&&k.abort(a);d(0,a);return this}};r.promise(z).complete=A.add;z.success=z.done;z.error=z.fail;o.url=((a||o.url||X)+"").replace(sc,"").replace(vc,ba[1]+"//");o.type=b.method||b.type||o.method||o.type;o.dataTypes=c.trim(o.dataType||"*").toLowerCase().match(S)||
[""];if(o.crossDomain==null)e=Db.exec(o.url.toLowerCase()),o.crossDomain=!(!e||!(e[1]!==ba[1]||e[2]!==ba[2]||(e[3]||(e[1]==="http:"?80:443))!=(ba[3]||(ba[1]==="http:"?80:443))));if(o.data&&o.processData&&typeof o.data!=="string")o.data=c.param(o.data,o.traditional);K(Fb,o,b,z);if(H===2)return z;(j=o.global)&&c.active++===0&&c.event.trigger("ajaxStart");o.type=o.type.toUpperCase();o.hasContent=!uc.test(o.type);h=o.url;if(!o.hasContent&&(o.data&&(h=o.url+=(eb.test(h)?"&":"?")+o.data,delete o.data),
o.cache===false))o.url=Cb.test(h)?h.replace(Cb,"$1_="+db++):h+(eb.test(h)?"&":"?")+"_="+db++;o.ifModified&&(c.lastModified[h]&&z.setRequestHeader("If-Modified-Since",c.lastModified[h]),c.etag[h]&&z.setRequestHeader("If-None-Match",c.etag[h]));(o.data&&o.hasContent&&o.contentType!==false||b.contentType)&&z.setRequestHeader("Content-Type",o.contentType);z.setRequestHeader("Accept",o.dataTypes[0]&&o.accepts[o.dataTypes[0]]?o.accepts[o.dataTypes[0]]+(o.dataTypes[0]!=="*"?", "+Gb+"; q=0.01":""):o.accepts["*"]);
for(g in o.headers)z.setRequestHeader(g,o.headers[g]);if(o.beforeSend&&(o.beforeSend.call(p,z,o)===false||H===2))return z.abort();w="abort";for(g in{success:1,error:1,complete:1})z[g](o[g]);if(k=K(Ta,o,b,z)){z.readyState=1;j&&q.trigger("ajaxSend",[z,o]);o.async&&o.timeout>0&&(i=setTimeout(function(){z.abort("timeout")},o.timeout));try{H=1,k.send(E,d)}catch(y){if(H<2)d(-1,y);else throw y;}}else d(-1,"No Transport");return z},getScript:function(a,b){return c.get(a,n,b,"script")},getJSON:function(a,
b,d){return c.get(a,b,d,"json")}});c.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){c.globalEval(a);return a}}});c.ajaxPrefilter("script",function(a){if(a.cache===n)a.cache=false;if(a.crossDomain)a.type="GET",a.global=false});c.ajaxTransport("script",function(a){if(a.crossDomain){var b,d=f.head||c("head")[0]||f.documentElement;return{send:function(c,
g){b=f.createElement("script");b.async=true;if(a.scriptCharset)b.charset=a.scriptCharset;b.src=a.url;b.onload=b.onreadystatechange=function(a,c){if(c||!b.readyState||/loaded|complete/.test(b.readyState))b.onload=b.onreadystatechange=null,b.parentNode&&b.parentNode.removeChild(b),b=null,c||g(200,"success")};d.insertBefore(b,d.firstChild)},abort:function(){if(b)b.onload(n,true)}}}});var Hb=[],fb=/(=)\?(?=&|$)|\?\?/;c.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Hb.pop()||c.expando+"_"+
db++;this[a]=true;return a}});c.ajaxPrefilter("json jsonp",function(a,b,d){var e,g,h,f=a.jsonp!==false&&(fb.test(a.url)?"url":typeof a.data==="string"&&!(a.contentType||"").indexOf("application/x-www-form-urlencoded")&&fb.test(a.data)&&"data");if(f||a.dataTypes[0]==="jsonp")return e=a.jsonpCallback=c.isFunction(a.jsonpCallback)?a.jsonpCallback():a.jsonpCallback,f?a[f]=a[f].replace(fb,"$1"+e):a.jsonp!==false&&(a.url+=(eb.test(a.url)?"&":"?")+a.jsonp+"="+e),a.converters["script json"]=function(){h||
c.error(e+" was not called");return h[0]},a.dataTypes[0]="json",g=s[e],s[e]=function(){h=arguments},d.always(function(){s[e]=g;if(a[e])a.jsonpCallback=b.jsonpCallback,Hb.push(e);h&&c.isFunction(g)&&g(h[0]);h=g=n}),"script"});var Aa,Ka,wc=0,gb=s.ActiveXObject&&function(){for(var a in Aa)Aa[a](n,true)};c.ajaxSettings.xhr=s.ActiveXObject?function(){var a;if(!(a=!this.isLocal&&U()))a:{try{a=new s.ActiveXObject("Microsoft.XMLHTTP");break a}catch(b){}a=void 0}return a}:U;Ka=c.ajaxSettings.xhr();c.support.cors=
!!Ka&&"withCredentials"in Ka;(Ka=c.support.ajax=!!Ka)&&c.ajaxTransport(function(a){if(!a.crossDomain||c.support.cors){var b;return{send:function(d,e){var g,h,f=a.xhr();a.username?f.open(a.type,a.url,a.async,a.username,a.password):f.open(a.type,a.url,a.async);if(a.xhrFields)for(h in a.xhrFields)f[h]=a.xhrFields[h];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType);!a.crossDomain&&!d["X-Requested-With"]&&(d["X-Requested-With"]="XMLHttpRequest");try{for(h in d)f.setRequestHeader(h,d[h])}catch(i){}f.send(a.hasContent&&
a.data||null);b=function(d,h){var i,j,k,l;try{if(b&&(h||f.readyState===4)){b=n;if(g)f.onreadystatechange=c.noop,gb&&delete Aa[g];if(h)f.readyState!==4&&f.abort();else{l={};i=f.status;j=f.getAllResponseHeaders();if(typeof f.responseText==="string")l.text=f.responseText;try{k=f.statusText}catch(p){k=""}!i&&a.isLocal&&!a.crossDomain?i=l.text?200:404:i===1223&&(i=204)}}}catch(q){h||e(-1,q)}l&&e(i,k,l,j)};a.async?f.readyState===4?setTimeout(b):(g=++wc,gb&&(Aa||(Aa={},c(s).unload(gb)),Aa[g]=b),f.onreadystatechange=
b):b()},abort:function(){b&&b(n,true)}}}});var qa,Qa,xc=/^(?:toggle|show|hide)$/,yc=RegExp("^(?:([+-])=|)("+Q+")([a-z%]*)$","i"),zc=/queueHooks$/,Oa=[function(a,b,d){var e,g,f,j,i,k,l=this,p=a.style,o={},n=[],q=a.nodeType&&u(a);if(!d.queue){i=c._queueHooks(a,"fx");if(i.unqueued==null)i.unqueued=0,k=i.empty.fire,i.empty.fire=function(){i.unqueued||k()};i.unqueued++;l.always(function(){l.always(function(){i.unqueued--;c.queue(a,"fx").length||i.empty.fire()})})}if(a.nodeType===1&&("height"in b||"width"in
b))if(d.overflow=[p.overflow,p.overflowX,p.overflowY],c.css(a,"display")==="inline"&&c.css(a,"float")==="none")!c.support.inlineBlockNeedsLayout||r(a.nodeName)==="inline"?p.display="inline-block":p.zoom=1;if(d.overflow)p.overflow="hidden",c.support.shrinkWrapBlocks||l.always(function(){p.overflow=d.overflow[0];p.overflowX=d.overflow[1];p.overflowY=d.overflow[2]});for(g in b)f=b[g],xc.exec(f)&&(delete b[g],e=e||f==="toggle",f!==(q?"hide":"show")&&n.push(g));if(b=n.length){f=c._data(a,"fxshow")||c._data(a,
"fxshow",{});if("hidden"in f)q=f.hidden;if(e)f.hidden=!q;q?c(a).show():l.done(function(){c(a).hide()});l.done(function(){var b;c._removeData(a,"fxshow");for(b in o)c.style(a,b,o[b])});for(g=0;g<b;g++)if(e=n[g],j=l.createTween(e,q?f[e]:0),o[e]=f[e]||c.style(a,e),!(e in f)&&(f[e]=j.start,q))j.end=j.start,j.start=e==="width"||e==="height"?1:0}}],Ha={"*":[function(a,b){var d,e,g=this.createTween(a,b),f=yc.exec(b),j=g.cur(),i=+j||0,k=1,l=20;if(f){d=+f[2];e=f[3]||(c.cssNumber[a]?"":"px");if(e!=="px"&&i){i=
c.css(g.elem,a,true)||d||1;do k=k||".5",i/=k,c.style(g.elem,a,i+e);while(k!==(k=g.cur()/j)&&k!==1&&--l)}g.unit=e;g.start=i;g.end=f[1]?i+(f[1]+1)*d:d}return g}]};c.Animation=c.extend(va,{tweener:function(a,b){c.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var d,e=0,g=a.length;e<g;e++)d=a[e],Ha[d]=Ha[d]||[],Ha[d].unshift(b)},prefilter:function(a,b){b?Oa.unshift(a):Oa.push(a)}});c.Tween=w;w.prototype={constructor:w,init:function(a,b,d,e,g,f){this.elem=a;this.prop=d;this.easing=g||"swing";this.options=
b;this.start=this.now=this.cur();this.end=e;this.unit=f||(c.cssNumber[d]?"":"px")},cur:function(){var a=w.propHooks[this.prop];return a&&a.get?a.get(this):w.propHooks._default.get(this)},run:function(a){var b,d=w.propHooks[this.prop];this.pos=this.options.duration?b=c.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):b=a;this.now=(this.end-this.start)*b+this.start;this.options.step&&this.options.step.call(this.elem,this.now,this);d&&d.set?d.set(this):w.propHooks._default.set(this);
return this}};w.prototype.init.prototype=w.prototype;w.propHooks={_default:{get:function(a){if(a.elem[a.prop]!=null&&(!a.elem.style||a.elem.style[a.prop]==null))return a.elem[a.prop];a=c.css(a.elem,a.prop,"");return!a||a==="auto"?0:a},set:function(a){if(c.fx.step[a.prop])c.fx.step[a.prop](a);else a.elem.style&&(a.elem.style[c.cssProps[a.prop]]!=null||c.cssHooks[a.prop])?c.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}};w.propHooks.scrollTop=w.propHooks.scrollLeft={set:function(a){if(a.elem.nodeType&&
a.elem.parentNode)a.elem[a.prop]=a.now}};c.each(["toggle","show","hide"],function(a,b){var d=c.fn[b];c.fn[b]=function(a,c,f){return a==null||typeof a==="boolean"?d.apply(this,arguments):this.animate(V(b,true),a,c,f)}});c.fn.extend({fadeTo:function(a,b,c,e){return this.filter(u).css("opacity",0).show().end().animate({opacity:b},a,c,e)},animate:function(a,b,d,e){var g=c.isEmptyObject(a),f=c.speed(b,d,e),j=function(){var b=va(this,c.extend({},a),f);j.finish=function(){b.stop(true)};(g||c._data(this,
"finish"))&&b.stop(true)};j.finish=j;return g||f.queue===false?this.each(j):this.queue(f.queue,j)},stop:function(a,b,d){var e=function(a){var b=a.stop;delete a.stop;b(d)};typeof a!=="string"&&(d=b,b=a,a=n);b&&a!==false&&this.queue(a||"fx",[]);return this.each(function(){var b=true,f=a!=null&&a+"queueHooks",j=c.timers,i=c._data(this);if(f)i[f]&&i[f].stop&&e(i[f]);else for(f in i)i[f]&&i[f].stop&&zc.test(f)&&e(i[f]);for(f=j.length;f--;)if(j[f].elem===this&&(a==null||j[f].queue===a))j[f].anim.stop(d),
b=false,j.splice(f,1);(b||!d)&&c.dequeue(this,a)})},finish:function(a){a!==false&&(a=a||"fx");return this.each(function(){var b,d=c._data(this),e=d[a+"queue"];b=d[a+"queueHooks"];var g=c.timers,f=e?e.length:0;d.finish=true;c.queue(this,a,[]);b&&b.cur&&b.cur.finish&&b.cur.finish.call(this);for(b=g.length;b--;)g[b].elem===this&&g[b].queue===a&&(g[b].anim.stop(true),g.splice(b,1));for(b=0;b<f;b++)e[b]&&e[b].finish&&e[b].finish.call(this);delete d.finish})}});c.each({slideDown:V("show"),slideUp:V("hide"),
slideToggle:V("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){c.fn[a]=function(a,c,g){return this.animate(b,a,c,g)}});c.speed=function(a,b,d){var e=a&&typeof a==="object"?c.extend({},a):{complete:d||!d&&b||c.isFunction(a)&&a,duration:a,easing:d&&b||b&&!c.isFunction(b)&&b};e.duration=c.fx.off?0:typeof e.duration==="number"?e.duration:e.duration in c.fx.speeds?c.fx.speeds[e.duration]:c.fx.speeds._default;if(e.queue==null||e.queue===true)e.queue=
"fx";e.old=e.complete;e.complete=function(){c.isFunction(e.old)&&e.old.call(this);e.queue&&c.dequeue(this,e.queue)};return e};c.easing={linear:function(a){return a},swing:function(a){return 0.5-Math.cos(a*Math.PI)/2}};c.timers=[];c.fx=w.prototype.init;c.fx.tick=function(){var a,b=c.timers,d=0;for(qa=c.now();d<b.length;d++)a=b[d],!a()&&b[d]===a&&b.splice(d--,1);b.length||c.fx.stop();qa=n};c.fx.timer=function(a){a()&&c.timers.push(a)&&c.fx.start()};c.fx.interval=13;c.fx.start=function(){Qa||(Qa=setInterval(c.fx.tick,
c.fx.interval))};c.fx.stop=function(){clearInterval(Qa);Qa=null};c.fx.speeds={slow:600,fast:200,_default:400};c.fx.step={};if(c.expr&&c.expr.filters)c.expr.filters.animated=function(a){return c.grep(c.timers,function(b){return a===b.elem}).length};c.fn.offset=function(a){if(arguments.length)return a===n?this:this.each(function(b){c.offset.setOffset(this,a,b)});var b,d,e={top:0,left:0},g=(d=this[0])&&d.ownerDocument;if(g){b=g.documentElement;if(!c.contains(b,d))return e;typeof d.getBoundingClientRect!==
q&&(e=d.getBoundingClientRect());d=v(g);return{top:e.top+(d.pageYOffset||b.scrollTop)-(b.clientTop||0),left:e.left+(d.pageXOffset||b.scrollLeft)-(b.clientLeft||0)}}};c.offset={setOffset:function(a,b,d){var e=c.css(a,"position");if(e==="static")a.style.position="relative";var g=c(a),f=g.offset(),j=c.css(a,"top"),i=c.css(a,"left"),k={},l={};(e==="absolute"||e==="fixed")&&c.inArray("auto",[j,i])>-1?(l=g.position(),e=l.top,i=l.left):(e=parseFloat(j)||0,i=parseFloat(i)||0);c.isFunction(b)&&(b=b.call(a,
d,f));if(b.top!=null)k.top=b.top-f.top+e;if(b.left!=null)k.left=b.left-f.left+i;"using"in b?b.using.call(a,k):g.css(k)}};c.fn.extend({position:function(){if(this[0]){var a,b,d={top:0,left:0},e=this[0];c.css(e,"position")==="fixed"?b=e.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),c.nodeName(a[0],"html")||(d=a.offset()),d.top+=c.css(a[0],"borderTopWidth",true),d.left+=c.css(a[0],"borderLeftWidth",true));return{top:b.top-d.top-c.css(e,"marginTop",true),left:b.left-d.left-c.css(e,"marginLeft",
true)}}},offsetParent:function(){return this.map(function(){for(var a=this.offsetParent||f.documentElement;a&&!c.nodeName(a,"html")&&c.css(a,"position")==="static";)a=a.offsetParent;return a||f.documentElement})}});c.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var d=/Y/.test(b);c.fn[a]=function(e){return c.access(this,function(a,e,f){var i=v(a);if(f===n)return i?b in i?i[b]:i.document.documentElement[e]:a[e];i?i.scrollTo(!d?f:c(i).scrollLeft(),d?f:c(i).scrollTop()):a[e]=
f},a,e,arguments.length,null)}});c.each({Height:"height",Width:"width"},function(a,b){c.each({padding:"inner"+a,content:b,"":"outer"+a},function(d,e){c.fn[e]=function(e,f){var j=arguments.length&&(d||typeof e!=="boolean"),i=d||(e===true||f===true?"margin":"border");return c.access(this,function(b,d,e){if(c.isWindow(b))return b.document.documentElement["client"+a];return b.nodeType===9?(d=b.documentElement,Math.max(b.body["scroll"+a],d["scroll"+a],b.body["offset"+a],d["offset"+a],d["client"+a])):e===
n?c.css(b,d,i):c.style(b,d,e,i)},b,j?e:n,j,null)}})});(function b(){s.as_widget_manager&&typeof s.as_widget_manager.add_library=="function"?s.as_widget_manager.add_library("jquery",c):setTimeout(b,100)})()})(window);(function(s){var n=function(){function I(){if(!w){try{var f=r.getElementsByTagName("body")[0].appendChild(r.createElement("span"));f.parentNode.removeChild(f)}catch(j){return}w=true;for(var f=ia.length,k=0;k<f;k++)ia[k]()}}function la(f){w?f():ia[ia.length]=f}function Ba(f){if(typeof B.addEventListener!=u)B.addEventListener("load",f,false);else if(typeof r.addEventListener!=u)r.addEventListener("load",f,false);else if(typeof B.attachEvent!=u)Da(B,"onload",f);else if(typeof B.onload=="function"){var j=
B.onload;B.onload=function(){j();f()}}else B.onload=f}function La(){var f=r.getElementsByTagName("body")[0],j=r.createElement(J);j.setAttribute("type",T);var k=f.appendChild(j);if(k){var p=0;(function(){if(typeof k.GetVariable!=u){var l=k.GetVariable("$version");if(l)l=l.split(" ")[1].split(","),q.pv=[parseInt(l[0],10),parseInt(l[1],10),parseInt(l[2],10)]}else if(p<10){p++;setTimeout(arguments.callee,10);return}f.removeChild(j);k=null;ma()})()}else ma()}function ma(){var f=K.length;if(f>0)for(var j=
0;j<f;j++){var k=K[j].id,p=K[j].callbackFn,l={success:false,id:k};if(q.pv[0]>0){var n=L(k);if(n)if(Z(K[j].swfVersion)&&!(q.wk&&q.wk<312)){if($(k,true),p)l.success=true,l.ref=ca(k),p(l)}else if(K[j].expressInstall&&Y()){l={};l.data=K[j].expressInstall;l.width=n.getAttribute("width")||"0";l.height=n.getAttribute("height")||"0";if(n.getAttribute("class"))l.styleclass=n.getAttribute("class");if(n.getAttribute("align"))l.align=n.getAttribute("align");for(var r={},n=n.getElementsByTagName("param"),s=n.length,
y=0;y<s;y++)n[y].getAttribute("name").toLowerCase()!="movie"&&(r[n[y].getAttribute("name")]=n[y].getAttribute("value"));D(l,r,k,p)}else Ma(n),p&&p(l)}else if($(k,true),p){if((k=ca(k))&&typeof k.SetVariable!=u)l.success=true,l.ref=k;p(l)}}}function ca(f){var j=null;if((f=L(f))&&f.nodeName=="OBJECT")typeof f.SetVariable!=u?j=f:(f=f.getElementsByTagName(J)[0])&&(j=f);return j}function Y(){return!V&&Z("6.0.65")&&(q.win||q.mac)&&!(q.wk&&q.wk<312)}function D(f,j,k,p){V=true;va=p||null;Pa={success:false,
id:k};var l=L(k);if(l){l.nodeName=="OBJECT"?(N=na(l),ta=null):(N=l,ta=k);f.id=Fa;if(typeof f.width==u||!/%$/.test(f.width)&&parseInt(f.width,10)<310)f.width="310";if(typeof f.height==u||!/%$/.test(f.height)&&parseInt(f.height,10)<137)f.height="137";r.title=r.title.slice(0,47)+" - Flash Player Installation";p=q.ie&&q.win?"ActiveX":"PlugIn";p="MMredirectURL="+B.location.toString().replace(/&/g,"%26")+"&MMplayerType="+p+"&MMdoctitle="+r.title;typeof j.flashvars!=u?j.flashvars+="&"+p:j.flashvars=p;if(q.ie&&
q.win&&l.readyState!=4)p=r.createElement("div"),k+="SWFObjectNew",p.setAttribute("id",k),l.parentNode.insertBefore(p,l),l.style.display="none",function(){l.readyState==4?l.parentNode.removeChild(l):setTimeout(arguments.callee,10)}();oa(f,j,k)}}function Ma(f){if(q.ie&&q.win&&f.readyState!=4){var j=r.createElement("div");f.parentNode.insertBefore(j,f);j.parentNode.replaceChild(na(f),j);f.style.display="none";(function(){f.readyState==4?f.parentNode.removeChild(f):setTimeout(arguments.callee,10)})()}else f.parentNode.replaceChild(na(f),
f)}function na(f){var j=r.createElement("div");if(q.win&&q.ie)j.innerHTML=f.innerHTML;else if(f=f.getElementsByTagName(J)[0])if(f=f.childNodes)for(var k=f.length,p=0;p<k;p++)!(f[p].nodeType==1&&f[p].nodeName=="PARAM")&&f[p].nodeType!=8&&j.appendChild(f[p].cloneNode(true));return j}function oa(f,j,k){var p,l=L(k);if(q.wk&&q.wk<312)return p;if(l){if(typeof f.id==u)f.id=k;if(q.ie&&q.win){var n="",A;for(A in f)if(f[A]!=Object.prototype[A])A.toLowerCase()=="data"?j.movie=f[A]:A.toLowerCase()=="styleclass"?
n+=' class="'+f[A]+'"':A.toLowerCase()!="classid"&&(n+=" "+A+'="'+f[A]+'"');A="";for(var s in j)j[s]!=Object.prototype[s]&&(A+='<param name="'+s+'" value="'+j[s]+'" />');l.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+n+">"+A+"</object>";aa[aa.length]=f.id;p=L(f.id)}else{s=r.createElement(J);s.setAttribute("type",T);for(var y in f)f[y]!=Object.prototype[y]&&(y.toLowerCase()=="styleclass"?s.setAttribute("class",f[y]):y.toLowerCase()!="classid"&&s.setAttribute(y,f[y]));for(n in j)j[n]!=
Object.prototype[n]&&n.toLowerCase()!="movie"&&(f=s,A=n,y=j[n],k=r.createElement("param"),k.setAttribute("name",A),k.setAttribute("value",y),f.appendChild(k));l.parentNode.replaceChild(s,l);p=s}}return p}function Ca(f){var j=L(f);if(j&&j.nodeName=="OBJECT")q.ie&&q.win?(j.style.display="none",function(){if(j.readyState==4){var k=L(f);if(k){for(var p in k)typeof k[p]=="function"&&(k[p]=null);k.parentNode.removeChild(k)}}else setTimeout(arguments.callee,10)}()):j.parentNode.removeChild(j)}function L(f){var j=
null;try{j=r.getElementById(f)}catch(k){}return j}function Da(f,j,k){f.attachEvent(j,k);U[U.length]=[f,j,k]}function Z(f){var j=q.pv,f=f.split(".");f[0]=parseInt(f[0],10);f[1]=parseInt(f[1],10)||0;f[2]=parseInt(f[2],10)||0;return j[0]>f[0]||j[0]==f[0]&&j[1]>f[1]||j[0]==f[0]&&j[1]==f[1]&&j[2]>=f[2]?true:false}function x(f,j,k,p){if(!q.ie||!q.mac){var l=r.getElementsByTagName("head")[0];if(l){k=k&&typeof k=="string"?k:"screen";p&&(da=v=null);if(!v||da!=k)p=r.createElement("style"),p.setAttribute("type",
"text/css"),p.setAttribute("media",k),v=l.appendChild(p),q.ie&&q.win&&typeof r.styleSheets!=u&&r.styleSheets.length>0&&(v=r.styleSheets[r.styleSheets.length-1]),da=k;q.ie&&q.win?v&&typeof v.addRule==J&&v.addRule(f,j):v&&typeof r.createTextNode!=u&&v.appendChild(r.createTextNode(f+" {"+j+"}"))}}}function $(f,j){if(Ia){var k=j?"visible":"hidden";w&&L(f)?L(f).style.visibility=k:x("#"+f,"visibility:"+k)}}function Ea(f){return/[\\\"<>\.;]/.exec(f)!=null&&typeof encodeURIComponent!=u?encodeURIComponent(f):
f}var u="undefined",J="object",T="application/x-shockwave-flash",Fa="SWFObjectExprInst",B=s,r=document,M=navigator,pa=false,ia=[function(){pa?La():ma()}],K=[],aa=[],U=[],N,ta,va,Pa,w=false,V=false,v,da,Ia=true,q=function(){var f=typeof r.getElementById!=u&&typeof r.getElementsByTagName!=u&&typeof r.createElement!=u,j=M.userAgent.toLowerCase(),k=M.platform.toLowerCase(),p=k?/win/.test(k):/win/.test(j),k=k?/mac/.test(k):/mac/.test(j),j=/webkit/.test(j)?parseFloat(j.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,
"$1")):false,l=!+"\u000b1",n=[0,0,0],q=null;if(typeof M.plugins!=u&&typeof M.plugins["Shockwave Flash"]==J){if((q=M.plugins["Shockwave Flash"].description)&&!(typeof M.mimeTypes!=u&&M.mimeTypes[T]&&!M.mimeTypes[T].enabledPlugin))pa=true,l=false,q=q.replace(/^.*\s+(\S+\s+\S+$)/,"$1"),n[0]=parseInt(q.replace(/^(.*)\..*$/,"$1"),10),n[1]=parseInt(q.replace(/^.*\.(.*)\s.*$/,"$1"),10),n[2]=/[a-zA-Z]/.test(q)?parseInt(q.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}else if(typeof B.ActiveXObject!=u)try{var s=
new ActiveXObject("ShockwaveFlash.ShockwaveFlash");if(s&&(q=s.GetVariable("$version")))l=true,q=q.split(" ")[1].split(","),n=[parseInt(q[0],10),parseInt(q[1],10),parseInt(q[2],10)]}catch(y){}return{w3:f,pv:n,wk:j,ie:l,win:p,mac:k}}();(function(){q.w3&&((typeof r.readyState!=u&&r.readyState=="complete"||typeof r.readyState==u&&(r.getElementsByTagName("body")[0]||r.body))&&I(),w||(typeof r.addEventListener!=u&&r.addEventListener("DOMContentLoaded",I,false),q.ie&&q.win&&(r.attachEvent("onreadystatechange",
function(){r.readyState=="complete"&&(r.detachEvent("onreadystatechange",arguments.callee),I())}),B==top&&function(){if(!w){try{r.documentElement.doScroll("left")}catch(f){setTimeout(arguments.callee,0);return}I()}}()),q.wk&&function(){w||(/loaded|complete/.test(r.readyState)?I():setTimeout(arguments.callee,0))}(),Ba(I)))})();(function(){q.ie&&q.win&&s.attachEvent("onunload",function(){for(var f=U.length,j=0;j<f;j++)U[j][0].detachEvent(U[j][1],U[j][2]);f=aa.length;for(j=0;j<f;j++)Ca(aa[j]);for(var k in q)q[k]=
null;q=null;for(var p in n)n[p]=null;n=null})})();return{registerObject:function(f,j,k,p){if(q.w3&&f&&j){var l={};l.id=f;l.swfVersion=j;l.expressInstall=k;l.callbackFn=p;K[K.length]=l;$(f,false)}else p&&p({success:false,id:f})},getObjectById:function(f){if(q.w3)return ca(f)},embedSWF:function(f,j,k,p,l,n,r,s,y,v){var w={success:false,id:j};q.w3&&!(q.wk&&q.wk<312)&&f&&j&&k&&p&&l?($(j,false),la(function(){k+="";p+="";var c={};if(y&&typeof y===J)for(var q in y)c[q]=y[q];c.data=f;c.width=k;c.height=p;
q={};if(s&&typeof s===J)for(var x in s)q[x]=s[x];if(r&&typeof r===J)for(var B in r)typeof q.flashvars!=u?q.flashvars+="&"+B+"="+r[B]:q.flashvars=B+"="+r[B];if(Z(l))x=oa(c,q,j),c.id==j&&$(j,true),w.success=true,w.ref=x;else if(n&&Y()){c.data=n;D(c,q,j,v);return}else $(j,true);v&&v(w)})):v&&v(w)},switchOffAutoHideShow:function(){Ia=false},ua:q,getFlashPlayerVersion:function(){return{major:q.pv[0],minor:q.pv[1],release:q.pv[2]}},hasFlashPlayerVersion:Z,createSWF:function(f,j,k){if(q.w3)return oa(f,j,
k)},showExpressInstall:function(f,j,k,n){q.w3&&Y()&&D(f,j,k,n)},removeSWF:function(f){q.w3&&Ca(f)},createCSS:function(f,j,k,n){q.w3&&x(f,j,k,n)},addDomLoadEvent:la,addLoadEvent:Ba,getQueryParamValue:function(f){var j=r.location.search||r.location.hash;if(j){/\?/.test(j)&&(j=j.split("?")[1]);if(f==null)return Ea(j);for(var j=j.split("&"),k=0;k<j.length;k++)if(j[k].substring(0,j[k].indexOf("="))==f)return Ea(j[k].substring(j[k].indexOf("=")+1))}return""},expressInstallCallback:function(){if(V){var f=
L(Fa);if(f&&N){f.parentNode.replaceChild(N,f);if(ta&&($(ta,true),q.ie&&q.win))N.style.display="block";va&&va(Pa)}V=false}}}}();(function la(){s.as_widget_manager&&typeof s.as_widget_manager.add_library=="function"?s.as_widget_manager.add_library("swfobject",n):setTimeout(la,100)})()})(window);
(function () {
    "use strict";
    var players_html5 = {};
    var wm = window.as_widget_manager,
        qs_params = (function(elem, params) {
            function add(param) { params[param.shift().replace("?", "")] = decodeURIComponent(param.join("=")); }
            while (elem.length) { add(elem.pop().split("=")); }
            return params;
        }(String(window.location.search || "").split("&amp").join("&").split("&"), {})),
        debug = qs_params.debug,
        module_id = "init.js";

    function log(msg, color) {
        if (!debug) { return; }
        color = color || "red";
        msg = module_id + ": " + msg;
        console.log("%c" + msg, "color:" + color + ";font-weight:bold;");
    }

    function render_html_player(iframe_id, src, params) {
        var $ = wm.get_library("jquery"),
            iframe = [
            '<iframe id= "' + iframe_id + '"',
            'src="' + src + '"',
            'height="' + params.height + '"',
            'width="' + params.width + '"',
            'frameborder="0"',
            'scrolling="no"',
            'style="',
            'border:none;',
            'overflow:hidden;',
            'width:' + params.width + 'px;',
            'height:' + params.height + 'px;"',
            'allowfullscreen',
            '></iframe>',
        ].join(" ");
        iframe = $("#" + iframe_id).replaceWith(iframe).get(0);
        return function () { return $("#" + iframe_id).get(0); };
    }

    function render_html5_player(id, params) {
        if(typeof players_html5[id] != "undefined") {
            return;
        }
        players_html5[id] = true;
        var div = document.getElementById(id),
            script = document.createElement("script"),
            page = '/player.php?embed=js&',
            api = this.API,
            player_app_id = null;
        function getSrc() {
            var qs = [],
                options = {
                width: "w",
                height: "h",
                "de-width": "w",
                "de-height": "h",
                projectUUID: "p",
                program_uuid: "de_program_uuid",
                video_uuid: "de_program_uuid",
                html5_player_id: "player_uuid",
                autoPlay: "autoPlay",
                assetUUID: "aid",
                assetid:"aid",
                asset_uuid:"aid",
                embed_uuid:"emd"
            },
            p,html_properties,embedType;
            embedType = "0";
            if(params.hasOwnProperty('embedType')) {
                embedType = params["embedType"];
            }
            params.program_uuid = params.program_uuid || params.video_uuid;
            delete params.video_uuid;
	    // The project uuid was being removed here, it is needed for program_uuid to work, please leave it in

            if(!(typeof params['embed_uuid'] == 'undefined' && typeof params['assetUUID'] == 'undefined' && typeof params['aid'] == 'undefined' &&  typeof params['assetid'] == 'undefined' && typeof params['asset_uuid'] == 'undefined')) {
                delete options['autoPlay'];
            }

            for (p in params) {
                if (params.hasOwnProperty(p)) {
                    if (options.hasOwnProperty(p)) {

                        if(options[p]=="aid") {
                            page = '/singleAssetPlayer.php?embed=js&api='+api+"&";
                            if(embedType == "1" && typeof params['de-delivery-type'] == 'undefined') {
                                page = page+"&de-delivery-type=Akamai HD&";
                            }
                        } else if(options[p]=="embed_uuid") {
                            page = '/singleAssetPlayer.php?embed=js&api='+api+"&";

                        }

                        if(typeof params[p] != 'undefined') {
                            if(params[p]!=null) {
                                qs.push(options[p] + '=' + params[p]);
                            }
                        }
                    } else if(p == "html5_player_id_properties" && params[p]!=null && embedType!="1") {
                            for (html_properties in params[p]) {
                                if(!params.hasOwnProperty(html_properties)) {
                                    qs.push(html_properties + '=' + params[p][html_properties]);
                                }
                            }
                    } else if (p.indexOf("de-") === 0) {
                        if(p == 'de-appid') {
                            player_app_id = params[p];
                        }
                        qs.push(p + '=' + params[p]);
                    }
                }
            }
            return params.serviceBase + page + qs.join("&");
        }
        script.src = getSrc();
        script.src += '&targetId='+id;
        
        div.appendChild(script);
        
        console.log('um');

       if(player_app_id !== null) {
            var retries = 5;
    	    console.log("er...");
    	    try {
                    if(typeof window.player_manager !== 'undefined' && typeof window.player_manager.playerInstances !== 'undefined' ){
                            if(window.player_manager.playerInstances[player_app_id] !== undefined) {
                                return window.player_manager.playerInstances[player_app_id];
                            }
                    }
            } catch(ignore) {
                console.log(ignore);
            }
        }


        
        return function () { return false; };
    }

    function testHTML(force_HTML) {
        return (force_HTML) ? document.createElement('video').canPlayType('video/mp4') : false;
    }

    function render_flash_player(id, params, force_HTML) {
        var swfobject = wm.get_library("swfobject"),
            $ = wm.get_library("jquery"),
            div = $("#" + id).empty();
        $('<div id="' + params.playerDivID + '"></div>')
                .appendTo(div)
                .css({
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0
                });
        if (testHTML(force_HTML)) { return params.callback({success: false}); }
        swfobject.switchOffAutoHideShow();
        swfobject.embedSWF(params.swfURL, params.playerDivID, params.width, params.height, params.version, params.EXPRESS_INSTALL, params.flashvars, params.params, params.attributes, params.callback);
        return function () { return swfobject.getObjectById(params.playerDivID); };
    }

    function discover_elements(className, callback) {
        var $ = wm.get_library("jquery");
        $(function () {
            var elements = {};
            $("." + className).each(function (i, e) {
                var data = {};
                $.each(e.attributes, function (n, a) {
                    if(a.name) {
                        if ( !(a.name.indexOf("de-") === 0  || a.name=="embed-type") ) {
                            data[a.name.replace(/-/g, "_")] = a.value;
                        } else {
                            data[a.name] = a.value;
                        }
                    }
                });
                elements[e.id] = data;
            });
            callback(elements);
        });
    }

    wm.init({
        render_flash_player: render_flash_player,
        render_html_player: render_html_player,
        render_html5_player: render_html5_player,
        discover_elements: discover_elements
    });
}());
(function (as_widget_manager) {
    "use strict";
    var qs_params = (function(elem, params) {
            function add(param) { params[param.shift().replace("?", "")] = decodeURIComponent(param.join("=")); }
            while (elem.length) { add(elem.pop().split("=")); }
            return params;
        }(String(window.location.search || "").split("&amp").join("&").split("&"), {})),
        debug = qs_params.debug,
        module_id = "exe.js";

    function log(msg, color) {
        if (!debug) { return; }
        color = color || "purple";
        msg = module_id + ": " + msg;
        console.log("%c" + msg, "color:" + color + ";font-weight:bold;");
    }
    as_widget_manager.poll_dom("as_video_player", function (elements) {
        var id, my_player;
        for (id in elements) {
            if (elements.hasOwnProperty(id)) {
                as_widget_manager.addEventListener("PLAYER_CREATED", function createPlayer(event) {
                    if (event.payload.id === id) {
                        as_widget_manager.removeEventListener("PLAYER_CREATED", createPlayer);
                        my_player = event.payload;
                        my_player.render();
                    }
                });
                as_widget_manager.create_player(id, elements[id]);
            }
        }
    });
}(window.as_widget_manager));
