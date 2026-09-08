import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ProfileForm } from "@/components/player/profile-form";
import { requireRachaMember } from "@/server/authorization";
import { db } from "@/server/db";

export default async function PlayerProfilePage({ params }: PageProps<"/racha/[rachaId]/perfil">) {
  const { rachaId } = await params;
  const { membership, user } = await requireRachaMember(rachaId);
  const data = await db.racha.findUniqueOrThrow({
    where: { id: membership.rachaId },
    select: {
      name: true,
      positions: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      },
      members: {
        where: { id: membership.id },
        select: {
          profile: {
            select: {
              nickname: true,
              photoUrl: true,
              primaryPositionId: true,
              secondaryPositions: { select: { positionId: true } },
            },
          },
        },
      },
    },
  });
  const profile = data.members[0]?.profile;

  return (
    <main className="app-background min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        {profile ? (
          <Link className="mb-7 inline-flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-white" href={`/racha/${rachaId}`}>
            <ChevronLeft aria-hidden="true" size={18} /> Voltar
          </Link>
        ) : null}
        <div className="mb-8">
          <p className="text-sm font-bold uppercase text-lime-400">{data.name}</p>
          <h1 className="mt-2 text-3xl font-black text-white">{profile ? "Meu perfil" : "Complete seu perfil"}</h1>
          <p className="mt-2 text-neutral-400">Suas posições são específicas para este racha.</p>
        </div>
        <ProfileForm
          initialProfile={{
            nickname: profile?.nickname ?? user.name.split(/\s+/)[0],
            photoUrl: profile?.photoUrl ?? null,
            primaryPositionId: profile?.primaryPositionId ?? "",
            secondaryPositionIds: profile?.secondaryPositions.map(({ positionId }) => positionId) ?? [],
          }}
          positions={data.positions}
          rachaId={rachaId}
          userName={user.name}
        />
      </div>
    </main>
  );
}
