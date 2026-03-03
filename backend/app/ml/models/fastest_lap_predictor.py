from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from xgboost import XGBClassifier

MODEL_DIR = Path(__file__).parent.parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)


class FastestLapPredictor:
    """Predicts probability of setting the fastest lap (binary classifier).

    At inference, probabilities should be normalized across the field so they
    sum to 1 (only one driver gets FL per race).
    """

    def __init__(self):
        self.model = XGBClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            scale_pos_weight=19,
            eval_metric="logloss",
            random_state=42,
        )
        self.feature_names: list[str] = []

    def train(self, X: np.ndarray, y: np.ndarray, feature_names: list[str]):
        self.feature_names = feature_names
        self.model.fit(X, y)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Return probability of fastest lap (class 1)."""
        return self.model.predict_proba(X)[:, 1]

    def save(self, path: Path | None = None):
        if path is None:
            path = MODEL_DIR / "fastest_lap_model.joblib"
        joblib.dump({"model": self.model, "feature_names": self.feature_names}, path)

    @classmethod
    def load(cls, path: Path | None = None) -> FastestLapPredictor:
        if path is None:
            path = MODEL_DIR / "fastest_lap_model.joblib"
        data = joblib.load(path)
        instance = cls()
        instance.model = data["model"]
        instance.feature_names = data["feature_names"]
        return instance
