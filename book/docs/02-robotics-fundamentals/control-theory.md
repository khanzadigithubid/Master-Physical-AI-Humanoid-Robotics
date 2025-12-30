---
sidebar_position: 3
title: Control Theory for Robotics
---

# Control Theory for Robotics

## Introduction

**Control theory** provides the mathematical framework for designing feedback systems that ensure robots follow desired trajectories accurately and robustly. While dynamics tells us *how* robots move, control theory tells us *how to make* them move as intended.

Key applications in robotics:
- **Trajectory tracking**: Follow planned paths with high precision
- **Disturbance rejection**: Maintain performance despite external forces
- **Stability guarantees**: Ensure the system doesn't become unstable
- **Optimal performance**: Minimize tracking error, energy, or time

This chapter covers PID control, state-space methods, linear quadratic regulators (LQR), model predictive control (MPC), and adaptive techniques essential for modern robotic systems.

**Learning Objectives:**
- Design and tune PID controllers for joint and task space
- Understand state-space representation and controllability
- Implement LQR for optimal control
- Apply model predictive control for constrained trajectories
- Explore adaptive control for uncertain dynamics

---

## Classical Control: PID

### Proportional-Integral-Derivative Control

The PID controller is the workhorse of industrial robotics:

$$
u(t) = K_p e(t) + K_i \int_0^t e(\tau) d\tau + K_d \frac{de(t)}{dt}
$$

Where:
- $e(t) = x_d(t) - x(t)$: Tracking error
- $K_p$: Proportional gain
- $K_i$: Integral gain
- $K_d$: Derivative gain

**Discrete-time implementation** (for digital controllers):

$$
u[k] = K_p e[k] + K_i \sum_{j=0}^{k} e[j] \Delta t + K_d \frac{e[k] - e[k-1]}{\Delta t}
$$

```python
class PIDController:
    def __init__(self, Kp, Ki, Kd, dt):
        self.Kp = Kp
        self.Ki = Ki
        self.Kd = Kd
        self.dt = dt

        self.error_sum = 0
        self.prev_error = 0

    def compute(self, setpoint, measurement):
        """
        Compute PID control output.

        Args:
            setpoint: Desired value
            measurement: Current value

        Returns:
            control: Control signal
        """
        error = setpoint - measurement

        # Proportional term
        P = self.Kp * error

        # Integral term (with anti-windup)
        self.error_sum += error * self.dt
        self.error_sum = np.clip(self.error_sum, -100, 100)  # Limit integral
        I = self.Ki * self.error_sum

        # Derivative term (low-pass filtered for noise)
        D = self.Kd * (error - self.prev_error) / self.dt
        self.prev_error = error

        control = P + I + D
        return control

    def reset(self):
        """Reset integral and derivative terms."""
        self.error_sum = 0
        self.prev_error = 0
```

### Tuning PID Controllers

**Ziegler-Nichols Method** (Empirical):

1. Set $K_i = K_d = 0$
2. Increase $K_p$ until system oscillates with period $T_u$ (ultimate period)
3. Record critical gain $K_u$
4. Set gains:
   - $K_p = 0.6 K_u$
   - $K_i = 2 K_p / T_u$
   - $K_d = K_p T_u / 8$

**Manual Tuning Rules**:
- **Too much overshoot?** Decrease $K_p$, increase $K_d$
- **Steady-state error?** Increase $K_i$
- **Oscillations?** Decrease $K_p$ and $K_d$
- **Sluggish response?** Increase $K_p$

```python
def tune_pid_ziegler_nichols(plant, initial_kp=1.0, step=0.1):
    """
    Auto-tune PID using Ziegler-Nichols method.

    Args:
        plant: Function simulating system dynamics
        initial_kp: Starting proportional gain

    Returns:
        Kp, Ki, Kd: Tuned gains
    """
    # Find critical gain Ku (where system oscillates)
    Kp = initial_kp
    while True:
        response = simulate_closed_loop(plant, Kp, 0, 0)
        if is_oscillating(response):
            Ku = Kp
            Tu = measure_period(response)
            break
        Kp += step

    # Compute PID gains
    Kp_tuned = 0.6 * Ku
    Ki_tuned = 2 * Kp_tuned / Tu
    Kd_tuned = Kp_tuned * Tu / 8

    return Kp_tuned, Ki_tuned, Kd_tuned
```

### Joint-Space vs Task-Space PID

**Joint-Space** (Independent control of each joint):

```python
def joint_space_pid(q_des, q, qd, controllers, robot_params):
    """
    Independent PID for each joint.
    """
    tau = np.zeros(len(q))
    for i in range(len(q)):
        tau[i] = controllers[i].compute(q_des[i], q[i])

    # Add gravity compensation
    G = compute_gravity_vector(q, robot_params)
    tau += G

    return tau
```

**Task-Space** (Control end-effector pose):

```python
def task_space_pid(x_des, x, xd, controller, robot_params):
    """
    PID control in task space (Cartesian coordinates).
    """
    # Compute task-space error
    error_pos = x_des[:3] - x[:3]  # Position error
    error_ori = orientation_error(x_des[3:], x[3:])  # Orientation error
    error = np.concatenate([error_pos, error_ori])

    # PID in task space
    F_des = np.zeros(6)
    for i in range(6):
        F_des[i] = controller[i].compute(0, -error[i])  # Error as measurement

    # Convert to joint torques via Jacobian transpose
    J = compute_jacobian(robot_params['q'], robot_params)
    tau = J.T @ F_des

    # Add gravity compensation
    G = compute_gravity_vector(robot_params['q'], robot_params)
    tau += G

    return tau
```

---

## State-Space Control

### State-Space Representation

A dynamical system can be written as:

$$
\begin{aligned}
\dot{\mathbf{x}} &= \mathbf{A} \mathbf{x} + \mathbf{B} \mathbf{u} \\
\mathbf{y} &= \mathbf{C} \mathbf{x} + \mathbf{D} \mathbf{u}
\end{aligned}
$$

Where:
- $\mathbf{x} \in \mathbb{R}^n$: State vector (positions, velocities)
- $\mathbf{u} \in \mathbb{R}^m$: Control input (torques)
- $\mathbf{y} \in \mathbb{R}^p$: Output (measurements)
- $\mathbf{A}, \mathbf{B}, \mathbf{C}, \mathbf{D}$: System matrices

**Example - Single Joint** (motor-driven):

$$
\begin{bmatrix} \dot{q} \\ \ddot{q} \end{bmatrix} = \begin{bmatrix} 0 & 1 \\ 0 & -b/J \end{bmatrix} \begin{bmatrix} q \\ \dot{q} \end{bmatrix} + \begin{bmatrix} 0 \\ 1/J \end{bmatrix} \tau
$$

Where $J$ is inertia and $b$ is friction.

### Controllability and Observability

**Controllability**: Can we drive the system to any state using $\mathbf{u}$?

$$
\text{rank}(\mathcal{C}) = n, \quad \mathcal{C} = [\mathbf{B} \ \mathbf{AB} \ \mathbf{A}^2 \mathbf{B} \ \cdots \ \mathbf{A}^{n-1} \mathbf{B}]
$$

**Observability**: Can we reconstruct $\mathbf{x}$ from $\mathbf{y}$?

$$
\text{rank}(\mathcal{O}) = n, \quad \mathcal{O} = \begin{bmatrix} \mathbf{C} \\ \mathbf{CA} \\ \mathbf{CA}^2 \\ \vdots \\ \mathbf{CA}^{n-1} \end{bmatrix}
$$

```python
import numpy as np
from scipy.linalg import matrix_rank

def check_controllability(A, B):
    """Check if (A, B) is controllable."""
    n = A.shape[0]
    C = B
    for i in range(1, n):
        C = np.hstack([C, np.linalg.matrix_power(A, i) @ B])
    return matrix_rank(C) == n

def check_observability(A, C):
    """Check if (A, C) is observable."""
    n = A.shape[0]
    O = C
    for i in range(1, n):
        O = np.vstack([O, C @ np.linalg.matrix_power(A, i)])
    return matrix_rank(O) == n
```

### State Feedback Control

**Linear controller**:

$$
\mathbf{u} = -\mathbf{K} \mathbf{x}
$$

Closed-loop dynamics:

$$
\dot{\mathbf{x}} = (\mathbf{A} - \mathbf{B} \mathbf{K}) \mathbf{x}
$$

**Pole placement**: Choose $\mathbf{K}$ to place eigenvalues of $(\mathbf{A} - \mathbf{B} \mathbf{K})$ at desired locations.

```python
from scipy.signal import place_poles

def design_state_feedback(A, B, desired_poles):
    """
    Design state feedback controller K for desired closed-loop poles.

    Args:
        A: State matrix (n x n)
        B: Input matrix (n x m)
        desired_poles: List of desired eigenvalues

    Returns:
        K: Feedback gain matrix (m x n)
    """
    result = place_poles(A, B, desired_poles)
    K = result.gain_matrix
    return K

# Example: single joint
A = np.array([[0, 1], [0, -0.1]])
B = np.array([[0], [1]])

# Place poles at -2, -3 (stable, fast convergence)
K = design_state_feedback(A, B, [-2, -3])
print("Feedback gain K:", K)
```

---

## Linear Quadratic Regulator (LQR)

### Optimal Control Problem

Minimize the cost function:

$$
J = \int_0^{\infty} (\mathbf{x}^T \mathbf{Q} \mathbf{x} + \mathbf{u}^T \mathbf{R} \mathbf{u}) dt
$$

Where:
- $\mathbf{Q} \geq 0$: State cost matrix (penalizes deviation from origin)
- $\mathbf{R} > 0$: Control cost matrix (penalizes control effort)

**Solution**: Optimal control is linear state feedback:

$$
\mathbf{u}^* = -\mathbf{K} \mathbf{x}, \quad \mathbf{K} = \mathbf{R}^{-1} \mathbf{B}^T \mathbf{P}
$$

Where $\mathbf{P}$ solves the **Algebraic Riccati Equation** (ARE):

$$
\mathbf{A}^T \mathbf{P} + \mathbf{P} \mathbf{A} - \mathbf{P} \mathbf{B} \mathbf{R}^{-1} \mathbf{B}^T \mathbf{P} + \mathbf{Q} = 0
$$

### LQR Implementation

```python
from scipy.linalg import solve_continuous_are

def lqr_controller(A, B, Q, R):
    """
    Compute LQR optimal feedback gain.

    Args:
        A: State matrix (n x n)
        B: Input matrix (n x m)
        Q: State cost matrix (n x n), Q >= 0
        R: Control cost matrix (m x m), R > 0

    Returns:
        K: Optimal feedback gain (m x n)
        P: Solution to Riccati equation
    """
    # Solve Riccati equation
    P = solve_continuous_are(A, B, Q, R)

    # Compute optimal gain
    K = np.linalg.inv(R) @ B.T @ P

    return K, P

# Example: control a 2-joint arm (linearized around equilibrium)
n_states = 4  # [q1, q2, qd1, qd2]
n_controls = 2  # [tau1, tau2]

A = np.array([
    [0, 0, 1, 0],
    [0, 0, 0, 1],
    [0, 0, -0.1, 0],
    [0, 0, 0, -0.1]
])

B = np.array([
    [0, 0],
    [0, 0],
    [1, 0],
    [0, 1]
])

# Cost matrices
Q = np.diag([100, 100, 1, 1])  # Heavily penalize position error
R = np.eye(2) * 0.01             # Small control cost

K_lqr, P = lqr_controller(A, B, Q, R)
print("LQR gain:\n", K_lqr)

# Apply controller
x = np.array([0.1, 0.2, 0, 0])  # Current state
u = -K_lqr @ x  # Control input
print("Control torques:", u)
```

### Tracking Control with LQR

For trajectory tracking (not just regulation to origin):

$$
\tilde{\mathbf{x}} = \mathbf{x} - \mathbf{x}_d(t), \quad \mathbf{u} = \mathbf{u}_d(t) - \mathbf{K} \tilde{\mathbf{x}}
$$

Where $\mathbf{u}_d(t)$ is the feedforward control (from inverse dynamics).

```python
def lqr_tracking(x, x_des, u_des, K_lqr):
    """
    LQR controller for trajectory tracking.

    Args:
        x: Current state
        x_des: Desired state
        u_des: Feedforward control (inverse dynamics)
        K_lqr: LQR feedback gain

    Returns:
        u: Control input
    """
    x_error = x - x_des
    u = u_des - K_lqr @ x_error
    return u
```

---

## Model Predictive Control (MPC)

### Concept

MPC solves an **online optimization problem** at each time step:

$$
\min_{\mathbf{u}_0, \ldots, \mathbf{u}_{N-1}} \sum_{k=0}^{N-1} (\mathbf{x}_k^T \mathbf{Q} \mathbf{x}_k + \mathbf{u}_k^T \mathbf{R} \mathbf{u}_k) + \mathbf{x}_N^T \mathbf{Q}_f \mathbf{x}_N
$$

Subject to:
- Dynamics: $\mathbf{x}_{k+1} = \mathbf{A} \mathbf{x}_k + \mathbf{B} \mathbf{u}_k$
- Constraints: $\mathbf{u}_{min} \leq \mathbf{u}_k \leq \mathbf{u}_{max}$, $\mathbf{x}_{min} \leq \mathbf{x}_k \leq \mathbf{x}_{max}$

**Advantages**:
- Handles constraints (joint limits, torque limits)
- Predicts future behavior (anticipatory control)
- Optimizes over finite horizon

### MPC Implementation

```python
import cvxpy as cp

def mpc_controller(A, B, Q, R, N, x0, x_ref, u_min, u_max):
    """
    Model Predictive Control with constraints.

    Args:
        A, B: Discrete-time system matrices
        Q, R: Cost matrices
        N: Prediction horizon
        x0: Initial state
        x_ref: Reference trajectory (N+1 x n)
        u_min, u_max: Control bounds

    Returns:
        u_opt: Optimal control sequence (N x m)
    """
    n = A.shape[0]
    m = B.shape[1]

    # Decision variables
    x = cp.Variable((N+1, n))
    u = cp.Variable((N, m))

    # Cost function
    cost = 0
    for k in range(N):
        cost += cp.quad_form(x[k] - x_ref[k], Q) + cp.quad_form(u[k], R)
    cost += cp.quad_form(x[N] - x_ref[N], Q)  # Terminal cost

    # Constraints
    constraints = [x[0] == x0]
    for k in range(N):
        constraints += [
            x[k+1] == A @ x[k] + B @ u[k],  # Dynamics
            u_min <= u[k], u[k] <= u_max     # Input bounds
        ]

    # Solve optimization problem
    problem = cp.Problem(cp.Minimize(cost), constraints)
    problem.solve(solver=cp.OSQP, warm_start=True)

    return u.value

# Example: control a robot with torque limits
dt = 0.05  # Time step
A_d = np.eye(4) + A * dt  # Discretize (Euler method)
B_d = B * dt

N = 20  # Prediction horizon (1 second)
x0 = np.array([0.5, 0.3, 0, 0])  # Initial state
x_ref = np.zeros((N+1, 4))       # Regulate to origin

u_min = np.array([-10, -10])  # Torque limits (Nm)
u_max = np.array([10, 10])

u_opt = mpc_controller(A_d, B_d, Q, R, N, x0, x_ref, u_min, u_max)
print("First control input:", u_opt[0])
```

**Receding Horizon**: Apply only $\mathbf{u}_0$, then re-solve at next time step.

---

## Adaptive Control

### Problem Statement

When robot parameters (masses, inertias) are uncertain, fixed controllers may perform poorly. **Adaptive control** adjusts gains online based on observed behavior.

### Model Reference Adaptive Control (MRAC)

**Idea**: Make the system behave like a reference model with known dynamics.

**Reference model**:

$$
\dot{\mathbf{x}}_m = \mathbf{A}_m \mathbf{x}_m + \mathbf{B}_m \mathbf{r}
$$

**Actual system**:

$$
\dot{\mathbf{x}} = \mathbf{A} \mathbf{x} + \mathbf{B} (\mathbf{u} + \Delta)
$$

Where $\Delta$ is the uncertainty.

**Adaptive law** (adjusts controller $\mathbf{K}(t)$):

$$
\dot{\mathbf{K}} = -\Gamma \mathbf{x} (\mathbf{x} - \mathbf{x}_m)^T \mathbf{P} \mathbf{B}
$$

Where $\Gamma > 0$ is the adaptation rate and $\mathbf{P}$ solves a Lyapunov equation.

```python
class MRACController:
    def __init__(self, A_m, B_m, Gamma, dt):
        self.A_m = A_m
        self.B_m = B_m
        self.Gamma = Gamma
        self.dt = dt

        n = A_m.shape[0]
        m = B_m.shape[1]
        self.K = np.zeros((m, n))  # Adaptive gain (initialized to zero)
        self.x_m = np.zeros(n)     # Reference model state

    def update(self, x, r):
        """
        Compute control and update adaptive gains.

        Args:
            x: Current system state
            r: Reference input

        Returns:
            u: Control input
        """
        # Update reference model
        x_m_dot = self.A_m @ self.x_m + self.B_m @ r
        self.x_m += x_m_dot * self.dt

        # Tracking error
        e = x - self.x_m

        # Control law
        u = -self.K @ x + r

        # Adaptation law (gradient descent)
        K_dot = -self.Gamma * np.outer(u, e)
        self.K += K_dot * self.dt

        return u
```

---

## Advanced Topics

### Sliding Mode Control

**Robust** to uncertainties and disturbances. Drives system to a **sliding surface** $s(\mathbf{x}) = 0$.

$$
s = \dot{\tilde{q}} + \lambda \tilde{q}, \quad u = u_{eq} + u_{sw}
$$

Where:
- $u_{eq}$: Equivalent control (nominal)
- $u_{sw} = -K \text{sign}(s)$: Switching control (discontinuous)

**Drawback**: Chattering (high-frequency switching) → use boundary layer.

### Computed Torque Control

**Feedback linearization** using inverse dynamics:

$$
\tau = \mathbf{M}(\mathbf{q}) (\ddot{\mathbf{q}}_d + \mathbf{K}_p (\mathbf{q}_d - \mathbf{q}) + \mathbf{K}_d (\dot{\mathbf{q}}_d - \dot{\mathbf{q}})) + \mathbf{C}(\mathbf{q}, \dot{\mathbf{q}}) \dot{\mathbf{q}} + \mathbf{G}(\mathbf{q})
$$

Linearizes the closed-loop dynamics to double integrator:

$$
\ddot{\tilde{\mathbf{q}}} + \mathbf{K}_d \dot{\tilde{\mathbf{q}}} + \mathbf{K}_p \tilde{\mathbf{q}} = 0
$$

```python
def computed_torque_control(q, qd, q_des, qd_des, qdd_des, Kp, Kd, robot_params):
    """
    Computed torque control (feedback linearization).
    """
    # Compute dynamics terms
    M = compute_mass_matrix(q, robot_params)
    C = compute_coriolis_matrix(q, qd, robot_params)
    G = compute_gravity_vector(q, robot_params)

    # Tracking errors
    e = q_des - q
    ed = qd_des - qd

    # Linearizing feedback
    v = qdd_des + Kp @ e + Kd @ ed

    # Torque command
    tau = M @ v + C @ qd + G

    return tau
```

---

## Case Study: Quadrotor Attitude Control

**Model** (simplified):

$$
\mathbf{I} \dot{\boldsymbol{\omega}} = \boldsymbol{\tau} - \boldsymbol{\omega} \times (\mathbf{I} \boldsymbol{\omega})
$$

Where $\mathbf{I}$ is the inertia matrix and $\boldsymbol{\omega}$ is angular velocity.

**Cascaded PID**:
1. **Outer loop**: Position → desired roll/pitch/yaw
2. **Inner loop**: Attitude → motor thrusts

```python
def quadrotor_attitude_control(omega, omega_des, Kp, Kd):
    """
    PD control for quadrotor attitude stabilization.
    """
    omega_error = omega_des - omega
    tau = Kp @ omega_error - Kd @ omega  # PD (no integral needed)
    return tau
```

---

## Summary

**Key Takeaways**:

1. **PID control**: Simple, effective, industry standard (tune with Ziegler-Nichols or manual methods)
2. **State-space**: Enables systematic analysis (controllability, observability, pole placement)
3. **LQR**: Optimal for unconstrained linear systems (minimizes quadratic cost)
4. **MPC**: Handles constraints, predicts future behavior (computational cost)
5. **Adaptive control**: Adjusts to uncertain parameters online
6. **Computed torque**: Linearizes nonlinear dynamics (model-dependent)

**Practical Guidelines**:
- Start with PID for simple tasks
- Use LQR for systems with good models
- Use MPC when constraints are critical
- Use adaptive methods when parameters vary significantly

---

## Exercises

1. **PID Tuning**: Implement the `PIDController` class. Simulate a second-order system (mass-spring-damper) and tune gains to achieve 5% overshoot and 1-second settling time.

2. **Pole Placement**: Design a state feedback controller for the single-joint system:
   $$
   A = \begin{bmatrix} 0 & 1 \\ 0 & -0.5 \end{bmatrix}, \quad B = \begin{bmatrix} 0 \\ 2 \end{bmatrix}
   $$
   Place poles at $-2 \pm 2j$ (damped oscillation). Simulate closed-loop response.

3. **LQR vs PID**: Compare LQR and PID controllers for a 2-link arm. Use $Q = \text{diag}(100, 100, 1, 1)$, $R = 0.01 I$. Which achieves better tracking with less control effort?

4. **MPC with Constraints**: Implement MPC for a robot with torque limits $|\tau| \leq 5$ Nm. Generate a trajectory that violates these limits without MPC. Show that MPC respects constraints.

5. **Adaptive Control**: Simulate MRAC for a system with unknown damping coefficient. Start with $b = 0.1$, but actual value is $b = 0.5$. Show that adaptive gains converge to compensate for the mismatch.

---

## Further Reading

- **Books**:
  - Åström, K.J., Murray, R.M. *Feedback Systems: An Introduction for Scientists and Engineers* (2008)
  - Ogata, K. *Modern Control Engineering* (2009)
  - Siciliano, B., et al. *Robotics: Modelling, Planning and Control* (2010)

- **Papers**:
  - Kalman, R.E. "A New Approach to Linear Filtering and Prediction Problems" (1960)
  - Mayne, D.Q., et al. "Constrained Model Predictive Control" (2000)
  - Slotine, J.J., Li, W. "On the Adaptive Control of Robot Manipulators" (1987)

- **Software**:
  - **Python Control Systems Library**: LQR, pole placement
  - **CVXPY**: Convex optimization for MPC
  - **Drake**: Model-based control and trajectory optimization
