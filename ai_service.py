"""Grounded, schema-validated Gemini operations on Vertex AI.

No fake AI responses. Missing credentials return an explicit unavailable result.
"""
import os
import time
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class Output(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)


class ListingDraft(Output):
    crop: str | None = Field(description='English crop name; null when unspecified')
    qty: float | None = Field(ge=0.01, le=100000, description='Quantity in kilograms')
    price: float | None = Field(ge=0.01, le=100000, description='Asking LKR per kilogram')
    district: str | None
    summary: str = Field(max_length=350)
    questions: list[str] = Field(max_length=5)


class PhotoReview(Output):
    valid_produce_photo: bool
    image_observation: str = Field(max_length=250)
    visible_defects: list[str] = Field(max_length=5)
    cosmetic_quality_score: int | None = Field(ge=0, le=100)
    confidence: Literal['low', 'medium', 'high']
    limitations: str = Field(max_length=400)


class PlanExplanation(Output):
    summary: str = Field(max_length=600)
    next_steps: list[str] = Field(max_length=6)
    uncertainties: list[str] = Field(max_length=5)


def config():
    project = os.environ.get('GOOGLE_CLOUD_PROJECT')
    return {'provider': 'Vertex AI', 'configured': bool(project),
            'model': os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash-lite'),
            'location': os.environ.get('GOOGLE_CLOUD_LOCATION', 'global')}


def generate(instruction, content, schema, image=None):
    from google import genai
    from google.genai import types
    settings = config()
    if not settings['configured']:
        raise RuntimeError('Vertex AI is not configured. Set GOOGLE_CLOUD_PROJECT and use Application Default Credentials; see GOOGLE_CLOUD_SETUP.md.')
    parts = [types.Part.from_text(text=content)]
    if image:
        parts.append(types.Part.from_bytes(data=image[1], mime_type=image[0]))
    start = time.monotonic()
    # Cloud Run obtains ADC from its service account; no API keys in the browser.
    with genai.Client(vertexai=True, project=os.environ['GOOGLE_CLOUD_PROJECT'],
                      location=settings['location'],
                      http_options=types.HttpOptions(api_version='v1', timeout=30000)) as client:
        response = client.models.generate_content(
            model=settings['model'], contents=parts,
            config=types.GenerateContentConfig(
                system_instruction=instruction,
                response_mime_type='application/json', response_schema=schema,
                max_output_tokens=1800))
    if not response.text:
        raise ValueError('The model did not return a usable response')
    validated = schema.model_validate_json(response.text)
    return validated.model_dump(), {**settings, 'latency_ms': round((time.monotonic()-start)*1000)}
