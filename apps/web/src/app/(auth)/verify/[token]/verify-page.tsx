"use client";

import { useEffect, useState } from "react";

export default function VerifyPage({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/auth/verify/${token}`, {
      method: "POST"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setLoading(false);

          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          setLoading(false);
          setError(res.msg || "Something went wrong. Please try again.");
        }
      })
      .catch((err) => {
        setError(err.msg || "Something went wrong. Please try again.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center text-center">
      {loading && <h2>Verifying your email, please wait...</h2>}

      {!loading && error && <h2 className="text-red-500">{error}</h2>}

      {!loading && !error && (
        <h2 className="text-green-500">Your email has been verified.</h2>
      )}
    </div>
  );
}
