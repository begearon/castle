function submitAvailability() {
    $("#destinationResults").find("form").trigger("submit")
}
$(function() {
    function a(a) {
        d.parent().addClass("loadingLayer"), a.push({
            name: "areaId",
            value: d.data("area-id")
        }), $.post(Routing.generate("rc_destination_results." + settingsLocalization.sLanguageMin), a, function(a) {
            200 === a.status && (d.html(a.html), b(), initAndAjax(), d.parent().removeClass("loadingLayer")), 302 === a.status && window.location.replace(a.redirect)
        })
    }

    function b() {
        d.find("form").submit(function() {
            var b = $(this).serializeArray();
            return b.push({
                name: "page",
                value: d.data("page")
            }), b.push({
                name: "submit",
                value: !0
            }), a(b), !1
        })
    }
    var c = $("body"),
        d = $("#destinationResults");
    c.on("click", "#destPagination a", function(a) {
        a.preventDefault(), d.data("page", $(this).data("id")), d.find("form").trigger("submit")
    }), $("document").ready(function() {
        b(), a([{
            name: "page",
            value: d.data("page")
        }]);
        var c = $(".loadingPageLoader"),
            e = $(window),
            f = c.offset(),
            g = $(".mapWrapper").height();
        e.scroll(function() {
            e.scrollTop() > f.top ? c.stop().animate({
                top: e.scrollTop() - f.top + g
            }) : c.stop().animate({
                top: g
            })
        })
    })
});