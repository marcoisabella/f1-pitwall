from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier

MODEL_DIR = Path(__file__).parent.parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)


class PitStopWindowPredictor:
    """Predicts probability of pitting in the next 3 laps."""

    def __init__(self):
        self.model = GradientBoostingClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
        )
        self.feature_names: list[str] = []

    def train(self, X: np.ndarray, y: np.ndarray, feature_names: list[str]):
        self.feature_names = feature_names
        self.model.fit(X, y)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)[:, 1]

    def save(self, path: Path | None = None):
        if path is None:
            path = MODEL_DIR / "pit_stop_model.joblib"
        joblib.dump({"model": self.model, "feature_names": self.feature_names}, path)

    @classmethod
    def load(cls, path: Path | None = None) -> PitStopWindowPredictor:
        if path is None:
            path = MODEL_DIR / "pit_stop_model.joblib"
        data = joblib.load(path)
        instance = cls()
        instance.model = data["model"]
        instance.feature_names = data["feature_names"]
        return instance
