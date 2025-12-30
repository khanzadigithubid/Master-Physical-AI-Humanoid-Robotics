---
sidebar_position: 1
title: Robot Kinematics
---

# Robot Kinematics

## Introduction

**Kinematics** studies the geometry of motion without considering forces. For robots, kinematics answers two fundamental questions:

1. **Forward Kinematics**: Given joint angles, where is the end-effector?
2. **Inverse Kinematics**: Given a desired end-effector pose, what joint angles achieve it?

This chapter develops the mathematical framework for robot kinematics, focusing on serial manipulators (robotic arms).

---

## Coordinate Frames and Transformations

### Homogeneous Transformations

A **rigid body transformation** combines rotation $R \in SO(3)$ and translation $\mathbf{t} \in \mathbb{R}^3$:

$$
T = \begin{bmatrix}
R & \mathbf{t} \\
\mathbf{0}^T & 1
\end{bmatrix} \in SE(3)
$$

Where $SE(3)$ is the **Special Euclidean Group** (3D rigid transformations).

**Example**: Transform from frame $B$ to frame $A$:

$$
{}^A T_B = \begin{bmatrix}
\cos\theta & -\sin\theta & 0 & x \\
\sin\theta & \cos\theta & 0 & y \\
0 & 0 & 1 & z \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

This rotates by $\theta$ about $z$-axis and translates by $(x, y, z)$.

### Chain of Transformations

For a robot with $n$ joints, the end-effector pose in world frame:

$$
{}^0 T_n = {}^0 T_1 \cdot {}^1 T_2 \cdot \ldots \cdot {}^{n-1} T_n
$$

Each ${}^{i-1} T_i$ depends on joint variable $q_i$.

---

## Forward Kinematics

### Denavit-Hartenberg (DH) Parameters

**DH convention** describes each joint with 4 parameters:

| Parameter | Description |
|-----------|-------------|
| $a_i$ | Link length (distance along $x_i$) |
| $\alpha_i$ | Link twist (rotation about $x_i$) |
| $d_i$ | Link offset (distance along $z_{i-1}$) |
| $\theta_i$ | Joint angle (rotation about $z_{i-1}$) |

**Transformation matrix**:

$$
{}^{i-1} T_i = \begin{bmatrix}
\cos\theta_i & -\sin\theta_i\cos\alpha_i & \sin\theta_i\sin\alpha_i & a_i\cos\theta_i \\
\sin\theta_i & \cos\theta_i\cos\alpha_i & -\cos\theta_i\sin\alpha_i & a_i\sin\theta_i \\
0 & \sin\alpha_i & \cos\alpha_i & d_i \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

### Example: 2-Link Planar Arm

**Setup**:
- Link 1: Length $L_1$, revolute joint $\theta_1$
- Link 2: Length $L_2$, revolute joint $\theta_2$

**DH Table**:

| Joint | $a$ | $\alpha$ | $d$ | $\theta$ |
|-------|-----|----------|-----|----------|
| 1 | $L_1$ | 0 | 0 | $\theta_1$ |
| 2 | $L_2$ | 0 | 0 | $\theta_2$ |

**Forward Kinematics**:

$$
x = L_1\cos\theta_1 + L_2\cos(\theta_1 + \theta_2)
$$

$$
y = L_1\sin\theta_1 + L_2\sin(\theta_1 + \theta_2)
$$

**Python Implementation**:

```python
import numpy as np

def forward_kinematics_2link(theta1, theta2, L1=1.0, L2=1.0):
    """
    Compute end-effector position for 2-link planar arm.

    Args:
        theta1: Joint 1 angle (radians)
        theta2: Joint 2 angle (radians)
        L1: Length of link 1
        L2: Length of link 2

    Returns:
        (x, y): End-effector position
    """
    x = L1 * np.cos(theta1) + L2 * np.cos(theta1 + theta2)
    y = L1 * np.sin(theta1) + L2 * np.sin(theta1 + theta2)

    return x, y

# Example
x, y = forward_kinematics_2link(theta1=np.pi/4, theta2=np.pi/4)
print(f"End-effector position: ({x:.3f}, {y:.3f})")
```

---

## Inverse Kinematics

### Analytical Solution (2-Link Arm)

**Problem**: Given $(x, y)$, find $(\theta_1, \theta_2)$.

**Approach**: Use **law of cosines**.

**Step 1**: Compute $\theta_2$:

$$
\cos\theta_2 = \frac{x^2 + y^2 - L_1^2 - L_2^2}{2L_1 L_2}
$$

$$
\theta_2 = \pm \arccos\left(\frac{x^2 + y^2 - L_1^2 - L_2^2}{2L_1 L_2}\right)
$$

Two solutions: **elbow up** (+) and **elbow down** (−).

**Step 2**: Compute $\theta_1$:

$$
\theta_1 = \arctan2(y, x) - \arctan2(L_2\sin\theta_2, L_1 + L_2\cos\theta_2)
$$

**Python Implementation**:

```python
def inverse_kinematics_2link(x, y, L1=1.0, L2=1.0, elbow_up=True):
    """
    Compute joint angles for 2-link planar arm (analytical IK).

    Args:
        x, y: Desired end-effector position
        L1, L2: Link lengths
        elbow_up: If True, use elbow-up solution

    Returns:
        (theta1, theta2): Joint angles (radians)
    """
    # Check if target is reachable
    distance = np.sqrt(x**2 + y**2)
    if distance > (L1 + L2) or distance < abs(L1 - L2):
        raise ValueError("Target out of reach")

    # Compute theta2
    cos_theta2 = (x**2 + y**2 - L1**2 - L2**2) / (2 * L1 * L2)
    cos_theta2 = np.clip(cos_theta2, -1, 1)  # Numerical stability

    if elbow_up:
        theta2 = np.arccos(cos_theta2)
    else:
        theta2 = -np.arccos(cos_theta2)

    # Compute theta1
    k1 = L1 + L2 * np.cos(theta2)
    k2 = L2 * np.sin(theta2)
    theta1 = np.arctan2(y, x) - np.arctan2(k2, k1)

    return theta1, theta2

# Example
theta1, theta2 = inverse_kinematics_2link(x=1.5, y=0.5)
print(f"Joint angles: theta1={np.degrees(theta1):.1f}°, theta2={np.degrees(theta2):.1f}°")
```

### Numerical Solution (Jacobian-Based)

For robots where analytical IK is intractable (e.g., 7-DOF arms), use **iterative methods**.

**Approach**: Linearize FK around current configuration.

**Jacobian Matrix** $J(q)$:

$$
\dot{\mathbf{x}} = J(q) \dot{\mathbf{q}}
$$

Where:
- $\dot{\mathbf{x}} \in \mathbb{R}^6$: End-effector velocity (linear + angular)
- $\dot{\mathbf{q}} \in \mathbb{R}^n$: Joint velocities

**Inverse Velocity**:

$$
\dot{\mathbf{q}} = J(q)^{-1} \dot{\mathbf{x}}
$$

For redundant robots ($n > 6$), use **pseudoinverse**:

$$
\dot{\mathbf{q}} = J(q)^+ \dot{\mathbf{x}}
$$

Where $J^+ = J^T(JJ^T)^{-1}$ (**Moore-Penrose inverse**).

**Iterative IK Algorithm**:

```python
def inverse_kinematics_numerical(target_pose, initial_q, forward_kin, jacobian, max_iter=100, tol=1e-3):
    """
    Numerical IK using Jacobian pseudoinverse.

    Args:
        target_pose: Desired end-effector pose [x, y, z, ...]
        initial_q: Initial joint configuration
        forward_kin: Function q -> pose
        jacobian: Function q -> J(q)
        max_iter: Maximum iterations
        tol: Convergence tolerance

    Returns:
        q: Joint configuration achieving target_pose
    """
    q = initial_q.copy()

    for i in range(max_iter):
        # Compute current pose
        current_pose = forward_kin(q)

        # Error
        error = target_pose - current_pose

        # Check convergence
        if np.linalg.norm(error) < tol:
            print(f"Converged in {i} iterations")
            return q

        # Compute Jacobian
        J = jacobian(q)

        # Pseudoinverse
        J_pinv = np.linalg.pinv(J)

        # Update
        dq = J_pinv @ error
        q = q + 0.1 * dq  # Step size 0.1

    print("Warning: Did not converge")
    return q
```

---

## Jacobian Matrix

### Definition

The **Jacobian** $J(q) \in \mathbb{R}^{6 \times n}$ maps joint velocities to end-effector velocities:

$$
\begin{bmatrix} \mathbf{v} \\ \omega \end{bmatrix} = J(q) \dot{\mathbf{q}}
$$

Where:
- $\mathbf{v} \in \mathbb{R}^3$: Linear velocity
- $\omega \in \mathbb{R}^3$: Angular velocity

### Computation

For a serial manipulator, the $i$-th column of $J$ corresponds to joint $i$:

**Revolute joint**:
$$
J_i = \begin{bmatrix}
\mathbf{z}_i \times (\mathbf{p}_n - \mathbf{p}_i) \\
\mathbf{z}_i
\end{bmatrix}
$$

**Prismatic joint**:
$$
J_i = \begin{bmatrix}
\mathbf{z}_i \\
\mathbf{0}
\end{bmatrix}
$$

Where:
- $\mathbf{z}_i$: Joint axis direction
- $\mathbf{p}_i$: Joint position
- $\mathbf{p}_n$: End-effector position

### Singularities

**Singularity**: Configuration where $\det(J) = 0$.

At singularities:
- Robot loses DOF (cannot move in certain directions)
- Infinite joint velocities required for finite end-effector velocity

**Example**: 2-link arm is singular when fully extended ($\theta_2 = 0$).

**Detection**:
```python
def is_singular(J, threshold=0.01):
    """Check if Jacobian is near singular."""
    return np.linalg.det(J @ J.T) < threshold
```

---

## Velocity Kinematics

### Differential Kinematics

Given desired end-effector velocity $\dot{\mathbf{x}}_{\text{des}}$, compute joint velocities:

$$
\dot{\mathbf{q}} = J(q)^+ \dot{\mathbf{x}}_{\text{des}}
$$

**Resolved-Rate Motion Control**:

```python
def resolved_rate_control(current_q, target_pose, forward_kin, jacobian, dt=0.01):
    """
    Move end-effector toward target using resolved-rate control.

    Args:
        current_q: Current joint configuration
        target_pose: Desired end-effector pose
        forward_kin: FK function
        jacobian: Jacobian function
        dt: Timestep

    Returns:
        new_q: Updated joint configuration
    """
    current_pose = forward_kin(current_q)
    error = target_pose - current_pose

    # Desired velocity (proportional control)
    K = 1.0  # Gain
    x_dot_des = K * error

    # Compute joint velocities
    J = jacobian(current_q)
    J_pinv = np.linalg.pinv(J)
    q_dot = J_pinv @ x_dot_des

    # Integrate
    new_q = current_q + q_dot * dt

    return new_q
```

---

## Case Study: Universal Robots UR5

**UR5** is a 6-DOF collaborative robot arm widely used in industry.

**DH Parameters**:

| Joint | $a$ (m) | $\alpha$ (rad) | $d$ (m) | $\theta$ (rad) |
|-------|---------|----------------|---------|----------------|
| 1 | 0 | π/2 | 0.089159 | $\theta_1$ |
| 2 | -0.425 | 0 | 0 | $\theta_2$ |
| 3 | -0.39225 | 0 | 0 | $\theta_3$ |
| 4 | 0 | π/2 | 0.10915 | $\theta_4$ |
| 5 | 0 | -π/2 | 0.09465 | $\theta_5$ |
| 6 | 0 | 0 | 0.0823 | $\theta_6$ |

**Implementation**:

```python
def ur5_forward_kinematics(q):
    """
    Compute forward kinematics for UR5 robot.

    Args:
        q: Joint angles [q1, q2, q3, q4, q5, q6] (radians)

    Returns:
        T: 4x4 homogeneous transformation matrix
    """
    # DH parameters
    a = [0, -0.425, -0.39225, 0, 0, 0]
    d = [0.089159, 0, 0, 0.10915, 0.09465, 0.0823]
    alpha = [np.pi/2, 0, 0, np.pi/2, -np.pi/2, 0]

    T = np.eye(4)

    for i in range(6):
        # DH transformation
        ct, st = np.cos(q[i]), np.sin(q[i])
        ca, sa = np.cos(alpha[i]), np.sin(alpha[i])

        T_i = np.array([
            [ct, -st*ca, st*sa, a[i]*ct],
            [st, ct*ca, -ct*sa, a[i]*st],
            [0, sa, ca, d[i]],
            [0, 0, 0, 1]
        ])

        T = T @ T_i

    return T

# Test
q_home = [0, -np.pi/2, np.pi/2, -np.pi/2, -np.pi/2, 0]
T = ur5_forward_kinematics(q_home)
print("End-effector pose:")
print(T)
```

---

## Summary

This chapter introduced robot kinematics:

- **Forward Kinematics**: $q \rightarrow x$ using DH parameters
- **Inverse Kinematics**: $x \rightarrow q$ (analytical or numerical)
- **Jacobian**: Maps $\dot{q} \rightarrow \dot{x}$, enables velocity control
- **Singularities**: Configurations where robot loses mobility

These tools enable motion planning and control for robotic manipulators.

---

## Key Takeaways

✅ Forward kinematics transforms joint angles to end-effector pose via homogeneous transformations

✅ Inverse kinematics can be solved analytically (simple robots) or numerically (Jacobian-based)

✅ The Jacobian matrix relates joint velocities to end-effector velocities

✅ Singularities occur when $\det(J) = 0$, causing loss of DOF

---

## Exercises

**Exercise 1**: Compute forward kinematics for a 3-link planar arm with $L_1 = L_2 = L_3 = 1$ m and $\theta_1 = \theta_2 = \theta_3 = 30°$.

**Exercise 2**: Implement analytical IK for the 3-link arm (hint: use geometry to solve for $\theta_3$ first).

**Exercise 3**: Compute the Jacobian for the 2-link planar arm at $\theta_1 = \theta_2 = \pi/4$.

**Exercise 4**: Simulate resolved-rate control to move the 2-link arm's end-effector in a circular trajectory.

---

**Next Chapter**: [Dynamics](./dynamics.md) - Equations of motion and forward dynamics
