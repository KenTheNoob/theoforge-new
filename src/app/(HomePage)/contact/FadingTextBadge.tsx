"use client";

import React, { useEffect, useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type FadingTextBadgeProps = {
  text: string;
  info: string;
};

const FadingTextBadge: React.FC<FadingTextBadgeProps> = ({ text, info }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    setFade(false); // trigger fade-out
    const timeout = setTimeout(() => {
      setFade(true); // trigger fade-in
    }, 150); // match with the fade-out duration

    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`transition-opacity duration-300 ease-in-out inline-block rounded-full px-4 py-1 text-sm font-semibold shadow-sm bg-neutral-200 dark:bg-gray-600 text-neutral-900 dark:text-white ${
            fade ? "opacity-100" : "opacity-0"
          } max-w-xs overflow-hidden text-ellipsis whitespace-nowrap`}
        >
          {text}
        </div>
      </TooltipTrigger>
      <TooltipContent className="text-xs max-w-sm">{info}</TooltipContent>
    </Tooltip>
  );
};

export default FadingTextBadge;