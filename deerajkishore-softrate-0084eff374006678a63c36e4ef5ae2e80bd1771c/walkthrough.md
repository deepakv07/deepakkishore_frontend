# Link AI Service Walkthrough

I have successfully linked the **Main Backend (Node.js)** to the **AI Service (Python)**. 

Now, when a user submits a quiz on the frontend:
1.  The **Frontend** sends the submission to the **Main Backend** (as before).
2.  The **Main Backend** forwards the data to the **AI Service** (`/submit_quiz_bulk`).
3.  The **AI Service** processes the quiz using its Neural Brains (Bandit, Topic Analysis).
4.  The **AI Service** returns a detailed report and score.
5.  The **Main Backend** saves this AI-enhanced data to MongoDB and returns the result to the user.

## Troubleshooting

### "Port Already In Use" Error
If you see `socket address ... is normally permitted`, it means the AI server is already running (perhaps in the background).
*   **Solution**: Close any existing terminal running the server, or kill the python process.

### "No Active Questions" Warning
If you see `⚠️ No questions found in database` on startup:
*   **Don't Panic**: This checks the legacy global `questions` collection. If your questions are stored inside Quizzes (the default for this app), the AI engine will still find them correctly during the quiz. You can ignore this warning.

## Changes Made

### 1. AI Service (`server.py`)
*   **Added `/submit_quiz_bulk` Endpoint**: A new API route that accepts a full quiz submission at once.
    *   It creates a "pseudo-session" to allow the stateful AI engine to process the stateless bulk submission.
    *   It scores answers using the `AnswerUnderstandingBrain` (Semantic NLP) instead of simple string matching.
    *   It updates the `KnowledgeBrain` to track user strengths/weaknesses.

### 2. Main Backend (`quiz.ts`)
*   **Updated `POST /:id/submit`**: 
    *   Now attempts to call the AI Service first.
    *   If successful, it saves the AI-calculated score and uses the AI's logic for "Pass/Fail".
    *   If the AI Service is down, it gracefully **falls back** to the old local grading logic, ensuring the app never breaks for the user.

### 3. Database Schema (`QuizSubmission.ts`)
*   Added fields to store the AI metadata:
    *   `aiProcessed`: Boolean flag.
    *   `aiReportId`: Link to the detailed report in the `reports` collection.
    *   `estimatedLPA`: Placeholder for future salary prediction storage.

## How to Verify

1.  **Ensure both servers are running**:
    *   Backend: `http://localhost:3000`
    *   AI Service: `http://localhost:8000`
2.  **Take a Quiz**: Go to the frontend and complete a full quiz.
3.  **Check Logs**:
    *   **Backend Console**: Look for `🤖 Function Call: Forwarding to AI Engine...` and `✅ AI Engine processed submission successfully.`
    *   **AI Console**: Look for `Processing BULK submission for user...` and `📄 Bulk AI Report saved`.
4.  **Check Result**: The score displayed on the result page is now coming from the AI (which might give partial credit for descriptive answers!), not just 0 or 1.
