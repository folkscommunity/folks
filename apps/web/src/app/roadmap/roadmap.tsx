"use client";

import { useState } from "react";
import { Smiley } from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "sonner";

export function Roadmap({ user, items }: { user: any; items: any[] }) {
  const [lItems, setLItems] = useState(items);

  function fetchItems() {
    fetch("/api/roadmap")
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setLItems(res.data);
        } else {
          setLItems([]);
        }
      })
      .catch((err) => {
        setLItems([]);
      });
  }

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2">
      <div className="max-w-[83ch]">
        <h1 className="pb-2 leading-[42px]">Roadmap</h1>

        <p>
          Here are the things that we are working on or have planned. Feel free
          to suggest new features or ideas using the form below.
        </p>

        <div className="my-4 flex gap-5 opacity-30">
          <span>*</span>
          <span>*</span>
          <span>*</span>
          <span>*</span>
          <span>*</span>
        </div>

        {lItems.filter((item) => item.status === "IN_PROGRESS").length > 0 && (
          <div className="pb-4">
            <strong>In Progress:</strong>
            <div className="mt-1">
              <ul className="list-disc space-y-1 pl-6">
                {lItems
                  .filter((item) => item.status === "IN_PROGRESS")
                  .map((item) =>
                    user.super_admin ? (
                      <li key={item.id}>
                        <AdminEdit
                          id={item.id}
                          refetch={fetchItems}
                          status={item.status}
                        >
                          {item.title}
                        </AdminEdit>
                      </li>
                    ) : (
                      <li key={item.id}>{item.title}</li>
                    )
                  )}
              </ul>
            </div>
          </div>
        )}

        {lItems.filter((item) => item.status === "PLANNED").length > 0 && (
          <div className="pb-4">
            <strong>Planned:</strong>
            <div className="mt-1">
              <ul className="list-disc space-y-1 pl-6">
                {lItems
                  .filter((item) => item.status === "PLANNED")
                  .map((item) =>
                    user.super_admin ? (
                      <li key={item.id}>
                        <AdminEdit
                          id={item.id}
                          refetch={fetchItems}
                          status={item.status}
                        >
                          {item.title}
                        </AdminEdit>
                      </li>
                    ) : (
                      <li key={item.id}>{item.title}</li>
                    )
                  )}
              </ul>
            </div>
          </div>
        )}

        {lItems.filter((item) => item.status === "SUGGESTED").length > 0 && (
          <div className="pb-4">
            <strong>Suggested:</strong>
            <div className="mt-1">
              <ul className="list-disc space-y-1 pl-6">
                {lItems
                  .filter((item) => item.status === "SUGGESTED")
                  .map((item) =>
                    user.super_admin ? (
                      <li key={item.id}>
                        <AdminEdit
                          id={item.id}
                          refetch={fetchItems}
                          status={item.status}
                        >
                          {item.title}
                        </AdminEdit>
                      </li>
                    ) : (
                      <li key={item.id}>{item.title}</li>
                    )
                  )}
              </ul>
            </div>
          </div>
        )}

        <div className="mb-5 mt-3 flex gap-5 opacity-30">
          <span>*</span>
          <span>*</span>
          <span>*</span>
          <span>*</span>
          <span>*</span>
        </div>

        {user && user.id ? (
          <SubmitFeature refetch={fetchItems} />
        ) : (
          <div>
            <Link href="/login" className="underline">
              Login
            </Link>{" "}
            to submit a feature request.
          </div>
        )}

        <div className="mb-5 mt-3 flex gap-5 opacity-30">
          <span>*</span>
          <span>*</span>
          <span>*</span>
          <span>*</span>
          <span>*</span>
        </div>

        <p>
          Use the{" "}
          <Link href="/support" className="underline">
            support form
          </Link>{" "}
          if you have a question, need help, or want to report a bug.
        </p>
      </div>
    </div>
  );
}

function SubmitFeature({ refetch }: { refetch: () => void }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: any) {
    e.preventDefault();

    setLoading(true);

    const target = e.target as any;

    const title = target.title.value;
    const description = target.description.value;

    fetch("/api/roadmap/suggest", {
      method: "POST",
      body: JSON.stringify({
        title: title,
        description: description
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Feature request has been submitted!");
          setSubmitted(true);
          refetch();
        } else {
          toast.error(res.msg || "Something went wrong. Please try again.");
        }
      })
      .catch((err) => {
        toast.error(err.msg || "Something went wrong. Please try again.");
      });

    setLoading(false);
  }
  return (
    <>
      <p>
        <strong>Suggest a feature:</strong>
      </p>
      {submitted ? (
        <div>
          Thank you for your suggestion!{" "}
          <Smiley className="absolute ml-[0.5ch] mt-[4px] inline" />
        </div>
      ) : (
        <form
          className="flex w-full max-w-md flex-col gap-2"
          onSubmit={handleSubmit}
        >
          <div className="w-full">
            <label className="flex flex-col gap-1" htmlFor="title">
              <div className="text-sm font-medium">
                Name{" "}
                <div className="absolute -mt-1.5 ml-0.5 inline text-red-400">
                  *
                </div>
              </div>
            </label>
            <input
              id="title"
              type="text"
              className="text-md w-full rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
              placeholder="Feature Name"
              required
            />
          </div>
          <div className="w-full">
            <label className="flex flex-col gap-1" htmlFor="description">
              <span className="text-sm font-medium">Description</span>
            </label>
            <textarea
              id="description"
              className="text-md max-h-[600px] min-h-[140px] w-full rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
              placeholder="Describe the feature you're proposing..."
            />
          </div>
          <div className="w-full">
            <button
              type="submit"
              className="w-full border border-gray-400 px-3 py-3 hover:bg-gray-500/20 disabled:opacity-10"
              disabled={loading}
            >
              Submit
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function AdminEdit({
  id,
  status,
  refetch,
  children
}: {
  id: string;
  status: string;
  refetch: () => void;
  children: React.ReactNode;
}) {
  const [openModal, setOpenModal] = useState(false);

  function updateItem(status: string) {
    fetch(`/api/roadmap/edit/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: status
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Roadmap item has been updated.");

          refetch();
        } else {
          toast.error(res.msg || "Something went wrong. Please try again.");
        }
      })
      .catch((err) => {
        toast.error(err.msg || "Something went wrong. Please try again.");
      });
  }

  return (
    <div className="flex gap-2">
      <label className="cursor-pointer" htmlFor={id + "-status"}>
        {children}
      </label>
      <div>·</div>
      <select
        value={status}
        onChange={(e) => updateItem(e.target.value)}
        id={id + "-status"}
      >
        <option value="SUGGESTED">Suggested</option>
        <option value="PLANNED">Planned</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
      </select>
    </div>
  );
}
