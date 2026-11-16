#!/usr/bin/env python3
"""Publication d'une fiche depuis une proposition GitHub validée par le propriétaire."""
import datetime as dt
import json
import os
import pathlib
import re
import sys
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

FIELDS = {
    "Nom du lycée": "lycee",
    "Commune": "commune",
    "Formation ou métier à découvrir": "formation",
    "Domaine professionnel": "domaine",
    "Adresse du lycée": "adresse",
    "Public concerné": "public",
    "Ouverture des demandes": "date_ouverture_inscription",
    "Clôture des demandes": "date_limite_inscription",
    "Date du mini-stage": "date_debut",
    "Fin du mini-stage": "date_fin",
    "Horaires ou durée": "horaire",
    "Nombre de places": "places",
    "Programme et activités": "description",
    "Précisions sur les modalités": "modalites",
    "Adresse mail professionnelle": "contact_email",
    "Site internet du lycée": "url_lycee",
}
MAX_LENGTH = {
    "lycee": 140, "commune": 90, "formation": 170, "domaine": 90,
    "adresse": 240, "public": 90, "horaire": 100,
    "description": 1400, "modalites": 1400, "contact_email": 190,
    "url_lycee": 500,
}
DATE_KEYS = [
    "date_ouverture_inscription", "date_limite_inscription",
    "date_debut", "date_fin",
]

def parse_sections(body):
    # GitHub Issue Forms utilise les en-têtes « ### Nom du champ ».
    values = {}
    for chunk in re.split(r"(?m)^### ", body):
        if "\n" not in chunk:
            continue
        label, value = chunk.split("\n", 1)
        label = label.strip()
        if label not in FIELDS:
            continue
        value = value.strip()
        if value in ("_No response_", "No response", "Aucune réponse", "N/A"):
            value = ""
        values[FIELDS[label]] = value
    return values

def valid_date(value, field):
    if not value:
        return ""
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError(f"{field} : format attendu AAAA-MM-JJ")
    try:
        dt.date.fromisoformat(value)
    except ValueError as err:
        raise ValueError(f"{field} : date impossible") from err
    return value

def main():
    event = json.loads(pathlib.Path(os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
    owner = os.environ["GITHUB_REPOSITORY"].split("/")[0]
    if event.get("comment", {}).get("body", "").strip() != "/publier-mini-stage":
        raise ValueError("Commande de publication incorrecte")
    if event.get("comment", {}).get("user", {}).get("login") != owner:
        raise ValueError("Seul le propriétaire du dépôt peut autoriser une publication")
    issue = event.get("issue", {})
    if issue.get("pull_request"):
        raise ValueError("La proposition doit être une issue GitHub")

    data = parse_sections(issue.get("body") or "")
    for key in ("lycee", "commune", "formation", "domaine"):
        if not data.get(key):
            raise ValueError(f"Champ obligatoire manquant : {key}")
    for key, limit in MAX_LENGTH.items():
        if len(data.get(key, "")) > limit:
            raise ValueError(f"Valeur trop longue : {key}")

    for key in DATE_KEYS:
        data[key] = valid_date(data.get(key, ""), key)
    a = data["date_ouverture_inscription"]
    b = data["date_limite_inscription"]
    if a and b and a > b:
        raise ValueError("La clôture des demandes doit être postérieure à l'ouverture")
    if data["date_debut"] and data["date_fin"] and data["date_debut"] > data["date_fin"]:
        raise ValueError("La fin du mini-stage doit être postérieure à son début")

    places = data.get("places", "").strip()
    if places:
        if not re.fullmatch(r"\d{1,5}", places):
            raise ValueError("Le nombre de places doit être un entier positif")
        data["places"] = int(places)
    else:
        data["places"] = None

    email = data.get("contact_email", "")
    if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise ValueError("Adresse mail professionnelle invalide")
    url = data.get("url_lycee", "")
    if url:
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("L'URL du lycée doit commencer par https:// ou http://")

    # La publication est datée au moment de la validation, en heure de Paris.
    publication = dt.datetime.now(ZoneInfo("Europe/Paris")).date().isoformat()
    issue_number = issue["number"]
    item = {
        "id": f"proposition-github-{issue_number}",
        "lycee": data["lycee"],
        "commune": data["commune"],
        "adresse": data.get("adresse", ""),
        "formation": data["formation"],
        "domaine": data["domaine"],
        "type_formation": "Découverte métiers",
        "date_debut": data["date_debut"],
        "date_fin": data["date_fin"],
        "horaire": data.get("horaire", ""),
        "public": data.get("public", ""),
        "places": data["places"],
        "date_publication": publication,
        "date_ouverture_inscription": a,
        "date_limite_inscription": b,
        "description": data.get("description", ""),
        "metiers": "",
        "modalites": (
            data.get("modalites", "")
            + "\nLa demande est effectuée par le secrétariat de l'établissement "
              "scolaire de l'élève pendant la période prévue. Le lycée d'accueil "
              "transmet ensuite une convention à cet établissement."
        ).strip(),
        "url_inscription": "",
        "contact_email": email,
        "contact_telephone": "",
        "url_lycee": url,
        "url_document": "",
    }
    file = pathlib.Path("data/mini-stages.json")
    current = json.loads(file.read_text(encoding="utf-8"))
    if not isinstance(current, list):
        raise ValueError("Le catalogue doit contenir une liste")
    # Une republication de la même proposition ne rouvre pas ses demandes.
    previous = next((row for row in current if row.get("id") == item["id"]), None)
    if previous and previous.get("date_publication"):
        item["date_publication"] = previous["date_publication"]
    current = [entry for entry in current if entry.get("id") != item["id"]]
    current.append(item)
    current.sort(key=lambda entry: (not bool(entry.get("date_debut")), entry.get("date_debut", ""), entry.get("lycee", "")))
    file.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Fiche prête à publier depuis l'issue #{issue_number}")

if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError) as exc:
        print(f"Erreur : {exc}", file=sys.stderr)
        sys.exit(1)
