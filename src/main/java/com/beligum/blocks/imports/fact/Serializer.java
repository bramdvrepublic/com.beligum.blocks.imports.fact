package com.beligum.blocks.imports.fact;

import com.beligum.base.server.R;
import com.beligum.blocks.config.Settings;
import com.beligum.blocks.index.ifaces.ResourceProxy;
import com.beligum.blocks.rdf.ifaces.RdfEndpoint;
import com.beligum.blocks.rdf.ifaces.RdfProperty;
import com.beligum.blocks.rdf.ontologies.RDF;
import com.beligum.blocks.serializing.AbstractBlockSerializer;
import com.beligum.blocks.serializing.BlockSerializer;
import com.beligum.blocks.templating.TagTemplate;
import com.beligum.blocks.utils.NamedUri;
import com.beligum.blocks.utils.RdfTools;
import gen.com.beligum.blocks.core.constants.blocks.core;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.math.NumberUtils;

import java.awt.*;
import java.io.IOException;
import java.net.URI;
import java.text.ParseException;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.time.temporal.TemporalAccessor;
import java.util.Iterator;
import java.util.Locale;

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
    public CharSequence toHtml(TagTemplate blockType, RdfProperty property, Locale language, String value) throws IOException
    {


        return null;
    }

    //-----PROTECTED METHODS-----

    //-----PRIVATE METHODS-----

}
