"use client";

import { ImageOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  ActionDock,
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
} from "@/components/ui";
import { Mandala } from "@/components/visuals/mandala";
import { palmLines } from "@/components/visuals/palm-illustration";
import { routes } from "@/config/routes";
import { reportParts } from "@/content/report-chapters";

import { HAND_LABELS } from "../consent";
import { usePalmPhoto } from "../palm-photo-context";

/**
 * Descrições gerais da tradição — iguais para todas as pessoas.
 * Não dependem da foto enviada.
 */
const traditionNotes: Record<(typeof palmLines)[number]["id"], string> = {
  heart:
    "Tradicionalmente associada ao mundo afetivo: como se sente, se expressa e se vincula.",
  head: "Tradicionalmente associada ao modo de pensar, aprender e tomar decisões.",
  life: "Tradicionalmente associada à vitalidade e à forma de viver as mudanças — não à duração da vida.",
};

const lockedChapters = reportParts
  .flatMap((part) => part.chapters)
  .filter((chapter) => chapter.number >= 6);

export function DemoPreview() {
  const router = useRouter();
  const { photo, hand, withdraw } = usePalmPhoto();

  if (!photo) {
    return (
      <Card className="my-auto flex flex-col items-center gap-5 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-bright">
          <ImageOff aria-hidden className="size-6 text-fg-subtle" />
        </span>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-fg">
            Nenhuma foto por aqui
          </h2>
          <p className="text-sm text-fg-muted">
            A foto fica apenas na memória desta tela. Se você recarregou a
            página ou saiu do fluxo, ela foi descartada.
          </p>
        </div>
        <ButtonLink href={routes.palmPhoto}>Adicionar foto</ButtonLink>
      </Card>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Callout tone="demo" title="Demonstração — sua foto não foi analisada">
        Nenhuma inteligência artificial processou sua imagem. O conteúdo abaixo
        é um texto fixo, igual para todas as pessoas.
      </Callout>

      {/* Destaque: foto dentro da mandala */}
      <Card
        variant="glow"
        className="flex flex-col items-center gap-4 overflow-hidden pt-6 text-center"
      >
        <div className="relative aspect-square w-full max-w-[15rem]">
          <Mandala className="absolute inset-0 size-full" />
          <div className="absolute inset-[24%] overflow-hidden rounded-full shadow-[0_0_0_1px_var(--color-accent),0_0_40px_-6px_var(--color-accent)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL blob local; next/image não se aplica */}
            <img
              src={photo.url}
              alt="Sua foto, mantida apenas neste dispositivo"
              className="size-full object-cover"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap justify-center gap-2">
            <Badge tone="demo">Exemplo fixo</Badge>
            <Badge>Não personalizado</Badge>
            {hand && <Badge>{HAND_LABELS[hand]}</Badge>}
          </div>
          <h2 className="text-2xl font-semibold text-fg">
            As três linhas principais
          </h2>
          <p className="mx-auto max-w-sm text-sm text-fg-muted">
            Como a tradição da quiromancia descreve cada uma delas.
          </p>
        </div>
      </Card>

      <ul className="space-y-2.5">
        {palmLines.map((line, index) => (
          <li key={line.id}>
            <Card className="flex gap-3.5 p-4">
              <span
                aria-hidden
                className="mt-1 h-10 w-1 shrink-0 rounded-full"
                style={{
                  backgroundColor: line.color,
                  boxShadow: `0 0 16px ${line.color}`,
                }}
              />
              <div className="space-y-1.5">
                <p className="font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">
                  Linha 0{index + 1} · Tradição
                </p>
                <p className="font-semibold text-fg">{line.label}</p>
                <p className="text-sm leading-relaxed text-fg-muted">
                  {traditionNotes[line.id]}
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {/* O que o relatório completo adiciona */}
      <section className="space-y-3" aria-labelledby="no-relatorio">
        <div className="flex items-center justify-between">
          <h2 id="no-relatorio" className="text-lg font-semibold text-fg">
            No relatório completo
          </h2>
          <Badge tone="accent">
            <Lock aria-hidden className="size-3" />
            Bloqueado
          </Badge>
        </div>
        <ul className="space-y-2">
          {lockedChapters.map((chapter) => (
            <li
              key={chapter.number}
              className="flex items-center gap-3.5 rounded-2xl bg-surface/60 px-4 py-3 edge-light"
            >
              <span className="font-mono text-sm text-accent">
                {String(chapter.number).padStart(2, "0")}
              </span>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-fg">{chapter.title}</p>
                <div aria-hidden className="space-y-1.5 blur-[1.5px]">
                  <span className="block h-1.5 w-11/12 rounded-full bg-surface-bright" />
                  <span className="block h-1.5 w-2/3 rounded-full bg-surface-bright" />
                </div>
              </div>
              <Lock aria-hidden className="size-4 text-fg-subtle" />
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-fg-subtle">
          Na versão final, a prévia descreverá características observadas na sua
          foto — quando a imagem permitir — sempre separando o que foi observado
          do que é interpretação simbólica.
        </p>
      </section>

      <ActionDock>
        <ButtonLink href={routes.birthData} size="lg" fullWidth>
          Continuar: dados de nascimento
        </ButtonLink>
        <Button
          variant="ghost"
          onClick={() => {
            withdraw();
            router.push(routes.home);
          }}
        >
          Descartar foto e sair
        </Button>
      </ActionDock>
    </div>
  );
}
