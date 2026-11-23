/**
 * O que a interface diz sobre a foto (03F.2, Etapa B), conforme o modo em
 * que a análise está. Cada frase corresponde ao que a implementação faz:
 *
 * - no navegador, a foto é redesenhada em canvas e recodificada em JPEG sem
 *   metadados (o servidor recusa JPEG com EXIF, XMP, IPTC ou imagem embutida); o arquivo
 *   original no aparelho não é alterado; a cópia fica só na memória da tela;
 * - com a análise ligada, a cópia preparada vai ao servidor do Sidera quando
 *   a pessoa toca em "Analisar"; em modo real, vai também à Anthropic;
 * - o servidor não grava a foto (nem disco, nem banco, nem log); ela existe
 *   na memória durante a análise. O resultado (sem a foto) e uma impressão
 *   digital da foto (hash) ficam na memória por até 10 minutos, para não
 *   repetir a mesma análise;
 * - a retenção pelo provedor segue as regras dele (03G.3): a política
 *   comercial da Anthropic prevê exclusão em até 30 dias, com exceções; a
 *   documentação técnica indica que certas chamadas não retêm conteúdo por
 *   padrão. Qual regra vale para a conta do Sidera não está confirmado, por
 *   isso o texto cita as duas e não promete retenção zero nem prazo da conta.
 */
export type PhotoMode = "off" | "simulated" | "real";

export const PHOTO_PRIVACY = {
  /** Aviso curto da introdução. */
  intro: {
    off: {
      title: "Nesta versão, sua foto não é enviada",
      body: "A imagem é preparada só no seu navegador, sem os dados de localização e do aparelho (EXIF/GPS). Não é enviada nem analisada, e é descartada quando você sai do fluxo.",
    },
    simulated: {
      title: "Nesta versão interna, a análise é simulada",
      body: "A imagem é preparada no seu navegador, sem os dados de localização e do aparelho (EXIF/GPS). Ao tocar em Analisar, essa cópia vai ao servidor do Sidera só para conferência do arquivo; nenhuma inteligência artificial a observa.",
    },
    real: {
      title: "Como a sua foto é usada",
      body: "A imagem é preparada no seu navegador, sem os dados de localização e do aparelho (EXIF/GPS). Ao tocar em Analisar, essa cópia é enviada ao servidor do Sidera e à Anthropic, provedor de inteligência artificial, para observar a palma. O Sidera não grava a foto. Detalhes no consentimento.",
    },
  },
  /** Abaixo da foto preparada, antes do envio. */
  prepared: {
    off: "A foto foi redesenhada neste aparelho, sem dados de localização nem do celular. Nesta versão, ela não é enviada.",
    simulated:
      "A foto foi redesenhada neste aparelho, sem dados de localização nem do celular. Ela só sai daqui quando você tocar em Analisar, e vai apenas ao servidor do Sidera.",
    real: "A foto foi redesenhada neste aparelho, sem dados de localização nem do celular. Ela só sai daqui quando você tocar em Analisar.",
  },
  /** Durante a análise. */
  running: {
    simulated:
      "A cópia da foto está no servidor do Sidera só para conferência; ele não a grava.",
    real: "A cópia da foto foi enviada ao servidor do Sidera e à Anthropic para a análise; o Sidera não a grava.",
  },
  /** Na prévia personalizada. */
  preview: {
    simulated:
      "Uma cópia da foto foi ao servidor do Sidera só para conferência; nenhuma IA a analisou. Neste aparelho, a foto fica na memória desta tela.",
    real: "Uma cópia preparada da foto foi enviada para análise (Sidera e Anthropic). O Sidera não a grava; neste aparelho, ela fica na memória desta tela.",
  },
} as const;

/** Seções do consentimento, conforme o modo (mesma ordem na tela). */
export function consentSections(
  mode: PhotoMode,
): readonly { title: string; body: string }[] {
  const purpose = {
    title: "Para que serve a foto",
    body: "A foto da palma da sua mão dominante será usada apenas para a leitura simbólica das mãos do Sidera (características da mão e linhas da palma). É uma interpretação da tradição da quiromancia, não um diagnóstico nem uma previsão.",
  };
  const prepare = {
    title: "Antes de qualquer envio",
    body: "A foto é redesenhada no seu navegador, sem os dados de localização e do aparelho (EXIF/GPS). O arquivo original no seu aparelho não é alterado. Neste aparelho, a cópia preparada fica só na memória desta tela e sai dela quando você descarta a foto ou sai do fluxo.",
  };
  const rights = {
    title: "Seus direitos",
    body:
      mode === "off"
        ? "Você pode desistir a qualquer momento: basta descartar a foto ou sair do fluxo. A leitura é exclusiva para maiores de 18 anos."
        : "Você pode desistir a qualquer momento: descarte a foto ou saia do fluxo. Depois do envio, o descarte vale para a cópia neste aparelho; o que já foi enviado segue as regras acima. A leitura é exclusiva para maiores de 18 anos.",
  };
  if (mode === "off")
    return [
      purpose,
      prepare,
      {
        title: "O que acontece nesta versão",
        body: "Nesta versão de teste, nada é enviado nem analisado.",
      },
      rights,
    ];
  const keeps = {
    title: "O que o Sidera guarda",
    body: "O Sidera não grava a foto em disco, banco de dados ou registro: ela fica só na memória do servidor durante a análise. Para não repetir a mesma análise, o resultado (o texto da leitura, sem a foto) e uma impressão digital da foto, que não permite reconstruí-la, ficam na memória do servidor por até 10 minutos.",
  };
  if (mode === "simulated")
    return [
      purpose,
      prepare,
      {
        title: "O que é enviado nesta versão interna",
        body: "Ao tocar em Analisar, a cópia preparada vai ao servidor do Sidera só para conferência do arquivo. Nenhuma inteligência artificial a observa e o resultado é simulado.",
      },
      keeps,
      rights,
    ];
  return [
    purpose,
    prepare,
    {
      title: "O que é enviado",
      body: "Ao tocar em Analisar, a cópia preparada vai ao servidor do Sidera e a um provedor de inteligência artificial (Anthropic, nos Estados Unidos), apenas para observar características visíveis da palma.",
    },
    keeps,
    {
      title: "Uso pelo provedor",
      body: "Pelos termos comerciais da Anthropic, o conteúdo enviado pela API não é usado para treinar modelos. A política comercial dela prevê a exclusão do que é enviado e devolvido em até 30 dias, com exceções, como conteúdo sinalizado pelos sistemas de segurança, que pode ser mantido por mais tempo, ou exigência legal. A documentação técnica dela indica que, em certas chamadas, esse conteúdo não é retido por padrão. Qual dessas regras vale para a conta do Sidera ainda está sendo confirmado.",
    },
    rights,
  ];
}
