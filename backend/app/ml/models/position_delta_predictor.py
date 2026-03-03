from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from xgboost import XGBRegressor

MODEL_DIR = Path(__file__).parent.parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)


class PositionDeltaPredictor:
    """Predicts positions gained/lost (grid - finish) given race features.

    Also stores residual_std from training for Monte Carlo variance.
    """

    def __init__(self):
        self.model = XGBRegressor(
            n_estimators=250,
            max_depth=6,
            learning_rate=0.08,
            objective="reg:squarederror",
            random_state=42,
        )
        self.feature_names: list[str] = []
        self.residual_std: float = 3.0  # fallback

    def train(self, X: np.ndarray, y: np.ndarray, feature_names: list[str]):
        self.feature_names = feature_names
        self.model.fit(X, y)
        # Compute residual std for Monte Carlo
        preds = self.model.predict(X)
        residuals = y - preds
        self.residual_std = float(np.std(residuals))

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def save(self, path: Path | None = None):
        if path is None:
            path = MODEL_DIR / "position_delta_model.joblib"
        joblib.dump({
            "model": self.model,
            "feature_names": self.feature_names,
            "residual_std": self.residual_std,
        }, path)

    @classmethod
    def load(cls, path: Path | None = None) -> PositionDeltaPredictor:
        if path is None:
            path = MODEL_DIR / "position_delta_model.joblib"
        data = joblib.load(path)
        instance = cls()
        instance.model = data["model"]
        instance.feature_names = data["feature_names"]
        instance.residual_std = data.get("residual_std", 3.0)
        return instance
