# 🗂️ ZUSTAND STORES BLUEPRINT — 49GIG

**Status:** Planning Phase  
**Version:** 0.1.0

---

## 📋 STORE ARCHITECTURE OVERVIEW

Zustand stores are organized by **domain** and follow a **single responsibility principle**. Each store manages a specific slice of application state.

---

## 🏪 STORE DEFINITIONS

### 1. **authStore** — Authentication & User State

**Purpose:** Manages user authentication, session, and role information.

**State:**
```typescript
interface AuthState {
  // User data
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  
  // Session
  sessionToken: string | null;
  sessionExpiry: number | null;
  
  // Loading states
  isLoading: boolean;
  isInitializing: boolean;
  
  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // User methods
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

**Usage:**
- Check authentication status
- Access user role (for UI rendering only)
- Trigger login/logout flows
- Update user profile

**Important:** Role checks here are for **UI rendering only**. All data access is validated server-side in Convex.

---

### 2. **projectStore** — Projects & Milestones

**Purpose:** Manages client projects, intake forms, matches, and milestones.

**State:**
```typescript
interface ProjectState {
  // Projects
  projects: Project[];
  activeProject: Project | null;
  
  // Intake forms
  currentIntakeForm: IntakeForm | null;
  
  // Matches
  matches: Match[];
  selectedMatch: Match | null;
  
  // Milestones
  milestones: Milestone[];
  activeMilestone: Milestone | null;
  
  // Loading states
  isLoadingProjects: boolean;
  isLoadingMatches: boolean;
  isSubmittingIntake: boolean;
  
  // Actions
  fetchProjects: () => Promise<void>;
  createIntakeForm: (form: IntakeForm) => Promise<void>;
  acceptMatch: (matchId: string) => Promise<void>;
  rejectMatch: (matchId: string) => Promise<void>;
  fetchMatches: (projectId: string) => Promise<void>;
  fetchMilestones: (projectId: string) => Promise<void>;
  approveMilestone: (milestoneId: string) => Promise<void>;
  requestMilestoneRevision: (milestoneId: string, feedback: string) => Promise<void>;
}
```

**Usage:**
- Display client dashboard
- Manage project intake forms
- View and manage matches
- Track milestone progress

---

### 3. **chatStore** — Real-Time Chat

**Purpose:** Manages all chat-related state, messages, and real-time updates.

**State:**
```typescript
interface ChatState {
  // Chats
  chats: Chat[];
  activeChat: Chat | null;
  
  // Messages (indexed by chatId)
  messages: Record<string, Message[]>;
  
  // Real-time state
  typingUsers: Record<string, Set<string>>; // chatId -> Set of userIds
  unreadCounts: Record<string, number>; // chatId -> count
  
  // UI state
  isComposing: boolean;
  selectedAttachments: File[];
  
  // Loading states
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  
  // Actions
  fetchChats: () => Promise<void>;
  selectChat: (chatId: string) => void;
  sendMessage: (chatId: string, content: string, attachments?: File[]) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  setTyping: (chatId: string, isTyping: boolean) => void;
  pinMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  uploadAttachment: (file: File) => Promise<string>;
}
```

**Usage:**
- Real-time chat UI
- Message composition
- Read receipts
- Typing indicators
- File attachments

**Real-Time Integration:**
- Convex subscriptions update messages in real-time
- Optimistic UI updates for better UX

---

### 4. **vettingStore** — Vetting & Verification

**Purpose:** Manages freelancer vetting process, progress, and results.

**State:**
```typescript
interface VettingState {
  // Vetting status
  vettingStatus: VettingStatus | null;
  currentStep: VettingStep | null;
  
  // Identity verification
  identityVerification: IdentityVerification | null;
  
  // English proficiency
  englishTest: EnglishTest | null;
  englishScore: number | null;
  
  // Skill assessments
  skillAssessments: SkillAssessment[];
  skillScores: Record<string, number>;
  
  // Overall results
  overallScore: number | null;
  vettingResult: 'pending' | 'approved' | 'flagged' | 'rejected';
  
  // Loading states
  isSubmittingIdentity: boolean;
  isTakingTest: boolean;
  isSubmittingAssessment: boolean;
  
  // Actions
  startVetting: () => Promise<void>;
  submitIdentityVerification: (data: IdentityData) => Promise<void>;
  startEnglishTest: () => Promise<void>;
  submitEnglishTest: (answers: EnglishTestAnswers) => Promise<void>;
  startSkillAssessment: (skillId: string) => Promise<void>;
  submitSkillAssessment: (skillId: string, answers: SkillAnswers) => Promise<void>;
  fetchVettingStatus: () => Promise<void>;
}
```

**Usage:**
- Freelancer onboarding flow
- Vetting progress tracking
- Test taking interface
- Results display

---

### 5. **paymentStore** — Payments & Escrow

**Purpose:** Manages payment status, escrow amounts, and transaction history.

**State:**
```typescript
interface PaymentState {
  // Payment methods
  paymentMethods: PaymentMethod[];
  defaultPaymentMethod: PaymentMethod | null;
  
  // Escrow
  escrowedAmounts: Record<string, number>; // projectId -> amount
  totalEscrowed: number;
  
  // Transactions
  transactions: Transaction[];
  
  // Stripe
  stripeClientSecret: string | null;
  paymentIntentId: string | null;
  
  // Loading states
  isProcessingPayment: boolean;
  isFetchingTransactions: boolean;
  isReleasingMilestone: boolean;
  
  // Actions
  preFundProject: (projectId: string, amount: number) => Promise<void>;
  addPaymentMethod: (paymentMethod: PaymentMethod) => Promise<void>;
  releaseMilestone: (milestoneId: string) => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchEscrowStatus: (projectId: string) => Promise<void>;
}
```

**Usage:**
- Payment processing UI
- Escrow status display
- Transaction history
- Milestone release

---

### 6. **disputeStore** — Disputes & Moderation

**Purpose:** Manages disputes, evidence, and resolution status.

**State:**
```typescript
interface DisputeState {
  // Disputes
  disputes: Dispute[];
  activeDispute: Dispute | null;
  
  // Evidence
  evidence: Record<string, Evidence[]>; // disputeId -> evidence
  
  // Resolution
  resolution: DisputeResolution | null;
  
  // Loading states
  isLoadingDisputes: boolean;
  isSubmittingDispute: boolean;
  isSubmittingEvidence: boolean;
  isResolvingDispute: boolean;
  
  // Actions
  fetchDisputes: () => Promise<void>;
  initiateDispute: (projectId: string, type: DisputeType, reason: string) => Promise<void>;
  submitEvidence: (disputeId: string, evidence: Evidence) => Promise<void>;
  respondToDispute: (disputeId: string, response: string) => Promise<void>;
  requestFreelancerReplacement: (projectId: string) => Promise<void>;
}
```

**Usage:**
- Dispute initiation UI
- Evidence submission
- Dispute resolution tracking
- Moderator dispute management

---

### 7. **uiStore** — UI State & Preferences

**Purpose:** Manages global UI state, modals, notifications, and user preferences.

**State:**
```typescript
interface UIState {
  // Modals
  activeModal: string | null;
  modalProps: Record<string, any>;
  
  // Notifications
  notifications: Notification[];
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Loading overlays
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Actions
  openModal: (modalId: string, props?: Record<string, any>) => void;
  closeModal: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}
```

**Usage:**
- Modal management
- Toast notifications
- Theme switching
- Global loading states
- Sidebar state

---

### 8. **matchingStore** — Matching Engine (Client-Side)

**Purpose:** Manages match suggestions, match details, and client match actions.

**State:**
```typescript
interface MatchingState {
  // Matches
  suggestedMatches: Match[];
  matchDetails: Record<string, MatchDetails>; // matchId -> details
  
  // Match explanations
  matchExplanations: Record<string, MatchExplanation>; // matchId -> explanation
  
  // Loading states
  isLoadingMatches: boolean;
  isAcceptingMatch: boolean;
  isRejectingMatch: boolean;
  
  // Actions
  fetchMatches: (projectId: string) => Promise<void>;
  fetchMatchDetails: (matchId: string) => Promise<void>;
  acceptMatch: (matchId: string) => Promise<void>;
  rejectMatch: (matchId: string) => Promise<void>;
  requestMoreMatches: (projectId: string) => Promise<void>;
}
```

**Usage:**
- Match suggestion UI
- Match details display
- Match acceptance/rejection
- Match explanation display

---

## 🔄 STORE INTERACTIONS

### Common Patterns

**1. Auth → All Stores**
- All stores check `authStore.isAuthenticated` before making API calls
- User role from `authStore` used for conditional UI rendering

**2. Project → Chat**
- When a project is selected, `chatStore` fetches project chat
- Project milestones trigger system messages in chat

**3. Project → Payment**
- Project creation triggers pre-funding flow in `paymentStore`
- Milestone completion triggers payment release

**4. Chat → Dispute**
- Chat messages can be attached as evidence in disputes
- Dispute initiation creates a support chat

---

## 📦 STORE IMPLEMENTATION PATTERNS

### TypeScript Strict Mode
All stores use strict TypeScript with proper types.

### Convex Integration
Stores call Convex queries/mutations/actions:
```typescript
const fetchProjects = async () => {
  set({ isLoadingProjects: true });
  try {
    const projects = await convex.query(api.projects.queries.list, {});
    set({ projects, isLoadingProjects: false });
  } catch (error) {
    // Error handling
    set({ isLoadingProjects: false });
  }
};
```

### Optimistic Updates
For better UX, stores support optimistic updates:
```typescript
const sendMessage = async (chatId: string, content: string) => {
  // Optimistic update
  const tempMessage = createTempMessage(content);
  set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), tempMessage],
    },
  }));
  
  // Real update
  try {
    await convex.mutation(api.chat.mutations.send, { chatId, content });
  } catch (error) {
    // Rollback optimistic update
  }
};
```

### Real-Time Subscriptions
Stores subscribe to Convex real-time queries:
```typescript
useEffect(() => {
  const unsubscribe = convex.subscribe(api.chat.queries.messages, { chatId }, (messages) => {
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    }));
  });
  return () => unsubscribe();
}, [chatId]);
```

---

## ✅ STORE VALIDATION

**Client-Side Validation:**
- Form validation before API calls
- Type checking with TypeScript
- State consistency checks

**Server-Side Validation:**
- All mutations validated in Convex
- Role checks in Convex
- Data integrity enforced server-side

---

## 📝 NEXT STEPS

1. Implement store structure
2. Integrate with Convex queries/mutations
3. Add real-time subscriptions
4. Implement optimistic updates
5. Add error handling & retry logic

---

**Status:** ✅ Blueprint Complete — Ready for Implementation

