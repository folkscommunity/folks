import React, { useRef } from "react";
import { EditorContent } from "@tiptap/react";

import { ImageBlockMenu } from "../extensions/image-block/image-block-menu";
import { ColumnsMenu } from "../extensions/multi-column/column-menu";
import { TableColumnMenu, TableRowMenu } from "../extensions/table/menus";
import { useBlockEditor } from "../hooks/use-block-editor";
import { LinkMenu } from "./menus/link-menu";
import { TextMenu } from "./menus/text-menu";

export const BlockEditor = ({
  article_id,
  content
}: {
  article_id: string;
  content: any;
}) => {
  const menuContainerRef = useRef(null);

  const { editor } = useBlockEditor({
    content: content ? JSON.parse(content) : {},
    article_id: article_id
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex h-full" ref={menuContainerRef}>
      <div className="relative flex h-full flex-1 flex-col overflow-hidden">
        <TextMenu
          editor={editor}
          article_id={article_id}
          original_content={content}
        />
        {/* @ts-ignore */}
        <EditorContent
          editor={editor}
          className="min-h-screen flex-1 overflow-y-auto"
        />
        <LinkMenu editor={editor} appendTo={menuContainerRef} />
        <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
        <TableRowMenu editor={editor} appendTo={menuContainerRef} />
        <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
        <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
      </div>
    </div>
  );
};
