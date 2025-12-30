---
sidebar_position: 4
title: SLAM (Simultaneous Localization and Mapping)
---

# SLAM (Simultaneous Localization and Mapping)

## Introduction

**SLAM** (Simultaneous Localization and Mapping) is the problem of building a map of an unknown environment while simultaneously localizing the robot within that map. This is a **chicken-and-egg problem**:

- **Localization** requires a map
- **Mapping** requires knowing the robot's pose

SLAM is fundamental for autonomous systems:
- **Mobile robots**: Navigate without pre-built maps
- **Autonomous vehicles**: Understand dynamic environments
- **AR/VR**: Track devices in 3D space
- **Drones**: Explore GPS-denied environments

This chapter covers SLAM formulations, EKF-SLAM, FastSLAM (particle-based), graph-based SLAM, visual SLAM (ORB-SLAM), LiDAR SLAM, and loop closure detection.

**Learning Objectives:**
- Understand SLAM as a probabilistic inference problem
- Implement EKF-SLAM for landmark-based mapping
- Apply FastSLAM with Rao-Blackwellization
- Design graph-based SLAM with pose graph optimization
- Implement visual SLAM with ORB features
- Perform loop closure detection for consistency

---

## SLAM Problem Formulation

### Probabilistic Formulation

**Goal**: Estimate robot trajectory and map from measurements.

$$
p(\mathbf{x}_{0:T}, \mathbf{m} | \mathbf{z}_{1:T}, \mathbf{u}_{0:T-1})
$$

Where:
- $\mathbf{x}_{0:T}$: Robot poses over time
- $\mathbf{m}$: Map (landmarks or occupancy grid)
- $\mathbf{z}_{1:T}$: Sensor measurements (range, bearing, images)
- $\mathbf{u}_{0:T-1}$: Control inputs (odometry)

**Two approaches**:
1. **Online SLAM** (filtering): Estimate current pose + map
   $$
   p(\mathbf{x}_t, \mathbf{m} | \mathbf{z}_{1:t}, \mathbf{u}_{0:t-1})
   $$

2. **Full SLAM** (smoothing): Estimate entire trajectory + map
   $$
   p(\mathbf{x}_{0:T}, \mathbf{m} | \mathbf{z}_{1:T}, \mathbf{u}_{0:T-1})
   $$

### Landmark-Based SLAM

**Map representation**: Set of point landmarks $\mathbf{m} = \{\mathbf{m}_1, \ldots, \mathbf{m}_N\}$.

**Measurement model** (range-bearing to landmark $i$):

$$
\mathbf{z}_t^i = \begin{bmatrix} r_t^i \\ \phi_t^i \end{bmatrix} = \begin{bmatrix}
\sqrt{(m_{ix} - x_t)^2 + (m_{iy} - y_t)^2} \\
\text{atan2}(m_{iy} - y_t, m_{ix} - x_t) - \theta_t
\end{bmatrix} + \mathbf{v}_t^i
$$

Where $(x_t, y_t, \theta_t)$ is robot pose and $(m_{ix}, m_{iy})$ is landmark position.

---

## EKF-SLAM

**Extended Kalman Filter SLAM**: Estimate robot pose and landmark positions jointly.

**State vector**:

$$
\mathbf{x} = \begin{bmatrix} \mathbf{x}_r \\ \mathbf{m}_1 \\ \vdots \\ \mathbf{m}_N \end{bmatrix}, \quad
\mathbf{x}_r = \begin{bmatrix} x \\ y \\ \theta \end{bmatrix}
$$

**Covariance**: $(3 + 2N) \times (3 + 2N)$ matrix (robot + all landmarks).

**Key insight**: Observing landmarks **correlates** their positions → covariance becomes **fully populated**.

```python
import numpy as np

class EKFSLAM:
    def __init__(self, x0, P0, Q, R):
        """
        EKF-SLAM for 2D robot with point landmarks.

        Args:
            x0: Initial robot state [x, y, theta]
            P0: Initial robot covariance (3x3)
            Q: Process noise (3x3)
            R: Measurement noise (2x2 for range-bearing)
        """
        self.x_robot = x0
        self.landmarks = []  # List of landmark positions
        self.P = P0  # Will grow as landmarks are added
        self.Q = Q
        self.R = R

    def predict(self, u, dt):
        """
        Prediction step (dead reckoning).

        Args:
            u: Control input [v, omega] (velocity, angular velocity)
            dt: Time step
        """
        v, omega = u
        x, y, theta = self.x_robot

        # Motion model
        self.x_robot[0] += v * np.cos(theta) * dt
        self.x_robot[1] += v * np.sin(theta) * dt
        self.x_robot[2] += omega * dt

        # Jacobian of motion model w.r.t. robot state
        G_x = np.array([
            [1, 0, -v * np.sin(theta) * dt],
            [0, 1,  v * np.cos(theta) * dt],
            [0, 0,  1]
        ])

        # Update covariance (robot part)
        n = 3 + 2 * len(self.landmarks)
        F = np.eye(n)
        F[0:3, 0:3] = G_x

        self.P = F @ self.P @ F.T
        self.P[0:3, 0:3] += self.Q

    def update(self, z, landmark_id):
        """
        Update step with range-bearing measurement.

        Args:
            z: Measurement [range, bearing]
            landmark_id: Landmark index (or None for new landmark)
        """
        r_meas, phi_meas = z

        if landmark_id is None:
            # Initialize new landmark
            self.add_landmark(z)
        else:
            # Update existing landmark
            self.update_landmark(z, landmark_id)

    def add_landmark(self, z):
        """Initialize new landmark from measurement."""
        r, phi = z
        x_r, y_r, theta_r = self.x_robot

        # Compute landmark position in world frame
        m_x = x_r + r * np.cos(phi + theta_r)
        m_y = y_r + r * np.sin(phi + theta_r)

        # Add to state
        self.landmarks.append(np.array([m_x, m_y]))

        # Expand covariance matrix
        n_old = 3 + 2 * (len(self.landmarks) - 1)
        n_new = n_old + 2

        P_new = np.zeros((n_new, n_new))
        P_new[:n_old, :n_old] = self.P

        # Initialize landmark covariance (high uncertainty)
        P_new[n_old:, n_old:] = np.eye(2) * 100

        self.P = P_new

    def update_landmark(self, z, landmark_id):
        """Update robot and landmark with measurement."""
        r_meas, phi_meas = z
        x_r, y_r, theta_r = self.x_robot
        m_x, m_y = self.landmarks[landmark_id]

        # Predicted measurement
        delta_x = m_x - x_r
        delta_y = m_y - y_r
        q = delta_x**2 + delta_y**2
        r_pred = np.sqrt(q)
        phi_pred = np.arctan2(delta_y, delta_x) - theta_r

        # Innovation
        y = np.array([r_meas - r_pred, phi_meas - phi_pred])

        # Normalize angle
        y[1] = np.arctan2(np.sin(y[1]), np.cos(y[1]))

        # Measurement Jacobian
        H = self.compute_measurement_jacobian(landmark_id)

        # Innovation covariance
        S = H @ self.P @ H.T + self.R

        # Kalman gain
        K = self.P @ H.T @ np.linalg.inv(S)

        # Update state
        delta = K @ y
        self.x_robot += delta[0:3]
        for i, lm in enumerate(self.landmarks):
            self.landmarks[i] += delta[3 + 2*i:3 + 2*i + 2]

        # Update covariance
        n = 3 + 2 * len(self.landmarks)
        self.P = (np.eye(n) - K @ H) @ self.P

    def compute_measurement_jacobian(self, landmark_id):
        """Compute Jacobian of measurement model."""
        x_r, y_r, theta_r = self.x_robot
        m_x, m_y = self.landmarks[landmark_id]

        delta_x = m_x - x_r
        delta_y = m_y - y_r
        q = delta_x**2 + delta_y**2
        sqrt_q = np.sqrt(q)

        # Jacobian w.r.t. robot pose
        H_r = np.array([
            [-delta_x / sqrt_q, -delta_y / sqrt_q, 0],
            [delta_y / q, -delta_x / q, -1]
        ])

        # Jacobian w.r.t. landmark position
        H_m = np.array([
            [delta_x / sqrt_q, delta_y / sqrt_q],
            [-delta_y / q, delta_x / q]
        ])

        # Full Jacobian
        n = 3 + 2 * len(self.landmarks)
        H = np.zeros((2, n))
        H[0:2, 0:3] = H_r
        H[0:2, 3 + 2*landmark_id:3 + 2*landmark_id + 2] = H_m

        return H

    def get_state(self):
        """Return current estimate."""
        return self.x_robot, self.landmarks, self.P
```

---

## FastSLAM

**Idea**: Use **Rao-Blackwellization** to factorize:

$$
p(\mathbf{x}_{0:T}, \mathbf{m} | \mathbf{z}_{1:T}, \mathbf{u}_{0:T-1}) = p(\mathbf{x}_{0:T} | \mathbf{z}_{1:T}, \mathbf{u}_{0:T-1}) \prod_i p(\mathbf{m}_i | \mathbf{x}_{0:T}, \mathbf{z}_{1:T})
$$

**Algorithm**:
1. Use **particle filter** for robot trajectory
2. Use **Kalman filter** for each landmark (per particle)

**Advantage**: $O(M \log N)$ complexity vs $O(N^2)$ for EKF-SLAM.

```python
class FastSLAM:
    def __init__(self, num_particles, Q, R):
        """
        FastSLAM with particle filter + per-particle landmark EKFs.

        Args:
            num_particles: Number of particles
            Q: Process noise
            R: Measurement noise
        """
        self.num_particles = num_particles
        self.Q = Q
        self.R = R

        # Initialize particles
        self.particles = []
        for _ in range(num_particles):
            particle = {
                'pose': np.zeros(3),  # [x, y, theta]
                'weight': 1.0 / num_particles,
                'landmarks': {},  # Dict: landmark_id -> (mean, cov)
            }
            self.particles.append(particle)

    def predict(self, u, dt):
        """Propagate particles with motion model."""
        v, omega = u

        for particle in self.particles:
            x, y, theta = particle['pose']

            # Sample from motion model (add noise)
            v_noisy = v + np.random.randn() * np.sqrt(self.Q[0, 0])
            omega_noisy = omega + np.random.randn() * np.sqrt(self.Q[2, 2])

            # Update pose
            particle['pose'][0] += v_noisy * np.cos(theta) * dt
            particle['pose'][1] += v_noisy * np.sin(theta) * dt
            particle['pose'][2] += omega_noisy * dt

    def update(self, z, landmark_id):
        """Update particles with measurement."""
        for particle in self.particles:
            if landmark_id not in particle['landmarks']:
                # Initialize landmark
                self.initialize_landmark(particle, z, landmark_id)
            else:
                # Update landmark with EKF
                self.update_landmark_ekf(particle, z, landmark_id)

            # Compute measurement likelihood for weight
            particle['weight'] *= self.measurement_likelihood(particle, z, landmark_id)

        # Normalize weights
        total_weight = sum(p['weight'] for p in self.particles)
        for particle in self.particles:
            particle['weight'] /= total_weight

        # Resample if needed
        n_eff = 1.0 / sum(p['weight']**2 for p in self.particles)
        if n_eff < self.num_particles / 2:
            self.resample()

    def initialize_landmark(self, particle, z, landmark_id):
        """Initialize new landmark for particle."""
        r, phi = z
        x, y, theta = particle['pose']

        # Landmark position
        m_x = x + r * np.cos(phi + theta)
        m_y = y + r * np.sin(phi + theta)

        # Initialize with high uncertainty
        mean = np.array([m_x, m_y])
        cov = np.eye(2) * 10.0

        particle['landmarks'][landmark_id] = (mean, cov)

    def update_landmark_ekf(self, particle, z, landmark_id):
        """Update landmark estimate with EKF."""
        mean, cov = particle['landmarks'][landmark_id]
        x, y, theta = particle['pose']

        # Predicted measurement
        delta_x = mean[0] - x
        delta_y = mean[1] - y
        q = delta_x**2 + delta_y**2
        z_pred = np.array([np.sqrt(q), np.arctan2(delta_y, delta_x) - theta])

        # Measurement Jacobian
        H = np.array([
            [delta_x / np.sqrt(q), delta_y / np.sqrt(q)],
            [-delta_y / q, delta_x / q]
        ])

        # EKF update
        y = z - z_pred
        y[1] = np.arctan2(np.sin(y[1]), np.cos(y[1]))  # Normalize angle

        S = H @ cov @ H.T + self.R
        K = cov @ H.T @ np.linalg.inv(S)

        mean += K @ y
        cov = (np.eye(2) - K @ H) @ cov

        particle['landmarks'][landmark_id] = (mean, cov)

    def measurement_likelihood(self, particle, z, landmark_id):
        """Compute likelihood of measurement."""
        if landmark_id not in particle['landmarks']:
            return 1.0

        mean, cov = particle['landmarks'][landmark_id]
        x, y, theta = particle['pose']

        delta_x = mean[0] - x
        delta_y = mean[1] - y
        q = delta_x**2 + delta_y**2
        z_pred = np.array([np.sqrt(q), np.arctan2(delta_y, delta_x) - theta])

        H = np.array([
            [delta_x / np.sqrt(q), delta_y / np.sqrt(q)],
            [-delta_y / q, delta_x / q]
        ])

        innovation = z - z_pred
        innovation[1] = np.arctan2(np.sin(innovation[1]), np.cos(innovation[1]))

        S = H @ cov @ H.T + self.R
        likelihood = np.exp(-0.5 * innovation @ np.linalg.inv(S) @ innovation)

        return likelihood

    def resample(self):
        """Systematic resampling of particles."""
        weights = np.array([p['weight'] for p in self.particles])
        indices = np.random.choice(
            self.num_particles,
            size=self.num_particles,
            p=weights
        )

        # Copy selected particles (deep copy)
        import copy
        new_particles = [copy.deepcopy(self.particles[i]) for i in indices]

        # Reset weights
        for p in new_particles:
            p['weight'] = 1.0 / self.num_particles

        self.particles = new_particles
```

---

## Graph-Based SLAM

**Idea**: Represent SLAM as a **pose graph** where:
- **Nodes**: Robot poses
- **Edges**: Constraints (odometry, loop closures)

**Optimization**: Minimize error over all edges.

$$
\mathbf{x}^* = \arg\min_{\mathbf{x}} \sum_{(i,j) \in \mathcal{E}} \mathbf{e}_{ij}^T \boldsymbol{\Omega}_{ij} \mathbf{e}_{ij}
$$

Where:
- $\mathbf{e}_{ij} = \mathbf{z}_{ij} - h(\mathbf{x}_i, \mathbf{x}_j)$: Edge error
- $\boldsymbol{\Omega}_{ij}$: Information matrix (inverse covariance)

**Solver**: Levenberg-Marquardt or Gauss-Newton.

```python
import g2o

class GraphSLAM:
    def __init__(self):
        """Graph-based SLAM using g2o."""
        self.optimizer = g2o.SparseOptimizer()
        solver = g2o.BlockSolverSE2(g2o.LinearSolverCholmodSE2())
        solver = g2o.OptimizationAlgorithmLevenberg(solver)
        self.optimizer.set_algorithm(solver)

        self.vertex_count = 0

    def add_vertex(self, pose, fixed=False):
        """
        Add pose node to graph.

        Args:
            pose: [x, y, theta]
            fixed: Whether to fix this node (e.g., origin)

        Returns:
            vertex_id: ID of added vertex
        """
        v = g2o.VertexSE2()
        v.set_id(self.vertex_count)
        v.set_estimate(g2o.SE2(pose[0], pose[1], pose[2]))

        if fixed:
            v.set_fixed(True)

        self.optimizer.add_vertex(v)

        vertex_id = self.vertex_count
        self.vertex_count += 1

        return vertex_id

    def add_edge(self, vertex_id1, vertex_id2, measurement, information):
        """
        Add constraint edge between two poses.

        Args:
            vertex_id1, vertex_id2: Vertex IDs
            measurement: Relative pose [dx, dy, dtheta]
            information: 3x3 information matrix
        """
        edge = g2o.EdgeSE2()
        edge.set_vertex(0, self.optimizer.vertex(vertex_id1))
        edge.set_vertex(1, self.optimizer.vertex(vertex_id2))

        edge.set_measurement(g2o.SE2(measurement[0], measurement[1], measurement[2]))
        edge.set_information(information)

        self.optimizer.add_edge(edge)

    def optimize(self, iterations=10):
        """Run graph optimization."""
        self.optimizer.initialize_optimization()
        self.optimizer.optimize(iterations)

    def get_pose(self, vertex_id):
        """Retrieve optimized pose."""
        v = self.optimizer.vertex(vertex_id)
        estimate = v.estimate()
        return np.array([estimate.translation()[0], estimate.translation()[1], estimate.rotation().angle()])
```

---

## Visual SLAM

### ORB-SLAM3

**Pipeline**:
1. **Tracking**: Extract ORB features, match with map
2. **Local mapping**: Triangulate new 3D points
3. **Loop closing**: Detect revisited places, add constraints
4. **Bundle adjustment**: Optimize camera poses + 3D points

```python
# Using ORB-SLAM3 (C++ library with Python bindings)
import orbslam3

class VisualSLAM:
    def __init__(self, vocab_file, settings_file):
        """
        Visual SLAM with ORB-SLAM3.

        Args:
            vocab_file: ORB vocabulary file
            settings_file: Camera calibration YAML
        """
        self.slam = orbslam3.System(
            vocab_file,
            settings_file,
            orbslam3.Sensor.MONOCULAR
        )

    def process_frame(self, image, timestamp):
        """
        Track camera pose from image.

        Returns:
            T_cw: 4x4 camera-to-world transformation
        """
        # Convert image to grayscale if needed
        if len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Track
        T_cw = self.slam.process_image_mono(image, timestamp)

        return T_cw

    def shutdown(self):
        """Save map and shutdown."""
        self.slam.shutdown()
```

---

## Loop Closure Detection

**Problem**: Recognize when robot returns to previously visited location.

**Bag of Words** (DBoW2):
1. Extract visual features (ORB)
2. Quantize to visual words (vocabulary tree)
3. Compute image similarity score

```python
import pyDBoW3 as bow

class LoopClosureDetector:
    def __init__(self, vocab_file):
        """
        Loop closure detection with DBoW3.

        Args:
            vocab_file: Pre-trained vocabulary file
        """
        self.vocab = bow.Vocabulary()
        self.vocab.load(vocab_file)

        self.database = bow.Database()
        self.database.setVocabulary(self.vocab)

        self.frame_descriptors = []

    def add_frame(self, descriptors):
        """
        Add frame to database.

        Args:
            descriptors: ORB descriptors (Nx32)

        Returns:
            loop_candidates: List of (frame_id, score) for loop closures
        """
        # Add to database
        self.database.add(descriptors)
        self.frame_descriptors.append(descriptors)

        # Query for loop closures
        results = self.database.query(descriptors, max_results=5)

        # Filter by score threshold
        loop_candidates = []
        for result in results:
            if result.Score > 0.7 and result.Id < len(self.frame_descriptors) - 50:
                # High score + not recent frame
                loop_candidates.append((result.Id, result.Score))

        return loop_candidates
```

---

## Case Study: Warehouse Robot SLAM

**Scenario**: Mobile robot navigating warehouse with pallets (LiDAR + wheel encoders).

**Approach**: Graph-based SLAM with ICP scan matching.

```python
class WarehouseSLAM:
    def __init__(self):
        self.graph = GraphSLAM()
        self.current_vertex_id = self.graph.add_vertex([0, 0, 0], fixed=True)
        self.prev_scan = None

    def process(self, scan, odometry):
        """
        Process LiDAR scan and odometry.

        Args:
            scan: Open3D PointCloud
            odometry: [dx, dy, dtheta] from wheel encoders
        """
        # Add vertex for new pose (from odometry)
        new_vertex_id = self.graph.add_vertex(odometry)

        # Add odometry edge
        information = np.diag([100, 100, 50])  # Trust odometry
        self.graph.add_edge(
            self.current_vertex_id,
            new_vertex_id,
            odometry,
            information
        )

        # ICP scan matching
        if self.prev_scan is not None:
            T_icp, fitness = icp_point_to_plane(scan, self.prev_scan, threshold=0.1)

            if fitness > 0.8:  # Good match
                # Extract relative pose
                dx, dy = T_icp[0, 3], T_icp[1, 3]
                dtheta = np.arctan2(T_icp[1, 0], T_icp[0, 0])

                # Add ICP constraint (higher weight)
                information_icp = np.diag([500, 500, 200])
                self.graph.add_edge(
                    self.current_vertex_id,
                    new_vertex_id,
                    [dx, dy, dtheta],
                    information_icp
                )

        self.prev_scan = scan
        self.current_vertex_id = new_vertex_id

        # Optimize every 10 frames
        if new_vertex_id % 10 == 0:
            self.graph.optimize(iterations=5)

        # Get corrected pose
        optimized_pose = self.graph.get_pose(new_vertex_id)
        return optimized_pose
```

---

## Summary

**Key Takeaways**:

1. **SLAM problem**: Estimate trajectory + map jointly (chicken-and-egg)
2. **EKF-SLAM**: Joint Gaussian over robot + landmarks ($O(N^2)$ complexity)
3. **FastSLAM**: Particle filter for trajectory + per-particle landmark EKFs ($O(M \log N)$)
4. **Graph-based SLAM**: Optimize pose graph with loop closures (most scalable)
5. **Visual SLAM**: Feature-based (ORB-SLAM) or direct methods (LSD-SLAM)
6. **Loop closure**: Detect revisited locations with bag-of-words

**Practical Guidelines**:
- Use graph SLAM for large-scale environments
- Use visual SLAM for indoor robots (rich features)
- Use LiDAR SLAM for outdoor robots (geometry-based)
- Always detect and close loops for global consistency

---

## Exercises

1. **EKF-SLAM**: Implement EKF-SLAM for 2D robot with 5 landmarks. Simulate 100 steps with noisy odometry and measurements. Plot trajectory + landmarks.

2. **FastSLAM**: Implement FastSLAM with 100 particles. Compare trajectory estimate with EKF-SLAM. When does FastSLAM outperform?

3. **Graph Optimization**: Build pose graph from odometry data. Add loop closure constraints. Optimize with g2o. Visualize before/after trajectories.

4. **Visual Loop Closure**: Extract ORB features from 50 images. Build DBoW vocabulary. Detect loop closures. Evaluate precision/recall.

5. **ICP SLAM**: Implement 2D LiDAR SLAM using ICP for scan matching. Build occupancy grid map. Test on real LiDAR data (KITTI dataset).

6. **Multi-Session SLAM**: Run ORB-SLAM on two passes of same environment. Merge maps. Evaluate map overlap and accuracy.

---

## Further Reading

- **Books**:
  - Thrun, S., Burgard, W., Fox, D. *Probabilistic Robotics* (2005) - Chapters 10-11
  - Durrant-Whyte, H., Bailey, T. "Simultaneous Localization and Mapping" (Tutorial, 2006)

- **Papers**:
  - Montemerlo, M., et al. "FastSLAM: A Factored Solution to SLAM" (2002)
  - Mur-Artal, R., et al. "ORB-SLAM3" (2021)
  - K ümmerle, R., et al. "g2o: A General Framework for Graph Optimization" (2011)
  - Gálvez-López, D., Tardós, J.D. "Bags of Binary Words for Fast Place Recognition" (DBoW2, 2012)

- **Software**:
  - **ORB-SLAM3**: State-of-the-art visual SLAM
  - **Cartographer**: Google's 2D/3D SLAM
  - **RTAB-Map**: RGB-D SLAM with loop closure
  - **g2o**: Graph optimization library
  - **GTSAM**: Georgia Tech Smoothing and Mapping
  - **MRPT**: Mobile Robot Programming Toolkit (FastSLAM implementation)
