---
sidebar_position: 1
title: Computer Vision Fundamentals
---

# Computer Vision Fundamentals

## Introduction

**Computer vision** enables robots to interpret and understand visual information from cameras, providing crucial perception capabilities for navigation, manipulation, and human-robot interaction. Modern physical AI systems rely heavily on vision for:

- **Object detection and recognition**: Identifying objects for manipulation
- **Pose estimation**: Determining 6D poses of objects and bodies
- **Depth perception**: Understanding 3D structure from 2D images
- **Scene understanding**: Semantic segmentation and scene graphs
- **Visual servoing**: Closed-loop control using visual feedback

This chapter covers image processing fundamentals, classical computer vision techniques, deep learning for vision (CNNs, transformers), object detection architectures, depth estimation, and visual servoing for robotic control.

**Learning Objectives:**
- Understand image formation and camera models
- Implement classical feature detection (SIFT, ORB)
- Design and train convolutional neural networks
- Apply object detection models (YOLO, Faster R-CNN)
- Estimate depth from monocular and stereo images
- Implement visual servoing for robot control

---

## Image Formation and Camera Models

### Pinhole Camera Model

The **pinhole camera model** describes perspective projection from 3D world to 2D image:

$$
\begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \frac{1}{Z} \mathbf{K} \begin{bmatrix} X \\ Y \\ Z \end{bmatrix}
$$

Where:
- $(X, Y, Z)$: 3D point in camera frame
- $(u, v)$: 2D pixel coordinates
- $\mathbf{K}$: **Intrinsic matrix** (camera parameters)

$$
\mathbf{K} = \begin{bmatrix}
f_x & 0 & c_x \\
0 & f_y & c_y \\
0 & 0 & 1
\end{bmatrix}
$$

Where:
- $f_x, f_y$: Focal lengths (pixels)
- $c_x, c_y$: Principal point (image center)

**Full projection** (world → camera → image):

$$
\mathbf{x}_{image} = \mathbf{K} [\mathbf{R} | \mathbf{t}] \mathbf{X}_{world}
$$

Where $[\mathbf{R} | \mathbf{t}]$ is the **extrinsic matrix** (rotation + translation from world to camera).

```python
import numpy as np
import cv2

class PinholeCamera:
    def __init__(self, fx, fy, cx, cy, width, height):
        """
        Pinhole camera model.

        Args:
            fx, fy: Focal lengths (pixels)
            cx, cy: Principal point (pixels)
            width, height: Image dimensions
        """
        self.K = np.array([
            [fx, 0, cx],
            [0, fy, cy],
            [0, 0, 1]
        ])
        self.width = width
        self.height = height

    def project(self, X_cam):
        """
        Project 3D points in camera frame to 2D image.

        Args:
            X_cam: Nx3 array of 3D points

        Returns:
            uv: Nx2 array of pixel coordinates
        """
        # Homogeneous coordinates
        X_hom = X_cam.T  # 3xN

        # Project
        uv_hom = self.K @ X_hom  # 3xN

        # Normalize by depth
        uv = uv_hom[:2] / uv_hom[2]  # 2xN

        return uv.T  # Nx2

    def backproject(self, uv, depth):
        """
        Backproject 2D pixels to 3D points given depth.

        Args:
            uv: Nx2 pixel coordinates
            depth: Nx1 depth values (meters)

        Returns:
            X_cam: Nx3 3D points in camera frame
        """
        # Homogeneous pixel coordinates
        uv_hom = np.column_stack([uv, np.ones(len(uv))])  # Nx3

        # Inverse projection
        K_inv = np.linalg.inv(self.K)
        X_norm = (K_inv @ uv_hom.T).T  # Nx3

        # Scale by depth
        X_cam = X_norm * depth.reshape(-1, 1)

        return X_cam

# Example: Intel RealSense D435 camera parameters
camera = PinholeCamera(
    fx=615.0, fy=615.0,
    cx=320.0, cy=240.0,
    width=640, height=480
)

# Project 3D point to image
X_cam = np.array([[1.0, 0.5, 2.0]])  # 1m right, 0.5m up, 2m forward
uv = camera.project(X_cam)
print(f"3D point {X_cam[0]} projects to pixel {uv[0]}")
```

### Lens Distortion

Real lenses introduce **radial** and **tangential** distortion.

**Radial distortion** (barrel/pincushion):

$$
\begin{aligned}
x_{distorted} &= x (1 + k_1 r^2 + k_2 r^4 + k_3 r^6) \\
y_{distorted} &= y (1 + k_1 r^2 + k_2 r^4 + k_3 r^6)
\end{aligned}
$$

Where $r^2 = x^2 + y^2$ and $k_1, k_2, k_3$ are distortion coefficients.

**Tangential distortion**:

$$
\begin{aligned}
x_{distorted} &= x + [2 p_1 xy + p_2(r^2 + 2x^2)] \\
y_{distorted} &= y + [p_1(r^2 + 2y^2) + 2 p_2 xy]
\end{aligned}
$$

```python
def undistort_image(image, K, dist_coeffs):
    """
    Remove lens distortion from image.

    Args:
        image: Input image
        K: Intrinsic matrix (3x3)
        dist_coeffs: [k1, k2, p1, p2, k3]

    Returns:
        undistorted: Corrected image
    """
    h, w = image.shape[:2]

    # Compute optimal new camera matrix
    new_K, roi = cv2.getOptimalNewCameraMatrix(K, dist_coeffs, (w, h), 1, (w, h))

    # Undistort
    undistorted = cv2.undistort(image, K, dist_coeffs, None, new_K)

    return undistorted
```

---

## Classical Computer Vision

### Feature Detection

**Keypoints** are distinctive points in images that can be reliably detected across viewpoints.

#### Harris Corner Detector

**Corner response function**:

$$
R = \text{det}(\mathbf{M}) - k \cdot \text{trace}(\mathbf{M})^2
$$

Where $\mathbf{M}$ is the structure tensor:

$$
\mathbf{M} = \sum_{x,y} w(x,y) \begin{bmatrix}
I_x^2 & I_x I_y \\
I_x I_y & I_y^2
\end{bmatrix}
$$

And $I_x, I_y$ are image gradients.

```python
def detect_harris_corners(image, block_size=2, ksize=3, k=0.04):
    """
    Detect Harris corners.

    Args:
        image: Grayscale image
        block_size: Neighborhood size
        ksize: Sobel kernel size
        k: Harris parameter (typically 0.04-0.06)

    Returns:
        corners: Nx2 array of corner coordinates
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

    # Compute corner response
    dst = cv2.cornerHarris(gray, block_size, ksize, k)

    # Dilate for marking
    dst = cv2.dilate(dst, None)

    # Threshold
    threshold = 0.01 * dst.max()
    corners = np.argwhere(dst > threshold)

    return corners[:, [1, 0]]  # (x, y) format
```

#### SIFT (Scale-Invariant Feature Transform)

**Properties**:
- Invariant to scale, rotation, illumination
- 128-dimensional descriptor per keypoint

```python
def extract_sift_features(image):
    """
    Extract SIFT keypoints and descriptors.

    Returns:
        keypoints: List of cv2.KeyPoint objects
        descriptors: Nx128 array of SIFT descriptors
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Create SIFT detector
    sift = cv2.SIFT_create()

    # Detect and compute
    keypoints, descriptors = sift.detectAndCompute(gray, None)

    return keypoints, descriptors

def match_features(desc1, desc2, ratio_threshold=0.75):
    """
    Match SIFT features using Lowe's ratio test.

    Args:
        desc1, desc2: SIFT descriptors (Nx128)
        ratio_threshold: Lowe's ratio (0.7-0.8)

    Returns:
        matches: List of good cv2.DMatch objects
    """
    # FLANN matcher
    FLANN_INDEX_KDTREE = 1
    index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)

    # Find 2 nearest neighbors
    matches = flann.knnMatch(desc1, desc2, k=2)

    # Lowe's ratio test
    good_matches = []
    for m, n in matches:
        if m.distance < ratio_threshold * n.distance:
            good_matches.append(m)

    return good_matches
```

#### ORB (Oriented FAST and Rotated BRIEF)

**Faster alternative** to SIFT (free, no patents):

```python
def extract_orb_features(image, n_features=500):
    """
    Extract ORB keypoints (faster than SIFT).

    Returns:
        keypoints: List of cv2.KeyPoint objects
        descriptors: Nx32 binary descriptors
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Create ORB detector
    orb = cv2.ORB_create(nfeatures=n_features)

    # Detect and compute
    keypoints, descriptors = orb.detectAndCompute(gray, None)

    return keypoints, descriptors
```

---

## Deep Learning for Vision

### Convolutional Neural Networks (CNNs)

**Convolutional layer** applies filters to detect patterns:

$$
y[i, j] = \sum_{m} \sum_{n} x[i+m, j+n] \cdot w[m, n] + b
$$

**Key operations**:
- **Convolution**: Feature extraction
- **Pooling**: Downsampling (max or average)
- **ReLU**: Activation $f(x) = \max(0, x)$
- **Batch normalization**: Normalize activations
- **Fully connected**: Classification

```python
import torch
import torch.nn as nn

class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super(SimpleCNN, self).__init__()

        # Feature extraction
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)

        self.pool = nn.MaxPool2d(2, 2)
        self.relu = nn.ReLU(inplace=True)

        # Classification head
        self.fc1 = nn.Linear(128 * 4 * 4, 256)
        self.dropout = nn.Dropout(0.5)
        self.fc2 = nn.Linear(256, num_classes)

    def forward(self, x):
        # Conv block 1
        x = self.relu(self.bn1(self.conv1(x)))
        x = self.pool(x)  # 32x16x16

        # Conv block 2
        x = self.relu(self.bn2(self.conv2(x)))
        x = self.pool(x)  # 64x8x8

        # Conv block 3
        x = self.relu(self.bn3(self.conv3(x)))
        x = self.pool(x)  # 128x4x4

        # Flatten
        x = x.view(x.size(0), -1)

        # Fully connected
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)

        return x

# Training loop
def train_cnn(model, train_loader, num_epochs=10, lr=0.001):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)

            # Forward pass
            outputs = model(images)
            loss = criterion(outputs, labels)

            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

        print(f'Epoch [{epoch+1}/{num_epochs}], Loss: {running_loss/len(train_loader):.4f}')
```

### ResNet (Residual Networks)

**Residual connection** allows deeper networks:

$$
\mathbf{y} = \mathcal{F}(\mathbf{x}, \{W_i\}) + \mathbf{x}
$$

**Advantage**: Mitigates vanishing gradients, enables 50-200 layer networks.

```python
class ResidualBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1):
        super(ResidualBlock, self).__init__()

        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)

        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 1, stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )

    def forward(self, x):
        residual = x

        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))

        out += self.shortcut(residual)  # Residual connection
        out = F.relu(out)

        return out
```

---

## Object Detection

### YOLO (You Only Look Once)

**Single-stage detector**: Predicts bounding boxes and classes in one forward pass.

**Grid-based approach**:
1. Divide image into $S \times S$ grid
2. Each cell predicts $B$ bounding boxes + confidence
3. Each box predicts: $(x, y, w, h, \text{confidence}, \text{class})$

**Output shape**: $(S \times S \times (B \times 5 + C))$ where $C$ is number of classes.

```python
from ultralytics import YOLO

def detect_objects_yolo(image_path, conf_threshold=0.5):
    """
    Detect objects using YOLOv8.

    Args:
        image_path: Path to image
        conf_threshold: Confidence threshold

    Returns:
        detections: List of (class_name, confidence, bbox)
    """
    # Load pretrained YOLOv8
    model = YOLO('yolov8n.pt')  # nano model (fastest)

    # Run inference
    results = model(image_path, conf=conf_threshold)

    detections = []
    for r in results:
        boxes = r.boxes
        for box in boxes:
            # Extract detection info
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].cpu().numpy()  # [x1, y1, x2, y2]

            class_name = model.names[cls]
            detections.append((class_name, conf, xyxy))

    return detections

# Example usage
detections = detect_objects_yolo('robot_scene.jpg')
for class_name, conf, bbox in detections:
    print(f"{class_name}: {conf:.2f}, bbox: {bbox}")
```

### Faster R-CNN

**Two-stage detector**:
1. **Region Proposal Network (RPN)**: Generates candidate boxes
2. **Classification**: Refines boxes and predicts classes

**More accurate but slower** than YOLO.

```python
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn

def detect_objects_faster_rcnn(image, conf_threshold=0.7):
    """
    Detect objects using Faster R-CNN.

    Args:
        image: PIL Image or tensor (CxHxW)
        conf_threshold: Confidence threshold

    Returns:
        detections: Dict with 'boxes', 'labels', 'scores'
    """
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Load pretrained model (COCO)
    model = fasterrcnn_resnet50_fpn(pretrained=True)
    model = model.to(device)
    model.eval()

    # Prepare image
    if not isinstance(image, torch.Tensor):
        transform = torchvision.transforms.ToTensor()
        image = transform(image)

    image = image.to(device)

    # Inference
    with torch.no_grad():
        predictions = model([image])

    # Filter by confidence
    pred = predictions[0]
    keep = pred['scores'] > conf_threshold

    detections = {
        'boxes': pred['boxes'][keep].cpu().numpy(),
        'labels': pred['labels'][keep].cpu().numpy(),
        'scores': pred['scores'][keep].cpu().numpy()
    }

    return detections
```

---

## Depth Estimation

### Stereo Vision

**Stereo disparity** relates depth to pixel difference:

$$
Z = \frac{f \cdot B}{d}
$$

Where:
- $Z$: Depth (meters)
- $f$: Focal length (pixels)
- $B$: Baseline (distance between cameras, meters)
- $d$: Disparity (pixel difference)

```python
def compute_stereo_depth(left_image, right_image, baseline, focal_length):
    """
    Compute depth map from stereo pair.

    Args:
        left_image, right_image: Rectified stereo images
        baseline: Distance between cameras (meters)
        focal_length: Focal length (pixels)

    Returns:
        depth_map: Depth in meters (HxW)
    """
    # Convert to grayscale
    left_gray = cv2.cvtColor(left_image, cv2.COLOR_BGR2GRAY)
    right_gray = cv2.cvtColor(right_image, cv2.COLOR_BGR2GRAY)

    # Stereo matching (Semi-Global Block Matching)
    stereo = cv2.StereoSGBM_create(
        minDisparity=0,
        numDisparities=128,  # Must be divisible by 16
        blockSize=5,
        P1=8 * 3 * 5**2,
        P2=32 * 3 * 5**2,
        disp12MaxDiff=1,
        uniquenessRatio=10,
        speckleWindowSize=100,
        speckleRange=32
    )

    # Compute disparity
    disparity = stereo.compute(left_gray, right_gray).astype(np.float32) / 16.0

    # Convert disparity to depth
    depth_map = np.zeros_like(disparity)
    valid = disparity > 0
    depth_map[valid] = (focal_length * baseline) / disparity[valid]

    return depth_map
```

### Monocular Depth Estimation (Deep Learning)

**MiDaS** (Mixed Data Sparse) - Neural network for single-image depth:

```python
import torch

def estimate_monocular_depth(image_path):
    """
    Estimate depth from single image using MiDaS.

    Returns:
        depth: Relative depth map (HxW)
    """
    # Load MiDaS model
    model_type = "DPT_Large"  # or "MiDaS_small"
    midas = torch.hub.load("intel-isl/MiDaS", model_type)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    midas.to(device)
    midas.eval()

    # Load transforms
    midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
    transform = midas_transforms.dpt_transform

    # Load image
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Transform and batch
    input_batch = transform(img).to(device)

    # Predict
    with torch.no_grad():
        prediction = midas(input_batch)
        prediction = torch.nn.functional.interpolate(
            prediction.unsqueeze(1),
            size=img.shape[:2],
            mode="bicubic",
            align_corners=False,
        ).squeeze()

    depth = prediction.cpu().numpy()

    return depth
```

---

## Visual Servoing

**Visual servoing** uses visual feedback to control robot motion.

### Image-Based Visual Servoing (IBVS)

**Control law**:

$$
\mathbf{v}_c = -\lambda \mathbf{L}_s^+ (\mathbf{s} - \mathbf{s}^*)
$$

Where:
- $\mathbf{v}_c$: Camera velocity (twist)
- $\lambda$: Gain
- $\mathbf{L}_s$: **Image Jacobian** (relates image feature motion to camera velocity)
- $\mathbf{s}$: Current image features
- $\mathbf{s}^*$: Desired image features

**Image Jacobian** for a point $(x, y)$ with depth $Z$:

$$
\mathbf{L}_s = \begin{bmatrix}
-1/Z & 0 & x/Z & xy & -(1+x^2) & y \\
0 & -1/Z & y/Z & 1+y^2 & -xy & -x
\end{bmatrix}
$$

```python
def image_jacobian(u, v, Z, fx, fy):
    """
    Compute image Jacobian for a point feature.

    Args:
        u, v: Pixel coordinates
        Z: Depth (meters)
        fx, fy: Focal lengths

    Returns:
        L: 2x6 image Jacobian
    """
    # Normalized coordinates
    x = (u - cx) / fx
    y = (v - cy) / fy

    L = np.array([
        [-1/Z, 0, x/Z, x*y, -(1 + x**2), y],
        [0, -1/Z, y/Z, 1 + y**2, -x*y, -x]
    ])

    return L

def ibvs_control(current_features, desired_features, depths, camera_params, gain=0.5):
    """
    Compute camera velocity for image-based visual servoing.

    Args:
        current_features: Nx2 current pixel coordinates
        desired_features: Nx2 desired pixel coordinates
        depths: N depth values
        camera_params: Dict with fx, fy, cx, cy
        gain: Control gain

    Returns:
        v_c: 6x1 camera velocity [vx, vy, vz, wx, wy, wz]
    """
    # Stack image Jacobians
    L_s = []
    for i in range(len(current_features)):
        u, v = current_features[i]
        Z = depths[i]
        L = image_jacobian(u, v, Z, camera_params['fx'], camera_params['fy'])
        L_s.append(L)

    L_s = np.vstack(L_s)  # 2Nx6

    # Feature error
    error = (current_features - desired_features).flatten()  # 2N

    # Compute velocity (Moore-Penrose pseudoinverse)
    L_s_pinv = np.linalg.pinv(L_s)
    v_c = -gain * L_s_pinv @ error

    return v_c
```

---

## Case Study: Robotic Bin Picking

**Task**: Detect and grasp objects from cluttered bin.

**Vision pipeline**:
1. **RGB-D capture**: Depth camera (RealSense)
2. **Object detection**: YOLO for instance segmentation
3. **Pose estimation**: PnP (Perspective-n-Point) from keypoints
4. **Grasp planning**: Compute 6D grasp pose
5. **Visual servoing**: Guide gripper to target

```python
class BinPickingSystem:
    def __init__(self, camera, detector, robot):
        self.camera = camera
        self.detector = detector
        self.robot = robot

    def capture_scene(self):
        """Capture RGB-D image."""
        rgb_image = self.camera.get_color_frame()
        depth_image = self.camera.get_depth_frame()
        return rgb_image, depth_image

    def detect_objects(self, rgb_image):
        """Detect objects with YOLO."""
        detections = self.detector(rgb_image)
        return detections

    def estimate_pose(self, rgb_image, depth_image, bbox):
        """
        Estimate 6D pose of object.

        Returns:
            T: 4x4 transformation matrix (camera frame)
        """
        # Extract region of interest
        x1, y1, x2, y2 = bbox
        roi_rgb = rgb_image[y1:y2, x1:x2]
        roi_depth = depth_image[y1:y2, x1:x2]

        # Compute centroid
        valid_depth = roi_depth > 0
        if not np.any(valid_depth):
            return None

        center_u = (x1 + x2) // 2
        center_v = (y1 + y2) // 2
        center_depth = np.median(roi_depth[valid_depth])

        # Backproject to 3D
        X_cam = self.camera.backproject(
            np.array([[center_u, center_v]]),
            np.array([center_depth])
        )[0]

        # Assume upright orientation (for simplicity)
        R = np.eye(3)
        t = X_cam

        T = np.eye(4)
        T[:3, :3] = R
        T[:3, 3] = t

        return T

    def pick_object(self, T_object_cam):
        """
        Execute pick using visual servoing.

        Args:
            T_object_cam: Object pose in camera frame
        """
        # Transform to robot base frame
        T_cam_base = self.robot.get_camera_transform()
        T_object_base = T_cam_base @ T_object_cam

        # Pregrasp pose (10cm above object)
        T_pregrasp = T_object_base.copy()
        T_pregrasp[2, 3] += 0.1

        # Move to pregrasp
        self.robot.move_to_pose(T_pregrasp)

        # Visual servoing to final grasp
        while True:
            rgb, depth = self.capture_scene()
            detections = self.detect_objects(rgb)

            if len(detections) == 0:
                break

            # Compute visual servoing command
            current_features = self.extract_features(rgb, detections[0])
            desired_features = self.compute_desired_features()
            v_c = ibvs_control(current_features, desired_features, depth, self.camera.params)

            # Send velocity command
            self.robot.set_cartesian_velocity(v_c)

            # Check convergence
            if np.linalg.norm(current_features - desired_features) < 5:  # 5 pixels
                break

        # Close gripper
        self.robot.close_gripper()

        # Lift
        self.robot.move_relative([0, 0, 0.2])
```

---

## Summary

**Key Takeaways**:

1. **Camera models**: Pinhole projection, intrinsics/extrinsics, lens distortion
2. **Classical features**: Harris corners, SIFT (scale-invariant), ORB (fast)
3. **CNNs**: Convolution → pooling → ReLU → fully connected
4. **Residual networks**: Skip connections enable deeper models
5. **Object detection**: YOLO (single-stage, fast), Faster R-CNN (two-stage, accurate)
6. **Depth estimation**: Stereo (geometric), monocular (learning-based)
7. **Visual servoing**: IBVS (image-based) using image Jacobian

**Practical Guidelines**:
- Use ORB for real-time feature matching (SIFT for accuracy)
- Use YOLO for real-time detection, Faster R-CNN for precision
- Prefer RGB-D cameras (RealSense) for robotics
- Visual servoing requires good depth estimates and feature tracking

---

## Exercises

1. **Camera Calibration**: Capture 10 images of a checkerboard pattern. Use `cv2.calibrateCamera()` to compute intrinsics and distortion. Test undistortion.

2. **Feature Matching**: Implement SIFT matching between two views of an object. Use RANSAC to filter outliers. Visualize matches with `cv2.drawMatches()`.

3. **Train CNN**: Train a simple CNN on CIFAR-10. Achieve >80% test accuracy. Visualize learned filters in first conv layer.

4. **Object Detection**: Fine-tune YOLOv8 on a custom dataset (e.g., robotic grasping objects). Evaluate with mAP metric.

5. **Stereo Depth**: Implement stereo depth estimation. Compute depth error against ground truth (RealSense depth). Tune SGBM parameters.

6. **Visual Servoing**: Simulate IBVS in Python. Control a virtual camera to center a point feature in the image. Plot error vs time.

---

## Further Reading

- **Books**:
  - Hartley, R., Zisserman, A. *Multiple View Geometry in Computer Vision* (2004)
  - Szeliski, R. *Computer Vision: Algorithms and Applications* (2022)
  - Goodfellow, I., et al. *Deep Learning* (2016)

- **Papers**:
  - Redmon, J., et al. "You Only Look Once: Unified, Real-Time Object Detection" (2016)
  - He, K., et al. "Deep Residual Learning for Image Recognition" (2016)
  - Ranftl, R., et al. "Towards Robust Monocular Depth Estimation" (MiDaS, 2020)
  - Chaumette, F., Hutchinson, S. "Visual Servo Control" (2006)

- **Software**:
  - **OpenCV**: Classical computer vision
  - **PyTorch/TensorFlow**: Deep learning frameworks
  - **Ultralytics**: YOLOv8 implementation
  - **ViSP**: Visual servoing library
  - **Intel RealSense SDK**: RGB-D camera interface
