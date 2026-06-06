"""Cron jobs module — wraps Hermes cron CLI via subprocess."""
import subprocess
import json
import re
from typing import Optional


HERMES = "/Users/santiagoveloso/.hermes/hermes-agent/venv/bin/hermes"


def _run(args: list[str]) -> str:
    result = subprocess.run([HERMES] + args, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return result.stdout


def list_jobs(include_disabled: bool = False) -> list[dict]:
    """Parse hermes cron list output into structured data."""
    args = ["cron", "list"]
    if include_disabled:
        args.append("--all")
    raw = _run(args)

    jobs = []
    current = {}
    for line in raw.split("\n"):
        # Job header: "  abc123 [active]"
        m = re.match(r"^\s+([a-f0-9]+)\s+\[(\w+)\]", line)
        if m:
            if current and "id" in current:
                jobs.append(current)
            current = {"id": m.group(1), "status": m.group(2)}
            continue
        # Field lines: "    Name:      foo"  
        m = re.match(r"^\s+(\w[\w\s/()]+?):\s+(.+)", line)
        if m and current:
            key = m.group(1).strip().lower().replace(" ", "_")
            val = m.group(2).strip()
            current[key] = val
        # Last run line with status
        m = re.match(r"^\s+Last run:\s+(.+?)\s+(ok|error:)", line)
        if m and current:
            current["last_run"] = m.group(1).strip()
            current["last_status"] = m.group(2).replace("error:", "error")
        # Next run
        m = re.match(r"^\s+Next run:\s+(.+)", line)
        if m and current:
            current["next_run"] = m.group(1).strip()
        # Skills
        m = re.match(r"^\s+Skills:\s+(.+)", line)
        if m and current:
            current["skills"] = m.group(1).strip()
        # Prompt
        m = re.match(r"^\s+Prompt:\s+(.+)", line)
        if m and current:
            current["prompt"] = m.group(1).strip()
        # Deliver
        m = re.match(r"^\s+Deliver:\s+(.+)", line)
        if m and current:
            current["deliver"] = m.group(1).strip()

    if current and "id" in current:
        jobs.append(current)
    return jobs


def create_job(name: str, schedule: str, prompt: str, skills: str = "", deliver: str = "local") -> dict:
    """Create a new cron job."""
    args = ["cron", "create", "--schedule", schedule, "--prompt", prompt, "--name", name, "--deliver", deliver]
    if skills:
        args.extend(["--skills", skills])
    out = _run(args)
    # Extract job ID from output like "Created job abc123"
    m = re.search(r"([a-f0-9]{6,})", out)
    return {"id": m.group(1) if m else "unknown", "message": out.strip()}


def delete_job(job_id: str) -> dict:
    """Delete a cron job."""
    out = _run(["cron", "remove", job_id])
    return {"status": "deleted", "message": out.strip()}


def run_job_now(job_id: str) -> dict:
    """Trigger a cron job to run immediately."""
    out = _run(["cron", "run", job_id])
    return {"status": "triggered", "message": out.strip()}


def pause_job(job_id: str) -> dict:
    out = _run(["cron", "pause", job_id])
    return {"status": "paused", "message": out.strip()}


def resume_job(job_id: str) -> dict:
    out = _run(["cron", "resume", job_id])
    return {"status": "resumed", "message": out.strip()}


def get_job(job_id: str) -> Optional[dict]:
    jobs = list_jobs(include_disabled=True)
    for j in jobs:
        if j["id"] == job_id:
            return j
    return None
