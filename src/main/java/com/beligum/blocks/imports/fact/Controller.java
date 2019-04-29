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

package com.beligum.blocks.imports.fact;

import com.beligum.base.resources.ifaces.Source;
import com.beligum.base.server.R;
import com.beligum.base.templating.ifaces.TemplateContext;
import com.beligum.blocks.config.WidgetType;
import com.beligum.blocks.index.ifaces.ResourceProxy;
import com.beligum.blocks.rdf.RdfFactory;
import com.beligum.blocks.rdf.ifaces.RdfEndpoint;
import com.beligum.blocks.rdf.ifaces.RdfProperty;
import com.beligum.blocks.templating.blocks.DefaultTemplateController;
import com.beligum.blocks.templating.blocks.HtmlParser;
import com.beligum.blocks.templating.blocks.HtmlTemplate;
import com.beligum.blocks.utils.RdfTools;
import gen.com.beligum.blocks.imports.fact.constants.blocks.imports.fact;
import net.htmlparser.jericho.*;
import org.apache.commons.lang.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAccessor;
import java.util.*;

import static com.beligum.blocks.templating.blocks.HtmlParser.RDF_CONTENT_ATTR;
import static com.beligum.blocks.templating.blocks.HtmlParser.RDF_RESOURCE_ATTR;
import static gen.com.beligum.blocks.core.constants.blocks.core.INPUT_TYPE_TIME_GMT_ATTR;
import static java.time.ZoneOffset.UTC;

/**
 * Created by bram on 2/3/17.
 */
public class Controller extends DefaultTemplateController
{
    //-----CONSTANTS-----

    //-----VARIABLES-----

    //-----CONSTRUCTORS-----

    //-----PUBLIC METHODS-----
    @Override
    public void created()
    {
    }
    @Override
    public void prepareForSave(Source source, Element element, OutputDocument htmlOutput)
    {
        this.normalizeLabel(source, element, htmlOutput);

        this.parseSubresources(source, element, htmlOutput, false);
    }
    /**
     * Note that we could actually only normalize during save, because a new page should be rendered out correctly
     * if the fact entry was normalized during save. But by doing it just before a copy, we are backwards compatible.
     */
    @Override
    public void prepareForCopy(Source source, Element element, OutputDocument htmlOutput, URI targetUri, Locale targetLanguage) throws IOException
    {
        this.normalizeLabel(source, element, htmlOutput);

        //Note that this must come before the stripping of the resource attributes see parseSubresources()
        //because of the "resource != null" check in the body of translateValue()
        if (!source.getLanguage().equals(targetLanguage)) {
            this.translateValue(source, element, htmlOutput, targetLanguage);
        }

        //remove sub-resource URIs (they will get re-created on first save)
        this.parseSubresources(source, element, htmlOutput, true);
    }

    //-----PROTECTED METHODS-----

    //-----PRIVATE METHODS-----
    /**
     * When we copy/save a page with fiche entries, the labels of the entries will have changed using javascript, so we don't have a template-safe way of
     * normalizing them back to variables (only the default placeholder of the label tag will be normalized back to it's template variable).
     * So every time a template element comes in, we need to search for the label and normalize it back to it's template variable, based on
     * the currently set resource type label.
     */
    private void normalizeLabel(Source source, Element element, OutputDocument htmlOutput)
    {
        Element propertyEl = element.getFirstElementByClass(fact.FACT_ENTRY_PROPERTY_CLASS);
        if (propertyEl != null) {
            String resourceType = HtmlTemplate.getPropertyAttribute(propertyEl.getStartTag());
            if (!StringUtils.isEmpty(resourceType)) {
                RdfProperty rdfProperty = RdfFactory.getProperty(resourceType);
                if (rdfProperty != null) {
                    Element labelEl = element.getFirstElement(HtmlParser.NON_RDF_PROPERTY_ATTR, fact.FACT_ENTRY_NAME_PROPERTY, false);
                    if (labelEl != null) {
                        String testLabel = R.i18n().get(rdfProperty.getLabelMessage(), source.getLanguage());

                        Iterator<Segment> labelContentIter = labelEl.getNodeIterator();
                        while (labelContentIter.hasNext()) {
                            Segment labelContent = labelContentIter.next();
                            //if we're dealing with a content tag (eg. no start or end tag), we check if we need to replace the stringified
                            // label by it's message
                            if (!(labelContent instanceof StartTag) && !(labelContent instanceof EndTag)) {
                                String label = labelContent.toString().trim();
                                if (label.equals(testLabel)) {
                                    String variable = new StringBuilder().append(R.resourceManager().getTemplateEngine().getVariablePrefix())
                                                                         .append(TemplateContext.InternalProperties.MESSAGES.name())
                                                                         .append(R.resourceManager().getTemplateEngine().getPathSeparator())
                                                                         .append(rdfProperty.getLabelKey())
                                                                         .toString();
                                    htmlOutput.replace(labelContent, variable);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    /**
     * When we copy a page with fiche entries, some of the values of the entries have been set during creation and in a specified language.
     * We might want to re-read them to eg. set the name of the link to a translated value.
     */
    private void translateValue(Source source, Element element, OutputDocument htmlOutput, Locale toLanguage) throws IOException
    {
        Element propertyEl = element.getFirstElementByClass(fact.FACT_ENTRY_PROPERTY_CLASS);
        if (propertyEl != null) {
            String resourceType = HtmlTemplate.getPropertyAttribute(propertyEl.getStartTag());
            if (!StringUtils.isEmpty(resourceType)) {
                RdfProperty rdfProperty = RdfFactory.getProperty(resourceType);
                if (rdfProperty != null) {

                    String content = propertyEl.getAttributeValue(RDF_CONTENT_ATTR);
                    String resource = propertyEl.getAttributeValue(RDF_RESOURCE_ATTR);
                    if (content != null || resource != null) {

                        switch (rdfProperty.getWidgetType()) {
                            case Editor:
                            case InlineEditor:
                            case Boolean:
                            case Number:
                            case Color:
                            case Uri:
                                break;
                            case Date:
                            case Time:
                            case DateTime:
                                //note that the value is always stored in UTC zone (so the zone of this ZonedDateTime below should always be UTC)
                                TemporalAccessor value = DateTimeFormatter.ISO_DATE_TIME.parse(content);
                                //this flag only controls how the value above is rendered out to the html, not how it's stored
                                ZoneId zone = RdfTools.parseRdfaBoolean(propertyEl.getAttributeValue(INPUT_TYPE_TIME_GMT_ATTR)) ? UTC : ZoneId.systemDefault();

                                switch (rdfProperty.getWidgetType()) {
                                    case Date:
                                        htmlOutput.replace(propertyEl.getContent(), RdfTools.serializeDateHtml(zone, toLanguage, value));
                                        break;
                                    case Time:
                                        htmlOutput.replace(propertyEl.getContent(), RdfTools.serializeTimeHtml(zone, toLanguage, value));
                                        break;
                                    case DateTime:
                                        htmlOutput.replace(propertyEl.getContent(), RdfTools.serializeDateTimeHtml(zone, toLanguage, value));
                                        break;
                                }

                                break;

                            case Enum:

                                //note: contrary to the resource endpoint below, we want the endpoint of the property, not the class, so don't use property.getDataType().getEndpoint() here
                                Iterable<ResourceProxy> enumSuggestion = rdfProperty.getEndpoint().search(rdfProperty, content, RdfEndpoint.QueryType.NAME, toLanguage, 1);
                                Iterator<ResourceProxy> iter = enumSuggestion.iterator();
                                if (iter.hasNext()) {
                                    htmlOutput.replace(propertyEl.getContent(), RdfTools.serializeEnumHtml(iter.next()));
                                }

                                break;

                            case Resource:

                                ResourceProxy resourceInfo = rdfProperty.getDataType().getEndpoint().getResource(rdfProperty.getDataType(), URI.create(resource), toLanguage);
                                if (resourceInfo != null) {
                                    htmlOutput.replace(propertyEl.getContent(), RdfTools.serializeResourceHtml(resourceInfo));
                                }

                                break;

                            //A little note: since all information about the resource is embedded in the widget itself,
                            //we need to call this method recursively on all sub-properties to translate an object.
                            case Object:
                                //the immediate children of the property element are the containers for the label+property
                                //of the sub-properties
                                List<Element> subPropertyContainers = propertyEl.getChildElements();
                                for (Element subPropertyContainer : subPropertyContainers) {
                                    this.translateValue(source, subPropertyContainer, htmlOutput, toLanguage);
                                }

                                break;

                            default:
                                throw new IOException("Encountered unimplemented widget type parser, please fix; " + rdfProperty.getWidgetType());
                        }
                    }
                }
            }
        }
    }
    /**
     * This will add a new or remove and existing @resource attribute of all sub-resources.
     * If removeResources is true, the attribute is cleared, otherwise, it's instantiated (when it doesn't exist)
     */
    private void parseSubresources(Source source, Element element, OutputDocument htmlOutput, boolean removeResources)
    {
        Element propertyEl = element.getFirstElementByClass(fact.FACT_ENTRY_PROPERTY_CLASS);
        if (propertyEl != null) {
            String resourceType = HtmlTemplate.getPropertyAttribute(propertyEl.getStartTag());
            if (!StringUtils.isEmpty(resourceType)) {
                RdfProperty rdfProperty = RdfFactory.getProperty(resourceType);
                if (rdfProperty != null) {

                    //an object without a resource URI is newly instantiated and needs a newly generated resource URI
                    Attributes attributes = propertyEl.getAttributes();
                    Attribute resourceAttr = attributes.get(RDF_RESOURCE_ATTR);
                    if (rdfProperty.getWidgetType().equals(WidgetType.Object)) {
                        //remove existing attributes
                        if (removeResources) {
                            if (resourceAttr != null) {
                                Map<String, String> newAttributes = htmlOutput.replace(attributes, false);
                                newAttributes.remove(RDF_RESOURCE_ATTR);
                            }
                        }
                        //create and init the attribute if it doesn't exist
                        else {
                            if (resourceAttr == null || StringUtils.isEmpty(resourceAttr.getValue())) {
                                Map<String, String> newAttributes = htmlOutput.replace(attributes, false);
                                //note that since the @about attribute of pages is relative, we also keep this relative
                                newAttributes.put(RDF_RESOURCE_ATTR, RdfTools.createRelativeResourceId(rdfProperty).toString());
                            }
                        }
                    }
                }
            }
        }
    }
}
