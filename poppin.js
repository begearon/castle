function checkAvailabilityRoomFormSubmit() {
    var a = $("#checkAvailabilityRoomForm"),
        b = a.find(".dateField.js-done"),
        c = a.find("input[name='startDate']").val(),
        d = a.find("input[name='endDate']").val(),
        e = a.find("input[name='synxisId']").val(),
        f = a.find("input[name='roomCode']").val(),
        g = 2,
        h = 1;
    void 0 != $("#propertyBooking-pax").val() && (g = $("#propertyBooking-pax").val()), void 0 != $("#propertyBooking-room").val() && (h = $("#propertyBooking-room").val()), b.addClass("loadingLayer"), setTimeout(function() {
        $.post(Routing.generate("rc_maintenance_popin." + settingsLocalization.sLanguageMin), [], function() {
            $.ajax({
                url: a.attr("action"),
                type: "POST",
                data: {
                    startDate: c,
                    endDate: d,
                    synxisId: e,
                    roomCode: f,
                    pax: g,
                    room: h
                },
                cache: !1,
                async: !1,
                success: function(a) {
                    if (a.success) {
                        var b = $("#popinSelectDates");
                        $("#popinSelectDates div.formError:visible").hide(), $("div#wrapperRates").html(a.content), initAndAjax();
                        var c = $(".slideItem.slick-active"),
                            d = c.data("price");
                        if (void 0 !== d) {
                            var e = $(".propertyRoomCTA .priceTag");
                            e.css("display", "inline-block"), 0 >= d && e.css("display", "none"), $(".propertyRoomCTA .price", b).html(formatPrice(d)), $(".propertyRoomCTA .js-detail-room", b).html(c.data("detail-room")), $(".propertyRoomCTA .js-type-room", b).html(c.data("room-name")), $(".propertyRoomCTA .js-type-price", b).html(c.data("room-rate-description"));
                            for (var f = $(".slideItem.slick-active", b)[0].dataset, g = Object.entries(f), h = g.filter(function(a) {
                                    return a[0].indexOf("taxeInfoText") > -1
                                }), i = g.filter(function(a) {
                                    return a[0].indexOf("taxeInfoAmount") > -1
                                }), j = [], k = 0, l = h.length; k < l; k++) {
                                void 0 === j[h[k][1]] && (j[h[k][1]] = 0);
                                var m = j[h[k][1]] + parseFloat(i[k][1]);
                                j[h[k][1]] = m
                            }
                            if (h.length > 0) {
                                var n, o;
                                incrementValue = 0, $(".trTaxesTab").remove();
                                var p = document.getElementById("addtableTaxe");
                                for (var q in j) j.hasOwnProperty(q) && (n = document.createElement("tr"), n.classList.add("trTaxesTab"), o = n.insertCell(0), o.innerHTML = q, o = n.insertCell(1), o.classList.add("value-table-price"), o.innerHTML = $(".slideItem.slick-active").data("currency-symbol") + " " + j[q].toFixed(2), p.parentNode.insertBefore(n, p.nextSibling))
                            } else $("div.propertyRoomCTA .js-detail-fee-taxe", b).html(c.data("detail-tax-fee"));
                            var r = $(".slideItem.slick-active", b).data("detail-discount"),
                                s = $("div.propertyRoomCTA .js-detail-discount", b);
                            r ? (s.parent().css("display", "table-row"), s.html(r)) : s.parent().css("display", "none"), $("div.propertyRoomCTA .js-detail-fee-taxe", b).html(c.data("detail-tax-fee")), $("div.propertyRoomCTA .js-detail-total", b).html(c.data("detail-total")), $(".js-detail-commission", b).length && c.data("commission") && $("div.propertyRoomCTA .js-detail-commission", b).html(c.data("commission") + "%")
                        }!bIsPhone && $(window).width() > 1024 && $("#wrapperRates").find(".propertyRoomCTA").length && ($("#cboxContent").addClass("cboxSelectDates"), $("#cboxLoadedContent").children(".propertyRoomCTA").length && $("#cboxLoadedContent").children(".propertyRoomCTA").remove(), $("#wrapperRates").find(".propertyRoomCTA").appendTo("#cboxLoadedContent"))
                    } else $("#popinSelectDates div.formError").show(), $("div#wrapperRates").html("")
                },
                error: function() {
                    $.colorbox({
                        href: Routing.generate("rc_timeout_popin." + settingsLocalization.sLanguageMin)
                    })
                }
            }).always(function() {
                b.removeClass("loadingLayer")
            })
        }).fail(function() {
            b.removeClass("loadingLayer"), $.colorbox({
                href: Routing.generate("rc_maintenance_popin." + settingsLocalization.sLanguageMin)
            })
        })
    }, 0)
}

function checkAvailabilityRoomForm() {
    var a = $("#checkAvailabilityForm"),
        b = a.serialize(),
        c = a.find(".dateField.js-done"),
        d = $("#wrapperRoomRates");
    c.addClass("loadingLayer"), d.addClass("loadingLayer"), setTimeout(function() {
        $.post(Routing.generate("rc_maintenance_popin." + settingsLocalization.sLanguageMin), [], function() {
            $.ajax({
                url: a.attr("action"),
                type: "POST",
                data: b,
                cache: !1,
                async: !1,
                success: function(a) {
                    a.success && ($("div#wrapperRoomRates").html(a.content), initAndAjax())
                },
                error: function() {
                    $.colorbox({
                        href: Routing.generate("rc_timeout_popin." + settingsLocalization.sLanguageMin)
                    })
                }
            }).done(function() {
                c.removeClass("loadingLayer"), d.removeClass("loadingLayer")
            })
        }).fail(function() {
            c.removeClass("loadingLayer"), d.removeClass("loadingLayer"), $.colorbox({
                href: Routing.generate("rc_maintenance_popin." + settingsLocalization.sLanguageMin)
            })
        })
    }, 1)
}
$(document).ready(function() {
    $("body").on("click", "a.disabled", function(a) {
        return a.stopImmediatePropagation(), a.preventDefault(), !1
    }), $("body").on("click", ".roomRates", function(a) {
        for (var b = $(this).closest(".propertyRate"), c = $(this).closest("#popinAddRoom"), d = $(b, c)[0].dataset, e = Object.entries(d), f = e.filter(function(a) {
                return a[0].indexOf("taxeInfoText") > -1
            }), g = e.filter(function(a) {
                return a[0].indexOf("taxeInfoAmount") > -1
            }), h = {}, i = 0, j = f.length; i < j; i++) {
            void 0 === h[f[i][1]] && (h[f[i][1]] = 0);
            var k = h[f[i][1]] + parseFloat(g[i][1]);
            h[f[i][1]] = k
        }
        var l = {
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
            room: c.data("room"),
            mode: b.data("mode"),
            idQuote: b.data("id-quote"),
            promotionCode: b.data("promotion-code"),
            "absolute-deadline": b.data("absolute-deadline"),
            commission: b.data("commission"),
            roomName: b.data("room-name"),
            roomTypePrice: b.data("room-rate-description"),
            arrayTaxes: JSON.stringify(h)
        };
        $.ajax({
            url: Routing.generate("reservation_add_item." + settingsLocalization.sLanguageMin),
            type: "POST",
            data: l,
            cache: !1,
            success: function(a) {
                if (a.success) location.reload();
                else {
                    var b = $(".startEndDatepickerWrapper .formError");
                    a.expired_session && b.length && (b.find(".sessionExpired").addClass("is-opened"), b.addClass("is-opened"), $("#cboxLoadedContent").animate({
                        scrollTop: 0
                    }, 500)), a.price_error && b.length && (b.find(".priceError").addClass("is-opened"), b.addClass("is-opened"), $("#cboxLoadedContent").animate({
                        scrollTop: 0
                    }, 500))
                }
            }
        })
    }), $("body").on("click", "input.checkAddon", function() {
        $("input.checkAddon:checked").length ? $(".btnAddSelection").removeClass("disabled") : $(".btnAddSelection").addClass("disabled")
    }), $("body").on("change", "select.dateService[data-only=true]", function() {
        var a = $(this).closest(".addOnServiceItem"),
            b = $(this).find("option:selected"),
            c = b.data("price");
        a.find(".priceTag .tag .price").html(c)
    }), $("body").on("change", "#popinSelectAddOn .selectQuantity", function(a) {
        var b = $(this).closest(".addOnServiceItem"),
            c = b.find("div.tag .price"),
            d = 0;
        b.find(".selectQuantity").each(function() {
            d += $(this).val() * $(this).closest(".formField").find("strong").data("price")
        }), c.html(formatPrice(d)), c.data("price", d)
    }), $("body").on("click", "#popinSelectAddOn .btnAddSelection", function(a) {
        var b = $(this),
            c = ($(this), []);
        $("#popinSelectAddOn .addOnServiceItem").each(function() {
            if ($(this).find(".priceTag .checkAddon:checked").length) {
                var a = $("div.tag .price", $(this)).data("price");
                if (0 != a || 1 == $("div.tag .price", $(this)).data("free")) {
                    $(".dateService", $(this)).length && $(this).data("start-date", $(".dateService", $(this)).val()), $(".selectAdultQuantity", $(this)).length && $(this).data("adult-quantity", $(".selectAdultQuantity", $(this)).val()), $(".selectChildrenQuantity", $(this)).length && $(this).data("children-quantity", $(".selectChildrenQuantity", $(this)).val()), $(".selectSeniorQuantity", $(this)).length && $(this).data("senior-quantity", $(".selectSeniorQuantity", $(this)).val()), $(".selectDefaultQuantity", $(this)).length && $(this).data("quantity", $(".selectDefaultQuantity", $(this)).val()), $(this).data("amount-after-tax", a);
                    var b = {
                        startDate: $(this).data("start-date"),
                        adultQuantity: $(this).data("adult-quantity"),
                        childrenQuantity: $(this).data("children-quantity"),
                        seniorQuantity: $(this).data("senior-quantity"),
                        defaultQuantity: $(this).data("quantity"),
                        name: $(this).data("name"),
                        code: $(this).data("inventory-code"),
                        description: $(this).data("description"),
                        cancel: $(this).data("cancel"),
                        guarantee: $(this).data("guarantee"),
                        amountAfterTax: $(this).data("amount-after-tax"),
                        roomUniqueId: $(this).data("room-unique-id")
                    };
                    c.push(b), "undefined" != typeof dataLayer && dataLayer.push({
                        event: "trackAddToCart",
                        cart_product_sku: $(this).data("synxis-id") + "-" + $(this).data("inventory-code"),
                        cart_product_name: $(this).data("etablissement-name") + "|" + $(this).data("name"),
                        cart_product_category: $(this).data("area-label"),
                        cart_product_price: parseFloat($(this).data("amount-after-tax")),
                        cart_product_quantity: $(this).data("quantity"),
                        cart_product_currency: $(this).data("currency")
                    })
                }
            }
        }), c && ($.ajax({
            url: Routing.generate("reservation_add_service." + settingsLocalization.sLanguageMin),
            type: "POST",
            data: {
                postArray: c,
                editionMode: $("#editionMode").val(),
                etablissementCurrencyCode: $("#etablissementCurrencyCode").val(),
                idQuote: $("#idQuote").val()
            },
            cache: !1,
            success: function(a) {
                a.success && (b.hasClass("hotel") ? ($("#cboxClose").trigger("click"), $("#nbAddonWrapper").show(), $("#itemUpdatedDescription").hide(), $("#nbAddonUpdated").html(c.length), c.length > 1 ? ($("#suffixAddon").hide(), $("#suffixAddons").show()) : ($("#suffixAddons").hide(), $("#suffixAddon").show())) : ($.colorbox.close(), location.reload()))
            }
        }), "RelaisChateauxApp" === window.navigator.userAgent && (window.location.href = Routing.generate("reservation_basket." + settingsLocalization.sLanguageMin)))
    }), $("body").on("submit", "#requestAVillaForm", function(a) {
        a.preventDefault();
        var b = $(this),
            c = b.serialize();
        $.ajax({
            url: b.attr("action"),
            type: "POST",
            data: c,
            cache: !1,
            async: !1,
            success: function(a) {
                if (ajaxSuccess = !0, a.success) $(".popin .formField .formError").remove(), $("div#alert-success").show(), b.trigger("reset");
                else {
                    var c = $('<div class="formError"></div>');
                    $(".popin .formField .formError").remove(), $.each(a.errors, function(a) {
                        var b = this,
                            d = $("#" + b.form + "_" + b.field),
                            e = d.closest(".formField"),
                            f = c.clone();
                        f.html(b.message), e.append(f)
                    })
                }
            },
            error: function() {}
        })
    })
});