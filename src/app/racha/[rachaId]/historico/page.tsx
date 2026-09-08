import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Medal, Star } from "lucide-react";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { calculateCurrentRating } from "@/modules/ratings/calculation";
import { requireRachaMember } from "@/server/authorization";
import { db } from "@/server/db";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Fortaleza" });
const statusNames = { SCHEDULED: "Agendada", IN_PROGRESS: "Em andamento", COMPLETED: "Concluída", CANCELLED: "Cancelada" } as const;

export default async function HistoryPage({ params }: PageProps<"/racha/[rachaId]/historico">) {
  const { rachaId } = await params;
  await requireRachaMember(rachaId);
  const [racha, members, scorers] = await Promise.all([
    db.racha.findUniqueOrThrow({ where: { id: rachaId }, select: { name: true, matches: { where: { OR: [{ status: { not: "SCHEDULED" } }, { startsAt: { lt: new Date() } }] }, orderBy: { startsAt: "desc" }, select: { id: true, startsAt: true, venue: true, status: true, championPhotoUrl: true, _count: { select: { games: true } } } } } }),
    db.rachaMember.findMany({ where: { rachaId }, select: { id: true, initialRating: true, user: { select: { name: true } }, profile: { select: { nickname: true, photoUrl: true } }, ratingsReceived: { select: { value: true } } } }),
    db.matchGoal.groupBy({ by: ["scorerId"], where: { rachaId, match: { status: "COMPLETED" } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } } }),
  ]);
  const players = new Map(members.map((member) => [member.id, { name: member.profile?.nickname || member.user.name, photoUrl: member.profile?.photoUrl ?? null }]));
  const rated = members.map((member) => ({ name: players.get(member.id)!.name, photoUrl: member.profile?.photoUrl ?? null, rating: calculateCurrentRating(member.initialRating === null ? null : Number(member.initialRating), member.ratingsReceived.map(({ value }) => Number(value))), votes: member.ratingsReceived.length })).filter((item): item is { name: string; photoUrl: string | null; rating: number; votes: number } => item.rating !== null && item.votes > 0).sort((a, b) => a.rating - b.rating);

  return <main className="app-background min-h-screen px-4 py-8"><div className="mx-auto w-full max-w-2xl">
    <Link className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-white" href={`/racha/${rachaId}`}><ChevronLeft size={18} /> Voltar</Link>
    <div className="mt-8"><p className="text-sm font-black uppercase text-lime-400">{racha.name}</p><h1 className="mt-2 text-3xl font-black text-white">Histórico e estatísticas</h1></div>
    <section className="mt-8 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5"><Medal className="text-yellow-300" size={22} /><h2 className="mt-3 font-black text-white">Artilharia geral</h2>{scorers.length ? <ol className="mt-3 divide-y divide-neutral-800">{scorers.slice(0, 10).map((row, index) => { const player = players.get(row.scorerId) ?? { name: "Jogador", photoUrl: null }; return <li className="flex min-h-14 items-center gap-3 py-2 text-sm" key={row.scorerId}><span className="w-4 text-neutral-500">{index + 1}</span><PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="sm" /><span className="min-w-0 flex-1 truncate font-bold text-neutral-200">{player.name}</span><strong className="text-lime-300">{row._sum.quantity ?? 0}</strong></li>; })}</ol> : <p className="mt-3 text-sm text-neutral-500">Conclua uma rodada e registre os gols.</p>}</div>
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5"><Star className="text-cyan-300" size={22} /><h2 className="mt-3 font-black text-white">Menor média</h2>{rated[0] ? <div className="mt-4 flex items-center gap-3"><PlayerAvatar name={rated[0].name} photoUrl={rated[0].photoUrl} size="sm" /><div className="min-w-0"><p className="truncate text-xl font-black text-white">{rated[0].name}</p><p className="mt-1 text-sm text-neutral-400">Nota {rated[0].rating.toFixed(1)} · {rated[0].votes} avaliações</p></div></div> : <p className="mt-3 text-sm text-neutral-500">Ainda não há avaliações suficientes.</p>}</div>
    </section>
    <section className="mt-10"><h2 className="text-xl font-black text-white">Rodadas anteriores</h2>{racha.matches.length ? <div className="mt-4 space-y-3">{racha.matches.map((match) => <Link className="block overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 transition hover:border-neutral-600" href={`/racha/${rachaId}/partidas/${match.id}`} key={match.id}>{match.championPhotoUrl ? <div className="relative aspect-[3/1]"><Image alt="Campeões da rodada" className="object-cover" fill sizes="672px" src={match.championPhotoUrl} unoptimized /></div> : null}<div className="flex items-center justify-between gap-3 p-4"><div><p className="font-black capitalize text-white">{dateFormatter.format(match.startsAt)}</p><p className="mt-1 text-sm text-neutral-500">{match.venue} · {match._count.games} jogos</p></div><span className="text-xs font-bold text-lime-400">{statusNames[match.status]}</span></div></Link>)}</div> : <p className="mt-4 rounded-lg border border-dashed border-neutral-700 p-8 text-center text-neutral-500">Nenhuma rodada anterior.</p>}</section>
  </div></main>;
}
