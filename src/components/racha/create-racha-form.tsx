"use client";

import { useActionState, useState } from "react";

import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";

import { createRacha } from "@/app/actions/rachas";
import { FORMAT_CONFIGS, RACHA_FORMATS, type RachaFormatValue } from "@/modules/rachas/formats";

type Draft = {
  name: string;
  city: string;
  venue: string;
  description: string;
  format: RachaFormatValue;
  outfieldPlayers: string;
  goalkeepersPerTeam: string;
  teamCount: string;
};

export function CreateRachaForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [state, action, pending] = useActionState(createRacha, undefined);
  const [draft, setDraft] = useState<Draft>({
    name: "",
    city: "",
    venue: "",
    description: "",
    format: "FUT7",
    outfieldPlayers: String(FORMAT_CONFIGS.FUT7.outfieldPlayers),
    goalkeepersPerTeam: String(FORMAT_CONFIGS.FUT7.goalkeepersPerTeam),
    teamCount: String(FORMAT_CONFIGS.FUT7.teamCount),
  });

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function selectFormat(format: RachaFormatValue) {
    const config = FORMAT_CONFIGS[format];
    setDraft((current) => ({
      ...current,
      format,
      outfieldPlayers: format === "CUSTOM" ? "0" : String(config.outfieldPlayers),
      goalkeepersPerTeam: format === "CUSTOM" ? "0" : String(config.goalkeepersPerTeam),
      teamCount: String(config.teamCount),
    }));
  }

  return (
    <form action={action} className="space-y-7" noValidate>
      <input name="name" type="hidden" value={draft.name} />
      <input name="city" type="hidden" value={draft.city} />
      <input name="venue" type="hidden" value={draft.venue} />
      <input name="description" type="hidden" value={draft.description} />
      <input name="format" type="hidden" value={draft.format} />
      <input name="outfieldPlayers" type="hidden" value={draft.outfieldPlayers} />
      <input name="goalkeepersPerTeam" type="hidden" value={draft.goalkeepersPerTeam} />
      <input name="teamCount" type="hidden" value={draft.teamCount} />

      <div className="flex gap-2" aria-label={`Etapa ${step} de 2`}>
        <span className="h-1.5 flex-1 rounded-full bg-lime-400" />
        <span className={`h-1.5 flex-1 rounded-full ${step === 2 ? "bg-lime-400" : "bg-neutral-800"}`} />
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <TextField error={state?.errors?.name?.[0]} label="Nome do racha" onChange={(value) => update("name", value)} placeholder="Arena Rio Branco" value={draft.name} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField error={state?.errors?.city?.[0]} label="Cidade" onChange={(value) => update("city", value)} placeholder="Fortaleza" value={draft.city} />
            <TextField error={state?.errors?.venue?.[0]} label="Local" onChange={(value) => update("venue", value)} placeholder="Arena Central" value={draft.venue} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-200" htmlFor="description-editor">Descrição <span className="font-normal text-neutral-500">(opcional)</span></label>
            <textarea className="form-control min-h-28 resize-y" id="description-editor" maxLength={500} onChange={(event) => update("description", event.target.value)} placeholder="Dias, horários ou informações importantes" value={draft.description} />
            {state?.errors?.description?.[0] ? <p className="form-error">{state.errors.description[0]}</p> : null}
          </div>
          <button className="primary-button w-full" onClick={() => setStep(2)} type="button">
            Continuar <ArrowRight aria-hidden="true" size={19} />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-3 text-sm font-bold text-neutral-200">Formato</legend>
            <div className="grid grid-cols-2 gap-2">
              {RACHA_FORMATS.map((format) => (
                <button
                  aria-pressed={draft.format === format}
                  className={`format-option ${draft.format === format ? "format-option-active" : ""}`}
                  key={format}
                  onClick={() => selectFormat(format)}
                  type="button"
                >
                  {FORMAT_CONFIGS[format].label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <NumberField disabled={draft.format !== "CUSTOM"} error={state?.errors?.outfieldPlayers?.[0]} label="Linha/time" onChange={(value) => update("outfieldPlayers", value)} value={draft.outfieldPlayers} />
            <NumberField disabled={draft.format !== "CUSTOM"} error={state?.errors?.goalkeepersPerTeam?.[0]} label="Goleiros/time" onChange={(value) => update("goalkeepersPerTeam", value)} value={draft.goalkeepersPerTeam} />
          </div>
          <p className="text-xs text-neutral-500">A quantidade de times será calculada pelos jogadores confirmados no momento do sorteio.</p>
          {state?.errors ? (
            <p className="form-error">Confira os dados informados nas duas etapas.</p>
          ) : null}
          {state?.message ? <p className="rounded-md border border-red-500/40 bg-red-950/70 px-3 py-2 text-sm text-red-200">{state.message}</p> : null}

          <div className="grid grid-cols-2 gap-3">
            <button className="secondary-button" onClick={() => setStep(1)} type="button"><ArrowLeft aria-hidden="true" size={19} /> Voltar</button>
            <button className="primary-button" disabled={pending} type="submit">
              {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={19} /> : null}
              {pending ? "Criando" : "Criar racha"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

type TextFieldProps = {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

function TextField({ error, label, onChange, placeholder, value }: TextFieldProps) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-neutral-200" htmlFor={id}>{label}</label>
      <input className="form-control" id={id} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}

type NumberFieldProps = {
  disabled?: boolean;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

function NumberField({ disabled = false, error, label, onChange, value }: NumberFieldProps) {
  return (
    <label className="space-y-2 text-center text-xs font-bold text-neutral-400">
      <span>{label}</span>
      <input
        className="form-control text-center font-bold"
        disabled={disabled}
        inputMode="numeric"
        min="0"
        onChange={(event) => onChange(event.currentTarget.value)}
        type="number"
        value={value}
      />
      {error ? <span className="block text-left text-[0.7rem] leading-4 text-red-300">{error}</span> : null}
    </label>
  );
}
