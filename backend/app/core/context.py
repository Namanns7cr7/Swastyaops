"""Context variables for request tracing, tenancy assertion, and operational scoping.

Enforces security invariants down to deep function stacks without signature pollution.
"""

from contextvars import ContextVar

# Verified district_id for the current execution thread (agent runs, API contexts)
active_district_id: ContextVar[str] = ContextVar("active_district_id")

# Optional active trace_id for GCP logging correlation
active_trace_id: ContextVar[str] = ContextVar("active_trace_id")
