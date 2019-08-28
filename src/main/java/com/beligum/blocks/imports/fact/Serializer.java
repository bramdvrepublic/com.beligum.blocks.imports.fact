package com.beligum.blocks.imports.fact;

import com.beligum.base.filesystem.ConstantsFileEntry;
import com.beligum.blocks.rdf.ifaces.RdfProperty;
import com.beligum.blocks.serializing.AbstractBlockSerializer;
import com.beligum.blocks.templating.TagTemplate;
import org.jsoup.nodes.Element;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;

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
        return this.toHtml(blockType, property, language, null, null, value);
    }
    /**
     * Example HTML:
     *
     * <pre>
     * <blocks-embed>
     *     <div data-property="$CONSTANTS.blocks.imports.embed.EMBED_PROPERTY_NAME"> <iframe width="1280" height="720" src="https://www.youtube.com/embed/lJIrF4YjHfQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe> </div>
     * </blocks-embed>
     * </pre>
     */
    public CharSequence toHtml(TagTemplate blockType, RdfProperty property, Locale language, ConstantsFileEntry[] classes, Map<String, String> styles, String html)
                    throws IOException
    {
        Element retVal = this.createTag(blockType, null, classes, styles);



        return retVal.outerHtml();
    }

    //-----PROTECTED METHODS-----

    //-----PRIVATE METHODS-----

}
