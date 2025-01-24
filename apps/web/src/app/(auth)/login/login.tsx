"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { schemas } from "@folks/utils";

const LoginSchema = z.object({
  email: schemas.emailSchema,
  password: z.string()
});

type LoginSchemaType = z.infer<typeof LoginSchema>;

export function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginSchemaType>({ resolver: zodResolver(LoginSchema) });

  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const onSubmit: SubmitHandler<LoginSchemaType> = (data) => {
    setError(null);
    setSubmitted(true);

    fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          router.push("/");
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
    <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-4">
      <pre className="font-ansi text-ansi leading-ansi py-8 text-center">{`╭╮╱╱╱╭━━━╮╭━━━╮╭━━╮╭━╮╱╭╮
┃┃╱╱╱┃╭━╮┃┃╭━╮┃╰┫┣╯┃┃╰╮┃┃
┃┃╱╱╱┃┃╱┃┃┃┃╱╰╯╱┃┃╱┃╭╮╰╯┃
┃┃╱╭╮┃┃╱┃┃┃┃╭━╮╱┃┃╱┃┃╰╮┃┃
┃╰━╯┃┃╰━╯┃┃╰┻━┃╭┫┣╮┃┃╱┃┃┃
╰━━━╯╰━━━╯╰━━━╯╰━━╯╰╯╱╰━╯`}</pre>

      <p className="text-center">
        Use the form below to login to your account.
      </p>

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
            className="text-md rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
          />
          {errors.email && (
            <span className="text-red-500">{errors.email.message}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-bold">
            Password
          </label>
          <input
            type="password"
            id="password"
            {...register("password")}
            placeholder="Password"
            className="text-md rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
          />
          {errors.password && (
            <span className="text-red-500">{errors.password.message}</span>
          )}
        </div>

        <div>{error && <p className="text-red-500">{error}</p>}</div>

        <div className="w-full pt-4">
          <button
            className="w-full border border-gray-400 px-3 py-3 hover:bg-gray-500/20"
            type="submit"
            disabled={submitted}
          >
            Login
          </button>
        </div>

        <div>
          <p>
            If you don't remember your password, you can{" "}
            <Link href="/reset-password" className="font-bold hover:underline">
              click here
            </Link>{" "}
            to reset it.
          </p>
        </div>
      </form>
    </div>
  );
}
