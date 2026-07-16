"""
YOLOv11 Disaster Detection Training Workflow
--------------------------------------------
This script orchestrates the entire YOLOv11 training pipeline, optimized
for Google Colab (T4 GPU). It handles training, validation, metrics generation,
and ONNX export.

Usage:
  pip install ultralytics
  python train_yolov11.py
"""

from pathlib import Path
from ultralytics import YOLO

def main() -> None:
    print("Loading YOLOv11n (Nano) base model...")
    # YOLOv11n is selected for optimal speed/accuracy trade-off on CPU backends
    model = YOLO("yolo11n.pt") 

    data_yaml_path = Path(__file__).parent / "data.yaml"
    if not data_yaml_path.exists():
        print(f"Error: {data_yaml_path} not found.")
        return

    print(f"Starting training using {data_yaml_path}...")
    
    # --- TRAINING PARAMETERS ---
    # Optimized for a T4 GPU (16GB VRAM) and 5 distinct classes
    results = model.train(
        data=str(data_yaml_path),
        epochs=100,               # 100 epochs for better convergence on combined dataset
        imgsz=640,                # Standard YOLO resolution
        batch=32,                 # Maximize T4 VRAM usage
        device="0",               # Use GPU
        optimizer="auto",         # AdamW is usually selected by auto for YOLOv8+
        lr0=0.01,                 # Initial learning rate
        
        # Data Augmentations (crucial for generalisation in disaster scenarios)
        hsv_h=0.015,              # Image HSV-Hue augmentation
        hsv_s=0.7,                # Image HSV-Saturation (simulate different smoke colors)
        hsv_v=0.4,                # Image HSV-Value (simulate day/night)
        degrees=10.0,             # Image rotation (+/- deg) for collapsed buildings
        translate=0.1,            # Image translation
        scale=0.5,                # Image scale
        flipud=0.0,               # No up-down flips (gravity matters for fire/smoke)
        fliplr=0.5,               # Left-right flips
        mosaic=1.0,               # Mosaic augmentation (great for small fires/blockages)
        
        project="runs",           
        name="disaster_ai_v1",    
        patience=20,              # Early stop if no improvement
        save=True,                # Save best.pt
        plots=True                # Automatically generate Confusion Matrix and PR curves
    )

    print("\n--- Training Complete ---")
    best_model_path = Path(f"runs/disaster_ai_v1/weights/best.pt")
    print(f"Best model saved at: {best_model_path}")

    # --- VALIDATION ---
    print("\nRunning Validation to generate final metrics...")
    # Validates on the 'val' set defined in data.yaml and saves metrics
    metrics = model.val()
    print(f"mAP50-95: {metrics.box.map}")
    print(f"mAP50: {metrics.box.map50}")
    
    # --- EXPORT ---
    print("\nExporting model to ONNX format...")
    # Dynamic shape export allows FastAPI to handle different image aspect ratios
    export_path = model.export(format="onnx", dynamic=True)
    print(f"ONNX Model exported to: {export_path}")
    
    print("\nCheck the 'runs/disaster_ai_v1/' directory for:")
    print("- confusion_matrix.png")
    print("- PR_curve.png")
    print("- results.png (loss curves)")


if __name__ == "__main__":
    main()
