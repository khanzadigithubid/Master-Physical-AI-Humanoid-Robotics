---
sidebar_position: 3
title: Curriculum Guide
---

# Curriculum Guide

## How to Navigate This Textbook

This guide helps you chart a learning path through the textbook based on your background, goals, and time constraints.

---

## Learning Paths

### Path 1: Software Engineer → Physical AI

**Your Background**: Strong programming (Python, ML frameworks), weak on physics/robotics

**Recommended Sequence**:
1. ✅ Module 1 (Introduction) - Full
2. **Module 2 (Robotics Fundamentals)** - Focus on kinematics, skip dynamics derivations
3. **Module 3 (Perception)** - Focus on vision, skim sensor fusion math
4. ✅ **Module 4 (AI for Robotics)** - Your strength! Deep dive into RL/imitation learning
5. **Module 5 (Humanoid Robotics)** - Implementation-focused chapters
6. **Module 6 (Deployment)** - Sim-to-real, safety systems

**Time Estimate**: 8-10 weeks (10 hours/week)

**Personalization Tip**: Use the "Personalize" button to add code examples for beginners.

---

### Path 2: Mechanical Engineer → Physical AI

**Your Background**: Strong physics/mechanics, weak on ML/AI

**Recommended Sequence**:
1. Module 1 (Introduction) - Full
2. ✅ **Module 2 (Robotics Fundamentals)** - Your strength! Skim basics, focus on control theory
3. **Module 3 (Perception)** - Conceptual understanding of vision, skip implementation details
4. **Module 4 (AI for Robotics)** - Slow down, work through RL tutorials
5. ✅ **Module 5 (Humanoid Robotics)** - Locomotion dynamics will resonate
6. **Module 6 (Deployment)** - Safety, mechanical design considerations

**Time Estimate**: 10-12 weeks (10 hours/week)

**Personalization Tip**: Set software background to "beginner" for detailed ML explanations.

---

### Path 3: CS Student → Research in Physical AI

**Your Background**: Undergraduate CS, planning PhD in robotics

**Recommended Sequence**:
1. Module 1 (Introduction) - Full
2. Module 2 (Robotics Fundamentals) - Full (mathematical rigor important)
3. Module 3 (Perception) - Full (SLAM is foundational)
4. Module 4 (AI for Robotics) - Full + read cited papers
5. Module 5 (Humanoid Robotics) - Focus on whole-body control
6. Module 6 (Deployment) - Sim-to-real transfer (critical for research)

**Time Estimate**: 14-16 weeks (15 hours/week)

**Additional Resources**:
- Implement projects in Isaac Sim or MuJoCo
- Read papers from RSS, ICRA, CoRL conferences
- Join research lab or contribute to open-source (ROS 2)

---

### Path 4: Hobbyist → Build a Robot

**Your Background**: Arduino/Raspberry Pi experience, want to build humanoid

**Recommended Sequence**:
1. Module 1 (Introduction) - Full
2. **Module 2 (Robotics Fundamentals)** - Focus on kinematics, actuators/sensors
3. **Module 3 (Perception)** - Computer vision basics, skip advanced SLAM
4. **Module 4 (AI for Robotics)** - Imitation learning (easier than RL)
5. **Module 5 (Humanoid Robotics)** - Manipulation chapter, skip bipedal locomotion (very hard)
6. **Module 6 (Deployment)** - Safety systems (critical for DIY)

**Time Estimate**: 6-8 weeks (5 hours/week) + hardware build time

**Hardware Suggestions**:
- Start with manipulator arm (e.g., Trossen WidowX)
- Use ROS 2 + MoveIt for motion planning
- Raspberry Pi 4 + Intel RealSense camera

---

### Path 5: Fast Track (Experienced Roboticist)

**Your Background**: Already worked in robotics, want to learn latest AI techniques

**Skip**:
- Module 2 (you know kinematics/dynamics)
- Module 3 (familiar with SLAM)

**Focus**:
- **Module 4 (AI for Robotics)** - Foundation models, RT-2, VIMA
- **Module 5 (Humanoid Robotics)** - State-of-the-art in humanoids
- **Module 6 (Deployment)** - Latest sim-to-real methods

**Time Estimate**: 3-4 weeks (10 hours/week)

---

## Module Overviews

### Module 1: Introduction to Physical AI (Weeks 1-2)

**Goal**: Understand what Physical AI is and why it matters

**Chapters**:
1. Overview (historical evolution, applications)
2. Formal definition (mathematical framework)
3. Curriculum guide (this document)
4. Prerequisites (math/programming refresher)

**Prerequisites**: None

**Assessments**: Conceptual quizzes

---

### Module 2: Robotics Fundamentals (Weeks 3-5)

**Goal**: Master the math and control theory underlying robots

**Chapters**:
1. Kinematics (forward/inverse, Jacobians)
2. Dynamics (Euler-Lagrange, Newton-Euler)
3. Control theory (PID, LQR, MPC)
4. Actuators & sensors (motors, encoders, IMU)

**Prerequisites**: Linear algebra, calculus, Python

**Assessments**:
- Implement forward kinematics for UR5 arm
- Design PID controller for quadrotor

**Estimated Effort**: 30 hours

---

### Module 3: Perception Systems (Weeks 6-8)

**Goal**: Build vision and localization pipelines

**Chapters**:
1. Computer vision (CNN, object detection, depth estimation)
2. LiDAR sensors (point clouds, registration)
3. Sensor fusion (Kalman filters, EKF, UKF)
4. SLAM (ORB-SLAM, LiDAR SLAM)

**Prerequisites**: Module 2 (sensors), probability, Python + PyTorch

**Assessments**:
- Train YOLO model for cup detection
- Implement EKF for robot localization

**Estimated Effort**: 35 hours

---

### Module 4: AI for Robotics (Weeks 9-11)

**Goal**: Train robots using deep learning

**Chapters**:
1. Reinforcement learning (PPO, SAC, off-policy methods)
2. Imitation learning (behavior cloning, DAgger, IRL)
3. World models (latent dynamics, model-based RL)
4. Foundation models (RT-2, VIMA, language-conditioned policies)

**Prerequisites**: Module 2-3, deep learning basics

**Assessments**:
- Train PPO agent to balance cart-pole
- Implement behavior cloning for grasping

**Estimated Effort**: 40 hours

---

### Module 5: Humanoid Robotics (Weeks 12-14)

**Goal**: Understand humanoid-specific challenges

**Chapters**:
1. Bipedal locomotion (ZMP, gait planning, balance)
2. Manipulation (grasping, dexterous hands, contact-rich tasks)
3. Human-robot interaction (natural language, intent recognition)
4. Whole-body control (hierarchical control, optimization)

**Prerequisites**: Module 2-4

**Assessments**:
- Simulate humanoid walking in MuJoCo
- Implement grasp planner for 6-DOF arm

**Estimated Effort**: 35 hours

---

### Module 6: Deployment & Ethics (Weeks 15-16)

**Goal**: Deploy robots safely and ethically

**Chapters**:
1. Sim-to-real (domain randomization, system ID, real-world fine-tuning)
2. Safety systems (fail-safes, collision detection, formal verification)
3. Ethical considerations (job displacement, privacy, autonomy)
4. Future directions (self-improving robots, AGI for robotics)

**Prerequisites**: Module 4-5

**Assessments**:
- Transfer sim policy to real robot (if hardware available)
- Write ethical analysis of warehouse automation

**Estimated Effort**: 20 hours

---

## Assessment Structure

### Formative Assessments (Throughout)

- **Concept checks**: Multiple-choice quizzes after each chapter
- **Coding exercises**: Implement algorithms in Python + ROS 2
- **Simulation labs**: Train agents in Isaac Sim or MuJoCo

### Summative Assessments (End of Modules)

- **Module 2**: Build 3-DOF robotic arm simulator
- **Module 3**: Implement visual SLAM for mobile robot
- **Module 4**: Train RL agent for manipulation task (pick-and-place)
- **Module 5**: Simulate humanoid doing household task
- **Module 6**: Deploy policy on real hardware (if available)

### Capstone Project (Optional)

**Options**:
1. **Research project**: Reproduce recent paper (e.g., RT-2)
2. **Hardware project**: Build functional robot arm
3. **Simulation project**: Train humanoid to perform complex task
4. **Dataset contribution**: Collect teleoperation data for Open X-Embodiment

**Timeline**: 4-6 weeks

---

## Time Commitments

### Full Course (16 weeks)

- **Lectures** (video + reading): 4 hours/week
- **Coding exercises**: 4 hours/week
- **Labs** (simulation): 3 hours/week
- **Total**: 11 hours/week

### Intensive (8 weeks)

- Double weekly hours: 22 hours/week
- Skip some advanced topics

### Self-Paced

- No deadlines
- Typical completion: 4-6 months (casual pace)

---

## Prerequisites by Module

| Module | Math | Programming | Physics | Prior Knowledge |
|--------|------|-------------|---------|-----------------|
| 1 | None | Python basics | None | None |
| 2 | Linear algebra, calculus | NumPy | Newtonian mechanics | None |
| 3 | Probability, linear algebra | PyTorch | None | Module 2 |
| 4 | Calculus, probability | PyTorch, RL libraries | None | Module 2, 3 |
| 5 | Optimization | PyTorch, ROS 2 | Dynamics | Module 2, 4 |
| 6 | None | Full stack | None | Module 4, 5 |

---

## Tools & Software Setup

### Required Tools

1. **Python 3.10+**: Core language
2. **PyTorch or TensorFlow**: Deep learning
3. **NumPy, SciPy, Matplotlib**: Scientific computing
4. **ROS 2 (Humble)**: Robotics middleware
5. **MuJoCo or Isaac Sim**: Physics simulation

### Optional Tools

- **OpenCV**: Computer vision
- **Open3D**: Point cloud processing
- **Stable-Baselines3**: RL implementations
- **MoveIt**: Motion planning

### Installation Guide

See [Prerequisites chapter](./prerequisites.md) for detailed setup instructions.

---

## Support Resources

### Included in Textbook

- **Interactive chatbot**: Ask questions about any section
- **Personalization**: Adapt content to your background
- **Urdu translation**: Available for all chapters
- **Code repositories**: GitHub repo with all implementations
- **Video lectures**: YouTube playlist (coming soon)

### External Communities

- **ROS Discourse**: [discourse.ros.org](https://discourse.ros.org)
- **r/robotics**: Reddit community
- **RSS/ICRA Slack**: Research community
- **Discord server**: Learner community (link in textbook homepage)

---

## Frequently Asked Questions

**Q: Can I skip Module 2 if I already know robotics?**

A: Yes, but skim the control theory chapter (2.3) as it covers MPC, which is essential for Module 5.

**Q: Do I need a real robot to complete this course?**

A: No! All labs use simulation (MuJoCo, Isaac Sim). Real hardware is optional for Module 6.

**Q: How much does this textbook cost?**

A: Free! Open access under CC BY-NC-SA 4.0 license.

**Q: Can I get university credit?**

A: Check with your institution. Many universities accept MOOC-style textbooks for independent study credit.

**Q: What if I get stuck?**

A: Use the embedded chatbot, check the GitHub discussions, or post on Discord.

---

## Next Steps

1. **Assess your background**: Review the [Prerequisites chapter](./prerequisites.md)
2. **Choose a learning path**: Pick one of the 5 paths above
3. **Set up your environment**: Follow the software installation guide
4. **Start learning**: Begin with [Module 2: Robotics Fundamentals](../02-robotics-fundamentals/kinematics.md)

---

**Ready to dive in?** Let's build the future of Physical AI! 🤖

**Next Chapter**: [Prerequisites](./prerequisites.md) - Math, programming, and software setup
