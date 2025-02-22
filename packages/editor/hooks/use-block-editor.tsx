import type { AnyExtension, Editor, EditorOptions } from "@tiptap/core";
import { useEditor } from "@tiptap/react";
import type { Doc as YDoc } from "yjs";

import { ExtensionKit } from "../extensions/extensions";
import { initialContent } from "../initial-content";

declare global {
  interface Window {
    editor: Editor | null;
    editor_article_id: string | null;
  }
}

interface useBlockEditorProps extends Omit<EditorOptions, "extensions"> {
  article_id: string;
}

export const useBlockEditor = ({
  article_id,
  ...editorOptions
}: Partial<useBlockEditorProps>) => {
  const editor = useEditor(
    {
      ...editorOptions,
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      autofocus: true,
      onCreate: (ctx) => {
        ctx.editor.commands.focus("start", { scrollIntoView: true });
      },
      extensions: [...ExtensionKit()].filter(
        (e): e is AnyExtension => e !== undefined
      ),
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "off",
          class: "min-h-full"
        }
      }
    },
    []
  );

  window.editor = editor;
  window.editor_article_id = article_id ?? null;

  return { editor };
};
