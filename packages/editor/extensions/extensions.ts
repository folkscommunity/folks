import { Blockquote } from "@tiptap/extension-blockquote";
import { BulletList } from "@tiptap/extension-bullet-list";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Color } from "@tiptap/extension-color";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { FocusClasses as Focus } from "@tiptap/extension-focus";
import { FontFamily } from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { History } from "@tiptap/extension-history";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import { Underline } from "@tiptap/extension-underline";
import { StarterKit } from "@tiptap/starter-kit";

import { CodeBlock } from "./codeblock";
import { Document } from "./document";
import { Figcaption } from "./figcaption";
import { Figure } from "./figure";
import { Heading } from "./heading";
import { HorizontalRule } from "./horizonal-rule";
import { ImageBlock } from "./image-block";
import { ImageUpload } from "./image-upload";
import { Link } from "./link";
import { Column, Columns } from "./multi-column";
import { Selection } from "./selection";
import { SlashCommand } from "./slash-command";
import { Table, TableCell, TableHeader, TableRow } from "./table";
import { TrailingNode } from "./trailing-node";

export const ExtensionKit = () => [
  Document,
  Columns,
  TaskList,
  TaskItem.configure({
    nested: true
  }),
  Column,
  Selection,
  Heading.configure({
    levels: [1, 2, 3, 4, 5, 6]
  }),
  HorizontalRule,
  StarterKit.configure({
    document: false,
    dropcursor: false,
    heading: false,
    horizontalRule: false,
    blockquote: false,
    history: false,
    codeBlock: false
  }),
  CodeBlock,
  BulletList,
  OrderedList,
  TextStyle,
  FontFamily,
  Color,
  TrailingNode,
  Link.configure({
    openOnClick: false
  }),
  Highlight.configure({ multicolor: true }),
  Underline,
  CharacterCount.configure({ limit: 50000 }),
  ImageUpload,
  ImageBlock,
  TextAlign.extend({
    addKeyboardShortcuts() {
      return {};
    }
  }).configure({
    types: ["heading", "paragraph"]
  }),
  Subscript,
  Superscript,
  Table,
  TableCell,
  TableHeader,
  Figure,
  TableRow,
  Typography,
  Paragraph,
  History,
  Placeholder.configure({
    includeChildren: true,
    showOnlyCurrent: false,
    placeholder: () => ""
  }),
  SlashCommand,
  Focus,
  Figcaption,
  Blockquote.configure({
    HTMLAttributes: {
      class: "quote"
    }
  }),
  Dropcursor.configure({
    width: 2,
    class: "ProseMirror-dropcursor border-black"
  })
];

export default ExtensionKit;
