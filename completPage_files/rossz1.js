var TAB = 9,
    SHIFT = 16,
    CTRL = 17,
    ALT = 18,
    MAJ = 20,
    ARROW_LEFT = 37,
    ARROW_UP = 38,
    ARROW_RIGHT = 39,
    ARROW_DOWN = 40,
    ENTER = 13,
    ESCAPE = 27,
    VERR_NUM = 144,
    ALT_GR = 225,
    enableGoogle = !0,
    $body = $("body");
if ($(document).ready(function() {
        hinclude.registerCallback("render-searchengine", function(a, b, c) {
            initAndAjax(), $(window).trigger("scroll"), bIsPhone || $body.hasClass("searchResults") && $("header.header").addClass("fastTrack-is-open")
        }), hinclude.registerCallback("footer-dock", function(a, b, c) {
            socialCount()
        })
    }), $body.on("submit", "[role=ftack-form]", function(a) {
        var b = ($(this), $("[data-action=category]").val()),
            c = ($("[data-action=search-input]").val(), $("html")[0].lang);
        if (c = c.split("-"), c = c[0], "hotel" == b) {
            $("[data-ftrack-tracker=arrivee]").val(), $("[data-ftrack-tracker=depart]").val(), $("[data-ftrack-tracker=chambres]").val()
        }
    }), bIsPhone && $("[data-action=infinite-load]").length) {
    var maxCall = 3,
        button = $("[data-action=infinite-load]");
    button.data("triggered", !1), $(window).on("scroll", function(a) {
        var b = $(window).scrollTop(),
            c = button.offset().top,
            d = $(window).height(),
            e = button.data("page");
        b >= c - d && e <= maxCall && !1 === button.data("triggered") && (button.data("triggered", !0), button.trigger("click"), button.data("page", button.data("page") + 1))
    }), button.on("click", function() {
        var a = $("[data-action=input-page]"),
            b = a.closest(".formFilters");
        a.val(button.data("page")), b.trigger("submit")
    })
}
$(function() {
    function a(a) {
        var b = $("div[data-action=search-container]"),
            c = b.find("*[data-action=category]"),
            d = a.attr("data-type"),
            e = a.attr("data-value"),
            f = $("*[data-action=search-picker]");
        if (void 0 !== c.val() && c.val() != d && (c.find("option[value=" + d + "]").attr("selected", "selected"), c.trigger("change"), "experience" === d)) {
            var g = b.find("*[data-action=experience]"),
                h = b.find("input[data-action=search-input]");
            g.val(e), g.trigger("change"), h.val()
        }
        f.attr("data-id-entity", ""), f.data("id-entity", "")
    }

    function b(a) {
        var b = a.data("display"),
            c = a.data("value"),
            d = a.data("type"),
            f = a.data("parent"),
            g = $("div[data-action=search-results]"),
            h = g.find("ul.results"),
            i = $("input[data-action=search-input]"),
            j = $("*[data-action=search-picker]"),
            k = i.attr("data-query");
        h.html(""), i.val(b), i.attr("data-value", c), i.data("value", c), "hotel" == d ? (j.attr("data-id-entity", c), j.data("id-entity", c)) : (j.attr("data-id-entity", ""), j.data("id-entity", "")), $("input[data-action=search-type]").val(d), $("input[data-action=search-parent]").val(f), $("input[data-action=search-value]").val(c), socket.emit("add_log", "selected", b, {
            type: d,
            value: c,
            previous: k
        }), e = !0
    }
    "undefined" != typeof socket && socket.emit("initiate");
    var c, d, e = ($body.attr("lang"), !1),
        f = !1,
        g = $("input[data-action=search-input]").val(),
        h = function() {
            var a = $("input[data-action=search-input]"),
                b = a.val(),
                d = $("div[data-action=search-results]"),
                h = d.closest("[data-action=global-results]");
            if (f) return !1;
            if (a.attr("data-query", b), a.attr("data-value", ""), g != b && !e) {
                g = b;
                var i = a.closest("*[data-action=search-container]"),
                    j = i.find("*[data-action=category] option:selected").attr("value");
                if (b.length < 3) {
                    return d.find("ul.results").html(""), h.removeClass("is-opened"), !1
                }
                a.addClass("loadingFT"), clearTimeout(c);
                var k = $("[data-action=search-container]").attr("full-locale");
                c = setTimeout(function() {
                    "undefined" != typeof socket && socket.emit("autocomplete", b, k, j)
                }, 500)
            }
            e && (e = !1, g = a.val())
        };
    $body.on("focus", "input[data-action=search-input]", function(a) {
        var b = $(this).attr("placeholder");
        $(this).attr("placeholder", ""), $(this).val() == b && $(this).attr("value", ""), d = setInterval(h, 500)
    }), $body.on("keyup", "input[data-action=search-input]", function(a) {
        var b = $(this),
            c = a.keyCode,
            d = $("div[data-action=search-results]"),
            e = d.closest("[data-action=global-results]");
        if (f = !1, c != ESCAPE && c != TAB || e.removeClass("is-opened"), c == ARROW_DOWN || c == ARROW_UP) {
            a.preventDefault(), f = !0;
            var g = d.find("a.focus").closest("li");
            g.length ? (expected = c == ARROW_DOWN ? g.next("li") : g.prev("li"), g.find("a").removeClass("focus"), g = expected, expected.find("a").addClass("focus")) : (g = c == ARROW_DOWN ? d.find("li").first() : d.find("li").last(), g.find("a").addClass("focus")), g.length ? b.val(g.find("a").data("display")) : b.val(b.attr("data-query"))
        }
    }), $body.on("keydown", "input[data-action=search-input]", function(c) {
        loadGmapScript();
        var d = $("div[data-action=search-results]"),
            e = d.closest("[data-action=global-results]"),
            f = c.keyCode;
        if (e.find(".formError").remove(), f == ENTER) {
            var g = d.find("a.focus"),
                h = g.attr("data-display");
            $("input[data-action=search-input]");
            if (void 0 !== h) return c.preventDefault(), c.stopPropagation(), a(g), b(g), !1
        }
    }), $body.on("mouseenter", "[data-action=search-results] a", function() {
        var a = $("div[data-action=search-results]"),
            b = $("input[data-action=search-input]");
        f = !0, a.find("a.focus").removeClass("focus"), b.val($(this).data("display"))
    }), $body.on("mouseleave", "[data-action=search-results]", function() {
        var a = $("div[data-action=search-results]"),
            b = $("input[data-action=search-input]"),
            c = b.attr("data-query");
        a.find("a.focus").removeClass("focus"), e || b.val(c), f = !1
    }), $body.on("mousedown", "[data-action=search-results] a", function() {
        if ($(this).hasClass("seeAll")) return !0;
        var c = $(this),
            d = $("[data-action=global-results]");
        return a(c), b(c), d.removeClass("is-opened"), !1
    }), $body.on("blur", "input[data-action=search-input]", function() {
        setTimeout(function() {
            var a = $("div[data-action=search-results]"),
                b = a.closest("[data-action=global-results]");
            clearInterval(d), b.removeClass("is-opened")
        }, 500);
        var a = $("[data-action=category]"),
            b = a.find("option:selected").data("placeholder");
        $(this).attr("placeholder", b)
    }), $body.on("submit", "[data-action=search-container] form", function() {
        var a = $(this).closest("[data-action=search-container]"),
            b = a.find("[data-action=search-input]"),
            c = a.find("[data-action=search-results]"),
            d = a.find("[data-action=category]"),
            e = $('<div class="formError"></div>'),
            f = b.closest(".formField");
        if (f.find(".formError").remove(), "experience" == d.val()) return !0;
        if (b.val().length >= 3 && c.find("li a").length > 0 && "" == b.data("value")) {
            var g = a.find("[data-action=search-type]");
            b.attr("data-value", b.val()), b.data("value", b.val()), g.val("query")
        }
        if (b.val().length >= 3 && "" != b.data("value")) return !0;
        var h = b.val().length < 3 ? f.data("min-message") : f.data("no-results-message");
        return f.append(e.html(h)), !1
    }), $body.on("change", "[data-action=category]", function() {
        var a = $(this),
            b = a.closest("[data-action=search-container]"),
            c = b.find("input[data-action=search-input]"),
            d = a.find("option:selected").data("placeholder"),
            e = $("*[data-action=search-picker]");
        c.attr("data-value", ""), c.data("value", ""), c.val(""), $("input[data-action=search-type]").val(a.val()), $("input[data-action=search-value]").val(""), $("input[data-action=search-parent]").val(""), e.attr("data-id-entity", ""), e.data("id-entity", ""), c.attr("placeholder", d), $("[placeholder]").blur()
    }), "undefined" != typeof socket && socket.on("autocomplete_result", function(a, b, c) {
        function d() {
            new $.Deferred
        }

        function e(a) {
            var c = new $.Deferred,
                d = {
                    input: b,
                    types: [a],
                    language: l
                };
            return r.getPlacePredictions(d, function(a, b) {
                for (var d in a) {
                    var e = a[d];
                    q.push(f(e))
                }
                c.resolve()
            }), c.promise()
        }

        function f(a) {
            var b = [],
                c = new $.Deferred,
                d = {
                    address: a.description,
                    language: l
                };
            return b.ChIJB1tG4lmvC0gRwpkq0DSyR1Q = "Le chĂ¢teau de berne, dans le calvados // geocodes", s.geocode(d, function(a, d) {
                if (a && a.length) {
                    var e = a.shift(),
                        f = {
                            value: String(e.geometry.viewport.getNorthEast().toUrlValue() + "|" + e.geometry.viewport.getSouthWest().toUrlValue()),
                            label: e.formatted_address,
                            type: "destination"
                        };
                    void 0 === n[e.place_id] && void 0 === b[e.place_id] && (m.push(f), n[e.place_id] = 1)
                }
                c.resolve()
            }), c.promise()
        }

        function g(c) {
            j.html("");
            var d = [],
                e = [],
                f = $("input[data-action=search-input]");
            if (m = m.slice(0, 3), $.each(a, function(a) {
                    var b = this;
                    b.type == c ? d.push(b) : e.push(b)
                }), a = m.concat(e), a = d.concat(a), a = a.concat(o), 0 == a.length) {
                var g = $("<li><span></span></li>");
                g.find("span").html(h.data("empty")), j.append(g)
            } else {
                var l = {};
                $.each(a, function() {
                    var a = this,
                        b = k.clone(),
                        c = b.find("a"),
                        d = a.type,
                        e = a.location,
                        f = a.country ? " - " + a.country : "",
                        g = a.state ? " - " + a.state : "",
                        h = a.value;
                    if ("chef" !== d && "destination" !== d && "giftsProduct" !== d) {
                        var i = new google.maps.LatLng(e.lat, e.lon);
                        l[d] ? l[d].extend(i) : l[d] = new google.maps.LatLngBounds(i)
                    } else l[d] = h;
                    b.addClass(d), c.html(a.label), (a.city || g || f) && c.append('<br><span class="cGold fwBold">' + a.city + g + f + "</span>"), c.attr("data-display", a.label), c.attr("data-value", h), c.attr("data-parent", a.parent), c.attr("data-type", d), j.append(b)
                }), $.each(l, function(a, c) {
                    var d = $('<a href="#_"></a>');
                    d.addClass("seeAll"), d.attr("data-display", f.attr("data-query")), d.html(i.data("all-" + a)), "chef" === a ? d.attr("href", Routing.generate("rc_app_search_search_chef" + settingsLocalization.sLanguageMin, {
                        chef: b
                    })) : "destination" === a ? d.attr("href", Routing.generate("rc_app_search_destination." + settingsLocalization.sLanguageMin, {
                        destination: b,
                        isArea: 0
                    })) : "giftsProduct" === a ? d.attr("href", Routing.generate("rc_gift_product." + settingsLocalization.sLanguageMin, {
                        product: c
                    })) : d.click(function() {
                        var a = $("[data-action=search-container]"),
                            b = a.find("[data-action=search-type]"),
                            d = a.find("[data-action=search-input]"),
                            e = a.find("[data-action=search-value]"),
                            f = String(c.getNorthEast().toUrlValue() + "|" + c.getSouthWest().toUrlValue());
                        d.attr("data-value", dest), d.data("value", dest), b.val("destination"), e.val(f), $("[data-action=search-container] form").submit()
                    })
                })
            }
            f.removeClass("loadingFT");
            var n = i.find(".formError");
            return n && n.remove(), i.addClass("is-opened"), !0
        }
        var h = $("div[data-action=search-results]"),
            i = h.closest("[data-action=global-results]"),
            j = h.find("ul.results"),
            k = $('<li><a href="#_"></a></li>'),
            l = $body.attr("lang"),
            m = [],
            n = [],
            o = [],
            p = [d()],
            q = [];
        if (null != google && enableGoogle && void 0 !== google.maps && void 0 !== google.maps.places) {
            var r = new google.maps.places.AutocompleteService,
                s = new google.maps.Geocoder;
            if (void 0 === r || void 0 === s) return g(c);
            for (var t = ["(regions)", "geocode"], u = 0, v = t.length; u < v; u++) p.push(e(t[u]))
        }
        null == google ? $(document).on("googleLoaded", function() {
            $.when.apply(null, p).then(function() {
                $.when.apply(null, q).then(function() {
                    g(c)
                })
            })
        }) : $.when.apply(null, p).then(function() {
            $.when.apply(null, q).then(function() {
                g(c)
            })
        })
    })
});