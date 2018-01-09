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
 * Created by bram on 24/02/16.
 */
base.plugin("blocks.imports.FactEntryText", ["base.core.Class", "blocks.imports.Text", "constants.blocks.core", "constants.blocks.imports.fact", function (Class, Text, BlocksConstants, FactConstants)
{
    var BlocksFactEntryText = this;
    this.TAGS = [
        //Note: we don't allow the user to edit the label of the property (but it works)
        //"blocks-fact-entry ."+BlocksConstants.FACT_ENTRY_NAME_CLASS,
        //Note: by adding the ">", we don't activate the editor for the editor widgets of object sub-properties (those are edited via the sidebar)
        "blocks-fact-entry [data-property=" + FactConstants.FACT_ENTRY_VALUE_PROPERTY + "] > ." + BlocksConstants.INPUT_TYPE_EDITOR,
        "blocks-fact-entry [data-property=" + FactConstants.FACT_ENTRY_VALUE_PROPERTY + "] > ." + BlocksConstants.INPUT_TYPE_INLINE_EDITOR
    ];

    (this.Class = Class.create(Text.Class, {

        //-----VARIABLES-----

        //-----CONSTRUCTORS-----
        constructor: function ()
        {
            BlocksFactEntryText.Class.Super.call(this);
        },

        //-----IMPLEMENTED METHODS-----
        getConfigs: function (block, element)
        {
            return BlocksFactEntryText.Class.Super.prototype.getConfigs.call(this, block, element);
        },

        //-----PRIVATE METHODS-----

    })).register(this.TAGS);

}]);