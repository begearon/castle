function checkAvailabilityHotel(a, b) {
    var c = $("div.sortBy span.active").data("sort"),
        d = $("div.tabMainContent.bookAStay").data("hotel-synxis-id"),
        e = $("div.viewBy span.active").data("view"),
        f = $("#propertyBooking-room").val(),
        g = $("#propertyBooking-pax").val(),
        h = $("#specific-rate").html(),
        i = $("#promotion-code").html();
    c || (c = "asc");
    var j = $("#shortname").text(),
        k = {
            arrivalDate: a,
            departureDate: b,
            synxisId: d,
            view: e,
            sort: c,
            roomNb: f,
            pax: g,
            specificRate: h,
            promotionCode: i,
            etablissement: {
                shortname: j
            }
        };
    $("#loadingPageContainer").css("display", "block"), $.ajax({
        url: Routing.generate("rc_etablissement_check_availability." + settingsLocalization.sLanguageMin),
        type: "POST",
        data: k,
        cache: !1,
        success: function(a) {
            a.success && ($("div.tabMainContent.bookAStay").html(a.content), initAndAjax(), a.noAvailability ? $("div.propertyListRoomsTools:visible").hide() : ($("div.propertyListRoomsTools:hidden").show(), "" != h && $("html, body").animate({
                scrollTop: $("#" + h).offset().top - 124
            }, 200)), $("#loadingPageContainer").css("display", "none"))
        }
    })
}

function checkAvailabilityHotelAside(a) {
    checkAvailabilityHotel(a.startDate, a.endDate)
}

function updateMaxCommission() {
    if ($(".commission-price").length) {
        var a = 0;
        if ($(".commission-price").each(function(b) {
                var c = parseInt($(this).text());
                c > a && (a = c)
            }), $("#header-max-commission").length) {
            $("#header-max-commission strong").text(a + "%");
            $(".innerHotelHeader .btobTagPriceAdvantage").show()
        }
    }
}

function scrollToOs() {
    ($("#specific-rate").length || $("#promotion-code").length) && (specificRateValue = $("#specific-rate").html(), promotionCodeValue = $("#promotion-code").html(), specificRateValue && $("#" + specificRateValue + ".propertyRate").length ? $("html, body").animate({
        scrollTop: $("#" + specificRateValue + ".propertyRate").offset().top - 130
    }, 200) : promotionCodeValue && $('.propertyRate[data-scroll-to="' + promotionCodeValue + '"]').length && $("html, body").animate({
        scrollTop: $('.propertyRate[data-scroll-to="' + promotionCodeValue + '"]').offset().top - 130
    }, 200), initAndAjax())
}
$(function() {
    $("body").find(".ctaLogin").attr("rel", "nofollow"), $("body").on("click", ".addFavorite", function() {
        var a = $(this),
            b = a.data("id");
        b && $.ajax({
            url: Routing.generate("rc_etablissement_favourite." + settingsLocalization.sLanguageMin, {
                id: b
            }),
            type: "GET",
            cache: !1,
            success: function(c) {
                var d = $("[data-action=input-favourite]");
                if ("added" == c.status) {
                    if (a.addClass("is-favorited"), d.length) {
                        var e = d.val();
                        e.match(b) || ("" == e ? d.val(b) : d.val(e + ";" + b))
                    }
                } else if ("removed" == c.status) {
                    if (a.removeClass("is-favorited"), d.length) {
                        var e = d.val();
                        e = e.replace(";" + b, ""), e = e.replace(b, ""), d.val(e)
                    }
                } else a.removeClass("is-favorited");
                $(".footerStickyNav #fav-count").html(c.length), 0 == c.length ? $(".footerStickyNav #fav-count").closest("a").prop("href", "#_") : $(".footerStickyNav #fav-count").closest("a").prop("href", Routing.generate("rc_account_favourites." + settingsLocalization.sLanguageMin))
            }
        })
    }), $("body").on("click", ".sortBy span:not(.active)", function(a) {
        $pbArrival = $(".propertyBookingAside .startDate"), $pbDep = $(".propertyBookingAside .endDate"), $("div.sortBy span").removeClass("active"), $(this).addClass("active"), checkAvailabilityHotel($pbArrival.val(), $pbDep.val())
    }), $("body").on("change", "#propertyBooking-room", function(a) {
        if ($(this).siblings(".dateField").find(".startEndDate").data({
                room: $(this).val()
            }), 4 == $(this).val()) return $("div.bookAStay div.blocInformation").show().nextAll().hide(), !1;
        $pbArrival = $(".propertyBookingAside .startDate"), $pbDep = $(".propertyBookingAside .endDate"), $pbArrival.val() && $pbDep.val() && checkAvailabilityHotel($pbArrival.val(), $pbDep.val())
    }), $("body").on("change", "#propertyBooking-pax", function(a) {
        $pbArrival = $(".propertyBookingAside .startDate"), $pbDep = $(".propertyBookingAside .endDate"), $(this).siblings(".dateField").find(".startEndDate").data({
            pax: $(this).val()
        }), $pbArrival.val() && $pbDep.val() && checkAvailabilityHotel($pbArrival.val(), $pbDep.val())
    }), $("body").on("click", ".btnReserve", function(a) {
        a.preventDefault();
        var b, c = $(this);
        $(this).closest(".propertyRoom").length ? b = $(this).closest(".propertyRoom") : $(this).closest(".propertyRate").length && (b = $(this).closest(".propertyRate"));
        for (var d = $(".tabMainContent"), e = $(b, d)[0].dataset, f = Object.entries(e), g = f.filter(function(a) {
                return a[0].indexOf("taxeInfoText") > -1
            }), h = f.filter(function(a) {
                return a[0].indexOf("taxeInfoAmount") > -1
            }), i = {}, j = 0, k = g.length; j < k; j++) {
            void 0 === i[g[j][1]] && (i[g[j][1]] = 0);
            var l = i[g[j][1]] + parseFloat(h[j][1]);
            i[g[j][1]] = l
        }
        var m = {
            amountAfterTax: b.data("amount-after-tax"),
            amountBeforeTax: b.data("amount-before-tax"),
            amountOfTaxe: b.data("amount-of-taxe"),
            amountOfFees: b.data("amount-of-fees"),
            amountOfDiscount: b.data("amount-of-discount"),
            amountCurrency: b.data("amount-currency"),
            startDate: b.data("start-date"),
            endDate: b.data("end-date"),
            synxisId: b.data("synxis-id"),
            roomCode: b.data("roomCode"),
            roomRate: b.data("roomRate"),
            currency: b.data("currency"),
            cancel: b.data("cancel"),
            payment: b.data("payment"),
            mode: b.data("mode"),
            promotionCode: b.data("promotion-code"),
            "absolute-deadline": b.data("absolute-deadline"),
            pax: b.data("pax"),
            commission: b.data("commission"),
            roomName: b.data("room-name"),
            roomTypePrice: b.data("room-rate-description"),
            arrayTaxes: JSON.stringify(i)
        };
        $.ajax({
            url: Routing.generate("reservation_add_item." + settingsLocalization.sLanguageMin),
            type: "POST",
            data: m,
            cache: !1,
            success: function(a) {
                if (a.success) {
                    $.colorbox.close(), "undefined" != typeof dataLayer && dataLayer.push({
                        event: "trackAddToCart",
                        cart_product_sku: b.data("synxis-id") + "-" + b.data("roomCode"),
                        cart_product_name: b.data("etablissement-name") + "|" + b.data("room-name"),
                        cart_product_category: b.data("area-label"),
                        cart_product_price: parseFloat(b.data("amount-after-tax")),
                        cart_product_quantity: b.data("nb-nights"),
                        cart_product_currency: b.data("currency")
                    });
                    var d = {
                            startDate: b.data("start-date"),
                            endDate: b.data("end-date"),
                            synxisId: b.data("synxis-id"),
                            roomCode: b.data("roomCode"),
                            ratePlanCode: b.data("roomRate"),
                            uniqueId: a.uniqueId,
                            referer: "hotel"
                        },
                        e = Routing.generate("reservation_add_service_popin." + settingsLocalization.sLanguageMin, d);
                    if ($("body").hasClass("hotel")) {
                        var f = $("[data-basket-count]");
                        if (f.length) {
                            var g = f.data("basket-count");
                            f.data("basket-count", g + 1), f.html(g + 1)
                        }
                        c.hasClass("displayAddServicePopin") ? ("undefined" != typeof dataLayer && dataLayer.push({
                            event: "service_view",
                            product_sku: b.data("synxis-id") + "-" + b.data("roomCode"),
                            product_name: b.data("etablissement-name") + "|" + b.data("room-name"),
                            product_category: b.data("area-label"),
                            product_price: parseFloat(b.data("amount-after-tax")),
                            product_currency: b.data("currency")
                        }), $.colorbox({
                            href: e,
                            onClosed: function(a) {
                                $("#dockBasketToolTip").addClass("is-opened")
                            }
                        })) : $("#dockBasketToolTip").addClass("is-opened")
                    } else c.hasClass("displayAddServicePopin") ? ("undefined" != typeof dataLayer && dataLayer.push({
                        event: "service_view",
                        product_sku: b.data("synxis-id") + "-" + b.data("roomCode"),
                        product_name: b.data("etablissement-name") + "|" + b.data("room-name"),
                        product_category: b.data("area-label"),
                        product_price: parseFloat(b.data("amount-after-tax")),
                        product_currency: b.data("currency")
                    }), $.colorbox({
                        href: e
                    })) : $("#dockBasketToolTip").addClass("is-opened");
                    var h = c.closest(".propertyRoomRatesContent"),
                        i = h.prev(),
                        j = i.data("number-of-units") - 1;
                    i.attr("data-number-of-units", j), 0 == j && (i.addClass("disabled"), h.remove())
                } else {
                    var k = $(".startEndDate .formError");
                    a.expired_session && k.length && (k.find(".sessionExpired").addClass("is-opened"), k.addClass("is-opened")), a.price_error && k.length && (k.find(".priceError").addClass("is-opened"), k.addClass("is-opened"))
                }
            }
        })
    }), $("body").on("click", ".btnReserveRoom", function(a) {
        for (var b = $(".slideItem.slick-active"), c = $("#popinSelectDates"), d = $(this), e = $(".slideItem.slick-active", c)[0].dataset, f = Object.entries(e), g = f.filter(function(a) {
                return a[0].indexOf("taxeInfoText") > -1
            }), h = f.filter(function(a) {
                return a[0].indexOf("taxeInfoAmount") > -1
            }), i = {}, j = 0, k = g.length; j < k; j++) {
            void 0 === i[g[j][1]] && (i[g[j][1]] = 0);
            var l = i[g[j][1]] + parseFloat(h[j][1]);
            i[g[j][1]] = l
        }
        var m = {
            amountAfterTax: b.data("amount-after-tax"),
            amountBeforeTax: b.data("amount-before-tax"),
            amountOfTaxe: b.data("amount-of-taxe"),
            amountOfFees: b.data("amount-of-fees"),
            amountOfDiscount: b.data("amount-of-discount"),
            amountCurrency: b.data("amount-currency"),
            startDate: b.data("start-date"),
            endDate: b.data("end-date"),
            synxisId: b.data("synxis-id"),
            roomCode: b.data("roomCode"),
            roomRate: b.data("roomRate"),
            currency: b.data("currency"),
            cancel: b.data("cancel"),
            payment: b.data("payment"),
            mode: b.data("mode"),
            promotionCode: b.data("promotion-code"),
            "absolute-deadline": b.data("absolute-deadline"),
            commission: b.data("commission"),
            roomName: b.data("room-name"),
            roomTypePrice: b.data("room-rate-description"),
            arrayTaxes: JSON.stringify(i)
        };
        $.ajax({
            url: Routing.generate("reservation_add_item." + settingsLocalization.sLanguageMin),
            type: "POST",
            data: m,
            cache: !1,
            success: function(a) {
                if (a.success) {
                    var c = $("[data-basket-count]");
                    if (c.length) {
                        var e = c.data("basket-count");
                        c.data("basket-count", e + 1), c.html(e + 1)
                    }
                    "undefined" != typeof dataLayer && dataLayer.push({
                        event: "trackAddToCart",
                        cart_product_sku: b.data("synxis-id") + "-" + b.data("roomCode"),
                        cart_product_name: b.data("etablissement-name") + "|" + b.data("room-name"),
                        cart_product_category: b.data("area-label"),
                        cart_product_price: parseFloat(b.data("amount-after-tax")),
                        cart_product_quantity: b.data("nb-nights"),
                        cart_product_currency: b.data("currency")
                    });
                    var f = {
                        startDate: b.data("start-date"),
                        endDate: b.data("end-date"),
                        synxisId: b.data("synxis-id"),
                        roomCode: b.data("roomCode"),
                        ratePlanCode: b.data("roomRate"),
                        uniqueId: a.uniqueId,
                        referer: "hotel"
                    };
                    "RelaisChateauxApp" !== window.navigator.userAgent || d.hasClass("displayAddServicePopin") || (window.location.href = Routing.generate("reservation_basket." + settingsLocalization.sLanguageMin)), d.hasClass("displayAddServicePopin") ? ("undefined" != typeof dataLayer && dataLayer.push({
                        event: "service_view",
                        product_sku: b.data("synxis-id") + "-" + b.data("roomCode"),
                        product_name: b.data("etablissement-name") + "|" + b.data("room-name"),
                        product_category: b.data("area-label"),
                        product_price: parseFloat(b.data("amount-after-tax")),
                        product_currency: b.data("currency")
                    }), $.colorbox({
                        href: Routing.generate("reservation_add_service_popin." + settingsLocalization.sLanguageMin, f),
                        onComplete: function() {
                            if ($("#popinSelectAddOn").length && bIsPhone) {
                                var a = $("#popinSelectAddOn").find(".btnsSwitchMobile");
                                $("#cboxLoadedContent").scroll(function() {
                                    setTimeout(function() {
                                        $("#cboxLoadedContent").scrollTop() > 160 ? a.addClass("isFixed") : a.removeClass("isFixed")
                                    }, 500)
                                })
                            }
                            initAndAjax()
                        },
                        onClosed: function(a) {
                            $("#dockBasketToolTip").addClass("is-opened")
                        }
                    })) : ($.colorbox.close(), $("#dockBasketToolTip").addClass("is-opened"))
                } else {
                    var g = $(".startEndDatepickerWrapper .formError");
                    a.expired_session && g.length && (g.find(".sessionExpired").addClass("is-opened"), g.addClass("is-opened")), a.price_error && g.length && (g.find(".priceError").addClass("is-opened"), g.addClass("is-opened"))
                }
            }
        })
    }), $(".jsSecondNav").on("click", "a", function() {
        if ("undefined" != typeof dataLayer)
            if ("isProperty" !== $(this).attr("data-id")) dataLayer = dataLayer.filter(function(a) {
                return "property" !== a.page_type
            });
            else {
                var a = dataLayer.filter(function(a) {
                    return "property" === a.page_type
                });
                if (0 >= a.length) {
                    var b = $("#tabProperty").data("gtm-datalayer");
                    dataLayer.push(b[0])
                }
            }
    }), $("body").on("click", 'a[role="track-room-dispo"]', function() {
        if ("undefined" != typeof dataLayer) {
            var a = $(this).data("gtm-datalayer");
            dataLayer.push(a[0])
        }
    }), $("body").on("click", ".popinSelectDates .btnClear", function() {
        $("#wrapperRates").html(""), $(".popinSelectDates").parent().find(".propertyRoomCTA").remove()
    }), manageAddToCart()
});