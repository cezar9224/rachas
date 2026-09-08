"use client";

import { useActionState, useState } from "react";

import Image from "next/image";
import { Camera, Check, LoaderCircle } from "lucide-react";

import { savePlayerProfile } from "@/app/actions/players";
import { PlayerAvatar } from "@/components/player/player-avatar";

type Position = {
  id: string;
  name: string;
};

type ProfileFormProps = {
  initialProfile: {
    nickname: string;
    photoUrl: string | null;
    primaryPositionId: string;
    secondaryPositionIds: string[];
  };
  positions: Position[];
  rachaId: string;
  userName: string;
};

export function ProfileForm({ initialProfile, positions, rachaId, userName }: ProfileFormProps) {
  const saveForRacha = savePlayerProfile.bind(null, rachaId);
  const [state, action, pending] = useActionState(saveForRacha, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [primaryPositionId, setPrimaryPositionId] = useState(initialProfile.primaryPositionId);
  const [secondaryPositionIds, setSecondaryPositionIds] = useState(initialProfile.secondaryPositionIds);

  function previewPhoto(file: File | undefined) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function toggleSecondary(positionId: string) {
    setSecondaryPositionIds((current) =>
      current.includes(positionId)
        ? current.filter((id) => id !== positionId)
        : [...current, positionId],
    );
  }

  const displayPhoto = preview || initialProfile.photoUrl;

  return (
    <form action={action} className="space-y-7" noValidate>
      <div className="flex flex-col items-center gap-3">
        <label className="group relative cursor-pointer" htmlFor="photo">
          {displayPhoto ? (
            <span className="relative block h-24 w-24 overflow-hidden rounded-full border border-neutral-700">
              <Image alt="Pré-visualização da foto" className="object-cover" fill sizes="96px" src={displayPhoto} unoptimized />
            </span>
          ) : <PlayerAvatar name={initialProfile.nickname || userName} size="lg" />}
          <span className="absolute right-0 bottom-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-lime-400 group-hover:border-lime-400">
            <Camera aria-hidden="true" size={17} />
          </span>
        </label>
        <input accept="image/jpeg,image/png,image/webp" className="sr-only" id="photo" name="photo" onChange={(event) => previewPhoto(event.target.files?.[0])} type="file" />
        <p className="text-xs text-neutral-500">JPEG, PNG ou WebP, até 2 MB</p>
        {state?.errors?.photo?.[0] ? <p className="form-error">{state.errors.photo[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-neutral-200" htmlFor="nickname">Apelido</label>
        <input className="form-control" defaultValue={initialProfile.nickname} id="nickname" maxLength={30} name="nickname" placeholder={userName.split(/\s+/)[0]} />
        {state?.errors?.nickname?.[0] ? <p className="form-error">{state.errors.nickname[0]}</p> : null}
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-bold text-neutral-200">Posição principal</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {positions.map((position) => (
            <label className={`position-option ${primaryPositionId === position.id ? "position-option-active" : ""}`} key={position.id}>
              <input checked={primaryPositionId === position.id} className="sr-only" name="primaryPositionId" onChange={() => setPrimaryPositionId(position.id)} type="radio" value={position.id} />
              {position.name}
            </label>
          ))}
        </div>
        {state?.errors?.primaryPositionId?.[0] ? <p className="form-error mt-2">{state.errors.primaryPositionId[0]}</p> : null}
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-bold text-neutral-200">Posições secundárias</legend>
        <p className="mb-3 text-xs text-neutral-500">Selecione até quatro opções.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {positions.filter((position) => position.id !== primaryPositionId).map((position) => {
            const selected = secondaryPositionIds.includes(position.id);
            return (
              <label className={`position-option ${selected ? "position-option-active" : ""}`} key={position.id}>
                <input checked={selected} className="sr-only" name="secondaryPositionIds" onChange={() => toggleSecondary(position.id)} type="checkbox" value={position.id} />
                {selected ? <Check aria-hidden="true" size={15} /> : null}{position.name}
              </label>
            );
          })}
        </div>
        {state?.errors?.secondaryPositionIds?.[0] ? <p className="form-error mt-2">{state.errors.secondaryPositionIds[0]}</p> : null}
      </fieldset>

      {state?.message ? <p className="rounded-md border border-red-500/40 bg-red-950/70 px-3 py-2 text-sm text-red-200">{state.message}</p> : null}

      <button className="primary-button w-full" disabled={pending} type="submit">
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={19} /> : null}
        {pending ? "Salvando" : "Salvar perfil"}
      </button>
    </form>
  );
}
