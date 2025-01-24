"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { schemas } from "@folks/utils";

const PasswordResetSchema = z.object({
  password: schemas.passwordSchema,
  repeatPassword: schemas.passwordSchema
});

type PasswordResetSchemaType = z.infer<typeof PasswordResetSchema>;

export default function ResetPassword({
  token,
  invalidToken
}: {
  token: string;
  invalidToken?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PasswordResetSchemaType>({
    resolver: zodResolver(PasswordResetSchema)
  });

  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit: SubmitHandler<PasswordResetSchemaType> = (data) => {
    setError(null);
    setSubmitted(true);

    if (data.password !== data.repeatPassword) {
      setError("Passwords do not match.");
      setSubmitted(false);
      return;
    }

    fetch("/api/auth/reset", {
      method: "POST",
      body: JSON.stringify({ ...data, token: token }),
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

  return invalidToken ? (
    <div className="flex flex-1 items-center justify-center text-center">
      The token you used is invalid. Please try again.
    </div>
  ) : (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-4">
      <h2 className="text-center">Reset Your Password</h2>

      <p className="text-center">Use the form below to reset your password.</p>

      {success ? (
        <p>
          <strong>Password reset successfully.</strong>
          <br /> You can now login with your new password! (all your previous
          sessions have been logged out)
        </p>
      ) : (
        <form
          className="mx-auto flex w-full max-w-2xl flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
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

          <div className="flex flex-col gap-2">
            <label htmlFor="repeat_password" className="font-bold">
              Repeat Password
            </label>
            <input
              type="password"
              id="repeat_password"
              {...register("repeatPassword")}
              placeholder="Repeat Password"
              className="text-md rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
            />
            {errors.repeatPassword && (
              <span className="text-red-500">
                {errors.repeatPassword.message}
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
      )}
    </div>
  );
}
