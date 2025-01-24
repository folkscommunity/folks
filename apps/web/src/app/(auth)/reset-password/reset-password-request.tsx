"use client";

import { useState } from "react";

export default function ResetPasswordRequest() {
  const [sent, setSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSent(true);

    const form_data = e.target as any;

    const email = form_data.email.value;

    if (!email) {
      setError("Please enter your email address.");
      setSent(false);
      return;
    }

    fetch("/api/auth/reset/request", {
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
          setError("");
          setSuccess(true);
        } else {
          setError(res.msg || "Something went wrong. Please try again.");
        }
      })
      .catch((err) => {
        setError(err.msg || "Something went wrong. Please try again.");
      })
      .finally(() => {
        setSent(false);
      });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-4">
      <h2 className="text-center">Request a Password Reset</h2>

      <p className="text-center">
        Use the form below to request a password reset link.
      </p>

      {success ? (
        <p>
          <strong>Password reset request sent.</strong>
          <br /> Please check your email (including the spam folder).
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mx-auto flex w-full max-w-sm flex-col gap-4"
        >
          <div className="flex w-full flex-col items-start gap-2">
            <label htmlFor="email" className="font-bold">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              placeholder="Email"
              className="text-md w-full rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none disabled:opacity-50 dark:border-neutral-600 dark:placeholder:text-neutral-600"
              disabled={sent}
            />
            {error && <span className="text-red-500">{error}</span>}
          </div>

          <div className="w-full pt-4">
            <button
              className="w-full border border-gray-400 px-3 py-3 hover:bg-gray-500/20"
              type="submit"
              disabled={sent}
            >
              Request Password Reset
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
