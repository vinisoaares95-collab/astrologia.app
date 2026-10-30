"""Gera referências independentes para a conversão de horário local → UTC.

Implementação: `zoneinfo` (biblioteca padrão do Python) com a base IANA do
pacote `tzdata` do PyPI — código e cópia da base diferentes do ICU usado
pelo Node.js no Sidera.

Uso (ambiente isolado):
    python -m venv refenv && refenv/bin/pip install tzdata
    PYTHONTZPATH= refenv/bin/python scripts/reference/generate_zoneinfo_reference.py \
        > src/features/birth-time/__fixtures__/zoneinfo-reference.json
"""

import json
import sys
from datetime import datetime, timezone
from importlib.metadata import version
from zoneinfo import ZoneInfo

# (id, zona, ano, mês, dia, hora, minuto, descrição)
CASES = [
    ("recife-comum", "America/Recife", 1990, 5, 12, 14, 30, "Cidade brasileira, data comum"),
    ("recife-verao-1986", "America/Recife", 1986, 1, 15, 14, 30, "Nordeste com horário de verão em 1985/86"),
    ("sp-inicio-verao-1985", "America/Sao_Paulo", 1985, 11, 2, 0, 30, "Início do horário de verão: horário inexistente"),
    ("sp-fim-verao-1986", "America/Sao_Paulo", 1986, 3, 14, 23, 30, "Fim do horário de verão: horário duplicado"),
    ("sp-inicio-verao-2018", "America/Sao_Paulo", 2018, 11, 4, 0, 30, "Último início de horário de verão no Brasil"),
    ("sp-fim-verao-2019", "America/Sao_Paulo", 2019, 2, 16, 23, 30, "Último fim de horário de verão no Brasil"),
    ("sp-sem-verao-2019", "America/Sao_Paulo", 2019, 11, 3, 0, 30, "Após a extinção (Decreto 9.772/2019): horário existe"),
    ("sp-virada-de-data", "America/Sao_Paulo", 1995, 11, 5, 23, 30, "Data local diferente da data UTC"),
    ("sp-1910-lmt", "America/Sao_Paulo", 1910, 1, 1, 12, 0, "Antes de 1914: hora média local"),
    ("sp-1963-verao", "America/Sao_Paulo", 1963, 12, 15, 12, 0, "Horário de verão de 1963"),
    ("sp-1965-fim-verao-dia-31", "America/Sao_Paulo", 1965, 3, 31, 12, 0, "tzdb 2026f: verão de 1965 terminou em 31/03 às 24:00"),
    ("sp-1965-duplicado", "America/Sao_Paulo", 1965, 3, 31, 23, 30, "tzdb 2026f: 23:00–23:59 de 31/03/1965 ocorreu duas vezes"),
    ("sp-1966-fim-verao", "America/Sao_Paulo", 1966, 3, 1, 0, 30, "tzdb 2026f: verão de 1966 terminou em 01/03 à 01:00"),
    ("apia-2011-vespera", "Pacific/Apia", 2011, 12, 29, 23, 59, "Último minuto antes do dia pulado em Samoa"),
    ("apia-2011-dia-seguinte", "Pacific/Apia", 2011, 12, 31, 0, 0, "Samoa: dia 31 já em UTC+14"),
    ("kiritimati-1994-dia-pulado", "Pacific/Kiritimati", 1994, 12, 31, 12, 0, "Kiritimati pulou o dia 31/12/1994"),
    ("recife-1963", "America/Recife", 1963, 12, 5, 12, 0, "1963: Nordeste começou depois do Sudeste"),
    ("rio-branco-2008-antes", "America/Rio_Branco", 2008, 6, 23, 12, 0, "Acre antes da mudança de fuso (UTC−5)"),
    ("rio-branco-2008-lacuna", "America/Rio_Branco", 2008, 6, 24, 0, 30, "Acre: salto de −5 para −4 (Lei 11.662/2008)"),
    ("rio-branco-2008-depois", "America/Rio_Branco", 2008, 6, 25, 12, 0, "Acre depois da mudança (UTC−4)"),
    ("rio-branco-2013-duplicado", "America/Rio_Branco", 2013, 11, 9, 23, 30, "Acre volta a UTC−5 em 2013: horário duplicado"),
    ("bahia-2012", "America/Bahia", 2012, 1, 15, 12, 0, "Bahia com horário de verão só em 2011/12"),
    ("bahia-2013", "America/Bahia", 2013, 1, 15, 12, 0, "Bahia sem horário de verão"),
    ("noronha-1990", "America/Noronha", 1990, 1, 15, 12, 0, "Fernando de Noronha"),
    ("manaus-1986", "America/Manaus", 1986, 1, 15, 12, 0, "Amazonas em 1985/86"),
    ("lisboa-meia-noite", "Europe/Lisbon", 1975, 11, 23, 23, 55, "Exterior, perto da meia-noite"),
    ("nova-york-2001", "America/New_York", 2001, 9, 30, 0, 20, "Exterior, horário de verão americano"),
    ("nova-york-2007-lacuna", "America/New_York", 2007, 3, 11, 2, 30, "Regra americana de 2007: horário inexistente"),
    ("nova-york-2006-regra-antiga", "America/New_York", 2006, 3, 12, 2, 30, "Mesma data pela regra antiga: horário existe"),
    ("londres-1970", "Europe/London", 1970, 1, 15, 12, 0, "British Standard Time (1968–71): UTC+1 no inverno"),
    ("moscou-2012", "Europe/Moscow", 2012, 1, 15, 12, 0, "Moscou com UTC+4 permanente (2011–2014)"),
    ("moscou-2015", "Europe/Moscow", 2015, 1, 15, 12, 0, "Moscou com UTC+3"),
    ("apia-2011-dia-pulado", "Pacific/Apia", 2011, 12, 30, 12, 0, "Samoa pulou o dia 30/12/2011"),
    ("katmandu-1985", "Asia/Kathmandu", 1985, 6, 1, 12, 0, "Nepal antes de adotar UTC+5:45"),
    ("toquio-1990", "Asia/Tokyo", 1990, 6, 1, 12, 0, "Japão, sem horário de verão"),
]


def resolve(zone, y, mo, d, h, mi):
    tz = ZoneInfo(zone)
    out = []
    for fold in (0, 1):
        local = datetime(y, mo, d, h, mi, fold=fold, tzinfo=tz)
        utc = local.astimezone(timezone.utc)
        back = utc.astimezone(tz)
        if (back.year, back.month, back.day, back.hour, back.minute) == (y, mo, d, h, mi):
            out.append((utc, int(local.utcoffset().total_seconds())))
    unique = sorted({u for u, _ in out})
    if not unique:
        return {"kind": "nonexistent"}
    offsets = {u: o for u, o in out}
    instants = [{"utc": u.strftime("%Y-%m-%dT%H:%M:%SZ"), "offsetSeconds": offsets[u]} for u in unique]
    if len(instants) == 1:
        return {"kind": "unique", **instants[0]}
    return {"kind": "ambiguous", "earlier": instants[0], "later": instants[-1]}


cases = []
for cid, zone, y, mo, d, h, mi, note in CASES:
    cases.append({"id": cid, "timeZone": zone, "local": [y, mo, d, h, mi], "note": note, "expected": resolve(zone, y, mo, d, h, mi)})

print(json.dumps({
    "source": "Python zoneinfo + pacote tzdata (PyPI), independente do ICU do Node",
    "generator": "scripts/reference/generate_zoneinfo_reference.py",
    "versions": {"tzdata": version("tzdata"), "python": sys.version.split()[0]},
    "cases": cases,
}, indent=2, ensure_ascii=False))
