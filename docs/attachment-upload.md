# 첨부 파일 업로드 설계

채팅 첨부(이미지·PDF)를 서버와 연동하기 전에 맞춰 둘 검증 범위와 API 형태를 정리한다.
현재 프론트는 목업 단계라 파일을 브라우저 안에서만 확인하고 서버로 보내지 않는다.

## 지원 형식

| 형식 | 확장자 | MIME 타입 | 파일 시그니처 |
| --- | --- | --- | --- |
| JPEG | `.jpg`, `.jpeg` | `image/jpeg` | `FF D8 FF` |
| PNG | `.png` | `image/png` | `89 50 4E 47 0D 0A 1A 0A` |
| HEIC | `.heic` | `image/heic`, `image/heif` | 4–8바이트 `ftyp` + 브랜드 `heic`/`heix`/`mif1` 등 |
| PDF | `.pdf` | `application/pdf` | `%PDF` (`25 50 44 46`) |

- 파일당 최대 20MB, 한 번에 최대 5개
- 규칙의 기준 값은 [`src/utils/attachments.ts`](../src/utils/attachments.ts)에 있다. 서버와 값을 바꿀 때 함께 수정한다.

## 검증 책임

클라이언트 검증은 **사용자에게 빨리 알려주기 위한 것**이고, 보안 경계는 서버다.
클라이언트 검증은 우회할 수 있으므로 서버는 클라이언트 결과를 믿지 않고 모두 다시 확인한다.

| 항목 | 클라이언트 (현재 구현) | 서버 (연동 시 필요) |
| --- | --- | --- |
| 확장자 | ✅ 허용 목록 | ✅ 허용 목록 |
| MIME 타입 | ✅ `File.type` 확인. 빈 값(브라우저가 모르는 형식, 주로 HEIC)이면 확장자와 시그니처로 판단 | ✅ 요청 `Content-Type`은 참고만 하고 실제 내용으로 판별 |
| 파일 시그니처 | ✅ 앞 12바이트 확인 | ✅ 내용 기반 판별 (예: Apache Tika, libmagic) |
| 크기·개수 | ✅ 20MB / 5개 | ✅ 같은 제한 + 요청 전체 크기 제한 |
| PDF 구조 | ✅ pdf.js로 열어서 쪽수 확인 | ✅ 파싱 가능 여부, 암호화·쪽수 제한, 내장 스크립트 처리 정책 |
| 이미지 | HEIC는 브라우저가 디코딩 가능할 때만 미리보기 | ✅ 디코딩 확인, 픽셀 수 제한(압축 폭탄 방지), EXIF 위치정보 제거 |
| 악성 코드 | — | ✅ 바이러스 검사 |
| 파일명 | — | ✅ 저장 시 서버가 만든 ID를 사용, 원본 이름은 메타데이터로만 보관 |

## 첨부 상태 (프론트)

`LocalAttachment.status`는 **로컬 처리 상태**이며 서버 업로드 진행률이 아니다.

- `processing`: 시그니처 확인, PDF 쪽수 계산, HEIC 미리보기 가능 여부 확인 중
- `ready`: 전송 가능
- `error`: 확인 실패. 제거해야 전송할 수 있다.

서버 연동 시 `uploading`(진행률 포함)과 `uploaded`(서버 첨부 ID 보유) 상태를 추가하고,
진행률은 실제 업로드 이벤트(axios `onUploadProgress`)로만 갱신한다.

## API 제안

```
POST /attachments            multipart/form-data, field: file
→ 201 { id, fileName, mimeType, size, pageCount? }
→ 400 { code: 'UNSUPPORTED_TYPE' | 'SIGNATURE_MISMATCH' | 'FILE_TOO_LARGE' | 'PDF_UNREADABLE' | ... }

POST /conversations          { question, attachmentIds: string[] }
```

- 파일을 먼저 업로드해 ID를 받고, 질문 전송 때는 ID만 보낸다. 대화 전송 요청이 가벼워지고 재시도가 쉬워진다.
- 첨부 취소 시 `AbortController`로 요청을 중단한다. 서버는 일정 시간 동안 대화에 연결되지 않은 첨부를 정리한다.
- 에러 `code`별로 프론트 문구를 매핑해 클라이언트·서버 검증 메시지를 통일한다.

## 리소스 정리 (프론트)

- 미리보기 URL(`URL.createObjectURL`)은 전송 전에는 컴포저가 소유한다. 첨부를 취소하거나 화면을 벗어나면 컴포저가 해제한다.
- 전송한 첨부의 URL은 대화(`ConversationProvider`)가 소유하고, 대화를 삭제할 때 해제한다.
- 첨부마다 `AbortController`를 둔다. 취소하거나 화면을 벗어나면 처리를 중단한다. pdf.js 작업은 성공·실패·취소와 관계없이 `finally`에서 `destroy()`한다.
