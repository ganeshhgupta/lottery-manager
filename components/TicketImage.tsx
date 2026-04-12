"use client";

import { useState } from "react";

interface Props {
  imageUrl: string;
  ticketName: string;
  size?: number;
  fill?: boolean;
}

export default function TicketImage({ imageUrl, ticketName, size = 64, fill = false }: Props) {
  const [errored, setErrored] = useState(false);

  const baseClass = fill
    ? "absolute inset-0 w-full h-full rounded-lg"
    : "rounded-lg flex-shrink-0";

  if (!imageUrl || errored) {
    return (
      <div
        className={`${baseClass} bg-slate-700 flex flex-col items-center justify-center gap-1 p-1 overflow-hidden`}
        style={fill ? undefined : { width: size, height: size }}
        title={ticketName}
      >
        <span className="text-lg leading-none">🎟️</span>
        <span className="text-[8px] sm:text-[9px] text-slate-300 text-center leading-tight line-clamp-3 break-words w-full px-0.5">
          {ticketName}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={ticketName}
      className={`${baseClass} object-cover object-top bg-slate-700`}
      style={fill ? undefined : { width: size, height: size }}
      onError={() => setErrored(true)}
    />
  );
}
