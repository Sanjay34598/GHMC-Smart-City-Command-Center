import os
from pathlib import Path
from ultralytics import YOLO

def main():
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    
    print("Loading base yolo11n model...")
    model = YOLO("yolo11n.pt")
    
    onnx_path = models_dir / "best.onnx"
    if not onnx_path.exists():
        print("Exporting model to ONNX...")
        model.export(format="onnx", dynamic=True)
        # ultralytics saves the exported file next to the original .pt by default.
        # So it will be in the current directory as yolo11n.onnx
        
        # move it to models/best.onnx
        if os.path.exists("yolo11n.onnx"):
            os.rename("yolo11n.onnx", onnx_path)
            print(f"Moved to {onnx_path}")
        else:
            print("Failed to find exported ONNX model")
    else:
        print("best.onnx already exists.")

if __name__ == "__main__":
    main()
