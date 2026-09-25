import json
import yaml
import re
from typing import Dict, Any, List, Union, Optional
try:
    from backend.models import Endpoint
except ImportError:
    from models import Endpoint

SUPPORTED_HTTP_METHODS = {"get", "post", "put", "delete", "patch", "options", "head"}

class OpenAPIParser:
    """
    OpenAPI Specification Parser for Sentinel X.
    Parses OpenAPI 2.0 / 3.0 / 3.1 JSON or YAML specs into normalized Endpoint objects.
    """

    def __init__(self, spec_data: Union[Dict[str, Any], str]):
        self.spec = self._normalize_spec(spec_data)

    def _normalize_spec(self, spec_input: Union[Dict[str, Any], str]) -> Dict[str, Any]:
        """Defensive parsing for dict, JSON string, or YAML string."""
        if isinstance(spec_input, dict):
            return spec_input
        
        if isinstance(spec_input, str):
            content = spec_input.strip()
            # Try JSON first
            try:
                return json.loads(content)
            except Exception:
                pass
            
            # Try YAML second
            try:
                data = yaml.safe_load(content)
                if isinstance(data, dict):
                    return data
            except Exception:
                pass

        raise ValueError("Invalid OpenAPI specification: Input must be a valid JSON or YAML object/string.")

    def get_base_url(self, default_target: str = "http://127.0.0.1:9000") -> str:
        """Extracts target base URL from spec servers or host."""
        if not isinstance(self.spec, dict):
            return default_target.rstrip("/")

        servers = self.spec.get("servers", [])
        if isinstance(servers, list) and len(servers) > 0:
            first_server = servers[0]
            if isinstance(first_server, dict):
                url = first_server.get("url", default_target)
                return url.rstrip("/")

        # Swagger 2.0 fallback
        host = self.spec.get("host")
        if host:
            schemes = self.spec.get("schemes", ["http"])
            base_path = self.spec.get("basePath", "")
            return f"{schemes[0]}://{host}{base_path}".rstrip("/")

        return default_target.rstrip("/")

    def extract_endpoints(self) -> List[Endpoint]:
        """
        Parses all API routes and returns a normalized list of Endpoint models.
        Includes defensive checks for missing paths and malformed definitions.
        """
        normalized_endpoints: List[Endpoint] = []

        if not isinstance(self.spec, dict):
            return normalized_endpoints

        paths = self.spec.get("paths")
        if not isinstance(paths, dict):
            return normalized_endpoints

        # Global security requirement
        global_security = self.spec.get("security", [])
        global_has_auth = isinstance(global_security, list) and len(global_security) > 0

        for path_key, path_item in paths.items():
            if not isinstance(path_key, str) or not isinstance(path_item, dict):
                continue

            # Extract path-level parameter definitions if present
            path_level_params = path_item.get("parameters", [])
            if not isinstance(path_level_params, list):
                path_level_params = []

            for method_key, op_item in path_item.items():
                method_lower = str(method_key).lower()
                if method_lower not in SUPPORTED_HTTP_METHODS:
                    continue

                if not isinstance(op_item, dict):
                    continue

                summary = str(op_item.get("summary", ""))
                description = str(op_item.get("description", ""))
                tags = op_item.get("tags", [])
                if not isinstance(tags, list):
                    tags = []

                # Parameters processing
                op_params = op_item.get("parameters", [])
                if not isinstance(op_params, list):
                    op_params = []
                
                all_params = path_level_params + op_params

                path_params: List[str] = []
                query_params: List[str] = []
                processed_params: List[Dict[str, Any]] = []

                for param in all_params:
                    if not isinstance(param, dict):
                        continue

                    p_name = param.get("name")
                    p_in = param.get("in")

                    if not p_name:
                        continue

                    processed_params.append({
                        "name": p_name,
                        "in": p_in,
                        "required": param.get("required", False),
                        "schema": param.get("schema", {})
                    })

                    if p_in == "path" and p_name not in path_params:
                        path_params.append(p_name)
                    elif p_in == "query" and p_name not in query_params:
                        query_params.append(p_name)

                # Fallback: Infer path params from regex inside path if omitted in OpenAPI spec
                regex_params = re.findall(r"\{([a-zA-Z0-9_]+)\}", path_key)
                for rp in regex_params:
                    if rp not in path_params:
                        path_params.append(rp)

                # Request Body extraction
                request_body = op_item.get("requestBody")
                req_body_dict = request_body if isinstance(request_body, dict) else None

                # Security / Authentication Requirement Check
                op_security = op_item.get("security")
                requires_auth = global_has_auth
                if isinstance(op_security, list):
                    requires_auth = len(op_security) > 0

                normalized_endpoints.append(
                    Endpoint(
                        path=path_key,
                        method=method_lower.upper(),
                        summary=summary,
                        description=description,
                        parameters=processed_params,
                        path_params=path_params,
                        query_params=query_params,
                        request_body=req_body_dict,
                        requires_auth=requires_auth,
                        tags=[str(t) for t in tags]
                    )
                )

        return normalized_endpoints

def parse_openapi(spec_input: Union[Dict[str, Any], str]) -> List[Endpoint]:
    """
    Utility function to parse OpenAPI specification into normalized Endpoint models.
    """
    parser = OpenAPIParser(spec_input)
    return parser.extract_endpoints()
