import React from "react";
import {
  CodeBlock,
  Columns,
  Image,
  ListBullets,
  ListChecks,
  ListNumbers,
  Minus,
  Quotes,
  Table,
  TextHOne,
  TextHThree,
  TextHTwo
} from "@phosphor-icons/react";

import { Group } from "./types";

export const GROUPS: Group[] = [
  {
    name: "format",
    title: "Format",
    commands: [
      {
        name: "heading1",
        label: "Heading 1",
        iconComponent: <TextHOne />,
        description: "High priority section title",
        aliases: ["h1"],
        action: (editor) => {
          editor.chain().focus().setHeading({ level: 1 }).run();
        }
      },
      {
        name: "heading2",
        label: "Heading 2",
        iconComponent: <TextHTwo />,
        description: "Medium priority section title",
        aliases: ["h2"],
        action: (editor) => {
          editor.chain().focus().setHeading({ level: 2 }).run();
        }
      },
      {
        name: "heading3",
        label: "Heading 3",
        iconComponent: <TextHThree />,
        description: "Low priority section title",
        aliases: ["h3"],
        action: (editor) => {
          editor.chain().focus().setHeading({ level: 3 }).run();
        }
      },
      {
        name: "bulletList",
        label: "Bullet List",
        iconComponent: <ListBullets />,
        description: "Unordered list of items",
        aliases: ["ul"],
        action: (editor) => {
          editor.chain().focus().toggleBulletList().run();
        }
      },
      {
        name: "numberedList",
        label: "Numbered List",
        iconComponent: <ListNumbers />,
        description: "Ordered list of items",
        aliases: ["ol"],
        action: (editor) => {
          editor.chain().focus().toggleOrderedList().run();
        }
      },
      {
        name: "taskList",
        label: "Task List",
        iconComponent: <ListChecks />,
        description: "Task list with todo items",
        aliases: ["todo"],
        action: (editor) => {
          editor.chain().focus().toggleTaskList().run();
        }
      },
      {
        name: "blockquote",
        label: "Blockquote",
        iconComponent: <Quotes />,
        description: "Element for quoting",
        action: (editor) => {
          editor.chain().focus().setBlockquote().run();
        }
      },
      {
        name: "codeBlock",
        label: "Code Block",
        iconComponent: <CodeBlock />,
        description: "Code block with syntax highlighting",
        shouldBeHidden: (editor) => editor.isActive("columns"),
        action: (editor) => {
          editor.chain().focus().setCodeBlock().run();
        }
      }
    ]
  },
  {
    name: "insert",
    title: "Insert",
    commands: [
      {
        name: "table",
        label: "Table",
        iconComponent: <Table />,
        description: "Insert a table",
        shouldBeHidden: (editor) => editor.isActive("columns"),
        action: (editor) => {
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
            .run();
        }
      },
      {
        name: "image",
        label: "Image",
        iconComponent: <Image />,
        description: "Insert an image",
        aliases: ["img"],
        action: (editor) => {
          editor.chain().focus().setImageUpload().run();
        }
      },
      {
        name: "columns",
        label: "Columns",
        iconComponent: <Columns />,
        description: "Add two column content",
        aliases: ["cols"],
        shouldBeHidden: (editor) => editor.isActive("columns"),
        action: (editor) => {
          editor
            .chain()
            .focus()
            .setColumns()
            .focus(editor.state.selection.head - 1)
            .run();
        }
      },
      {
        name: "horizontalRule",
        label: "Horizontal Rule",
        iconComponent: <Minus />,
        description: "Insert a horizontal divider",
        aliases: ["hr"],
        action: (editor) => {
          editor.chain().focus().setHorizontalRule().run();
        }
      }
    ]
  }
];

export default GROUPS;
