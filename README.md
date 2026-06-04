# 🛸 AeroVanguard
**Tactical Fleet Dispatch Engine [Node // CMN-05]**

### 📖 Executive Overview (Non-Technical)
**What is AeroVanguard?**
AeroVanguard is a mission-critical fleet management and telemetry platform. It is designed to act as a "Single Source of Truth" for complex operational environments. 

**Why does it matter?**
* **Operational Visibility:** Real-time geospatial mapping ensures you know exactly where your assets are.
* **Performance Optimization:** Instant feedback on field technician efficiency and system health.
* **Dispatch Intelligence:** Automates the intake and routing process, reducing overhead and response times.

*This platform transforms chaotic field data into a high-fidelity, actionable command center.*

---

### 🛠️ Technical Specifications (Developers)
AeroVanguard is built for performance, scalability, and responsiveness.

**Core Stack:**
* **Frontend Framework:** React.js (Component-based architecture).
* **Styling:** Tailwind CSS (Utility-first design system for rapid UI iteration).
* **Geospatial Logic:** Leaflet.js & React-Leaflet (Custom tile rendering and real-time marker updates).
* **State Management:** React Hooks (Optimized for low-latency telemetry updates).

**Architecture Highlights:**
* **Custom Map Invalidation:** Implements a robust `ResizeObserver` / `key`-based remounting strategy to resolve Leaflet's layout/container race conditions.
* **Dark Mode Native:** Tailored UI with high-contrast accessibility for operational rooms.
* **Modular Roster System:** Asynchronous state handling for field personnel data.

---

### 🚀 Getting Started
To get the engine running locally:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/houssaaaam/aerovanguard.git](https://github.com/houssaaaam/aerovanguard.git)
   cd aerovanguard