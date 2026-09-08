"use client";

import { useActionState } from "react";

import { CircleX, LoaderCircle } from "lucide-react";

import { cancelAttendance, confirmAttendance } from "@/app/actions/matches";

type AttendanceButtonProps = {
  currentStatus: "CONFIRMED" | "WAITING_LIST" | null;
  matchId: string;
  rachaId: string;
};

export function AttendanceButton({ currentStatus, matchId, rachaId }: AttendanceButtonProps) {
  const confirm = confirmAttendance.bind(null, rachaId, matchId);
  const cancel = cancelAttendance.bind(null, rachaId, matchId);
  const [state, action, pending] = useActionState(currentStatus ? cancel : confirm, undefined);

  return (
    <div className="space-y-3">
      <form action={action}>
        <button className={currentStatus ? "secondary-button w-full" : "primary-button w-full"} disabled={pending} type="submit">
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={20} /> : currentStatus ? <CircleX aria-hidden="true" size={19} /> : null}
          {pending ? "Aguarde" : currentStatus === "CONFIRMED" ? "Cancelar presença" : currentStatus === "WAITING_LIST" ? "Sair da lista de espera" : "EU VOU ⚽"}
        </button>
      </form>
      {state?.message ? (
        <p aria-live="polite" className={`text-center text-sm font-semibold ${state.status === "CONFIRMED" ? "text-lime-300" : state.status === "WAITING_LIST" ? "text-yellow-300" : "text-neutral-400"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
