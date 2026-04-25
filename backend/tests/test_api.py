import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend import ai_features
from backend.database import get_db
from backend.main import app
from backend.models import Base


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    def _noop_enrich_word_async(word_id: int):
        return None

    app.dependency_overrides[get_db] = override_get_db
    ai_features.enrich_word_async = _noop_enrich_word_async

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def _create_word_payload():
    return {
        "word": "serendipity",
        "definition": "finding something good by chance",
        "language": "English",
    }


def _create_word(client: TestClient) -> dict:
    response = client.post("/words/", json=_create_word_payload())
    assert response.status_code == httpx.codes.OK
    return response.json()


def test_create_word_valid_returns_word_object(client: TestClient):
    response = client.post("/words/", json=_create_word_payload())

    assert response.status_code == httpx.codes.OK
    body = response.json()
    assert isinstance(body["id"], int)
    assert body["word"] == "serendipity"
    assert body["definition"] == "finding something good by chance"
    assert body["language"] == "English"
    assert body["streak"] == 0
    assert body["xp"] == 0


def test_create_word_missing_fields_returns_422(client: TestClient):
    response = client.post("/words/", json={"word": "hola"})

    assert response.status_code == httpx.codes.UNPROCESSABLE_ENTITY


def test_get_due_words_returns_list(client: TestClient):
    _create_word(client)

    response = client.get("/words/due/")

    assert response.status_code == httpx.codes.OK
    body = response.json()
    assert isinstance(body, list)
    assert len(body) >= 1


def test_submit_review_score_5_returns_interval_gt_zero(client: TestClient):
    word = _create_word(client)

    response = client.post(f"/words/{word['id']}/review/", json={"score": 5})

    assert response.status_code == httpx.codes.OK
    body = response.json()
    assert body["word_id"] == word["id"]
    assert body["score"] == 5
    assert body["interval"] > 0


def test_submit_review_score_0_returns_interval_1(client: TestClient):
    word = _create_word(client)

    response = client.post(f"/words/{word['id']}/review/", json={"score": 0})

    assert response.status_code == httpx.codes.OK
    body = response.json()
    assert body["word_id"] == word["id"]
    assert body["score"] == 0
    assert body["interval"] == 1


def test_delete_word_returns_200(client: TestClient):
    word = _create_word(client)

    response = client.delete(f"/words/{word['id']}")

    assert response.status_code == httpx.codes.OK


def test_delete_missing_word_returns_404(client: TestClient):
    response = client.delete("/words/9999")

    assert response.status_code == httpx.codes.NOT_FOUND
