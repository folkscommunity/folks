"use client";

import { useEffect, useState } from "react";

import { dateRelativeTiny } from "@/lib/utils";

export function Whitelist() {
  const [wlItems, setWlItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchWhitelist() {
    fetch("/api/whitelist")
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setWlItems(res.data.whitelist);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  useEffect(() => {
    fetchWhitelist();
  }, []);

  function acceptWhitelist(email: string) {
    setLoading(true);

    fetch(`/api/whitelist/accept`, {
      method: "POST",
      body: JSON.stringify({
        email: email
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setTimeout(() => {
            fetchWhitelist();
          }, 1000);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function onSubmit(e: any) {
    e.preventDefault();

    const email = e.target.email.value;

    acceptWhitelist(email);

    window.location.reload();
  }

  return (
    <div className="flex min-h-[80dvh] w-full max-w-3xl flex-col gap-2">
      <div className="max-w-[83ch]">
        <h2 className="pb-4">Whitelist</h2>
        <form className="flex max-w-xs flex-col gap-2 pt-4" onSubmit={onSubmit}>
          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
          />
          <button
            className="bg-black-900 dark:bg-black-800 text-black-100 rounded-full border border-neutral-300/0 p-2 px-4 dark:border-slate-800 dark:text-slate-400"
            type="submit"
          >
            Send Invite
          </button>
        </form>
        <div className="pt-4">
          <div className="py-2 font-bold">Pending:</div>
          {wlItems &&
            wlItems.length > 0 &&
            wlItems
              .filter((wl: any) => !wl.accepted_at)
              .map((wl: any, i: any) => (
                <div key={i}>
                  <span>
                    {wl.email} - {wl.name} -{" "}
                    <strong>{wl.posts_cv_url || " "}</strong> -{" "}
                    {new Date(wl.created_at).toLocaleString()} -{" "}
                    <button
                      className="font-bold text-green-500 disabled:opacity-50"
                      onClick={() => acceptWhitelist(wl.email)}
                      disabled={loading}
                    >
                      Accept
                    </button>
                  </span>
                </div>
              ))}
        </div>
        <div className="pt-4">
          <div className="py-2 font-bold">Accepted:</div>
          {wlItems &&
            wlItems.length > 0 &&
            wlItems
              .filter((wl: any) => wl.accepted_at)
              .map((wl: any, i: any) => (
                <div key={i}>
                  <span>
                    {wl.email} - {wl.name} -{" "}
                    <strong>{wl.posts_cv_url || " "}</strong> -{" "}
                    {new Date(wl.created_at).toLocaleString()} - Accepted (
                    {dateRelativeTiny(new Date(wl.accepted_at))} ago)
                  </span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
