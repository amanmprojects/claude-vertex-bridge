from litellm.integrations.custom_logger import CustomLogger
import json
from datetime import datetime
from pathlib import Path


class TokenCostLogger(CustomLogger):
    """
    Logs token usage and calculates costs for Vertex AI Model Garden models.
    """

    # Model pricing: cost per million tokens (USD)
    MODEL_PRICING = {
        "glm-4.7": {
            "input_cost_per_million": 0.60,
            "output_cost_per_million": 2.20
        },
        # Add other models as needed:
        # "minimax": {"input_cost_per_million": 0.10, "output_cost_per_million": 0.10},
    }

    def __init__(self, log_file_path: str = None):
        super().__init__()
        self.log_file_path = log_file_path or Path(__file__).parent.parent / ".token_usage.log"

    def log_post_api_call(self, kwargs, response_obj, start_time, end_time):
        """Log token usage and calculate cost after each API call."""
        try:
            # Get usage from response
            usage = getattr(response_obj, 'usage', None)
            if not usage or not hasattr(usage, 'prompt_tokens'):
                return

            # Get model name
            model = kwargs.get('model', 'unknown')

            # Extract token counts
            input_tokens = getattr(usage, 'prompt_tokens', 0)
            output_tokens = getattr(usage, 'completion_tokens', 0)

            if input_tokens == 0 and output_tokens == 0:
                return

            # Calculate cost
            pricing = self.MODEL_PRICING.get(model)
            if pricing:
                input_cost = (input_tokens / 1_000_000) * pricing['input_cost_per_million']
                output_cost = (output_tokens / 1_000_000) * pricing['output_cost_per_million']
                total_cost = input_cost + output_cost
            else:
                input_cost = None
                output_cost = None
                total_cost = None

            # Create log entry
            log_entry = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "model": model,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "input_cost_usd": round(input_cost, 6) if input_cost else None,
                "output_cost_usd": round(output_cost, 6) if output_cost else None,
                "total_cost_usd": round(total_cost, 6) if total_cost else None,
                "duration_ms": round((end_time - start_time) * 1000, 2) if end_time and start_time else None,
            }

            # Write to log file
            with open(self.log_file_path, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')

        except Exception as e:
            # Don't fail the request if logging fails
            print(f"TokenLogger error: {e}")

    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        """Async version of logging for streaming calls."""
        self.log_post_api_call(kwargs, response_obj, start_time, end_time)
