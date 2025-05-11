"use client";

import { useEffect, useRef, useState } from "react";
import { CircleNotch, ImagesSquare } from "@phosphor-icons/react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useFilePicker } from "use-file-picker";
import {
  FileAmountLimitValidator,
  FileSizeValidator,
  FileTypeValidator,
  ImageDimensionsValidator
} from "use-file-picker/validators";

import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./dialog";

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
  const [filesContent, setFilesContent] = useState<
    { content: Uint8Array; name: string }[]
  >([]);
  const [altTexts, setAltTexts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  const { openFilePicker, loading, errors, clear } = useFilePicker({
    readAs: "ArrayBuffer",
    accept: "image/*",
    multiple: true,
    validators: [
      new FileAmountLimitValidator({ max: 5 }),
      new FileTypeValidator(["jpg", "jpeg", "png", "webp", "gif", "heic"]),
      new FileSizeValidator({ maxFileSize: 50 * 1024 * 1024 /* 50 MB */ }),
      new ImageDimensionsValidator({
        maxWidth: 8000,
        maxHeight: 8000
      })
    ],
    onFilesSelected: ({ plainFiles, filesContent: newFiles }) => {
      if (plainFiles.length > 5) {
        setError("You can only upload up to 5 images.");
        return;
      }

      setFilesContent(newFiles);
      setAltTexts(new Array(newFiles.length).fill(""));
    },
    onFilesRejected: (rejectedFiles: any) => {
      const reason = rejectedFiles?.errors[0]?.reason;

      if (reason === "FILE_TYPE_NOT_ACCEPTED") {
        toast.error("Invalid file type.");
      } else if (reason === "FILE_SIZE_TOO_LARGE") {
        toast.error("File size exceeds limit.");
      } else if (reason === "MAX_AMOUNT_OF_FILES_EXCEEDED") {
        toast.error("You can upload up to 5 images.");
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

    const formData = new FormData();
    formData.append("body", body);
    formData.append("replying_to", post.id);
    formData.append("alt_texts", JSON.stringify(altTexts));

    files.forEach((file) => {
      formData.append("files", new Blob([file.content]), file.name);
    });

    fetch("/api/post", {
      method: "POST",
      body: formData
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setText("");
          setFilesContent([]);
          setAltTexts([]);
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

        <div className="flex flex-wrap gap-3">
          {filesContent.map((file, index) => (
            <div
              key={index}
              className="group relative flex flex-col items-start"
            >
              <img
                alt={altTexts[index] || file.name}
                src={URL.createObjectURL(new Blob([file.content]))}
                className="max-h-40 max-w-80 rounded-md border border-slate-300/0 dark:border-slate-800"
              />

              <button
                className="bg-black-900 dark:bg-black-800 text-black-100 absolute ml-1 mt-1 rounded-full border border-neutral-300/0 p-1 dark:border-slate-800 dark:text-slate-400"
                onClick={() => {
                  const newFiles = [...filesContent];
                  newFiles.splice(index, 1);
                  setFilesContent(newFiles);

                  const newAltTexts = [...altTexts];
                  newAltTexts.splice(index, 1);
                  setAltTexts(newAltTexts);
                }}
              >
                <X className="size-4" />
              </button>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="bg-black-900 dark:bg-black-800 text-black-100 absolute bottom-1 right-1 rounded-full border border-neutral-300/0 p-1 text-xs font-medium dark:border-slate-800 dark:text-slate-400">
                    alt
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add alt text</DialogTitle>
                    <div className="pt-1 text-xs text-slate-500">
                      Add a brief description of this image (1-2 sentences) to
                      help visually impaired users and display if the image
                      doesn't load.
                    </div>
                  </DialogHeader>
                  <div className="flex items-center space-x-2 py-4">
                    <div className="grid flex-1 gap-2">
                      <input
                        type="text"
                        placeholder="Describe this image..."
                        className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-800"
                        value={altTexts[index] || ""}
                        onChange={(e) => {
                          const newAltTexts = [...altTexts];
                          newAltTexts[index] = e.target.value;
                          setAltTexts(newAltTexts);
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <div className="flex gap-2">
                      <DialogClose asChild>
                        <button className="rounded-md border border-neutral-900 px-3 py-1 text-black disabled:border-neutral-400 dark:border-neutral-600 dark:text-white dark:disabled:border-neutral-800">
                          Cancel
                        </button>
                      </DialogClose>
                      <DialogClose asChild>
                        <button className="rounded-md bg-neutral-900 px-3 py-1 text-white disabled:bg-neutral-400 dark:bg-neutral-600 dark:disabled:bg-neutral-800">
                          Save
                        </button>
                      </DialogClose>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>

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
                    setFilesContent([]);
                    setAltTexts([]);
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
  const [filesContent, setFilesContent] = useState<
    { content: Uint8Array; name: string }[]
  >([]);
  const [altTexts, setAltTexts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { openFilePicker, loading, errors, clear } = useFilePicker({
    readAs: "ArrayBuffer",
    accept: "image/*",
    multiple: true,
    validators: [
      new FileAmountLimitValidator({ max: 5 }),
      new FileTypeValidator(["jpg", "jpeg", "png", "webp", "gif", "heic"]),
      new FileSizeValidator({ maxFileSize: 50 * 1024 * 1024 /* 50 MB */ }),
      new ImageDimensionsValidator({
        maxWidth: 8000,
        maxHeight: 8000
      })
    ],
    onFilesSelected: ({ plainFiles, filesContent: newFiles }) => {
      if (plainFiles.length > 5) {
        setError("You can only upload up to 5 images.");
        return;
      }

      setFilesContent(newFiles);
      setAltTexts(new Array(newFiles.length).fill(""));
    },
    onFilesRejected: (rejectedFiles: any) => {
      const reason = rejectedFiles?.errors[0]?.reason;

      if (reason === "FILE_TYPE_NOT_ACCEPTED") {
        toast.error("Invalid file type.");
      } else if (reason === "FILE_SIZE_TOO_LARGE") {
        toast.error("File size exceeds limit.");
      } else if (reason === "MAX_AMOUNT_OF_FILES_EXCEEDED") {
        toast.error("You can upload up to 5 images.");
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

    const formData = new FormData();
    formData.append("body", body);
    formData.append("replying_to", post.id);
    formData.append("alt_texts", JSON.stringify(altTexts));

    files.forEach((file) => {
      formData.append("files", new Blob([file.content]), file.name);
    });

    fetch("/api/post", {
      method: "POST",
      body: formData
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setText("");
          setFilesContent([]);
          setAltTexts([]);
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

              <div className="flex flex-wrap gap-3">
                {filesContent.map((file, index) => (
                  <div
                    key={index}
                    className="group relative flex flex-col items-start"
                  >
                    <img
                      alt={altTexts[index] || file.name}
                      src={URL.createObjectURL(new Blob([file.content]))}
                      className="max-h-40 max-w-80 rounded-md border border-slate-300/0 dark:border-slate-800"
                    />

                    <button
                      className="bg-black-900 dark:bg-black-800 text-black-100 absolute ml-1 mt-1 rounded-full border border-neutral-300/0 p-1 dark:border-slate-800 dark:text-slate-400"
                      onClick={() => {
                        const newFiles = [...filesContent];
                        newFiles.splice(index, 1);
                        setFilesContent(newFiles);

                        const newAltTexts = [...altTexts];
                        newAltTexts.splice(index, 1);
                        setAltTexts(newAltTexts);
                      }}
                    >
                      <X className="size-4" />
                    </button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="bg-black-900 dark:bg-black-800 text-black-100 absolute bottom-1 right-1 rounded-full border border-neutral-300/0 p-1 text-xs font-medium dark:border-slate-800 dark:text-slate-400">
                          alt
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add alt text</DialogTitle>
                          <div className="pt-1 text-xs text-slate-500">
                            Add a brief description of this image (1-2
                            sentences) to help visually impaired users and
                            display if the image doesn't load.
                          </div>
                        </DialogHeader>
                        <div className="flex items-center space-x-2 py-4">
                          <div className="grid flex-1 gap-2">
                            <input
                              type="text"
                              placeholder="Describe this image..."
                              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-800"
                              value={altTexts[index] || ""}
                              onChange={(e) => {
                                const newAltTexts = [...altTexts];
                                newAltTexts[index] = e.target.value;
                                setAltTexts(newAltTexts);
                              }}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <div className="flex gap-2">
                            <DialogClose asChild>
                              <button className="rounded-md border border-neutral-900 px-3 py-1 text-black disabled:border-neutral-400 dark:border-neutral-600 dark:text-white dark:disabled:border-neutral-800">
                                Cancel
                              </button>
                            </DialogClose>
                            <DialogClose asChild>
                              <button className="rounded-md bg-neutral-900 px-3 py-1 text-white disabled:bg-neutral-400 dark:bg-neutral-600 dark:disabled:bg-neutral-800">
                                Save
                              </button>
                            </DialogClose>
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>

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

export function InlineComposer({ onPost }: { onPost?: () => void }) {
  const [text, setText] = useState("");
  const [filesContent, setFilesContent] = useState<
    { content: Uint8Array; name: string }[]
  >([]);
  const [altTexts, setAltTexts] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { openFilePicker, loading, errors, clear } = useFilePicker({
    readAs: "ArrayBuffer",
    accept: "image/*",
    multiple: true,
    maxFileSize: 50,
    onFilesSelected: ({ plainFiles, filesContent: newFiles }) => {
      if (plainFiles.length > 5) {
        setError("You can only upload up to 5 images.");
        return;
      }

      setFilesContent(newFiles);
      setAltTexts(new Array(newFiles.length).fill(""));
    }
  });

  const handleSubmit = async () => {
    if (posting) return;
    setPosting(true);

    try {
      const formData = new FormData();
      formData.append("body", text);
      formData.append("alt_texts", JSON.stringify(altTexts));

      filesContent.forEach((file) => {
        const blob = new Blob([file.content]);
        formData.append("files", blob, file.name);
      });

      const response = await fetch("/api/post", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.ok) {
        setText("");
        setFilesContent([]);
        setAltTexts([]);
        setError("");
        setOpen(false);
        if (onPost) onPost();
      } else {
        setError(data.message || "An error occurred.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred.");
    }

    setPosting(false);
  };

  return (
    <div className="fadein min-h-[62px] w-full">
      <textarea
        ref={textareaRef}
        className="text-md max-h-[300px] w-full flex-1 resize-none border-0 bg-transparent px-4 py-1 pt-2 placeholder:text-neutral-700 focus:outline-none"
        placeholder="What's on your mind?"
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

      {error && <div className="px-4 py-2 text-sm text-red-500">{error}</div>}

      {posting && (
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
          <CircleNotch className="size-20 animate-spin opacity-50" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {filesContent.map((file, index) => (
          <div key={index} className="group relative flex flex-col items-start">
            <img
              alt={altTexts[index] || file.name}
              src={URL.createObjectURL(new Blob([file.content]))}
              className="max-h-40 max-w-80 rounded-md border border-slate-300/0 dark:border-slate-800"
            />

            <button
              className="bg-black-900 dark:bg-black-800 text-black-100 absolute ml-1 mt-1 rounded-full border border-neutral-300/0 p-1 dark:border-slate-800 dark:text-slate-400"
              onClick={() => {
                const newFiles = [...filesContent];
                newFiles.splice(index, 1);
                setFilesContent(newFiles);

                const newAltTexts = [...altTexts];
                newAltTexts.splice(index, 1);
                setAltTexts(newAltTexts);
              }}
            >
              <X className="size-4" />
            </button>

            <Dialog>
              <DialogTrigger asChild>
                <button className="bg-black-900 dark:bg-black-800 text-black-100 absolute bottom-1 right-1 rounded-full border border-neutral-300/0 p-1 text-xs font-medium dark:border-slate-800 dark:text-slate-400">
                  alt
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add alt text</DialogTitle>
                  <div className="pt-1 text-xs text-slate-500">
                    Add a brief description of this image (1-2 sentences) to
                    help visually impaired users and display if the image
                    doesn't load.
                  </div>
                </DialogHeader>
                <div className="flex items-center space-x-2 py-4">
                  <div className="grid flex-1 gap-2">
                    <input
                      type="text"
                      placeholder="Describe this image..."
                      className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-800"
                      value={altTexts[index] || ""}
                      onChange={(e) => {
                        const newAltTexts = [...altTexts];
                        newAltTexts[index] = e.target.value;
                        setAltTexts(newAltTexts);
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <div className="flex gap-2">
                    <DialogClose asChild>
                      <button className="rounded-md border border-neutral-900 px-3 py-1 text-black disabled:border-neutral-400 dark:border-neutral-600 dark:text-white dark:disabled:border-neutral-800">
                        Cancel
                      </button>
                    </DialogClose>
                    <DialogClose asChild>
                      <button className="rounded-md bg-neutral-900 px-3 py-1 text-white disabled:bg-neutral-400 dark:bg-neutral-600 dark:disabled:bg-neutral-800">
                        Save
                      </button>
                    </DialogClose>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
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
                  setFilesContent([]);
                  setAltTexts([]);
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
                onClick={handleSubmit}
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
