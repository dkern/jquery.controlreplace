/*!
 * jQuery Control/Input Replace - v0.1.3
 * http://jquery.eisbehr.de/
 * http://eisbehr.de
 *
 * Copyright 2014, Daniel 'Eisbehr' Kern
 *
 * Dual licensed under the MIT and GPL v2 licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
 *
 * jQuery("input").controlReplace();
 * jQuery("input").inputReplace();
 */
(function($, window, document, undefined)
{
    $.fn.controlReplace = function(settings)
    {
        /**
         * settings and configuration data
         * @var array
         */
        var configuration =
        {
            additionalClass: null,
            onChange: null,
            inputCss:
            {
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
        $(items).each(function()
        {
            // ignore elements without an id
            if( typeof $(this).attr("id") === "undefined" )
                return;

            var element = $(this),
                tag     = this.tagName.toLowerCase(),
                type    = element.attr("type"),
                id      = element.attr("id").replace(".", ""),
                name    = element.attr("name"),
                value   = element.val();

            // skip elements without id
            if( id == undefined || $.trim(id) == "" ) return;

            // handle 'inputs' of type 'checkbox' and 'radio'
            if( tag == "input" && (type == "checkbox" || type == 'radio') && element.attr("data-replaced") != "true" )
            {
                // create replacement element
                $(this).after("<div class=\"" + type + "_replace " + configuration.additionalClass + "\" data-id=\"" + id + "\" data-name=\"" + name + "\" data-type=\"" + type + "\" data-value=\"" + value + "\"></div>");

                // pass checked state to new elements
                if( $(this).attr("checked") )
                    $(this).next().addClass("active");

                // set additional css to original element
                $(this).attr("data-replaced", "true").css(configuration.inputCss).click(function() { return false });

                // set click event
                $(this).next().click(function()
                {
                    var replace = $(this);
                    var type = replace.attr("data-type");

                    if( type == "checkbox" )
                    {
                        if( replace.hasClass("active") )
                        {
                            replace.removeClass("active").prev().attr("checked", false);
                            if( configuration.onChange ) configuration.onChange(replace.attr("data-name"), null);
                        }
                        else
                        {
                            replace.addClass("active").prev().attr("checked", true);
                            if( configuration.onChange ) configuration.onChange(replace.attr("data-name"), replace.attr("data-value"));
                        }
                    }

                    else if( type == "radio" )
                    {
                        $("div[data-name='" + replace.attr("data-name") + "']").removeClass("active");
                        $("input[type='radio'][name='" + replace.attr("data-name") + "']").removeAttr("checked");
                        $("input[type='radio'][name='" + replace.attr("data-name") + "'][value='" + replace.attr("data-value") + "']").prop("checked", true).click();
                        $("input[type='hidden'][name='" + replace.attr("data-name") + "']").val(replace.attr("data-value"));
                        replace.addClass("active");

                        if( configuration.onChange ) configuration.onChange(replace.attr("data-name"), replace.attr("data-value"));
                    }
                });

                // redirect label click event
                $("label[for='" + id + "']").click(function()
                {
                    $("div[data-id='" + $(this).attr("for") + "']").click();
                });
            }

            // handle 'select'
            else if( tag == "select" && element.attr("multiple") != "multiple" )
            {
                var  text = element.children("option:selected").text();
                element.hide();

                // create replacement elements
                element.after("<div class='select_replace " + name + " " + configuration.additionalClass + "' data-id='" + id + "' data-name='" + name + "'></div>");
                element.next().append("<input id='replaced_" + id + "' name='replaced_" + id + "' type='text' value='" + text + "' readonly='readonly' class='required-entry no-blur' />");
                element.next().append("<div class='list_container'><ul></ul></div>");

                // create value list
                var list = element.next().children("div").children("ul");
                element.children("option").each(function()
                {
                    list.append('<li class="' + $(this).attr("class") + (this.selected ? ' selected' : '') + '" data-value="' + $(this).val() + '">' + $(this).text() + '</li>');
                });

                // make input not selectable
                var select = element.next().children("input");
                select.on("selectstart focus", function(e)
                {
                    select.blur();
                    e.preventDefault();

                    return false;
                });

                // register open list event
                select.click(function(e)
                {
                    var state = select.parent().hasClass("open");

                    // close all selects
                    $("div.select_replace").removeClass("open");

                    // open specific one
                    if( !state )
                        select.parent().addClass("open");
                });

                // register option select event
                list.children("li").click(function(e)
                {
                    // close all selects
                    $("div.select_replace").removeClass("open");

                    // set value to hidden
                    var hidden = $("input[id=\"" + id + "\"]")
                    hidden.val($(this).attr("data-value"));
                    select.val($(this).text())

                    // update selected entry in list
                    $(this).parent().children("li").removeClass("selected");
                    $(this).addClass("selected");

                    // trigger on change event if available
                    if( configuration.onChange ) configuration.onChange(hidden);
                    select.change();
                });

                // remove select and make it a hidden field
                element.replaceWith("<input id='" + id + "' name='" + name + "' type='hidden' value='" + value + "' />");
            }
        });
    };

    // other names to call
    $.fn.inputReplace = $.fn.controlReplace;
})(jQuery, window, document);