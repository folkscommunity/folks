import * as React from "react";
import { generateHTML } from "@tiptap/html";

import { BlockEditor } from "./components/block-editor";
import ExtensionKit from "./extensions/extensions";

export function FolksEditor({
  article_id,
  content
}: {
  article_id: string;
  content: any;
}) {
  return <BlockEditor article_id={article_id} content={content} />;
}

export async function getFolksEditorHTML(content: any) {
  return await generateHTML(content, ExtensionKit());
}
