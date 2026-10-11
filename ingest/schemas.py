"""Pydantic models: every event shape the API accepts is validated here."""
from typing import Literal
from pydantic import BaseModel, Field, model_validator


class GithubPayload(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    author: str = Field(min_length=1, max_length=200)
    hours: float = Field(ge=0, le=100, description="assumed dev hours for this commit")
    repo: str | None = None
    commit_sha: str | None = None
    url: str | None = None


class AwsPayload(BaseModel):
    service: str = Field(min_length=1, max_length=200)
    cost_usd: float = Field(ge=0, le=1_000_000)
    usage_type: str | None = None
    date: str | None = None


class StripePayload(BaseModel):
    state: str = Field(min_length=2, max_length=2, pattern=r"^[A-Za-z]{2}$")
    amount_usd: float = Field(gt=0, le=1_000_000)
    payment_id: str | None = None
    status: str | None = None


class EventIn(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    source: Literal["github", "aws", "stripe"]
    timestamp: str = Field(min_length=1, max_length=40)
    payload: dict

    @model_validator(mode="after")
    def validate_payload_by_source(self):
        try:
            if self.source == "github":
                GithubPayload.model_validate(self.payload)
            elif self.source == "aws":
                AwsPayload.model_validate(self.payload)
            else:
                StripePayload.model_validate(self.payload)
        except Exception as exc:
            raise ValueError(f"payload does not match {self.source} schema: {exc}")
        return self

    def typed_payload(self) -> dict:
        if self.source == "github":
            return GithubPayload.model_validate(self.payload).model_dump()
        if self.source == "aws":
            return AwsPayload.model_validate(self.payload).model_dump()
        return StripePayload.model_validate(self.payload).model_dump()


class TokenRequest(BaseModel):
    username: str
    password: str
