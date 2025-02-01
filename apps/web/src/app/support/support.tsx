"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SmileySticker } from "@phosphor-icons/react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { emailSchema, supportRequestBodySchema } from "@folks/utils/schemas";

enum SupportType {
  Bug = "bug",
  FeatureRequest = "feature-request",
  Other = "other"
}

const SupportSchema = z.object({
  email: emailSchema,
  body: supportRequestBodySchema,
  type: z.nativeEnum(SupportType).default(SupportType.Other)
});

type SupportSchemaType = z.infer<typeof SupportSchema>;

export function Support({ email }: { email: string | null }) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SupportSchemaType>({ resolver: zodResolver(SupportSchema) });
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit: SubmitHandler<SupportSchemaType> = (data) => {
    setError(null);
    setSubmitted(true);

    fetch("/api/support", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setSuccess(true);
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
      <h1>Support</h1>
      <div>You can use the form below to contact us.</div>
      {success ? (
        <div className="mt-8">
          <SmileySticker size={48} weight="light" />
          <p className="pt-4 font-bold">Thank you for your message!</p>
          <p className="text-sm">We will get back to you soon.</p>
        </div>
      ) : (
        <form
          className="flex w-full max-w-lg flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-bold">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              id="email"
              {...register("email")}
              defaultValue={email || ""}
              placeholder="Email"
              className="text-md rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
            {errors.email && (
              <span className="text-red-500">{errors.email.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="body" className="font-bold">
              Request
            </label>
            <textarea
              id="body"
              {...register("body")}
              required
              placeholder="How can we help you?"
              maxLength={1000}
              className="text-md max-h-[600px] min-h-[190px] rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
            {errors.body && (
              <span className="text-red-500">{errors.body.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="type" className="font-bold">
              Type
            </label>
            <select
              id="type"
              {...register("type")}
              defaultValue={SupportType.Other}
              className="text-md rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 pr-4 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            >
              <option value={SupportType.Bug}>Bug</option>
              <option value={SupportType.FeatureRequest}>
                Feature Request
              </option>
              <option value={SupportType.Other}>Other</option>
            </select>

            {errors.type && (
              <span className="text-red-500">{errors.type.message}</span>
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
      )}
    </div>
  );
}
