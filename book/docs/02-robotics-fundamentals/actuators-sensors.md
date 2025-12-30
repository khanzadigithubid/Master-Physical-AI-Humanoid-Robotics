---
sidebar_position: 4
title: Actuators and Sensors
---

# Actuators and Sensors

## Introduction

**Actuators** convert electrical energy into mechanical motion, while **sensors** convert physical quantities into electrical signals. Together, they form the **sensorimotor system** that enables robots to interact with their environment.

Understanding actuators and sensors is crucial for:
- **Hardware selection**: Choosing appropriate components for applications
- **Control design**: Accounting for actuator dynamics and sensor noise
- **System integration**: Interfacing electronics with mechanical systems
- **Performance optimization**: Maximizing torque, speed, and accuracy

This chapter covers electric motors, hydraulic and pneumatic actuators, encoders, force/torque sensors, IMUs, and sensor fusion techniques essential for modern robotics.

**Learning Objectives:**
- Understand different actuator technologies and their trade-offs
- Select motors and transmissions for robotic applications
- Design sensor systems for proprioception and exteroception
- Implement sensor fusion algorithms (Kalman filtering)
- Interface sensors and actuators with control systems

---

## Actuators

### Electric Motors

Electric motors are the most common actuators in robotics due to their **controllability**, **efficiency**, and **compactness**.

#### DC Motors

**Principle**: Current through a coil in a magnetic field produces torque.

**Torque-current relationship**:

$$
\tau = K_t I
$$

Where $K_t$ is the torque constant (Nm/A).

**Back-EMF** (electromotive force):

$$
V_{emf} = K_e \omega
$$

Where $K_e$ is the back-EMF constant (V·s/rad) and $\omega$ is angular velocity.

**Electrical equation**:

$$
V = IR + L\frac{dI}{dt} + K_e \omega
$$

**Mechanical equation**:

$$
J\frac{d\omega}{dt} = \tau - b\omega - \tau_{load}
$$

Where:
- $R$: Armature resistance (Ω)
- $L$: Armature inductance (H)
- $J$: Rotor inertia (kg·m²)
- $b$: Viscous friction coefficient

```python
class DCMotor:
    def __init__(self, Kt, Ke, R, L, J, b):
        """
        DC motor model.

        Args:
            Kt: Torque constant (Nm/A)
            Ke: Back-EMF constant (V·s/rad)
            R: Resistance (Ohm)
            L: Inductance (H)
            J: Inertia (kg·m^2)
            b: Friction (Nm·s/rad)
        """
        self.Kt = Kt
        self.Ke = Ke
        self.R = R
        self.L = L
        self.J = J
        self.b = b

    def dynamics(self, state, V_applied, tau_load):
        """
        Compute motor dynamics: dx/dt = f(x, u).

        State: [omega, I]
        """
        omega, I = state

        # Electrical dynamics
        dI_dt = (V_applied - self.R * I - self.Ke * omega) / self.L

        # Mechanical dynamics
        tau = self.Kt * I
        domega_dt = (tau - self.b * omega - tau_load) / self.J

        return np.array([domega_dt, dI_dt])

# Example motor (Maxon EC 90 flat)
motor = DCMotor(
    Kt=0.0603,    # Nm/A
    Ke=0.0603,    # V·s/rad
    R=0.262,      # Ohm
    L=0.126e-3,   # H
    J=354e-7,     # kg·m^2
    b=0.001       # Nm·s/rad
)
```

#### Brushless DC Motors (BLDC)

**Advantages**:
- Higher efficiency (no brush friction)
- Longer lifespan
- Higher torque-to-weight ratio

**Control**: Requires **electronic commutation** (ESC) with Hall effect sensors or encoder feedback.

**Three-phase control** (trapezoidal or sinusoidal):

$$
\begin{aligned}
V_a &= V_{max} \sin(\theta_e) \\
V_b &= V_{max} \sin(\theta_e - 2\pi/3) \\
V_c &= V_{max} \sin(\theta_e + 2\pi/3)
\end{aligned}
$$

Where $\theta_e$ is the electrical angle.

```python
def bldc_commutation(theta_electrical, V_max):
    """
    Generate three-phase voltages for BLDC motor.

    Args:
        theta_electrical: Electrical angle (rad)
        V_max: Maximum voltage

    Returns:
        Va, Vb, Vc: Phase voltages
    """
    Va = V_max * np.sin(theta_electrical)
    Vb = V_max * np.sin(theta_electrical - 2*np.pi/3)
    Vc = V_max * np.sin(theta_electrical + 2*np.pi/3)

    return Va, Vb, Vc

# Electrical angle = (pole_pairs) * mechanical_angle
def mechanical_to_electrical(theta_mech, pole_pairs):
    return (theta_mech * pole_pairs) % (2 * np.pi)
```

#### Servo Motors

**Integrated system**: Motor + encoder + controller in one package.

**Position control** (built-in PID):

```python
def send_servo_command(servo_id, position_deg, serial_port):
    """
    Send position command to Dynamixel servo.

    Args:
        servo_id: Servo ID (0-253)
        position_deg: Desired position (degrees)
        serial_port: Serial connection
    """
    # Convert degrees to servo units (0-4095 for 360°)
    position_units = int((position_deg / 360.0) * 4095)

    # Construct command packet (Dynamixel Protocol 2.0)
    packet = [
        0xFF, 0xFF, 0xFD, 0x00,  # Header
        servo_id,                 # Servo ID
        0x07, 0x00,               # Length
        0x03,                     # Instruction (Write)
        0x74, 0x00,               # Address (Goal Position)
        position_units & 0xFF,    # Low byte
        (position_units >> 8) & 0xFF,  # High byte
        # ... checksum
    ]

    serial_port.write(bytes(packet))
```

---

### Hydraulic and Pneumatic Actuators

#### Hydraulic Actuators

**Advantages**:
- **Very high force/torque** (100+ kN for hydraulic presses)
- High power-to-weight ratio
- Stiffness and backdrivability

**Disadvantages**:
- Requires pump and reservoir
- Potential leakage
- More complex maintenance

**Hydraulic cylinder**:

$$
F = P \cdot A
$$

Where $P$ is pressure (Pa) and $A$ is piston area (m²).

**Flow equation**:

$$
Q = A \cdot v
$$

Where $Q$ is flow rate (m³/s) and $v$ is piston velocity (m/s).

**Applications**: Heavy-duty robots (Boston Dynamics Atlas legs), construction, aerospace.

#### Pneumatic Actuators

**Advantages**:
- Clean (uses air)
- Low cost
- Fast response

**Disadvantages**:
- Compressible (position control difficult)
- Lower force than hydraulics

**Applications**: Soft robotics, grippers, low-force manipulation.

---

### Transmissions

Transmissions modify motor output to meet application requirements.

#### Gear Reductions

**Gear ratio** $N$:

$$
N = \frac{\text{input speed}}{\text{output speed}} = \frac{\omega_{motor}}{\omega_{joint}}
$$

**Torque amplification**:

$$
\tau_{output} = N \cdot \tau_{motor} \cdot \eta
$$

Where $\eta$ is efficiency (0.9-0.98 for good gearboxes).

**Reflected inertia**:

$$
J_{reflected} = N^2 \cdot J_{motor}
$$

**Types**:
- **Spur gears**: Simple, efficient (95-98%), but noisy
- **Planetary gears**: Compact, coaxial, common in robotics
- **Harmonic drives**: Very high ratios (50-300), low backlash, expensive

```python
def select_gear_ratio(tau_required, omega_required, motor_specs):
    """
    Select appropriate gear ratio for application.

    Args:
        tau_required: Output torque needed (Nm)
        omega_required: Output speed needed (rad/s)
        motor_specs: Dict with motor torque/speed

    Returns:
        N: Gear ratio
    """
    # Motor operates efficiently at ~70% of max speed
    omega_motor = motor_specs['omega_max'] * 0.7

    # Required gear ratio
    N = omega_motor / omega_required

    # Check if motor can provide required torque
    tau_motor_required = tau_required / (N * motor_specs['eta'])

    if tau_motor_required > motor_specs['tau_max']:
        print("Warning: Motor insufficient even with gearing")
        return None

    return N

# Example: Select gear ratio for robot joint
motor_specs = {
    'omega_max': 500,  # rad/s (no load)
    'tau_max': 0.2,    # Nm (stall torque)
    'eta': 0.95        # Gearbox efficiency
}

N = select_gear_ratio(tau_required=10, omega_required=2, motor_specs=motor_specs)
print(f"Recommended gear ratio: {N:.1f}:1")
```

#### Series Elastic Actuators (SEA)

**Concept**: Insert a **spring** between motor and load.

**Advantages**:
- **Shock absorption** (protects gears)
- **Force sensing** (measure spring deflection)
- **Energy storage** (for dynamic gaits)

**Torque measurement**:

$$
\tau = K_{spring} \cdot (\theta_{motor} - \theta_{load})
$$

```python
class SeriesElasticActuator:
    def __init__(self, motor, K_spring):
        self.motor = motor
        self.K_spring = K_spring  # Spring stiffness (Nm/rad)

    def measure_torque(self, theta_motor, theta_load):
        """Measure torque from spring deflection."""
        deflection = theta_motor - theta_load
        tau = self.K_spring * deflection
        return tau

    def control(self, tau_desired, theta_motor, theta_load):
        """
        Force control using SEA.

        Args:
            tau_desired: Desired output torque
            theta_motor, theta_load: Motor and load angles

        Returns:
            V_motor: Motor voltage command
        """
        # Measure current torque
        tau_actual = self.measure_torque(theta_motor, theta_load)

        # PID force controller
        error = tau_desired - tau_actual
        V_motor = self.force_controller.compute(tau_desired, tau_actual)

        return V_motor
```

---

## Proprioceptive Sensors

### Encoders

Encoders measure joint positions (or velocities).

#### Incremental Encoders

**Output**: Two quadrature signals (A, B) with 90° phase shift.

**Resolution**: Pulses per revolution (PPR). Common values: 500-10,000 PPR.

**Quadrature decoding** (determines direction):

```python
class IncrementalEncoder:
    def __init__(self, ppr, dt):
        self.ppr = ppr  # Pulses per revolution
        self.dt = dt    # Sample time

        self.count = 0
        self.prev_A = 0
        self.prev_B = 0

    def update(self, A, B):
        """
        Decode quadrature signals.

        Args:
            A, B: Encoder signals (0 or 1)

        Returns:
            delta_count: Change in count (+1, 0, or -1)
        """
        # State transition logic
        if A != self.prev_A:
            if A == B:
                self.count += 1  # Forward
            else:
                self.count -= 1  # Reverse

        self.prev_A = A
        self.prev_B = B

        return self.count

    def get_position(self):
        """Get angle in radians."""
        return (2 * np.pi * self.count) / self.ppr

    def get_velocity(self, delta_count):
        """Estimate velocity from count change."""
        delta_theta = (2 * np.pi * delta_count) / self.ppr
        omega = delta_theta / self.dt
        return omega
```

**Velocity estimation** (low-pass filter to reduce noise):

$$
\hat{\omega}[k] = \alpha \hat{\omega}[k-1] + (1 - \alpha) \omega_{raw}[k]
$$

Where $\alpha \in [0, 1]$ is the filter coefficient.

#### Absolute Encoders

**Output**: Unique code for each position (no homing required).

**Types**:
- **Magnetic**: Hall effect sensors + magnet (e.g., AS5048)
- **Optical**: Gray code disk

**Reading absolute position** (SPI/I²C interface):

```python
import spidev

def read_absolute_encoder_spi(spi_bus, spi_device):
    """
    Read 14-bit absolute angle from AS5048 magnetic encoder.

    Returns:
        angle: Angle in radians [0, 2π)
    """
    spi = spidev.SpiDev()
    spi.open(spi_bus, spi_device)
    spi.max_speed_hz = 1000000

    # Send read command (0xFFFF)
    response = spi.xfer2([0xFF, 0xFF])

    # Extract 14-bit angle (bits 0-13)
    raw_angle = ((response[0] & 0x3F) << 8) | response[1]

    # Convert to radians
    angle = (raw_angle / 16384.0) * 2 * np.pi

    spi.close()
    return angle
```

---

### Inertial Measurement Units (IMUs)

IMUs measure **acceleration** and **angular velocity** (and sometimes magnetic field).

**Components**:
- **Accelerometer**: Measures specific force (m/s²)
- **Gyroscope**: Measures angular velocity (rad/s)
- **Magnetometer** (optional): Measures magnetic field (for heading)

#### Accelerometer

**Principle**: MEMS structure with capacitive sensing.

**Output**: 3-axis acceleration $(a_x, a_y, a_z)$ in body frame.

**Gravity vector** (when stationary):

$$
\mathbf{a} = \mathbf{R}^T \mathbf{g}
$$

Where $\mathbf{R}$ is the rotation matrix from world to body frame.

**Tilt estimation** (pitch and roll):

$$
\text{roll} = \arctan2(a_y, a_z), \quad \text{pitch} = \arctan2(-a_x, \sqrt{a_y^2 + a_z^2})
$$

#### Gyroscope

**Principle**: Coriolis effect in vibrating MEMS structure.

**Output**: Angular velocity $(\omega_x, \omega_y, \omega_z)$.

**Orientation integration** (dead reckoning):

$$
\mathbf{q}[k+1] = \mathbf{q}[k] + \frac{1}{2} \mathbf{q}[k] \otimes \boldsymbol{\omega}[k] \Delta t
$$

Where $\mathbf{q}$ is the quaternion and $\otimes$ is quaternion multiplication.

**Problem**: **Drift** (integration error accumulates).

---

### Sensor Fusion: Complementary Filter

**Goal**: Combine accelerometer (no drift, noisy) with gyroscope (smooth, drifts) for robust orientation.

**Complementary filter**:

$$
\theta[k] = \alpha (\theta[k-1] + \omega[k] \Delta t) + (1 - \alpha) \theta_{acc}[k]
$$

Where:
- $\theta_{acc}$: Tilt from accelerometer
- $\omega$: Angular velocity from gyroscope
- $\alpha \approx 0.98$: Trust gyroscope for short term, accelerometer for long term

```python
class ComplementaryFilter:
    def __init__(self, alpha=0.98, dt=0.01):
        self.alpha = alpha
        self.dt = dt
        self.angle = 0  # Current estimate

    def update(self, gyro_rate, accel):
        """
        Update orientation estimate.

        Args:
            gyro_rate: Angular velocity (rad/s)
            accel: Acceleration vector [ax, ay, az] (m/s^2)

        Returns:
            angle: Filtered orientation (rad)
        """
        # Gyroscope integration (high-pass)
        angle_gyro = self.angle + gyro_rate * self.dt

        # Accelerometer tilt (low-pass)
        angle_accel = np.arctan2(accel[1], accel[2])

        # Complementary filter
        self.angle = self.alpha * angle_gyro + (1 - self.alpha) * angle_accel

        return self.angle

# Usage example
imu_filter = ComplementaryFilter(alpha=0.98, dt=0.01)

# Simulated IMU readings
for i in range(1000):
    gyro_rate = 0.1 + np.random.normal(0, 0.01)  # Gyro with drift
    accel = np.array([0, np.sin(0.1*i), np.cos(0.1*i)]) + np.random.normal(0, 0.1, 3)

    angle_estimate = imu_filter.update(gyro_rate, accel)
```

---

### Sensor Fusion: Kalman Filter

**Optimal** fusion of multiple sensors with noise.

**System model**:

$$
\mathbf{x}[k+1] = \mathbf{A} \mathbf{x}[k] + \mathbf{B} \mathbf{u}[k] + \mathbf{w}[k]
$$

**Measurement model**:

$$
\mathbf{z}[k] = \mathbf{C} \mathbf{x}[k] + \mathbf{v}[k]
$$

Where $\mathbf{w} \sim \mathcal{N}(0, \mathbf{Q})$ is process noise and $\mathbf{v} \sim \mathcal{N}(0, \mathbf{R})$ is measurement noise.

**Kalman filter** (two steps):

1. **Predict**:
   $$
   \begin{aligned}
   \hat{\mathbf{x}}[k|k-1] &= \mathbf{A} \hat{\mathbf{x}}[k-1|k-1] + \mathbf{B} \mathbf{u}[k] \\
   \mathbf{P}[k|k-1] &= \mathbf{A} \mathbf{P}[k-1|k-1] \mathbf{A}^T + \mathbf{Q}
   \end{aligned}
   $$

2. **Update**:
   $$
   \begin{aligned}
   \mathbf{K}[k] &= \mathbf{P}[k|k-1] \mathbf{C}^T (\mathbf{C} \mathbf{P}[k|k-1] \mathbf{C}^T + \mathbf{R})^{-1} \\
   \hat{\mathbf{x}}[k|k] &= \hat{\mathbf{x}}[k|k-1] + \mathbf{K}[k] (\mathbf{z}[k] - \mathbf{C} \hat{\mathbf{x}}[k|k-1]) \\
   \mathbf{P}[k|k] &= (\mathbf{I} - \mathbf{K}[k] \mathbf{C}) \mathbf{P}[k|k-1]
   \end{aligned}
   $$

```python
class KalmanFilter:
    def __init__(self, A, B, C, Q, R, x0, P0):
        self.A = A  # State transition
        self.B = B  # Control input
        self.C = C  # Measurement
        self.Q = Q  # Process noise covariance
        self.R = R  # Measurement noise covariance

        self.x = x0  # State estimate
        self.P = P0  # Error covariance

    def predict(self, u):
        """Prediction step."""
        self.x = self.A @ self.x + self.B @ u
        self.P = self.A @ self.P @ self.A.T + self.Q

    def update(self, z):
        """Update step with measurement."""
        # Kalman gain
        S = self.C @ self.P @ self.C.T + self.R
        K = self.P @ self.C.T @ np.linalg.inv(S)

        # Update estimate
        innovation = z - self.C @ self.x
        self.x = self.x + K @ innovation
        self.P = (np.eye(len(self.x)) - K @ self.C) @ self.P

    def get_state(self):
        return self.x

# Example: Fuse gyroscope and accelerometer
# State: [angle, angular_velocity]
A = np.array([[1, dt], [0, 1]])
B = np.array([[0], [0]])
C = np.array([[1, 0], [0, 1]])  # Measure both angle and rate
Q = np.diag([0.001, 0.01])  # Small process noise
R = np.diag([0.1, 0.05])    # Measurement noise (accel noisier)

kf = KalmanFilter(A, B, C, Q, R, x0=np.zeros(2), P0=np.eye(2))

# Update loop
for i in range(100):
    kf.predict(u=np.zeros(1))
    z_accel = angle_from_accelerometer()
    z_gyro = gyro_rate()
    kf.update(np.array([z_accel, z_gyro]))
    angle_estimate = kf.get_state()[0]
```

---

## Exteroceptive Sensors

### Force/Torque Sensors (Covered in Dynamics Chapter)

**6-axis load cell** for measuring contact forces.

### Tactile Sensors

**Types**:
- **Resistive**: Pressure changes resistance
- **Capacitive**: Deformation changes capacitance
- **Optical**: Force changes light reflection

**Applications**: Grasping, manipulation, human-robot interaction.

---

## Case Study: Quadruped Robot Leg

**Actuators**:
- **Hip**: BLDC motor (Tmotor AK80-9) + harmonic drive (9:1)
- **Knee**: Same motor + harmonic drive
- Torque: 9 Nm continuous, 18 Nm peak

**Sensors**:
- **Joint encoders**: Absolute magnetic (14-bit, 0.02° resolution)
- **IMU**: BMI088 (accelerometer + gyroscope, 400 Hz)
- **Foot contact**: Binary switch (microswitch or FSR)

**Control loop** (1 kHz):

```python
def quadruped_control_loop(dt=0.001):
    """
    High-frequency control loop for quadruped.
    """
    # Read sensors
    q = read_joint_encoders()      # Joint positions
    qd = estimate_velocities(q, dt)  # Differentiate
    imu_data = read_imu()
    orientation = fuse_imu_data(imu_data)  # Kalman filter

    # State estimation (body pose + velocity)
    state = forward_kinematics(q, orientation)

    # Controller (MPC or whole-body control)
    tau_des = compute_control(state, state_des)

    # Torque control (current control on motors)
    for i, motor in enumerate(motors):
        current_cmd = tau_des[i] / motor.Kt
        motor.set_current(current_cmd)

    time.sleep(dt)
```

---

## Summary

**Key Takeaways**:

1. **DC motors**: Most common, simple control, require gear reduction
2. **BLDC motors**: Higher efficiency, require electronic commutation
3. **Hydraulics**: Very high force, complex system
4. **Encoders**: Incremental (relative) vs absolute (unique position)
5. **IMUs**: Accelerometer (tilt, no drift) + gyroscope (smooth, drifts)
6. **Sensor fusion**: Complementary filter (simple), Kalman filter (optimal)
7. **Transmissions**: Amplify torque, reflect inertia, introduce backlash

**Design Guidelines**:
- Select motors based on torque-speed requirements and duty cycle
- Use harmonic drives for low backlash, planetary for high efficiency
- Fuse IMU data to avoid drift and noise
- Sample sensors faster than control loop (>2× Nyquist frequency)

---

## Exercises

1. **Motor Selection**: A robot arm joint requires 15 Nm torque at 3 rad/s. Select a motor and gear ratio from available options:
   - Motor A: 0.5 Nm, 600 rad/s
   - Motor B: 1.0 Nm, 400 rad/s
   Compare efficiency and reflected inertia.

2. **Encoder Resolution**: An incremental encoder has 2000 PPR. With quadrature decoding (4× multiplication), what is the angular resolution? How does this affect velocity estimation noise?

3. **IMU Fusion**: Implement the `ComplementaryFilter` class. Simulate a robot tilting sinusoidally. Add noise to accelerometer (σ = 0.5 m/s²) and drift to gyroscope (0.01 rad/s). Compare filter output with ground truth for different α values.

4. **Kalman Filter**: Extend the Kalman filter example to include 3-axis orientation (roll, pitch, yaw). Tune Q and R matrices for a quadrotor IMU. Test with recorded flight data.

5. **SEA Control**: Simulate a series elastic actuator with K_spring = 1000 Nm/rad. Implement force control with a target of 10 Nm. Compare step response with and without the spring.

---

## Further Reading

- **Books**:
  - Hughes, A., Drury, B. *Electric Motors and Drives* (2019)
  - Webster, J.G., Eren, H. *Measurement, Instrumentation, and Sensors Handbook* (2014)
  - Siciliano, B., et al. *Springer Handbook of Robotics* (2016) - Chapters on Actuation and Sensing

- **Papers**:
  - Pratt, G.A., Williamson, M.M. "Series Elastic Actuators" (1995)
  - Mahony, R., Hamel, T., Pflimlin, J.M. "Nonlinear Complementary Filters on SO(3)" (2008)

- **Datasheets**:
  - **Motors**: Maxon EC motors, T-Motor AK series
  - **Encoders**: CUI AMT, AS5048 magnetic encoder
  - **IMUs**: Bosch BMI088, InvenSense ICM-20948

- **Software**:
  - **ODrive**: Open-source motor controller
  - **Kalman-CPP**: C++ Kalman filter library
  - **madgwick-ahrs**: Orientation estimation algorithm
