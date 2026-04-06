import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def transcribe_audio_file(audio_file) -> str:
    audio_file.seek(0)

    response = client.audio.transcriptions.create(
        model="gpt-4o-mini-transcribe",
        file=(
            audio_file.name,
            audio_file.read(),
            getattr(audio_file, "content_type", "application/octet-stream"),
        ),
    )

    text = getattr(response, "text", "") or ""
    return text.strip()