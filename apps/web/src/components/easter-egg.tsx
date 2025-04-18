"use client";

import { useEffect, useState } from "react";
import { useReward } from "react-rewards";
import { toast } from "sonner";

export function EasterEgg() {
  const [disabled, setDisabled] = useState(false);

  const { reward, isAnimating } = useReward("easteranim", "emoji", {
    emoji: ["🐰", "🥚", "🐣", "🌷", "🐇", "🐥"],
    startVelocity: 20,
    zIndex: 1000000,
    elementCount: 150,
    spread: 250,
    lifetime: 400,
    position: "absolute",
    elementSize: 30
  });

  return (
    <div
      onClick={() => {
        if (!disabled) {
          setDisabled(true);

          reward();

          toast("Happy Easter, Folks!", {
            icon: <EggSVG />,
            duration: 1900,
            position: "bottom-center"
          });

          setTimeout(() => {
            setDisabled(false);
          }, 2000);
        }
      }}
      className="inline cursor-pointer"
      id="easteranim"
      title="Happy Easter!"
    >
      <EggSVG />
    </div>
  );
}

function EggSVG() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="fill-black transition-all hover:scale-110 dark:fill-white"
      width="22px"
      height="22px"
      viewBox="0 0 24 24"
    >
      <path d="M12,23c4.595,0,7.084-3.076,8.219-6.078.012-.025.021-.05.031-.077A11.551,11.551,0,0,0,21,13a13.629,13.629,0,0,0-4.293-9.707A7.193,7.193,0,0,0,12,1,7.193,7.193,0,0,0,7.293,3.293,13.629,13.629,0,0,0,3,13C3,16.263,5.2,23,12,23Zm4.157-3.5H15.5v-2a1,1,0,0,0-1-1h-2v-2a1,1,0,0,0-1-1h-2v-2a1,1,0,0,0-1-1h-2v-2a1,1,0,0,0-.2-.592A13.275,13.275,0,0,1,8.238,5.215l.262.066V7.5a1,1,0,0,0,1,1h2v2a1,1,0,0,0,1,1h2v2a1,1,0,0,0,1,1h2v2a.982.982,0,0,0,.392.774A7.541,7.541,0,0,1,16.157,19.5ZM15.293,4.707a11.585,11.585,0,0,1,3.688,7.934A.965.965,0,0,0,18.5,12.5h-2v-2a1,1,0,0,0-1-1h-2v-2a1,1,0,0,0-1-1h-2v-2a1,1,0,0,0-.449-.834A4.569,4.569,0,0,1,11.989,3,5.252,5.252,0,0,1,15.293,4.707ZM5.033,12.369A.977.977,0,0,0,5.5,12.5h2v2a1,1,0,0,0,1,1h2v2a1,1,0,0,0,1,1h2v2a.971.971,0,0,0,.064.315A6.821,6.821,0,0,1,12,21c-5.289,0-7-5.39-7-8C5,12.787,5.021,12.579,5.033,12.369Z" />
    </svg>
  );
}
