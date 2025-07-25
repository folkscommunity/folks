"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "@uidotdev/usehooks";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/dialog";
import { Label } from "@/components/label";
import { Separator } from "@/components/separator";
import { Slider } from "@/components/slider";
import { Switch } from "@/components/switch";

import { ChangeAvatar } from "./change-avatar";

export function Settings({ user }: { user: any }) {
  const [display_name, setDisplayName] = useState(user.display_name);
  const [occupation, setOccupation] = useState(user.occupation || "");
  const [location, setLocation] = useState(user.location || "");
  const [pronouns, setPronouns] = useState(user.pronouns || "");
  const [website, setWebsite] = useState(user.website || "");

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  function updateProfile() {
    fetch("/api/user", {
      method: "PATCH",
      body: JSON.stringify({
        display_name: display_name,
        occupation: occupation,
        location: location,
        pronouns: pronouns,
        website: website
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Profile updated.");
        } else {
          if (res.msg) {
            toast.error(res.msg);
          } else {
            toast.error("Something went wrong.");
          }
        }
      })
      .catch((err) => {
        if (err.msg) {
          toast.error(err.msg);
        } else {
          toast.error("Something went wrong.");
        }
      });
  }

  return (
    <div className="flex min-h-[80dvh] w-full max-w-3xl flex-1 flex-col gap-2">
      <h1 className="pb-4">Settings</h1>

      <h3 className="pb-4">Edit Profile</h3>
      <div className="pb-4">
        <div className="font-bold">Avatar: </div>
        <ChangeAvatar user={user} />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex max-w-sm flex-col gap-2">
          <label htmlFor="display_name" className="font-bold">
            Name:{" "}
          </label>

          <input
            type="text"
            id="display_name"
            value={display_name}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
          />
        </div>

        <div className="flex max-w-sm flex-col gap-2">
          <label htmlFor="occupation" className="font-bold">
            Occupation:{" "}
          </label>

          <input
            type="text"
            id="occupation"
            value={occupation}
            placeholder="Designer, engineer, etc."
            onChange={(e) => setOccupation(e.target.value)}
            className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
          />
        </div>

        <div className="flex max-w-sm flex-col gap-2">
          <label htmlFor="location" className="font-bold">
            Location:{" "}
          </label>

          <input
            type="text"
            id="location"
            placeholder="Your homebase"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
          />
        </div>

        <div className="flex max-w-sm flex-col gap-2">
          <label htmlFor="pronouns" className="font-bold">
            Pronouns:{" "}
          </label>

          <input
            type="text"
            id="pronouns"
            placeholder="Them/them, etc."
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
          />
        </div>

        <div className="flex max-w-sm flex-col gap-2">
          <label htmlFor="website" className="font-bold">
            Website:{" "}
          </label>

          <input
            type="url"
            id="website"
            value={website}
            placeholder="https://example.com"
            onChange={(e) => setWebsite(e.target.value)}
            className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
          />
        </div>

        <div className="flex max-w-sm flex-col gap-2 pt-4">
          <button
            className="bg-black-900 dark:bg-black-800 text-black-100 rounded-full border border-neutral-300/0 p-2 px-4 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
            onClick={updateProfile}
            disabled={
              (display_name || undefined) === user.display_name &&
              (occupation || undefined) === user.occupation &&
              (location || undefined) === user.location &&
              (pronouns || undefined) === user.pronouns &&
              (website || undefined) === user.website
            }
          >
            Update
          </button>
        </div>

        <Separator />

        <h3 className="pb-4">Notifications</h3>

        {isClient && <NotificationPreferences />}

        <h3 className="py-4">Ribbon Settings</h3>

        {isClient && <Preferences />}

        <h3 className="py-4">Blocked Users</h3>

        {isClient && <BlockedUsers />}

        <div className="mt-4">
          <DeleteAccount />
        </div>
      </div>
    </div>
  );
}

function NotificationPreferences() {
  const [push_reply, setPushReply] = useState(false);
  const [push_mention, setPushMention] = useState(false);
  const [push_follow, setPushFollow] = useState(false);
  const [push_like, setPushLike] = useState(false);
  const [marketing_emails, setMarketingEmails] = useState(false);

  function fetchPreferences() {
    fetch("/api/user/notification-preferences", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setPushReply(res.data.push_reply);
          setPushMention(res.data.push_mention);
          setPushFollow(res.data.push_follow);
          setPushLike(res.data.push_like);
          setMarketingEmails(res.data.marketing_emails);
        } else {
          if (res.msg) {
            toast.error(res.msg);
          } else {
            toast.error("Something went wrong.");
          }
        }
      })
      .catch((err) => {
        if (err.msg) {
          toast.error(err.msg);
        } else {
          toast.error("Something went wrong.");
        }
      });
  }

  function updatePreferences({
    var_push_reply,
    var_push_mention,
    var_push_follow,
    var_push_like,
    var_marketing_emails
  }: {
    var_push_reply?: boolean | undefined;
    var_push_mention?: boolean | undefined;
    var_push_follow?: boolean | undefined;
    var_push_like?: boolean | undefined;
    var_marketing_emails?: boolean | undefined;
  }) {
    fetch("/api/user/notification-preferences", {
      method: "POST",
      body: JSON.stringify({
        push_reply: var_push_reply,
        push_mention: var_push_mention,
        push_follow: var_push_follow,
        push_like: var_push_like,
        marketing_emails: var_marketing_emails
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Preferences updated.");
        } else {
          if (res.msg) {
            toast.error(res.msg);
          } else {
            toast.error("Something went wrong.");
          }
        }
      })
      .catch((err) => {
        if (err.msg) {
          toast.error(err.msg);
        } else {
          toast.error("Something went wrong.");
        }
      });
  }

  useEffect(() => {
    fetchPreferences();
  }, []);

  return (
    <>
      <div className="flex items-center space-x-4">
        <div className="w-[200px]">
          <Label htmlFor="push-reply">Push Reply</Label>
        </div>
        <Switch
          id="push-reply"
          checked={push_reply}
          onCheckedChange={(checked) => {
            setPushReply(checked);
            updatePreferences({
              var_push_reply: checked || false
            });
          }}
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-[200px]">
          <Label htmlFor="push-mention">Push Mention</Label>
        </div>
        <Switch
          id="push-mention"
          checked={push_mention}
          onCheckedChange={(checked) => {
            setPushMention(checked);
            updatePreferences({
              var_push_mention: checked || false
            });
          }}
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-[200px]">
          <Label htmlFor="push-follow">Push Follow</Label>
        </div>
        <Switch
          id="push-follow"
          checked={push_follow}
          onCheckedChange={(checked) => {
            setPushFollow(checked);
            updatePreferences({
              var_push_follow: checked || false
            });
          }}
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-[200px]">
          <Label htmlFor="push-like">Push Like</Label>
        </div>
        <Switch
          id="push-like"
          checked={push_like}
          onCheckedChange={(checked) => {
            setPushLike(checked);
            updatePreferences({
              var_push_like: checked || false
            });
          }}
        />
      </div>
      <h3 className="pb-4 pt-4">Emails</h3>
      <div className="flex items-center space-x-4">
        <div className="w-[200px]">
          <Label htmlFor="emails-marketing">Marketing Emails</Label>
        </div>
        <Switch
          id="emails-marketing"
          checked={marketing_emails}
          onCheckedChange={(checked) => {
            setMarketingEmails(checked);
            updatePreferences({
              var_marketing_emails: checked || false
            });
          }}
        />
      </div>
    </>
  );
}

function Preferences() {
  const [stopScrolling, setStopScrolling] = useLocalStorage(
    "ribbon_stop_scroll",
    false
  );

  const [ribbonSpeed, setRibbonSpeed] = useLocalStorage("ribbon_speed", 0.1);

  return (
    <>
      <div className="flex items-center space-x-4">
        <div className="w-[200px]">
          <Label htmlFor="disable-ribbon-scrolling">
            Disable Ribbon Scrolling
          </Label>
        </div>
        <Switch
          id="disable-ribbon-scrolling"
          checked={stopScrolling}
          onCheckedChange={(checked) => setStopScrolling(checked)}
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-[200px]">
          <Label htmlFor="ribbon-speed">Ribbon Speed</Label>
        </div>
        <Slider
          id="ribbon-speed"
          className="max-w-[280px]"
          min={1}
          max={50}
          step={0.01}
          value={[ribbonSpeed]}
          onValueChange={(value) => setRibbonSpeed(value[0])}
        />
      </div>
    </>
  );
}

function BlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  function fetchBlockedUsers() {
    fetch("/api/user/blocked", {
      method: "GET"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setBlockedUsers(res.data);
        } else {
          if (res.msg) {
            toast.error(res.msg);
          } else {
            toast.error("Something went wrong.");
          }
        }
      })
      .catch((err) => {
        if (err.msg) {
          toast.error(err.msg);
        } else {
          toast.error("Something went wrong.");
        }
      });
  }

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  function unblockUser(username: string, user_id: string) {
    fetch(`/api/user/unblock`, {
      method: "POST",
      body: JSON.stringify({
        target_id: user_id
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success(`@${username} unblocked.`);
          fetchBlockedUsers();
        } else {
          if (res.msg) {
            toast.error(res.msg);
          } else {
            toast.error("Something went wrong.");
          }
        }
      })
      .catch((err) => {
        if (err.msg) {
          toast.error(err.msg);
        } else {
          toast.error("Something went wrong.");
        }
      });
  }

  return (
    <div className="flex flex-col gap-2">
      {blockedUsers.map((user) => (
        <div key={user.id} className="flex items-center gap-2">
          <div>
            {user.display_name} (@{user.username})
          </div>
          <div>–</div>

          <div>
            <Button onClick={() => unblockUser(user.username, user.id)}>
              Unblock
            </Button>
          </div>
        </div>
      ))}

      {!blockedUsers.length && <div>You have not blocked anyone.</div>}
    </div>
  );
}

function DeleteAccount() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  function deleteAccount(password: string) {
    setError("");

    fetch("/api/user/delete", {
      method: "POST",
      body: JSON.stringify({
        password: password
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Account has been deleted.", {
            richColors: true,
            position: "top-center"
          });

          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          if (res.msg) {
            setError(res.msg);
          } else if (res.error === "invalid_password") {
            setError("Invalid password.");
          } else {
            setError("Something went wrong. Please contact support.");
          }
        }
      });
    return;
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setError("");
          setPassword("");
          setConfirm(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="border-none bg-red-500 px-3 py-2 font-semibold text-white">
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black-100 dark:bg-black-800 z-[99999] flex flex-col gap-4 rounded-lg border border-neutral-300 px-6 py-4 dark:border-slate-900">
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
        </DialogHeader>
        <DialogDescription className="mb-0">
          To delete your account, please enter your password below.
        </DialogDescription>

        <div className="flex flex-col gap-4">
          {error && <div className="font-medium text-red-500">{error}</div>}
          <input
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-none border border-neutral-400 bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:placeholder:text-neutral-600"
          />
          <div className="flex items-start gap-2">
            <label className="relative flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-neutral-400 transition-all checked:border-neutral-800 checked:bg-neutral-800"
                id="check"
                onChange={(e) => setConfirm(e.target.checked)}
                checked={confirm}
              />
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-white opacity-0 peer-checked:opacity-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </span>
            </label>
            <label htmlFor="check" className="font-medium">
              I understand that my account will be scheduled for deletion after
              pressing "Delete Account".
            </label>
          </div>
          <Button
            onClick={() => deleteAccount(password)}
            disabled={!confirm || !password}
            className="mt-2 border-none bg-red-500 px-3 py-2 font-semibold text-white hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-500"
          >
            Delete Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
