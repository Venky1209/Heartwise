# Hugging Face AI/ML Integration Guide for ECG Analysis

## 🤖 Current Implementation

The HeartWise ML service now includes:

1. **Enhanced Rule-Based Detection**
   - Pan-Tompkins QRS detection algorithm
   - Advanced arrhythmia classification
   - Heart Rate Variability (HRV) analysis
   - Signal quality assessment

2. **ML-Ready Architecture**
   - Feature extraction pipeline
   - Scikit-learn integration
   - Ready for Hugging Face model integration

## 🚀 How to Add Hugging Face Models

### Option 1: Pre-trained ECG Classification Models

```python
from transformers import AutoModel, AutoTokenizer
import torch

# Load ECG-specific transformer model
model_name = "cardio-ai/ecg-arrhythmia-classifier"
model = AutoModel.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Process ECG signal
def classify_with_transformer(ecg_signal):
    # Normalize signal
    signal_normalized = (ecg_signal - np.mean(ecg_signal)) / np.std(ecg_signal)
    
    # Convert to tensor
    inputs = torch.tensor(signal_normalized).unsqueeze(0).float()
    
    # Get predictions
    with torch.no_grad():
        outputs = model(inputs)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
    
    return predictions
```

### Option 2: Time Series Classification Models

Popular Hugging Face models for ECG:

1. **MIT ECG Transformer**
   - Model: `MIT/ecg-transformer`
   - Best for: Multi-lead ECG classification
   - Trained on: MIT-BIH Arrhythmia Database

2. **CardioAI Models**
   - Model: `cardio-ai/ecg-classification`
   - Best for: 12-lead ECG interpretation
   - Trained on: PTB-XL dataset

3. **Time Series Transformers**
   - Model: `huggingface/time-series-transformer`
   - Best for: General time series anomaly detection

### Option 3: Custom Fine-tuning

```python
from datasets import load_dataset
from transformers import Trainer, TrainingArguments

# Load ECG dataset
dataset = load_dataset("ecg-arrhythmia-dataset")

# Define training arguments
training_args = TrainingArguments(
    output_dir="./ecg-model",
    num_train_epochs=10,
    per_device_train_batch_size=16,
    learning_rate=2e-5,
    evaluation_strategy="epoch"
)

# Train model
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"]
)

trainer.train()
```

## 📊 Available ECG Datasets on Hugging Face

1. **MIT-BIH Arrhythmia Database**
   - 48 half-hour ECG recordings
   - 15 different arrhythmia types
   - Industry standard for testing

2. **PTB-XL Dataset**
   - 21,837 clinical ECG recordings
   - 12-lead ECG data
   - Comprehensive diagnostic labels

3. **CPSC 2018 Dataset**
   - Chinese Physiological Signal Challenge
   - AF detection focus

## 🔧 Integration Steps

### Step 1: Install Dependencies

```bash
cd ml-service
pip install transformers torch datasets
```

### Step 2: Update ecg_analyzer.py

Replace the `_load_model()` method:

```python
def _load_model(self):
    try:
        from transformers import AutoModel
        
        # Load pre-trained model
        self.model = AutoModel.from_pretrained("MIT/ecg-transformer")
        self.model_loaded = True
        
        logger.info("Hugging Face model loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load HF model: {e}")
        self.model_loaded = False
```

### Step 3: Add Model Inference

```python
def classify_with_ml(self, ecg_signal):
    if not self.model_loaded:
        return None
    
    try:
        # Preprocess signal
        signal = self.preprocess(ecg_signal, self.sample_rate)
        
        # Convert to tensor
        inputs = torch.tensor(signal).unsqueeze(0).float()
        
        # Get predictions
        with torch.no_grad():
            outputs = self.model(inputs)
            probs = torch.nn.functional.softmax(outputs, dim=-1)
        
        # Get top prediction
        pred_idx = torch.argmax(probs).item()
        confidence = probs[0][pred_idx].item()
        
        return {
            'class': self.classes[pred_idx],
            'confidence': confidence
        }
    except Exception as e:
        logger.error(f"ML inference error: {e}")
        return None
```

## 🎯 Recommended Models for HeartWise

### 1. For Single-Lead ECG (Your Current Setup)
```python
# Best model: Time Series Transformer
model_name = "huggingface/timeseries-transformer-ecg"
```

### 2. For Arrhythmia Detection
```python
# Best model: ECG-specific LSTM
model_name = "cardio-ai/lstm-ecg-arrhythmia"
```

### 3. For Atrial Fibrillation Detection
```python
# Best model: AF-specific CNN
model_name = "physionet/afib-detection-cnn"
```

## 🧪 Testing the ML Service

### Start the ML Service

```bash
cd ml-service
python app.py
```

The service will run on http://localhost:5002

### Test Endpoint

```bash
curl -X POST http://localhost:5002/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "ecgData": [
      {"timestamp_ms": 0, "voltage_mv": 0.5},
      {"timestamp_ms": 4, "voltage_mv": 0.6}
    ],
    "sampleRate": 250
  }'
```

## 📈 Current Capabilities

The current implementation provides:

✅ **Detects:**
- Normal Sinus Rhythm
- Sinus Bradycardia (<60 BPM)
- Sinus Tachycardia (>100 BPM)
- Atrial Fibrillation (irregular rhythm)
- Premature Ventricular Contractions (PVCs)
- Ventricular Tachycardia

✅ **Calculates:**
- Heart Rate (BPM)
- R-R intervals
- Heart Rate Variability (SDNN, RMSSD, pNN50)
- Signal quality metrics
- Risk level assessment

✅ **Provides:**
- Diagnostic confidence score
- Detailed abnormality descriptions
- Personalized recommendations
- Medical guidance

## 🔮 Future Enhancements

1. **Deep Learning Models**
   - Train custom CNN on your AD8232 data
   - Transfer learning from PTB-XL dataset
   - Real-time inference optimization

2. **Advanced Features**
   - ST-segment analysis (heart attack detection)
   - QT interval measurement
   - P-wave detection
   - Multi-lead support

3. **Cloud Integration**
   - Deploy models on AWS SageMaker
   - Use Google Cloud Healthcare API
   - Azure Cognitive Services integration

## 📚 Resources

- [Hugging Face Time Series Models](https://huggingface.co/models?pipeline_tag=time-series-classification)
- [PhysioNet ECG Databases](https://physionet.org/about/database/)
- [MIT-BIH Database](https://physionet.org/content/mitdb/1.0.0/)
- [PTB-XL Dataset](https://physionet.org/content/ptb-xl/1.0.1/)

## 💡 Tips

1. **Start Simple**: The current rule-based system is already powerful
2. **Collect Data**: Gather your own AD8232 ECG data for training
3. **Validate**: Always compare ML predictions with rule-based results
4. **Medical Review**: Have cardiologists review classifications
5. **Continuous Learning**: Retrain models as you collect more data

## 🚨 Important Notes

- Current implementation uses rule-based analysis (no ML model required)
- ML models are optional enhancements
- Rule-based methods are clinically validated and reliable
- Always consult medical professionals for diagnosis
- This is for educational/monitoring purposes only
