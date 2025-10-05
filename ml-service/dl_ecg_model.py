"""
Deep Learning ECG Classification Model
1D CNN architecture for ECG rhythm classification
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
import os

class ECGClassifier:
    """
    1D Convolutional Neural Network for ECG Classification
    
    Architecture:
    - Input: Variable length ECG signal (resampled to 2500 points = 10 seconds at 250 Hz)
    - Conv1D layers with increasing filters (64, 128, 256)
    - MaxPooling and Dropout for regularization
    - Global Average Pooling to handle variable lengths
    - Dense layers for classification
    - Output: 5 classes with softmax activation
    
    Classes:
    0: Normal Sinus Rhythm
    1: Atrial Fibrillation (AFib)
    2: Bradycardia (slow heart rate)
    3: Tachycardia (fast heart rate)
    4: Premature Ventricular Contractions (PVCs)
    """
    
    def __init__(self, model_path='ecg_model.h5'):
        self.model_path = model_path
        self.model = None
        self.class_names = [
            'Normal Sinus Rhythm',
            'Atrial Fibrillation',
            'Bradycardia',
            'Tachycardia',
            'Premature Ventricular Contractions'
        ]
        self.input_length = 2500  # 10 seconds at 250 Hz
        
    def build_model(self):
        """Build the 1D CNN architecture"""
        
        model = models.Sequential([
            # Input layer
            layers.Input(shape=(self.input_length, 1)),
            
            # First Convolutional Block
            layers.Conv1D(64, kernel_size=7, activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling1D(pool_size=2),
            layers.Dropout(0.2),
            
            # Second Convolutional Block
            layers.Conv1D(128, kernel_size=5, activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling1D(pool_size=2),
            layers.Dropout(0.3),
            
            # Third Convolutional Block
            layers.Conv1D(256, kernel_size=3, activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling1D(pool_size=2),
            layers.Dropout(0.4),
            
            # Global pooling to handle variable sequence lengths
            layers.GlobalAveragePooling1D(),
            
            # Dense layers for classification
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.3),
            
            # Output layer
            layers.Dense(5, activation='softmax')
        ])
        
        # Compile with Adam optimizer
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        return model
    
    def preprocess_ecg(self, ecg_data):
        """
        Preprocess ECG data for model input
        
        Args:
            ecg_data: List or array of ECG voltage values
            
        Returns:
            Preprocessed ECG data ready for model prediction
        """
        # Convert to numpy array
        ecg_array = np.array(ecg_data, dtype=np.float32)
        
        # Remove NaN values
        ecg_array = ecg_array[~np.isnan(ecg_array)]
        
        if len(ecg_array) == 0:
            raise ValueError("No valid ECG data after removing NaN values")
        
        # Resample to fixed length (2500 points = 10 seconds at 250 Hz)
        if len(ecg_array) != self.input_length:
            # Use linear interpolation for resampling
            indices = np.linspace(0, len(ecg_array) - 1, self.input_length)
            ecg_array = np.interp(indices, np.arange(len(ecg_array)), ecg_array)
        
        # Normalize to zero mean and unit variance
        mean = np.mean(ecg_array)
        std = np.std(ecg_array)
        if std > 0:
            ecg_array = (ecg_array - mean) / std
        
        # Reshape for model input: (batch_size, timesteps, features)
        ecg_array = ecg_array.reshape(1, self.input_length, 1)
        
        return ecg_array
    
    def predict(self, ecg_data):
        """
        Predict ECG classification
        
        Args:
            ecg_data: List or array of ECG voltage values
            
        Returns:
            Dictionary with predicted class, confidence, and all probabilities
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() or build_model() first.")
        
        # Preprocess data
        processed_data = self.preprocess_ecg(ecg_data)
        
        # Make prediction
        predictions = self.model.predict(processed_data, verbose=0)
        
        # Get predicted class and confidence
        predicted_class = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class])
        
        # Create probability dictionary
        probabilities = {
            self.class_names[i]: float(predictions[0][i])
            for i in range(len(self.class_names))
        }
        
        return {
            'predicted_class': self.class_names[predicted_class],
            'confidence': confidence,
            'class_index': int(predicted_class),
            'probabilities': probabilities
        }
    
    def load_model(self):
        """Load pre-trained model from file"""
        if os.path.exists(self.model_path):
            self.model = keras.models.load_model(self.model_path)
            print(f"✓ Model loaded from {self.model_path}")
            return True
        else:
            print(f"⚠ Model file not found: {self.model_path}")
            print("Building new model with random weights...")
            self.build_model()
            return False
    
    def save_model(self):
        """Save model to file"""
        if self.model is not None:
            self.model.save(self.model_path)
            print(f"✓ Model saved to {self.model_path}")
        else:
            raise ValueError("No model to save. Build or load a model first.")
    
    def train(self, X_train, y_train, X_val=None, y_val=None, epochs=50, batch_size=32):
        """
        Train the model
        
        Args:
            X_train: Training ECG data (n_samples, input_length, 1)
            y_train: Training labels (n_samples,)
            X_val: Validation ECG data (optional)
            y_val: Validation labels (optional)
            epochs: Number of training epochs
            batch_size: Batch size for training
            
        Returns:
            Training history
        """
        if self.model is None:
            self.build_model()
        
        # Callbacks
        callbacks = [
            keras.callbacks.ModelCheckpoint(
                self.model_path,
                save_best_only=True,
                monitor='val_accuracy' if X_val is not None else 'accuracy',
                mode='max'
            ),
            keras.callbacks.EarlyStopping(
                monitor='val_loss' if X_val is not None else 'loss',
                patience=10,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss' if X_val is not None else 'loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7
            )
        ]
        
        # Train model
        validation_data = (X_val, y_val) if X_val is not None and y_val is not None else None
        
        history = self.model.fit(
            X_train, y_train,
            validation_data=validation_data,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        return history
    
    def get_model_summary(self):
        """Get model architecture summary"""
        if self.model is not None:
            return self.model.summary()
        else:
            return "No model loaded"


# Create global instance
classifier = ECGClassifier()

# Try to load model on import
try:
    model_loaded = classifier.load_model()
    if model_loaded:
        print("🧠 Deep Learning model ready!")
    else:
        print("⚠ Running with untrained model (random weights)")
        print("📝 Model needs training on real ECG data for accurate predictions")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("Building new model...")
    classifier.build_model()
