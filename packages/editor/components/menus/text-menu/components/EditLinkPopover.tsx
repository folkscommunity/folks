import * as React from "react";
import { Link } from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";

import { LinkEditorPanel } from "../../../panels/link-editor-panel";
import { Toolbar } from "../../../ui/toolbar";

export type EditLinkPopoverProps = {
  onSetLink: (link: string, openInNewTab?: boolean) => void;
};

export const EditLinkPopover = ({ onSetLink }: EditLinkPopoverProps) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Toolbar.Button tooltip="Set Link">
          <Link />
        </Toolbar.Button>
      </Popover.Trigger>
      <Popover.Content>
        <LinkEditorPanel onSetLink={onSetLink} />
      </Popover.Content>
    </Popover.Root>
  );
};
