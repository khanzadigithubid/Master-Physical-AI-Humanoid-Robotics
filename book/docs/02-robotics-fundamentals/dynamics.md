---
sidebar_position: 2
title: Dynamics and Force Control
---

# Dynamics and Force Control

## Introduction

While kinematics describes the geometry of motion, **dynamics** governs the forces and torques that cause that motion. Understanding robot dynamics is essential for:

- **Trajectory planning**: Computing smooth, physically-realizable motions
- **Force control**: Enabling robots to interact safely with environments
- **Torque computation**: Determining actuator requirements for desired accelerations
- **Collision handling**: Predicting and responding to contact forces

In this chapter, we'll explore rigid body dynamics, the Newton-Euler and Lagrangian formulations, impedance control, and force/torque sensing. By the end, you'll understand how to compute joint torques for complex motions and implement compliant manipulation behaviors.

**Learning Objectives:**
- Derive equations of motion using Newton-Euler and Lagrange methods
- Compute forward and inverse dynamics for serial manipulators
- Understand mass matrix, Coriolis, and gravity terms
- Implement impedance and admittance control
- Design force-controlled manipulation tasks

---

## Rigid Body Dynamics Fundamentals

### Newton-Euler Equations

For a single rigid body, the equations of motion relate forces to accelerations:

$$
\begin{aligned}
\mathbf{F} &= m \mathbf{a}_c \\
\boldsymbol{\tau} &= \mathbf{I}_c \boldsymbol{\alpha} + \boldsymbol{\omega} \times (\mathbf{I}_c \boldsymbol{\omega})
\end{aligned}
$$

Where:
- $\mathbf{F}$: Total external force
- $m$: Mass
- $\mathbf{a}_c$: Linear acceleration of center of mass
- $\boldsymbol{\tau}$: Total external torque about center of mass
- $\mathbf{I}_c$: Inertia tensor
- $\boldsymbol{\alpha}$: Angular acceleration
- $\boldsymbol{\omega}$: Angular velocity

The second equation includes the **gyroscopic term** $\boldsymbol{\omega} \times (\mathbf{I}_c \boldsymbol{\omega})$, which accounts for inertial effects during rotation.

### Inertia Tensor

The inertia tensor $\mathbf{I}_c$ (3×3 symmetric matrix) describes how mass is distributed:

$$
\mathbf{I}_c = \begin{bmatrix}
I_{xx} & -I_{xy} & -I_{xz} \\
-I_{xy} & I_{yy} & -I_{yz} \\
-I_{xz} & -I_{yz} & I_{zz}
\end{bmatrix}
$$

For a coordinate frame aligned with principal axes, $\mathbf{I}_c$ is diagonal. Common shapes:

**Solid cylinder** (radius $r$, length $l$, mass $m$, axis along $z$):
$$
\mathbf{I}_c = \begin{bmatrix}
\frac{m(3r^2 + l^2)}{12} & 0 & 0 \\
0 & \frac{m(3r^2 + l^2)}{12} & 0 \\
0 & 0 & \frac{mr^2}{2}
\end{bmatrix}
$$

**Parallel Axis Theorem**: To shift inertia from center of mass to another point:

$$
\mathbf{I}_p = \mathbf{I}_c + m(\mathbf{d}^T \mathbf{d} \mathbf{I}_{3 \times 3} - \mathbf{d} \mathbf{d}^T)
$$

Where $\mathbf{d}$ is the displacement vector.

---

## Manipulator Dynamics

### Equations of Motion (Lagrangian Form)

For an $n$-DOF manipulator, the equations of motion are:

$$
\mathbf{M}(\mathbf{q}) \ddot{\mathbf{q}} + \mathbf{C}(\mathbf{q}, \dot{\mathbf{q}}) \dot{\mathbf{q}} + \mathbf{G}(\mathbf{q}) = \boldsymbol{\tau}
$$

**Terms:**
- $\mathbf{M}(\mathbf{q})$: $n \times n$ **mass/inertia matrix** (symmetric, positive-definite)
- $\mathbf{C}(\mathbf{q}, \dot{\mathbf{q}})$: **Coriolis and centrifugal terms** (velocity-dependent)
- $\mathbf{G}(\mathbf{q})$: **Gravity vector**
- $\boldsymbol{\tau}$: $n \times 1$ joint torques
- $\mathbf{q}, \dot{\mathbf{q}}, \ddot{\mathbf{q}}$: Joint positions, velocities, accelerations

### Mass Matrix $\mathbf{M}(\mathbf{q})$

The mass matrix captures how joint accelerations couple to torques. For a 2-link planar arm:

$$
\mathbf{M}(\mathbf{q}) = \begin{bmatrix}
m_1 l_{c1}^2 + m_2(l_1^2 + l_{c2}^2 + 2l_1 l_{c2} \cos q_2) + I_1 + I_2 & m_2(l_{c2}^2 + l_1 l_{c2} \cos q_2) + I_2 \\
m_2(l_{c2}^2 + l_1 l_{c2} \cos q_2) + I_2 & m_2 l_{c2}^2 + I_2
\end{bmatrix}
$$

**Key properties:**
- Diagonal terms: Effective inertia seen at each joint
- Off-diagonal: Inertial coupling between joints
- Configuration-dependent (varies with $\mathbf{q}$)

### Coriolis and Centrifugal Forces

$$
C_{ij} = \sum_{k=1}^{n} c_{ijk} \dot{q}_k, \quad c_{ijk} = \frac{1}{2} \left( \frac{\partial M_{ij}}{\partial q_k} + \frac{\partial M_{ik}}{\partial q_j} - \frac{\partial M_{jk}}{\partial q_i} \right)
$$

**Physical interpretation:**
- **Coriolis**: Forces due to motion in rotating reference frames
- **Centrifugal**: Fictitious outward forces during rotation

For a 2-link arm, the Coriolis matrix has the form:

$$
\mathbf{C}(\mathbf{q}, \dot{\mathbf{q}}) = \begin{bmatrix}
-m_2 l_1 l_{c2} \sin q_2 \cdot \dot{q}_2 & -m_2 l_1 l_{c2} \sin q_2 \cdot (\dot{q}_1 + \dot{q}_2) \\
m_2 l_1 l_{c2} \sin q_2 \cdot \dot{q}_1 & 0
\end{bmatrix}
$$

### Gravity Terms $\mathbf{G}(\mathbf{q})$

Gravity torques depend on link masses and positions:

$$
G_i = -\sum_{j=i}^{n} m_j \mathbf{g}^T \frac{\partial \mathbf{r}_{cj}}{\partial q_i}
$$

Where $\mathbf{r}_{cj}$ is the position of link $j$'s center of mass.

For a 2-link vertical arm:

$$
\mathbf{G}(\mathbf{q}) = \begin{bmatrix}
(m_1 l_{c1} + m_2 l_1) g \cos q_1 + m_2 l_{c2} g \cos(q_1 + q_2) \\
m_2 l_{c2} g \cos(q_1 + q_2)
\end{bmatrix}
$$

---

## Forward Dynamics

**Problem**: Given joint torques $\boldsymbol{\tau}$, compute accelerations $\ddot{\mathbf{q}}$.

From the equations of motion:

$$
\ddot{\mathbf{q}} = \mathbf{M}^{-1}(\mathbf{q}) [\boldsymbol{\tau} - \mathbf{C}(\mathbf{q}, \dot{\mathbf{q}}) \dot{\mathbf{q}} - \mathbf{G}(\mathbf{q})]
$$

**Algorithm** (Composite Rigid Body Algorithm - Efficient O($n^2$) method):

```python
def forward_dynamics(q, qd, tau, robot_params):
    """
    Compute joint accelerations from torques.

    Args:
        q: Joint positions (n,)
        qd: Joint velocities (n,)
        tau: Joint torques (n,)
        robot_params: Dict with masses, lengths, inertias

    Returns:
        qdd: Joint accelerations (n,)
    """
    n = len(q)

    # Compute mass matrix M(q)
    M = compute_mass_matrix(q, robot_params)

    # Compute Coriolis/centrifugal terms C(q, qd)
    C = compute_coriolis_matrix(q, qd, robot_params)

    # Compute gravity vector G(q)
    G = compute_gravity_vector(q, robot_params)

    # Solve for accelerations: M * qdd = tau - C * qd - G
    qdd = np.linalg.solve(M, tau - C @ qd - G)

    return qdd
```

**Numerical Integration**: Use `scipy.integrate.solve_ivp` to simulate motion:

```python
import numpy as np
from scipy.integrate import solve_ivp

def dynamics_ode(t, state, tau_func, robot_params):
    """
    ODE function for robot dynamics: dx/dt = f(x, tau)
    State: [q, qd]
    """
    n = len(state) // 2
    q = state[:n]
    qd = state[n:]

    # Get torques at current time
    tau = tau_func(t, q, qd)

    # Compute accelerations
    qdd = forward_dynamics(q, qd, tau, robot_params)

    return np.concatenate([qd, qdd])

# Simulate robot motion
t_span = (0, 5.0)  # 5 seconds
state0 = np.array([0, 0, 0, 0])  # Initial [q1, q2, qd1, qd2]

tau_func = lambda t, q, qd: np.array([1.0, 0.5])  # Constant torques

sol = solve_ivp(
    dynamics_ode,
    t_span,
    state0,
    args=(tau_func, robot_params),
    dense_output=True,
    method='RK45'
)

# Extract results
q_traj = sol.sol(np.linspace(0, 5, 100))[:2, :]  # Positions
qd_traj = sol.sol(np.linspace(0, 5, 100))[2:, :]  # Velocities
```

---

## Inverse Dynamics

**Problem**: Given desired trajectory $\mathbf{q}(t), \dot{\mathbf{q}}(t), \ddot{\mathbf{q}}(t)$, compute required torques $\boldsymbol{\tau}(t)$.

**Solution**: Directly evaluate the equations of motion:

$$
\boldsymbol{\tau} = \mathbf{M}(\mathbf{q}) \ddot{\mathbf{q}} + \mathbf{C}(\mathbf{q}, \dot{\mathbf{q}}) \dot{\mathbf{q}} + \mathbf{G}(\mathbf{q})
$$

**Recursive Newton-Euler Algorithm** (Efficient O($n$) method):

1. **Forward pass**: Propagate velocities and accelerations from base to end-effector
2. **Backward pass**: Propagate forces and torques from end-effector to base

```python
def inverse_dynamics(q, qd, qdd, robot_params):
    """
    Compute joint torques for desired motion (Newton-Euler).

    Args:
        q: Joint positions (n,)
        qd: Joint velocities (n,)
        qdd: Joint accelerations (n,)
        robot_params: Robot parameters

    Returns:
        tau: Joint torques (n,)
    """
    n = len(q)

    # Forward pass: compute link velocities and accelerations
    omega = [np.zeros(3)]  # Angular velocities
    alpha = [np.zeros(3)]  # Angular accelerations
    a_c = [np.array([0, 0, 9.81])]  # Linear accelerations (gravity)

    for i in range(n):
        # Propagate angular velocity
        omega_i = omega[i] + qd[i] * robot_params['axes'][i]
        omega.append(omega_i)

        # Propagate angular acceleration
        alpha_i = alpha[i] + qdd[i] * robot_params['axes'][i] + \
                  np.cross(omega[i], qd[i] * robot_params['axes'][i])
        alpha.append(alpha_i)

        # Propagate linear acceleration
        a_c_i = a_c[i] + np.cross(alpha_i, robot_params['r_c'][i]) + \
                np.cross(omega_i, np.cross(omega_i, robot_params['r_c'][i]))
        a_c.append(a_c_i)

    # Backward pass: compute forces and torques
    f = [np.zeros(3)] * (n + 1)
    tau_out = np.zeros(n)

    for i in range(n-1, -1, -1):
        # Force balance
        f[i] = robot_params['masses'][i] * a_c[i+1] + f[i+1]

        # Torque balance
        N_i = robot_params['inertias'][i] @ alpha[i+1] + \
              np.cross(omega[i+1], robot_params['inertias'][i] @ omega[i+1])

        tau_out[i] = N_i.dot(robot_params['axes'][i]) + \
                     np.cross(robot_params['r_c'][i], f[i]).dot(robot_params['axes'][i])

    return tau_out
```

**Application - Feedforward Control**:

```python
# Generate smooth trajectory
from scipy.interpolate import CubicSpline

t = np.linspace(0, 2, 50)
q_des = CubicSpline(t, [q_start, q_mid, q_end])

# Compute feedforward torques
tau_ff = np.array([
    inverse_dynamics(q_des(ti), q_des(ti, 1), q_des(ti, 2), robot_params)
    for ti in t
])

# Control law: tau = tau_ff + Kp * (q_des - q) + Kd * (qd_des - qd)
```

---

## Force Control

### Impedance Control

**Goal**: Make the robot behave like a mass-spring-damper system:

$$
\mathbf{M}_d \ddot{\mathbf{x}} + \mathbf{B}_d \dot{\mathbf{x}} + \mathbf{K}_d (\mathbf{x} - \mathbf{x}_d) = \mathbf{F}_{ext}
$$

Where:
- $\mathbf{M}_d$: Desired inertia
- $\mathbf{B}_d$: Desired damping
- $\mathbf{K}_d$: Desired stiffness
- $\mathbf{x}, \dot{\mathbf{x}}, \ddot{\mathbf{x}}$: End-effector position, velocity, acceleration
- $\mathbf{F}_{ext}$: External forces

**Implementation**:

```python
def impedance_control(x, xd, x_des, xd_des, F_ext, params):
    """
    Impedance controller for compliant manipulation.

    Args:
        x: Current end-effector position
        xd: Current end-effector velocity
        x_des: Desired position
        xd_des: Desired velocity
        F_ext: External force (measured)
        params: {M_d, B_d, K_d} - desired impedance

    Returns:
        F_cmd: Commanded end-effector force
    """
    M_d = params['M_d']
    B_d = params['B_d']
    K_d = params['K_d']

    # Compute desired acceleration from impedance law
    xdd_des = np.linalg.inv(M_d) @ (
        F_ext - B_d @ (xd - xd_des) - K_d @ (x - x_des)
    )

    # Convert to force command
    F_cmd = M_d @ xdd_des + B_d @ xd + K_d @ (x - x_des)

    return F_cmd
```

**Joint-Space Implementation**:

```python
def joint_impedance_control(q, qd, q_des, tau_ext, robot_params):
    """
    Joint-space impedance control.
    """
    K_joint = np.diag([100, 100, 50, 50, 20, 10])  # Stiffness
    B_joint = np.diag([20, 20, 10, 10, 5, 2])       # Damping

    # Gravity compensation
    G = compute_gravity_vector(q, robot_params)

    # Impedance torques
    tau = -K_joint @ (q - q_des) - B_joint @ qd + G + tau_ext

    return tau
```

### Admittance Control

**Inverse of impedance**: Measure forces, adjust position.

$$
\ddot{\mathbf{x}} = \mathbf{M}_d^{-1} [\mathbf{F}_{ext} - \mathbf{B}_d \dot{\mathbf{x}} - \mathbf{K}_d (\mathbf{x} - \mathbf{x}_d)]
$$

```python
def admittance_control(x, xd, x_des, F_ext, params, dt):
    """
    Admittance controller: adjust position based on force.
    """
    M_d_inv = np.linalg.inv(params['M_d'])

    # Compute acceleration from measured force
    xdd = M_d_inv @ (
        F_ext - params['B_d'] @ xd - params['K_d'] @ (x - x_des)
    )

    # Integrate to get new position (forward Euler)
    xd_new = xd + xdd * dt
    x_new = x + xd_new * dt

    return x_new, xd_new
```

---

## Force/Torque Sensing

### Wrist Force-Torque Sensors

**Structure**: 6-axis load cell (strain gauges) mounted between wrist and end-effector.

**Measurements**: 3 forces $(F_x, F_y, F_z)$ + 3 torques $(\tau_x, \tau_y, \tau_z)$

**Calibration**:

```python
def calibrate_ft_sensor(raw_readings, num_samples=100):
    """
    Zero-offset calibration with gravity compensation.
    """
    # Collect samples with no external force
    offsets = np.mean(raw_readings[:num_samples], axis=0)

    # Store for future use
    return offsets

def read_ft_sensor(raw, offsets, calibration_matrix):
    """
    Convert raw sensor readings to forces/torques.

    Args:
        raw: Raw ADC values (6,)
        offsets: Zero offsets (6,)
        calibration_matrix: 6x6 transformation matrix

    Returns:
        ft: [Fx, Fy, Fz, Tx, Ty, Tz]
    """
    # Apply offsets
    corrected = raw - offsets

    # Apply calibration matrix (converts to Newtons/Nm)
    ft = calibration_matrix @ corrected

    return ft
```

### Joint Torque Sensing

**Methods**:
1. **Current sensing**: Measure motor current → estimate torque
2. **Strain gauges**: Direct measurement at harmonic drives/gearboxes
3. **Model-based estimation**: Use dynamics model + motor encoder

**Example (current-based)**:

```python
def estimate_joint_torque(motor_current, gear_ratio, torque_constant):
    """
    Estimate joint torque from motor current.

    Args:
        motor_current: Measured current (A)
        gear_ratio: Reduction ratio
        torque_constant: Motor Kt (Nm/A)

    Returns:
        tau_joint: Joint torque (Nm)
    """
    tau_motor = torque_constant * motor_current
    tau_joint = gear_ratio * tau_motor

    return tau_joint
```

---

## Case Study: Peg-in-Hole Insertion

**Task**: Insert a cylindrical peg into a hole with tight tolerance.

**Challenges**:
- Requires precise alignment
- Must handle contact forces during insertion
- Friction and jamming possible

**Solution - Hybrid Force/Position Control**:

```python
def peg_in_hole_controller(x, xd, F_ext, params):
    """
    Hybrid controller: position control in XY, force control in Z.
    """
    # Desired position (above hole)
    x_des = params['hole_position']

    # Selection matrices (which DOFs to control)
    S_position = np.diag([1, 1, 0, 0, 0, 0])  # XY position
    S_force = np.diag([0, 0, 1, 0, 0, 0])     # Z force

    # Position control for XY alignment
    F_pos = params['K_pos'] @ S_position @ (x_des - x) - \
            params['B_pos'] @ S_position @ xd

    # Force control for Z insertion (target: -10N downward)
    F_des_z = np.array([0, 0, -10, 0, 0, 0])
    F_force = params['K_force'] @ S_force @ (F_des_z - F_ext)

    # Combine
    F_cmd = F_pos + F_force

    return F_cmd

# Insertion state machine
class PegInsertionStateMachine:
    def __init__(self):
        self.state = 'APPROACH'

    def update(self, x, F_ext):
        if self.state == 'APPROACH':
            if np.linalg.norm(x[:2] - hole_pos[:2]) < 0.001:  # 1mm XY tolerance
                self.state = 'INSERTION'

        elif self.state == 'INSERTION':
            if F_ext[2] < -50:  # High Z force (jamming?)
                self.state = 'RETRACT'
            elif x[2] < hole_bottom:
                self.state = 'COMPLETE'

        elif self.state == 'RETRACT':
            if F_ext[2] > -5:
                self.state = 'APPROACH'

        return self.state
```

---

## Summary

**Key Takeaways**:

1. **Dynamics equations** ($\mathbf{M} \ddot{\mathbf{q}} + \mathbf{C} \dot{\mathbf{q}} + \mathbf{G} = \boldsymbol{\tau}$) govern robot motion
2. **Mass matrix** $\mathbf{M}(\mathbf{q})$ captures inertial coupling between joints
3. **Coriolis/centrifugal** terms $\mathbf{C}$ and **gravity** $\mathbf{G}$ are configuration-dependent
4. **Forward dynamics**: Torques → accelerations (simulation)
5. **Inverse dynamics**: Desired motion → required torques (feedforward control)
6. **Impedance control**: Robot behaves like a spring-damper (compliant)
7. **Force/torque sensing** enables safe physical interaction

**Practical Implications**:
- Feedforward compensation improves tracking performance
- Impedance control is essential for contact-rich tasks
- Force sensing enables adaptive manipulation strategies
- Dynamics models must account for friction and actuator limits

---

## Exercises

1. **2-Link Dynamics**: Derive the mass matrix $\mathbf{M}(\mathbf{q})$ for a 2-link planar arm with given masses $m_1, m_2$ and lengths $l_1, l_2$.

2. **Forward Dynamics Simulation**: Implement `forward_dynamics()` for a 2-link arm. Simulate motion under constant torques $[1.0, 0.5]$ Nm for 5 seconds. Plot joint angles vs time.

3. **Gravity Compensation**: Implement a controller that holds a robot arm stationary:
   ```python
   tau = compute_gravity_vector(q, robot_params)
   ```
   Test on a simulated 6-DOF arm. What happens if gravity is underestimated by 20%?

4. **Impedance Control**: Implement joint-space impedance control. Set stiffness $K = 100$ Nm/rad, damping $B = 20$ Nms/rad. Simulate pushing the robot off its equilibrium position and observe the response.

5. **Peg-in-Hole**: Extend the peg insertion example to include rotational alignment (using moments). How would you detect successful insertion?

---

## Further Reading

- **Books**:
  - Featherstone, R. *Rigid Body Dynamics Algorithms* (2008)
  - Murray, R.M., Li, Z., Sastry, S.S. *A Mathematical Introduction to Robotic Manipulation* (1994)
  - Craig, J.J. *Introduction to Robotics: Mechanics and Control* (2017)

- **Papers**:
  - Hogan, N. "Impedance Control: An Approach to Manipulation" (1985)
  - Luh, J.Y., Walker, M.W., Paul, R.P. "On-Line Computational Scheme for Mechanical Manipulators" (1980)

- **Software**:
  - **PyBullet**: Physics simulation with contact dynamics
  - **MuJoCo**: High-performance dynamics engine
  - **Pinocchio**: Efficient rigid body dynamics library
