import * as React from "react";
import { memo, useEffect, useState } from "react";
import {
  CodeBlock,
  DotsThreeVertical,
  File,
  Highlighter,
  Palette,
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
  TextB as TextBolder,
  TextItalic,
  TextStrikethrough,
  TextSubscript,
  TextSuperscript,
  TextUnderline
} from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";
import { BubbleMenu, Editor } from "@tiptap/react";
import { toast } from "sonner";

import { ColorPicker } from "../../panels";
import { Surface } from "../../ui/surface";
import { Toolbar } from "../../ui/toolbar";
import { ContentTypePicker } from "./components/ContentTypePicker";
import { EditLinkPopover } from "./components/EditLinkPopover";
import { useTextmenuCommands } from "./hooks/useTextmenuCommands";
import { useTextmenuContentTypes } from "./hooks/useTextmenuContentTypes";
import { useTextmenuStates } from "./hooks/useTextmenuStates";

// We memorize the button so each button is not rerendered
// on every editor state change
const MemoButton = memo(Toolbar.Button);
const MemoColorPicker = memo(ColorPicker);
const MemoContentTypePicker = memo(ContentTypePicker);

export type TextMenuProps = {
  editor: Editor;
  article_id: string;
  original_content: any;
};

export const TextMenu = ({
  editor,
  article_id,
  original_content
}: TextMenuProps) => {
  const commands = useTextmenuCommands(editor);
  const states = useTextmenuStates(editor);
  const blockOptions = useTextmenuContentTypes(editor);
  const [isSaved, setIsSaved] = useState(true);
  const [lastContent, setLastContent] = useState(JSON.parse(original_content));

  async function saveArticle(
    article_id: string,
    content: any,
    html_content: any
  ) {
    await fetch("/api/articles/update/" + article_id, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        body: JSON.stringify(content),
        html_body: html_content
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setLastContent(content);
          setIsSaved(true);
          return res.data;
        } else {
          throw new Error(res.message || "An error occured.");
        }
      });
  }

  function save() {
    const content = editor.getJSON();
    const html_content = editor.getHTML();

    toast.promise(saveArticle(article_id, content, html_content), {
      loading: "Saving article...",
      success: "Article saved!",
      error: "An error occured while saving the article.",
      position: "top-center"
    });
  }

  useEffect(() => {
    editor.on("update", ({ editor }) => {
      const content = editor.getJSON();

      if (JSON.stringify(content) === JSON.stringify(lastContent)) {
        setIsSaved(true);
      } else {
        setIsSaved(false);
      }
    });

    return () => {
      editor.off("update");
    };
  }, [lastContent]);

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[99999] flex items-center justify-center p-2 max-sm:bottom-[50px]">
      <div className="flex flex-col items-center gap-1">
        {!isSaved && (
          <div
            className="dark:bg-black-800 text-black-800 dark:text-black-300 fadein flex w-fit items-center gap-[1ch] rounded-md border bg-white px-3 py-1 font-mono text-sm dark:border-slate-800"
            onClick={save}
          >
            <div className="inline h-1.5 w-1.5 rounded-full bg-blue-500" />
            You have unsaved changes.
          </div>
        )}
        <Toolbar.Wrapper className="pointer-events-auto">
          <MemoContentTypePicker options={blockOptions} />
          <Toolbar.Divider />
          <MemoButton
            tooltip="Bold"
            tooltipShortcut={["Mod", "B"]}
            onClick={commands.onBold}
            active={states.isBold}
          >
            {/* @ts-expect-error */}
            <TextBolder />
          </MemoButton>
          <MemoButton
            tooltip="Italic"
            tooltipShortcut={["Mod", "I"]}
            onClick={commands.onItalic}
            active={states.isItalic}
          >
            {/* @ts-expect-error */}
            <TextItalic />
          </MemoButton>
          <MemoButton
            tooltip="Underline"
            tooltipShortcut={["Mod", "U"]}
            onClick={commands.onUnderline}
            active={states.isUnderline}
          >
            {/* @ts-expect-error */}
            <TextUnderline />
          </MemoButton>
          <MemoButton
            tooltip="Strikehrough"
            tooltipShortcut={["Mod", "Shift", "S"]}
            onClick={commands.onStrike}
            active={states.isStrike}
          >
            {/* @ts-expect-error */}
            <TextStrikethrough />
          </MemoButton>
          <MemoButton
            tooltip="Code"
            tooltipShortcut={["Mod", "E"]}
            onClick={commands.onCode}
            active={states.isCode}
          >
            {/* @ts-expect-error */}
            <CodeBlock />
          </MemoButton>
          <MemoButton tooltip="Code block" onClick={commands.onCodeBlock}>
            {/* @ts-expect-error */}
            <File />
          </MemoButton>
          <EditLinkPopover onSetLink={commands.onLink} />
          <Popover.Root>
            <Popover.Trigger asChild>
              <MemoButton
                active={!!states.currentHighlight}
                tooltip="Highlight text"
              >
                {/* @ts-expect-error */}
                <Highlighter />
              </MemoButton>
            </Popover.Trigger>
            <Popover.Content side="top" sideOffset={8} asChild>
              <Surface className="p-1">
                <MemoColorPicker
                  color={states.currentHighlight}
                  onChange={commands.onChangeHighlight}
                  onClear={commands.onClearHighlight}
                />
              </Surface>
            </Popover.Content>
          </Popover.Root>
          <Popover.Root>
            <Popover.Trigger asChild>
              <MemoButton active={!!states.currentColor} tooltip="Text color">
                {/* @ts-expect-error */}
                <Palette />
              </MemoButton>
            </Popover.Trigger>
            <Popover.Content side="top" sideOffset={8} asChild>
              <Surface className="p-1">
                <MemoColorPicker
                  color={states.currentColor}
                  onChange={commands.onChangeColor}
                  onClear={commands.onClearColor}
                />
              </Surface>
            </Popover.Content>
          </Popover.Root>
          <Popover.Root>
            <Popover.Trigger asChild>
              <MemoButton tooltip="More options">
                {/* @ts-expect-error */}
                <DotsThreeVertical />
              </MemoButton>
            </Popover.Trigger>
            <Popover.Content side="top" asChild>
              <Toolbar.Wrapper>
                <MemoButton
                  tooltip="Subscript"
                  tooltipShortcut={["Mod", "."]}
                  onClick={commands.onSubscript}
                  active={states.isSubscript}
                >
                  {/* @ts-expect-error */}
                  <TextSubscript />
                </MemoButton>
                <MemoButton
                  tooltip="Superscript"
                  tooltipShortcut={["Mod", ","]}
                  onClick={commands.onSuperscript}
                  active={states.isSuperscript}
                >
                  {/* @ts-expect-error */}
                  <TextSuperscript />
                </MemoButton>
                <Toolbar.Divider />
                <MemoButton
                  tooltip="Align left"
                  tooltipShortcut={["Shift", "Mod", "L"]}
                  onClick={commands.onAlignLeft}
                  active={states.isAlignLeft}
                >
                  {/* @ts-expect-error */}
                  <TextAlignLeft />
                </MemoButton>
                <MemoButton
                  tooltip="Align center"
                  tooltipShortcut={["Shift", "Mod", "E"]}
                  onClick={commands.onAlignCenter}
                  active={states.isAlignCenter}
                >
                  {/* @ts-expect-error */}
                  <TextAlignCenter />
                </MemoButton>
                <MemoButton
                  tooltip="Align right"
                  tooltipShortcut={["Shift", "Mod", "R"]}
                  onClick={commands.onAlignRight}
                  active={states.isAlignRight}
                >
                  {/* @ts-expect-error */}
                  <TextAlignRight />
                </MemoButton>
                <MemoButton
                  tooltip="Justify"
                  tooltipShortcut={["Shift", "Mod", "J"]}
                  onClick={commands.onAlignJustify}
                  active={states.isAlignJustify}
                >
                  {/* @ts-expect-error */}
                  <TextAlignJustify />
                </MemoButton>
              </Toolbar.Wrapper>
            </Popover.Content>
          </Popover.Root>
          <Toolbar.Divider />
          <MemoButton
            tooltip="Save"
            onClick={save}
            disabled={isSaved}
            style={{
              minWidth: "6.5ch"
            }}
          >
            {isSaved ? "Saved" : "Save"}
          </MemoButton>
        </Toolbar.Wrapper>
      </div>
    </div>
  );
};
