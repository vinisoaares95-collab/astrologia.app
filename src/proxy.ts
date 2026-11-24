import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_REALM,
  accessDecision,
  NO_INDEX,
} from "./features/access/access-gate";

/**
 * Proxy (Next.js 16).
 *
 * 1. Acesso restrito (Fase 03G.1): em homologação, toda rota exige as
 *    credenciais do ambiente (ver `access-gate.ts`). Na Vercel sem
 *    credenciais configuradas, tudo responde 503: o ambiente nunca abre por
 *    engano.
 * 2. Nenhuma resposta é indexável (X-Robots-Tag), além do `robots` das
 *    páginas.
 * 3. Leitura do relatório integrado (Fase 04A): só interna. Sem
 *    SIDERA_REPORT_READING=1 (jornada real, 04B) nem SIDERA_REPORT_DEMO=1
 *    (exemplos, 04A) no servidor, a rota responde 404 ANTES de renderizar (o
 *    `notFound()` da página, dentro do streaming, mantém o status 200). A
 *    página repete a checagem e separa os dois modos.
 */
const READING = /^\/relatorio\/leitura(\/|$)/;

export function proxy(request: NextRequest) {
  const access = accessDecision(
    process.env,
    request.headers.get("authorization"),
  );
  if (access.kind === "misconfigured")
    return new NextResponse("Ambiente indisponível.", {
      status: 503,
      headers: { "x-robots-tag": NO_INDEX, "cache-control": "no-store" },
    });
  if (access.kind === "challenge")
    return new NextResponse("Acesso restrito.", {
      status: 401,
      headers: {
        "www-authenticate": `Basic realm="${ACCESS_REALM}", charset="UTF-8"`,
        "x-robots-tag": NO_INDEX,
        "cache-control": "no-store",
      },
    });

  if (
    READING.test(request.nextUrl.pathname) &&
    process.env.SIDERA_REPORT_READING !== "1" &&
    process.env.SIDERA_REPORT_DEMO !== "1"
  )
    return new NextResponse("Not found", {
      status: 404,
      headers: { "x-robots-tag": "noindex", "cache-control": "no-store" },
    });

  const response = NextResponse.next();
  response.headers.set("x-robots-tag", NO_INDEX);
  return response;
}

export const config = {
  // Tudo, exceto os arquivos estáticos do build (sem dados nem segredos).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
