"use client";

import { useState } from "react";

import { Check, Copy } from "lucide-react";

export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-lime-400/25 bg-lime-400/5 p-4">
      <div>
        <p className="text-xs font-bold uppercase text-neutral-500">Código do racha</p>
        <p className="mt-1 font-mono text-2xl font-black text-lime-400">{code}</p>
      </div>
      <button className="secondary-button min-h-10 px-3" onClick={copyCode} type="button">
        {copied ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
