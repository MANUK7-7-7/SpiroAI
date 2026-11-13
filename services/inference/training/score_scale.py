"""Turn each model's probability into the 0-100 risk index a clinician reads.

A raw probability reads badly: a voice score of 0.37 sounds like "probably nothing", yet it is above
the screening cut-off. So the service shows an index whose bands are anchored to measured cut-offs:

  * screening anchor -> index 40 (Low / Moderate boundary): the score that keeps sensitivity >= 0.80
  * high anchor      -> index 70 (Moderate / High boundary): the score that keeps specificity >= 0.90

with straight lines in between, so the order of patients never changes. The index is not a probability.

Everything is measured on the deployed model's own output scale (sigmoid-calibrated, one model), with
out-of-fold predictions. The anchors used in production come from all the data; how well that rule
works is reported with nested cross-validation (anchors chosen on the training part only), so the
sensitivity, specificity and band composition shown to clinicians are not tuned on the same people.
Also stored: the distribution of healthy people's scores, for "higher than X% of healthy people".

Writes models/score_scale.json. Run after train.py and train_cough.py:
    python training/score_scale.py --voice-features data/features.csv --cough-table data/cc_table.csv --out models
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import train  # noqa: E402
import train_cough  # noqa: E402
from spiro.features import TASKS  # noqa: E402

SCREEN_SENSITIVITY = 0.80
HIGH_SPECIFICITY = 0.90
INDEX_AT = {"screen": 40, "high": 70}  # default band boundaries in src/config/risk-bands.ts
OUTER_REPEATS = 3


def deployed(base):
    """Same estimator as the deployed one: one sigmoid-calibrated model."""
    try:
        base.set_params(randomforestclassifier__n_jobs=-1)
    except ValueError:
        pass
    return CalibratedClassifierCV(base, method="sigmoid", cv=5, ensemble=False)


class Voice:
    """One row per participant."""
    def __init__(self, features_csv):
        X, meta = train.wide(pd.read_csv(features_csv), TASKS)
        self.X, self.y = X, meta["label"].to_numpy()

    def fit_predict(self, train_idx, test_idx):
        m = deployed(train.models()["random_forest"]).fit(self.X.iloc[train_idx], self.y[train_idx])
        return m.predict_proba(self.X.iloc[test_idx])[:, 1]


class Cough:
    """One unit per recording; training adds its background-swapped copies (kind aug*)."""
    def __init__(self, table_csv):
        t = pd.read_csv(table_csv).dropna(subset=["r__n_coughs"])
        self.cols = [c for c in t.columns if c.startswith("r__")]
        self.orig = t[t.kind == "orig"].reset_index(drop=True)
        self.aug = t[t.kind.str.startswith("aug")]
        self.y = self.orig["label"].to_numpy()

    def fit_predict(self, train_idx, test_idx):
        srcs = set(self.orig.loc[train_idx, "src"])
        rows = pd.concat([self.orig.loc[train_idx], self.aug[self.aug.src.isin(srcs)]])
        m = deployed(train_cough.models()["random_forest"]).fit(rows[self.cols], rows["label"])
        return m.predict_proba(self.orig.loc[test_idx, self.cols])[:, 1]


def oof(data, units, seeds):
    """Out-of-fold scores for `units` (indices), averaged over seeds."""
    y = data.y[units]
    out = np.zeros((len(seeds), len(units)))
    for i, seed in enumerate(seeds):
        for tr, te in StratifiedKFold(5, shuffle=True, random_state=seed).split(units, y):
            out[i, te] = data.fit_predict(units[tr], units[te])
    return out.mean(axis=0)


def anchors(p, y):
    screen = float(np.quantile(p[y == 1], 1 - SCREEN_SENSITIVITY))  # >= 80% of cases score at or above it
    high = float(np.quantile(p[y == 0], HIGH_SPECIFICITY))           # >= 90% of healthy score below it
    return {"screen": screen, "high": max(high, screen + 1e-6)}


def band(p, a):
    return np.where(p >= a["high"], "high", np.where(p >= a["screen"], "moderate", "low"))


def nested(data):
    """Anchors chosen on each outer-training part, applied to the held-out part."""
    units = np.arange(len(data.y))
    bands, ys = [], []
    for rep in range(OUTER_REPEATS):
        for tr, te in StratifiedKFold(5, shuffle=True, random_state=100 + rep).split(units, data.y):
            a = anchors(oof(data, units[tr], seeds=[rep]), data.y[tr])
            bands.append(band(data.fit_predict(units[tr], units[te]), a))
            ys.append(data.y[te])
    b, y = np.concatenate(bands), np.concatenate(ys)
    share = lambda mask, name: round(float(np.mean(b[mask] == name)), 3)
    return {
        "screen": {"sensitivity": round(float(np.mean(b[y == 1] != "low")), 3), "specificity": round(float(np.mean(b[y == 0] == "low")), 3)},
        "high": {"sensitivity": round(float(np.mean(b[y == 1] == "high")), 3), "specificity": round(float(np.mean(b[y == 0] != "high")), 3)},
        "bands": {name: {"with_disease": share(y == 1, name), "healthy": share(y == 0, name)} for name in ("low", "moderate", "high")},
    }


def scale_for(name, data):
    units = np.arange(len(data.y))
    p = oof(data, units, seeds=[0, 1, 2])
    a = anchors(p, data.y)
    report = {
        "anchors": {k: round(v, 4) for k, v in a.items()},
        "index_at": INDEX_AT,
        "rule": {"screen_sensitivity": SCREEN_SENSITIVITY, "high_specificity": HIGH_SPECIFICITY},
        "nested_cv": nested(data),
        "healthy_quantiles": [round(float(q), 4) for q in np.quantile(p[data.y == 0], np.linspace(0, 1, 101))],
        "n_with_disease": int(data.y.sum()),
        "n_healthy": int((1 - data.y).sum()),
    }
    print(name, json.dumps({k: v for k, v in report.items() if k != "healthy_quantiles"}))
    return report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice-features", required=True)
    ap.add_argument("--cough-table", required=True)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    result = {"voice": scale_for("voice", Voice(args.voice_features)), "cough": scale_for("cough", Cough(args.cough_table))}
    (args.out / "score_scale.json").write_text(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
