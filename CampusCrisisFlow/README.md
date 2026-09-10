# Campus CrisisFlow

A dynamic graph-based emergency evacuation optimization prototype built for Design and Analysis of Algorithms research.

## What it demonstrates

- **Dijkstra** — shortest-path routing
- **A\*** — heuristic graph search
- **Min-Heap / Priority Queue**
- **Dynamic graph updates** when corridors fail
- **Edmonds–Karp Max-Flow** for network-wide capacity
- **Congestion-aware CrisisFlow** for crowd redistribution
- **Accessibility-aware routing**
- **Fairness-oriented optimization mode**
- **Exit and corridor utilization visualization**

## Run locally

### VS Code
Open this repository folder and use **Live Server** on `index.html`.

### Python
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.

## Demo
1. Trigger an emergency.
2. Compare Dijkstra and A*.
3. Inject a corridor failure.
4. Run Max-Flow.
5. Run CrisisFlow.
6. Increase congestion weight.
7. Enable accessibility-aware routing.

## Research note

The included campus graph, population values, capacities and scenarios are synthetic. They are for algorithmic experimentation and software demonstration, not real emergency decision-making.

## Repository

The project is dependency-light and uses plain HTML, CSS and JavaScript, so no build step is required.
