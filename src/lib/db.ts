import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Acesso ao banco (preparado para fases futuras).
 *
 * O cliente é criado sob demanda, para que o app rode sem DATABASE_URL
 * enquanto nenhuma funcionalidade depende do banco. A instância é reaproveitada
 * entre recargas do servidor de desenvolvimento e entre chamadas em produção.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não está configurada. Veja .env.example e o README.",
    );
  }

  globalForPrisma.prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  return globalForPrisma.prisma;
}
