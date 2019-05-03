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
base.plugin("blocks.imports.FactEntryText", ["base.core.Class", "blocks.imports.Text", "blocks.core.MediumEditor", "constants.blocks.core", "constants.blocks.imports.fact", function (Class, Text, MediumEditor, BlocksConstants, FactConstants)
{
    var BlocksFactEntryText = this;
    this.TAGS = [
        //Note: we don't allow the user to edit the label of the property (but it works)
        //"blocks-fact-entry ."+BlocksConstants.FACT_ENTRY_NAME_CLASS,
        //Note: by adding the ">", we don't activate the editor for the editor widgets of object sub-properties (those are edited via the sidebar)
        "blocks-fact-entry [data-property=" + FactConstants.FACT_ENTRY_VALUE_PROPERTY + "] > ." + BlocksConstants.WIDGET_TYPE_EDITOR,
        "blocks-fact-entry [data-property=" + FactConstants.FACT_ENTRY_VALUE_PROPERTY + "] > ." + BlocksConstants.WIDGET_TYPE_INLINE_EDITOR
    ];

    (this.Class = Class.create(Text.Class, {

        //-----VARIABLES-----

        //-----CONSTRUCTORS-----
        constructor: function ()
        {
            BlocksFactEntryText.Class.Super.call(this);
        },

        //-----IMPLEMENTED METHODS-----
        focus: function (block, element, hotspot, event)
        {
            var retVal = BlocksFactEntryText.Class.Super.prototype.focus.call(this, block, element, hotspot, event);

            // It makes sense to select all text in the fact block when we gain focus,
            // so the user can type right away to replace the content
            // Note: don't do this if the editor is empty, it looks weird to have no cursor, but a small stripe selected instead
            if (element.text().trim().length !== 0) {
                MediumEditor.selectAllContents();
            }

            // This aligns the toolbar with the overlay of the fact block,
            // which actually aligns it all the way to the left, while the value will
            // probably be on the right. This alters the toolbar anchor element.
            // var editorToolbar = Editor.getActiveToolbar();
            // editorToolbar.anchorElement = element;
            // editorToolbar.setToolbarPosition();

            return retVal;
        },
        getConfigs: function (block, element)
        {
            return BlocksFactEntryText.Class.Super.prototype.getConfigs.call(this, block, element);
        },

        //-----PRIVATE METHODS-----

    })).register(this.TAGS);

}]);