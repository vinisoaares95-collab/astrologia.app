"use client";

import { ImageOff } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge, Button, ButtonLink, Callout, Card } from "@/components/ui";
import {
  PalmIllustration,
  palmLines,
} from "@/components/visuals/palm-illustration";
import { routes } from "@/config/routes";

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

export function DemoPreview() {
  const router = useRouter();
  const { photo, clearPhoto } = usePalmPhoto();

  if (!photo) {
    return (
      <Card className="flex flex-col items-center gap-5 py-12 text-center">
        <ImageOff aria-hidden className="size-8 text-fg-subtle" />
        <div className="space-y-2">
          <h2 className="text-2xl text-fg">Nenhuma foto por aqui</h2>
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
    <div className="space-y-10">
      <Callout tone="demo" title="Demonstração — sua foto não foi analisada">
        Esta é uma prévia ilustrativa da experiência. Nenhuma inteligência
        artificial processou sua imagem, e o conteúdo abaixo é um texto fixo,
        igual para todas as pessoas.
      </Callout>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-start">
        <figure className="mx-auto w-full max-w-56 space-y-2">
          <div className="overflow-hidden rounded-2xl border border-line bg-bg-deep">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL blob local; next/image não se aplica */}
            <img
              src={photo.url}
              alt="Sua foto, mantida apenas neste dispositivo"
              className="aspect-[3/4] w-full object-cover"
            />
          </div>
          <figcaption className="text-xs text-fg-subtle">
            Mantida apenas neste dispositivo.
          </figcaption>
        </figure>

        <Card className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="demo">Exemplo fixo</Badge>
            <Badge>Não personalizado</Badge>
          </div>
          <h2 className="text-2xl leading-snug text-fg">
            As três linhas principais na tradição da quiromancia
          </h2>
          <div className="flex gap-5">
            <PalmIllustration className="w-24 shrink-0" />
            <ul className="space-y-4">
              {palmLines.map((line) => (
                <li key={line.id} className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-fg">
                    <span
                      aria-hidden
                      className="h-0.5 w-4 rounded-full"
                      style={{ backgroundColor: line.color }}
                    />
                    {line.label}
                  </p>
                  <p className="text-sm leading-relaxed text-fg-muted">
                    {traditionNotes[line.id]}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <p className="border-t border-line-soft pt-4 text-xs leading-relaxed text-fg-subtle">
            Na versão final, a prévia descreverá características observadas na
            sua foto — quando a imagem permitir — sempre separando o que foi
            observado do que é interpretação simbólica.
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-fg-muted">
          O relatório completo une suas mãos ao céu do seu nascimento.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={routes.birthData} size="lg">
            Continuar com meus dados de nascimento
          </ButtonLink>
          <Button
            variant="ghost"
            onClick={() => {
              clearPhoto();
              router.push(routes.home);
            }}
          >
            Descartar foto e sair
          </Button>
        </div>
      </div>
    </div>
  );
}
