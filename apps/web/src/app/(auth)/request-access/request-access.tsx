"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { schemas } from "@folks/utils";

const RequestSchema = z.object({
  email: schemas.emailSchema,
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(20, "Name must cannot be longer than 20 characters."),
  posts_cv_url: z.string().optional()
});

type RequestSchemaType = z.infer<typeof RequestSchema>;

export function RequestAccess() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RequestSchemaType>({ resolver: zodResolver(RequestSchema) });

  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit: SubmitHandler<RequestSchemaType> = (data) => {
    setError(null);
    setSubmitted(true);

    fetch("/api/whitelist", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setDone(true);
        } else {
          setError(res.msg || "Something went wrong. Please try again.");
        }
      })
      .catch((err) => {
        setError(err.msg || "Something went wrong. Please try again.");
      })
      .finally(() => {
        setSubmitted(false);
      });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
      {!done && (
        <p>
          You can request access to the community by filling out the form below.
          We're slowly onboarding new users, so please be patient.
        </p>
      )}

      {done && (
        <pre className="font-ansi text-ansi leading-ansi py-8">{`██████╗  ██████╗ ███╗   ██╗███████╗██╗
██╔══██╗██╔═══██╗████╗  ██║██╔════╝██║
██║  ██║██║   ██║██╔██╗ ██║█████╗  ██║
██║  ██║██║   ██║██║╚██╗██║██╔══╝  ╚═╝
██████╔╝╚██████╔╝██║ ╚████║███████╗██╗
╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝`}</pre>
      )}

      {!done ? (
        <form
          className="mx-auto flex w-full max-w-2xl flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-bold">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register("email")}
              placeholder="Email"
              className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
            {errors.email && (
              <span className="text-red-500">{errors.email.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-bold">
              Name
            </label>
            <input
              type="text"
              id="name"
              {...register("name")}
              placeholder="Your Preferred Name"
              className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
            {errors.name && (
              <span className="text-red-500">{errors.name.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="posts_cv_url" className="font-bold">
              posts.cv url (optional)
            </label>
            <input
              type="text"
              id="posts_cv_url"
              {...register("posts_cv_url")}
              placeholder="posts.cv/..."
              className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
            {errors.posts_cv_url && (
              <span className="text-red-500">
                {errors.posts_cv_url.message}
              </span>
            )}
          </div>

          <div>{error && <p className="text-red-500">{error}</p>}</div>

          <div className="w-full pt-4">
            <button
              className="w-full border border-gray-400 px-3 py-3 hover:bg-gray-500/20"
              type="submit"
              disabled={submitted}
            >
              Submit
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2 max-sm:items-center">
          <p className="font-bold">
            You are now on the waitlist! Look out for an email from us soon.
          </p>
        </div>
      )}
    </div>
  );
}
