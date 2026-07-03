"""
KilimoPRO — Crop Disease Detection Model Training
Trains a MobileNetV3-based CNN on the PlantVillage dataset
for on-device inference via TensorFlow Lite.

Dataset: PlantVillage (54,305 images, 14 crops, 26 diseases)
URL: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset

Output: crop_disease_v1.tflite (quantized int8, ~5MB)
"""

import os
import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV3Small
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# ─── Configuration ─────────────────────────────────────────────────────
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 20
LEARNING_RATE = 0.001
DATASET_PATH = os.environ.get('PLANTVILLAGE_PATH', './datasets/plantvillage')
MODEL_SAVE_PATH = '../../packages/mobile/assets/models/crop_disease_v1.tflite'
LABELS_SAVE_PATH = '../../packages/mobile/assets/models/labels.json'

# Crops relevant to Kenyan agriculture
KENYAN_CROPS = ['Maize', 'Tomato', 'Potato', 'Cassava', 'Beans', 'Pepper']

# ─── Data Preparation ──────────────────────────────────────────────────

def create_data_generators():
    """Create train and validation data generators with augmentation."""
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest',
        validation_split=0.2,
    )
    
    val_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
    )
    
    train_gen = train_datagen.flow_from_directory(
        os.path.join(DATASET_PATH, 'train'),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training',
    )
    
    val_gen = val_datagen.flow_from_directory(
        os.path.join(DATASET_PATH, 'train'),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation',
    )
    
    return train_gen, val_gen


# ─── Model Architecture ────────────────────────────────────────────────

def build_model(num_classes: int) -> keras.Model:
    """Build MobileNetV3-based transfer learning model."""
    base_model = MobileNetV3Small(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights='imagenet',
    )
    base_model.trainable = False  # Freeze base model
    
    model = keras.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.3),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax'),
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    
    return model


# ─── Training ──────────────────────────────────────────────────────────

def train_model():
    """Train the crop disease detection model."""
    print("🌱 KilimoPRO — Crop Disease Detection Model Training")
    print("=" * 60)
    
    # Load data
    train_gen, val_gen = create_data_generators()
    num_classes = len(train_gen.class_indices)
    print(f"📊 Classes: {num_classes}")
    print(f"📊 Class indices: {train_gen.class_indices}")
    
    # Save labels
    labels = {v: k for k, v in train_gen.class_indices.items()}
    os.makedirs(os.path.dirname(LABELS_SAVE_PATH), exist_ok=True)
    with open(LABELS_SAVE_PATH, 'w') as f:
        json.dump(labels, f, indent=2)
    print(f"✅ Labels saved to {LABELS_SAVE_PATH}")
    
    # Build model
    model = build_model(num_classes)
    print(f"🏗️ Model built: {model.count_params():,} parameters")
    
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3),
        keras.callbacks.ModelCheckpoint(
            './checkpoints/best_model.h5',
            save_best_only=True,
            monitor='val_accuracy',
        ),
    ]
    
    # Train
    print("🚀 Starting training...")
    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS,
        callbacks=callbacks,
    )
    
    # Fine-tune: unfreeze top layers
    print("🔧 Fine-tuning...")
    base_model = model.layers[0]
    base_model.trainable = True
    for layer in base_model.layers[:-20]:
        layer.trainable = False
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE / 10),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    
    history_finetune = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=10,
        callbacks=callbacks,
    )
    
    # Evaluate
    val_loss, val_acc = model.evaluate(val_gen)
    print(f"\n📈 Final validation accuracy: {val_acc:.4f}")
    
    # Export to TFLite
    export_tflite(model, num_classes)
    
    return model, history, history_finetune


# ─── TFLite Export ─────────────────────────────────────────────────────

def export_tflite(model: keras.Model, num_classes: int):
    """Export model to TensorFlow Lite with int8 quantization."""
    print("\n📦 Exporting to TensorFlow Lite (int8 quantized)...")
    
    # Convert to TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    
    # Quantization
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.int8]
    converter.inference_input_type = tf.int8
    converter.inference_output_type = tf.int8
    
    tflite_model = converter.convert()
    
    # Save
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    with open(MODEL_SAVE_PATH, 'wb') as f:
        f.write(tflite_model)
    
    model_size = os.path.getsize(MODEL_SAVE_PATH) / (1024 * 1024)
    print(f"✅ TFLite model saved: {MODEL_SAVE_PATH}")
    print(f"📏 Model size: {model_size:.2f} MB")
    print(f"🔢 Model is quantized to int8 (75% size reduction from float32)")


# ─── Main ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    if not os.path.exists(DATASET_PATH):
        print(f"❌ Dataset not found at {DATASET_PATH}")
        print("   Download from: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset")
        print("   Or run: python download_dataset.py")
        sys.exit(1)
    
    train_model()
    print("\n✅ Training complete! Model ready for on-device inference.")
