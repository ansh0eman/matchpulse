"""No secret values are logged or exported."""
import os
from urllib.parse import urlparse
from pydantic import Field,model_validator
from ..schemas import StrictModel
class ProviderConfig(StrictModel):
    endpoint: str
    model: str=Field(min_length=1,max_length=128)
    timeout_seconds: float=Field(default=12.,gt=0,le=30)
    retries: int=Field(default=1,ge=0,le=1)
    @model_validator(mode='after')
    def validate_endpoint(self):
        u=urlparse(self.endpoint)
        if (u.scheme!='https' or not u.hostname or not u.hostname.endswith('.services.ai.azure.com') or
            u.username or u.password or u.query or u.fragment or not u.path.startswith('/api/projects/') or
            len(u.path.removeprefix('/api/projects/').strip('/').split('/'))!=1):
            raise ValueError('Expected an HTTPS Azure Foundry project endpoint without credentials or query')
        return self
    @classmethod
    def from_environment(cls):
        if not os.getenv('FOUNDRY_PROJECT_ENDPOINT') or not os.getenv('FOUNDRY_MODEL'):
            raise ValueError('Configure FOUNDRY_PROJECT_ENDPOINT and FOUNDRY_MODEL; authenticate with Azure CLI')
        return cls(endpoint=os.environ['FOUNDRY_PROJECT_ENDPOINT'],model=os.environ['FOUNDRY_MODEL'])
