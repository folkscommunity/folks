import * as React from "react";
import { useCallback } from "react";
import {
  Columns as ColumnsIcon,
  ColumnsPlusLeft,
  ColumnsPlusRight,
  Trash
} from "@phosphor-icons/react";
import { BubbleMenu as BaseBubbleMenu, useEditorState } from "@tiptap/react";
import { sticky } from "tippy.js";

import { ColumnLayout } from ".";
import { MenuProps } from "../../components/menus/types";
import { Toolbar } from "../../components/ui/toolbar";
import { getRenderContainer } from "../../lib/getRenderContainer";

export const ColumnsMenu = ({ editor, appendTo }: MenuProps) => {
  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor, "columns");
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0);

    return rect;
  }, [editor]);

  const shouldShow = useCallback(() => {
    const isColumns = editor.isActive("columns");
    return isColumns;
  }, [editor]);

  const onColumnLeft = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.SidebarLeft).run();
  }, [editor]);

  const onColumnRight = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.SidebarRight).run();
  }, [editor]);

  const onColumnTwo = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.TwoColumn).run();
  }, [editor]);
  const { isColumnLeft, isColumnRight, isColumnTwo } = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        isColumnLeft: ctx.editor.isActive("columns", {
          layout: ColumnLayout.SidebarLeft
        }),
        isColumnRight: ctx.editor.isActive("columns", {
          layout: ColumnLayout.SidebarRight
        }),
        isColumnTwo: ctx.editor.isActive("columns", {
          layout: ColumnLayout.TwoColumn
        })
      };
    }
  });

  const onDelete = useCallback(() => {
    editor.chain().focus().deleteNode("columns").run();
  }, [editor]);

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey={`columnsMenu-${crypto.randomUUID()}`}
      shouldShow={shouldShow}
      updateDelay={0}
      tippyOptions={{
        offset: [0, 8],
        popperOptions: {
          modifiers: [{ name: "flip", enabled: false }]
        },
        getReferenceClientRect,
        appendTo: () => appendTo?.current,
        plugins: [sticky],
        sticky: "popper"
      }}
    >
      <Toolbar.Wrapper>
        <Toolbar.Button
          tooltip="Expand Left Column"
          active={isColumnLeft}
          onClick={onColumnLeft}
        >
          <ColumnsPlusLeft />
        </Toolbar.Button>
        <Toolbar.Button
          tooltip="Equal Columns"
          active={isColumnTwo}
          onClick={onColumnTwo}
        >
          <ColumnsIcon />
        </Toolbar.Button>
        <Toolbar.Button
          tooltip="Expand Right Column"
          active={isColumnRight}
          onClick={onColumnRight}
        >
          <ColumnsPlusRight />
        </Toolbar.Button>
        <Toolbar.Divider />
        <Toolbar.Button tooltip="Delete" onClick={onDelete}>
          <Trash className="text-red-500" />
        </Toolbar.Button>
      </Toolbar.Wrapper>
    </BaseBubbleMenu>
  );
};
