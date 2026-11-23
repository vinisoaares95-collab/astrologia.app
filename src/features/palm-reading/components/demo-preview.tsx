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
import { ChapterArticle } from "@/features/report/chapter-article";
import { useOptionalJourney } from "@/features/report/journey/journey-context";

import { HAND_LABELS } from "../consent";
import { usePalmPhoto } from "../palm-photo-context";
import { PHOTO_PRIVACY } from "../privacy-copy";
import type { PalmAnalysisResult } from "../chapters/presentation";

/**
 * Descrições gerais da tradição — iguais para todas as pessoas.
 * Não dependem da foto enviada.
 */
const traditionNotes: Record<(typeof palmLines)[number]["id"], string> = {
  heart:
    "Tradicionalmente associada ao mundo afetivo: como se sente, se expressa e se vincula.",
  head: "Tradicionalmente associada ao modo de pensar, aprender e tomar decisões.",
  life: "Tradicionalmente associada ao jeito de viver e de lidar com as mudanças.",
};

const lockedChapters = reportParts
  .flatMap((part) => part.chapters)
  .filter((chapter) => chapter.number >= 6);

export function DemoPreview() {
  const router = useRouter();
  const { photo, hand, withdraw, analysis } = usePalmPhoto();
  const journey = useOptionalJourney();

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
            Neste aparelho, a foto fica só na leitura das mãos. Se você
            recarregou a página ou saiu desta etapa, ela foi descartada daqui.
            {journey?.hands
              ? " O texto da sua leitura continua na memória desta jornada."
              : ""}
          </p>
        </div>
        <ButtonLink href={routes.palmPhoto}>Adicionar foto</ButtonLink>
      </Card>
    );
  }

  // Com análise: só o que foi gerado para esta foto (03F.2, Etapa B).
  if (analysis)
    return (
      <PersonalPreview
        photoUrl={photo.url}
        handLabel={hand ? HAND_LABELS[hand] : null}
        analysis={analysis}
        onRetake={() => router.push(routes.palmPhoto)}
        onContinue={() => {
          // Transferência explícita (Fase 04B): só o texto vai para a
          // jornada, antes de esta etapa ser escondida e a foto descartada.
          journey?.transferHands(analysis);
          router.push(routes.birthData);
        }}
        onWithdraw={() => {
          withdraw();
          router.push(routes.home);
        }}
      />
    );

  // Sem análise: área de demonstração, separada e identificada.
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
              alt="Sua foto"
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
          Retirar consentimento e sair
        </Button>
      </ActionDock>
    </div>
  );
}

/** Prévia personalizada: foto, capítulos 6 e 7 e o que vem no relatório. */
function PersonalPreview({
  photoUrl,
  handLabel,
  analysis,
  onRetake,
  onContinue,
  onWithdraw,
}: {
  photoUrl: string;
  handLabel: string | null;
  analysis: PalmAnalysisResult;
  onRetake: () => void;
  onContinue: () => void;
  onWithdraw: () => void;
}) {
  const locked = lockedChapters.filter((c) => c.number > 7);
  const hasContent = analysis.chapters.some((c) => c.status === "content");
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-4 rounded-3xl bg-surface/70 p-3 edge-light">
        {/* eslint-disable-next-line @next/next/no-img-element -- URL blob local; next/image não se aplica */}
        <img
          src={photoUrl}
          alt="Sua foto"
          className="size-20 shrink-0 rounded-2xl object-cover"
        />
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-2">
            {handLabel && <Badge>{handLabel}</Badge>}
            <Badge
              tone={analysis.status === "complete" ? "success" : "neutral"}
            >
              {analysis.status === "complete"
                ? "Leitura completa"
                : analysis.status === "partial"
                  ? "Leitura parcial"
                  : "Sem leitura"}
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-fg-muted">
            {PHOTO_PRIVACY.preview[analysis.simulated ? "simulated" : "real"]}
          </p>
        </div>
      </div>

      <PalmChapters analysis={analysis} />

      {locked.length > 0 && (
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
            {locked.map((chapter) => (
              <li
                key={chapter.number}
                className="flex items-center gap-3.5 rounded-2xl bg-surface/60 px-4 py-3 edge-light"
              >
                <span className="font-mono text-sm text-accent">
                  {String(chapter.number).padStart(2, "0")}
                </span>
                <p className="flex-1 text-sm font-medium text-fg">
                  {chapter.title}
                </p>
                <Lock aria-hidden className="size-4 text-fg-subtle" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Callout tone="privacy" title="O que cada opção faz">
        <ul className="list-disc space-y-1 pl-4">
          {hasContent && (
            <li>
              <strong className="font-medium text-fg">Continuar:</strong> a foto
              fica para trás ao sair desta etapa; só o texto da leitura segue
              com você, na memória desta jornada, até você sair dela, recarregar
              ou fechar a página.
            </li>
          )}
          <li>
            <strong className="font-medium text-fg">
              Retirar consentimento e sair:
            </strong>{" "}
            apaga a foto e a leitura deste aparelho e cancela a autorização,
            impedindo novas análises com ela. O que já foi enviado segue as
            regras do provedor.
          </li>
          <li>
            <strong className="font-medium text-fg">Sair pelo X:</strong> apaga
            a foto e a leitura deste aparelho sem cancelar a autorização, que
            vence sozinha em até 30 minutos depois do aceite.
          </li>
        </ul>
      </Callout>

      <ActionDock>
        {hasContent ? (
          <Button size="lg" fullWidth onClick={onContinue}>
            Continuar: dados de nascimento
          </Button>
        ) : (
          <Button size="lg" fullWidth onClick={onRetake}>
            Tirar outra foto
          </Button>
        )}
        {hasContent && (
          <Button variant="secondary" onClick={onRetake}>
            Tirar outra foto
          </Button>
        )}
        <Button variant="ghost" onClick={onWithdraw}>
          Retirar consentimento e sair
        </Button>
      </ActionDock>
    </div>
  );
}

/**
 * Capítulos 6 e 7 (Fase 03E): observação da foto separada da leitura
 * simbólica, mesmo formato para texto redigido e biblioteca.
 */
function PalmChapters({ analysis }: { analysis: PalmAnalysisResult }) {
  return (
    <section className="space-y-4" aria-labelledby="sua-leitura">
      <div className="space-y-1">
        <h2 id="sua-leitura" className="text-lg font-semibold text-fg">
          A leitura das suas mãos
        </h2>
        <p className="text-sm text-fg-muted">{analysis.disclaimer}</p>
      </div>
      {analysis.simulated && (
        <Callout tone="demo" title="Resultado simulado">
          Estas observações são fictícias, geradas por um simulador para testar
          o fluxo. Elas não descrevem a sua foto.
        </Callout>
      )}
      {analysis.status === "partial" && (
        <Callout tone="info" title="Leitura parcial">
          Algumas características não ficaram visíveis na foto e não foram
          interpretadas. Uma nova foto pode completar a leitura.
        </Callout>
      )}
      {analysis.chapters.map((chapter) => (
        <ChapterArticle key={chapter.number} chapter={chapter} />
      ))}
    </section>
  );
}
