/**
 * Created by bram on 24/02/16.
 */
base.plugin("blocks.imports.BlocksFactEntryText", ["base.core.Class", "blocks.imports.Text", "constants.blocks.core", "constants.blocks.imports.fact", function (Class, Text, BlocksConstants, FactConstants)
{
    var BlocksFactEntryText = this;
    this.TAGS = [
        //Note: we don't allow the user to edit the label of the property (but it works)
        //"blocks-fact-entry ."+BlocksConstants.FACT_ENTRY_NAME_CLASS,
        "blocks-fact-entry [data-property="+FactConstants.FACT_ENTRY_VALUE_PROPERTY+"] ."+BlocksConstants.INPUT_TYPE_EDITOR,
        "blocks-fact-entry [data-property="+FactConstants.FACT_ENTRY_VALUE_PROPERTY+"] ."+BlocksConstants.INPUT_TYPE_INLINE_EDITOR
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