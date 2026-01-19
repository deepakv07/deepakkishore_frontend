# System Connectivity Report: SKILLBUILDER_AI (2.0)

## Executive Summary
**Status:** ⚠️ **Partially Linked (Database Only)**

The **SKILLBUILDER_AI (2.0)** engine is **NOT** functionally linked to the Frontend or Backend for the active quiz flow. 

While both systems connect to the same database, the application logic in the Frontend and Backend **completely bypasses** the AI Engine. The AI features (Bandit Scoring, LPA Estimation, etc.) are currently **inactive** for users taking quizzes in the web interface.

---

## Detailed Findings

### 1. Database Connectivity (✅ LINKED)
Both the Node.js Backend and the Python AI Engine are configured to connect to the same MongoDB Atlas instance.
*   **Backend Config:** `server/src/config/database.ts` uses `mongodb+srv://deepak:deepakswamy%40123@cluster0.sexvvaf.mongodb.net/skillbuilder...`
*   **AI Engine Config:** `SKILLBUILDER_AI(2.0)/neural_quiz_engine/.env` uses the exact same URI.
*   **Result:** They share the same data source. If the AI engine writes data, the backend can see it, and vice-versa.

### 2. Frontend Integration (❌ NOT LINKED)
The React Frontend (`src/pages/quiz/QuizInterface.tsx`) communicates **exclusively** with the Node.js Backend on port 3000.
*   **API Service:** `src/services/api.ts` defines endpoints pointing to the Node.js backend (`/v1`).
*   **No AI Calls:** There are **zero** references to port `8000` (where the AI engine runs) or the AI-specific endpoints (`/start_quiz`, `/submit_answer`) in the entire `src` directory.

### 3. Backend Integration (❌ NOT LINKED)
The Node.js Backend (`server/src/routes/quiz.ts`) implements its own independent quiz logic.
*   **Independent Grading:** The backend fetches questions from MongoDB and grades them using simple string matching logic within `quiz.ts`.
*   **Ignored AI:** It does **not** forward requests to the Python AI Engine. The advanced scoring and adaptive features of the AI engine are never invoked.

---

## Architecture Diagram (Current State)

```mermaid
graph TD
    User[User / Browser]
    
    subgraph Frontend [React Frontend]
        UI[QuizInterface.tsx]
        API[api.ts]
    end
    
    subgraph Backend [Node.js Server :3000]
        Router[Quiz Routes]
        Logic[Simple Grading Logic]
    end
    
    subgraph AI [SKILLBUILDER_AI 2.0 :8000]
        Engine[Neural Quiz Engine]
        Advanced[Bandit Scoring & LPA]
    end
    
    Database[(MongoDB Atlas)]

    User -->|Interacts| UI
    UI -->|Calls| API
    API -->|HTTP Requests| Router
    Router -->|Reads/Writes| Database
    Router --x|NO CONNECTION| Engine
    
    Engine -.->|Configured to Connect| Database
    Logic -->|Calculates Score| Router
```

## Recommendation
To enable the AI features, you must integrate the Node.js backend with the Python AI service.

**Proposed Fix:**
Modify `server/src/routes/quiz.ts` to forward the `submit` request to the Python AI service (`http://localhost:8000/submit_answer`) instead of calculating the score locally. Alternatively, the frontend could call the AI service directly, but proxying through the backend is more secure and cleaner.
