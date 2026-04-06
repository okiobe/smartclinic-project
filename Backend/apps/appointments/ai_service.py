import json
import os
import re

from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _extract_json_object(content: str) -> dict:
    cleaned = content.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```json\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if match:
        return json.loads(match.group(0))

    raise ValueError("Impossible d'extraire un JSON valide depuis la réponse IA.")


def generate_soap_from_notes(notes: str) -> dict:
    prompt = f"""
Tu es un assistant médical.

Transforme les notes suivantes en note SOAP professionnelle en français.

Règles :
- Ne rien inventer
- Rester fidèle aux informations
- Style clinique clair
- Retourner uniquement un JSON avec les clés exactes :
  subjective, objective, assessment, plan

Notes :
{notes}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "Tu es un assistant de rédaction clinique. Retourne uniquement du JSON valide.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )

    content = response.choices[0].message.content or ""
    data = _extract_json_object(content)

    return {
        "subjective": data.get("subjective", "") or "",
        "objective": data.get("objective", "") or "",
        "assessment": data.get("assessment", "") or "",
        "plan": data.get("plan", "") or "",
    }