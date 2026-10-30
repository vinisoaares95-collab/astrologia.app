import type { ApproximateMargin } from "./contract";
import type { TimePrecision } from "./components/time-precision-field";

/** Casos FICTÍCIOS para verificar a normalização (protótipo). */
export const DEMO_CASES: {
  label: string;
  date: string;
  time: string;
  precision: TimePrecision;
  margin?: ApproximateMargin;
  placeId: string;
}[] = [
  {
    label: "Recife, horário de verão (1986)",
    date: "15/01/1986",
    time: "14:30",
    precision: "exact",
    placeId: "ibge:2611606",
  },
  {
    label: "São Paulo, horário inexistente",
    date: "02/11/1985",
    time: "00:30",
    precision: "exact",
    placeId: "ibge:3550308",
  },
  {
    label: "São Paulo, horário duplicado",
    date: "14/03/1986",
    time: "23:30",
    precision: "exact",
    placeId: "ibge:3550308",
  },
  {
    label: "Rio Branco, após a mudança de fuso",
    date: "25/06/2008",
    time: "12:00",
    precision: "exact",
    placeId: "ibge:1200401",
  },
  {
    label: "Nova York, virada de data em UTC",
    date: "29/09/2001",
    time: "22:20",
    precision: "exact",
    placeId: "geonames:5128581",
  },
  {
    label: "Bom Jesus (PI), horário aproximado",
    date: "12/05/1990",
    time: "14:30",
    precision: "approximate",
    margin: 30,
    placeId: "ibge:2201903",
  },
  {
    label: "São Paulo, horário desconhecido",
    date: "02/11/1985",
    time: "",
    precision: "unknown",
    placeId: "ibge:3550308",
  },
  {
    label: "Kashgar, fuso indefinido",
    date: "12/05/1990",
    time: "14:30",
    precision: "exact",
    placeId: "geonames:1280849",
  },
];
