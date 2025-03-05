"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, SpinnerGap, Trash } from "@phosphor-icons/react";
import { Cog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Masonry from "react-smart-masonry";
import { toast } from "sonner";
import { useFilePicker } from "use-file-picker";
import {
  FileAmountLimitValidator,
  FileSizeValidator,
  FileTypeValidator,
  ImageDimensionsValidator
} from "use-file-picker/validators";
import Lightbox from "yet-another-react-lightbox";

import { Button } from "@/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/dropdown-menu";
import { Label } from "@/components/label";

export function Board({
  id,
  board,
  loaded_items,
  isUser
}: {
  id: string;
  board: any;
  loaded_items: any[];
  isUser: boolean;
}) {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const [items, setItems] = useState<any[]>(loaded_items);
  const [loading, setLoading] = useState(false);

  const [index, setIndex] = useState(-1);

  const [editOpen, setEditOpen] = useState(false);

  const { openFilePicker, filesContent, errors, clear } = useFilePicker({
    readAs: "DataURL",
    accept: "image/*",
    multiple: false,
    validators: [
      new FileAmountLimitValidator({ max: 1 }),
      new FileTypeValidator([
        "jpg",
        "JPG",
        "jpeg",
        "JPEG",
        "png",
        "PNG",
        "webp",
        "WEBP",
        "gif",
        "GIF"
      ]),
      new FileSizeValidator({ maxFileSize: 95 * 1024 * 1024 /* 95 MB */ }),
      new ImageDimensionsValidator({
        maxWidth: 10000,
        maxHeight: 10000
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

  function uploadAvatar(files: any[]) {
    setLoading(true);

    toast.promise(
      fetch(`/api/boards/${id}/upload`, {
        method: "POST",
        body: JSON.stringify({
          board_id: id,
          files: files
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.ok) {
            toast.success("Image added.");
          } else {
            toast.error("Something went wrong.");
          }
        })
        .catch((err) => {
          toast.error("Something went wrong.");
        })
        .finally(() => {
          fetchItems();
        }),
      {
        loading: "Uploading...",
        success: "Image added.",
        error: "Something went wrong."
      }
    );
  }

  function fetchItems() {
    fetch(`/api/boards/${board.id}/items`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setItems(res.items);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function deleteBoard(id: string) {
    toast.promise(
      fetch(`/api/boards/${id}`, {
        method: "DELETE"
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.ok) {
            router.push("/boards");
          }
        })
        .catch((err) => {
          console.error(err);
        }),
      {
        loading: "Deleting...",
        success: `Board "${board.name}" has been deleted.`,
        error: "Something went wrong."
      }
    );
  }

  useEffect(() => {
    if (filesContent.length > 0) {
      uploadAvatar(filesContent);
      clear();
    }
  }, [filesContent, clear]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex min-h-[60dvh] w-full max-w-3xl flex-col gap-6 pb-8">
      <div className="flex w-full items-start justify-between gap-4">
        <div className="flex flex-1 flex-col">
          <h2
            className="break-words leading-snug"
            style={{
              wordBreak: "break-word"
            }}
          >
            {board.name}
          </h2>
          <div>
            by{" "}
            <Link href={`/${board.user.username}`}>
              {board.user.display_name}
            </Link>
            {!board.public && " · Private"}
          </div>
        </div>
        {isUser && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openFilePicker()}
              disabled={loading}
              className="flex h-[34px] max-h-[34px] w-[34px] max-w-[34px] items-center justify-center overflow-clip px-2 py-0.5"
            >
              {loading ? <SpinnerGap className="animate-spin" /> : <Plus />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-[34px] max-h-[34px] w-[34px] max-w-[34px] items-center justify-center overflow-clip px-2 py-0.5">
                  <Cog />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dark:bg-black-800 !z-[99999] bg-white dark:border-slate-900">
                <DropdownMenuItem
                  className="dark:hover:bg-black-600 cursor-pointer hover:bg-slate-100"
                  onClick={() => setEditOpen(true)}
                >
                  Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />

                <DropdownMenuItem
                  className="dark:hover:bg-black-600 cursor-pointer text-red-500 hover:bg-slate-100"
                  onClick={() => deleteBoard(board.id)}
                >
                  Delete Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {isClient && items && items.length > 0 && (
        <Masonry
          breakpoints={{
            mobile: 400,
            desktop: 600
          }}
          columns={{
            mobile: 2,
            desktop: 3
          }}
          gap={5}
        >
          {items &&
            items.map((item, index) => {
              return (
                <BoardImage
                  item_id={item.id}
                  board_id={board.id}
                  isUser={isUser}
                  key={index}
                  src={item.url}
                  width={item.width}
                  height={item.height}
                  onClick={() => setIndex(index)}
                  onDelete={() => fetchItems()}
                />
              );
            })}
        </Masonry>
      )}

      {isClient && isUser && items.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center"
            onClick={() => openFilePicker()}
          >
            <Plus size={24} />
            <div>Add an item to your board.</div>
          </div>
        </div>
      )}

      <Lightbox
        open={index !== -1}
        close={() => setIndex(-1)}
        index={index}
        on={{ view: ({ index: currentIndex }: any) => setIndex(currentIndex) }}
        slides={items.map((item: any) => ({
          src: item.url,
          width: item.width,
          height: item.height
        }))}
      />

      {editOpen && (
        <EditBoardModal
          onClose={() => {
            setEditOpen(false);
            window.location.reload();
          }}
          id={board.id}
          name={board.name}
          isPublic={board.public ?? false}
        />
      )}
    </div>
  );
}

function BoardImage({
  item_id,
  board_id,
  isUser,
  src,
  width,
  height,
  onClick,
  onDelete
}: {
  item_id: string;
  board_id: string;
  isUser: boolean;
  src: string;
  width: number;
  height: number;
  onDelete: () => void;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.complete) {
      setLoaded(true);
    }
  }, [ref]);

  function deleteItem() {
    fetch(`/api/boards/${board_id}/${item_id}`, {
      method: "DELETE"
    })
      .then((res) => res.json())
      .then((res) => {
        onDelete();
      })
      .catch((err) => {
        console.error(err);
      });
  }

  return (
    <div
      className="group relative h-auto w-full cursor-pointer bg-gray-200 dark:bg-neutral-800"
      style={{
        aspectRatio: width / height
      }}
    >
      <img
        src={src}
        className="h-auto w-full transition-opacity duration-300"
        style={{
          opacity: loaded ? 1 : 0
        }}
        ref={ref}
        loading="lazy"
        onLoad={() => {
          setLoaded(true);
        }}
        onClick={onClick}
      />

      {isUser && (
        <div
          className="pointer-events-none absolute left-0 top-0 flex w-full items-start justify-end p-2 font-bold opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            aspectRatio: width / height
          }}
        >
          <div>
            <button
              className="pointer-events-auto rounded-full bg-black/50 p-2 text-white"
              onClick={() => {
                deleteItem();
              }}
            >
              <Trash size={18} weight="duotone" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditBoardModal({
  onClose,
  id,
  name,
  isPublic
}: {
  onClose: () => void;
  id: string;
  name: string;
  isPublic: boolean;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [AName, setAName] = useState(name);
  const [AIsPublic, setAIsPublic] = useState(isPublic);

  function editBoard(name: string, isPublic: boolean) {
    fetch(`/api/boards/${id}/edit`, {
      method: "POST",
      body: JSON.stringify({
        name: name,
        isPublic: isPublic
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          onClose();
          setError("");
        } else {
          setError(res.msg || "Something went wrong. Please try again.");
        }
      })
      .catch((err) => {
        setError(err.msg || "An error occured.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleSubmit(e: any) {
    e.preventDefault();

    const target = e.target as HTMLFormElement;

    const name = target.colname.value;
    const isPublic = target.isPublic.value === "public" ? true : false;

    setLoading(true);

    editBoard(name, isPublic);
  }

  return (
    <div className="fixed left-0 top-0 z-[99992] flex h-screen w-screen flex-col items-center justify-center gap-2 p-4">
      <div
        className="fixed left-0 top-0 z-[99995] flex h-screen w-screen items-center justify-center bg-black/5 backdrop-blur-sm transition-opacity"
        onClick={() => onClose()}
      />
      <div className="bg-black-100 dark:bg-black-800 z-[99999] flex flex-col gap-4 rounded-lg border border-neutral-300 px-6 py-4 dark:border-slate-900">
        <div className="flex justify-between gap-4">
          <div className="pt-1 font-bold">Edit Board</div>
          <button onClick={() => onClose()}>[x]</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Label htmlFor="colname">Name:</Label>
          <input
            autoFocus
            type="text"
            name="colname"
            maxLength={46}
            autoComplete="off"
            value={AName}
            onChange={(e) => setAName(e.target.value)}
            spellCheck="false"
            required
            id="colname"
            placeholder="Board Name"
            className="text-md dark:placeholderc:text-neutral-600 mb-2 w-full rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600"
          />

          <Label htmlFor="visibility">Visibility:</Label>

          <div className="relative">
            <select
              autoComplete="off"
              value={AIsPublic ? "public" : "private"}
              onChange={(e) => setAIsPublic(e.target.value === "public")}
              id="visibility"
              name="isPublic"
              className="text-md w-full appearance-none rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 pr-4 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.2"
              stroke="currentColor"
              className="pointer-events-none absolute right-2 top-2 ml-1 h-5 w-5 text-slate-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
              />
            </svg>
          </div>
          <button
            type="submit"
            className="bg-black-900 dark:bg-black-800 text-black-100 mt-4 rounded-full border border-neutral-300/0 p-2 px-4 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
          {error && <p className="max-w-sm text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
}
