/*!
 * jQuery Control Replace - v0.3.2
 * http://jquery.eisbehr.de/
 *
 * Copyright 2016, Daniel 'Eisbehr' Kern
 *
 * Dual licensed under the MIT and GPL v2 licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
 *
 * $("input").controlReplace();
 */
;(function($, document, undefined) {
    $.fn.controlReplace = function(settings) {
        /**
         * settings and configuration data
         * @var {object}
         */
        var configuration = {
            additionalClass: null,
            onChange: null,
            afterReplace: null,
            inputCss: {
                position: "absolute",
                top: 2,
                left: 2
            }
        };

        // overwrite configuration with custom user settings
        if( settings ) $.extend(configuration, settings);

        // get selected elements
        var items = this;

        // loop all items
        $(items).each(function() {
            var element = $(this),
                tag     = element.prop("tagName").toLowerCase(),
                type    = element.attr("type"),
                id      = element.attr("id").replace(".", ""),
                name    = element.attr("name"),
                value   = element.val();

            // ignore elements without an id
            if( typeof element.attr("id") === "undefined" || $.trim(id) == "" )
                return;

            // handle 'inputs' of type 'checkbox' and 'radio'
            if( tag == "input" && (type == "checkbox" || type == 'radio') && !element.data("replaced") ) {
                // create replacement element
                $("<div />", {class: type + "_replace", data: {id: id, name: name, type: type, value: value}})
                .attr("data-id", id)
                .attr("data-name", name)
                .addClass(configuration.additionalClass)
                .insertAfter(element);

                // pass checked state to new elements
                if( element.prop("checked") )
                    element.next().addClass("active");

                // set additional css to original element and prevent click on original
                element.data("replaced", true)
                       .css(configuration.inputCss)
                       .click(function(e) {
                           e.preventDefault();
                           return false
                       })

                // set click event on replace
                .next().click(function() {
                    var replace = $(this),
                        type = replace.data("type");

                    if( type == "checkbox" ) {
                        if( replace.hasClass("active") ) {
                            replace.removeClass("active").prev().removeAttr("checked").prop("checked", false).change();
                            if( configuration.onChange ) configuration.onChange(replace.data("name"), null);
                        }
                        else {
                            replace.addClass("active").prev().attr("checked", "checked").prop("checked", true).change();
                            if( configuration.onChange ) configuration.onChange(replace.data("name"), replace.data("value"));
                        }
                    }

                    else if( type == "radio" ) {
                        $("div[data-name='" + replace.data("name") + "']").removeClass("active");
                        $("input[type='radio'][name='" + replace.data("name") + "']").removeAttr("checked");
                        $("input[type='radio'][name='" + replace.data("name") + "'][value='" + replace.data("value") + "']").attr("checked", "checked").prop("checked", true).click();
                        //$("input[type='hidden'][name='" + replace.data("name") + "']").val(replace.data("value"));

                        replace.addClass("active");
                        if( configuration.onChange ) configuration.onChange(replace.data("name"), replace.data("value"));
                    }
                });

                // redirect label click event
                $("label[for='" + id + "']").click(function() {
                    $("div[data-id='" + $(this).attr("for") + "']").click();
                });

                if( configuration.afterReplace )
                    configuration.afterReplace(element);
            }

            // handle 'select'
            else if( tag == "select" && !element.prop("multiple") && element.attr("multiple") != "multiple" ) {
                // remove select from view
                element.hide();

                // get actual selected text
                var selectedText = element.find("option:selected").text();

                // create replacement elements
                var replace = $("<div/>", {"class": "select_replace " + name, data: {id: id, name: name}}).addClass(configuration.additionalClass).insertAfter(element);
                var input = $("<input/>", {id: "replaced_" + id, name: "replaced_" + id, type: "text", value: selectedText, readonly: "readonly", "class": "required-entry no-blur"}).appendTo(replace);
                var listContainer = $("<div><ul/></div>").addClass("list_container").appendTo(replace);

                // transfer disabled state
                if( element.prop("disabled") )
                    input.attr("disabled", "disabled").addClass("disabled");

                // create value list
                var list = $("ul", listContainer);
                element.find("option").each(function() {
                    var option = $(this);
                    $("<li/>", {"class": (option.attr("class") ? option.attr("class") : "") + (option.prop("selected") ? " selected" : ""), html: option.text(), data: {value: option.val()}})
                    .attr("data-value", option.val())
                    .appendTo(list);
                });

                // make input not selectable
                input.on("selectstart focus", function(e) {
                    input.blur();
                    e.preventDefault();

                    return false;
                });
                
                // register open list event
                input.click(function() {
                    // ignore on disabled
                    if( input.prop("disabled") )
                        return;

                    var parent = input.parent(),
                        state = parent.hasClass("open");

                    // close all selects
                    $("div.select_replace").removeClass("open");

                    // open specific one
                    if( !state ) {
                        parent.addClass("open");

                        // hide on hit esc key
                        $(document).on("keyup.control_replace_select", function(e) {
                            if( e.keyCode == 27 ) {
                                parent.removeClass("open");
                                $(document).off("control_replace_select");
                            }
                        })

                        // hide on click outside select
                        .on("click.control_replace_select", function(e) {
                            if( !parent.is(e.target) && parent.has(e.target).length === 0 ) {
                                parent.removeClass("open");
                                $(document).off("control_replace_select");
                            }
                        });
                    }
                });

                // register option select event
                list.find("li").click(function() {
                    var entry = $(this);

                    // close all selects
                    $("div.select_replace").removeClass("open");
                    $(document).off("control_replace_select");

                    // set value to hidden
                    var hidden = $("input[id=\"" + id + "\"]");
                    hidden.val(entry.attr("data-value"));
                    input.val(entry.text());
                    element.val(entry.data("value"));

                    // update selected entry in list
                    entry.parent().find("li").removeClass("selected");
                    entry.addClass("selected");

                    // trigger on change event if available
                    if( configuration.onChange ) configuration.onChange(hidden);
                    input.change();
                    hidden.change();
                });

                // remove select and make it a hidden field
                element.replaceWith($("<input />", {id: id, name: name, type: "hidden", value: value}));
                element = $("#" + id);

                if( configuration.afterReplace )
                    configuration.afterReplace(replace, element);
            }
        });
    };
})(jQuery, document);
