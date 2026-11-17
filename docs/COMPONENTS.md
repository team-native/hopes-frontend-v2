# hopes v2 컴포넌트 · 디자인 토큰 안내

피그마 **hopes v1.5 Design System**을 코드로 옮긴 컴포넌트와 디자인 토큰 사용법이에요.
화면을 만들 때 여기 있는 부품을 먼저 찾아 쓰고, 없으면 새로 만들어 주세요.

---

## 1. 시작하기

```bash
git switch main
git pull
npm install   # lucide-react, react-markdown 등 새 패키지 설치 (꼭 필요!)
npm run dev
```

**미리보기 페이지**: <http://localhost:5173/dev/components>
모든 컴포넌트를 피그마 이름표와 같은 이름으로 상태별로 볼 수 있어요. 개발 서버에서만 열리고 실제 배포에는 들어가지 않아요.

---

## 2. 디자인 토큰

토큰은 [`src/index.css`](../src/index.css)의 `@theme`에 있어요. **피그마 이름과 같은 이름**을 써요.

### 색 — 의미 토큰만 쓰기

피그마 `카테고리/이름` → 클래스 `유틸리티-카테고리-이름`

| 피그마           | 배경          | 글자                          | 테두리                  |
| ---------------- | ------------- | ----------------------------- | ----------------------- |
| `bg/brand`       | `bg-bg-brand` |                               |                         |
| `text/secondary` |               | `text-text-secondary`         |                         |
| `border/default` |               |                               | `border-border-default` |
| `icon/muted`     |               | `text-icon-muted` (아이콘 색) |                         |

```tsx
// ✅ 좋아요
<p className="text-text-secondary">설명</p>
<div className="bg-bg-canvas border border-border-subtle">...</div>

// ❌ 피하기: 원색(blue-500, slate-700)이나 색 코드 직접 쓰기
<p className="text-slate-500">설명</p>
<div className="bg-[#f7f9fc]">...</div>
```

자주 쓰는 의미 토큰

| 용도                       | 클래스                                                                   |
| -------------------------- | ------------------------------------------------------------------------ |
| 페이지 배경 / 카드 배경    | `bg-bg-canvas` / `bg-bg-surface`                                         |
| 메인 파랑 배경 · 눌렀을 때 | `bg-bg-brand` · `bg-bg-brand-pressed`                                    |
| 연파랑 배경 (선택됨, 배지) | `bg-bg-brand-soft`                                                       |
| 기본 · 보조 · 흐린 글자    | `text-text-primary` · `text-text-secondary` · `text-text-tertiary`       |
| 파란 글자 · 빨간 글자      | `text-text-brand` · `text-text-danger`                                   |
| 연한 · 기본 · 선택 테두리  | `border-border-subtle` · `border-border-default` · `border-border-brand` |

> 토큰표에 없어서 임시로 만든 토큰: `bg-bg-brand-loading`, `bg-bg-brand-disabled`, `bg-bg-inverse`, `border-border-danger` (디자이너 확인 중)

### 글자

크기 · 줄 간격 · 굵기가 한 번에 들어가요. `text-[15px]`처럼 직접 쓰지 말고 아래 중에서 골라 주세요.

| 클래스                             | 크기 / 줄 간격 | 용도                 |
| ---------------------------------- | -------------- | -------------------- |
| `text-display`                     | 40 / 52        | 가장 큰 제목         |
| `text-title`                       | 28 / 38        | 화면 제목            |
| `text-heading`                     | 20 / 28        | 카드 · 팝업 제목     |
| `text-body` · `text-body-strong`   | 16 / 26        | 본문 · 굵은 본문     |
| `text-label` · `text-label-strong` | 14 / 20        | 라벨, 목록, 버튼     |
| `text-caption`                     | 13 / 18        | 작은 설명, 에러 문구 |

굵기만 바꾸고 싶으면 `font-medium`, `font-semibold`를 같이 써요.

### 간격 · 모서리 · 그림자

| 종류            | 클래스                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 간격 (4의 배수) | `2xs` 4 · `xs` 8 · `sm` 12 · `md` 16 · `lg` 20 · `xl` 24 · `2xl` 32 · `3xl` 40 · `4xl` 48 · `5xl` 64 → `mt-md`, `gap-sm`, `p-lg` |
| 모서리          | `rounded-sm` 12 (버튼 · 입력창) · `rounded-md` 16 · `rounded-lg` 22 (카드) · `rounded-xl` 28 (팝업) · `rounded-full`             |
| 그림자          | `shadow-cloud-sm` (카드) · `shadow-cloud-md` (팝업) · `shadow-cloud-brand` (주요 버튼)                                           |

`mt-4`(=16) 같은 숫자 클래스도 같은 4px 단위라 써도 괜찮아요.

---

## 3. 컴포넌트 목록

모든 경로는 `src/components/` 기준이에요. props 설명은 각 파일 맨 위 `interface` 주석에 있어요 (VS Code에서 컴포넌트에 마우스를 올리면 보여요).

### 공통 (`common/`)

| 피그마                 | 컴포넌트                   | 주요 props                                                                                                                       |
| ---------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| —                      | `Button`                   | `size`: `lg`(꽉 찬 50) · `sm` / `variant`: `primary` · `secondary` · `soft` · `danger`(빨강, 회원탈퇴) / `loading`, `inactive`   |
| —                      | `TextField`                | `label`, `errorMessage`, `rightSlot` (오른쪽 아이콘)                                                                             |
| Form/Text Area         | `TextArea`                 | `label?`, `rows`, `errorMessage`                                                                                                 |
| Form/Search Field      | `SearchField`              | `value`, `onChange`, `onSearch`                                                                                                  |
| Web/Dropdown           | `Select`                   | `label`, `options`, `value`, `onChange` / `variant="inline"` → "게시판 · 10기" 모양 / `variant="compact"` → "최신순 ▾" 작은 알약 |
| Form/Checkbox          | `Checkbox`                 | `checked`, `onChange`, children(글자)                                                                                            |
| Form/OTP Digit         | `CodeInput`                | `value`, `onChange`, `length` (기본 6)                                                                                           |
| Nav/Icon Button(Boxed) | `IconButton`               | `icon`(lucide 아이콘), `label`(필수), `variant`: `ghost` · `boxed`, `dot`                                                        |
| Icon/Tile              | `IconTile`                 | `icon`, `size`: `sm` · `md`                                                                                                      |
| Community/Board Badge  | `Badge`                    | children (예: "10기")                                                                                                            |
| Profile/Avatar         | `Avatar`                   | `name`, `size`: `sm` · `md`                                                                                                      |
| —                      | `Modal`                    | `open`, `onClose`, `className` (팝업 틀)                                                                                         |
| —                      | `AlertDialog`              | `open`, `title`, `description`, `onClose` (확인 버튼 하나짜리 팝업)                                                              |
| —                      | `FieldError`               | children (빨간 에러 문구)                                                                                                        |
| —                      | `LogoMark` · `NativeBadge` | 로고 박스 · Native 배지                                                                                                          |

### 채팅 (`chat/`)

| 피그마                 | 컴포넌트           | 주요 props                                               |
| ---------------------- | ------------------ | -------------------------------------------------------- |
| (입력창)               | `ChatInput`        | `onSend(message)`, `onAttach`, `disabled`                |
| Chat/Bubble User       | `UserBubble`       | children (내 메시지)                                     |
| Chat/Bubble Answer     | `AnswerBubble`     | `content` (**마크다운 글**), `footer`                    |
| Chat/Answer Reactions  | `AnswerReactions`  | `onSelect(key)` — 기본 버튼: 좋아요 · 더 물어보기 · 공유 |
| Chat/Related Questions | `RelatedQuestions` | `questions`, `onSelect(question)`                        |
| Chat/Suggestion Row    | `SuggestionRow`    | `text`, `icon?`, `onClick`                               |
| Web/Question Card      | `QuestionCard`     | `question`, `category`, `onClick`                        |

`AnswerBubble`은 AI 답변(마크다운)을 그대로 넘기면 제목, 번호 목록, 코드 블록(복사 버튼), 인용, 링크를 시안 모양으로 그려 줘요.

### 첨부 (`attach/Attachments.tsx`)

| 피그마             | 컴포넌트     | 주요 props                    |
| ------------------ | ------------ | ----------------------------- |
| Attach/Image Thumb | `ImageThumb` | `src?`, `onRemove?`           |
| Attach/PDF Card    | `PdfCard`    | `name`, `pages?`, `onRemove?` |
| Attach/PDF Chip    | `PdfChip`    | `name`, `onClick?`            |

### 커뮤니티 (`community/`)

데이터 모양은 [`community/types.ts`](../src/components/community/types.ts)의 `Post`, `Comment`를 써요.

| 피그마                        | 컴포넌트                                         | 주요 props                                              |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Community/Post Card           | `PostCard`                                       | `post`, `onClick`                                       |
| Community/Post Detail         | `PostDetail`                                     | `post`, `onToggleLike`, `onCommentClick`, `onMoreClick` |
| Community/Comment List        | `CommentList`                                    | `comments`, `onMoreClick`                               |
| Community/Like · Comment Chip | `LikeChip` · `CommentChip` (`ReactionChips.tsx`) | `count`, `liked?`, `onClick`                            |
| Community/Board Select        | `Select` + `variant="inline"`                    | 위 공통 참고                                            |
| Community/FAB Write           | `WriteFab`                                       | `onClick`                                               |
| Web/Modal (글쓰기)            | `WritePostModal`                                 | `open`, `onClose`, `boards`, `onSubmit(values)`         |

### 홈 · 프로필 · 레이아웃

| 피그마                                       | 컴포넌트                                                                                                   | 위치                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------- |
| (사이드바)                                   | `Sidebar` — `activeMenu`, `recentChats`, `activeChatId`, `user`                                            | `layout/Sidebar.tsx`       |
| Layout/Section Header                        | `SectionHeader` — `title`, `action?`                                                                       | `layout/SectionHeader.tsx` |
| Home/Hero Card · Tip Card · Popular Post Row | `HeroCard` · `TipCard` · `PopularPostRow` (웹 시안 기준)                                                   | `home/HomeCards.tsx`       |
| (홈 묶음 카드)                               | `HomePanel` — `title`, `actionText?`, `onAction?`, `divided` · `HomePanelRow` — `title`, `meta`, `onClick` | `home/HomeCards.tsx`       |
| Profile/Profile Card · Stats                 | `ProfileCard` · `ProfileStats`                                                                             | `profile/ProfileCards.tsx` |
| Location/Map Card                            | `MapCard` (지금은 그림, 실제 지도 연동 전)                                                                 | `location/MapCard.tsx`     |

> `HomeCards`는 웹 시안 모양이에요. `TipCard` · `PopularPostRow` · `HomePanelRow`는 줄(`li`)이라 `HomePanel` 안에 넣어서 써요. (`TipCard`는 `divided={false}`)

### 설정 · 알림

| 피그마                                   | 컴포넌트                                                                                                    | 위치                         |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Settings/Prompt · Contact · Account Card | `PromptCard` · `ContactCard` · `AccountCard`                                                                | `settings/SettingsCards.tsx` |
| Web/Settings Nav                         | `SettingsNav` — `active`, `onSelect`, `onLogout`                                                            | `settings/SettingsCards.tsx` |
| Settings/Withdraw Card                   | `WithdrawCard` — `password`, `onPasswordChange`, `error`, `loading`, `onSubmit`, `notice` (메뉴 `withdraw`) | `settings/SettingsCards.tsx` |
| Notify/Notice Row                        | `NoticeRow`                                                                                                 | `feedback/Feedback.tsx`      |
| Feedback/Inline Error                    | `InlineError`                                                                                               | `feedback/Feedback.tsx`      |
| Feedback/Empty State                     | `EmptyState`                                                                                                | `feedback/Feedback.tsx`      |

### 화면 작업 중 추가한 공통 부품

피그마 컴포넌트에 없어서 홈 · 채팅 · 커뮤니티 · 기록 · 마이페이지 · 설정 화면을 만들며 추가한 부품이에요. 미리보기 페이지 "8. 추가 공통 부품"에서 볼 수 있어요.

| 컴포넌트               | 위치                            | 주요 props / 용도                                                                                              |
| ---------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `ChipGroup`            | `common/ChipGroup.tsx`          | `label`, `options`(`value` · `label` · `count?`), `value`, `onChange` — 게시판 · 탭 선택                       |
| `Switch`               | `common/Switch.tsx`             | `checked`, `onChange`, `label`, `disabled`                                                                     |
| `ListCard` · `ListRow` | `common/ListRow.tsx`            | `title`, `description`, `meta`, `icon`, `trailing`, `onClick` — 대화 기록 · 활동 · 설정 목록                   |
| `CardSkeleton`         | `common/CardSkeleton.tsx`       | `count`, `label` — 카드 목록 불러오는 중                                                                       |
| `BackButton`           | `common/BackButton.tsx`         | children, `onClick` — "← 10기 게시판"                                                                          |
| `ActionMenu`           | `common/ActionMenu.tsx`         | `label`, `items` — ⋯ 버튼에 붙는 메뉴 (바깥 클릭 · Esc로 닫힘, `onSelect` 없으면 "준비 중")                    |
| `ActionSheet`          | `common/ActionSheet.tsx`        | `open`, `title`, `items`, `onClose` — 가운데 팝업 메뉴                                                         |
| `ConfirmDialog`        | `common/ConfirmDialog.tsx`      | `open`, `title`, `description`, `confirmText`, `tone`(`danger`), `onConfirm`, `onCancel` — 버튼 두 개짜리 팝업 |
| `Toast`                | `common/Toast.tsx`              | `message` — `hooks/useToast`의 `showToast`와 함께 사용                                                         |
| `AttachmentComposer`   | `chat/AttachmentComposer.tsx`   | 첨부 목록 · 확인 상태가 붙는 채팅 입력창 (첨부가 없으면 `ChatInput`)                                           |
| `AttachDropzone`       | `attach/AttachDropzone.tsx`     | `open`, `onClose`, `onFiles`, `accept` — 파일 끌어다 놓기 영역                                                 |
| `CommentInput`         | `community/CommentInput.tsx`    | `onSubmit(content)`, `inputRef` — 댓글 한 줄 입력                                                              |
| `ReportDialog`         | `community/ReportDialog.tsx`    | `open`, `target`, `reason`, `onReasonChange`, `onSubmit`, `notice` — 신고 사유 팝업                            |
| `SettingToggleRow`     | `settings/SettingToggleRow.tsx` | `title`, `description`, `checked`, `onChange`, `badge` — 설정 한 줄 + 스위치                                   |
| `MobileNav`            | `layout/MobileNav.tsx`          | `activeMenu`, `onNewChat` — 모바일 상단 바 + 메뉴 (데스크톱은 `Sidebar`)                                       |
| `AppLayout`            | `layout/AppLayout.tsx`          | `activeMenu`, `activeConversationId` — 로그인 후 화면 틀 (`Sidebar` + `MobileNav`)                             |

기존 컴포넌트에 추가한 선택 props (기존 사용법은 그대로예요)

- `PdfCard`: `description`, `invalid` — "파일 확인 중…" · 오류 표시
- `WritePostModal`: `mode`(`create` · `edit`), `initialValues`, `authorNotice` — 게시글 수정
- `Sidebar`: `onOpenProfile` — 사용자 영역을 눌러 마이페이지로 이동

### 인증 화면 전용 (`auth/`)

로그인 · 회원가입 · 비밀번호 찾기에서 쓰는 부품이에요: `StepProgress`, `CodeStep`, `PasswordForm`, `ResultPanel`, `AuthFooterLink`, 그리고 레이아웃 `layout/AuthLayout.tsx`.

> 앱 전용이라 웹에서 만들지 않은 것: Overlay/Bottom Sheet, Attach/Attachment Tray, Alert/iOS

---

## 4. 사용 예시

```tsx
import { Plus } from 'lucide-react'
import Button from '../../components/common/Button'
import IconButton from '../../components/common/IconButton'
import PostCard from '../../components/community/PostCard'
import type { Post } from '../../components/community/types'
import { EmptyState } from '../../components/feedback/Feedback'
import SectionHeader from '../../components/layout/SectionHeader'

function CommunityPage({ posts }: { posts: Post[] }) {
  return (
    <section className="space-y-md">
      <SectionHeader title="10기 게시판" action={<IconButton icon={Plus} label="글쓰기" />} />

      {posts.length === 0 ? (
        <EmptyState title="아직 게시글이 없어요" actionText="글쓰기" onAction={openWriteModal} />
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} onClick={() => openPost(post.id)} />)
      )}

      <Button size="sm" variant="secondary">
        더 보기
      </Button>
    </section>
  )
}
```

**너비**: 카드 컴포넌트는 감싸는 영역을 꽉 채워요. 몇 px로 쓸지는 화면에서 정해 주세요 (피그마 컴포넌트 시안은 앱 기준 362).

**아이콘**: 시안 아이콘은 [Lucide](https://lucide.dev/icons)예요. `import { House } from 'lucide-react'`로 가져와서 `<House className="size-5" strokeWidth={1.75} />`처럼 써요.

---

## 5. 그 밖에 알아둘 것

- **페이지 주소**는 [`src/constants/routes.ts`](../src/constants/routes.ts)에 모여 있어요. 메인 · 채팅 · 커뮤니티 · 기록 주소는 화면 담당자와 맞춰서 고쳐 주세요.
- **API**: [`src/api/auth.ts`](../src/api/auth.ts)는 아직 **가짜 응답**이에요(백엔드 연동 전). 새 API는 `src/api/`에 만들고 `src/api/client.ts`(axios)를 써 주세요.
- **학교 상수**(이메일 도메인, 학과, 기수)는 [`src/constants/school.ts`](../src/constants/school.ts)에 있어요.

## 6. 새 컴포넌트를 만들 때

1. 이미 있는 컴포넌트로 만들 수 있는지 먼저 확인해요.
2. 색 · 글자 · 간격은 **토큰만** 써요.
3. 파일 맨 위에 피그마 이름과 props 설명을 주석으로 남겨요. 예: `/** 게시글 카드 (Community/Post Card) */`
4. 아이콘만 있는 버튼에는 `aria-label`(화면 낭독기용 이름)을 꼭 넣어요.
5. [미리보기 페이지](../src/pages/DevComponents/index.tsx)에 상태별로 추가해요.
