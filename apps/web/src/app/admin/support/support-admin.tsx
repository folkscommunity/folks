"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";

import { FolksAvatar } from "@/components/folks-avatar";
import { cn } from "@/lib/utils";

export function SupportAdmin() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  function fetchRequests() {
    fetch("/api/support")
      .then((res) => res.json())
      .then((res) => {
        setRequests(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  function completeRequest(id: string) {
    fetch(`/api/support/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        completed: true
      })
    })
      .then((res) => res.json())
      .then((res) => {
        fetchRequests();
      })
      .catch((err) => {
        console.error(err);
      });
  }

  function uncompleteRequest(id: string) {
    fetch(`/api/support/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        completed: false
      })
    })
      .then((res) => res.json())
      .then((res) => {
        fetchRequests();
      })
      .catch((err) => {
        console.error(err);
      });
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2 max-sm:px-2">
      <div className="max-w-[83ch]">
        <div className="flex items-center gap-4 pb-2 max-sm:flex-col max-sm:items-start">
          <h2>Support Requests ({requests ? requests.length : 0})</h2>
        </div>

        <div className="flex w-full flex-row gap-3 pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>·</span>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {requests &&
            requests.length > 0 &&
            requests
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )
              .map((request) => (
                <div
                  key={request.id}
                  className={cn(
                    "dark:border-black-700 border-black-300 flex w-full flex-col gap-0.5 border p-4 shadow-sm",
                    request.completed_at && "opacity-30"
                  )}
                >
                  {request.user && (
                    <div className="flex flex-row gap-2 pb-4">
                      <FolksAvatar
                        src={request.user.avatar_url}
                        name={request.user.username}
                        size={40}
                      />
                      <div className="flex flex-col">
                        <div className="font-bold">
                          {request.user.display_name} (#{request.user.id})
                        </div>
                        <div className="text-sm text-neutral-400">
                          @{request.user.username}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="font-bold">Email:</span>
                    <p>
                      <a href={`mailto:${request.email}`}>{request.email}</a>
                      {request.user && (
                        <span>
                          {" "}
                          (
                          <a href={`mailto:${request.user.email}`}>
                            {request.user.email}
                          </a>
                          )
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold">Type:</span>
                    <p>{request.type}</p>
                  </div>
                  <div>
                    <span className="font-bold">
                      Body: ({" "}
                      <span
                        className="cursor-pointer opacity-50 hover:underline"
                        onClick={() => copyText(request.body)}
                      >
                        copy
                      </span>{" "}
                      )
                    </span>
                    <pre
                      className="break-words"
                      style={{
                        wordBreak: "break-word"
                      }}
                    >
                      {request.body}
                    </pre>
                  </div>
                  <div className="w-full pt-4 font-bold">
                    {request.completed_at && (
                      <button
                        onClick={() => uncompleteRequest(request.id)}
                        className="hover:opacity-50"
                      >
                        Uncomplete
                      </button>
                    )}
                    {!request.completed_at && (
                      <button
                        onClick={() => completeRequest(request.id)}
                        className="hover:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                  <div className="pt-4 text-sm text-neutral-400">
                    Sent a support request on{" "}
                    {dayjs(request.created_at).format("MMM D, YYYY (HH:mm:ss)")}
                  </div>
                  {request.completed_at && (
                    <div className="text-sm text-neutral-400">
                      Completed on{" "}
                      {dayjs(request.completed_at).format(
                        "MMM D, YYYY (HH:mm:ss)"
                      )}
                    </div>
                  )}
                </div>
              ))}

          {requests && requests.length === 0 && (
            <div className="text-foreground flex flex-col gap-1">
              <div className="text-foreground">No requests found.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
