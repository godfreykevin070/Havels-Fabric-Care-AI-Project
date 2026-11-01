import os
import tempfile

os.environ.setdefault("DATABASE_URL", f"sqlite:///{tempfile.gettempdir()}/fabriccare_test.db")
os.environ.setdefault("MODEL_DIR", tempfile.mkdtemp(prefix="fabriccare_models_"))

import pytest
from fastapi.testclient import TestClient

from app.db.init_db import init_db
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def _prepare_db():
    init_db()
    yield


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c