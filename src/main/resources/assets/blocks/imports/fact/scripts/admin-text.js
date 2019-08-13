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
base.plugin("blocks.imports.FactEntryText", ["base.core.Class", "blocks.imports.Text", "blocks.core.MediumEditor", "constants.blocks.core", "constants.blocks.imports.fact", "constants.blocks.imports.text", function (Class, Text, MediumEditor, BlocksConstants, FactConstants, TextConstants)
{
    var BlocksFactEntryText = this;
    this.TAGS = [
        // Note: we don't allow the user to edit the label of the property (but it works)
        // "blocks-fact-entry ."+BlocksConstants.FACT_ENTRY_NAME_CLASS,

        // Instead of registering the editor property (which is messy because it's a property in a data-property),
        // we register the general outer property and initialize the editor selectively in the focus() callback below
        // "blocks-fact-entry [data-property=" + FactConstants.FACT_ENTRY_VALUE_PROPERTY + "] > ." + BlocksConstants.WIDGET_TYPE_EDITOR,
        // "blocks-fact-entry [data-property=" + FactConstants.FACT_ENTRY_VALUE_PROPERTY + "] > ." + BlocksConstants.WIDGET_TYPE_INLINE_EDITOR
        "blocks-fact-entry [data-property=" + FactConstants.FACT_ENTRY_VALUE_PROPERTY + "]"
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
            //Note: by adding the ">", we don't activate the editor for the editor widgets of object sub-properties (those are edited via the sidebar)
            var editorEl = element.find(
                ' > .' + BlocksConstants.WIDGET_TYPE_EDITOR + ',' +
                ' > .' + BlocksConstants.WIDGET_TYPE_INLINE_EDITOR
            );

            if (editorEl.length > 0) {

                // before we call the superclass, we need to add the inline option here if it's the first time this is focused
                // because this callback is called before admin.js so the initialization in the superclass is right
                if (editorEl.hasClass(BlocksConstants.WIDGET_TYPE_INLINE_EDITOR)) {
                    editorEl.attr(TextConstants.OPTIONS_ATTR, TextConstants.OPTIONS_FORCE_INLINE + " " + TextConstants.OPTIONS_NO_TOOLBAR);
                }

                var retVal = BlocksFactEntryText.Class.Super.prototype.focus.call(this, block, editorEl, hotspot, event);

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
            }
            // actually, the superclass returns nothing at all,
            // but we return undefined because we also return something above
            else {
                return undefined;
            }
        },

        //-----PRIVATE METHODS-----

    })).register(this.TAGS);

}]);