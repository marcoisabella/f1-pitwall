"""
Train the pit stop window prediction model.

Usage: cd backend && python -m app.ml.training.train_pit_model
"""
from __future__ import annotations

import logging

import numpy as np
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split

from app.ml.features.race_features import build_pit_stop_dataset
from app.ml.models.pit_stop_predictor import PitStopWindowPredictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main():
    logger.info("Building pit stop dataset from 2023-2024...")
    df = build_pit_stop_dataset(years=[2023, 2024])

    if df.empty:
        logger.error("No data collected. Check FastF1 cache and network.")
        return

    logger.info(f"Dataset shape: {df.shape}")
    logger.info(f"Positive rate: {df['pit_in_next_3'].mean():.2%}")

    feature_cols = [c for c in df.columns if c != "pit_in_next_3"]
    X = df[feature_cols].values.astype(np.float32)
    y = df["pit_in_next_3"].values.astype(np.int32)

    # Replace NaN
    col_means = np.nanmean(X, axis=0)
    for i in range(X.shape[1]):
        mask = np.isnan(X[:, i])
        X[mask, i] = col_means[i]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    logger.info(f"Training on {len(X_train)} samples, testing on {len(X_test)}")

    model = PitStopWindowPredictor()
    model.train(X_train, y_train, feature_cols)

    preds_proba = model.predict_proba(X_test)
    preds = (preds_proba > 0.5).astype(int)

    accuracy = accuracy_score(y_test, preds)
    auc = roc_auc_score(y_test, preds_proba)
    logger.info(f"Test Accuracy: {accuracy:.3f}")
    logger.info(f"Test AUC: {auc:.3f}")

    model.save()
    logger.info("Model saved to saved_models/pit_stop_model.joblib")


if __name__ == "__main__":
    main()
