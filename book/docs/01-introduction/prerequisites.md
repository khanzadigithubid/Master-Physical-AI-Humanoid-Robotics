---
sidebar_position: 4
title: Prerequisites
---

# Prerequisites

## Mathematics & Programming Foundations

This chapter provides a quick refresher on essential concepts. If you're comfortable with linear algebra, calculus, probability, and Python, you can skip to [Module 2](../02-robotics-fundamentals/kinematics.md).

---

## Linear Algebra

### Vectors and Matrices

**Vectors** represent positions, velocities, forces:

$$
\mathbf{v} = \begin{bmatrix} v_1 \\ v_2 \\ v_3 \end{bmatrix} \in \mathbb{R}^3
$$

**Matrices** represent transformations (rotations, projections):

$$
A = \begin{bmatrix}
a_{11} & a_{12} \\
a_{21} & a_{22}
\end{bmatrix} \in \mathbb{R}^{2 \times 2}
$$

**Matrix-vector multiplication**:

$$
A\mathbf{v} = \begin{bmatrix}
a_{11}v_1 + a_{12}v_2 \\
a_{21}v_1 + a_{22}v_2
\end{bmatrix}
$$

### Key Operations

- **Transpose**: $A^T$, swap rows and columns
- **Inverse**: $A^{-1}$, satisfies $AA^{-1} = I$
- **Determinant**: $\det(A)$, scales volume
- **Eigenvalues/eigenvectors**: $A\mathbf{v} = \lambda \mathbf{v}$

### Robotics Applications

- **Rotation matrices**: $R \in SO(3)$ (special orthogonal group)
- **Jacobians**: Relate joint velocities to end-effector velocity
- **Inertia matrices**: $M(q)$ in dynamics equations

**Python Example**:
```python
import numpy as np

# Rotation matrix (90° about z-axis)
R_z = np.array([
    [0, -1, 0],
    [1,  0, 0],
    [0,  0, 1]
])

# Apply rotation to vector
v = np.array([1, 0, 0])
v_rotated = R_z @ v  # Result: [0, 1, 0]
```

---

## Calculus

### Derivatives

**Derivative** measures rate of change:

$$
f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$

**Gradient** for multivariable functions:

$$
\nabla f(x_1, x_2) = \begin{bmatrix}
\frac{\partial f}{\partial x_1} \\
\frac{\partial f}{\partial x_2}
\end{bmatrix}
$$

### Optimization

Find $\mathbf{x}^*$ that minimizes $f(\mathbf{x})$:

$$
\mathbf{x}^* = \arg\min_{\mathbf{x}} f(\mathbf{x})
$$

**Gradient descent**:

$$
\mathbf{x}_{t+1} = \mathbf{x}_t - \alpha \nabla f(\mathbf{x}_t)
$$

### Robotics Applications

- **Inverse kinematics**: Solve for joint angles via optimization
- **Trajectory optimization**: Find smooth paths
- **Neural network training**: Backpropagation is gradient descent

**Python Example**:
```python
import torch

# Define loss function
def loss(x):
    return (x - 3)**2 + 5

# Optimize with gradient descent
x = torch.tensor([0.0], requires_grad=True)
optimizer = torch.optim.SGD([x], lr=0.1)

for _ in range(100):
    l = loss(x)
    l.backward()
    optimizer.step()
    optimizer.zero_grad()

print(f"Optimal x: {x.item()}")  # Should be close to 3.0
```

---

## Probability

### Random Variables

**Discrete**: $P(X = x)$ (e.g., dice roll)

**Continuous**: $p(x)$ probability density function

**Expectation**:

$$
\mathbb{E}[X] = \sum_x x P(X=x) \quad \text{or} \quad \int x p(x) dx
$$

### Gaussian Distribution

Most important distribution in robotics:

$$
p(x) = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)
$$

Notation: $X \sim \mathcal{N}(\mu, \sigma^2)$

**Multivariate Gaussian**:

$$
p(\mathbf{x}) = \frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}} \exp\left(-\frac{1}{2}(\mathbf{x}-\mu)^T \Sigma^{-1} (\mathbf{x}-\mu)\right)
$$

### Bayes' Rule

Update beliefs given observations:

$$
p(x \mid y) = \frac{p(y \mid x) p(x)}{p(y)}
$$

### Robotics Applications

- **Sensor noise**: Modeled as Gaussian
- **Kalman filters**: Optimal state estimation under Gaussian assumptions
- **Localization**: Bayesian filtering for robot position

**Python Example**:
```python
import numpy as np

# Generate Gaussian noise
mean = 0.0
std = 0.1
noise = np.random.normal(mean, std, size=1000)

# Verify mean and std
print(f"Sample mean: {noise.mean():.3f}")  # Should be ~0
print(f"Sample std: {noise.std():.3f}")    # Should be ~0.1
```

---

## Python Programming

### Essential Libraries

**NumPy**: Numerical computing
```python
import numpy as np

# Create array
a = np.array([1, 2, 3])

# Operations
b = np.sin(a)
c = a @ a.T  # Dot product
```

**Matplotlib**: Plotting
```python
import matplotlib.pyplot as plt

x = np.linspace(0, 2*np.pi, 100)
y = np.sin(x)

plt.plot(x, y)
plt.title("Sine Wave")
plt.show()
```

**PyTorch**: Deep learning
```python
import torch
import torch.nn as nn

# Define neural network
model = nn.Sequential(
    nn.Linear(10, 64),
    nn.ReLU(),
    nn.Linear(64, 1)
)

# Forward pass
x = torch.randn(32, 10)  # Batch of 32
y = model(x)
```

---

## ROS 2 Basics

**ROS 2** (Robot Operating System 2) is the standard middleware for robotics.

### Core Concepts

**Nodes**: Independent processes (e.g., camera driver, planner)

**Topics**: Message passing (publish/subscribe)

**Services**: Request/response (e.g., "compute inverse kinematics")

**Actions**: Long-running tasks with feedback (e.g., "move to goal")

### Example: Publisher/Subscriber

**Publisher**:
```python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class Publisher(Node):
    def __init__(self):
        super().__init__('publisher')
        self.pub = self.create_publisher(String, 'topic', 10)
        self.timer = self.create_timer(1.0, self.publish)

    def publish(self):
        msg = String()
        msg.data = 'Hello, ROS 2!'
        self.pub.publish(msg)

rclpy.init()
node = Publisher()
rclpy.spin(node)
```

**Subscriber**:
```python
class Subscriber(Node):
    def __init__(self):
        super().__init__('subscriber')
        self.sub = self.create_subscription(String, 'topic', self.callback, 10)

    def callback(self, msg):
        self.get_logger().info(f'Received: {msg.data}')

rclpy.init()
node = Subscriber()
rclpy.spin(node)
```

---

## Software Setup

### Installation Guide (Ubuntu 22.04)

**1. Install Python 3.10+**
```bash
sudo apt update
sudo apt install python3.10 python3-pip
```

**2. Install PyTorch**
```bash
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**3. Install ROS 2 Humble**
```bash
sudo apt install software-properties-common
sudo add-apt-repository universe
sudo apt update && sudo apt install curl -y
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.asc | sudo apt-key add -
sudo sh -c 'echo "deb http://packages.ros.org/ros2/ubuntu jammy main" > /etc/apt/sources.list.d/ros2-latest.list'
sudo apt update
sudo apt install ros-humble-desktop
```

**4. Install MuJoCo**
```bash
pip3 install mujoco
```

**5. Verify Installation**
```python
import torch
import mujoco
import rclpy

print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"MuJoCo version: {mujoco.__version__}")
```

---

## Recommended Background Reading

If you need deeper review:

### Linear Algebra
- **Book**: "Introduction to Linear Algebra" by Gilbert Strang
- **Video**: MIT 18.06 (free on OCW)

### Calculus
- **Book**: "Calculus" by James Stewart
- **Video**: 3Blue1Brown "Essence of Calculus" (YouTube)

### Probability
- **Book**: "Introduction to Probability" by Blitzstein & Hwang
- **Video**: Harvard STAT 110 (free on YouTube)

### Python
- **Tutorial**: [Real Python](https://realpython.com/)
- **Book**: "Fluent Python" by Luciano Ramalho

### ROS 2
- **Official Tutorials**: [docs.ros.org](https://docs.ros.org/en/humble/Tutorials.html)
- **Book**: "A Gentle Introduction to ROS" by Jason O'Kane

---

## Self-Assessment Quiz

Test your readiness:

**Question 1**: What is the result of this matrix multiplication?

$$
\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}
\begin{bmatrix} 5 \\ 6 \end{bmatrix} = ?
$$

**Question 2**: Compute the gradient of $f(x, y) = x^2 + 3xy + y^2$.

**Question 3**: If $X \sim \mathcal{N}(5, 4)$, what is $P(3 < X < 7)$?

**Question 4**: Write Python code to compute the inverse of a $3 \times 3$ matrix using NumPy.

**Question 5**: In ROS 2, what's the difference between a topic and a service?

<details>
<summary>Answers</summary>

**Answer 1**: $\begin{bmatrix} 17 \\ 39 \end{bmatrix}$

**Answer 2**: $\nabla f = \begin{bmatrix} 2x + 3y \\ 3x + 2y \end{bmatrix}$

**Answer 3**: Approximately 0.68 (within 1 standard deviation)

**Answer 4**:
```python
import numpy as np
A = np.random.randn(3, 3)
A_inv = np.linalg.inv(A)
```

**Answer 5**: Topics are publish/subscribe (many-to-many), services are request/response (one-to-one).

</details>

---

## Summary

This chapter reviewed essential prerequisites:
- **Linear algebra**: Vectors, matrices, transformations
- **Calculus**: Derivatives, optimization, gradient descent
- **Probability**: Random variables, Gaussian distributions, Bayes' rule
- **Python**: NumPy, PyTorch, Matplotlib
- **ROS 2**: Nodes, topics, services

If you're comfortable with these concepts, you're ready to begin the core material!

---

**Next Module**: [Module 2: Robotics Fundamentals](../02-robotics-fundamentals/kinematics.md) - Dive into robot mechanics and control
