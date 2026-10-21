# SpiroAI models: model card

Research prototypes. **Not clinically validated, not a medical device.** Every number here comes from
cross-validation on public research datasets, not from a clinical study.

## Voice model (`copd_voice_model.joblib`)

| | |
|---|---|
| Input | Sustained vowel /a/ and counting 1 to 20 |
| Target | Self-reported **chronic lung disease** (includes COPD, also asthma, bronchiectasis and others) |
| Data | [Coswara](https://github.com/iiscleap/Coswara-Data) (IISc Bangalore, CC BY 4.0), crowdsourced, India, 2020 to 2022, counting in English |
| Cohort | 98 participants: 29 cases, 69 controls with no respiratory condition, matched on sex, age (±10 y) and recording year |
| Features | Phonation time, pause ratio, F0, jitter, shimmer, HNR, MFCC and spectral statistics from both tasks |
| Model | Random forest, sigmoid-calibrated |

Repeated 5-fold cross-validation, participant level:

| Metric | Value |
|---|---|
| ROC AUC | 0.82 ± 0.02 |
| Matched-pair concordance (case vs its own matched controls) | 0.71 |
| Sensitivity / specificity at 0.5 | 0.48 / 0.94 |
| Baseline: age + sex only | AUC 0.68 |
| Baseline: recording year only | AUC 0.44 |

Matching on recording year was necessary: without it, the year alone predicted the label with AUC 0.85
(cases recorded mostly in 2021, controls in 2020).

## Cough model (`copd_cough_model.joblib`)

| | |
|---|---|
| Input | 3 voluntary coughs |
| Target | Clinically diagnosed **COPD** |
| Data | [COPD-Cough (CC)](https://zenodo.org/records/14881818) (USTC, CC BY 4.0), smartphone recordings, China. No age, sex or patient ID. |
| Recordings | 853: 221 COPD, 632 healthy |
| Features | Band-limited (100 to 4000 Hz), denoised with each recording's own noise profile, computed on detected cough events only, loudness-normalised |
| Training | Background-swap augmentation: each cough also replayed over other recordings' background |
| Model | Random forest trained with background-swap augmentation, sigmoid-calibrated |

**Known bias.** In this dataset the background noise alone (the quietest 10% of each file) predicts COPD
with AUC 0.78, most likely because patients and volunteers were recorded in different places. The
pipeline above is designed to stop the model from using it. Stress test: re-score each test cough over
the background of a recording from the opposite group.

| Model | AUC | AUC, background swapped | Decisions flipped by the background |
|---|---|---|---|
| Naive (raw audio, no augmentation) | 0.87 | 0.62 | 14% |
| Deployed (robust) | 0.81 | 0.78 | 2.7% |

Sensitivity / specificity at a 0.5 cut-off on the raw cross-validation scores: 0.09 / 0.99. The model ranks
coughs well (AUC) but its scores sit low, so 0.5 is the wrong cut-off; any alert threshold on the cough
score has to be chosen and validated clinically. On the dataset's own train/test
split: AUC 0.85, 0.81 with swapped backgrounds (172 test recordings).
The dataset has no patient IDs, so the same person may appear in train and test folds; real-world
performance is likely lower.

## Combined index (inference service)

* `riskIndex` = mean of the available model probabilities × 100.
* `confidence` = mean of max(p, 1 − p) per model, multiplied by 1 − 0.5 × |p_voice − p_cough|.
* Both rules are samples chosen for transparency, not validated choices.

## Limits to keep in mind

* Patients in Argentina will count in Spanish; the voice model learned counting in English. Expect a
  shift until the model is validated or retrained on Spanish speech.
* Neither dataset represents the target population (age, language, devices, care setting).
* Probabilities reflect each training set's case mix, not population prevalence.

## Reproduce

Scripts in `../training/`. Data is not in the repository; see `../README.md`.
