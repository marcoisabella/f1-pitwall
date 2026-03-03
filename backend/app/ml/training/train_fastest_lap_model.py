"""
Train the fastest lap prediction model.

Usage: cd backend && python -m app.ml.training.train_fastest_lap_model
"""
from __future__ import annotations

import logging

import numpy as np
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from app.ml.features.race_features import build_fastest_lap_dataset
from app.ml.models.fastest_lap_predictor import FastestLapPredictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main():
    logger.info("Building fastest lap dataset...")
    df = build_fastest_lap_dataset()

    if df.empty:
        logger.error("No data collected.")
        return

    logger.info(f"Dataset shape: {df.shape}")
    logger.info(f"Positive rate: {df['target_fastest_lap'].mean():.3f}")

    feature_cols = [c for c in df.columns if c != "target_fastest_lap"]
    X = df[feature_cols].values.astype(np.float32)
    y = df["target_fastest_lap"].values.astype(np.int32)

    col_means = np.nanmean(X, axis=0)
    for i in range(X.shape[1]):
        mask = np.isnan(X[:, i])
        X[mask, i] = col_means[i]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    logger.info(f"Training on {len(X_train)} samples, testing on {len(X_test)}")

    model = FastestLapPredictor()
    model.train(X_train, y_train, feature_cols)

    probs = model.predict_proba(X_test)
    auc = roc_auc_score(y_test, probs)
    logger.info(f"Test ROC-AUC: {auc:.3f}")

    importances = model.model.feature_importances_
    for name, imp in sorted(zip(feature_cols, importances), key=lambda x: -x[1]):
        logger.info(f"  {name}: {imp:.3f}")

    model.save()
    logger.info("Fastest lap model saved")


if __name__ == "__main__":
    main()
