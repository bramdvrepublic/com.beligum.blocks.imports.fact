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

package com.beligum.blocks.imports.fact.config;

import com.beligum.blocks.imports.commons.config.AbstractImportsSettings;

/**
 * Created by bram on 12.06.17.
 */
public class Settings extends AbstractImportsSettings
{
    //-----CONSTANTS-----
    private static final String TAG_NAME = "blocks-fact-entry";
    private static final String COMMON_PREFIX = "blocks.imports.fact-entry";

    //-----VARIABLES-----
    private static Settings instance;

    //-----CONSTRUCTORS-----
    private Settings()
    {
        super(COMMON_PREFIX, TAG_NAME);
    }
    public static Settings instance()
    {
        if (Settings.instance == null) {
            Settings.instance = new Settings();
        }
        return Settings.instance;
    }

    //-----PUBLIC METHODS-----

    //-----PROTECTED METHODS-----

    //-----PRIVATE METHODS-----
}
