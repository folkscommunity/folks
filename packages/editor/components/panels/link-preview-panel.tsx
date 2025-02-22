import * as React from "react";
import { Pen, Trash } from "@phosphor-icons/react";

import { Surface } from "../ui/surface";
import { Toolbar } from "../ui/toolbar";
import Tooltip from "../ui/tooltip";

export type LinkPreviewPanelProps = {
  url: string;
  onEdit: () => void;
  onClear: () => void;
};

export const LinkPreviewPanel = ({
  onClear,
  onEdit,
  url
}: LinkPreviewPanelProps) => {
  const sanitizedLink = url?.startsWith("javascript:") ? "" : url;
  return (
    <Surface className="flex items-center gap-2 p-2">
      <a
        href={sanitizedLink}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sm underline"
      >
        {url}
      </a>
      <Toolbar.Divider />
      <Tooltip title="Edit link">
        <Toolbar.Button onClick={onEdit}>
          <Pen />
        </Toolbar.Button>
      </Tooltip>
      <Tooltip title="Remove link">
        <Toolbar.Button onClick={onClear}>
          <Trash />
        </Toolbar.Button>
      </Tooltip>
    </Surface>
  );
};
