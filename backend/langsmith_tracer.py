"""
LangSmith Observability Tracer for Python Backend
File: backend/langsmith_tracer.py
"""

import os
import time
import uuid
import threading
from typing import Dict, Any, Optional

# LangSmith SDK imports
try:
    from langsmith import Client
    LANGSMITH_AVAILABLE = True
except ImportError:
    LANGSMITH_AVAILABLE = False
    print("[LangSmith] SDK not available. Run: pip install langsmith")

# Configuration
LANGSMITH_API_KEY = os.environ.get("LANGSMITH_API_KEY")
LANGSMITH_TRACING = os.environ.get("LANGSMITH_TRACING", "false").lower() == "true"
LANGSMITH_PROJECT = os.environ.get("LANGSMITH_PROJECT", "Fluenzy AI")
LANGSMITH_ENDPOINT = os.environ.get("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
APP_ENV = os.environ.get("APP_ENV", "development")

# Initialize client
client: Optional[Client] = None
if LANGSMITH_AVAILABLE and LANGSMITH_API_KEY and LANGSMITH_TRACING:
    try:
        client = Client(api_url=LANGSMITH_ENDPOINT, api_key=LANGSMITH_API_KEY)
        print(f"[LangSmith] Initialized client for project: {LANGSMITH_PROJECT}")
    except Exception as e:
        print(f"[LangSmith] Initialization failed: {e}")


def _post_run_async(
    run_id: str,
    name: str,
    run_type: str,
    inputs: Dict[str, Any],
    outputs: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
    start_time: float = 0.0,
    end_time: float = 0.0,
    extra: Optional[Dict[str, Any]] = None,
    tags: Optional[list] = None
):
    """Internal helper to post run to LangSmith using a background thread (non-blocking)"""
    if not client:
        return

    def run_post():
        try:
            # Create a run in LangSmith
            client.create_run(
                id=run_id,
                name=name,
                run_type=run_type,
                inputs=inputs,
                outputs=outputs,
                error=error,
                start_time=start_time,
                end_time=end_time,
                extra=extra or {},
                tags=tags or [],
                project_name=LANGSMITH_PROJECT
            )
        except Exception as e:
            # Silently catch network or API errors to avoid breaking the core application
            pass

    thread = threading.Thread(target=run_post, daemon=True)
    thread.start()


def trace_session_start(session_id: str, features: list, user_id: str = "unknown", email: str = "unknown", plan: str = "Free"):
    """Traces the start of a behavioral analysis WebSocket connection"""
    if not client:
        return

    now = time.time()
    # Generate unique UUID for the run
    run_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"start-{session_id}"))

    extra = {
        "metadata": {
            "session_id": session_id,
            "user_id": user_id,
            "email": email,
            "plan": plan,
            "environment": APP_ENV,
            "feature": "Behavioral Analysis",
            "event": "session_start"
        }
    }

    _post_run_async(
        run_id=run_id,
        name=f"Behavioral Analysis / start-session-{session_id}",
        run_type="chain",
        inputs={"session_id": session_id, "features": features},
        outputs={"status": "connected"},
        start_time=now,
        end_time=now,
        extra=extra,
        tags=["Behavioral Analysis", "WebSocket", "session_start", APP_ENV]
    )


def trace_session_end(session_id: str, summary: Dict[str, Any], user_id: str = "unknown", email: str = "unknown", plan: str = "Free", error: Optional[str] = None):
    """Traces the completion of a behavioral analysis session along with final stats"""
    if not client:
        return

    now = time.time()
    run_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"end-{session_id}"))

    extra = {
        "metadata": {
            "session_id": session_id,
            "user_id": user_id,
            "email": email,
            "plan": plan,
            "environment": APP_ENV,
            "feature": "Behavioral Analysis",
            "event": "session_end",
            # Inject aggregate scores into metadata for easy filtering/aggregations in dashboard
            "confidence_avg": summary.get("confidence", {}).get("average", 0.0),
            "eye_contact_avg": summary.get("eyeContact", {}).get("average", 0.0),
            "posture_avg": summary.get("posture", {}).get("average", 0.0),
            "smile_avg": summary.get("smile", {}).get("average", 0.0),
            "engagement_avg": summary.get("engagement", {}).get("average", 0.0),
        }
    }

    _post_run_async(
        run_id=run_id,
        name=f"Behavioral Analysis / end-session-{session_id}",
        run_type="chain",
        inputs={"session_id": session_id},
        outputs=summary,
        error=error,
        start_time=now,
        end_time=now,
        extra=extra,
        tags=["Behavioral Analysis", "WebSocket", "session_end", APP_ENV]
    )
