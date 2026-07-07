"""Environment configuration for all services.

Values are injected by Cloud Run (Terraform-managed env vars, infra/terraform/cloudrun.tf);
secrets arrive as Secret Manager mounts, never here. See docs/10_Deployment_Guide.md §6.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    project_id: str = "swasthyaops-dev"
    env: str = "dev"  # dev | staging | prod
    region: str = "asia-south1"

    # Model ids are config, never hard-coded (docs/06_AI_Architecture.md §1)
    model_flash: str = "gemini-2.5-flash"
    model_pro: str = "gemini-2.5-pro"

    # BigQuery datasets (docs/04_Database_Schema.md §3)
    bq_raw: str = "swasthyaops_raw"
    bq_curated: str = "swasthyaops_curated"
    bq_ml: str = "swasthyaops_ml"
    bq_analytics: str = "swasthyaops_analytics"

    # Buckets (docs/02_TRD.md §6)
    bucket_ingest: str = ""
    bucket_reports: str = ""
    bucket_models: str = ""

    # Per-run token budgets (docs/06_AI_Architecture.md §6)
    budget_flash_in: int = 32_000
    budget_flash_out: int = 4_000
    budget_pro_in: int = 96_000
    budget_pro_out: int = 8_000

    idempotency_ttl_hours: int = 48
    stale_facility_hours: int = 48

    model_config = {"env_prefix": "SWASTHYAOPS_"}

    def bucket(self, kind: str) -> str:
        return getattr(self, f"bucket_{kind}") or f"swasthyaops-{self.env}-{kind}"


@lru_cache
def settings() -> Settings:
    return Settings()
