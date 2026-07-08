"""Contract test: the publish-side registry in app.core.pubsub must exactly mirror
architecture/pubsub_topics.yaml (the authoritative registry provisioned by Terraform).
Referenced from app/core/pubsub.py — a topic added in one place but not the other is a
deploy-time failure this test converts into a PR-time failure.
"""

import re
from pathlib import Path

from app.core.pubsub import TOPICS

REGISTRY = Path(__file__).resolve().parents[3] / "architecture" / "pubsub_topics.yaml"
# Topic entries are `- name: <topic>` lines; parsed textually so we don't add a YAML
# dependency for one file.
_TOPIC_LINE = re.compile(r"^\s*-\s*name:\s*([a-z_.]+)\s*$", re.MULTILINE)


def test_registry_file_exists():
    assert REGISTRY.is_file(), f"authoritative registry missing: {REGISTRY}"


def test_publish_side_topics_match_the_authoritative_registry():
    declared = set(_TOPIC_LINE.findall(REGISTRY.read_text(encoding="utf-8")))
    assert declared, "no topics parsed from pubsub_topics.yaml — parser or file broken"
    missing_in_code = declared - TOPICS
    missing_in_yaml = TOPICS - declared
    assert not missing_in_code, f"topics in yaml but not app.core.pubsub.TOPICS: {missing_in_code}"
    assert not missing_in_yaml, f"topics in app.core.pubsub.TOPICS but not yaml: {missing_in_yaml}"
