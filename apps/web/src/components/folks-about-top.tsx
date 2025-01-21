"use client";

import { useState } from "react";

export function FolksAboutTop() {
  const [expand, setExpand] = useState(false);

  return (
    <p className="m-0">
      Welcome to Folks, a place for{" "}
      <span
        className="cursor-pointer font-bold hover:underline"
        onClick={() => setExpand(!expand)}
      >
        product people
      </span>{" "}
      {expand && (
        <span className="opacity-80">
          ( designers, engineers, founders, painters, carpenters, lighting
          designers, and anyone else who crafts something ·{" "}
          <span
            className="cursor-pointer font-bold hover:underline"
            onClick={() => setExpand(false)}
          >
            Close
          </span>{" "}
          )
        </span>
      )}{" "}
      to share their creations and thoughts with each other and feel comfortable
      doing so.
    </p>
  );
}
