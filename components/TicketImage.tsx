"use client";

import { useState } from "react";

interface Props {
  imageUrl: string;
  ticketName: string;
  size?: number;
}

export default function TicketImage({ imageUrl, ticketName, size = 64 }: Props) {
  const [errored, setErrored] = useState(false);

  if (!imageUrl || errored) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0"
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
      width={size}
      height={size}
      className="rounded-lg object-contain bg-slate-700 flex-shrink-0"
      style={{ width: size, height: size }}
      onError={() => setErrored(true)}
    />
  );
}
