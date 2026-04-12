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

  if (!imageUrl || errored) {
    return (
      <div
        className={
          fill
            ? "absolute inset-0 w-full h-full bg-slate-700 rounded-lg flex items-center justify-center"
            : "bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0"
        }
        style={fill ? undefined : { width: size, height: size }}
        title={ticketName}
      >
        <span className="text-2xl">🎟️</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={ticketName}
      className={
        fill
          ? "absolute inset-0 w-full h-full rounded-lg object-cover object-top"
          : "rounded-lg object-cover object-top flex-shrink-0"
      }
      style={fill ? undefined : { width: size, height: size }}
      onError={() => setErrored(true)}
    />
  );
}
