---
sidebar_position: 2
title: Physical AI Definition
---

# Formal Definition of Physical AI

## Introduction

This chapter provides a rigorous mathematical framework for Physical AI systems. We formalize embodied agents as dynamical systems that sense, compute, and act in continuous physical environments.

---

## Mathematical Framework

### The Embodied Agent

A **Physical AI agent** is defined as a tuple:

$$
\mathcal{A} = (\mathcal{S}, \mathcal{A}, \mathcal{O}, f_{\text{dynamics}}, f_{\text{policy}}, f_{\text{perception}})
$$

Where:
- $\mathcal{S}$: State space (robot configuration + environment state)
- $\mathcal{A}$: Action space (motor commands)
- $\mathcal{O}$: Observation space (sensor measurements)
- $f_{\text{dynamics}}: \mathcal{S} \times \mathcal{A} \rightarrow \mathcal{S}$: Physical dynamics
- $f_{\text{policy}}: \mathcal{O} \rightarrow \mathcal{A}$: Control policy
- $f_{\text{perception}}: \mathcal{S} \rightarrow \mathcal{O}$: Sensor model

### State Space $\mathcal{S}$

The state consists of:

1. **Robot configuration** $q \in \mathbb{R}^n$: Joint angles, positions
2. **Robot velocity** $\dot{q} \in \mathbb{R}^n$: Joint velocities
3. **Environment state** $s_{\text{env}}$: Object poses, terrain geometry

For a humanoid robot with $n$ joints:

$$
\mathcal{S} = \{(q, \dot{q}, s_{\text{env}}) \mid q \in \mathbb{R}^n, \dot{q} \in \mathbb{R}^n, s_{\text{env}} \in \mathcal{E}\}
$$

**Example**: Atlas humanoid has $n=28$ actuated joints, so $q \in \mathbb{R}^{28}$.

### Action Space $\mathcal{A}$

Actions are motor commands:

- **Position control**: $a = q_{\text{desired}} \in \mathbb{R}^n$
- **Velocity control**: $a = \dot{q}_{\text{desired}} \in \mathbb{R}^n$
- **Torque control**: $a = \tau \in \mathbb{R}^n$

**Action bounds**: $a \in [\mathbf{a}_{\min}, \mathbf{a}_{\max}]$

**Example**: For torque control, typical bounds are $\tau_i \in [-150, 150]$ Nm per joint.

### Observation Space $\mathcal{O}$

Observations are **partial** and **noisy** sensor measurements:

$$
o_t = f_{\text{perception}}(s_t) + \epsilon_t, \quad \epsilon_t \sim \mathcal{N}(0, \Sigma_{\text{sensor}})
$$

**Sensor types**:
1. **Proprioception**: Joint encoders ($q_t, \dot{q}_t$), IMU (orientation, angular velocity)
2. **Exteroception**: Cameras (RGB images), LiDAR (point clouds), force/torque sensors

**Example**: Camera observation $o_{\text{cam}} \in \mathbb{R}^{H \times W \times 3}$ (e.g., $640 \times 480 \times 3$).

---

## Physical Dynamics

### Continuous-Time Dynamics

The robot's physical evolution is governed by:

$$
\frac{d}{dt} \begin{bmatrix} q \\ \dot{q} \end{bmatrix} = \begin{bmatrix} \dot{q} \\ M(q)^{-1} (\tau - C(q, \dot{q}) - G(q)) \end{bmatrix}
$$

Where:
- $M(q) \in \mathbb{R}^{n \times n}$: Inertia matrix
- $C(q, \dot{q}) \in \mathbb{R}^n$: Coriolis and centrifugal forces
- $G(q) \in \mathbb{R}^n$: Gravitational forces
- $\tau \in \mathbb{R}^n$: Applied joint torques (our action $a$)

This is the **Euler-Lagrange equation** from analytical mechanics.

### Discrete-Time Dynamics

For control at timestep $\Delta t$:

$$
s_{t+1} = f_{\text{dynamics}}(s_t, a_t) + w_t, \quad w_t \sim \mathcal{N}(0, \Sigma_{\text{process}})
$$

**Discretization methods**:
- **Euler integration**: $q_{t+1} = q_t + \dot{q}_t \Delta t$
- **Runge-Kutta (RK4)**: Higher-order accuracy
- **Physics simulators**: MuJoCo, Isaac Sim use implicit integrators

**Example**: At $\Delta t = 0.01$ s (100 Hz control), a humanoid takes discrete steps.

---

## Control Policies

### Policy Types

**1. Reactive Policy** (feedforward):
$$
a_t = \pi(o_t)
$$

**2. Recurrent Policy** (memory-based):
$$
a_t = \pi(o_t, h_t), \quad h_{t+1} = f_{\text{RNN}}(h_t, o_t)
$$

**3. Model-Based Policy** (planning):
$$
a_t = \arg\max_{a} \mathbb{E}_{s_{t+1} \sim f_{\text{model}}} [R(s_{t+1})]
$$

### Parameterization

Modern policies are **neural networks**:

$$
\pi_\theta: \mathcal{O} \rightarrow \mathcal{A}, \quad \theta \in \mathbb{R}^d
$$

**Example architectures**:
- **MLP**: 3 hidden layers, 256 units each, $\sim$200k parameters
- **CNN**: For image observations (ResNet-18 backbone)
- **Transformer**: For sequence modeling (e.g., language-conditioned manipulation)

### Learning Objective

Find optimal policy $\pi^*$ that maximizes cumulative reward:

$$
\pi^* = \arg\max_\pi \mathbb{E}_{\tau \sim \pi} \left[ \sum_{t=0}^\infty \gamma^t r(s_t, a_t) \right]
$$

Where $\tau = (s_0, a_0, s_1, a_1, \ldots)$ is a trajectory and $\gamma \in [0, 1)$ is the discount factor.

---

## Perception Models

### Forward Sensor Model

Given true state $s_t$, predict observation:

$$
p(o_t \mid s_t) = \mathcal{N}(f_{\text{perception}}(s_t), \Sigma_{\text{sensor}})
$$

**Example**: Camera renders image of scene given object poses.

### Inverse Sensor Model (State Estimation)

Given observation history $o_{1:t}$, estimate state:

$$
p(s_t \mid o_{1:t}) \propto p(o_t \mid s_t) \int p(s_t \mid s_{t-1}, a_{t-1}) p(s_{t-1} \mid o_{1:t-1}) ds_{t-1}
$$

This is the **Bayes filter**. Implementations:
- **Kalman Filter**: Linear-Gaussian case
- **Extended Kalman Filter (EKF)**: Nonlinear via linearization
- **Particle Filter**: Nonparametric, handles multi-modal distributions

---

## Comparison: Software AI vs. Physical AI

| **Property** | **Software AI** | **Physical AI** |
|--------------|-----------------|-----------------|
| **State space** | Discrete (tokens, pixels) | Continuous ($\mathbb{R}^n$) |
| **Dynamics** | Deterministic (GPU compute) | Stochastic (physics + noise) |
| **Observation** | Perfect (access to state) | Partial (sensor measurements) |
| **Action space** | Discrete (text generation) | Continuous (motor commands) |
| **Feedback delay** | None (instant compute) | 10-100ms (actuation lag) |
| **Safety** | Mistakes are cheap (regenerate) | Mistakes are costly (hardware damage) |
| **Evaluation** | Offline metrics (accuracy) | Online performance (task success) |

**Key Insight**: Physical AI must handle **continuous state spaces**, **partial observability**, **action delays**, and **safety constraints**.

---

## The Embodiment Hypothesis

**Thesis**: Intelligence is fundamentally grounded in sensorimotor experience.

**Evidence**:
1. **Human development**: Motor skills precede abstract reasoning (Piaget's stages)
2. **Animal cognition**: Navigation requires spatial memory (hippocampus place cells)
3. **AI progress**: Foundation models (GPT-4) lack common-sense physics understanding

**Implications for Physical AI**:
- **Learning from interaction**: RL >> supervised learning for control
- **Multimodal perception**: Vision + touch + proprioception
- **Active sensing**: Move to gain information (e.g., look around occluder)

---

## Example: Formalizing a Grasping Task

**Goal**: Grasp a cup on a table

### State $s_t$
- Robot: $(q, \dot{q})$ (7-DOF arm + 2-finger gripper)
- Environment: Cup pose $(x, y, z, \text{orientation})$

### Action $a_t$
- End-effector velocity command: $(v_x, v_y, v_z) \in \mathbb{R}^3$
- Gripper command: $\text{close}$ or $\text{open}$

### Observation $o_t$
- RGB-D camera: $640 \times 480$ depth image
- Proprioception: Joint angles $q$, gripper width

### Dynamics $f_{\text{dynamics}}$
- Forward kinematics: Map $q \rightarrow$ end-effector pose
- Contact physics: Gripper closes → force on cup

### Policy $\pi(o)$
- **CNN**: Encode RGB-D image to feature vector
- **MLP**: Map features + proprioception → velocity command

### Reward $r(s, a)$
- $+10$ if cup grasped
- $-1$ per timestep (encourage speed)
- $-100$ if cup dropped

### Optimal Policy $\pi^*$
- Trained via PPO (Proximal Policy Optimization) for 10M timesteps in simulation
- Fine-tuned on real robot for 500 grasps

---

## Challenges Unique to Physical AI

### 1. **Compounding Errors**

Small perception errors → incorrect actions → worse state → harder perception.

**Example**: Localization error of 5cm → manipulator misses object → task failure.

**Mitigation**: Closed-loop control, robust perception, error recovery behaviors.

### 2. **Irreversibility**

Unlike software, some actions cannot be undone.

**Example**: Dropping a glass → permanent damage.

**Mitigation**: Safe exploration (constrained RL), human supervision, redundant grippers.

### 3. **Sample Complexity**

Real-world data is expensive (hardware wear, human supervision, energy).

**Example**: Learning to walk might require 100,000 falls → infeasible on hardware.

**Mitigation**: Simulation (Isaac Sim, MuJoCo), sim-to-real transfer, imitation learning.

### 4. **Latency**

Sensor → compute → actuator pipeline introduces delay.

**Example**: 50ms latency → robot reacts to outdated observation.

**Mitigation**: Predictive models, fast control loops (1kHz), model-based RL.

---

## Summary

Physical AI systems are formalized as embodied agents $(\mathcal{S}, \mathcal{A}, \mathcal{O}, f_{\text{dynamics}}, f_{\text{policy}}, f_{\text{perception}})$ that:

1. **Sense** the world through noisy, partial observations $o_t$
2. **Compute** actions $a_t = \pi(o_t)$ via learned policies
3. **Act** in the world, subject to continuous physical dynamics $s_{t+1} = f(s_t, a_t)$
4. **Learn** from interaction to maximize cumulative reward

This framework unifies robotics and AI, enabling mathematical analysis of:
- Optimal control (finding $\pi^*$)
- State estimation (inferring $s_t$ from $o_{1:t}$)
- Sim-to-real transfer (bridging simulation $f_{\text{sim}}$ and reality $f_{\text{real}}$)

---

## Key Takeaways

✅ Physical AI agents are defined by state space $\mathcal{S}$, action space $\mathcal{A}$, and observation space $\mathcal{O}$

✅ Physical dynamics $f_{\text{dynamics}}$ govern continuous evolution via Euler-Lagrange equations

✅ Policies $\pi: \mathcal{O} \rightarrow \mathcal{A}$ are typically neural networks trained with RL

✅ Perception models $f_{\text{perception}}$ map true state to noisy sensor measurements

✅ Physical AI differs from software AI in continuous state/action spaces, partial observability, and safety constraints

---

## Exercises

**Exercise 1**: For a 2-link planar arm, derive the state space $\mathcal{S}$ and action space $\mathcal{A}$ assuming torque control.

**Exercise 2**: Implement a forward sensor model for a camera observing a cube. Use ray tracing to render a depth image.

**Exercise 3**: Prove that the Bayes filter is optimal for state estimation under Gaussian noise assumptions.

**Exercise 4**: Calculate the dimensionality of the observation space for a robot with 2 RGB cameras ($1920 \times 1080$), 1 LiDAR (1000 points), and 12 proprioceptive sensors.

---

**Next Chapter**: [Curriculum Guide](./curriculum-guide.md) - How to navigate this textbook based on your background
