import React, { JSX, useCallback } from "react";
import { ArrowLeft, ArrowRight, Trash } from "@phosphor-icons/react";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react";

import { MenuProps, ShouldShowProps } from "../../../../components/menus/types";
import * as PopoverMenu from "../../../../components/ui/popover-menu";
import { Toolbar } from "../../../../components/ui/toolbar";
import { isColumnGripSelected } from "./utils";

export const TableColumnMenu = React.memo(
  ({ editor, appendTo }: MenuProps): JSX.Element => {
    const shouldShow = useCallback(
      ({ view, state, from }: ShouldShowProps) => {
        if (!state) {
          return false;
        }

        return isColumnGripSelected({ editor, view, state, from: from || 0 });
      },
      [editor]
    );

    const onAddColumnBefore = useCallback(() => {
      editor.chain().focus().addColumnBefore().run();
    }, [editor]);

    const onAddColumnAfter = useCallback(() => {
      editor.chain().focus().addColumnAfter().run();
    }, [editor]);

    const onDeleteColumn = useCallback(() => {
      editor.chain().focus().deleteColumn().run();
    }, [editor]);

    const onDeleteTable = useCallback(() => {
      editor.chain().focus().deleteTable().run();
    }, [editor]);

    return (
      <BaseBubbleMenu
        editor={editor}
        pluginKey="tableColumnMenu"
        updateDelay={0}
        tippyOptions={{
          appendTo: () => {
            return appendTo?.current;
          },
          offset: [0, 15],
          popperOptions: {
            modifiers: [{ name: "flip", enabled: false }]
          }
        }}
        shouldShow={shouldShow}
      >
        <Toolbar.Wrapper isVertical>
          <PopoverMenu.Item
            // @ts-expect-error
            iconComponent={<ArrowLeft />}
            close={false}
            label="Add column before"
            onClick={onAddColumnBefore}
          />
          <PopoverMenu.Item
            // @ts-expect-error
            iconComponent={<ArrowRight />}
            close={false}
            label="Add column after"
            onClick={onAddColumnAfter}
          />
          <PopoverMenu.Item
            // @ts-expect-error
            iconComponent={<Trash className="text-red-500" />}
            close={false}
            label="Delete column"
            onClick={onDeleteColumn}
          />
          <PopoverMenu.Item
            // @ts-expect-error
            iconComponent={<Trash className="text-red-500" />}
            close={false}
            label="Delete table"
            onClick={onDeleteTable}
          />
        </Toolbar.Wrapper>
      </BaseBubbleMenu>
    );
  }
);

TableColumnMenu.displayName = "TableColumnMenu";

export default TableColumnMenu;
