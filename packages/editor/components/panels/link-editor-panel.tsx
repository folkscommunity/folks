import { useCallback, useMemo, useState } from "react";
import { LinkIcon } from "@phosphor-icons/react";

import { Button } from "../ui/button";
import { Surface } from "../ui/surface";

export type LinkEditorPanelProps = {
  initialUrl?: string;
  onSetLink: (url: string, openInNewTab?: boolean) => void;
};

export const useLinkEditorState = ({
  initialUrl,
  onSetLink
}: LinkEditorPanelProps) => {
  const [url, setUrl] = useState(initialUrl || "");

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  }, []);

  const isValidUrl = useMemo(() => /^(\S+):(\/\/)?\S+$/.test(url), [url]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isValidUrl) {
        onSetLink(url, true);
      }
    },
    [url, isValidUrl, onSetLink]
  );

  return {
    url,
    setUrl,

    onChange,
    handleSubmit,
    isValidUrl
  };
};

export const LinkEditorPanel = ({
  onSetLink,
  initialUrl
}: LinkEditorPanelProps) => {
  const state = useLinkEditorState({ onSetLink, initialUrl });

  return (
    <Surface className="p-2">
      <form onSubmit={state.handleSubmit} className="flex items-center gap-2">
        <label className="flex cursor-text items-center gap-2 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-900">
          <LinkIcon className="flex-none text-black dark:text-white" />
          <input
            type="url"
            className="min-w-[12rem] flex-1 bg-transparent text-sm text-black outline-none dark:text-white"
            placeholder="Enter URL"
            value={state.url}
            onChange={state.onChange}
          />
        </label>
        <Button
          variant="primary"
          buttonSize="small"
          type="submit"
          disabled={!state.isValidUrl}
        >
          Set Link
        </Button>
      </form>
    </Surface>
  );
};
