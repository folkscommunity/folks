/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, LoaderPinwheelIcon, PlusIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useFilePicker } from "use-file-picker";
import {
  FileAmountLimitValidator,
  FileSizeValidator,
  FileTypeValidator,
  ImageDimensionsValidator
} from "use-file-picker/validators";
import { Drawer } from "vaul";

export function Composer() {
  const [text, setText] = useState("");

  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  const { openFilePicker, filesContent, loading, errors, clear } =
    useFilePicker({
      readAs: "DataURL",
      accept: "image/*",
      multiple: true,
      validators: [
        new FileAmountLimitValidator({ max: 1 }),
        new FileTypeValidator(["jpg", "jpeg", "png", "webp"]),
        new FileSizeValidator({ maxFileSize: 50 * 1024 * 1024 /* 50 MB */ }),
        new ImageDimensionsValidator({
          maxWidth: 8000,
          maxHeight: 8000
        })
      ],
      onFilesRejected: (rejectedFiles: any) => {
        const reason = rejectedFiles?.errors[0]?.reason;

        if (reason === "FILE_TYPE_NOT_ACCEPTED") {
          toast.error("Invalid file type.");
        } else if (reason === "FILE_SIZE_TOO_LARGE") {
          toast.error("File size exceeds limit.");
        } else if (reason === "MAX_AMOUNT_OF_FILES_EXCEEDED") {
          toast.error("You can only upload one file.");
        } else if (
          reason === "IMAGE_HEIGHT_TOO_BIG" ||
          reason === "IMAGE_WIDTH_TOO_BIG"
        ) {
          toast.error("Image dimensions exceeds limit. (8000x8000 max)");
        } else {
          toast.error("Invalid file type or size.");
        }
      }
    });

  function onPost() {
    window.dispatchEvent(new Event("refresh_feeds"));
  }

  function createPost(body: string, files: any[]) {
    setPosting(true);

    fetch("/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        body: body,
        files: files
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setText("");
          setError("");

          setOpen(false);
          onPost();
        } else {
          setError("An error occured.");
        }
      })
      .catch((err) => {
        setError("An error occured.");
      })
      .finally(() => {
        setPosting(false);
      });
  }

  return (
    <div className="absolute px-4 py-4">
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger asChild>
          <button
            title="Compose a post."
            className="bg-black-900 dark:bg-black-800 text-black-100 fixed bottom-4 right-4 z-[997] rounded-full border border-neutral-300/0 p-2 dark:border-slate-800 dark:text-slate-400"
          >
            <PlusIcon className="size-6" />
          </button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="backdrop-blur-smz-[99998] fixed inset-0 bg-black/80" />
          <Drawer.Content className="dark:bg-black-800 fixed bottom-0 left-0 right-0 z-[99999] flex h-fit min-h-[90dvh] w-full flex-col bg-gray-100 pb-10 outline-none">
            <Drawer.Title className="py-4 text-center text-lg font-bold">
              Compose
            </Drawer.Title>
            <Drawer.Close asChild>
              <button className="absolute right-4 top-4 rounded-md bg-neutral-900 px-1 py-1 text-white dark:bg-slate-900">
                <X className="size-5" />
              </button>
            </Drawer.Close>
            <div className="text-md mx-auto flex w-full max-w-3xl flex-1 flex-col">
              <textarea
                className="w-full flex-1 resize-none border-0 bg-transparent px-4 py-1 placeholder:text-neutral-700 focus:outline-none"
                placeholder="Write something..."
                name="body"
                maxLength={300}
                value={text}
                disabled={posting}
                onChange={(e) => {
                  setText(e.target.value);
                }}
              />

              {posting && (
                <div className="pointer-events-auto absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
                  <LoaderPinwheelIcon className="size-20 animate-spin opacity-50" />
                </div>
              )}

              {filesContent.map((file, index) => (
                <div
                  key={index}
                  className="group relative flex flex-col items-start"
                >
                  <img
                    alt={file.name}
                    src={file.content}
                    className="max-h-40 max-w-80 rounded-md border border-slate-300/0 dark:border-slate-800"
                  />

                  <button
                    className="bg-black-900 dark:bg-black-800 text-black-100 absolute ml-1 mt-1 rounded-full border border-neutral-300/0 p-1 dark:border-slate-800 dark:text-slate-400"
                    onClick={() => clear()}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}

              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    className="rounded-md text-neutral-700 dark:text-neutral-600"
                    onClick={openFilePicker}
                  >
                    <ImageIcon className="size-6" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={!text || posting}
                      className="rounded-md bg-neutral-900 px-3 py-1 text-white disabled:bg-neutral-400 dark:bg-neutral-600 dark:disabled:bg-neutral-800"
                      onClick={() => createPost(text, filesContent)}
                    >
                      Post
                    </button>
                  </div>
                </div>
                <div className="pt-2">
                  {error && (
                    <span className="font-bold text-red-500">{error}</span>
                  )}
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

export function ReplyCompose({
  post,
  user,
  onPost
}: {
  post: any;
  user: any;
  onPost: () => void;
}) {
  const [text, setText] = useState("");

  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  const { openFilePicker, filesContent, loading, errors, clear } =
    useFilePicker({
      readAs: "DataURL",
      accept: "image/*",
      multiple: true,
      validators: [
        new FileAmountLimitValidator({ max: 1 }),
        new FileTypeValidator(["jpg", "jpeg", "png", "webp"]),
        new FileSizeValidator({ maxFileSize: 50 * 1024 * 1024 /* 50 MB */ }),
        new ImageDimensionsValidator({
          maxWidth: 8000,
          maxHeight: 8000
        })
      ],
      onFilesRejected: (rejectedFiles: any) => {
        const reason = rejectedFiles?.errors[0]?.reason;

        if (reason === "FILE_TYPE_NOT_ACCEPTED") {
          toast.error("Invalid file type.");
        } else if (reason === "FILE_SIZE_TOO_LARGE") {
          toast.error("File size exceeds limit.");
        } else if (reason === "MAX_AMOUNT_OF_FILES_EXCEEDED") {
          toast.error("You can only upload one file.");
        } else if (
          reason === "IMAGE_HEIGHT_TOO_BIG" ||
          reason === "IMAGE_WIDTH_TOO_BIG"
        ) {
          toast.error("Image dimensions exceeds limit. (8000x8000 max)");
        } else {
          toast.error("Invalid file type or size.");
        }
      }
    });

  function createPost(body: string, files: any[]) {
    setPosting(true);

    fetch("/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        body: body,
        files: files,
        replying_to: post.id
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setText("");
          setError("");

          setOpen(false);
          onPost();
        } else {
          setError("An error occured.");
        }
      })
      .catch((err) => {
        setError("An error occured.");
      })
      .finally(() => {
        setPosting(false);
      });
  }

  return (
    <div className="flex-1 pb-4">
      <div className="text-md mx-auto flex w-full max-w-3xl flex-1 flex-col">
        {open && (
          <div className="text-black-400 dark:text-black-500 px-4 text-sm">
            Replying to @johny
          </div>
        )}

        <textarea
          className="w-full flex-1 resize-none border-0 bg-transparent px-4 py-1 pt-2 placeholder:text-neutral-700 focus:outline-none"
          placeholder="Reply to this post..."
          name="body"
          style={{
            minHeight:
              (filesContent && filesContent.length > 0) || text || open
                ? "120px"
                : "50px"
          }}
          maxLength={300}
          value={text}
          disabled={posting}
          onChange={(e) => {
            setText(e.target.value);
          }}
          onFocus={() => setOpen(true)}
        />

        {posting && (
          <div className="pointer-events-auto absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
            <LoaderPinwheelIcon className="size-20 animate-spin opacity-50" />
          </div>
        )}

        {filesContent.map((file, index) => (
          <div
            key={index}
            className="group relative flex flex-col items-start px-4"
          >
            <img
              alt={file.name}
              src={file.content}
              className="max-w-120 max-h-[400px] rounded-md border border-slate-300/0 dark:border-slate-800"
            />

            <button
              className="bg-black-900 dark:bg-black-800 text-black-100 absolute ml-3 mt-3 rounded-full border border-neutral-300/30 p-1 dark:border-slate-800 dark:text-slate-400"
              onClick={() => clear()}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}

        {open && (
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <button
                className="rounded-md text-neutral-700 dark:text-neutral-600"
                onClick={openFilePicker}
              >
                <ImageIcon className="size-6" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  className="rounded-md border border-neutral-900 px-3 py-1 text-black disabled:border-neutral-400 dark:border-neutral-600 dark:text-white dark:disabled:border-neutral-800"
                  onClick={() => {
                    setOpen(false);
                    setText("");
                    setError("");
                    clear();
                  }}
                >
                  Cancel
                </button>

                <button
                  disabled={!text || posting}
                  className="rounded-md bg-neutral-900 px-3 py-1 text-white disabled:bg-neutral-400 dark:bg-neutral-600 dark:disabled:bg-neutral-800"
                  onClick={() => createPost(text, filesContent)}
                >
                  Post
                </button>
              </div>
            </div>
            <div className="pt-2">
              {error && <span className="font-bold text-red-500">{error}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
