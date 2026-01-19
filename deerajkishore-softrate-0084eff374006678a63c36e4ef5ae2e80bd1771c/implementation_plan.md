# Implementation Plan - Integrate AI Service

## Goal
Connect the Node.js Backend to the Python AI Service to enable "Bandit Scoring", "LPA Estimation", and "Job Readiness" features which are currently inactive.

## Problem
*   **Architecture Mismatch**:
    *   **Frontend/Backend**: Stateless. Fetches full quiz, submits all answers at once.
    *   **AI Engine**: Stateful/Interactive. Starts session, serves one question at a time, expects one answer at a time.
*   **Result**: The frontend cannot simply "submit" to the AI engine as-is without significant refactoring of the UI to be interactive.

## Proposed Solution
Create a **Bulk Bridge** in the AI Engine. We will add a new endpoint to the AI service that accepts a full quiz submission, runs the standard AI logic "internally" (simulating a session), and returns the comprehensive report.

## Changes

### 1. AI Service (`SKILLBUILDER_AI(2.0)/neural_quiz_engine/server.py`)
*   **[NEW] Endpoint `/submit_quiz_bulk`**
    *   **Input**: `user_id`, `quiz_id`, `answers` (list of `{question_id, answer, time_taken}`).
    *   **Logic**:
        1.  Initialize Engine & Load Questions (just like `start_quiz`).
        2.  Create a "Pseudo-Session".
        3.  Iterate through provided `answers`:
            *   Match with loaded questions.
            *   Call `engine.answer_brain.score_answer` and `bandit_brain`.
            *   Update Knowledge State.
        4.  Generate Final Report using `engine.generate_report`.
        5.  Save to MongoDB (syncing with existing collections).
        6.  Return the Report & Score.

### 2. Backend (`server/src/routes/quiz.ts`)
*   **[MODIFY] `POST /:id/submit`**
    *   Instead of calculating score locally:
        1.  Construct payload for AI Service.
        2.  Call `http://localhost:8000/submit_quiz_bulk`.
        3.  Receive AI Report.
        4.  Save/Update local `QuizSubmission` with AI data (LPA, Strength/Weakness).
        5.  Return response to Frontend in the expected format.

### 3. Backend (`server/src/models/QuizSubmission.ts`)
*   **[MODIFY] Schema**
    *   Add fields to store AI-specific data if missing: `aiReport`, `estimatedLPA`, `jobReadiness`.

## Verification Plan
1.  **Manual Test**:
    *   Start the App & AI Server.
    *   Take a quiz in the UI.
    *   Submit.
    *   **Verify**:
        *   Console logs in `server.py` showing "Bulk Submission Processed".
        *   Frontend shows "Analysis" populated with real AI data (not just mock or simple calcs).
        *   MongoDB `reports` collection has a new entry.
