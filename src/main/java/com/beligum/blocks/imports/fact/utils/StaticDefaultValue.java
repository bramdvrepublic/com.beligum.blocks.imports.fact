package com.beligum.blocks.imports.fact.utils;

import com.beligum.blocks.rdf.ifaces.RdfDefaultValue;

/**
 * Created by Bram on 29/06/17.
 * <p>
 * Static default value. Intended to be either a String or a {@link com.beligum.base.filesystem.MessagesFileEntry}
 */
public class StaticDefaultValue implements RdfDefaultValue
{

    private Object value;

    public StaticDefaultValue(Object value)
    {
        this.value = value;
    }

    /**
     * @return default value or null if no default value is present
     */
    @Override
    public String getValue()
    {
        return this.value == null ? null : this.value.toString();
    }
}
