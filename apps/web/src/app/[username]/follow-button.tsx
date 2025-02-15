"use client";

import { useEffect, useState } from "react";

export function FollowButton({ target_id }: { target_id: string }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/follow/${target_id}`, {
      method: "GET"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setFollowing(res.data.following);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [target_id]);

  function follow() {
    fetch(`/api/follow`, {
      method: "POST",
      body: JSON.stringify({
        target_id: target_id
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setFollowing(true);
        }
      })
      .catch(() => {});
  }

  function unfollow() {
    fetch(`/api/follow`, {
      method: "DELETE",
      body: JSON.stringify({
        target_id: target_id
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setFollowing(false);
        }
      })
      .catch(() => {});
  }

  return (
    <button
      className="h-[34px] w-[120px] border border-gray-400 px-3 py-1 hover:bg-gray-500/20"
      onClick={following ? unfollow : follow}
    >
      {loading ? "..." : <>{following ? "Unfollow" : "Follow"}</>}
    </button>
  );
}
