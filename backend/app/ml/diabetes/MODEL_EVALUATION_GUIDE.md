# Diabetes Model Evaluation Guide

After training, the script writes:

```text
app/ml/diabetes/artifacts/evaluation.json
```

## Metrics Explained

### Accuracy

Accuracy answers:

```text
How many total predictions were correct?
```

Accuracy can be misleading if the dataset is imbalanced.

### Precision

Precision answers:

```text
When the model predicts diabetes risk, how often is it correct?
```

High precision means fewer false alarms.

### Recall

Recall answers:

```text
Of all true diabetes-risk cases, how many did the model detect?
```

For medical screening, recall is very important because missing a risky case is dangerous.

### F1-score

F1-score balances precision and recall.

It is useful when you need one score that punishes both false positives and false negatives.

### ROC-AUC

ROC-AUC measures how well the model separates positive and negative cases across many probability thresholds.

Closer to `1.0` is better.

### Confusion Matrix

The confusion matrix is:

```text
[[true_negative, false_positive],
 [false_negative, true_positive]]
```

For medical risk systems, pay close attention to `false_negative`.

## Recommended First Target

For a first educational model, aim for:

```text
recall >= 0.70
roc_auc >= 0.75
```

These are not clinical acceptance criteria. They are learning targets only.
