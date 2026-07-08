"""Unit tests for environment configuration (docs/10 §6 — unit level)."""

from app.core.config import Settings


def test_bucket_falls_back_to_conventional_name_when_unset():
    settings = Settings(env="dev", bucket_reports="")
    assert settings.bucket("reports") == "swasthyaops-dev-reports"


def test_bucket_fallback_tracks_environment():
    assert Settings(env="prod").bucket("models") == "swasthyaops-prod-models"


def test_explicit_bucket_wins_over_convention():
    settings = Settings(bucket_ingest="my-custom-ingest")
    assert settings.bucket("ingest") == "my-custom-ingest"


def test_env_vars_use_swasthyaops_prefix(monkeypatch):
    monkeypatch.setenv("SWASTHYAOPS_PROJECT_ID", "swasthyaops-staging")
    monkeypatch.setenv("SWASTHYAOPS_BUDGET_FLASH_IN", "16000")
    settings = Settings()
    assert settings.project_id == "swasthyaops-staging"
    assert settings.budget_flash_in == 16_000
