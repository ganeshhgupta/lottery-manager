"use client";

import { useState } from "react";

interface Props {
  imageUrl: string;
  ticketName: string;
  /** Fixed pixel size. Pass 0 with fill=true for fluid fill mode. */
  size?: number;
  /** Fill the parent container (parent must be position:relative) */
  fill?: boolean;
}

export default function TicketImage({ imageUrl, ticketName, size = 64, fill = false }: Props) {
  const [errored, setErrored] = useState(false);

  const placeholderClass = fill
    ? "absolute inset-0 w-full h-full bg-slate-600 rounded-lg flex items-center justify-center"
    : "bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0";

  const imgClass = fill
    ? "absolute inset-0 w-full h-full rounded-lg object-contain bg-slate-700"
    : "rounded-lg object-contain bg-slate-700 flex-shrink-0";

  if (!imageUrl || errored) {
    return (
      <div
        className={placeholderClass}
        style={fill ? undefined : { width: size, height: size }}
        title={ticketName}
      >
        <span className={fill ? "text-xl" : "text-2xl"}>🎟️</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={ticketName}
      className={imgClass}
      style={fill ? undefined : { width: size, height: size }}
      onError={() => setErrored(true)}
    />
  );
}
