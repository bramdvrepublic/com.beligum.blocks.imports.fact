package com.beligum.blocks.imports.fact;

import com.beligum.base.filesystem.ConstantsFileEntry;
import com.beligum.base.server.R;
import com.beligum.base.utils.Logger;
import com.beligum.blocks.config.Settings;
import com.beligum.blocks.config.WidgetType;
import com.beligum.blocks.index.ifaces.ResourceProxy;
import com.beligum.blocks.rdf.ifaces.RdfEndpoint;
import com.beligum.blocks.rdf.ifaces.RdfProperty;
import com.beligum.blocks.rdf.ontologies.RDF;
import com.beligum.blocks.serializing.AbstractBlockSerializer;
import com.beligum.blocks.templating.HtmlParser;
import com.beligum.blocks.templating.TagTemplate;
import com.beligum.blocks.utils.DurationTools;
import com.beligum.blocks.utils.NamedUri;
import gen.com.beligum.blocks.core.constants.blocks.core;
import gen.com.beligum.blocks.imports.fact.messages.blocks.imports.fact;
import org.apache.commons.lang.math.NumberUtils;
import org.apache.commons.lang3.StringUtils;
import org.jsoup.nodes.Element;

import java.awt.*;
import java.io.IOException;
import java.net.URI;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.time.temporal.TemporalAccessor;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;

import static com.beligum.blocks.templating.HtmlParser.NON_RDF_PROPERTY_ATTR;
import static gen.com.beligum.blocks.core.constants.blocks.core.*;
import static gen.com.beligum.blocks.imports.fact.constants.blocks.imports.fact.*;
import static gen.com.beligum.blocks.imports.fact.messages.blocks.imports.fact.Entries.*;
import static gen.com.beligum.blocks.imports.text.constants.blocks.imports.text.*;
import static java.time.ZoneOffset.UTC;

/**
 * Created by bram on Aug 19, 2019
 */
public class Serializer extends AbstractBlockSerializer
{
    //-----CONSTANTS-----

    //-----VARIABLES-----

    //-----CONSTRUCTORS-----

    //-----PUBLIC METHODS-----
    @Override
    public CharSequence toHtml(TagTemplate blockType, RdfProperty property, Locale language, ConstantsFileEntry[] classes, Map<String, String> styles, String value) throws IOException
    {
        return this.toHtml(blockType, property, language, classes, styles, value);
    }
    /**
     * Example HTML:
     *
     * <pre>
     *     <blocks-fact-entry>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_NAME_PROPERTY"> test editor </div>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_VALUE_PROPERTY">
     *             <div class="property editor" datatype="rdf:HTML" property="ror:testEditor">
     *                 <p>Blah, dit is <b>inhoud</b> van test editor</p>
     *             </div>
     *         </div>
     *     </blocks-fact-entry>
     *
     *     <blocks-fact-entry>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_NAME_PROPERTY"> test immutable </div>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_VALUE_PROPERTY">
     *             <div class="property immutable" datatype="xsd:int" content="36" property="ror:testImmutable"> 36 </div>
     *         </div>
     *     </blocks-fact-entry>
     *
     *     <blocks-fact-entry>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_NAME_PROPERTY"> test date </div>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_VALUE_PROPERTY">
     *             <div class="property date" datatype="xsd:date" content="2019-05-31" property="ror:testDate"> Friday May 31, 2019 </div>
     *         </div>
     *     </blocks-fact-entry>
     *
     *     <blocks-fact-entry>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_NAME_PROPERTY"> test enum </div>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_VALUE_PROPERTY">
     *             <div class="property enum" datatype="xsd:string" property="ror:testEnum" content="af"> Afrikaans </div>
     *         </div>
     *     </blocks-fact-entry>
     *
     *     <blocks-fact-entry>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_NAME_PROPERTY"> test resource </div>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_VALUE_PROPERTY">
     *             <div class="property resource" resource="/resource/Page/800895161299715471" property="ror:testResource"> <a href="/en/">The Republic</a> </div>
     *         </div>
     *     </blocks-fact-entry>
     *
     *     <blocks-fact-entry>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_NAME_PROPERTY"> test object </div>
     *         <div data-property="$CONSTANTS.blocks.imports.fact.FACT_ENTRY_VALUE_PROPERTY">
     *             <div class="property object" typeof="ror:SubPost" resource="/resource/1130494009577889453" property="ror:testObject">
     *                 <div class="main">
     *                     <label>label</label>
     *                     <div class="property inline-editor" property="rdfs:label"> Label of the object </div>
     *                 </div>
     *                 <div>
     *                     <label>text</label>
     *                     <div class="property editor" property="ror:text" datatype="rdf:HTML"> Example of some sub text </div>
     *                 </div>
     *                 <div>
     *                     <label>test number</label>
     *                     <div class="property number" property="ror:testNumber" datatype="xsd:int" content="4"> 4 </div>
     *                 </div>
     *                 <div>
     *                     <label>test date</label>
     *                     <div class="property date" property="ror:testDate" datatype="xsd:date" content="2019-05-10"> Friday May 10, 2019 </div>
     *                 </div>
     *                 <div>
     *                     <label>test immutable</label>
     *                     <div class="property immutable" property="ror:testImmutable" datatype="xsd:int" content="36"> 36 </div>
     *                 </div>
     *             </div>
     *         </div>
     *     </blocks-fact-entry>
     *
     * </pre>
     */
    public CharSequence toHtml(TagTemplate blockType, RdfProperty property, Locale language, ConstantsFileEntry[] classes, Map<String, String> styles, String value, RdfProperty previousProperty)
                    throws IOException
    {
        Element retVal = this.createTag(blockType, null, classes, styles);

        if (previousProperty != null && previousProperty.equals(property)) {
            retVal.addClass(FACT_ENTRY_DOUBLE_CLASS);
        }

        Element labelTag = this.createTag("div", new String[][] { { HtmlParser.NON_RDF_PROPERTY_ATTR, FACT_ENTRY_NAME_PROPERTY } })
                               .appendTo(retVal);

        Element valueTag = this.createTag("div", new String[][] { { HtmlParser.NON_RDF_PROPERTY_ATTR, FACT_ENTRY_VALUE_PROPERTY } })
                               .appendTo(retVal);

        Element propertyTag = this.createTag("div", FACT_ENTRY_PROPERTY_CLASS)
                                  .appendTo(valueTag);

        if (property == null) {
            labelTag.text(widgetEntryDefaultLabel.toString(language));
            propertyTag.text(widgetEntryPlaceholder.toString(language));
        }
        else {

            labelTag.text(property.getLabelMessage().toString(language));

            propertyTag.attr(HtmlParser.RDF_PROPERTY_ATTR, property.getCurie().toString());

            // mark this tag with the widget type
            propertyTag.addClass(property.getWidgetType().getConstant());

            // <div class="property editor" datatype="rdf:HTML" property="ror:testEditor">
            //     *                 <p>Blah, dit is <b>inhoud</b> van test editor</p>
            //     *             </div>
            // <div class="property date" datatype="xsd:date" content="2019-05-31" property="ror:testDate"> Friday May 31, 2019 </div>

            boolean isNumber = NumberUtils.isNumber(value);
            boolean addDataType = true;
            String content = null;
            ZoneId localZone = ZoneId.systemDefault();

            switch (property.getWidgetType()) {

                case Undefined:

                    // don't really know what to do here, so let's do nothing and log a warning
                    Logger.warn("Encountered '" + WidgetType.Undefined + "' widget type while serializing blocks-fact-entry block; this is probably not what you want; " + property);

                    break;

                case Immutable:

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        content = "";
                        propertyTag.html(immutableEntryPlaceholder.toString(language));
                    }
                    else {
                        // Note that we don't pass any data to the endpoint, it's pull-only
                        ResourceProxy immutableData = property.getEndpoint().getResource(property.getDataType(), null, language);

                        if (immutableData != null) {
                            if (immutableData.getResource() != null) {
                                content = immutableData.getResource();
                                propertyTag.html(immutableData.getResource());
                            }
                            // I guess it makes sense to reset the tag if the endpoint return null?
                            else {
                                //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                                content = "";
                                propertyTag.html(immutableEntryPlaceholder.toString(language));
                            }
                        }
                        else {
                            throw new IOException("Unable to find immutable value; " + value);
                        }
                    }

                    break;

                case Editor:

                    // note: the editor takes care of its own placeholder when the value is empty
                    propertyTag.html(value == null ? "" : value);

                    break;

                case InlineEditor:

                    // note: the editor takes care of its own placeholder when the value is empty
                    propertyTag.attr(OPTIONS_ATTR, OPTIONS_FORCE_INLINE + " " + OPTIONS_NO_TOOLBAR);
                    propertyTag.html(value == null ? "" : value);

                    break;

                case Enum:

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        content = "";
                        propertyTag.html(enumEntryPlaceholder.toString(language));
                    }
                    else {
                        // the value is an enum key that needs to be looked up for validation
                        String enumKey = value;

                        //note: contrary to the resource endpoint below, we want the endpoint of the property, not the class, so don't use property.getDataType().getEndpoint() here
                        Iterable<ResourceProxy> enumSuggestion = property.getEndpoint().search(property, enumKey, RdfEndpoint.QueryType.NAME, language, 1);
                        Iterator<ResourceProxy> iter = enumSuggestion.iterator();
                        if (iter.hasNext()) {
                            ResourceProxy enumValue = iter.next();
                            content = enumValue.getResource();
                            propertyTag.html(Serializer.serializeEnumHtml(enumValue).toString());
                        }
                        else {
                            throw new IOException("Unable to find enum value; " + enumKey);
                        }
                    }

                    break;

                case Boolean:

                    // note: there's no placeholder since there's always a value (because quietly is true)
                    content = Boolean.toString(Serializer.parseRdfaBoolean(value, true));

                    // Note: we just create a dummy inner <div>, rest is done in CSS, based on the content attribute
                    propertyTag.html("<div class=\"" + gen.com.beligum.blocks.core.constants.blocks.core.Entries.WIDGET_TYPE_BOOLEAN_VALUE_CLASS + "\" />");

                    break;

                case Number:

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        content = "";
                        propertyTag.html(numberEntryDefaultValue.toString(language));
                    }
                    else {
                        // let's support all numbers
                        if (NumberUtils.isNumber(value)) {
                            // this does some extra validation/parsing
                            content = NumberUtils.createNumber(value).toString();
                            propertyTag.html(content);
                        }
                        else {
                            throw new IOException("Encountered unsupported number string value; " + value);
                        }
                    }

                    break;

                case Date:

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        content = "";
                        propertyTag.html(dateEntryPlaceholder.toString(language));
                    }
                    else {
                        LocalDate dateValue;
                        if (isNumber) {
                            dateValue = this.epochToLocalDateTime(Long.parseLong(value)).toLocalDate();
                        }
                        else {
                            dateValue = LocalDate.parse(value);
                        }

                        // convert to UTC
                        TemporalAccessor utcDate = ZonedDateTime.ofInstant((dateValue).atStartOfDay(localZone).toInstant(), UTC);
                        propertyTag.attr(WIDGET_TYPE_TIME_GMT_ATTR, "false");

                        // Note: local because we only support timezones in dateTime
                        content = DateTimeFormatter.ISO_LOCAL_DATE.format(utcDate);
                        propertyTag.html(Serializer.serializeDateHtml(localZone, language, utcDate).toString());
                    }

                    break;

                case Time:

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        content = "";
                        propertyTag.html(timeEntryPlaceholder.toString(language));
                    }
                    else {
                        LocalTime timeValue;
                        if (isNumber) {
                            timeValue = this.epochToLocalDateTime(Long.parseLong(value)).toLocalTime();
                        }
                        else {
                            timeValue = LocalTime.parse(value);
                        }

                        // convert to UTC
                        TemporalAccessor utcTime = ZonedDateTime.ofInstant(ZonedDateTime.of(LocalDate.now(), timeValue, localZone).toInstant(), UTC);
                        propertyTag.attr(WIDGET_TYPE_TIME_GMT_ATTR, "false");

                        //Note: local because we only support timezones in dateTime
                        content = DateTimeFormatter.ISO_LOCAL_TIME.format(utcTime);
                        propertyTag.html(Serializer.serializeTimeHtml(localZone, language, utcTime).toString());
                    }

                    break;

                case DateTime:

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        content = "";
                        propertyTag.html(datetimeEntryPlaceholder.toString(language));
                    }
                    else {
                        LocalDateTime dateTimeValue;
                        if (isNumber) {
                            dateTimeValue = this.epochToLocalDateTime(Long.parseLong(value));
                        }
                        else {
                            dateTimeValue = LocalDateTime.parse(value);
                        }

                        ZonedDateTime utcDateTime = ZonedDateTime.ofInstant(ZonedDateTime.of(dateTimeValue, localZone).toInstant(), UTC);
                        propertyTag.attr(WIDGET_TYPE_TIME_GMT_ATTR, "false");

                        content = DateTimeFormatter.ISO_DATE_TIME.format(utcDateTime);
                        propertyTag.html(Serializer.serializeDateTimeHtml(localZone, language, utcDateTime).toString());
                    }

                    break;

                case Duration:

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        content = "";
                        propertyTag.html(durationEntryPlaceholder.toString(language));
                    }
                    else {
                        long durationValue = StringUtils.isEmpty(value) ? 0 : Long.parseLong(value);

                        if (durationValue >= 0) {

                            // Note that the duration is stored as milliseconds
                            Duration duration = Duration.ofMillis(durationValue);

                            if (property.getWidgetConfig() != null && property.getWidgetConfig().containsKey(core.Entries.WIDGET_CONFIG_DURATION_FORMAT)) {

                                long days = DurationTools.toDaysPart(duration);
                                int hours = DurationTools.toHoursPart(duration);
                                int minutes = DurationTools.toMinutesPart(duration);
                                int seconds = DurationTools.toSecondsPart(duration);
                                int millis = DurationTools.toMillisPart(duration);

                                StringBuilder htmlVal = new StringBuilder();
                                String format = property.getWidgetConfig().get(core.Entries.WIDGET_CONFIG_DURATION_FORMAT);
                                switch (format) {
                                    case WIDGET_CONFIG_DURATION_FORMAT_FULL:

                                        if (days > 0) {
                                            htmlVal.append(htmlVal.length() == 0 ? "" : ", ").append(days).append(" ")
                                                   .append(days == 1 ? durationEntryDayLabel.toString(language) : durationEntryDaysLabel.toString(language));
                                        }
                                        if (hours > 0) {
                                            htmlVal.append(htmlVal.length() == 0 ? "" : ", ").append(hours).append(" ")
                                                   .append(hours == 1 ? durationEntryHourLabel.toString(language) : durationEntryHoursLabel.toString(language));
                                        }
                                        if (minutes > 0) {
                                            htmlVal.append(htmlVal.length() == 0 ? "" : ", ").append(minutes).append(" ")
                                                   .append(minutes == 1 ? durationEntryMinuteLabel.toString(language) : durationEntryMinutesLabel.toString(language));
                                        }
                                        if (seconds > 0) {
                                            htmlVal.append(htmlVal.length() == 0 ? "" : ", ").append(seconds).append(" ")
                                                   .append(seconds == 1 ? durationEntrySecondLabel.toString(language) : durationEntrySecondsLabel.toString(language));
                                        }
                                        if (millis > 0) {
                                            htmlVal.append(htmlVal.length() == 0 ? "" : ", ").append(millis).append(" ")
                                                   .append(millis == 1 ? durationEntryMillisLabel.toString(language) : durationEntryMillisLabel.toString(language));
                                        }

                                        // note: we always at least set the seconds
                                        if (htmlVal.length() == 0) {
                                            htmlVal.append("0").append(durationEntrySecondsLabel.toString(language));
                                        }

                                        break;

                                    case WIDGET_CONFIG_DURATION_FORMAT_SHORT:

                                        // Example: 7.23:59:59.999

                                        if (days > 0) {
                                            htmlVal.append(days).append(".");
                                        }

                                        htmlVal.append(String.format("%02d", hours));
                                        htmlVal.append(String.format("%02d", minutes));
                                        htmlVal.append(String.format("%02d", seconds));

                                        if (millis > 0) {
                                            htmlVal.append(".").append(String.format("%03d", millis));
                                        }

                                        break;
                                    case WIDGET_CONFIG_DURATION_FORMAT_ISO:

                                        htmlVal.append(duration.toString());

                                        break;
                                    default:
                                        throw new IOException("Encountered unimplemented duration format, please fix this; " + format);
                                }

                                content = "" + durationValue;
                                propertyTag.html(htmlVal);
                            }
                            else {
                                throw new IOException("Encountered duration without a format configured; " + property);
                            }
                        }
                        else {
                            //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                            content = "";
                            propertyTag.html(durationEntryPlaceholder.toString(language));
                        }
                    }

                    break;

                case Timecode:

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        content = "";
                        propertyTag.html(timecodeEntryPlaceholder.toString(language));
                    }
                    else {
                        float timecodeValue = StringUtils.isEmpty(value) ? 0.0f : Float.parseFloat(value);

                        if (timecodeValue >= 0) {

                            int integerNumber = 0;
                            int fractionNumber = 0;
                            String[] fractions = ("" + timecodeValue).split(".");
                            integerNumber = Integer.parseInt(fractions[0], 10);
                            if (fractions.length > 1) {
                                fractionNumber = Integer.parseInt(fractions[1], 10);
                            }

                            // Note that the timecode is stored as seconds
                            Duration duration = Duration.ofSeconds(integerNumber);

                            StringBuilder htmlVal = new StringBuilder();

                            long days = DurationTools.toDaysPart(duration);
                            int hours = DurationTools.toHoursPart(duration);
                            int minutes = DurationTools.toMinutesPart(duration);
                            int seconds = DurationTools.toSecondsPart(duration);
                            int millis = DurationTools.toMillisPart(duration);

                            htmlVal.append(String.format("%02d", hours));
                            htmlVal.append(String.format("%02d", minutes));
                            htmlVal.append(String.format("%02d", seconds));
                            // note: the precision of the stored value is 3, but we'll display them as 2
                            // because it matches SMPTE time code formatting. We only use 3 to store the value
                            // in order to be able to change this for future use without updating all stored values
                            htmlVal.append(":").append(String.format("%02d", fractionNumber));

                            content = "" + timecodeValue;
                            propertyTag.html(htmlVal);

                        }
                        else {
                            //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                            content = "";
                            propertyTag.html(timecodeEntryPlaceholder.toString(language));
                        }
                    }

                    break;

                case Color:

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        content = "";
                        propertyTag.html(colorEntryPlaceholder.toString(language));
                    }
                    else {
                        content = "#" + Integer.toHexString((Color.decode(value)).getRGB()).substring(2);
                        propertyTag.html("<div class=\"" + gen.com.beligum.blocks.core.constants.blocks.core.Entries.WIDGET_TYPE_COLOR_VALUE_CLASS.getValue() + "\"" +
                                         " style=\"background-color: " + content + "\"></div>");
                    }

                    break;

                case Uri:

                    addDataType = false;

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        propertyTag.attr(HtmlParser.RDF_RESOURCE_ATTR, "");
                        propertyTag.html(uriEntryDefaultValue.toString(language));
                    }
                    else {
                        NamedUri uriValue = new NamedUri(value);

                        // We need to also add the hyperlink href as a property-value, because when we wrap the <a> tag with a <div property=""> tag,
                        // the content of the property tag (eg. the entire <a> tag) gets serialized by the RDFa parser as a I18N-string, using the human readable
                        // text of the hyperlink as a value (instead of using the href value and serializing it as a URI). This is because the property attribute is set on the
                        // wrapping <div> instead of on the <a> tag.
                        //Note: from the RDFa docs: "@content is used to indicate the value of a plain literal", and since it's a URI, we add it as a resource value
                        propertyTag.attr(HtmlParser.RDF_RESOURCE_ATTR, uriValue.getUri().toString())
                                   .html(uriValue.hasName() ? uriValue.getName() : uriValue.getUri().toString())
                                   .appendTo(propertyTag);

                        Element uriTag = this.createTag("a", new String[][] { { "href", uriValue.getUri().toString() } });
                        if (uriValue.getUri().isAbsolute()) {
                            uriTag.attr("target", "_blank");
                        }
                    }

                    break;

                case Resource:

                    addDataType = false;

                    if (value == null) {
                        //don't remove the attr, set it to empty (or the placeholder will end up as the value)
                        propertyTag.attr(HtmlParser.RDF_RESOURCE_ATTR, "");
                        propertyTag.html(uriEntryDefaultValue.toString(language));
                    }
                    else {
                        URI resourceValue;

                        // if the value is an absolute URI or a relative resource string, parse it directly
                        if (value.startsWith("http") || value.startsWith(Settings.RESOURCE_ENDPOINT)) {
                            resourceValue = URI.create(value);
                        }
                        // otherwise, we expect the value to be a search string and we need to query the endpoint to find a resource URI
                        else {
                            // I think it's better to use a true query-like search, so we can add more liberties (eg. specify "Loenhout,Belgium" instead of "Loenhout" and hope for the best)
                            RdfEndpoint.QueryType queryType = RdfEndpoint.QueryType.FULL;

                            // Extra wrapper around this part because it might call a remote API and the return values (eg. 404) can be mixed up
                            // with the return values of this endpoint. By wrapping it in a different try-catch, we get extra logging if something goes wrong.
                            try {
                                Iterable<ResourceProxy> searchSuggestions = property.getDataType().getEndpoint().search(property.getDataType(), value, queryType, language, 1);
                                Iterator<ResourceProxy> iter = searchSuggestions.iterator();
                                if (iter.hasNext()) {
                                    resourceValue = URI.create(iter.next().getResource());
                                }
                                else {
                                    throw new IOException("Unable to find a resource of type " + property.getDataType() + " for input '" + value +
                                                          "', please fix this (eg. with filters) or you'll end up with empty fields");
                                }
                            }
                            catch (Exception e) {
                                throw new IOException("Error happened while looking up resource during import of " + property + "; " + value, e);
                            }
                        }

                        // contact the endpoint to get more metadata information about the resource
                        ResourceProxy resourceInfo = property.getDataType().getEndpoint().getResource(property.getDataType(), resourceValue, language);
                        if (resourceInfo != null) {
                            propertyTag.attr(HtmlParser.RDF_RESOURCE_ATTR, resourceInfo.getResource())
                                       .html(Serializer.serializeResourceHtml(property, resourceInfo).toString())
                                       .appendTo(propertyTag);
                        }
                        else {
                            throw new IOException("Unable to find resource; " + resourceValue);
                        }
                    }

                    break;

                case Object:

                    // TODO

                    addDataType = false;
                    // typeof

                    break;

                default:
                    throw new IOException("Encountered unimplemented widget type, please fix this; " + property.getWidgetType());
            }

            //see the comments in blocks-fact-entry.js and RDF.LANGSTRING for why we remove the datatype in case of a rdf:langString
            if (property.getDataType().equals(RDF.langString)) {
                addDataType = false;
            }
            if (addDataType) {
                propertyTag.attr(HtmlParser.RDF_DATATYPE_ATTR, property.getDataType().getCurie().toString());
            }

            if (content != null) {
                propertyTag.attr(HtmlParser.RDF_CONTENT_ATTR, content);
            }

        }

        return retVal.outerHtml();
    }

    //-----PUBLIC UTILITY METHODS-----
    /**
     * Same as parseRdfaBoolean() below, but with quietly set to false
     */
    public static boolean parseRdfaBoolean(String value) throws IOException
    {
        return parseRdfaBoolean(value, false);
    }
    /**
     * Standard boolean parsing is too restrictive.
     * The last flag decides if the method throws an error if invalid values are passed, or just returns false.
     */
    public static boolean parseRdfaBoolean(String value, boolean quietly) throws IOException
    {
        Boolean retval = false;

        if (quietly) {
            // note: null values will not enter here
            if ("1".equalsIgnoreCase(value) || "yes".equalsIgnoreCase(value) ||
                "true".equalsIgnoreCase(value) || "on".equalsIgnoreCase(value)) {
                retval = Boolean.TRUE;
            }
        }

        if (!retval && !quietly) {
            if (!("0".equalsIgnoreCase(value) || "no".equalsIgnoreCase(value) ||
                  "false".equalsIgnoreCase(value) || "off".equalsIgnoreCase(value))) {
                throw new IOException("Encountered unsupported boolean string value; " + value);
            }
        }

        return retval;
    }
    /**
     * Generate a RDFa-compatible HTML string from the supplied date
     * See https://docs.oracle.com/javase/8/docs/api/java/time/format/DateTimeFormatter.html
     * eg. Wednesday September 4 1986
     */
    public static CharSequence serializeDateHtml(ZoneId zone, Locale language, TemporalAccessor utcDateTime)
    {
        return new StringBuilder()
                        .append(DateTimeFormatter.ofPattern("cccc").withZone(zone).withLocale(language).format(utcDateTime))
                        .append(" ")
                        .append(DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG).withZone(zone).withLocale(language).format(utcDateTime));
    }

    /**
     * Generate a RDFa-compatible HTML string from the supplied time
     * eg. 1:00 AM<span class=\"timezone\">(UTC+01:00)</span>
     */
    public static CharSequence serializeTimeHtml(ZoneId zone, Locale language, TemporalAccessor utcTime)
    {
        StringBuilder retVal = new StringBuilder();

        retVal.append(DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT).withZone(zone).withLocale(language).format(utcTime));

        retVal.append(serializeTimezoneSuffixHtml(zone, language, utcTime));

        return retVal;
    }

    /**
     * Generate a RDFa-compatible HTML string from the supplied date and time
     * eg. Friday January 1, 2016 - 1:00 AM<span class=\"timezone\">(UTC+01:00)</span>
     */
    public static CharSequence serializeDateTimeHtml(ZoneId zone, Locale language, TemporalAccessor utcDateTime)
    {
        StringBuilder retVal = new StringBuilder();

        retVal.append(DateTimeFormatter.ofPattern("cccc").withZone(zone).withLocale(language).format(utcDateTime));
        retVal.append(" ");
        retVal.append(DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG).withZone(zone).withLocale(language).format(utcDateTime));
        retVal.append(" - ");
        retVal.append(DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT).withZone(zone).withLocale(language).format(utcDateTime));

        retVal.append(serializeTimezoneSuffixHtml(zone, language, utcDateTime));

        return retVal;
    }

    /**
     * Generate a RDFa-compatible HTML string from the supplied time
     */
    public static CharSequence serializeTimezoneSuffixHtml(ZoneId zone, Locale language, TemporalAccessor value)
    {
        StringBuilder retVal = new StringBuilder();

        retVal.append("<span class=\"").append(WIDGET_TYPE_TIME_TZONE_CLASS).append("\">(UTC");
        if (zone.getId().equals(UTC.getId())) {
            retVal.append("(UTC)");
        }
        else {
            retVal.append(DateTimeFormatter.ofPattern("xxxxx").withZone(zone).withLocale(language).format(value)).append(")");
        }
        retVal.append(")</span>");

        return retVal;
    }

    /**
     * Generate a RDFa-compatible HTML string from the supplied enum.
     */
    public static CharSequence serializeEnumHtml(ResourceProxy enumValue)
    {
        return enumValue.getLabel();
    }
    /**
     * Generate a RDFa-compatible (inner) HTML string from the supplied resource info
     */
    public static CharSequence serializeResourceHtml(RdfProperty rdfProperty, ResourceProxy resourceProxy)
    {
        CharSequence retVal = null;

        StringBuilder labelHtml = new StringBuilder();
        labelHtml.append(resourceProxy.getLabel());
        boolean disableImg = false;
        if (rdfProperty.getWidgetConfig() != null && rdfProperty.getWidgetConfig().containsKey(core.Entries.WIDGET_CONFIG_RESOURCE_ENABLE_IMG)) {
            disableImg = !Boolean.valueOf(rdfProperty.getWidgetConfig().get(core.Entries.WIDGET_CONFIG_RESOURCE_ENABLE_IMG));
        }
        if (resourceProxy.getImage() != null && !disableImg) {
            //note that alt is mandatory, but title provides a nice tooltip when hovering
            labelHtml.append("<img src=\"").append(resourceProxy.getImage()).append("\" alt=\"").append(resourceProxy.getLabel()).append("\" title=\"").append(resourceProxy.getLabel()).append("\">");
        }

        boolean disableHref = false;
        if (rdfProperty.getWidgetConfig() != null && rdfProperty.getWidgetConfig().containsKey(core.Entries.WIDGET_CONFIG_RESOURCE_ENABLE_HREF)) {
            disableHref = !Boolean.valueOf(rdfProperty.getWidgetConfig().get(core.Entries.WIDGET_CONFIG_RESOURCE_ENABLE_HREF));
        }
        if (resourceProxy.getUri() != null && !disableHref) {
            StringBuilder linkTag = new StringBuilder();
            linkTag.append("<a href=\"").append(resourceProxy.getUri()).append("\"");
            if (resourceProxy.isExternal() || resourceProxy.getUri().isAbsolute()) {
                linkTag.append(" target=\"_blank\"");
            }
            linkTag.append(">").append(labelHtml).append("</a>");

            retVal = linkTag;
        }
        else {
            retVal = labelHtml;
        }

        return retVal;
    }

    //-----PROTECTED METHODS-----

    //-----PRIVATE METHODS-----
    /**
     * Obtains an instance of Instant using seconds from the epoch of 1970-01-01T00:00:00Z using the default local time zone.
     * The nanosecond field is set to zero.
     */
    private LocalDateTime epochToLocalDateTime(long seconds)
    {
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(seconds), ZoneId.systemDefault());
    }
}
