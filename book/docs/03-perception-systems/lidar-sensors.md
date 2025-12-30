---
sidebar_position: 2
title: LiDAR and 3D Sensors
---

# LiDAR and 3D Sensors

## Introduction

**LiDAR** (Light Detection and Ranging) sensors measure distances by emitting laser pulses and measuring time-of-flight, producing **3D point clouds** that represent environment geometry. Unlike cameras, LiDAR provides:

- **Direct 3D measurements**: No depth ambiguity
- **Long range**: 100+ meters for automotive LiDAR
- **Illumination invariance**: Works in darkness
- **High precision**: Millimeter-level accuracy

Applications in physical AI:
- **Autonomous vehicles**: Obstacle detection and mapping
- **Mobile robots**: Navigation and collision avoidance
- **Manipulation**: Object localization and grasping
- **3D reconstruction**: Building digital twins

This chapter covers LiDAR principles, point cloud processing, registration (ICP), segmentation, object detection, and integration with other sensors.

**Learning Objectives:**
- Understand LiDAR sensing principles and characteristics
- Process and filter point clouds efficiently
- Implement Iterative Closest Point (ICP) for registration
- Segment point clouds into objects
- Detect obstacles and extract features
- Integrate LiDAR with cameras and IMUs

---

## LiDAR Principles

### Time-of-Flight Measurement

**Distance computation**:

$$
d = \frac{c \cdot \Delta t}{2}
$$

Where:
- $d$: Distance to target (meters)
- $c$: Speed of light ($3 \times 10^8$ m/s)
- $\Delta t$: Round-trip time (seconds)

For $\Delta t = 6.67$ ns, distance is 1 meter.

### LiDAR Types

**Mechanical Spinning LiDAR** (e.g., Velodyne):
- 360° horizontal field of view
- Multiple vertical layers (16, 32, 64, 128 beams)
- 10-20 Hz rotation rate
- **Pros**: Dense coverage
- **Cons**: Moving parts, expensive

**Solid-State LiDAR** (e.g., Ouster, Luminar):
- No mechanical rotation (MEMS mirrors or flash)
- Smaller, more reliable
- **Pros**: Compact, lower cost
- **Cons**: Limited FOV

**Wavelength**: Typically 905 nm (near-infrared) or 1550 nm (eye-safe, longer range)

### Point Cloud Representation

A point cloud is a set of 3D points $\mathbf{P} = \{\mathbf{p}_i\}_{i=1}^{N}$ where each point:

$$
\mathbf{p}_i = \begin{bmatrix} x_i \\ y_i \\ z_i \\ I_i \end{bmatrix}
$$

- $(x_i, y_i, z_i)$: Cartesian coordinates (sensor frame)
- $I_i$: Intensity (reflectivity)

**Coordinate conversion** (spherical → Cartesian):

$$
\begin{aligned}
x &= r \cos(\phi) \cos(\theta) \\
y &= r \cos(\phi) \sin(\theta) \\
z &= r \sin(\phi)
\end{aligned}
$$

Where $r$ is range, $\theta$ is azimuth (horizontal), $\phi$ is elevation (vertical).

```python
import numpy as np
import open3d as o3d

class LiDARPointCloud:
    def __init__(self):
        self.points = []
        self.intensities = []

    def from_spherical(self, ranges, azimuths, elevations, intensities):
        """
        Convert spherical measurements to Cartesian point cloud.

        Args:
            ranges: Nx1 distances (meters)
            azimuths: Nx1 horizontal angles (radians)
            elevations: Nx1 vertical angles (radians)
            intensities: Nx1 reflectivity values

        Returns:
            points: Nx3 Cartesian coordinates
        """
        x = ranges * np.cos(elevations) * np.cos(azimuths)
        y = ranges * np.cos(elevations) * np.sin(azimuths)
        z = ranges * np.sin(elevations)

        self.points = np.column_stack([x, y, z])
        self.intensities = intensities

        return self.points

    def to_open3d(self):
        """Convert to Open3D PointCloud object."""
        pcd = o3d.geometry.PointCloud()
        pcd.points = o3d.utility.Vector3dVector(self.points)
        return pcd

    def save(self, filename):
        """Save to PCD format."""
        pcd = self.to_open3d()
        o3d.io.write_point_cloud(filename, pcd)

# Example: Simulate Velodyne VLP-16 scan
def simulate_lidar_scan(num_beams=16, num_points_per_beam=1800):
    """
    Simulate a LiDAR scan.

    Returns:
        ranges, azimuths, elevations: Spherical coordinates
    """
    # Velodyne VLP-16: -15° to +15° vertical FOV
    elevations = np.linspace(-15, 15, num_beams) * np.pi / 180

    # 360° horizontal FOV
    azimuths = np.linspace(0, 2*np.pi, num_points_per_beam)

    # Create full scan (meshgrid)
    azimuth_grid, elevation_grid = np.meshgrid(azimuths, elevations)

    # Simulate ranges (random environment)
    ranges = 5 + 10 * np.random.rand(*azimuth_grid.shape)

    # Flatten
    ranges = ranges.flatten()
    azimuths_flat = azimuth_grid.flatten()
    elevations_flat = elevation_grid.flatten()
    intensities = np.random.rand(len(ranges)) * 255

    return ranges, azimuths_flat, elevations_flat, intensities
```

---

## Point Cloud Processing

### Filtering

**1. Statistical Outlier Removal**

Remove points with low neighbor density (sensor noise).

```python
def statistical_outlier_removal(pcd, nb_neighbors=20, std_ratio=2.0):
    """
    Remove statistical outliers.

    Args:
        pcd: Open3D PointCloud
        nb_neighbors: Number of neighbors for statistics
        std_ratio: Standard deviation threshold

    Returns:
        filtered_pcd: Cleaned point cloud
    """
    cl, ind = pcd.remove_statistical_outlier(nb_neighbors, std_ratio)
    filtered_pcd = pcd.select_by_index(ind)
    return filtered_pcd
```

**2. Voxel Downsampling**

Reduce point density by averaging points in voxel grid.

$$
\mathbf{p}_{voxel} = \frac{1}{|S|} \sum_{\mathbf{p}_i \in S} \mathbf{p}_i
$$

Where $S$ is the set of points in a voxel.

```python
def voxel_downsample(pcd, voxel_size=0.05):
    """
    Downsample point cloud using voxel grid.

    Args:
        pcd: Open3D PointCloud
        voxel_size: Voxel size (meters)

    Returns:
        downsampled_pcd: Reduced point cloud
    """
    downsampled_pcd = pcd.voxel_down_sample(voxel_size)
    return downsampled_pcd
```

**3. Radius Outlier Removal**

Remove isolated points (fewer than $k$ neighbors within radius $r$).

```python
def radius_outlier_removal(pcd, nb_points=16, radius=0.1):
    """
    Remove radius-based outliers.

    Args:
        pcd: Open3D PointCloud
        nb_points: Minimum neighbors
        radius: Search radius (meters)

    Returns:
        filtered_pcd: Cleaned point cloud
    """
    cl, ind = pcd.remove_radius_outlier(nb_points, radius)
    filtered_pcd = pcd.select_by_index(ind)
    return filtered_pcd
```

### Normal Estimation

**Surface normal** at point $\mathbf{p}_i$:

$$
\mathbf{n}_i = \text{eigenvector of smallest eigenvalue of } \mathbf{C}
$$

Where $\mathbf{C}$ is the covariance matrix of $k$-nearest neighbors:

$$
\mathbf{C} = \frac{1}{k} \sum_{j=1}^{k} (\mathbf{p}_j - \bar{\mathbf{p}})(\mathbf{p}_j - \bar{\mathbf{p}})^T
$$

```python
def estimate_normals(pcd, radius=0.1, max_nn=30):
    """
    Estimate surface normals using PCA.

    Args:
        pcd: Open3D PointCloud
        radius: Search radius for neighbors
        max_nn: Maximum neighbors to consider

    Returns:
        pcd: PointCloud with normals
    """
    pcd.estimate_normals(
        search_param=o3d.geometry.KDTreeSearchParamHybrid(radius, max_nn)
    )

    # Orient normals consistently (toward viewpoint)
    pcd.orient_normals_consistent_tangent_plane(k=15)

    return pcd
```

---

## Point Cloud Registration

### Iterative Closest Point (ICP)

**Goal**: Find transformation $\mathbf{T}$ that aligns source point cloud $\mathbf{P}$ to target $\mathbf{Q}$.

**Algorithm**:
1. **Match**: Find closest points (correspondences)
2. **Minimize**: Solve for optimal transformation
3. **Transform**: Apply transformation
4. **Iterate**: Until convergence

**Objective function**:

$$
\mathbf{T}^* = \arg\min_{\mathbf{T}} \sum_{i=1}^{N} \|\mathbf{T} \mathbf{p}_i - \mathbf{q}_i\|^2
$$

**Closed-form solution** (Point-to-Point ICP):

1. Compute centroids:
   $$
   \bar{\mathbf{p}} = \frac{1}{N} \sum_i \mathbf{p}_i, \quad \bar{\mathbf{q}} = \frac{1}{N} \sum_i \mathbf{q}_i
   $$

2. Center point clouds:
   $$
   \mathbf{p}_i' = \mathbf{p}_i - \bar{\mathbf{p}}, \quad \mathbf{q}_i' = \mathbf{q}_i - \bar{\mathbf{q}}
   $$

3. Compute cross-covariance:
   $$
   \mathbf{H} = \sum_i \mathbf{p}_i' \mathbf{q}_i'^T
   $$

4. SVD decomposition:
   $$
   \mathbf{H} = \mathbf{U} \boldsymbol{\Sigma} \mathbf{V}^T
   $$

5. Rotation and translation:
   $$
   \mathbf{R} = \mathbf{V} \mathbf{U}^T, \quad \mathbf{t} = \bar{\mathbf{q}} - \mathbf{R} \bar{\mathbf{p}}
   $$

```python
def icp_registration(source_pcd, target_pcd, threshold=0.02, max_iterations=50):
    """
    Register source to target using ICP.

    Args:
        source_pcd: Source Open3D PointCloud
        target_pcd: Target Open3D PointCloud
        threshold: Distance threshold for correspondences
        max_iterations: Maximum iterations

    Returns:
        T: 4x4 transformation matrix
        fitness: Fraction of inlier correspondences
    """
    # Initial alignment (identity)
    T_init = np.eye(4)

    # Point-to-Point ICP
    reg_p2p = o3d.pipelines.registration.registration_icp(
        source_pcd, target_pcd, threshold, T_init,
        o3d.pipelines.registration.TransformationEstimationPointToPoint(),
        o3d.pipelines.registration.ICPConvergenceCriteria(max_iteration=max_iterations)
    )

    return reg_p2p.transformation, reg_p2p.fitness

# Point-to-Plane ICP (more robust)
def icp_point_to_plane(source_pcd, target_pcd, threshold=0.02):
    """
    Point-to-Plane ICP (uses normal information).

    More robust than Point-to-Point ICP.
    """
    # Estimate normals
    source_pcd = estimate_normals(source_pcd, radius=0.1)
    target_pcd = estimate_normals(target_pcd, radius=0.1)

    T_init = np.eye(4)

    reg_p2l = o3d.pipelines.registration.registration_icp(
        source_pcd, target_pcd, threshold, T_init,
        o3d.pipelines.registration.TransformationEstimationPointToPlane()
    )

    return reg_p2l.transformation, reg_p2l.fitness
```

### Generalized ICP (GICP)

Combines **point-to-point** and **point-to-plane** by modeling local surface uncertainty.

```python
def gicp_registration(source_pcd, target_pcd, threshold=0.02):
    """
    Generalized ICP registration.

    Accounts for local surface structure (more accurate).
    """
    T_init = np.eye(4)

    reg_gicp = o3d.pipelines.registration.registration_generalized_icp(
        source_pcd, target_pcd, threshold, T_init,
        o3d.pipelines.registration.TransformationEstimationForGeneralizedICP()
    )

    return reg_gicp.transformation, reg_gicp.fitness
```

---

## Segmentation

### Ground Plane Removal

**RANSAC Plane Fitting**:

1. Randomly sample 3 points
2. Fit plane: $ax + by + cz + d = 0$
3. Count inliers (points within distance threshold)
4. Repeat and keep best plane

```python
def remove_ground_plane(pcd, distance_threshold=0.02, ransac_n=3, num_iterations=1000):
    """
    Remove ground plane using RANSAC.

    Args:
        pcd: Open3D PointCloud
        distance_threshold: Inlier threshold (meters)
        ransac_n: Number of points to sample
        num_iterations: RANSAC iterations

    Returns:
        non_ground_pcd: Point cloud without ground
        plane_model: [a, b, c, d] plane coefficients
    """
    plane_model, inliers = pcd.segment_plane(
        distance_threshold, ransac_n, num_iterations
    )

    # Extract non-ground points
    non_ground_pcd = pcd.select_by_index(inliers, invert=True)

    return non_ground_pcd, plane_model
```

### Euclidean Clustering

**DBSCAN** (Density-Based Spatial Clustering):

- **Core point**: Has at least `min_points` neighbors within `eps` radius
- **Clusters**: Connected core points

```python
def euclidean_clustering(pcd, eps=0.1, min_points=10):
    """
    Cluster point cloud using DBSCAN.

    Args:
        pcd: Open3D PointCloud
        eps: Neighborhood radius (meters)
        min_points: Minimum points per cluster

    Returns:
        labels: Cluster labels for each point (-1 = noise)
    """
    labels = np.array(pcd.cluster_dbscan(eps, min_points, print_progress=False))

    # Number of clusters (excluding noise)
    num_clusters = labels.max() + 1

    print(f"Found {num_clusters} clusters")

    return labels

def extract_clusters(pcd, labels):
    """
    Extract individual clusters as separate point clouds.

    Returns:
        clusters: List of Open3D PointClouds
    """
    max_label = labels.max()
    clusters = []

    for i in range(max_label + 1):
        cluster_indices = np.where(labels == i)[0]
        cluster_pcd = pcd.select_by_index(cluster_indices)
        clusters.append(cluster_pcd)

    return clusters
```

### Object Detection from Point Clouds

**3D Bounding Box Fitting**:

```python
def fit_oriented_bounding_box(pcd):
    """
    Fit oriented bounding box to point cloud.

    Returns:
        obb: Open3D OrientedBoundingBox
    """
    obb = pcd.get_oriented_bounding_box()
    obb.color = (1, 0, 0)  # Red
    return obb

def detect_objects(pcd, ground_threshold=0.02, cluster_eps=0.15, min_cluster_points=20):
    """
    Complete object detection pipeline.

    Returns:
        objects: List of dicts with 'pcd', 'bbox', 'centroid'
    """
    # 1. Remove ground
    pcd_no_ground, _ = remove_ground_plane(pcd, ground_threshold)

    # 2. Cluster
    labels = euclidean_clustering(pcd_no_ground, cluster_eps, min_cluster_points)

    # 3. Extract objects
    clusters = extract_clusters(pcd_no_ground, labels)

    objects = []
    for cluster in clusters:
        # Compute bounding box
        bbox = fit_oriented_bounding_box(cluster)

        # Compute centroid
        centroid = np.asarray(cluster.points).mean(axis=0)

        objects.append({
            'pcd': cluster,
            'bbox': bbox,
            'centroid': centroid,
            'num_points': len(cluster.points)
        })

    return objects
```

---

## Feature Extraction

### Fast Point Feature Histograms (FPFH)

**FPFH** descriptor encodes local geometry:

```python
def compute_fpfh_features(pcd, radius=0.1):
    """
    Compute Fast Point Feature Histogram descriptors.

    Args:
        pcd: Open3D PointCloud with normals
        radius: Feature radius (meters)

    Returns:
        fpfh: Open3D Feature object (Nx33 descriptors)
    """
    # Ensure normals are estimated
    if not pcd.has_normals():
        pcd = estimate_normals(pcd, radius)

    fpfh = o3d.pipelines.registration.compute_fpfh_feature(
        pcd,
        o3d.geometry.KDTreeSearchParamHybrid(radius, max_nn=100)
    )

    return fpfh

def match_fpfh_features(source_fpfh, target_fpfh, distance_threshold=0.9):
    """
    Match FPFH features between two point clouds.

    Returns:
        correspondences: List of (source_idx, target_idx) matches
    """
    # Compute pairwise distances
    source_features = np.asarray(source_fpfh.data).T  # Nx33
    target_features = np.asarray(target_fpfh.data).T

    distances = np.linalg.norm(
        source_features[:, np.newaxis] - target_features[np.newaxis, :],
        axis=2
    )

    # Nearest neighbor matching
    correspondences = []
    for i in range(len(source_features)):
        j = distances[i].argmin()
        if distances[i, j] < distance_threshold:
            correspondences.append((i, j))

    return correspondences
```

---

## LiDAR-Camera Fusion

### Extrinsic Calibration

Find transformation $\mathbf{T}_{lidar}^{camera}$ between LiDAR and camera.

**Checkerboard-based calibration**:

1. Capture synchronized LiDAR + camera data
2. Detect checkerboard corners in image
3. Extract checkerboard plane from point cloud
4. Solve PnP problem for transformation

```python
def project_lidar_to_image(points_lidar, T_lidar_to_cam, K):
    """
    Project LiDAR points onto camera image.

    Args:
        points_lidar: Nx3 points in LiDAR frame
        T_lidar_to_cam: 4x4 transformation matrix
        K: 3x3 camera intrinsic matrix

    Returns:
        uv: Nx2 pixel coordinates
        depths: Nx1 depths (for filtering)
    """
    # Transform to camera frame
    points_hom = np.column_stack([points_lidar, np.ones(len(points_lidar))])
    points_cam_hom = (T_lidar_to_cam @ points_hom.T).T
    points_cam = points_cam_hom[:, :3]

    # Filter points behind camera
    valid = points_cam[:, 2] > 0

    # Project to image
    uv_hom = (K @ points_cam[valid].T).T
    uv = uv_hom[:, :2] / uv_hom[:, 2:]

    depths = points_cam[valid, 2]

    return uv, depths, valid

def colorize_point_cloud(pcd, image, T_lidar_to_cam, K):
    """
    Add RGB color to point cloud from camera image.

    Returns:
        colored_pcd: Point cloud with colors
    """
    points = np.asarray(pcd.points)

    # Project to image
    uv, depths, valid = project_lidar_to_image(points, T_lidar_to_cam, K)

    # Filter points within image bounds
    h, w = image.shape[:2]
    in_image = (uv[:, 0] >= 0) & (uv[:, 0] < w) & (uv[:, 1] >= 0) & (uv[:, 1] < h)

    # Extract colors
    colors = np.zeros((len(points), 3))
    uv_valid = uv[in_image].astype(int)
    colors_valid = image[uv_valid[:, 1], uv_valid[:, 0]] / 255.0  # Normalize to [0, 1]

    # Assign colors
    valid_indices = np.where(valid)[0][in_image]
    colors[valid_indices] = colors_valid

    # Create colored point cloud
    colored_pcd = o3d.geometry.PointCloud()
    colored_pcd.points = o3d.utility.Vector3dVector(points)
    colored_pcd.colors = o3d.utility.Vector3dVector(colors)

    return colored_pcd
```

---

## Case Study: Autonomous Vehicle Perception

**Task**: Detect and track vehicles and pedestrians.

**LiDAR pipeline**:
1. **Preprocess**: Voxel downsample + outlier removal
2. **Ground removal**: RANSAC plane fitting
3. **Clustering**: DBSCAN to segment objects
4. **Classification**: CNN on point cloud clusters (PointNet)
5. **Tracking**: Kalman filter for temporal consistency

```python
class AutonomousVehiclePerception:
    def __init__(self, lidar_model, camera_model, T_lidar_to_cam):
        self.lidar_model = lidar_model
        self.camera_model = camera_model
        self.T_lidar_to_cam = T_lidar_to_cam
        self.tracked_objects = []

    def process_frame(self, pcd, image):
        """
        Process single LiDAR + camera frame.

        Returns:
            detections: List of detected objects with 3D bounding boxes
        """
        # 1. Preprocess point cloud
        pcd = voxel_downsample(pcd, voxel_size=0.1)
        pcd = statistical_outlier_removal(pcd)

        # 2. Remove ground
        pcd_no_ground, _ = remove_ground_plane(pcd, distance_threshold=0.1)

        # 3. Detect objects
        objects = detect_objects(pcd_no_ground, cluster_eps=0.5, min_cluster_points=50)

        # 4. Classify objects (simplified)
        detections = []
        for obj in objects:
            # Filter by size (vehicles are larger than pedestrians)
            bbox_extent = obj['bbox'].extent
            volume = np.prod(bbox_extent)

            if volume > 2.0:  # Large object
                obj_class = 'vehicle'
            elif volume > 0.2:  # Medium object
                obj_class = 'pedestrian'
            else:
                obj_class = 'unknown'

            detections.append({
                'class': obj_class,
                'bbox_3d': obj['bbox'],
                'centroid': obj['centroid'],
                'confidence': 0.9  # Placeholder
            })

        # 5. Track objects
        self.update_tracking(detections)

        return detections

    def update_tracking(self, detections):
        """
        Update tracked objects using simple nearest-neighbor association.

        In practice, use Kalman filter or particle filter for smoothing.
        """
        # TODO: Implement Kalman filter tracking
        pass

    def visualize(self, pcd, detections):
        """
        Visualize point cloud with 3D bounding boxes.
        """
        vis_objects = [pcd]

        for det in detections:
            vis_objects.append(det['bbox_3d'])

        o3d.visualization.draw_geometries(vis_objects)
```

---

## Summary

**Key Takeaways**:

1. **LiDAR principles**: Time-of-flight, spherical to Cartesian conversion
2. **Point cloud filtering**: Statistical outliers, voxel downsampling, radius filtering
3. **Normal estimation**: PCA on local neighborhoods
4. **ICP registration**: Point-to-point, point-to-plane, generalized ICP
5. **Segmentation**: RANSAC ground removal, DBSCAN clustering
6. **Object detection**: Bounding box fitting, feature extraction (FPFH)
7. **LiDAR-camera fusion**: Extrinsic calibration, point cloud colorization

**Practical Guidelines**:
- Use voxel downsampling (0.05-0.1m) for real-time processing
- Point-to-plane ICP is more robust than point-to-point
- DBSCAN works well for outdoor scenes with varying density
- Fuse LiDAR with camera for semantic understanding

---

## Exercises

1. **Point Cloud I/O**: Load a LiDAR scan (PCD format). Visualize with Open3D. Apply voxel downsampling at different resolutions (0.05m, 0.1m, 0.2m). Compare point counts and visual quality.

2. **ICP Registration**: Capture two overlapping point clouds. Implement ICP from scratch (correspondence + SVD). Compare with Open3D's ICP. Measure registration error.

3. **Ground Removal**: Implement RANSAC plane fitting. Test on urban street scene. Tune distance threshold for different terrains (flat road vs rough terrain).

4. **Object Clustering**: Apply DBSCAN to segment objects. Tune `eps` and `min_points` for different scenarios (highway vs parking lot). Count detected objects.

5. **LiDAR-Camera Fusion**: Given calibrated LiDAR-camera pair, project LiDAR points onto image. Colorize point cloud using RGB values. Verify alignment.

6. **Feature Matching**: Compute FPFH for two point clouds. Match features and visualize correspondences. Use RANSAC to filter outliers.

---

## Further Reading

- **Books**:
  - Pomerleau, F., Colas, F., Siegwart, R. "A Review of Point Cloud Registration Algorithms for Mobile Robotics" (2015)
  - Rusu, R.B., Cousins, S. "3D is here: Point Cloud Library (PCL)" (2011)

- **Papers**:
  - Besl, P.J., McKay, N.D. "A Method for Registration of 3-D Shapes" (ICP, 1992)
  - Segal, A., et al. "Generalized-ICP" (2009)
  - Rusu, R.B., et al. "Fast Point Feature Histograms for 3D Registration" (2009)

- **Software**:
  - **Open3D**: Modern point cloud processing library
  - **PCL**: Point Cloud Library (C++)
  - **LiDAR drivers**: Velodyne, Ouster, Livox ROS packages
  - **CloudCompare**: GUI for point cloud visualization
