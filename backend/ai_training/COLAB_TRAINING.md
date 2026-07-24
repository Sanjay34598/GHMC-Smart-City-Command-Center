# CityPulse AI — Complete YOLOv11 Model Training Workflow

This document provides a comprehensive, end-to-end guide to preparing the dataset and training the custom YOLOv11 model for CityPulse AI. It is optimised for a **Google Colab (T4 GPU)** environment to ensure fast, free training that fits within a 36-hour hackathon limit.

---

## 1. Dataset Selection & Preparation

Because no single public dataset contains all 5 required classes (Fire, Smoke, Flood, Collapsed Building, Road Blockage), you must merge datasets using **Roboflow Universe**.

### Recommended Public Datasets
1. **Fire and Smoke Detection (Collection)**: The largest, highest-quality dataset for active fires and smoke plumes.
2. **FloodNet**: Aerial imagery of flooded regions, highly accurate for disaster mapping.
3. **AIDER (Aerial Image Database for Emergency Response)**: Excellent for collapsed buildings and road blockages/traffic incidents.

### How to Merge and Normalize Classes
1. Create a free account on [Roboflow](https://roboflow.com/) and create a new **Object Detection** project named `DisasterAI`.
2. Navigate to the Roboflow Universe pages for the recommended datasets.
3. Click **"Add to Workspace"** and select your `DisasterAI` project.
4. **CRITICAL: Class Normalization**
   As you import these datasets, Roboflow will prompt you to map their existing classes to your project's classes. You must normalize them exactly as follows:
   * Map `wildfire`, `house_fire`, `flame` ➔ **`Fire`**
   * Map `smoke_plume`, `thick_smoke` ➔ **`Smoke`**
   * Map `flooded_area`, `water_damage` ➔ **`Flood`**
   * Map `ruins`, `destroyed_building`, `structural_damage` ➔ **`Collapsed Building`**
   * Map `blocked_road`, `traffic_accident`, `debris` ➔ **`Road Blockage`**
5. Once all datasets are merged, navigate to **Generate** in your Roboflow project.
6. Select **YOLOv11** format and click "Get Snippet". Copy the Jupyter Notebook download code.

---

## 2. Google Colab Training Setup

1. Open [Google Colab](https://colab.research.google.com/) and create a new Notebook.
2. Go to **Runtime > Change runtime type** and ensure **T4 GPU** is selected.
3. Create a cell and upload the configuration files from this repository:
   * Upload `backend/ai_training/data.yaml`
   * Upload `backend/ai_training/train_yolov11.py`

### Cell 1: Install Dependencies
```bash
!pip install ultralytics roboflow onnx onnxruntime
```

### Cell 2: Download the Dataset
Paste the code from Roboflow to download your merged dataset directly into the Colab environment:
```python
from roboflow import Roboflow
rf = Roboflow(api_key="YOUR_ROBOFLOW_API_KEY")
project = rf.workspace("your-workspace").project("disasterai")
version = project.version(1)
dataset = version.download("yolov11")
```
*Note: The dataset will download to a folder in Colab. Ensure the `path:` variable in your uploaded `data.yaml` points correctly to this downloaded folder.*

---

## 3. Training Execution

The `train_yolov11.py` script provided in this repository handles everything: model initialization (YOLOv11 Nano), optimized training augmentations, validation, metric generation, and ONNX export.

### Cell 3: Run the Training Pipeline
```bash
!python train_yolov11.py
```

### What happens during this script?
1. **Model**: `yolo11n.pt` is downloaded. It is chosen for its ultra-fast CPU inference speed.
2. **Parameters**: Batch size of 32 (maximising the T4 GPU), 100 epochs, and the `auto` (AdamW) optimizer.
3. **Augmentations**: Heavy HSV shifting, mosaic generation, and rotation are applied to simulate different lighting conditions and angles common in disaster scenarios.
4. **Validation & Metrics**: The script automatically validates on the hold-out set, calculating mAP50-95, and generates the Confusion Matrix and Precision/Recall curves.
5. **Export**: The PyTorch model is dynamically exported to ONNX format.

---

## 4. Retrieving Metrics & Models

Once the script completes, all results are saved in the `runs/disaster_ai_v1/` directory.

### Cell 4: Download the Results
```python
import shutil
from google.colab import files

# Zip the entire run folder to get all metrics, graphs, and weights
shutil.make_archive('training_results', 'zip', 'runs/disaster_ai_v1')
files.download('training_results.zip')
```

Extract the ZIP file on your local machine. You will find:
* `weights/best.pt`: The standard PyTorch model.
* `weights/best.onnx`: The highly optimized model for CPU deployment.
* `confusion_matrix.png`: To analyze class confusion (e.g., Fire vs Smoke).
* `PR_curve.png`: Precision-Recall curves.

---

## 5. Integrating the Model into the FastAPI Backend

Do **not** modify any FastAPI application code until you have these weights. Once downloaded, follow this exact structure to deploy:

1. **Place the weights**:
   Create a directory `backend/models/` and place `best.onnx` inside it.
   ```
   backend/
   ├── app/
   ├── models/
   │   └── best.onnx   <-- Your trained model
   └── ...
   ```

2. **Update the Detector**:
   When implementing Phase 3, you will create `YOLODetector` (which implements the `BaseDetector` interface) and load this specific file:
   ```python
   # inside backend/app/ai/yolo_detector.py
   self._model = YOLO("models/best.onnx", task="detect")
   ```

3. **Swap the Service**:
   In `backend/app/ai/detector.py`, change the dependency injection pointer from `MockDetector` to `YOLODetector`.

The training workflow is now 100% complete.
