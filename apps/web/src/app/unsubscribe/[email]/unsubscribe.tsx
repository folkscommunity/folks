"use client";

import { useState } from "react";
import { toast } from "sonner";

export function Unsubscribe({ email }: { email?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  function unsubscribe(em: string) {
    fetch("/api/user/unsubscribe", {
      method: "POST",
      body: JSON.stringify({
        email: em
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setSuccess(true);

          toast.success("You have been unsubscribed.");
        } else {
          if (res.msg) {
            toast.error(res.msg);
          } else {
            toast.error("Something went wrong.");
          }
          console.error(res);
        }
      })
      .catch((err) => {
        if (err.msg) {
          toast.error(err.msg);
        } else {
          toast.error("Something went wrong.");
        }
        console.error(err);
      });
  }

  function onSubmit(e: any) {
    e.preventDefault();

    setSubmitted(true);

    const data = e.target as any;

    if (!data.email.value || !data.email.value.includes("@")) {
      toast.error("Invalid email.");
      setSubmitted(false);
      return;
    }

    unsubscribe(data.email.value);

    setSubmitted(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1>Unsubscribe</h1>
      <div>You the form below to unsubscribe from our marketing emails.</div>
      {success ? (
        <div className="mt-8">
          <p className="pt-4 font-bold">You have been unsubscribed.</p>
        </div>
      ) : (
        <form
          className="flex w-full max-w-lg flex-col gap-4"
          onSubmit={onSubmit}
        >
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="email" className="font-bold">
              Email
            </label>
            <input
              type="email"
              autoComplete="off"
              id="email"
              defaultValue={email ? decodeURIComponent(email) : ""}
              placeholder="Your Email"
              className="text-md rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
          </div>

          <div className="w-full pt-4">
            <button
              className="w-full border border-gray-400 px-3 py-3 hover:bg-gray-500/20"
              type="submit"
              disabled={submitted}
            >
              {submitted ? "Unsubscribing..." : "Unsubscribe"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
