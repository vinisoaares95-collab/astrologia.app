import { ButtonLink, Container, SectionHeading } from "@/components/ui";
import { Mandala } from "@/components/visuals/mandala";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <Container size="narrow" className="space-y-8 py-20 text-center">
      <Mandala className="mx-auto size-32 opacity-50" />
      <SectionHeading
        as="h1"
        align="center"
        title="Esta página saiu de órbita"
        description="O endereço não existe ou foi alterado."
      />
      <ButtonLink href={routes.home}>Voltar ao início</ButtonLink>
    </Container>
  );
}
