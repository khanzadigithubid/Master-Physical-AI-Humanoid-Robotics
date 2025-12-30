---
sidebar_position: 1
title: Bipedal Locomotion
---

# Bipedal Locomotion

## Introduction

Bipedal locomotion—walking on two legs—is one of the hardest problems in robotics. Unlike wheeled robots, humanoids are dynamically unstable and must constantly balance while moving.

---

## Why is Walking Hard?

### The Stability Challenge

**Static stability**: Center of mass (COM) stays within support polygon
- Works for: 4-legged robots, humans moving slowly
- Humanoids: Too restrictive, limits speed

**Dynamic stability**: Use momentum to maintain balance
- Allows: Fast walking, running, jumping
- Requires: Precise control, fast reactions

### The Underactuated System Problem

**Humanoid**: Cannot directly control base position
- 6 DOF base (x, y, z, roll, pitch, yaw)
- Only indirect control through foot contact forces

**Challenge**: Must plan joint motions that result in desired base trajectory.

---

## Locomotion Control Approaches

### 1. Zero Moment Point (ZMP)

**Concept**: Point on ground where net moment is zero.

**ZMP Criterion**: If ZMP stays within support polygon, robot won't tip over.

**Algorithm**:
1. Plan COM trajectory such that ZMP remains inside feet
2. Use inverse kinematics to compute joint angles
3. Execute with joint PD controllers

**Used by**: Honda ASIMO, Boston Dynamics Atlas (early versions)

**Limitations**:
- Conservative (slow walking)
- Requires flat ground
- Cannot handle pushes

### 2. Model Predictive Control (MPC)

**Idea**: Optimize actions over finite horizon to achieve goal.

**Algorithm** (at each timestep):
1. Predict robot state for next N steps
2. Optimize foot placements and forces
3. Execute first action, replan

**MIT Mini Cheetah** uses MPC:
- 50 Hz replanning
- Robust to terrain variations
- Enables backflips!

### 3. Reinforcement Learning

**Approach**: Train policy end-to-end in simulation.

**Advantages**:
- Learns natural gaits (no hand-engineering)
- Robust to perturbations
- Generalizes to new terrain

**Example: Agility Robotics Digit**
- PPO training in simulation
- Domain randomization
- Zero-shot transfer to real robot
- Deployed in Amazon warehouses

---

## Gait Planning

### Walking Gait

**Phases**:
1. **Double support**: Both feet on ground
2. **Single support**: One foot on ground, other swings
3. Alternate left/right

**Parameters**:
- Step length: 0.3-0.5m for humanoids
- Step height: 5-10cm clearance
- Cadence: 1-2 steps/second

### Running Gait

**Key difference**: **Flight phase** (both feet off ground)

**Challenges**:
- Higher impact forces (3x body weight)
- Requires compliant actuators
- More complex control

**Achievement**: Boston Dynamics Atlas runs at 5 m/s

### Stair Climbing

**Requirements**:
- Foot placement accuracy (±2cm)
- Increased hip flexion
- Balance during single-leg stance on stairs

**Solution**: Vision-based footstep planning + MPC

---

## Hardware Requirements

### Actuators

**Electric motors** (most common):
- High power-to-weight ratio
- Precise position control
- Example: Tesla Optimus uses custom rotary actuators

**Hydraulic** (high force):
- Boston Dynamics Atlas
- Can jump, do backflips
- Trade-off: Noisy, requires pump

**Quasi-direct drive**:
- Low-gear-ratio motors
- More compliant (safer human interaction)
- Example: MIT Cheetah 3

### Sensors

**Essential sensors**:
1. **IMU**: Orientation and angular velocity (1kHz)
2. **Joint encoders**: Position and velocity (1kHz)
3. **Force/torque sensors**: Foot contact forces (1kHz)
4. **Vision**: For terrain mapping and footstep planning

---

## Case Study: Tesla Optimus

**Goal**: General-purpose humanoid for under $30k

**Hardware**:
- Height: 5'8" (173 cm)
- Weight: 125 lbs (57 kg)
- 28 actuators
- Hands: 11 DOF each

**Locomotion approach**:
- Reinforcement learning (PPO)
- Trained in Isaac Sim
- Real-world finetuning

**Progress** (as of 2024):
- Walking at 1 m/s
- Navigating factory floors
- Autonomously sorting objects

---

## Summary

Bipedal locomotion requires:
1. Dynamic balance (ZMP, MPC, or learned policies)
2. Robust sensors (IMU, encoders, force sensors)
3. Fast control loops (100-1000 Hz)
4. Sim-to-real transfer for data efficiency

**State of the art**: Humanoids can walk, run, climb stairs, and recover from pushes.

---

**Next Chapter**: Manipulation and Grasping
