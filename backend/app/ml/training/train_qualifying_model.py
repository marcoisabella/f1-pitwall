"""
Train the qualifying position prediction model.

Usage: cd backend && python -m app.ml.training.train_qualifying_model
"""
from __future__ import annotations

import logging

import numpy as np
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

from app.ml.features.race_features import build_qualifying_dataset
from app.ml.models.qualifying_predictor import QualifyingPredictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main():
    logger.info("Building qualifying dataset...")
    df = build_qualifying_dataset()

    if df.empty:
        logger.error("No data collected.")
        return

    logger.info(f"Dataset shape: {df.shape}")

    feature_cols = [c for c in df.columns if c != "target_quali_position"]
    X = df[feature_cols].values.astype(np.float32)
    y = df["target_quali_position"].values.astype(np.float32)

    # Replace NaN with column means
    col_means = np.nanmean(X, axis=0)
    for i in range(X.shape[1]):
        mask = np.isnan(X[:, i])
        X[mask, i] = col_means[i]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    logger.info(f"Training on {len(X_train)} samples, testing on {len(X_test)}")

    model = QualifyingPredictor()
    model.train(X_train, y_train, feature_cols)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    logger.info(f"Test MAE: {mae:.2f} positions")

    importances = model.model.feature_importances_
    for name, imp in sorted(zip(feature_cols, importances), key=lambda x: -x[1]):
        logger.info(f"  {name}: {imp:.3f}")

    model.save()
    logger.info("Qualifying model saved")


if __name__ == "__main__":
    main()
