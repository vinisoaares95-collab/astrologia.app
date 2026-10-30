"""Gera valores de referência independentes para os testes do motor astrológico.

Fonte: efemérides JPL DE421 (via skyfield-data) processadas pelo Skyfield.
Não usa Swiss Ephemeris em nenhum ponto.

- Planetas: posição geocêntrica APARENTE (tempo de luz, aberração, deflexão),
  na eclíptica e equinócio VERDADEIROS da data (skyfield.framelib.ecliptic_frame).
- ASC, MC e cúspides Placidus: fórmulas clássicas implementadas aqui, usando o
  tempo sideral aparente (GAST) e a obliquidade verdadeira calculados pelo Skyfield.

Os casos são nascimentos FICTÍCIOS, com o instante já informado em UTC
(a conversão de horário local é escopo da Fase 02C).

Uso (fora do projeto, em ambiente isolado):
    python -m venv refenv && refenv/bin/pip install skyfield==1.55 skyfield-data==7.0.0
    refenv/bin/python scripts/reference/generate_de421_reference.py > \
        src/features/astrology/__fixtures__/de421-reference.json
"""

import json
import math
import sys
from importlib.metadata import version

from skyfield.api import Loader, wgs84  # noqa: F401
from skyfield.framelib import ecliptic_frame
from skyfield_data import get_skyfield_data_path

CASES = [
    {"id": "sao-paulo-1990", "utc": [1990, 5, 12, 17, 30], "lat": -23.5505, "lon": -46.6333, "note": "Brasil, hemisfério sul, longitude oeste"},
    {"id": "recife-1986", "utc": [1986, 1, 15, 17, 45], "lat": -8.0476, "lon": -34.8770, "note": "Brasil, período de horário de verão (instante já em UTC)"},
    {"id": "rio-branco-2009", "utc": [2009, 6, 1, 3, 10], "lat": -9.9747, "lon": -67.8076, "note": "Brasil, Acre após a mudança de fuso de 2008"},
    {"id": "lisboa-1975-meia-noite", "utc": [1975, 11, 23, 23, 55], "lat": 38.7223, "lon": -9.1393, "note": "Fora do Brasil, 5 min antes da virada de data UTC"},
    {"id": "nova-york-2001", "utc": [2001, 9, 30, 4, 20], "lat": 40.7128, "lon": -74.0060, "note": "Fora do Brasil, hemisfério norte"},
    {"id": "ushuaia-1960", "utc": [1960, 7, 4, 8, 0], "lat": -54.8019, "lon": -68.3030, "note": "Latitude sul elevada (Placidus definido)"},
    {"id": "reykjavik-1980", "utc": [1980, 6, 21, 0, 0], "lat": 64.1466, "lon": -21.9426, "note": "Latitude norte elevada, abaixo do círculo polar"},
    {"id": "tromso-1999-polar", "utc": [1999, 12, 21, 12, 0], "lat": 69.6492, "lon": 18.9553, "note": "Acima do círculo polar: Placidus indefinido"},
    {"id": "equinocio-2000-limite", "utc": [2000, 3, 20, 7, 30], "lat": -15.7939, "lon": -47.8828, "note": "Sol a poucos minutos de arco de 0° Áries"},
    {"id": "mercurio-retro-2016", "utc": [2016, 9, 10, 12, 0], "lat": -12.9714, "lon": -38.5014, "note": "Mercúrio retrógrado"},
    {"id": "porto-alegre-1905", "utc": [1905, 3, 1, 12, 0], "lat": -30.0346, "lon": -51.2177, "note": "Início do século XX"},
    {"id": "sao-paulo-1910-lmt-segundos", "utc": [1910, 1, 1, 15, 6, 28], "lat": -23.5505, "lon": -46.6333, "note": "Hora média local de São Paulo (UTC−03:06:28): instante com segundos"},
    {"id": "recife-2020-segundos", "utc": [2020, 6, 15, 12, 34, 56], "lat": -8.0476, "lon": -34.8770, "note": "Instante moderno com segundos"},
    {"id": "manaus-2024-bissexto", "utc": [2024, 2, 29, 23, 59], "lat": -3.1190, "lon": -60.0217, "note": "29 de fevereiro, perto da virada de data"},
]

BODIES = {
    "sun": "sun",
    "moon": "moon",
    "mercury": "mercury",
    "venus": "venus",
    "mars": "mars",
    "jupiter": "jupiter barycenter",
    "saturn": "saturn barycenter",
    "uranus": "uranus barycenter",
    "neptune": "neptune barycenter",
    "pluto": "pluto barycenter",
}


def norm(deg):
    return deg % 360.0


def ra_to_ecliptic_lon(ra_deg, eps_deg):
    """Longitude eclíptica de um ponto SOBRE a eclíptica com ascensão reta dada."""
    ra, eps = math.radians(ra_deg), math.radians(eps_deg)
    return norm(math.degrees(math.atan2(math.sin(ra), math.cos(ra) * math.cos(eps))))


def angles_and_placidus(ramc, eps, lat):
    r, e, phi = math.radians(ramc), math.radians(eps), math.radians(lat)
    mc = ra_to_ecliptic_lon(ramc, eps)
    asc = norm(math.degrees(math.atan2(-math.cos(r), math.sin(e) * math.tan(phi) + math.cos(e) * math.sin(r))))
    if norm(asc - mc) > 180:  # garante o ponto de interseção a leste
        asc = norm(asc + 180)

    def cusp(fraction, below):
        lam = ra_to_ecliptic_lon(ramc + (180 if below else 0) + (90 * fraction if not below else -90 * fraction), eps)
        for _ in range(200):
            dec = math.asin(math.sin(e) * math.sin(math.radians(lam)))
            x = -math.tan(phi) * math.tan(dec)
            if abs(x) > 1:
                return None
            sda = math.degrees(math.acos(x))
            ra = ramc + fraction * sda if not below else ramc + 180 - fraction * (180 - sda)
            new = ra_to_ecliptic_lon(ra, eps)
            if abs(((new - lam + 180) % 360) - 180) < 1e-10:
                return new
            lam = new
        return None

    c11, c12 = cusp(1 / 3, False), cusp(2 / 3, False)
    c2, c3 = cusp(2 / 3, True), cusp(1 / 3, True)
    if None in (c11, c12, c2, c3):
        cusps = None
    else:
        first = [asc, c2, c3, norm(mc + 180), norm(c11 + 180), norm(c12 + 180)]
        cusps = first + [norm(c + 180) for c in first]
        cusps[9], cusps[10], cusps[11] = mc, c11, c12
    return asc, mc, cusps


def main():
    load = Loader(get_skyfield_data_path(), expire=False)
    ts = load.timescale(builtin=True)
    eph = load("de421.bsp")
    earth = eph["earth"]
    out = []
    for case in CASES:
        y, mo, d, h, mi, *rest = case["utc"]
        sec = rest[0] if rest else 0
        # UTC com segundos bissextos só existe a partir de 1972. Antes disso, o
        # horário civil seguia o Tempo Universal: tratamos a entrada como UT1
        # (mesma convenção do swe_utc_to_jd do Swiss Ephemeris).
        t = ts.utc(y, mo, d, h, mi, sec) if y >= 1972 else ts.ut1(y, mo, d, h, mi, sec)
        bodies = {}
        for key, target in BODIES.items():
            app = earth.at(t).observe(eph[target]).apparent()
            lat, lon, _ = app.frame_latlon(ecliptic_frame)
            bodies[key] = {"lon": lon.degrees, "lat": lat.degrees}
        dpsi, deps = t._nutation_angles_radians
        eps_true = math.degrees(t._mean_obliquity_radians + deps)
        ramc = norm(t.gast * 15.0 + case["lon"])
        asc, mc, cusps = angles_and_placidus(ramc, eps_true, case["lat"])
        out.append({
            **case,
            "jd_ut1": t.ut1,
            "jd_tt": t.tt,
            "delta_t_seconds": (t.tt - t.ut1) * 86400.0,
            "ramc": ramc,
            "true_obliquity": eps_true,
            "bodies": bodies,
            "asc": asc,
            "mc": mc,
            "placidus_cusps": cusps,
        })
    print(json.dumps({
        "source": "JPL DE421 via Skyfield; ASC/MC/Placidus por fórmulas clássicas (oráculo independente)",
        "frame": "geocêntrico, posição aparente, eclíptica e equinócio verdadeiros da data",
        "timescale": "entrada em UTC a partir de 1972 e em UT1 antes de 1972; TT e UT1 pelo timescale embutido do Skyfield",
        "generator": "scripts/reference/generate_de421_reference.py",
        "versions": {"skyfield": version("skyfield"), "skyfield-data": version("skyfield-data"), "python": sys.version.split()[0]},
        "notes": [
            "Júpiter a Plutão usam o baricentro do sistema (DE421); a diferença para o centro do planeta é inferior a 1 segundo de arco.",
            "Casos fictícios; nenhum dado pessoal.",
        ],
        "cases": out,
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
