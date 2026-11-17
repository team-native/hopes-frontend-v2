# 첨부 파일 업로드

채팅 첨부(이미지 · PDF)는 고르는 즉시 서버에 올리고, 메시지를 보낼 때는 서버가 준 첨부 id만 보낸다.
서버 규칙은 `hopes-server-v1`의 `feature/Attachments.kt`와 `application.yml`(`hopes.attachments`) 기준이다.

## 지원 형식 · 한도

| 형식 | 확장자          | MIME 타입         | 파일 시그니처             |
| ---- | --------------- | ----------------- | ------------------------- |
| JPEG | `.jpg`, `.jpeg` | `image/jpeg`      | `FF D8 FF`                |
| PNG  | `.png`          | `image/png`       | `89 50 4E 47 0D 0A 1A 0A` |
| PDF  | `.pdf`          | `application/pdf` | `%PDF` (`25 50 44 46`)    |

- **HEIC는 서버가 받지 않는다**(`415 PNG/JPEG/PDF만 지원합니다`). 그래서 프론트에서도 고를 수 없게 했다.
- 파일당 5MB, 한 메시지에 3개, 합계 12MB, PDF 50쪽까지. 첨부는 30일 보관된다.
- 프론트 값은 [`src/utils/attachments.ts`](../src/utils/attachments.ts)에 있다. 서버 환경 변수로 한도가 바뀌면 함께 수정한다.

## 검증 책임

클라이언트 검증은 **사용자에게 빨리 알려 주기 위한 것**이고, 보안 경계는 서버다.

| 항목          | 클라이언트                  | 서버                                       |
| ------------- | --------------------------- | ------------------------------------------ |
| 확장자 · MIME | ✅ 허용 목록                | ✅ 내용으로 판별, 선언한 MIME과 다르면 415 |
| 파일 시그니처 | ✅ 앞 12바이트              | ✅ 이미지 디코딩 · 확장자와 내용 일치 확인 |
| 크기 · 개수   | ✅ 5MB · 3개 · 합계 12MB    | ✅ 같은 제한 + 사용자별 저장 한도(100MB)   |
| PDF           | ✅ pdf.js로 쪽수 확인(50쪽) | ✅ 손상 · 암호화 · 쪽수 제한               |
| 이미지        | 미리보기 생성               | ✅ 해상도 제한                             |

## 흐름

```
1. 고르기      브라우저 확인(형식 · 크기 · 개수 · 시그니처 · PDF 쪽수)
2. 업로드      POST /api/attachments?clientRequestId={로컬 id}  multipart: file
               → 201 AttachmentDto { id, type, fileName, mimeType, sizeBytes, status, previewUrl, expiresAt }
               → 4xx { code, message }  — message를 그 파일 아래에 보여 준다
3. 지우기      보내기 전에 지우면 DELETE /api/attachments/{id}
4. 보내기      POST /api/chats/{id}/messages { content, attachmentIds, departmentId, specialtyId, clientRequestId }
5. 다시 보기   GET /api/attachments/{id} (메타데이터), GET /api/attachments/{id}/content (파일, 로그인 필요)
```

- 업로드의 `clientRequestId`는 첨부의 로컬 id다. 같은 파일을 다시 올려도 서버에 하나만 남는다.
- 메시지의 `clientRequestId`는 같은 질문(내용 + 첨부)을 다시 보낼 때 같은 값을 쓴다. 답변이 늦어 다시 눌러도 질문이 한 번만 저장된다.
- `previewUrl`(`/api/attachments/{id}/content`)은 로그인 토큰이 필요해서 `<img src>`에 바로 쓰지 않고 `getAttachmentContent`로 받아 Blob URL로 보여 준다.

## 첨부 상태 (프론트)

- `processing`: 브라우저 확인 또는 서버 업로드 중
- `ready`: 서버 업로드까지 끝남(`serverId` 있음). 전송 가능
- `error`: 확인 · 업로드 실패. 제거해야 전송할 수 있다.

## 리소스 정리 (프론트)

- 미리보기 URL(`URL.createObjectURL`)은 전송 전에는 입력창(`useAttachmentDraft`)이 소유한다. 첨부를 지우거나 화면을 벗어나면 해제한다.
- 전송한 첨부의 URL은 대화(`ConversationProvider`)가 소유하고, 대화를 삭제할 때 해제한다.
- 첨부마다 `AbortController`를 둔다. 업로드 중에 지우면 끝난 업로드를 서버에서도 지운다. pdf.js 작업은 `finally`에서 `destroy()`한다.
