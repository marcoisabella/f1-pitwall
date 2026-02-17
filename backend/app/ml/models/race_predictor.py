from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from xgboost import XGBRegressor

MODEL_DIR = Path(__file__).parent.parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)


class RacePositionPredictor:
    """Predicts finishing position given pre-race features."""

    def __init__(self):
        self.model = XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            objective="reg:squarederror",
            random_state=42,
        )
        self.feature_names: list[str] = []

    def train(self, X: np.ndarray, y: np.ndarray, feature_names: list[str]):
        self.feature_names = feature_names
        self.model.fit(X, y)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def save(self, path: Path | None = None):
        if path is None:
            path = MODEL_DIR / "race_position_model.joblib"
        joblib.dump({"model": self.model, "feature_names": self.feature_names}, path)

    @classmethod
    def load(cls, path: Path | None = None) -> RacePositionPredictor:
        if path is None:
            path = MODEL_DIR / "race_position_model.joblib"
        data = joblib.load(path)
        instance = cls()
        instance.model = data["model"]
        instance.feature_names = data["feature_names"]
        return instance
