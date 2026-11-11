/**
 * Chave da API da Anthropic usada pelo Sidera (somente servidor).
 *
 * Prefere SIDERA_ANTHROPIC_API_KEY, variável exclusiva do Sidera: no ambiente
 * de nuvem, ANTHROPIC_API_KEY é reservada à autenticação do próprio Claude
 * Code e não chega ao processo. ANTHROPIC_API_KEY fica como alternativa para
 * uso local. A chave é passada explicitamente ao SDK; nunca é registrada.
 */
export function anthropicApiKey(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  return (
    env.SIDERA_ANTHROPIC_API_KEY?.trim() ||
    env.ANTHROPIC_API_KEY?.trim() ||
    undefined
  );
}
