/*
 * Copyright 2017 Republic of Reinvention bvba. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by bram on 25/02/16.
 */
base.plugin("blocks.imports.FactEntry", ["base.core.Class", "blocks.imports.Block", "base.core.Commons", "blocks.core.Sidebar", "messages.base.core", "constants.blocks.core", "messages.blocks.core", "constants.blocks.imports.fact", "messages.blocks.imports.fact", "constants.blocks.imports.text", "blocks.core.Notification", function (Class, Block, Commons, Sidebar, BaseMessages, BlocksConstants, BlocksMessages, FactConstants, FactMessages, TextConstants, Notification)
{
    var BlocksFactEntry = this;
    this.TAGS = ["blocks-fact-entry"];

    //Some constants
    var BOOLEAN_ATTR_TRUE = 'true';
    var BOOLEAN_ATTR_FALSE = 'false';
    var PROPERTY_ATTR = "property";
    var DATATYPE_ATTR = "datatype";
    var TYPEOF_ATTR = "typeof";
    var RESOURCE_ATTR = "resource";
    var CONTENT_ATTR = "content";
    var HTML_LANGUAGE_ATTR = "lang";
    var LANGUAGE_ATTR = "lang";
    //makes sense to use the curie name of the terms and classes in the ontologies; it's short and future-flexible
    var TERM_NAME_FIELD = "curieName";
    //we'll use the 'title' property of a term as the label of that property
    var TERM_LABEL_FIELD = "title";

    //Formats for human readable date & time
    var DATE_TIME_LOCALE = BaseMessages.locale;
    var DATE_TIME_FORMAT = "dddd LL - LT";
    var DATE_FORMAT = "dddd LL";
    var TIME_FORMAT = "LT";
    var TIMEZONE_FORMAT = "Z";

    //Formats for XSD value of date-time
    //Note that 'moment.ISO_8601' is more or less the same as 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', but not 100% --> see moments.js source code (but we can live with it)
    var DATE_TIME_VALUE_FORMAT = 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]';
    //Note that this is not 100% XSD: we omit the optional timezone to simplify this widget (if you need timezones, use the datetime widget instead)
    var DATE_VALUE_FORMAT = "YYYY-MM-DD";
    var TIME_VALUE_FORMAT = 'HH:mm:ss.SSS[Z]';

    //Input formats for the date/time widgets
    //More or less the same as 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', but not 100% --> see moments.js source code
    var DATE_TIME_WIDGET_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
    //Note that this is not 100% XSD: we omit the optional timezone to simplify this widget (if you need timezones, use the datetime widget instead)
    var DATE_WIDGET_FORMAT = 'YYYY-MM-DD';
    var TIME_WIDGET_FORMAT = 'HH:mm:ss';

    //are we editing a date, a time or a dateTime?
    var DATE_TIME_ENUM_DATE = 1;
    var DATE_TIME_ENUM_TIME = 2;
    var DATE_TIME_ENUM_DATETIME = 3;

    (this.Class = Class.create(Block.Class, {

        //-----VARIABLES-----
        BlocksFactEntryConfig: this,
        //this contains a mapping between ontology urls and the data objects returned by the server
        _termMappings: null,
        //_gmtSelected: false,
        //_dateTimeEnum: null,
        //_dateTimeFormat: null,
        //_timezoneFormat: null,
        //_dateTimeValueFormat: null,
        //_dateTimeWidgetFormat: null,

        //-----CONSTRUCTORS-----
        constructor: function ()
        {
            BlocksFactEntry.Class.Super.call(this);
        },

        //-----IMPLEMENTED METHODS-----
        getConfigs: function (block, element)
        {
            var retVal = BlocksFactEntry.Class.Super.prototype.getConfigs.call(this, block, element);

            retVal.push(this._createCombobox(block, element));

            return retVal;
        },
        getWindowName: function ()
        {
            return FactMessages.widgetTitle;
        },

        //-----PRIVATE METHODS-----
        /**
         * Mainly created to lazy-load the combobox; we return a combobox directly, which we will fill with the data from an endpoint.
         */
        _createCombobox: function (block, element)
        {
            //!!!NOTE!!! that these two elements are referenced from the controller (save/copy callbacks) as well,
            //so it something would ever change, make sure you change them there as well!
            //this is the label that belongs to the value
            var labelElement = element.find("[data-property='" + FactConstants.FACT_ENTRY_NAME_PROPERTY + "']");
            //this is the element that holds the true value of the entry
            //note: we need the first() selector to bypass the sub-properties in possible objects
            var propElement = element.find("." + FactConstants.FACT_ENTRY_PROPERTY_CLASS).first();

            var _this = this;
            var endpointURL = BlocksConstants.RDF_PROPERTIES_ENDPOINT;
            var pageTypeof = $('html').attr(TYPEOF_ATTR);
            if (pageTypeof) {
                endpointURL += "?" + BlocksConstants.RDF_RES_TYPE_CURIE_PARAM + "=" + pageTypeof;
            }

            var combobox = this.addUniqueAttributeValueAsync(Sidebar, propElement, FactMessages.propertyTypeLabel, PROPERTY_ATTR, endpointURL, TERM_LABEL_FIELD, TERM_NAME_FIELD,
                function changeListener(oldValueTerm, newValueTerm)
                {
                    //this is a good place to iterate the fact entries and mark the doubles
                    //(don't worry if it gets called multiple times, I just hope it's not too slow)
                    //TODO: one issue remains if you drag an entry out (or in) a sequence, you need to focus it before it updates...
                    var prev = null;
                    //Note: the first-child selector makes sure the sub-properties of possible object widgets don't get selected
                    $('blocks-fact-entry [data-property=' + FactConstants.FACT_ENTRY_VALUE_CLASS + '] [' + PROPERTY_ATTR + ']:first-child').each(function ()
                    {
                        var el = $(this);

                        if (prev != null && prev.attr(PROPERTY_ATTR) == el.attr(PROPERTY_ATTR)) {
                            el.parents('blocks-fact-entry').addClass(FactConstants.FACT_ENTRY_DOUBLE_CLASS);
                        }
                        else {
                            el.parents('blocks-fact-entry').removeClass(FactConstants.FACT_ENTRY_DOUBLE_CLASS);
                        }

                        prev = el;
                    });

                    //for now, we don't allow the combobox to switch to an "empty" value, so ignore if that happens (probably during initialization)
                    if (!newValueTerm) {
                        return;
                    }

                    // don't change anything if they're both the same
                    if (oldValueTerm && oldValueTerm[TERM_NAME_FIELD] == newValueTerm[TERM_NAME_FIELD]) {
                        return;
                    }

                    //This method gets called every time the user focuses a fact entry, because the combobox is re-loaded
                    //every time, resulting in a change from undefined to the currently configured value.
                    //We can't really start building the html from scratch every time, because that would mean we'd lose our previously entered data.
                    //To detect a 'real change', we check three attributes on the propElement: the property, the data type and the widget class.
                    //Note that we can't just use the property attribute to check if everything is ok, because when this method is called,
                    //that attribute has just been set (since we requested it by passing PROPERTY_ATTR to addUniqueAttributeValueAsync).
                    //When all three are ok, we conclude nothing needs to be changed and it's not a 'real change', but rather a 'focus' event.
                    //This flag controls that behavior
                    var skipHtmlChange = false;

                    if (
                        propElement.hasAttribute(PROPERTY_ATTR) && propElement.attr(PROPERTY_ATTR) == newValueTerm[TERM_NAME_FIELD] &&
                        // Since we abandoned the use of @typeof, we abandoned this sub-check as well; seems to be working fine.
                        //(
                        //    //we either need a datatype (for literals) or a typeof (for references)
                        //    (propElement.hasAttribute(DATATYPE_ATTR) && propElement.attr(DATATYPE_ATTR) == newValueTerm.dataType[TERM_NAME_FIELD]) ||
                        //    (propElement.hasAttribute(TYPEOF_ATTR) && propElement.attr(TYPEOF_ATTR) == newValueTerm.dataType[TERM_NAME_FIELD])
                        //) &&
                        propElement.hasClass(newValueTerm.widgetType)
                    ) {
                        //we can't return straight away because we need to initialize the extra controls in the sidebar
                        skipHtmlChange = true;
                    }

                    //some outlier cases to update the html after all (trial-error)
                    if (skipHtmlChange) {
                        //By checking this, we allow changed property labels in the back-end to propagate to the entries in the front-end
                        // if they're focussed. Note that the text() function removes any possible <p></p> tags
                        if ($.trim(labelElement.text()) !== newValueTerm.label) {
                            skipHtmlChange = false;
                        }
                    }

                    //If we reach this point, the element needs to change, so setup the html property element
                    _this._updatePropertyElement(_this, false, skipHtmlChange, labelElement, propElement, newValueTerm, combobox);

                });

            return combobox;
        },
        _updatePropertyElement: function (_this, inSidebar, skipHtmlChange, labelElement, propElement, valueTerm, sidebarParent)
        {
            if (!skipHtmlChange) {

                // Because there's a lot of attributes coming in from other plugin modules,
                //our approach is to strip all attributes and html off and start over.
                // Note that we can't just replace the element because too many other closures are hooked to it,
                _this._stripAttributes(propElement);

                //here, we have a clean element, so we can start building again...
                propElement.addClass(FactConstants.FACT_ENTRY_PROPERTY_CLASS);

                //-- Initialize the html
                //we don't really allow this for now (it resets the html back to the default state if we pass undefined or null as newValue)
                if (!valueTerm) {
                    labelElement.html(FactMessages.widgetEntryDefaultLabel);
                }
                else {
                    //set the label html (note: if you change this, make sure the .text() function above in the skipHtmlChange check still works...)
                    labelElement.html(valueTerm.label);

                    //Initialize the property attributes
                    //Note that we also could use the 'rel' attribute instead of 'property' when working with resources (not for literals)
                    // see https://www.w3.org/TR/rdfa-syntax/#chaining-with-property-and-typeof
                    // "The main differences between @property and @rel (or @rev) is that the former does not induce chaining.
                    //  (see this URL for what chaining is: https://www.w3.org/TR/rdfa-syntax/#inheriting-subject-from-resource)"
                    //Also note that we abanoned the use of @typeof to avoid data duplication and because it's never used like this
                    // in literature examples. (@typeof is rather used to create blank nodes while creating a new resource), so the
                    // explanation in the url above about equality of @property and @rel while using @typeof is't valid anymore.
                    //
                    //More info from https://www.w3.org/TR/rdfa-syntax/#object-resolution-for-the-property-attribute
                    // "An object literal will be generated when @property is present and no resource attribute is present."
                    // illustrates the difference between resource and literal handling.
                    propElement.attr(PROPERTY_ATTR, valueTerm[TERM_NAME_FIELD]);

                    //If we're dealing with a reference to another resource, we use the typeof attribute,
                    //otherwise (when dealing with a literal), we use the datatype attribute.
                    //We compare the use of @typeof (together with @resource) as the 'reference-equivalent' of using @datatype together with a literal.
                    //Also note that we treat a ANY_URI type the same way as a resource for serialization reasons (it results in the RDF we expect)
                    if (valueTerm.widgetType == BlocksConstants.INPUT_TYPE_RESOURCE || valueTerm.widgetType == BlocksConstants.INPUT_TYPE_URI) {
                        //NOOP: @typeof isn't added anymore, see above for reason
                        //propElement.attr(TYPEOF_ATTR, valueTerm.dataType[TERM_NAME_FIELD]);
                    }
                    else if (valueTerm.widgetType == BlocksConstants.INPUT_TYPE_OBJECT) {
                        //we're an 'inline' object, so we need to set the typeof attribute on the property element,
                        //see https://www.w3.org/TR/rdfa-primer/#internal-references
                        propElement.attr(TYPEOF_ATTR, valueTerm.dataType[TERM_NAME_FIELD]);
                    }
                    else {
                        propElement.attr(DATATYPE_ATTR, valueTerm.dataType[TERM_NAME_FIELD]);
                    }

                    //we need to add this class to have it picked up by widget-specific modules (like the editor)
                    propElement.addClass(valueTerm.widgetType);
                }

                //additional tweaking based on the datatype
                switch (valueTerm.dataType[TERM_NAME_FIELD]) {
                    // There are two special cases when it comes to languages: xsd:string and rdf:langString
                    // (see the comments on RDF.LANGSTRING for a detailed explanation)
                    // We have to remove the explicit datatype in case of a rdf:langString to activate the @lang attribute
                    // (here, explicitly, or inherited from the <html> tag).
                    // In case of the xsd:string datatype, setting it explicitly will undo any (ex/implicit) language set.
                    //
                    //Note that we don't have to remove previous languages because all properties have been wiped above
                    case 'rdf:langString':

                        propElement.removeAttr(DATATYPE_ATTR);

                        break;
                }
            }

            if (sidebarParent) {
                if (!inSidebar) {
                    //this will reset any previously added widgets after the combobox
                    sidebarParent.nextAll().remove();
                }
            }

            _this._createWidget(_this, inSidebar, skipHtmlChange, propElement, valueTerm, sidebarParent);
        },
        _createWidget: function (_this, inSidebar, skipHtmlChange, propElement, newValueTerm, sidebarParent)
        {
            var retVal = {
                element: null,
            };

            switch (newValueTerm.widgetType) {
                case BlocksConstants.INPUT_TYPE_EDITOR:

                    retVal.element = _this._createEditorWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, FactMessages.textEntryDefaultValue);

                    break;
                case BlocksConstants.INPUT_TYPE_INLINE_EDITOR:

                    retVal.element = _this._createInlineEditorWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, FactMessages.textEntryDefaultValue);

                    break;
                case BlocksConstants.INPUT_TYPE_BOOLEAN:

                    //note: the boolean entry is styled using css based on its attributes, and doesn't have real html content,
                    // so make sure the html is wiped clean
                    retVal.element = _this._createBooleanWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, null);

                    break;
                case BlocksConstants.INPUT_TYPE_NUMBER:

                    retVal.element = _this._createInputWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, FactMessages.numberEntryDefaultValue, 'number', FactMessages.numberEntryLabel,
                        function setterFunction(propElement, defaultValue, newValue)
                        {
                            if (newValue && newValue != '') {
                                propElement.attr(CONTENT_ATTR, newValue);
                                propElement.html(newValue);
                            }
                            else {
                                //don't remove the attr, set it to empty (or the help text in the HTML will end up as the value)
                                propElement.attr(CONTENT_ATTR, '');
                                propElement.html(defaultValue);
                            }
                        },
                        null,
                        null);

                    break;
                case BlocksConstants.INPUT_TYPE_DATE:

                    retVal.element = _this._createInputWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, FactMessages.dateEntryDefaultValue, 'date', FactMessages.dateEntryLabel,
                        function setterFunction(propElement, defaultValue, newValue)
                        {
                            //Note that we save all date values as GMT (if you need timezone functionality, use the dateTime widget)
                            return _this._dateTimeSetterFunction(_this, propElement, defaultValue, newValue, DATE_TIME_ENUM_DATE, DATE_FORMAT, DATE_VALUE_FORMAT, null, true);
                        },
                        function widgetSetterFilterFunction(contentValue)
                        {
                            return _this._dateTimeWidgetSetterFilterFunction(_this, propElement, contentValue, DATE_VALUE_FORMAT, DATE_WIDGET_FORMAT, true);
                        },
                        null);

                    break;
                case BlocksConstants.INPUT_TYPE_TIME:

                    retVal.element = _this._createInputWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, FactMessages.timeEntryDefaultValue, 'time', FactMessages.timeEntryLabel,
                        function setterFunction(propElement, defaultValue, newValue)
                        {
                            return _this._dateTimeSetterFunction(_this, propElement, defaultValue, newValue, DATE_TIME_ENUM_TIME, TIME_FORMAT, TIME_VALUE_FORMAT, TIMEZONE_FORMAT, false);
                        },
                        function widgetSetterFilterFunction(contentValue)
                        {
                            return _this._dateTimeWidgetSetterFilterFunction(_this, propElement, contentValue, TIME_VALUE_FORMAT, TIME_WIDGET_FORMAT, false);
                        },
                        function extraHtmlFunction(updateCallback)
                        {
                            return _this._dateTimeExtraHtmlFunction(_this, inSidebar, propElement, newValueTerm, updateCallback);
                        }
                    );

                    break;
                case BlocksConstants.INPUT_TYPE_DATETIME:

                    retVal.element = _this._createInputWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, FactMessages.datetimeEntryDefaultValue, 'datetime-local', FactMessages.dateTimeEntryLabel,
                        function setterFunction(propElement, defaultValue, newValue)
                        {
                            return _this._dateTimeSetterFunction(_this, propElement, defaultValue, newValue, DATE_TIME_ENUM_DATETIME, DATE_TIME_FORMAT, DATE_TIME_VALUE_FORMAT, TIMEZONE_FORMAT, false);
                        },
                        function widgetSetterFilterFunction(contentValue)
                        {
                            return _this._dateTimeWidgetSetterFilterFunction(_this, propElement, contentValue, DATE_TIME_VALUE_FORMAT, DATE_TIME_WIDGET_FORMAT, false);
                        },
                        function extraHtmlFunction(updateCallback)
                        {
                            return _this._dateTimeExtraHtmlFunction(_this, inSidebar, propElement, newValueTerm, updateCallback);
                        }
                    );

                    break;
                case BlocksConstants.INPUT_TYPE_COLOR:

                    retVal.element = _this._createInputWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, FactMessages.colorEntryDefaultValue, 'color', FactMessages.colorEntryLabel,
                        function setterFunction(propElement, defaultValue, newValue)
                        {
                            if (newValue && newValue != '' && newValue.charAt(0) == '#') {
                                propElement.attr(CONTENT_ATTR, newValue);
                                propElement.html('<div class="' + BlocksConstants.INPUT_TYPE_COLOR_VALUE_CLASS + '" style="background-color: ' + newValue + '"></div>');
                            }
                            else {
                                //don't remove the attr, set it to empty (or the help text in the HTML will end up as the value)
                                propElement.attr(CONTENT_ATTR, '');
                                propElement.html(defaultValue);
                            }
                        },
                        null,
                        null);

                    break;

                case BlocksConstants.INPUT_TYPE_ENUM:

                    retVal.element = _this._createEnumWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, FactMessages.enumEntryDefaultValue);

                    break;

                case BlocksConstants.INPUT_TYPE_URI:

                    retVal.element = _this._createUriWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, FactMessages.uriEntryDefaultValue);

                    break;

                case BlocksConstants.INPUT_TYPE_RESOURCE:

                    retVal.element = _this._createResourceWidget(inSidebar, propElement, newValueTerm, skipHtmlChange, FactMessages.resourceEntryDefaultValue);

                    break;

                case BlocksConstants.INPUT_TYPE_OBJECT:

                    var objDatatypeCurie = newValueTerm.dataType[TERM_NAME_FIELD];

                    //let's create a little group for the config widgets of this object
                    var objConfigContainer = $('<div class="' + BlocksConstants.PANEL_GROUP_CLASS + '"></div>');
                    objConfigContainer.append($('<div class="title">' + newValueTerm[TERM_LABEL_FIELD] + '</div>'));

                    retVal.element = objConfigContainer;

                    //wipe the element if all children are merely text nodes (note that children() doesn't count simple text children)
                    if (propElement.children().length == 0) {
                        propElement.empty();
                    }

                    //ask the server to list all the terms of this property's object data type
                    $.getJSON(BlocksConstants.RDF_PROPERTIES_ENDPOINT + "?" + BlocksConstants.RDF_RES_TYPE_CURIE_PARAM + "=" + objDatatypeCurie)
                        .done(function (data)
                        {
                            var objRefs = {};

                            $.each(data, function (idx, entry)
                            {
                                var curie = entry[TERM_NAME_FIELD];
                                var ref = objRefs[curie];
                                if (!ref) {
                                    ref = [entry];
                                    objRefs[curie] = ref;
                                }
                                else {
                                    ref.push(entry);
                                }

                                var objContainer = propElement.children('[' + FactConstants.FACT_ENTRY_OBJPROP_PLACEHOLDER_ATTR + '="' + curie + '"]').eq(ref.length - 1);
                                var objLabel;
                                var objProp;

                                if (objContainer.length) {
                                    objLabel = objContainer.find('label');
                                    objProp = objContainer.find('div');
                                }
                                else {
                                    objContainer = $('<div/>')
                                        .attr(FactConstants.FACT_ENTRY_OBJPROP_PLACEHOLDER_ATTR, curie)
                                        .appendTo(propElement);

                                    objLabel = $('<label/>')
                                        .appendTo(objContainer);

                                    objProp = $('<div/>')
                                        .appendTo(objContainer);
                                }

                                _this._updatePropertyElement(_this, true, false, objLabel, objProp, entry, objConfigContainer);

                            });
                        })
                        .fail(function (xhr, textStatus, exception)
                        {
                            Notification.error(BlocksMessages.generalServerDataError + (exception ? "; " + exception : ""), xhr);
                        });

                    break;

                default:
                    //we stopped allowing unknown types
                    Notification.error(Commons.format(FactMessages.unknownWidgetTypeError, newValueTerm.widgetType));

                    break;
            }

            //add a control to the sidebar if we need to
            if (retVal.element) {
                //this should always be true
                if (sidebarParent) {
                    if (inSidebar) {
                        sidebarParent.append(retVal.element);
                    }
                    else {
                        sidebarParent.after(retVal.element);
                    }
                }
            }

            return retVal;
        },
        _createEditorWidget: function (inSidebar, propElement, valueTerm, skipHtmlChange, defaultValue)
        {
            var retVal = null;

            if (inSidebar) {
                retVal = this.createTextareaInput(Sidebar,
                    function getterFunction()
                    {
                        return propElement.html();
                    },
                    function setterFunction(val)
                    {
                        if (val) {
                            //TODO this is very basic support for html: we only support nl2br
                            var htmlVal = val.replace(/\r?\n/g, '<br>');
                            propElement.html(htmlVal);
                        }
                        else {
                            propElement.html('');
                        }
                    },
                    Commons.capitalize(valueTerm.label),
                    //Note we don't use the defaultValue as a placeholder because it looks like double info
                    ''
                );
            }
            else {
                if (!skipHtmlChange) {
                    //Note: the editor works best with wrapped <p>'s but these are added automatically on edit so let's start clean
                    propElement.html(defaultValue);
                }
            }

            return retVal;
        },
        _createInlineEditorWidget: function (inSidebar, propElement, valueTerm, skipHtmlChange, defaultValue)
        {
            var retVal = null;

            if (inSidebar) {
                var propParent = propElement.parent();

                retVal = this.createTextInput(Sidebar,
                    function getterFunction()
                    {
                        return propElement.html();
                    },
                    function setterFunction(val)
                    {
                        propElement.html(val);

                        // if (val) {
                        //     if (!$.contains(propParent[0], propElement[0])) {
                        //         propParent.append(propElement);
                        //     }
                        // }
                        // else {
                        //     if ($.contains(propParent[0], propElement[0])) {
                        //         propElement.detach();
                        //     }
                        // }
                    },
                    Commons.capitalize(valueTerm.label),
                    //Note we don't use the defaultValue as a placeholder because it looks like double info in the sidebar
                    '', false, null
                );

                // propElement.detach();
            }
            else {
                if (!skipHtmlChange) {
                    //Note: the editor works best with wrapped <p>'s
                    propElement.html(defaultValue);
                }

                //we're not a span, so force inline mode
                propElement.attr(TextConstants.OPTIONS_ATTR, TextConstants.OPTIONS_FORCE_INLINE + " " + TextConstants.OPTIONS_NO_TOOLBAR);
            }

            return retVal;
        },
        _createBooleanWidget: function (inSidebar, propElement, valueTerm, skipHtmlChange, defaultValue)
        {
            var CONTENT_VALUE_TRUE = "true";
            var CONTENT_VALUE_FALSE = "false";

            var toggleState = function (newState)
            {
                if (newState) {
                    propElement.attr(CONTENT_ATTR, CONTENT_VALUE_TRUE);
                }
                else {
                    propElement.attr(CONTENT_ATTR, CONTENT_VALUE_FALSE);
                }

                //Note: we just create a dummy inner <i>, rest is done in CSS, based on the content attribute
                propElement.html('<div class="' + BlocksConstants.INPUT_TYPE_BOOLEAN_VALUE_CLASS + '" />');
            };

            var retVal = this.createToggleButton(inSidebar ? Commons.capitalize(valueTerm.label) : FactMessages.booleanEntryLabel,
                function initStateCallback()
                {
                    return propElement.attr(CONTENT_ATTR) == CONTENT_VALUE_TRUE;
                },
                function switchStateCallback(oldState, newState)
                {
                    toggleState(newState);
                },
                BlocksMessages.toggleLabelYes,
                BlocksMessages.toggleLabelNo,
                //when this is created in the sidebar, we start in 'disabled' mode
                inSidebar
            );

            //note: don't fire the change listener if we're in the sidebar, because of the startDisabled flag
            if (!skipHtmlChange && defaultValue != null && !inSidebar) {
                toggleState(defaultValue);
            }

            return retVal;
        },
        _createInputWidget: function (inSidebar, propElement, valueTerm, skipHtmlChange, defaultValue, htmlInputType, labelText, setterFunction, widgetSetterFilterFunction, extraHtmlFunction)
        {
            var id = Commons.generateId();
            var retVal = $('<div class="' + BlocksConstants.INPUT_TYPE_WRAPPER_CLASS + '"></div>');
            retVal.addClass(valueTerm.widgetType);
            if (labelText || inSidebar) {
                if (inSidebar) {
                    labelText = Commons.capitalize(valueTerm.label);
                }
                var label = ($('<label for="' + id + '">' + labelText + '</label>')).appendTo(retVal);
            }
            var inputGroup = $('<div class="input-group"></div>').appendTo(retVal);
            var input = $('<input id="' + id + '" type="' + htmlInputType + '" class="form-control">').appendTo(inputGroup);

            //init and attach the change listener
            var updateCallback = function ()
            {
                setterFunction(propElement, inSidebar ? null : defaultValue, input.val());
            };
            input.on("change keyup focus", function (event)
            {
                updateCallback();
            });


            var firstValue = propElement.attr(CONTENT_ATTR);

            //if the html widget is uninitialized, try to set it to a default value
            if (firstValue == FactMessages.widgetEntryDefaultValue) {
                //initial value may be (a valid) 0 or '', so check the type
                if (typeof defaultValue !== typeof undefined) {
                    firstValue = defaultValue;
                }
            }

            //this gives us a chance to skip this if it would be needed
            if (typeof firstValue !== typeof undefined && !inSidebar) {
                //init the input and filter it if needed;
                // this filter sits between the value in the @content attribute and the setter function for the input widget
                // so we can do some preprocessing before passing it to the widget
                if (widgetSetterFilterFunction) {
                    firstValue = widgetSetterFilterFunction(firstValue);
                }
                input.val(firstValue);
                //fire the change (because the one above doesn't seem to do so)
                setterFunction(propElement, defaultValue, firstValue);
            }

            //note: this should come after the processing of widgetSetterFilterFunction() because
            //that one may initialize some stuff to initialize the extra HTML (like GMT flag for dateTime)
            if (extraHtmlFunction) {
                var extraHtml = extraHtmlFunction(updateCallback);
                if (extraHtml) {
                    var container = $("<div></div>");
                    container.append(retVal);
                    container.append(extraHtml);
                    retVal = container;
                }
            }

            return retVal;
        },
        _createEnumWidget: function (inSidebar, propElement, valueTerm, skipHtmlChange, defaultValue)
        {
            var retVal = null;

            var changeListener = function (oldValueTerm, newValueTerm)
            {
                if (newValueTerm && newValueTerm.title != '') {
                    propElement.html(newValueTerm.title);
                }
                else {
                    propElement.html(defaultValue);
                }
            };

            //we'll use the name of the property as the label (capitalized)
            var endpointURL = valueTerm.widgetConfig[BlocksConstants.INPUT_TYPE_CONFIG_RESOURCE_AC_ENDPOINT];

            retVal = this.addUniqueAttributeValueAsync(Sidebar, propElement, Commons.capitalize(valueTerm.label), CONTENT_ATTR, endpointURL, "title", "value", changeListener);

            //call it once to set the default value
            if (!skipHtmlChange && !inSidebar && defaultValue != null) {
                changeListener();
            }

            return retVal;
        },
        _createUriWidget: function (inSidebar, propElement, valueTerm, skipHtmlChange, defaultValue)
        {
            var retVal = null;

            // We need to also add the hyperlink href as a property-value, because when we wrap the <a> tag with a <div property=""> tag,
            // the content of the property tag (eg. the entire <a> tag) gets serialized by the RDFa parser as a I18N-string, using the human readable
            // text of the hyperlink as a value (instead of using the href value and serializing it as a URI). This is because the property attribute is set on the
            // wrapping <div> instead of on the <a> tag.
            //Note: from the RDFa docs: "@content is used to indicate the value of a plain literal", and since it's a URI, we add it as a resource value
            var currentUri = propElement.attr(RESOURCE_ATTR);
            var inputActions = this.buildInputActions(Sidebar, true, false, currentUri);
            retVal = this.createTextInput(Sidebar,
                function getterFunction()
                {
                    return propElement.attr(RESOURCE_ATTR);
                },
                function setterFunction(val)
                {
                    if (val && val != '') {

                        //for now, we just use the (possibly relative) URI as the link name...
                        var linkName = val;

                        //detect an absolute URL
                        //see http://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
                        var isAbsolute = new RegExp('^(?:[a-z]+:)?//', 'i').test(val);

                        propElement.attr(RESOURCE_ATTR, val);
                        propElement.html('<a href="' + val + '"' + (isAbsolute ? ' target="_blank"' : '') + '>' + linkName + '</a>');
                    }
                    else {
                        //don't remove the attr, set it to empty (or the help text in the HTML will end up as the value)
                        propElement.attr(RESOURCE_ATTR, '');
                        propElement.html(defaultValue);
                    }
                },
                inSidebar ? Commons.capitalize(valueTerm.label) : FactMessages.uriEntryLabel, FactMessages.uriEntryPlaceholder, false, inputActions
            );

            return retVal;
        },
        _createResourceWidget: function (inSidebar, propElement, valueTerm, skipHtmlChange, defaultValue)
        {
            var retVal = null;

            retVal = this.createAutocompleteWidget(propElement, RESOURCE_ATTR, valueTerm.widgetType, valueTerm.widgetConfig, inSidebar ? Commons.capitalize(valueTerm.label) : FactMessages.resourceEntryLabel, null,
                //Note: this function receives the entire object as it was returned from the server endpoint (class AutocompleteSuggestion)
                function setterFunction(propElement, newValue)
                {
                    if (newValue && newValue.label != '') {

                        //the real value of the property is the remote resource id
                        //A nice illustration of this use is here: https://www.w3.org/TR/rdfa-syntax/#inheriting-subject-from-resource
                        //
                        //Regarding the relation between @resource, @href and @src, the docs say the following:
                        // "If no @resource is present, then @href or @src are next in priority order for setting the object."
                        // (see https://www.w3.org/TR/rdfa-syntax/#using-href-or-src-to-set-the-object)
                        // thus supplying both a @resource with a wrapped @href as below is valid.
                        propElement.attr(RESOURCE_ATTR, newValue.resourceUri);

                        var labelHtml = newValue.label;
                        //if the value has an image, it takes precedence of the label and we render an image instead of text
                        if (newValue.image) {
                            //note that alt is mandatory, but title provides a nice tooltip when hovering
                            labelHtml = '<img src="' + newValue.image + '" alt="' + newValue.label + '" title="' + newValue.label + '">';
                        }

                        //if the value has a link, let's render a hyperlink
                        if (newValue.link) {
                            var link = $('<a href="' + newValue.link + '">' + labelHtml + '</a>');
                            //little trick to get the hostname of an url: put it in a link element (which we need anyway) and query for the raw JS hostname
                            //also note that we can force an external link server side with the externalLink property
                            if (newValue.externalLink || link[0].hostname != document.location.hostname) {
                                link.attr("target", "_blank");
                            }
                            propElement.html(link);
                        }
                        else {
                            propElement.html(labelHtml);
                        }
                    }
                    else {
                        //don't remove the attr, set it to empty (or the help text in the HTML will end up as the value)
                        propElement.attr(RESOURCE_ATTR, '');
                        propElement.html(inSidebar ? null : defaultValue);
                    }
                });

            return retVal;
        },
        _stripAttributes: function (element)
        {
            //first copy the attributes to remove if we don't do this it causes problems
            //iterating over the array we're removing elements from
            var attributes = $.map(element[0].attributes, function (item)
            {
                return item.name;
            });
            // now remove the attributes
            $.each(attributes, function (i, item)
            {
                element.removeAttr(item);
            });

            return element;
        },
        _isGmtSelected: function (propElement)
        {
            //we default to using the local timezone for entering times
            var retVal = false;

            //this is a general initialization for time and dateTime, but doesn't harm any other types
            //this will be the variable we use to save the state of the GMT checkbox
            //Note that all values are saved in UTC, this is just the flag to control how it's displayed to the user
            if (propElement.hasAttribute(BlocksConstants.INPUT_TYPE_TIME_GMT_ATTR)) {
                //see the setter function below: this should be
                retVal = propElement.attr(BlocksConstants.INPUT_TYPE_TIME_GMT_ATTR) === BOOLEAN_ATTR_TRUE;
            }

            return retVal;
        },
        _dateTimeSetterFunction: function (_this, propElement, defaultValue, newValue, dateTimeEnum, dateTimeFormat, dateTimeValueFormat, timezoneFormat, forceGmt)
        {
            //here we have two possibilities:
            //1) the value comes in from the datetime-local (or date or time) widget, meaning it has no timezone specified
            //   (the name of the widget indicates it to be '-local', but instead it doesn't seem to have any timezone specified in the string-value at all; eg. 2016-01-01T01:00)
            //   Since we added a checkbox to allow the user to enter a GMT time (and to indicate the admin user should think about it in the first place),
            //   we should interpret the incoming value and convert it to a UTC/GMT time or a local timezone'd time
            //2) the value comes in from the @content attributes as saved in the html
            //   Since we save the value as xsd:dateTime, it should have a timezone specified
            //
            //For more details about the formats use by xsd:time, xsd:date and xsd:dateTime, see these:
            // https://www.w3.org/TR/xmlschema-2/#time
            // https://www.w3.org/TR/xmlschema-2/#date
            // https://www.w3.org/TR/xmlschema-2/#dateTime
            if (newValue && newValue != '') {

                //first of all, we need to decide if we're dealing with a time, a date or a dateTime
                //what comes in is the value as returned by the widget, so we try to detect as general as possible
                //See for details: https://github.com/moment/moment/issues/2397
                var momentFormat = null;
                switch (dateTimeEnum) {
                    case DATE_TIME_ENUM_DATE:
                        momentFormat = 'YYYY-MM-DD';
                        break;
                    case DATE_TIME_ENUM_TIME:
                        momentFormat = 'HH:mm:ss';
                        break;
                    case DATE_TIME_ENUM_DATETIME:
                        momentFormat = moment.ISO_8601;
                        break;
                }

                //By default, moment parses and displays in local time. If you want to parse or display a moment in UTC,
                // you can use moment.utc() instead of moment()
                //Note that as specified in https://www.w3.org/TR/html-markup/references.html#refsRFC3339
                //the date/time coming back from the input widget should be ISO 8601 formatted
                //which is exactly the same standard as the one used by xsd:dateTime; https://www.w3.org/TR/xmlschema11-2/#dateTime
                var val = null;
                var gmt = forceGmt || _this._isGmtSelected(propElement);
                if (gmt) {
                    val = moment.utc(newValue, momentFormat);
                }
                else {
                    val = moment(newValue, momentFormat);
                }

                //sets the locale that is currently active (based on the URL)
                val.locale(DATE_TIME_LOCALE);

                //Set the user-friendly HTML
                var timezoneHtml = '';
                if (timezoneFormat != null) {
                    var timezone = val.format(timezoneFormat);
                    var timezoneInnerHtml = null;
                    if (val.utcOffset() == 0) {
                        timezoneInnerHtml = '(UTC)';
                    }
                    else {
                        timezoneInnerHtml = '(UTC' + timezone + ')';
                    }
                    timezoneHtml = '<span class="' + BlocksConstants.INPUT_TYPE_TIME_TZONE_CLASS + '">' + timezoneInnerHtml + '</span>';
                }
                propElement.html(val.format(dateTimeFormat) + timezoneHtml);

                //Set the @content value
                //Note that we save everything as UTC (important)
                propElement.attr(CONTENT_ATTR, val.utc().format(dateTimeValueFormat));
            }
            else {
                //don't remove the attr, set it to empty (or the help text in the HTML will end up as the value)
                propElement.attr(CONTENT_ATTR, '');
                propElement.html(defaultValue);
            }
        },
        /**
         * This filter pre-processes the value in the @content attribute before passing it to the datetime html widget
         * We need to chop off the timezone and set the GMT checkbox accordingly because the HTML widget doesn't support timezones
         */
        _dateTimeWidgetSetterFilterFunction: function (_this, propElement, contentValue, dateTimeValueFormat, dateTimeWidgetFormat, forceGmt)
        {
            var retVal = contentValue;

            if (contentValue) {
                //Note: we save all @content values as UTC, so the GMT flag should always be activated
                //However, by default, we choose not to activate it because it's easier for the user to
                //edit dateTimes in local time. Can be changed with the flag below though.
                var val = moment.utc(contentValue, dateTimeValueFormat);
                var gmt = forceGmt || _this._isGmtSelected(propElement);
                if (val.utcOffset() !== 0 || !gmt) {
                    //if the saved value is not UTC+0:00, we need to convert it
                    // to the local time zone to make correct adjustments, because
                    // by default (eg. when no GMT flag is on) moment parses and displays in local time.
                    if (gmt) {
                        //convert the val to GMT
                        val = val.utc();
                    }
                    else {
                        //convert the val to the local time zone
                        val = val.local();
                    }
                }
                else {
                    //NOOP
                }

                //the datetime widget expects the format to be without timezone (because it doesn't support it)
                retVal = val.format(dateTimeWidgetFormat);
            }

            return retVal;
        },
        _dateTimeExtraHtmlFunction: function (_this, inSidebar, propElement, valueTerm, updateCallback)
        {
            var label = "GMT/UTC?";
            if (inSidebar) {
                label = Commons.capitalize(valueTerm.label) + ' - ' + label;
            }

            var toggleButton = _this.createToggleButton(label,
                function initStateCallback()
                {
                    return _this._isGmtSelected(propElement);
                },
                function switchStateCallback(oldState, newState)
                {
                    propElement.attr(BlocksConstants.INPUT_TYPE_TIME_GMT_ATTR, newState ? BOOLEAN_ATTR_TRUE : BOOLEAN_ATTR_FALSE);

                    if (updateCallback) {
                        updateCallback();
                    }
                },
                BlocksMessages.toggleLabelYes,
                BlocksMessages.toggleLabelNo
            );

            //call it once during initializing, except when we're in the sidebar
            if (updateCallback && !inSidebar) {
                updateCallback();
            }

            return toggleButton;
        }

    })).register(this.TAGS);

}]);