import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (Next.js 16) — só para a leitura do relatório integrado (Fase 04A).
 *
 * A leitura é demonstração interna: sem SIDERA_REPORT_DEMO=1 no servidor, a
 * rota responde 404 ANTES de renderizar (o `notFound()` da página, dentro do
 * streaming, mantém o status 200). A página repete a checagem.
 */
export function proxy(request: NextRequest) {
  void request;
  if (process.env.SIDERA_REPORT_DEMO === "1") return NextResponse.next();
  return new NextResponse("Not found", {
    status: 404,
    headers: { "x-robots-tag": "noindex", "cache-control": "no-store" },
  });
}

export const config = {
  matcher: ["/relatorio/leitura", "/relatorio/leitura/:path*"],
};
