---
sidebar_position: 2
title: Manipulation and Grasping
---

# Manipulation and Grasping

## Introduction

Dexterous manipulation—the ability to grasp and manipulate objects with precision—is essential for general-purpose humanoid robots.

---

## The Grasping Problem

**Goal**: Compute gripper pose and configuration to stably grasp an object.

**Inputs**:
- Object geometry (point cloud, mesh)
- Object pose (from vision system)
- Task requirements (precision grasp vs. power grasp)

**Outputs**:
- Grasp pose (6D: position + orientation)
- Gripper configuration (finger joint angles)

---

## Grasp Quality Metrics

### Force Closure

**Definition**: Grasp can resist arbitrary external forces.

**Mathematical condition**: Contact forces can generate any wrench on object.

### Stability

**Measure**: Distance to grasp wrench space boundary.

**Higher stability** → More robust to perturbations.

---

## Grasp Planning Methods

### 1. Analytical Methods

**Approach**: Hand-engineer grasp primitives.

**Example**: Parallel-jaw gripper
- Find pair of antipodal points on object surface
- Align gripper to surface normals
- Compute optimal width

### 2. Sampling-Based Methods

**Algorithm**:
1. Sample candidate grasps around object
2. Score each grasp (force closure, collision-free)
3. Select best grasp

**Tool**: GraspIt! simulator

### 3. Learning-Based Methods

**Approach**: Train neural network to predict grasp success.

**Architecture**:
- Input: RGB-D image
- Output: Grasp heatmap (success probability per pixel)

**Datasets**:
- Dex-Net: 6.7M synthetic grasps
- Google Robotics: 800k real-world grasps

---

## Dexterous Manipulation

### Multi-Fingered Hands

**Advantages over parallel grippers**:
- In-hand manipulation (reorient object without releasing)
- Precision grasps (pen, small screws)
- Power grasps (heavy objects)

**Examples**:
- Shadow Dexterous Hand: 20 DOF, human-like
- Tesla Optimus hand: 11 DOF per hand

### Contact-Rich Manipulation

**Challenges**:
- Friction is stochastic
- Contact dynamics are nonsmooth
- High-dimensional contact space

**Solutions**:
- Reinforcement learning (OpenAI Dactyl)
- Differentiable physics simulators
- Tactile sensing (measure contact forces)

---

## Case Study: OpenAI Dactyl

**Task**: Solve Rubik's cube with robot hand

**Approach**:
1. Train policy in simulation (MuJoCo)
2. Domain randomization:
   - Friction: ±50%
   - Object size: ±10%
   - Camera position: ±10cm
3. Zero-shot transfer to real hand

**Results**:
- 60% solve rate in normal conditions
- Robust to perturbations (rubber glove, lights off)

**Key insight**: Massive randomization enables sim-to-real transfer.

---

## Whole-Body Manipulation

**Definition**: Use entire body (arms, torso, legs) for manipulation.

**Use cases**:
- Lifting heavy objects
- Opening doors (requires body weight)
- Pushing carts

**Control challenge**: Coordinate 30+ joints for single task.

**Solution**: Hierarchical control
1. High level: Task-space trajectory
2. Low level: Joint-space tracking

---

## Summary

Manipulation requires:
- Grasp planning (analytical, sampling, or learned)
- Multi-fingered hands for dexterity
- Contact-rich control via RL
- Whole-body coordination

**Next Chapter**: Human-Robot Interaction
