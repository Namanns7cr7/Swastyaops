# Shared image for all six services; SERVICE selects the ASGI app at runtime.
# Build: docker build --build-arg SERVICE=app.main:app -t svc-api .
# Provisioned per-service in infra/terraform/cloudrun.tf; built by infra/cloudbuild.yaml.

FROM python:3.12-slim AS builder
WORKDIR /build
COPY pyproject.toml ./
RUN pip install --no-cache-dir uv && uv pip install --system --no-cache -r pyproject.toml
COPY app ./app
COPY prompts /build/prompts

FROM gcr.io/distroless/python3-debian12:nonroot
WORKDIR /srv
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /build/app ./app
COPY --from=builder /build/prompts ./prompts
ARG SERVICE=app.main:app
ENV SERVICE=${SERVICE} PORT=8080 PYTHONUNBUFFERED=1
ENTRYPOINT ["python", "-m", "uvicorn"]
CMD ["app.main:app", "--host", "0.0.0.0", "--port", "8080"]
