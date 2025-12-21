# AI Matching Implementation Plan

## Tổng Quan

Tài liệu này định nghĩa các use cases, flow và UI cho chức năng AI Matching trong website G-Bridge.

## Use Cases Chi Tiết

### Use Case 1: Organization - AI Suggest Interpreters khi tạo Job mới

**Actor:** Organization (Client role)

**Preconditions:**
- Organization đã đăng nhập
- Organization có ít nhất một organization profile
- Organization đang ở trang Post Job

**Main Flow:**
1. Organization điền form tạo job mới với đầy đủ thông tin (title, description, requirements, etc.)
2. Organization submit form
3. Backend lưu job vào database
4. Backend tự động gọi AI service `/api/ai-match/job/:jobId/match` với maxResults=10
5. AI service phân tích job requirements và match với tất cả available interpreters
6. AI service trả về top 10 interpreters được rank theo suitability score
7. Frontend hiển thị modal "AI Suggested Interpreters" với:
   - Danh sách interpreters với suitability score badge
   - Match priority ranking
   - Recommendation text cho mỗi interpreter
8. Organization có thể:
   - Click "View Match Details" để xem chi tiết analysis (reasons, strengths, weaknesses)
   - Click "Invite" để invite interpreter (TODO: implement invite functionality)
   - Click "Dismiss" hoặc close modal để tiếp tục
9. Sau khi đóng modal, organization được redirect về Dashboard

**Alternative Flows:**
- **A1:** AI service không available → Modal không hiển thị, job vẫn được tạo thành công
- **A2:** Không có interpreters phù hợp → Modal hiển thị "No matches found"
- **A3:** Organization đóng modal ngay → Redirect về Dashboard

**Postconditions:**
- Job được tạo thành công
- AI suggestions được hiển thị (nếu available)
- Organization có thể quay lại xem suggestions sau

**UI Screenshots/Notes:**
- Modal có gradient background để highlight
- Mỗi interpreter card có avatar, name, languages, score badge
- Score badge có color coding (green=excellent, blue=good, yellow=fair, red=poor)

### Use Case 2: Organization - AI Rank Applications

**Actor:** Organization (Client role)

**Preconditions:**
- Organization đã đăng nhập
- Organization đã tạo job và có applications
- Organization đang ở Job Detail Page

**Main Flow:**
1. Organization mở job detail page của job mình đã tạo
2. Organization scroll xuống section "Applications"
3. Component `AIRankedApplications` tự động:
   - Gọi API `/api/ai-match/filter-applications/:jobId?minScore=50&maxResults=20`
   - AI service score từng application
   - Rank applications theo suitability score
4. Applications được hiển thị với:
   - Toggle buttons: "AI Ranked" (default) và "Date Posted"
   - Filter dropdown: All Scores / Excellent (90+) / Good (70-89) / Fair (50-69)
   - Mỗi application card có:
     - Suitability score badge
     - Rank number (#1, #2, etc.)
     - Expandable "Show Match Analysis" button
     - Application details (cover letter, resume, etc.)
5. Organization click "Show Match Analysis" → Xem detailed breakdown:
   - Overall score với circular progress
   - Category scores (Language, Specialization, Experience, etc.)
   - Strengths list (green)
   - Weaknesses list (yellow)
   - Recommendation text
6. Organization có thể:
   - Filter by score level
   - Switch to "Date Posted" để xem theo thời gian
   - View details và make decision (Accept/Reject)

**Alternative Flows:**
- **A1:** AI service timeout → Fallback to date-sorted list
- **A2:** No applications → Show empty state
- **A3:** All applications score < 50 → Show warning message

**Postconditions:**
- Applications được rank và hiển thị
- Organization có thể filter và sort
- Organization có thể view detailed analysis

### Use Case 3: Interpreter - AI Suggest Jobs

**Actor:** Interpreter

**Preconditions:**
- Interpreter đã đăng nhập
- Interpreter có profile đầy đủ (languages, specializations, experience)
- Interpreter đang ở Find Job Page

**Main Flow:**
1. Interpreter mở Find Job Page
2. Component `AISuggestedJobsSection` tự động:
   - Lấy interpreter profile từ user context
   - Gọi API để lấy tất cả open jobs (limit 50)
   - Với mỗi job, gọi `/api/ai-match/score/:jobId/:interpreterId`
   - Rank jobs theo suitability score
   - Lấy top 5 jobs
3. Section "Jobs Recommended for You" hiển thị ở đầu page với:
   - Gradient purple background để highlight
   - Info tooltip: "These jobs are matched to your profile using AI"
   - Grid of job cards, mỗi card có:
     - Job title, company, location, salary
     - Suitability score badge
     - Recommendation text
     - "View Details" và "Apply Now" buttons
4. Interpreter có thể:
   - Click "View Details" → Navigate to job detail page
   - Click "Apply Now" → Navigate to job detail page để apply
   - Scroll down để xem tất cả jobs (regular listing)

**Alternative Flows:**
- **A1:** Interpreter chưa có profile → Section không hiển thị
- **A2:** AI service error → Section không hiển thị, page vẫn hoạt động bình thường
- **A3:** No jobs match → Section không hiển thị

**Postconditions:**
- Top 5 recommended jobs được hiển thị
- Interpreter có thể apply ngay hoặc xem chi tiết

### Use Case 4: Client - AI Recommend Interpreters (Context-based)

**Actor:** Client (Organization)

**Preconditions:**
- Client đã đăng nhập
- Client đang ở Find Interpreter Page
- Client có job context (jobId trong URL query param) - optional

**Main Flow:**
1. Client mở Find Interpreter Page
   - **Scenario A:** Có jobId trong URL (từ job detail page)
   - **Scenario B:** Không có jobId (normal search)
2. **Nếu có jobId:**
   - Component tự động gọi `/api/ai-match/job/:jobId/match?maxResults=5`
   - AI service match job với interpreters
   - Hiển thị section "AI Recommended Interpreters for This Job" ở đầu page
   - Mỗi interpreter card có:
     - Name, languages
     - Suitability score badge
     - Rank number
     - Recommendation text
     - "View Profile" button
3. **Nếu không có jobId:**
   - Section không hiển thị
   - Client có thể search/filter như bình thường
4. Client click "View Profile" → Mở interpreter profile modal

**Alternative Flows:**
- **A1:** jobId invalid → Section không hiển thị
- **A2:** No interpreters match → Section không hiển thị
- **A3:** AI service error → Section không hiển thị, normal search vẫn hoạt động

**Postconditions:**
- AI recommended interpreters được hiển thị (nếu có jobId)
- Client có thể view profiles và contact interpreters

## Use Cases

### 1. Organization - AI Suggest Interpreters khi tạo Job mới

**Mục đích:** Khi organization tạo job mới, AI tự động suggest các interpreters phù hợp.

**Vị trí:** `PostJobPage` - Sau khi job được tạo thành công

**Flow:**
```
1. Organization tạo job mới
2. Job được lưu vào database
3. Backend tự động gọi AI service để match interpreters
4. Hiển thị modal/popup với danh sách AI-suggested interpreters
5. Organization có thể:
   - Xem chi tiết từng interpreter
   - Xem suitability score và reasons
   - Invite interpreters trực tiếp
   - Bỏ qua và đợi applications
```

**UI Components:**
- Modal: "AI Suggested Interpreters"
- List: Top 5-10 interpreters với score
- Card: Interpreter card với suitability score badge
- Button: "View Details", "Invite", "Dismiss"

### 2. Organization - AI Rank Applications

**Mục đích:** Organization xem applications đã được AI rank theo suitability.

**Vị trí:** `JobDetailPage` - Tab "Applications"

**Flow:**
```
1. Organization mở job detail page
2. Click tab "Applications"
3. Backend gọi AI service để filter và rank applications
4. Hiển thị applications đã được rank:
   - Top applications (score >= 70) ở đầu
   - Medium applications (50-69) ở giữa
   - Low applications (< 50) ở cuối hoặc ẩn
5. Organization có thể:
   - Xem suitability score cho từng application
   - Xem detailed reasons (strengths/weaknesses)
   - Filter by score level
   - Sort by score hoặc date
```

**UI Components:**
- Toggle: "AI Ranked" / "Date Posted"
- Filter: Score level (Excellent/Good/Fair)
- Badge: Suitability score trên mỗi application card
- Expandable section: "Why this match?" với reasons
- Progress bar: Visual score indicator

### 3. Organization - View AI Match Details

**Mục đích:** Xem chi tiết tại sao một interpreter phù hợp với job.

**Vị trí:** `JobDetailPage` - Trong AI suggested interpreters modal hoặc application detail

**Flow:**
```
1. Organization click "View Match Details" trên interpreter/application
2. Backend gọi AI service để score suitability
3. Hiển thị detailed breakdown:
   - Overall score với visual indicator
   - Category scores (Language, Specialization, Experience, etc.)
   - Strengths list
   - Weaknesses list
   - Recommendation text
```

**UI Components:**
- Modal: "AI Match Analysis"
- Score visualization: Circular progress hoặc bar chart
- Category breakdown: Cards với scores cho từng category
- Lists: Strengths (green) và Weaknesses (yellow)
- Text: Recommendation

### 4. Interpreter - AI Suggest Jobs

**Mục đích:** Interpreter xem jobs được AI suggest dựa trên profile.

**Vị trí:** `FindJobPage` - Tab "AI Suggestions" hoặc section riêng

**Flow:**
```
1. Interpreter mở Find Job page
2. Click tab "AI Suggestions" hoặc thấy section "Jobs for You"
3. Backend gọi AI service để match jobs với interpreter profile
4. Hiển thị top jobs với suitability scores
5. Interpreter có thể:
   - Xem match score
   - Xem reasons tại sao job phù hợp
   - Apply trực tiếp
   - Save job
```

**UI Components:**
- Tab: "AI Suggestions" trong FindJobPage
- Section: "Jobs Recommended for You"
- Job card: Với AI match badge
- Badge: Suitability score
- Button: "Why this match?" để xem details

### 5. Client - AI Suggest Interpreters khi tìm

**Mục đích:** Client tìm interpreters với AI suggestions.

**Vị trí:** `FindInterpreterPage` - Section "AI Recommended"

**Flow:**
```
1. Client mở Find Interpreter page
2. Có thể filter/search như bình thường
3. Section "AI Recommended" hiển thị top interpreters
4. Hoặc khi client có job context, AI suggest interpreters cho job đó
```

**UI Components:**
- Section: "AI Recommended Interpreters"
- Interpreter card: Với match score
- Badge: "AI Match" hoặc suitability score

## Flow Diagrams

### Flow 1: Organization tạo Job → AI Suggest Interpreters

```
┌─────────────┐
│ Organization│
│  Tạo Job    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Backend Save   │
│  Job to DB      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend Call   │
│  AI Service     │
│  /match/job     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  AI Service     │
│  Score all      │
│  Interpreters   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Return Ranked  │
│  Results        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Show Modal     │
│  "AI Suggested  │
│  Interpreters"  │
└─────────────────┘
```

### Flow 2: Organization xem Applications → AI Rank

```
┌─────────────┐
│ Organization│
│  Opens Job  │
│  Detail     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Click Tab      │
│  "Applications"  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend Fetch  │
│  Applications   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend Call    │
│  AI Service      │
│  /filter/apps    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  AI Service     │
│  Score each app  │
│  & Rank         │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Display Ranked │
│  Applications   │
│  with Scores    │
└─────────────────┘
```

### Flow 3: Interpreter xem AI Suggested Jobs

```
┌─────────────┐
│ Interpreter │
│  Opens Find │
│  Job Page   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Click Tab      │
│  "AI Suggestions"│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend Get    │
│  Interpreter    │
│  Profile        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend Call   │
│  AI Service     │
│  Match jobs     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Display Jobs   │
│  with Match     │
│  Scores         │
└─────────────────┘
```

## UI Components Design

### 1. SuitabilityScoreBadge Component

**Props:**
- `score`: number (0-100)
- `level`: "excellent" | "good" | "fair" | "poor"
- `size`: "small" | "medium" | "large"

**Visual:**
- Circular progress indicator
- Color coding:
  - Excellent (90-100): Green
  - Good (70-89): Blue
  - Fair (50-69): Yellow
  - Poor (0-49): Red
- Score number in center

### 2. MatchReasonsCard Component

**Props:**
- `reasons`: Array of {category, score, explanation}
- `strengths`: Array of strings
- `weaknesses`: Array of strings
- `recommendation`: string

**Visual:**
- Expandable card
- Category breakdown với progress bars
- Strengths list (green checkmarks)
- Weaknesses list (yellow warnings)
- Recommendation text box

### 3. AIMatchModal Component

**Props:**
- `title`: string
- `matches`: Array of match results
- `onClose`: function
- `onViewDetails`: function

**Visual:**
- Modal overlay
- Header với title và close button
- List of matches với cards
- Each card: Avatar, name, score badge, action buttons

### 4. AIRankedApplicationsList Component

**Props:**
- `applications`: Array of applications with scores
- `onFilterChange`: function
- `onSortChange`: function

**Visual:**
- Filter bar: Score level filter, Sort dropdown
- Application cards với:
  - Score badge
  - Expandable "Why this match?" section
  - Application details
  - Actions (Approve, Reject, View Details)

### 5. AISuggestedJobsSection Component

**Props:**
- `jobs`: Array of jobs with match scores
- `interpreterId`: number

**Visual:**
- Section header: "Jobs Recommended for You"
- Job cards với:
  - AI match badge
  - Suitability score
  - "Why this match?" button
  - Apply button

## Implementation Checklist

### Backend
- [x] AI Service (Python FastAPI)
- [x] AI Service Client (Node.js)
- [x] AI Matching Controllers
- [x] AI Matching Routes
- [x] Add AI matching to JobService (auto-suggest after job creation)
- [x] Add AI filtering to JobApplicationService

### Frontend Components
- [x] SuitabilityScoreBadge component
- [x] MatchReasonsCard component
- [x] AIMatchModal component
- [x] AIRankedApplications component
- [x] AISuggestedJobsSection component
- [x] AI service integration in frontend

### Pages Integration
- [x] PostJobPage: Show AI suggestions after job creation
- [x] JobDetailPage: AI ranked applications tab
- [x] JobDetailPage: AI match details modal
- [x] FindJobPage: AI suggestions section for interpreters
- [x] FindInterpreterPage: AI recommended section (when jobId provided)

### Testing
- [ ] Test AI matching accuracy
- [ ] Test UI components
- [ ] Test error handling
- [ ] Test performance với nhiều interpreters/jobs

## API Endpoints Usage

### 1. Match Job to Interpreters
```
GET /api/ai-match/job/:jobId/match?maxResults=10
```
**Use in:** PostJobPage (after creation), JobDetailPage

### 2. Score Suitability
```
GET /api/ai-match/score/:jobId/:interpreterId
```
**Use in:** Match details modal, application detail

### 3. Filter Applications
```
GET /api/ai-match/filter-applications/:jobId?minScore=50&maxResults=20
```
**Use in:** JobDetailPage applications tab

## User Experience Flow

### Organization Workflow
1. Tạo job → See AI suggestions → Invite interpreters
2. View job → Applications tab → See AI ranked applications
3. Click application → See match details → Make decision

### Interpreter Workflow
1. Open Find Job → AI Suggestions tab → See recommended jobs
2. Click job → See match score → Apply if interested

### Client Workflow
1. Open Find Interpreter → See AI recommended section
2. Click interpreter → See profile → Contact

## Performance Considerations

1. **Caching:** Cache AI results cho cùng job-interpreter pair
2. **Lazy Loading:** Load AI suggestions on demand, not on page load
3. **Pagination:** Limit results to top 10-20 matches
4. **Background Processing:** Process AI matching in background, show loading state

## Error Handling

1. **AI Service Unavailable:** Show fallback (regular list without AI ranking)
2. **Timeout:** Show error message, allow retry
3. **No Results:** Show "No matches found" message
4. **Invalid Data:** Validate before sending to AI service

