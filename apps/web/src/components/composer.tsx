"use client";

import { useEffect, useRef, useState } from "react";
import { CircleNotch, Images, ImagesSquare } from "@phosphor-icons/react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { PlusIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useFilePicker } from "use-file-picker";
import {
  FileAmountLimitValidator,
  FileSizeValidator,
  FileTypeValidator,
  ImageDimensionsValidator
} from "use-file-picker/validators";
import { Drawer } from "vaul";

import { cn } from "@/lib/utils";

export function Composer() {
  const [text, setText] = useState("");

  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  const { openFilePicker, filesContent, loading, errors, clear } =
    useFilePicker({
      readAs: "DataURL",
      accept: "image/*",
      multiple: false,
      validators: [
        new FileAmountLimitValidator({ max: 1 }),
        new FileTypeValidator(["jpg", "jpeg", "png", "webp", "gif"]),
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
    window.dispatchEvent(new Event("go_to_everything"));
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
          clear();

          setOpen(false);
          onPost();
        } else {
          setError(res.message || "An error occured.");
        }
      })
      .catch((err) => {
        setError(err.message || "An error occured.");
      })
      .finally(() => {
        setPosting(false);
      });
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "auto";
    }
  }, [open]);

  return (
    <div className="pointer-events-none absolute px-4 py-4">
      <div className="pointer-events-auto">
        <button
          title="Compose a post."
          className="bg-black-900 dark:bg-black-800 text-black-100 fixed bottom-4 right-4 z-[997] rounded-full border border-neutral-300/0 p-2 dark:border-slate-800 dark:text-slate-400"
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="size-8" />
        </button>
      </div>
      {open && (
        <div className="z-[99999] flex h-[100dvh] w-full items-center justify-center">
          <div
            className="bg-black-800/60 backdrop fadein pointer-events-auto fixed inset-0 z-[99998] backdrop-blur-sm transition-all"
            onClick={() => setOpen(false)}
          />

          <div className="dark:bg-black-800 slideinfrombottom pointer-events-auto fixed z-[99999] flex h-[500px] max-h-[80dvh] min-h-[50dvh] w-full max-w-[800px] flex-col rounded-lg border border-neutral-300 bg-gray-100 pb-0 outline-none max-sm:top-0 max-sm:min-h-[100dvh] max-sm:max-w-[100vw] max-sm:rounded-none max-sm:border-none dark:border-slate-900">
            <div className="flex flex-row items-center justify-between gap-4 overflow-clip border-b border-neutral-300 py-1 dark:border-slate-900">
              <div></div>
              <div className="py-4 text-center text-lg font-bold">
                Compose a Post
              </div>
              <div>
                <button
                  className="absolute right-4 top-4 rounded-md bg-neutral-900 px-1 py-1 text-white dark:bg-slate-900"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="text-md mx-auto flex w-full max-w-3xl flex-1 flex-col">
              <textarea
                className="w-full flex-1 resize-none border-0 bg-transparent px-4 py-1 pt-4 placeholder:text-neutral-700 focus:outline-none"
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
                  <CircleNotch className="size-20 animate-spin opacity-50" />
                </div>
              )}

              {filesContent.map((file, index) => (
                <div
                  key={index}
                  className="group relative flex flex-col items-start pl-0 pt-4 max-sm:pl-4"
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

              <div className="mt-2 border-t border-neutral-300 p-4 dark:border-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <button
                    className="rounded-md text-neutral-700 dark:text-neutral-600"
                    onClick={openFilePicker}
                  >
                    <ImagesSquare size={24} />
                  </button>

                  <div
                    className={cn(
                      "font-bold opacity-0 transition-opacity duration-300",
                      text && text.length > 3 && "opacity-100",
                      text && text.length > 290 && "text-orange-500",
                      text && text.length === 300 && "text-red-500"
                    )}
                  >
                    {(text && text.length) || "0"} / 300
                  </div>

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
          </div>
        </div>
      )}
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
      multiple: false,
      validators: [
        new FileAmountLimitValidator({ max: 1 }),
        new FileTypeValidator(["jpg", "jpeg", "png", "webp", "gif", "heic"]),
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
          clear();

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
            Replying to {`@${post.author.username}`}
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
            <CircleNotch className="size-20 animate-spin opacity-50" />
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
                <ImagesSquare size={24} />
              </button>

              <div
                className={cn(
                  "font-bold opacity-0 transition-opacity duration-300",
                  text && text.length > 3 && "opacity-100",
                  text && text.length > 290 && "text-orange-500",
                  text && text.length === 300 && "text-red-500"
                )}
              >
                {(text && text.length) || "0"} / 300
              </div>

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

export function ReplyComposeFloating({
  open,
  setOpen,
  post,
  user,
  onPost
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  post: any;
  user: any;
  onPost: () => void;
}) {
  const [text, setText] = useState("");

  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { openFilePicker, filesContent, loading, errors, clear } =
    useFilePicker({
      readAs: "DataURL",
      accept: "image/*",
      multiple: false,
      validators: [
        new FileAmountLimitValidator({ max: 1 }),
        new FileTypeValidator(["jpg", "jpeg", "png", "webp", "gif", "heic"]),
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
          clear();

          window.dispatchEvent(new Event("refresh_replies"));

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

  useEffect(() => {
    if (open) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "auto";
    }
  }, [open]);

  return (
    <>
      {open && (
        <div className="fixed bottom-0 left-0 right-0 top-0 z-[99999] flex h-[100dvh] w-full items-center justify-center">
          <div
            className="bg-black-800/60 backdrop fadein absolute inset-0 z-[99998] backdrop-blur-sm transition-all"
            onClick={() => setOpen(false)}
          />

          <div className="dark:bg-black-800 slideinfrombottom pointer-events-auto top-0 z-[99999] flex h-[500px] max-h-[80dvh] min-h-[50dvh] w-full max-w-[800px] flex-col rounded-lg border border-neutral-300 bg-gray-100 pb-0 outline-none max-sm:top-0 max-sm:min-h-[100dvh] max-sm:max-w-[100vw] max-sm:rounded-none max-sm:border-none dark:border-slate-900">
            <div className="flex flex-row items-center justify-between gap-4 overflow-clip border-b border-neutral-300 py-1 dark:border-slate-900">
              <div className="w-8"></div>
              <div className="py-4 text-center text-lg font-bold">
                Replying to @{post.author.username}
              </div>
              <div>
                <button
                  className="relative mr-4 rounded-md bg-neutral-900 px-1 py-1 text-white dark:bg-slate-900"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="text-md mx-auto flex w-full max-w-3xl flex-1 flex-col">
              <textarea
                className="w-full flex-1 resize-none border-0 bg-transparent px-4 py-1 pt-4 placeholder:text-neutral-700 focus:outline-none"
                placeholder="Write something..."
                name="body"
                maxLength={300}
                value={text}
                disabled={posting}
                onChange={(e) => {
                  setText(e.target.value);
                }}
                autoFocus={isDesktop}
              />

              {posting && (
                <div className="pointer-events-auto absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
                  <CircleNotch className="size-20 animate-spin opacity-50" />
                </div>
              )}

              {filesContent.map((file, index) => (
                <div
                  key={index}
                  className="group relative flex flex-col items-start pl-0 pt-4 max-sm:pl-4"
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

              <div className="mt-2 border-t border-neutral-300 p-4 dark:border-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <button
                    className="rounded-md text-neutral-700 dark:text-neutral-600"
                    onClick={openFilePicker}
                  >
                    <ImagesSquare size={24} />
                  </button>

                  <div
                    className={cn(
                      "font-bold opacity-0 transition-opacity duration-300",
                      text && text.length > 3 && "opacity-100",
                      text && text.length > 290 && "text-orange-500",
                      text && text.length === 300 && "text-red-500"
                    )}
                  >
                    {(text && text.length) || "0"} / 300
                  </div>

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
          </div>
        </div>
      )}
    </>
  );
}

export function InlineComposer() {
  const [text, setText] = useState("");

  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  const { openFilePicker, filesContent, loading, errors, clear } =
    useFilePicker({
      readAs: "DataURL",
      accept: "image/*",
      multiple: false,
      validators: [
        new FileAmountLimitValidator({ max: 1 }),
        new FileTypeValidator(["jpg", "jpeg", "png", "webp", "gif"]),
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
    window.dispatchEvent(new Event("go_to_everything"));
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
          clear();

          setOpen(false);
          onPost();

          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        } else {
          setError(res.message || "An error occured.");
        }
      })
      .catch((err) => {
        setError(err.message || "An error occured.");
      })
      .finally(() => {
        setPosting(false);
      });
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        className="text-md max-h-[300px] w-full flex-1 resize-none border-0 bg-transparent px-4 py-1 pt-2 placeholder:text-neutral-700 focus:outline-none"
        placeholder="Write something..."
        name="body"
        maxLength={300}
        value={text}
        disabled={posting}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height =
            e.target.scrollHeight < 300
              ? `${e.target.scrollHeight}px`
              : "300px";
        }}
        onFocus={() => setOpen(true)}
        style={{ overflow: "hidden" }}
      />

      {posting && (
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
          <CircleNotch className="size-20 animate-spin opacity-50" />
        </div>
      )}

      {filesContent.map((file, index) => (
        <div
          key={index}
          className="group relative flex flex-col items-start pl-0 pt-4 max-sm:pl-4"
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
      {open && (
        <div className="mt-2 p-4 dark:border-slate-900">
          <div className="flex items-center justify-between gap-2">
            <button
              className="rounded-md text-neutral-700 dark:text-neutral-600"
              onClick={openFilePicker}
            >
              <ImagesSquare size={24} />
            </button>

            <div
              className={cn(
                "font-bold opacity-0 transition-opacity duration-300",
                text && text.length > 3 && "opacity-100",
                text && text.length > 290 && "text-orange-500",
                text && text.length === 300 && "text-red-500"
              )}
            >
              {(text && text.length) || "0"} / 300
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-neutral-900 px-3 py-1 text-black disabled:border-neutral-400 dark:border-neutral-600 dark:text-white dark:disabled:border-neutral-800"
                onClick={() => {
                  setOpen(false);
                  setText("");
                  setError("");
                  clear();

                  if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                  }
                }}
              >
                Cancel
              </button>
              <button
                disabled={!text || posting}
                className="rounded-md bg-neutral-900 px-3 py-1 text-white disabled:bg-neutral-400 dark:bg-neutral-600 dark:disabled:bg-neutral-800"
                onClick={() => {
                  createPost(text, filesContent);
                }}
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
  );
}
