"""
Train all 4 fantasy scoring component models from a single dataset build.

Usage: cd backend && python -m app.ml.training.train_all_fantasy_models
"""
from __future__ import annotations

import logging

import numpy as np
from sklearn.metrics import mean_absolute_error, roc_auc_score
from sklearn.model_selection import train_test_split

from app.ml.features.race_features import (
    build_unified_fantasy_dataset,
    QUALIFYING_FEATURES,
    POSITION_DELTA_FEATURES,
    FASTEST_LAP_FEATURES,
    DNF_FEATURES,
)
from app.ml.models.qualifying_predictor import QualifyingPredictor
from app.ml.models.position_delta_predictor import PositionDeltaPredictor
from app.ml.models.fastest_lap_predictor import FastestLapPredictor
from app.ml.models.dnf_predictor import DNFPredictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def _impute_nan(X: np.ndarray) -> np.ndarray:
    col_means = np.nanmean(X, axis=0)
    for i in range(X.shape[1]):
        mask = np.isnan(X[:, i])
        if mask.any():
            X[mask, i] = col_means[i] if not np.isnan(col_means[i]) else 0.0
    return X


def main():
    logger.info("=" * 60)
    logger.info("Building unified fantasy dataset from 2022-2024...")
    logger.info("=" * 60)
    df = build_unified_fantasy_dataset(use_cache=False)

    if df.empty:
        logger.error("No data collected. Check FastF1 cache and network.")
        return

    logger.info(f"Unified dataset: {len(df)} rows, {len(df.columns)} columns")

    # ── 1. Qualifying Model ──
    logger.info("\n" + "=" * 60)
    logger.info("Training QUALIFYING model...")
    logger.info("=" * 60)
    X_q = df[QUALIFYING_FEATURES].values.astype(np.float32)
    y_q = df["target_quali_position"].values.astype(np.float32)
    X_q = _impute_nan(X_q)

    X_tr, X_te, y_tr, y_te = train_test_split(X_q, y_q, test_size=0.2, random_state=42)
    quali_model = QualifyingPredictor()
    quali_model.train(X_tr, y_tr, QUALIFYING_FEATURES)
    preds = quali_model.predict(X_te)
    mae = mean_absolute_error(y_te, preds)
    logger.info(f"Qualifying MAE: {mae:.2f} positions")
    _log_importances(QUALIFYING_FEATURES, quali_model.model.feature_importances_)
    quali_model.save()

    # ── 2. Position Delta Model (exclude DNFs) ──
    logger.info("\n" + "=" * 60)
    logger.info("Training POSITION DELTA model...")
    logger.info("=" * 60)
    df_nodNF = df[df["target_dnf"] == 0]
    X_d = df_nodNF[POSITION_DELTA_FEATURES].values.astype(np.float32)
    y_d = df_nodNF["target_position_delta"].values.astype(np.float32)
    X_d = _impute_nan(X_d)

    X_tr, X_te, y_tr, y_te = train_test_split(X_d, y_d, test_size=0.2, random_state=42)
    delta_model = PositionDeltaPredictor()
    delta_model.train(X_tr, y_tr, POSITION_DELTA_FEATURES)
    preds = delta_model.predict(X_te)
    mae = mean_absolute_error(y_te, preds)
    logger.info(f"Position Delta MAE: {mae:.2f} positions")
    logger.info(f"Residual std: {delta_model.residual_std:.2f}")
    _log_importances(POSITION_DELTA_FEATURES, delta_model.model.feature_importances_)
    delta_model.save()

    # ── 3. Fastest Lap Model (exclude DNFs) ──
    logger.info("\n" + "=" * 60)
    logger.info("Training FASTEST LAP model...")
    logger.info("=" * 60)
    X_fl = df_nodNF[FASTEST_LAP_FEATURES].values.astype(np.float32)
    y_fl = df_nodNF["target_fastest_lap"].values.astype(np.int32)
    X_fl = _impute_nan(X_fl)

    logger.info(f"Fastest lap positive rate: {y_fl.mean():.3f}")
    X_tr, X_te, y_tr, y_te = train_test_split(X_fl, y_fl, test_size=0.2, random_state=42)
    fl_model = FastestLapPredictor()
    fl_model.train(X_tr, y_tr, FASTEST_LAP_FEATURES)
    probs = fl_model.predict_proba(X_te)
    auc = roc_auc_score(y_te, probs)
    logger.info(f"Fastest Lap AUC: {auc:.3f}")
    _log_importances(FASTEST_LAP_FEATURES, fl_model.model.feature_importances_)
    fl_model.save()

    # ── 4. DNF Model ──
    logger.info("\n" + "=" * 60)
    logger.info("Training DNF model...")
    logger.info("=" * 60)
    X_dnf = df[DNF_FEATURES].values.astype(np.float32)
    y_dnf = df["target_dnf"].values.astype(np.int32)
    X_dnf = _impute_nan(X_dnf)

    logger.info(f"DNF positive rate: {y_dnf.mean():.3f}")
    X_tr, X_te, y_tr, y_te = train_test_split(X_dnf, y_dnf, test_size=0.2, random_state=42)
    dnf_model = DNFPredictor()
    dnf_model.train(X_tr, y_tr, DNF_FEATURES)
    probs = dnf_model.predict_proba(X_te)
    auc = roc_auc_score(y_te, probs)
    logger.info(f"DNF AUC: {auc:.3f}")
    _log_importances(DNF_FEATURES, dnf_model.model.feature_importances_)
    dnf_model.save()

    logger.info("\n" + "=" * 60)
    logger.info("All 4 fantasy models trained and saved!")
    logger.info("=" * 60)


def _log_importances(feature_names: list[str], importances: np.ndarray):
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        logger.info(f"  {name}: {imp:.3f}")


if __name__ == "__main__":
    main()
