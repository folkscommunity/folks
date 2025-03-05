"use client";

import { useEffect, useState } from "react";
import { Cube } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";
import { Label } from "@/components/label";
import { optimizedImageUrl } from "@/lib/utils";

export function Boards({ aBoards }: { aBoards: any[] }) {
  const [newBoardModalOpen, setNewBoardModalOpen] = useState(false);
  const [boards, setBoards] = useState<any[]>(aBoards);

  function fetchBoards() {
    fetch("/api/boards")
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setBoards(res.data);
        } else {
          setBoards([]);
        }
      })
      .catch((err) => {
        setBoards([]);
      });
  }

  useEffect(() => {
    fetchBoards();
  }, []);

  return (
    <div className="flex min-h-[60dvh] w-full max-w-3xl flex-col gap-6">
      <div className="flex w-full items-center justify-between gap-4">
        <h1 className="leading-[42px]">Boards</h1>
        <div>
          <Button
            onClick={() => {
              setNewBoardModalOpen(true);
            }}
          >
            New Board
          </Button>
        </div>
      </div>

      <div className="grid w-full grid-flow-dense auto-rows-min grid-cols-[repeat(auto-fill,_minmax(220px,_1fr))] items-start gap-4 max-sm:!grid-cols-2">
        {boards &&
          boards.length > 0 &&
          boards.map((board: any, index: number) => (
            <BoardItem key={index} board={board} />
          ))}
      </div>

      {boards.length === 0 && (
        <div className="text-md flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div>Create a board to start your collection.</div>
          <Button
            onClick={() => {
              setNewBoardModalOpen(true);
            }}
          >
            New Board
          </Button>
        </div>
      )}

      {newBoardModalOpen && (
        <NewBoardModal onClose={() => setNewBoardModalOpen(false)} />
      )}
    </div>
  );
}

function BoardItem({ board }: { board: any }) {
  return (
    <Link
      className="group flex w-full flex-col gap-2 hover:no-underline"
      href={`/b/${board.id}`}
    >
      <div className="bg-black-100 flex aspect-square w-full flex-1 flex-col overflow-clip rounded-lg group-hover:opacity-80 dark:bg-neutral-800">
        <div className="flex flex-1 items-center justify-center">
          {board.items.length === 0 && (
            <Cube size={50} weight="light" className="opacity-25" />
          )}
          {board.items.length > 0 && (
            <img
              src={optimizedImageUrl(board.items[0].url, 500, 500)}
              style={{
                aspectRatio: 1
              }}
              className="w-full"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <div
          className="text-md font-pserif break-words font-semibold leading-snug"
          style={{
            wordBreak: "break-word"
          }}
        >
          {board.name.slice(0, 46)}
        </div>
        <div className="text-black-600 dark:text-black-300 text-sm">
          {board.count?.items || "No"}{" "}
          {board.count?.items === 1 ? "element" : "elements"}
          {!board.public && " · Private"}
        </div>
      </div>
    </Link>
  );
}

function NewBoardModal({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function createBoard(name: string, isPublic: boolean) {
    fetch("/api/boards/create", {
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
          if (res.data.id) {
            router.push(`/b/${res.data.id}`);
          } else {
            window.location.reload();
          }
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

    createBoard(name, isPublic);
  }

  return (
    <div className="fixed left-0 top-0 z-[99992] flex h-screen w-screen flex-col items-center justify-center gap-2 p-4">
      <div
        className="fixed left-0 top-0 z-[99995] flex h-screen w-screen items-center justify-center bg-black/5 backdrop-blur-sm transition-opacity"
        onClick={() => onClose()}
      />
      <div className="bg-black-100 dark:bg-black-800 z-[99999] flex flex-col gap-4 rounded-lg border border-neutral-300 px-6 py-4 dark:border-slate-900">
        <div className="flex justify-between gap-4">
          <div className="pt-1 font-bold">New Board</div>
          <button onClick={() => onClose()}>[x]</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <p className="my-0 max-w-sm py-0 pb-2">
            Create a board, to start your collection.
          </p>

          <Label htmlFor="colname">Name:</Label>
          <input
            autoFocus
            type="text"
            name="colname"
            maxLength={46}
            autoComplete="off"
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
              id="visibility"
              name="isPublic"
              className="text-md w-full appearance-none rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 pr-4 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
              defaultValue="public"
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
            {loading ? "Creating..." : "Create"}
          </button>
          {error && <p className="max-w-sm text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
}
