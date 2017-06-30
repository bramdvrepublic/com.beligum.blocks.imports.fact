package com.beligum.blocks.imports.fact.utils;

import com.beligum.blocks.rdf.ifaces.RdfDefaultValue;

/**
 * Created by Bram on 29/06/17.
 */
public class StaticDefaultValue implements RdfDefaultValue
{

    private Object value;

    public StaticDefaultValue(Object value)
    {
        this.value = value;
    }

    @Override
    public String getValue()
    {
        return this.value == null ? null: this.value.toString();
    }
}
