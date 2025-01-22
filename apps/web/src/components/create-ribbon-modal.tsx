"use client";

import { useEffect, useState } from "react";

export function CreateRibbonModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.addEventListener("ribbon_create_open", () => {
      setOpen(true);
    });

    return () => {
      window.removeEventListener("ribbon_create_open", () => {
        setOpen(true);
      });
    };
  }, []);

  function handleSubmit(e: any) {
    e.preventDefault();

    const target = e.target as HTMLFormElement;

    const body = target.body.value;

    if (body.length > 30) {
      setError("Body must be less than 30 characters.");
      return;
    }

    fetch("/api/ribbon", {
      method: "POST",
      body: JSON.stringify({
        message: body
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setOpen(false);
          setError("");
          window.dispatchEvent(new Event("ribbon_update"));
        } else {
          setError(res.msg || "Something went wrong. Please try again.");
        }
      })
      .catch((err) => {
        setError(err.msg || "An error occured.");
      });
  }

  return (
    <>
      {open && (
        <div className="fixed left-0 top-0 z-[99992] flex h-screen w-screen flex-col items-center justify-center gap-2 p-4">
          <div
            className="fixed left-0 top-0 z-[99995] flex h-screen w-screen items-center justify-center bg-black/5 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />
          <div className="bg-black-100 dark:bg-black-800 z-[99999] flex flex-col gap-4 rounded-lg border border-neutral-300 px-6 py-4 dark:border-slate-900">
            <div className="flex justify-between gap-4">
              <div className="pt-1 font-bold">The Ribbon</div>
              <button onClick={() => setOpen(false)}>[x]</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="max-w-sm">
                Add a message to the ribbon, that can be seen by everyone who
                visits Folks.
              </p>
              <input
                autoFocus
                type="text"
                name="body"
                maxLength={30}
                required
                placeholder="Ribbon Message"
                className="w-full rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
              />
              <button
                type="submit"
                className="bg-black-900 dark:bg-black-800 text-black-100 rounded-full border border-neutral-300/0 p-2 px-4 dark:border-slate-800 dark:text-slate-400"
              >
                Submit
              </button>
              {error && <p className="max-w-sm text-red-500">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
