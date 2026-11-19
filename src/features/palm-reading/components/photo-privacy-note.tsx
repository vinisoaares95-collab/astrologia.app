"use client";

import { Callout } from "@/components/ui";

import {
  photoModeOf,
  useAnalysisAvailability,
} from "../lib/use-analysis-availability";
import { PHOTO_PRIVACY } from "../privacy-copy";

/** Aviso da introdução: o que acontece com a foto no modo atual. */
export function PhotoPrivacyNote() {
  const note = PHOTO_PRIVACY.intro[photoModeOf(useAnalysisAvailability())];
  return (
    <Callout tone="privacy" title={note.title}>
      {note.body}
    </Callout>
  );
}
