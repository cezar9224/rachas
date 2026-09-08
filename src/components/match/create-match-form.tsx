"use client";

import { useActionState, useState } from "react";

import { LoaderCircle } from "lucide-react";

import { createMatch } from "@/app/actions/matches";
import { FORMAT_CONFIGS, RACHA_FORMATS, type RachaFormatValue } from "@/modules/rachas/formats";

type CreateMatchFormProps = {
  defaults: {
    format: RachaFormatValue;
    goalkeepersPerTeam: number;
    outfieldPlayers: number;
    teamCount: number;
    venue: string;
  };
  rachaId: string;
};

export function CreateMatchForm({ defaults, rachaId }: CreateMatchFormProps) {
  const createForRacha = createMatch.bind(null, rachaId);
  const [state, action, pending] = useActionState(createForRacha, undefined);
  const [format, setFormat] = useState(defaults.format);
  const [outfieldPlayers, setOutfieldPlayers] = useState(String(defaults.outfieldPlayers));
  const [goalkeepersPerTeam, setGoalkeepersPerTeam] = useState(String(defaults.goalkeepersPerTeam));
  const [teamCount, setTeamCount] = useState(String(defaults.teamCount));
  const [maxPlayers, setMaxPlayers] = useState(
    String((defaults.outfieldPlayers + defaults.goalkeepersPerTeam) * defaults.teamCount),
  );

  function changeFormat(nextFormat: RachaFormatValue) {
    const config = FORMAT_CONFIGS[nextFormat];
    setFormat(nextFormat);
    setOutfieldPlayers(String(config.outfieldPlayers));
    setGoalkeepersPerTeam(String(config.goalkeepersPerTeam));
    setTeamCount(String(config.teamCount));
    setMaxPlayers(String((config.outfieldPlayers + config.goalkeepersPerTeam) * config.teamCount));
  }

  return (
    <form action={action} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field error={state?.errors?.date?.[0]} label="Data" name="date" type="date" />
        <Field error={state?.errors?.startTime?.[0]} label="Início" name="startTime" type="time" />
        <Field error={state?.errors?.endTime?.[0]} label="Fim" name="endTime" type="time" />
      </div>
      <Field defaultValue={defaults.venue} error={state?.errors?.venue?.[0]} label="Local" name="venue" type="text" />

      <div className="space-y-2">
        <label className="text-sm font-bold text-neutral-200" htmlFor="match-format">Formato</label>
        <select className="form-control" id="match-format" name="format" onChange={(event) => changeFormat(event.target.value as RachaFormatValue)} value={format}>
          {RACHA_FORMATS.map((value) => <option key={value} value={value}>{FORMAT_CONFIGS[value].label}</option>)}
        </select>
      </div>

      <input name="teamCount" type="hidden" value={teamCount} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <NumberField label="Máximo" name="maxPlayers" onChange={setMaxPlayers} value={maxPlayers} />
        <NumberField label="Linha/time" name="outfieldPlayers" onChange={setOutfieldPlayers} readOnly={format !== "CUSTOM"} value={outfieldPlayers} />
        <NumberField label="Goleiros/time" name="goalkeepersPerTeam" onChange={setGoalkeepersPerTeam} readOnly={format !== "CUSTOM"} value={goalkeepersPerTeam} />
      </div>
      <p className="text-xs text-neutral-500">Os times serão criados automaticamente conforme os jogadores confirmados.</p>
      {(state?.errors?.maxPlayers || state?.errors?.format || state?.errors?.outfieldPlayers || state?.errors?.goalkeepersPerTeam || state?.errors?.teamCount) ? (
        <p className="form-error">Confira a capacidade e o formato da partida.</p>
      ) : null}
      {state?.message ? <p className="rounded-md border border-red-500/40 bg-red-950/70 px-3 py-2 text-sm text-red-200">{state.message}</p> : null}

      <button className="primary-button w-full" disabled={pending} type="submit">
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={19} /> : null}
        {pending ? "Criando" : "Criar partida"}
      </button>
    </form>
  );
}

type FieldProps = {
  defaultValue?: string;
  error?: string;
  label: string;
  name: string;
  type: "date" | "text" | "time";
};

function Field({ defaultValue, error, label, name, type }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-neutral-200" htmlFor={name}>{label}</label>
      <input className="form-control" defaultValue={defaultValue} id={name} name={name} type={type} />
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  name: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  value: string;
};

function NumberField({ label, name, onChange, readOnly = false, value }: NumberFieldProps) {
  return (
    <label className="space-y-2 text-center text-xs font-bold text-neutral-400">
      <span>{label}</span>
      <input
        className="form-control text-center font-bold"
        inputMode="numeric"
        min="0"
        name={name}
        onChange={(event) => onChange(event.currentTarget.value)}
        readOnly={readOnly}
        type="number"
        value={value}
      />
    </label>
  );
}
