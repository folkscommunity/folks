import dayjs from "dayjs";

import { FolksAvatar } from "@/components/folks-avatar";

export function Users({ users }: { users: any[] }) {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2 max-sm:px-2">
      <div className="max-w-[83ch]">
        <div className="flex items-center gap-4 pb-2 max-sm:flex-col max-sm:items-start">
          <h2>Users ({users.length})</h2>
        </div>

        <div className="flex w-full flex-row gap-3 pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>·</span>
          ))}
        </div>

        <div className="text-foreground flex flex-col gap-2">
          {users && users.length > 0 ? (
            users.map((user: any, i: number) => (
              <div key={i} className="flex w-full flex-row gap-[1ch] py-1">
                <div className="flex flex-row gap-4">
                  <div className="h-10 w-10 rounded-full pt-1">
                    <FolksAvatar src={user.avatar_url} name={user.username} />
                  </div>
                  <div className="flex flex-col">
                    <a className="w-fit font-bold" href={`/${user.username}`}>
                      {user.display_name} (#{user.id})
                    </a>
                    <div>
                      <span className="opacity-50">Username:</span> @
                      {user.username}
                    </div>
                    <div>
                      <span className="opacity-50">Email:</span> {user.email}
                    </div>
                    <div>
                      <span className="opacity-50">Suspended:</span>{" "}
                      {user.suspended ? "Yes" : "No"}
                    </div>

                    <div>
                      <span className="opacity-50">Occupation:</span>{" "}
                      {user.occupation || ""}
                    </div>
                    <div>
                      <span className="opacity-50">Location:</span>{" "}
                      {user.location || ""}
                    </div>
                    <div>
                      <span className="opacity-50">Pronouns:</span>{" "}
                      {user.pronouns || ""}
                    </div>
                    <div>
                      <span className="opacity-50">Website:</span>{" "}
                      {user.website || ""}
                    </div>
                    <div>
                      <span className="opacity-50">Email Verified:</span>{" "}
                      {user.email_verified ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="opacity-50">Follower Count:</span>{" "}
                      {user._count.followers || "0"}
                    </div>
                    <div>
                      <span className="opacity-50">Following Count:</span>{" "}
                      {user._count.following || "0"}
                    </div>
                    <div>
                      <span className="opacity-50">Post Count:</span>{" "}
                      {user._count.posts || "0"}
                    </div>
                    <div>
                      <span className="opacity-50">Ribbon Count:</span>{" "}
                      {user._count.ribbons || "0"}
                    </div>
                    <div>
                      <span className="opacity-50">Like Count:</span>{" "}
                      {user._count.liked_posts || "0"}
                    </div>
                    <div>
                      <span className="opacity-50">Joined:</span>{" "}
                      {dayjs(user.created_at).format("YYYY-MM-DD HH:mm:ss")}
                    </div>
                    <div>
                      <span className="opacity-50">Updated:</span>{" "}
                      {dayjs(user.updated_at).format("YYYY-MM-DD HH:mm:ss")}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-foreground flex flex-col gap-1">
              <div className="text-foreground">No users found.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
