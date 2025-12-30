---
sidebar_position: 3
title: Sensor Fusion Techniques
---

# Sensor Fusion Techniques

## Introduction

**Sensor fusion** combines data from multiple sensors to produce more accurate, reliable, and robust estimates than any single sensor can provide. Physical AI systems integrate diverse sensors—cameras, LiDAR, IMUs, GPS, encoders—each with unique characteristics:

- **Complementary strengths**: Camera (semantic), LiDAR (geometry), IMU (dynamics)
- **Redundancy**: Multiple sensors improve fault tolerance
- **Temporal consistency**: Fusing measurements over time reduces noise

Applications:
- **State estimation**: Robot pose, velocity, orientation
- **Mapping**: Combining visual and geometric information
- **Object tracking**: Multi-modal target localization
- **Navigation**: GPS + IMU + wheel odometry fusion

This chapter covers Bayesian filtering foundations, Extended Kalman Filter (EKF), Unscented Kalman Filter (UKF), particle filters, multi-sensor calibration, and real-world fusion architectures.

**Learning Objectives:**
- Understand Bayesian filtering framework
- Implement Extended Kalman Filter for nonlinear systems
- Apply Unscented Kalman Filter for highly nonlinear dynamics
- Use particle filters for non-Gaussian distributions
- Calibrate and synchronize multiple sensors
- Design multi-sensor fusion architectures

---

## Bayesian Filtering Framework

### Recursive State Estimation

**Goal**: Estimate hidden state $\mathbf{x}_t$ given measurements $\mathbf{z}_{1:t}$.

**Two-step recursion**:

1. **Prediction** (time update):
   $$
   p(\mathbf{x}_t | \mathbf{z}_{1:t-1}) = \int p(\mathbf{x}_t | \mathbf{x}_{t-1}) p(\mathbf{x}_{t-1} | \mathbf{z}_{1:t-1}) d\mathbf{x}_{t-1}
   $$

2. **Update** (measurement):
   $$
   p(\mathbf{x}_t | \mathbf{z}_{1:t}) = \frac{p(\mathbf{z}_t | \mathbf{x}_t) p(\mathbf{x}_t | \mathbf{z}_{1:t-1})}{p(\mathbf{z}_t | \mathbf{z}_{1:t-1})}
   $$

**System model**:
- **Process model**: $\mathbf{x}_t = f(\mathbf{x}_{t-1}, \mathbf{u}_t, \mathbf{w}_t)$
- **Measurement model**: $\mathbf{z}_t = h(\mathbf{x}_t, \mathbf{v}_t)$

Where $\mathbf{w}_t \sim \mathcal{N}(0, \mathbf{Q})$ is process noise and $\mathbf{v}_t \sim \mathcal{N}(0, \mathbf{R})$ is measurement noise.

### Kalman Filter (Linear Case)

For **linear** systems:
$$
\begin{aligned}
\mathbf{x}_t &= \mathbf{A} \mathbf{x}_{t-1} + \mathbf{B} \mathbf{u}_t + \mathbf{w}_t \\
\mathbf{z}_t &= \mathbf{C} \mathbf{x}_t + \mathbf{v}_t
\end{aligned}
$$

**Kalman filter equations**:

**Predict**:
$$
\begin{aligned}
\hat{\mathbf{x}}_{t|t-1} &= \mathbf{A} \hat{\mathbf{x}}_{t-1|t-1} + \mathbf{B} \mathbf{u}_t \\
\mathbf{P}_{t|t-1} &= \mathbf{A} \mathbf{P}_{t-1|t-1} \mathbf{A}^T + \mathbf{Q}
\end{aligned}
$$

**Update**:
$$
\begin{aligned}
\mathbf{K}_t &= \mathbf{P}_{t|t-1} \mathbf{C}^T (\mathbf{C} \mathbf{P}_{t|t-1} \mathbf{C}^T + \mathbf{R})^{-1} \\
\hat{\mathbf{x}}_{t|t} &= \hat{\mathbf{x}}_{t|t-1} + \mathbf{K}_t (\mathbf{z}_t - \mathbf{C} \hat{\mathbf{x}}_{t|t-1}) \\
\mathbf{P}_{t|t} &= (\mathbf{I} - \mathbf{K}_t \mathbf{C}) \mathbf{P}_{t|t-1}
\end{aligned}
$$

```python
import numpy as np

class KalmanFilter:
    def __init__(self, A, B, C, Q, R, x0, P0):
        """
        Linear Kalman Filter.

        Args:
            A: State transition matrix (nxn)
            B: Control input matrix (nxm)
            C: Measurement matrix (pxn)
            Q: Process noise covariance (nxn)
            R: Measurement noise covariance (pxp)
            x0: Initial state estimate (n,)
            P0: Initial error covariance (nxn)
        """
        self.A = A
        self.B = B
        self.C = C
        self.Q = Q
        self.R = R

        self.x = x0  # State estimate
        self.P = P0  # Error covariance

    def predict(self, u):
        """Prediction step."""
        self.x = self.A @ self.x + self.B @ u
        self.P = self.A @ self.P @ self.A.T + self.Q

    def update(self, z):
        """Update step with measurement."""
        # Innovation
        y = z - self.C @ self.x

        # Innovation covariance
        S = self.C @ self.P @ self.C.T + self.R

        # Kalman gain
        K = self.P @ self.C.T @ np.linalg.inv(S)

        # Update estimate
        self.x = self.x + K @ y

        # Update covariance
        self.P = (np.eye(len(self.x)) - K @ self.C) @ self.P

    def get_state(self):
        return self.x.copy(), self.P.copy()
```

---

## Extended Kalman Filter (EKF)

For **nonlinear** systems, linearize around current estimate.

**Process and measurement models**:
$$
\begin{aligned}
\mathbf{x}_t &= f(\mathbf{x}_{t-1}, \mathbf{u}_t) + \mathbf{w}_t \\
\mathbf{z}_t &= h(\mathbf{x}_t) + \mathbf{v}_t
\end{aligned}
$$

**Linearization** (Jacobians):
$$
\mathbf{F}_t = \left. \frac{\partial f}{\partial \mathbf{x}} \right|_{\hat{\mathbf{x}}_{t-1}}, \quad
\mathbf{H}_t = \left. \frac{\partial h}{\partial \mathbf{x}} \right|_{\hat{\mathbf{x}}_t}
$$

**EKF equations**:

**Predict**:
$$
\begin{aligned}
\hat{\mathbf{x}}_{t|t-1} &= f(\hat{\mathbf{x}}_{t-1|t-1}, \mathbf{u}_t) \\
\mathbf{P}_{t|t-1} &= \mathbf{F}_t \mathbf{P}_{t-1|t-1} \mathbf{F}_t^T + \mathbf{Q}
\end{aligned}
$$

**Update**:
$$
\begin{aligned}
\mathbf{K}_t &= \mathbf{P}_{t|t-1} \mathbf{H}_t^T (\mathbf{H}_t \mathbf{P}_{t|t-1} \mathbf{H}_t^T + \mathbf{R})^{-1} \\
\hat{\mathbf{x}}_{t|t} &= \hat{\mathbf{x}}_{t|t-1} + \mathbf{K}_t (\mathbf{z}_t - h(\hat{\mathbf{x}}_{t|t-1})) \\
\mathbf{P}_{t|t} &= (\mathbf{I} - \mathbf{K}_t \mathbf{H}_t) \mathbf{P}_{t|t-1}
\end{aligned}
$$

```python
class ExtendedKalmanFilter:
    def __init__(self, f, h, F_jacobian, H_jacobian, Q, R, x0, P0):
        """
        Extended Kalman Filter for nonlinear systems.

        Args:
            f: Process function (x, u) -> x_next
            h: Measurement function (x) -> z
            F_jacobian: Jacobian of f (x, u) -> Jacobian matrix
            H_jacobian: Jacobian of h (x) -> Jacobian matrix
            Q, R, x0, P0: Same as Kalman Filter
        """
        self.f = f
        self.h = h
        self.F_jacobian = F_jacobian
        self.H_jacobian = H_jacobian
        self.Q = Q
        self.R = R

        self.x = x0
        self.P = P0

    def predict(self, u):
        """Prediction step with nonlinear dynamics."""
        # Nonlinear prediction
        self.x = self.f(self.x, u)

        # Linearize around current estimate
        F = self.F_jacobian(self.x, u)

        # Covariance prediction
        self.P = F @ self.P @ F.T + self.Q

    def update(self, z):
        """Update step with nonlinear measurement."""
        # Predicted measurement
        z_pred = self.h(self.x)

        # Linearize measurement model
        H = self.H_jacobian(self.x)

        # Innovation
        y = z - z_pred

        # Innovation covariance
        S = H @ self.P @ H.T + self.R

        # Kalman gain
        K = self.P @ H.T @ np.linalg.inv(S)

        # Update state
        self.x = self.x + K @ y

        # Update covariance
        self.P = (np.eye(len(self.x)) - K @ H) @ self.P

    def get_state(self):
        return self.x.copy(), self.P.copy()

# Example: 2D robot localization with GPS + odometry
def robot_process_model(x, u):
    """
    x: [x, y, theta] (position + heading)
    u: [v, omega] (linear + angular velocity)
    """
    dt = 0.1
    x_next = x.copy()
    x_next[0] += u[0] * np.cos(x[2]) * dt  # x position
    x_next[1] += u[0] * np.sin(x[2]) * dt  # y position
    x_next[2] += u[1] * dt                 # heading
    return x_next

def robot_measurement_model(x):
    """GPS measures position only."""
    return x[:2]  # [x, y]

def robot_F_jacobian(x, u):
    """Jacobian of process model."""
    dt = 0.1
    v = u[0]
    theta = x[2]

    F = np.array([
        [1, 0, -v * np.sin(theta) * dt],
        [0, 1,  v * np.cos(theta) * dt],
        [0, 0,  1]
    ])
    return F

def robot_H_jacobian(x):
    """Jacobian of measurement model."""
    H = np.array([
        [1, 0, 0],
        [0, 1, 0]
    ])
    return H

# Initialize EKF
Q = np.diag([0.1, 0.1, 0.05])**2  # Process noise
R = np.diag([0.5, 0.5])**2          # GPS noise
x0 = np.array([0, 0, 0])
P0 = np.eye(3)

ekf = ExtendedKalmanFilter(
    robot_process_model,
    robot_measurement_model,
    robot_F_jacobian,
    robot_H_jacobian,
    Q, R, x0, P0
)

# Run EKF loop
for t in range(100):
    # Control input
    u = np.array([1.0, 0.1])  # Forward motion + slight turn

    # Predict
    ekf.predict(u)

    # Measurement (GPS)
    z_gps = np.array([1.5, 0.8]) + np.random.multivariate_normal([0, 0], R)

    # Update
    ekf.update(z_gps)

    x_est, P_est = ekf.get_state()
    print(f"t={t}: x={x_est[0]:.2f}, y={x_est[1]:.2f}, theta={x_est[2]:.2f}")
```

---

## Unscented Kalman Filter (UKF)

**Problem with EKF**: Linearization introduces errors for highly nonlinear systems.

**UKF solution**: Use **sigma points** to capture mean and covariance through nonlinear transformation (no Jacobians needed).

**Unscented Transform**:

1. Generate sigma points:
   $$
   \begin{aligned}
   \mathcal{X}_0 &= \bar{\mathbf{x}} \\
   \mathcal{X}_i &= \bar{\mathbf{x}} + \sqrt{(n + \lambda) \mathbf{P}}_i, \quad i = 1, \ldots, n \\
   \mathcal{X}_{i+n} &= \bar{\mathbf{x}} - \sqrt{(n + \lambda) \mathbf{P}}_i, \quad i = 1, \ldots, n
   \end{aligned}
   $$

2. Transform sigma points:
   $$
   \mathcal{Y}_i = f(\mathcal{X}_i)
   $$

3. Compute mean and covariance:
   $$
   \bar{\mathbf{y}} = \sum_i w_i^{(m)} \mathcal{Y}_i, \quad
   \mathbf{P}_y = \sum_i w_i^{(c)} (\mathcal{Y}_i - \bar{\mathbf{y}})(\mathcal{Y}_i - \bar{\mathbf{y}})^T
   $$

```python
class UnscentedKalmanFilter:
    def __init__(self, f, h, Q, R, x0, P0, alpha=1e-3, beta=2, kappa=0):
        """
        Unscented Kalman Filter.

        Args:
            f: Process function (x, u) -> x_next
            h: Measurement function (x) -> z
            Q, R, x0, P0: Same as Kalman Filter
            alpha, beta, kappa: UKF tuning parameters
        """
        self.f = f
        self.h = h
        self.Q = Q
        self.R = R

        self.x = x0
        self.P = P0

        n = len(x0)
        self.n = n
        self.lambda_ = alpha**2 * (n + kappa) - n

        # Weights
        self.Wm = np.full(2*n + 1, 0.5 / (n + self.lambda_))
        self.Wc = np.full(2*n + 1, 0.5 / (n + self.lambda_))
        self.Wm[0] = self.lambda_ / (n + self.lambda_)
        self.Wc[0] = self.lambda_ / (n + self.lambda_) + (1 - alpha**2 + beta)

    def generate_sigma_points(self):
        """Generate sigma points."""
        n = self.n
        lambda_ = self.lambda_

        # Compute matrix square root
        U = np.linalg.cholesky((n + lambda_) * self.P)

        sigma_points = np.zeros((2*n + 1, n))
        sigma_points[0] = self.x

        for i in range(n):
            sigma_points[i + 1] = self.x + U[i]
            sigma_points[n + i + 1] = self.x - U[i]

        return sigma_points

    def predict(self, u):
        """Prediction step using sigma points."""
        # Generate sigma points
        sigma_points = self.generate_sigma_points()

        # Propagate through process model
        sigma_points_pred = np.array([self.f(sp, u) for sp in sigma_points])

        # Predicted mean
        self.x = np.sum(self.Wm[:, np.newaxis] * sigma_points_pred, axis=0)

        # Predicted covariance
        self.P = self.Q.copy()
        for i in range(len(sigma_points_pred)):
            diff = sigma_points_pred[i] - self.x
            self.P += self.Wc[i] * np.outer(diff, diff)

    def update(self, z):
        """Update step using sigma points."""
        # Generate sigma points
        sigma_points = self.generate_sigma_points()

        # Propagate through measurement model
        z_sigma = np.array([self.h(sp) for sp in sigma_points])

        # Predicted measurement
        z_pred = np.sum(self.Wm[:, np.newaxis] * z_sigma, axis=0)

        # Innovation covariance
        P_zz = self.R.copy()
        for i in range(len(z_sigma)):
            diff = z_sigma[i] - z_pred
            P_zz += self.Wc[i] * np.outer(diff, diff)

        # Cross-covariance
        P_xz = np.zeros((self.n, len(z)))
        for i in range(len(sigma_points)):
            dx = sigma_points[i] - self.x
            dz = z_sigma[i] - z_pred
            P_xz += self.Wc[i] * np.outer(dx, dz)

        # Kalman gain
        K = P_xz @ np.linalg.inv(P_zz)

        # Update state
        self.x = self.x + K @ (z - z_pred)

        # Update covariance
        self.P = self.P - K @ P_zz @ K.T

    def get_state(self):
        return self.x.copy(), self.P.copy()
```

---

## Particle Filter

**Particle filter** represents posterior distribution with weighted samples (no Gaussian assumption).

**Algorithm** (Sequential Importance Resampling):

1. **Initialize**: Sample particles $\{\mathbf{x}_0^{(i)}\}_{i=1}^{N}$ from prior
2. **Predict**: Propagate particles through process model
   $$
   \mathbf{x}_t^{(i)} \sim p(\mathbf{x}_t | \mathbf{x}_{t-1}^{(i)}, \mathbf{u}_t)
   $$
3. **Update**: Compute weights from measurement likelihood
   $$
   w_t^{(i)} \propto p(\mathbf{z}_t | \mathbf{x}_t^{(i)})
   $$
4. **Resample**: Draw new particles proportional to weights

```python
class ParticleFilter:
    def __init__(self, f, h, Q, R, x0_range, num_particles=1000):
        """
        Particle Filter for non-Gaussian distributions.

        Args:
            f: Process function (x, u, w) -> x_next
            h: Measurement function (x) -> z
            Q: Process noise covariance
            R: Measurement noise covariance
            x0_range: Initial state range [(x_min, x_max), ...]
            num_particles: Number of particles
        """
        self.f = f
        self.h = h
        self.Q = Q
        self.R = R
        self.num_particles = num_particles

        # Initialize particles uniformly
        n = len(x0_range)
        self.particles = np.random.uniform(
            low=[r[0] for r in x0_range],
            high=[r[1] for r in x0_range],
            size=(num_particles, n)
        )

        # Initialize weights uniformly
        self.weights = np.ones(num_particles) / num_particles

    def predict(self, u):
        """Prediction step: propagate particles."""
        for i in range(self.num_particles):
            # Sample process noise
            w = np.random.multivariate_normal(np.zeros(len(self.Q)), self.Q)

            # Propagate particle
            self.particles[i] = self.f(self.particles[i], u, w)

    def update(self, z):
        """Update step: reweight particles based on measurement."""
        for i in range(self.num_particles):
            # Predicted measurement
            z_pred = self.h(self.particles[i])

            # Measurement likelihood (Gaussian)
            diff = z - z_pred
            likelihood = np.exp(-0.5 * diff @ np.linalg.inv(self.R) @ diff)

            # Update weight
            self.weights[i] *= likelihood

        # Normalize weights
        self.weights += 1e-300  # Avoid division by zero
        self.weights /= np.sum(self.weights)

        # Resample if effective sample size is low
        n_eff = 1.0 / np.sum(self.weights ** 2)
        if n_eff < self.num_particles / 2:
            self.resample()

    def resample(self):
        """Systematic resampling."""
        indices = np.random.choice(
            self.num_particles,
            size=self.num_particles,
            p=self.weights
        )

        self.particles = self.particles[indices]
        self.weights = np.ones(self.num_particles) / self.num_particles

    def get_state(self):
        """Estimate state as weighted mean."""
        x_est = np.average(self.particles, weights=self.weights, axis=0)
        return x_est
```

---

## Multi-Sensor Calibration

### Spatial Calibration (Extrinsics)

Find transformation between sensor frames (e.g., LiDAR ↔ camera).

**Hand-Eye Calibration** (robot-mounted sensors):

$$
\mathbf{A} \mathbf{X} = \mathbf{X} \mathbf{B}
$$

Where:
- $\mathbf{A}$: Robot motion
- $\mathbf{B}$: Sensor motion
- $\mathbf{X}$: Unknown transformation (hand-eye)

```python
def calibrate_camera_lidar(camera_poses, lidar_poses):
    """
    Calibrate camera-LiDAR extrinsics using hand-eye calibration.

    Args:
        camera_poses: List of 4x4 camera transformations
        lidar_poses: List of 4x4 LiDAR transformations

    Returns:
        T_cam_to_lidar: 4x4 transformation matrix
    """
    # Use Tsai-Lenz hand-eye calibration
    # (Simplified - use dedicated library in practice)

    from scipy.spatial.transform import Rotation

    # Compute relative motions
    A_list = []
    B_list = []

    for i in range(len(camera_poses) - 1):
        A = np.linalg.inv(camera_poses[i]) @ camera_poses[i + 1]
        B = np.linalg.inv(lidar_poses[i]) @ lidar_poses[i + 1]

        A_list.append(A)
        B_list.append(B)

    # Solve AX = XB (use optimization or closed-form methods)
    # Placeholder: Return identity (use OpenCV or dedicated library)
    T_cam_to_lidar = np.eye(4)

    return T_cam_to_lidar
```

### Temporal Calibration (Time Sync)

**Problem**: Sensors have different sampling rates and latencies.

**Solution**: Timestamp synchronization + interpolation.

```python
def interpolate_measurement(timestamps, measurements, query_time):
    """
    Interpolate measurement at query time.

    Args:
        timestamps: Nx1 measurement timestamps
        measurements: NxM measurement values
        query_time: Desired timestamp

    Returns:
        interpolated: 1xM interpolated measurement
    """
    # Find bracketing timestamps
    idx = np.searchsorted(timestamps, query_time)

    if idx == 0 or idx >= len(timestamps):
        return None  # Out of range

    t0, t1 = timestamps[idx - 1], timestamps[idx]
    m0, m1 = measurements[idx - 1], measurements[idx]

    # Linear interpolation
    alpha = (query_time - t0) / (t1 - t0)
    interpolated = (1 - alpha) * m0 + alpha * m1

    return interpolated
```

---

## Case Study: Autonomous Drone Localization

**Sensors**:
- **GPS**: Absolute position (low frequency, noisy)
- **IMU**: Angular velocity + acceleration (high frequency, drifts)
- **Barometer**: Altitude (medium frequency, pressure-dependent)
- **Camera**: Visual odometry (medium frequency, feature-dependent)

**Fusion Architecture**: EKF with GPS + IMU + barometer.

**State**: $\mathbf{x} = [x, y, z, v_x, v_y, v_z, \phi, \theta, \psi]$ (position, velocity, orientation)

```python
class DroneEKF:
    def __init__(self):
        # State: [x, y, z, vx, vy, vz, roll, pitch, yaw]
        n = 9
        self.x = np.zeros(n)
        self.P = np.eye(n) * 10

        # Process noise (IMU integration errors)
        self.Q = np.diag([0.1, 0.1, 0.1, 0.5, 0.5, 0.5, 0.01, 0.01, 0.01])**2

        # Measurement noises
        self.R_gps = np.diag([1.0, 1.0, 2.0])**2        # GPS (x, y, z)
        self.R_baro = np.array([[0.5]])**2              # Barometer (z)
        self.R_imu = np.diag([0.01, 0.01, 0.01])**2    # IMU (roll, pitch, yaw)

    def predict(self, imu_accel, imu_gyro, dt):
        """
        Prediction step using IMU.

        Args:
            imu_accel: [ax, ay, az] body-frame accelerations
            imu_gyro: [wx, wy, wz] angular velocities
            dt: Time step
        """
        # Extract state
        x, y, z = self.x[0:3]
        vx, vy, vz = self.x[3:6]
        roll, pitch, yaw = self.x[6:9]

        # Rotation matrix (body to world)
        R = self.rotation_matrix(roll, pitch, yaw)

        # Transform acceleration to world frame
        accel_world = R @ imu_accel - np.array([0, 0, 9.81])

        # Update state (dead reckoning)
        self.x[0:3] += self.x[3:6] * dt + 0.5 * accel_world * dt**2
        self.x[3:6] += accel_world * dt
        self.x[6:9] += imu_gyro * dt

        # Jacobian (simplified - linearize around current state)
        F = np.eye(9)
        F[0:3, 3:6] = np.eye(3) * dt

        # Covariance prediction
        self.P = F @ self.P @ F.T + self.Q

    def update_gps(self, gps_position):
        """Update with GPS measurement."""
        # Measurement model: H = [I_3x3, 0_3x6]
        H = np.zeros((3, 9))
        H[0:3, 0:3] = np.eye(3)

        # Innovation
        z_pred = self.x[0:3]
        y = gps_position - z_pred

        # Kalman gain
        S = H @ self.P @ H.T + self.R_gps
        K = self.P @ H.T @ np.linalg.inv(S)

        # Update
        self.x += K @ y
        self.P = (np.eye(9) - K @ H) @ self.P

    def update_barometer(self, altitude):
        """Update with barometer measurement."""
        # Measurement model: H = [0, 0, 1, 0, ...]
        H = np.zeros((1, 9))
        H[0, 2] = 1

        # Innovation
        z_pred = self.x[2]
        y = altitude - z_pred

        # Kalman gain
        S = H @ self.P @ H.T + self.R_baro
        K = self.P @ H.T @ np.linalg.inv(S)

        # Update
        self.x += K * y
        self.P = (np.eye(9) - K @ H) @ self.P

    def rotation_matrix(self, roll, pitch, yaw):
        """Compute rotation matrix from Euler angles."""
        cr, sr = np.cos(roll), np.sin(roll)
        cp, sp = np.cos(pitch), np.sin(pitch)
        cy, sy = np.cos(yaw), np.sin(yaw)

        R = np.array([
            [cy*cp, cy*sp*sr - sy*cr, cy*sp*cr + sy*sr],
            [sy*cp, sy*sp*sr + cy*cr, sy*sp*cr - cy*sr],
            [-sp, cp*sr, cp*cr]
        ])

        return R
```

---

## Summary

**Key Takeaways**:

1. **Bayesian filtering**: Prediction + update cycle for recursive estimation
2. **Kalman filter**: Optimal for linear-Gaussian systems
3. **EKF**: Linearizes nonlinear dynamics with Jacobians
4. **UKF**: Uses sigma points (no Jacobians, better for high nonlinearity)
5. **Particle filter**: Handles non-Gaussian distributions with samples
6. **Calibration**: Spatial (extrinsics) and temporal (time sync) alignment
7. **Fusion architectures**: Combine complementary sensors (GPS + IMU, camera + LiDAR)

**Practical Guidelines**:
- Use Kalman filter for linear systems (simple, fast)
- Use EKF for mildly nonlinear systems (most common)
- Use UKF when Jacobians are hard to compute or system is highly nonlinear
- Use particle filter for multi-modal distributions (e.g., kidnapped robot)

---

## Exercises

1. **IMU-GPS Fusion**: Implement EKF for 2D robot with GPS + wheel odometry. Simulate 100 steps. Compare estimated trajectory with ground truth.

2. **UKF vs EKF**: Implement both for a highly nonlinear system (e.g., pendulum). Compare estimation errors. When does UKF outperform EKF?

3. **Particle Filter**: Implement for robot localization with discrete landmarks. Use 500 particles. Visualize particle distribution over time.

4. **Sensor Calibration**: Given synchronized camera-IMU data, estimate extrinsic transformation. Use checkerboard for visual calibration.

5. **Multi-Rate Fusion**: Fuse GPS (1 Hz) with IMU (100 Hz). Interpolate GPS measurements. Compare with single-rate fusion.

6. **Failure Detection**: Modify EKF to detect sensor failures (e.g., GPS outage). Switch to dead reckoning when innovation exceeds threshold.

---

## Further Reading

- **Books**:
  - Thrun, S., Burgard, W., Fox, D. *Probabilistic Robotics* (2005)
  - Bar-Shalom, Y., et al. *Estimation with Applications to Tracking and Navigation* (2001)
  - Simon, D. *Optimal State Estimation* (2006)

- **Papers**:
  - Julier, S.J., Uhlmann, J.K. "Unscented Filtering and Nonlinear Estimation" (2004)
  - Gordon, N.J., et al. "Novel approach to nonlinear/non-Gaussian Bayesian state estimation" (Particle Filter, 1993)
  - Mourikis, A.I., Roumeliotis, S.I. "Multi-State Constraint Kalman Filter for Vision-aided Inertial Navigation" (2007)

- **Software**:
  - **FilterPy**: Python library for Kalman filters
  - **robot_localization**: ROS package for sensor fusion
  - **GTSAM**: Georgia Tech Smoothing and Mapping library
  - **Kalibr**: Multi-sensor calibration toolbox
