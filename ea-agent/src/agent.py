"""
EA Scaffolding Agent - Orchestrates AI agents to build External Adapters.

Environment Variables:
    WORKFLOW_MODEL: Model to use (default: claude-opus-4-5@20251101)
    ENVIRONMENT: Environment name (default: development)
    VERBOSE_LOGGING: Log all messages (default: true)
    JSON_LOG_PATH: Path for streaming JSON logs
    SUMMARY_LOG_PATH: Path for final summary JSON
"""

import asyncio
import json
import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field
from claude_agent_sdk import ClaudeAgentOptions, AssistantMessage, TextBlock, query

# Optional SDK imports
try:
    from claude_agent_sdk import ToolUseBlock, ToolResultBlock
    HAS_TOOL_BLOCKS = True
except ImportError:
    HAS_TOOL_BLOCKS = False


# =============================================================================
# Logging
# =============================================================================

class Logger:
    """Structured logger with console and optional JSON file output."""
    
    def __init__(self, name: str = "workflow"):
        self._logger = logging.getLogger(name)
        self._logger.setLevel(logging.INFO)
        self._logger.handlers.clear()
        self._logger.addHandler(self._console_handler())
    
    def _console_handler(self) -> logging.Handler:
        handler = logging.StreamHandler()
        handler.setFormatter(self._ConsoleFormatter())
        return handler
    
    def _json_handler(self, filepath: str) -> logging.Handler:
        handler = logging.FileHandler(filepath)
        handler.setFormatter(self._JsonFormatter())
        return handler
    
    def add_json_file(self, filepath: str):
        self._logger.addHandler(self._json_handler(filepath))
    
    def info(self, event: str, **data):
        self._log(logging.INFO, event, data)
    
    def error(self, event: str, **data):
        self._log(logging.ERROR, event, data)
    
    def _log(self, level: int, event: str, data: dict):
        self._logger.log(level, event, extra={"data": {"event": event, **data}})
    
    class _ConsoleFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            event = record.getMessage()
            data = getattr(record, "data", {})
            parts = [f"{k}={json.dumps(v) if isinstance(v, dict) else v}" 
                     for k, v in data.items() if k != "event"]
            suffix = f" | {' '.join(parts)}" if parts else ""
            return f"{ts} | {record.levelname} | {event}{suffix}"
    
    class _JsonFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            data = {"timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": record.levelname,
                    "message": record.getMessage()}
            data.update(getattr(record, "data", {}))
            return json.dumps(data)


log = Logger("workflow")


# =============================================================================
# Pydantic Models
# =============================================================================

class InitializationResult(BaseModel):
    ea_package_path: str = Field(description="The path to the EA package.")


class ValidationResult(BaseModel):
    approved: bool = Field(description="Whether the tests are approved.")
    rationale: str = Field(default="", description="Rationale if rejected.")


# =============================================================================
# Utilities
# =============================================================================

def read_file(path: str) -> str:
    """Read file contents or exit on error."""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        log.error("file_not_found", path=path)
        sys.exit(1)


def serialize_message(message: Any) -> dict:
    """Convert SDK message to JSON-serializable dict."""
    result = {"type": type(message).__name__, 
              "timestamp": datetime.now(timezone.utc).isoformat()}
    
    if isinstance(message, AssistantMessage):
        result["content"] = [serialize_block(b) for b in message.content]
    elif hasattr(message, "subtype"):
        result["subtype"] = message.subtype
    elif hasattr(message, "__dict__"):
        for k, v in message.__dict__.items():
            if not k.startswith("_"):
                try:
                    json.dumps(v)
                    result[k] = v
                except (TypeError, ValueError):
                    result[k] = str(v)
    return result


def serialize_block(block: Any) -> dict:
    """Convert SDK content block to JSON-serializable dict."""
    result = {"type": type(block).__name__}
    
    if isinstance(block, TextBlock):
        result["text"] = block.text
    elif HAS_TOOL_BLOCKS and isinstance(block, ToolUseBlock):
        result.update(name=block.name, id=block.id, input=getattr(block, "input", {}))
    elif HAS_TOOL_BLOCKS and isinstance(block, ToolResultBlock):
        result.update(tool_use_id=block.tool_use_id, 
                      content=str(getattr(block, "content", ""))[:1000])
    elif hasattr(block, "__dict__"):
        for k, v in block.__dict__.items():
            if not k.startswith("_"):
                try:
                    json.dumps(v)
                    result[k] = v
                except (TypeError, ValueError):
                    result[k] = str(v)[:1000]
    return result


# =============================================================================
# Agent Runner
# =============================================================================

async def run_agent(
    name: str,
    system_prompt_path: str,
    prompt: str,
    trace_id: str,
    phase: str,
    iteration: int = 1,
    model: str = "claude-opus-4-5@20251101",
    options: dict = None,
    output_schema: dict = None,
) -> tuple[Any, dict]:
    """Run an agent and return (result, run_log)."""
    
    started_at = datetime.now(timezone.utc).isoformat()
    log.info("agent_start", trace_id=trace_id, agent=name, phase=phase, iteration=iteration)
    
    # Build agent options
    system_prompt = read_file(system_prompt_path)
    system_prompt += "\n\nCRITICAL: DO NOT create markdown docs. Only modify code/config files within the package directory. KISS principle."
    
    output_format = {"type": "json_schema", "schema": output_schema} if output_schema else None
    if output_format:
        log.info("output_format_configured", trace_id=trace_id, agent=name)
    
    agent_opts = ClaudeAgentOptions(
        model=model,
        system_prompt=system_prompt,
        cwd=os.getcwd(),
        output_format=output_format,
        **(options or {})
    )
    
    # Run agent
    text = ""
    structured = None
    messages = []
    tokens_in = tokens_out = 0
    success = True
    error = None
    verbose = os.environ.get("VERBOSE_LOGGING", "true").lower() == "true"
    
    try:
        async for msg in query(prompt=prompt, options=agent_opts):
            # Log messages
            if verbose:
                serialized = serialize_message(msg)
                messages.append(serialized)
                log.info("message", trace_id=trace_id, agent=name, phase=phase, 
                         iteration=iteration, message=serialized)
            
            # Accumulate text
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        text += block.text
            
            # Capture structured output
            if hasattr(msg, "structured_output") and msg.structured_output:
                structured = msg.structured_output
                log.info("structured_output", trace_id=trace_id, agent=name, data=structured)
            
            # Handle result message
            if getattr(msg, "type", None) == "result":
                subtype = getattr(msg, "subtype", None)
                log.info("result", trace_id=trace_id, agent=name, subtype=subtype)
                if subtype == "error_max_structured_output_retries":
                    log.error("structured_output_failed", trace_id=trace_id, agent=name)
            
            # Capture usage
            if hasattr(msg, "usage"):
                tokens_in = getattr(msg.usage, "input_tokens", 0)
                tokens_out = getattr(msg.usage, "output_tokens", 0)
    
    except Exception as e:
        success = False
        error = str(e)
        log.error("agent_error", trace_id=trace_id, agent=name, phase=phase,
                  iteration=iteration, error=error, error_type=type(e).__name__)
    
    log.info("agent_complete", trace_id=trace_id, agent=name, phase=phase,
             iteration=iteration, success=success, tokens_in=tokens_in, tokens_out=tokens_out)
    
    return (structured or text, {
        "agent": name, "phase": phase, "iteration": iteration,
        "started_at": started_at, "ended_at": datetime.now(timezone.utc).isoformat(),
        "success": success, "error": error,
        "input_tokens": tokens_in, "output_tokens": tokens_out, "messages": messages
    })


# =============================================================================
# Validation Loop
# =============================================================================

async def run_validation_loop(
    writer_name: str,
    writer_prompt_path: str,
    validator_name: str,
    validator_prompt_path: str,
    ea_path: str,
    phase: str,
    trace_id: str,
    model: str,
    edit_opts: dict,
    validator_opts: dict,
    agent_runs: list,
    required_approvals: int = 3,
    max_iterations: int = 3,
) -> tuple[int, int]:
    """Run write-validate loop. Returns (iterations, approvals)."""
    
    approvals = 0
    feedback = ""
    iteration = 1
    
    while approvals < required_approvals and iteration <= max_iterations:
        # Write tests
        instruction = f"Generate tests for: {ea_path}."
        if feedback:
            instruction += f"\n\nPrevious validation failed:\n{feedback}"
        
        _, run_log = await run_agent(
            name=writer_name,
            system_prompt_path=writer_prompt_path,
            prompt=instruction,
            trace_id=trace_id,
            phase=phase,
            iteration=iteration,
            model=model,
            options=edit_opts,
        )
        agent_runs.append(run_log)
        
        # Validate (need all rounds to pass)
        for round_num in range(1, required_approvals + 1):
            result, run_log = await run_agent(
                name=validator_name,
                system_prompt_path=validator_prompt_path,
                prompt=f"Validate tests for: {ea_path}. Run if possible. (Round {round_num}/{required_approvals})",
                trace_id=trace_id,
                phase=phase,
                iteration=iteration,
                model=model,
                options=validator_opts,
                output_schema=ValidationResult.model_json_schema(),
            )
            agent_runs.append(run_log)
            
            # Process validation result
            if isinstance(result, dict):
                validation = ValidationResult.model_validate(result)
                log.info("validation", trace_id=trace_id, phase=phase, iteration=iteration,
                         round=round_num, approved=validation.approved,
                         rationale=validation.rationale[:500] if validation.rationale else None)
                
                if validation.approved:
                    approvals += 1
                    if approvals >= required_approvals:
                        break
                else:
                    approvals = 0
                    feedback = validation.rationale
                    iteration += 1
                    break
            else:
                log.info("validation", trace_id=trace_id, phase=phase, iteration=iteration,
                         round=round_num, approved=False, rationale="No structured output")
                approvals = 0
                feedback = str(result)
                iteration += 1
                break
    
    return iteration, approvals


# =============================================================================
# Main Workflow
# =============================================================================

async def main():
    # Setup
    json_log = os.environ.get("JSON_LOG_PATH")
    if json_log:
        log.add_json_file(json_log)
    
    if len(sys.argv) < 2:
        log.error("startup_error", error="Missing requirements file", 
                  usage="python ea_agent.py <requirements.yaml>")
        sys.exit(1)
    
    req_file = sys.argv[1]
    requirements = read_file(req_file)
    
    # Workflow state
    trace_id = str(uuid.uuid4())[:8]
    started_at = datetime.now(timezone.utc).isoformat()
    model = os.environ.get("WORKFLOW_MODEL", "claude-opus-4-5@20251101")
    environment = os.environ.get("ENVIRONMENT", "development")
    agent_runs = []
    ea_path = None
    success = False
    error_msg = None
    
    log.info("workflow_start", trace_id=trace_id, requirements_file=req_file,
             model=model, environment=environment)
    
    edit_opts = {"permission_mode": "acceptEdits", 
                 "allowed_tools": ["Read", "Write", "Bash", "List", "GlobFileSearch"]}
    validator_opts = {"permission_mode": "acceptEdits",
                      "allowed_tools": ["Read", "Bash", "List", "GlobFileSearch"]}
    
    try:
        # Phase 1: Initialize EA
        log.info("phase_start", trace_id=trace_id, phase="initialization")
        
        result, run_log = await run_agent(
            name="EA Developer",
            system_prompt_path=".claude/agents/ea_developer.md",
            prompt=f"Initialize the EA project.\n\nRequirements:\n{requirements}",
            trace_id=trace_id,
            phase="initialization",
            model=model,
            options=edit_opts,
            output_schema=InitializationResult.model_json_schema(),
        )
        agent_runs.append(run_log)
        
        if not isinstance(result, dict):
            raise ValueError(f"EA Developer did not return structured output: {str(result)[-500:]}")
        
        ea_path = InitializationResult.model_validate(result).ea_package_path
        log.info("phase_complete", trace_id=trace_id, phase="initialization", ea_path=ea_path)
        
        # Phase 2: Integration Tests
        log.info("phase_start", trace_id=trace_id, phase="integration_testing")
        iters, approvals = await run_validation_loop(
            writer_name="Integration Test Writer",
            writer_prompt_path=".claude/agents/ea_integration_test_writer.md",
            validator_name="Integration Test Validator",
            validator_prompt_path=".claude/agents/ea_integration_test_validator.md",
            ea_path=ea_path, phase="integration_testing", trace_id=trace_id,
            model=model, edit_opts=edit_opts, validator_opts=validator_opts,
            agent_runs=agent_runs,
        )
        log.info("phase_complete", trace_id=trace_id, phase="integration_testing",
                 iterations=iters, approvals=approvals)
        
        # Phase 3: Unit Tests
        log.info("phase_start", trace_id=trace_id, phase="unit_testing")
        iters, approvals = await run_validation_loop(
            writer_name="Unit Test Writer",
            writer_prompt_path=".claude/agents/ea_unit_test_writer.md",
            validator_name="Unit Test Validator",
            validator_prompt_path=".claude/agents/ea_unit_test_validator.md",
            ea_path=ea_path, phase="unit_testing", trace_id=trace_id,
            model=model, edit_opts=edit_opts, validator_opts=validator_opts,
            agent_runs=agent_runs,
        )
        log.info("phase_complete", trace_id=trace_id, phase="unit_testing",
                 iterations=iters, approvals=approvals)
        
        success = True
        
    except Exception as e:
        error_msg = str(e)
        log.error("workflow_error", trace_id=trace_id, error=error_msg, 
                  error_type=type(e).__name__)
        raise
    
    finally:
        # Summary
        ended_at = datetime.now(timezone.utc).isoformat()
        tokens_in = sum(r.get("input_tokens", 0) for r in agent_runs)
        tokens_out = sum(r.get("output_tokens", 0) for r in agent_runs)
        
        summary = {
            "trace_id": trace_id,
            "started_at": started_at,
            "ended_at": ended_at,
            "success": success,
            "error": error_msg,
            "requirements_file": req_file,
            "ea_package_path": ea_path,
            "model": model,
            "environment": environment,
            "total_input_tokens": tokens_in,
            "total_output_tokens": tokens_out,
            "agent_runs": agent_runs,
        }
        
        log.info("workflow_complete", trace_id=trace_id, success=success, 
                 ea_path=ea_path, tokens_in=tokens_in, tokens_out=tokens_out,
                 agents=len(agent_runs))
        
        # Write summary if requested
        summary_path = os.environ.get("SUMMARY_LOG_PATH")
        if summary_path:
            with open(summary_path, "w") as f:
                json.dump(summary, f, indent=2)
            log.info("summary_written", trace_id=trace_id, path=summary_path)


if __name__ == "__main__":
    asyncio.run(main())
