---
sidebar_position: 1
title: Safety Systems for Physical AI
---

# Safety Systems for Physical AI

## Introduction

Safety is paramount for robots operating near humans. Unlike software bugs, robotic failures can cause physical harm.

---

## Safety Requirements

### ISO 13482: Safety for Personal Care Robots

**Categories**:
1. **Mobile servant robots** (fetch, carry)
2. **Person carrier robots** (wheelchairs, exoskeletons)
3. **Physical assistant robots** (lift, support)

**Key requirements**:
- Emergency stop within 300ms
- Force limiting (max contact force: 150N)
- Obstacle detection range: 3m minimum
- Redundant braking systems

---

## Hardware Safety

### Emergency Stop (E-Stop)

**Types**:
1. **Category 0**: Immediate power cutoff (uncontrolled stop)
2. **Category 1**: Controlled stop, then power off
3. **Category 2**: Power remains on, motion stops

**Implementation**:
- Physical red button
- Wireless emergency stop
- Automatic triggers (torque limits, collision detection)

### Force Limiting

**Passive compliance**:
- Series elastic actuators (springs in drivetrain)
- Cushioned covers

**Active compliance**:
- Torque sensors at each joint
- Real-time force feedback control

**Example**: Collaborative robots (cobots) like UR10 have built-in force limits.

---

## Software Safety

### Motion Planning Constraints

**Workspace limits**:
- Geofencing: Robot cannot leave designated area
- Height limits: Arms cannot go above human head height
- Speed limits: Max velocity near humans

**Collision avoidance**:
- Real-time obstacle detection (LiDAR, cameras)
- Dynamic replanning if human detected
- Safe stop distance: 0.5m minimum

### Formal Verification

**Goal**: Mathematically prove safety properties.

**Example**: Prove that robot velocity never exceeds 0.5 m/s when human is within 2m.

**Tools**:
- **Model checking**: Exhaustively search state space
- **Theorem provers**: Coq, Isabelle

**Challenge**: Scalability to complex systems.

---

## Perception for Safety

### Human Detection

**Sensors**:
- 3D LiDAR: 360° coverage, 30 Hz
- Depth cameras: Close-range (0-5m)
- Thermal cameras: Detect humans in darkness

**Algorithms**:
- YOLO for human detection
- Skeleton tracking (OpenPose)
- Trajectory prediction (where will human move?)

### Intent Recognition

**Problem**: Human suddenly walks toward robot. Is it intentional or accidental?

**Solution**:
- Track gaze direction
- Estimate walking trajectory
- Predict collision 2 seconds in advance

---

## Case Study: Waymo Safety

**Context**: Autonomous vehicles must have near-zero accident rate.

**Safety layers**:
1. **Perception redundancy**: 29 cameras + 5 LiDAR + radar
2. **Planning safety checks**: Verify all trajectories collision-free
3. **Actuation redundancy**: Dual braking systems
4. **Human oversight**: Remote operators can intervene

**Results**:
- 20M+ autonomous miles
- 0 pedestrian fatalities

**Key insight**: Redundancy at every layer.

---

## Ethics of Physical AI

### Trolley Problem for Robots

**Scenario**: Self-driving car must choose:
- Swerve left: Hit pedestrian
- Swerve right: Hit motorcyclist
- Brake: Rear-end collision

**Question**: How should robot decide?

**Approaches**:
1. **Utilitarian**: Minimize total harm
2. **Deontological**: Follow rules (never intentionally harm)
3. **Responsibility**: Whoever caused scenario is liable

**Reality**: Most accidents are avoidable with better perception.

### Job Displacement

**Concern**: Humanoid robots will replace human workers.

**Sectors at risk**:
- Warehouse operations
- Food service
- Cleaning and maintenance

**Counterargument**: Robots handle dangerous, repetitive tasks (freeing humans for creative work).

**Policy solutions**:
- Retraining programs
- Universal basic income (UBI)
- Robot taxes (Bill Gates proposal)

---

## Summary

Safe Physical AI requires:
1. **Hardware safeguards**: E-stops, force limits, compliance
2. **Software constraints**: Motion planning, collision avoidance
3. **Robust perception**: Human detection, intent recognition
4. **Redundancy**: Multiple sensors, dual systems

**Ethical considerations**: Decision-making in accidents, job displacement, accountability.

---

**Next Chapter**: Future of Physical AI
