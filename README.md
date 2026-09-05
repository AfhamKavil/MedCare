# MedCare

**"One patient. Three roles. One continuous clinical story."**

MedCare is a unified clinical platform that bridges the gap between patients, nurses, and doctors. By utilizing a shared, centralized clinical state, any action taken by one role is immediately propagated and contextualized for the others.

## 🚀 Key Features

### 🔄 Shared Clinical State (Single Source of Truth)
Powered by Zustand, the platform maintains a synchronized in-memory clinical state. A patient's vitals, priority, handover notes, and pending actions are universally accessible. When a nurse updates a patient's SpO₂, the doctor's dashboard instantly alerts them, and the clinical audit trail logs the change.

### 👩‍⚕️ Nurse Dashboard
- **Ward Management:** Real-time view of assigned patients and their clinical priorities (Urgent, Priority, Stable).
- **Interactive Vitals:** Editable vital signs (BP, HR, SpO₂, Temp) with automatic delta calculations to highlight significant changes since the last handover.
- **Handover Snapshot:** Capture baseline vitals and notes at shift changes.
- **Audit Trail:** Chronological log of all clinical actions and mutations.

### 👨‍⚕️ Doctor Dashboard
- **Critical Alerts:** Immediate visibility of deteriorating patients based on the shared clinical state.
- **Auto SBAR:** One-click generation of SBAR (Situation, Background, Assessment, Recommendation) reports directly derived from real patient data.
- **Clinical Calculators:** Integrated medical calculators (BMI, MAP, BSA) that automatically pre-fill using the selected patient's metrics.

### 🧑‍🦽 Patient Experience
- **AI Triage Council:** A comprehensive symptom checker (`/patient/triage`). It uses a deterministic safety rules engine combined with a simulated multi-agent AI council (Clinical, Urgency, Safety, Communication agents) to evaluate symptoms and assign clinical urgency safely.
- **Surgery Journey:** A step-by-step, state-driven educational guide demystifying the surgical process from admission to recovery.
- **Medico-Legal Quiz ("Dhamu vs The Law"):** An interactive, humorous, yet educational module teaching patients about their rights, informed consent, and proper grievance procedures.

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **UI Library:** React
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Strict Dark Mode + Pastel Card Design System)
- **State Management:** Zustand (`lib/store.ts`)

## 🎨 Design System

MedCare employs a custom aesthetic designed to feel premium, modern, and accessible:
- **Background:** Deep dark mode (`#121212`)
- **Accents:** Distinctive pastel cards (Teal, Pink, Yellow, Purple) to visually categorize information without overwhelming the user.
- **Typography:** Clean sans-serif with strong tracking for legibility in clinical settings.

## 📂 Project Structure

```
├── app/
│   ├── api/triage/        # Backend API route for the AI Triage Council
│   ├── doctor/dashboard/  # Doctor interface (Alerts, SBAR, Calculators)
│   ├── nurse/dashboard/   # Nurse interface (Vitals, Deltas, Handover)
│   ├── patient/           # Patient portal (Triage, Surgery Journey, Medico-Legal Quiz)
│   ├── login/             # Role-based authentication routing
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Tailwind config & CSS variables
├── lib/
│   └── store.ts           # The Zustand shared clinical state engine
├── scripts/
│   └── test-triage.mjs    # Comprehensive test suite for the triage API
└── public/                # Static assets
```

## 🏁 Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 🧪 Running Tests

The AI Triage Council includes a backend test suite to verify hard safety rules and agent decision logic. To run the tests (ensure the dev server is running concurrently):

```bash
node scripts/test-triage.mjs
```

## 🛡️ Architecture Notes

- **In-Memory State:** Currently, the Zustand store is in-memory for demonstration purposes. State resets on full page reloads. Client-side navigation (`next/link` or `router.push`) preserves the state across dashboards.
- **Mock AI Agents:** The `/api/triage` route simulates structured LLM responses. For production, the mock function bodies can be swapped with real fetch calls to OpenAI/Anthropic APIs.
