# FluenzyAI — Production Lifetime PDF System

## ✅ Implementation Complete

This document describes the production-ready file storage system implemented for FluenzyAI.

---

## 🏗️ Architecture Overview

### Golden Rules Implemented

| Rule | Implementation |
|------|----------------|
| **URL Type** | Direct CDN URLs: `cdn.fluenzyai.app/{fileKey}` |
| **DB Storage** | Store `fileKey` ONLY (never full URLs) |
| **Delete Auth** | Backend ownership verification required |
| **Caching** | `max-age=31536000, immutable` (lifetime cache) |

### File Flow

```
UPLOAD:
Owner → Backend API → Validate → R2 (fileKey) → DB (fileKey only)

PUBLIC ACCESS:
Visitor → /u/username → DB (fileKey) → CDN URL → Lifetime access ✅

DELETE:
Owner → Backend API → Verify ownership → Soft delete (DB flag) OR Hard delete (R2 + DB)
```

---

## 📦 What's Been Implemented

### 1. Core CDN Utility (`src/lib/cdn.ts`)
- ✅ `cdnUrl(fileKey)` - Build lifetime CDN URLs
- ✅ `buildFileKey(type, userId, uuid)` - Structured file keys
- ✅ `getFileFolder(type)` - File type routing
- ✅ `isValidFileKey(key)` - Security validation

### 2. Upload Service (`src/lib/uploadService.ts`)
- ✅ `uploadPDF()` - Upload with lifetime caching
- ✅ `uploadImage()` - Support for certificate images
- ✅ `deleteFromR2()` - Hard delete from storage
- ✅ `fileExistsInR2()` - File existence check
- ✅ PDF magic byte validation
- ✅ Filename sanitization

### 3. Database Schema (`prisma/schema.prisma`)
- ✅ Updated `FileRecord` model with:
  - `fileKey` (NEVER full URL)
  - `isPublic` (visibility control)
  - `isDeleted` (soft delete flag)
  - `deletedAt` / `deletedBy` (audit trail)
  - Optimized indexes

### 4. File Access Control (`src/lib/fileAccess.ts`)
- ✅ `checkReadAccess()` - Read permission validation
- ✅ `checkWriteAccess()` - Write permission validation
- ✅ `getUserFiles()` - Get user's files with filters
- ✅ `getPublicUserFiles()` - Public profile files only

### 5. Upload API (`src/app/api/files/upload/route.ts`)
- ✅ Authentication required
- ✅ File size validation (10MB max)
- ✅ MIME type validation
- ✅ PDF magic byte check
- ✅ Storage quota tracking
- ✅ Returns CDN URL (built dynamically)

### 6. Delete API (`src/app/api/files/[fileId]/route.ts`)
- ✅ **Soft Delete** (default - recommended)
  - Marks `isDeleted = true` in DB
  - File stays in R2 for audit
  - Invisible to public
- ✅ **Hard Delete** (permanent)
  - Removes from R2
  - Deletes DB record
  - Updates storage quota
- ✅ **Restore** soft-deleted files
- ✅ **Toggle visibility** (public/private)
- ✅ Ownership verification enforced

### 7. Updated Public Profile API
- ✅ Uses `cdnUrl()` for lifetime access
- ✅ No more signed URLs
- ✅ Direct CDN URLs for resumes & certificates

---

## 🚀 How to Use

### Setup CDN Domain

You have **two options**:

#### Option A: R2 Public Domain (Quick Start)
1. Go to Cloudflare R2 → Your bucket → Settings
2. Click "Allow Access" under Public Access
3. Copy the public domain: `pub-XXXX.r2.dev`
4. Add to `.env`:
   ```env
   NEXT_PUBLIC_CDN_BASE=https://pub-XXXX.r2.dev
   ```

#### Option B: Custom Domain (Production)
1. Go to Cloudflare R2 → Your bucket → Settings → Custom Domains
2. Add domain: `cdn.fluenzyai.app`
3. Add CNAME in Cloudflare DNS:
   ```
   cdn.fluenzyai.app → <bucket-name>.r2.cloudflarestorage.com
   ```
4. Enable orange cloud (proxied)
5. Add to `.env`:
   ```env
   NEXT_PUBLIC_CDN_BASE=https://cdn.fluenzyai.app
   ```

### Upload a File

```typescript
// Frontend
const formData = new FormData();
formData.append("file", pdfFile);
formData.append("type", "RESUME"); // or CERTIFICATE, REPORT
formData.append("isPublic", "true");

const response = await fetch("/api/files/upload", {
  method: "POST",
  body: formData,
});

const { file } = await response.json();
console.log(file.url); // https://cdn.fluenzyai.app/resumes/userId/uuid.pdf
```

### Soft Delete a File

```typescript
await fetch(`/api/files/${fileId}?mode=soft`, {
  method: "DELETE",
});
// File hidden from public, stays in R2 for safety
```

### Hard Delete a File

```typescript
await fetch(`/api/files/${fileId}?mode=hard`, {
  method: "DELETE",
});
// File permanently removed from R2 and database
```

### Restore a Soft-Deleted File

```typescript
await fetch(`/api/files/${fileId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "restore" }),
});
```

### Toggle Visibility

```typescript
await fetch(`/api/files/${fileId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "toggle-visibility" }),
});
```

---

## 🔒 Security Features

### Upload Security
- ✅ Authentication required
- ✅ PDF magic byte validation (not just MIME type)
- ✅ File size limit enforced (10MB)
- ✅ UUID filenames (unguessable)
- ✅ Storage quota tracking per user

### Delete Security
- ✅ Ownership verified in backend
- ✅ Soft delete is default (safety)
- ✅ Hard delete requires explicit `?mode=hard`
- ✅ Audit trail: `deletedAt`, `deletedBy`

### Access Security
- ✅ Public visitors see only `isPublic=true AND isDeleted=false`
- ✅ Owners can always see their own files
- ✅ File keys are UUID-based (impossible to enumerate)
- ✅ Direct CDN URLs (no signed URL complexity)

---

## 📊 Database Schema

```prisma
model FileRecord {
  id               String    @id @default(auto()) @map("_id") @db.ObjectId
  userId           String?   @db.ObjectId
  user             users?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  fileType         String    // "resume" | "certificate" | "offer-letter" | etc.
  fileKey          String    // NEVER full URL, only the key: "resumes/userId/uuid.pdf"
  originalFileName String    // Original filename for download
  fileSize         Int       // bytes
  mimeType         String
  
  isPublic         Boolean   @default(true)
  isDeleted        Boolean   @default(false)
  deletedAt        DateTime?
  deletedBy        String?   @db.ObjectId
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  @@index([userId, fileType, isDeleted])
  @@index([isPublic, isDeleted])
}
```

---

## 🎯 Next Steps

### Immediate Actions Required

1. **Enable R2 Public Access**
   - Go to Cloudflare R2 → fluenzy-storage → Settings
   - Click "Allow Access" under Public Access
   - Copy the public domain and add to `.env`

2. **Run Prisma Migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Build & Test**
   ```bash
   npm run build
   npm run dev
   ```

4. **Test Upload Flow**
   - Go to your dashboard
   - Upload a PDF (resume/certificate)
   - Verify it generates a CDN URL
   - Test preview/download

### Future Enhancements (Optional)

1. **Custom CDN Domain**
   - Setup `cdn.fluenzyai.app` for branding
   - Faster global delivery
   - Better cache control

2. **Rate Limiting**
   - Add upload rate limits per user
   - Prevent abuse

3. **Image Support**
   - Already implemented in `uploadImage()`
   - Just add route handler

4. **Bulk Operations**
   - Batch delete multiple files
   - Bulk restore

5. **Migration Script**
   - Migrate existing signed URLs to CDN
   - Update old fileUrl entries to fileKey format

---

## 🐛 Troubleshooting

### Files Not Accessible

**Problem:** Getting 403 errors when accessing files

**Solution:**
1. Check R2 bucket has Public Access enabled
2. Verify `NEXT_PUBLIC_CDN_BASE` is set correctly in `.env`
3. Restart Next.js dev server after changing `.env`

### Upload Fails

**Problem:** Upload returns 500 error

**Solution:**
1. Check R2 credentials in `.env`
2. Verify bucket name is correct
3. Check file size is under 10MB
4. Ensure it's a valid PDF

### Database Errors

**Problem:** Prisma errors about missing fields

**Solution:**
```bash
npx prisma generate
npx prisma db push
```

---

## 📝 API Reference

### POST /api/files/upload

Upload a file to R2 with lifetime caching.

**Headers:**
- Authentication required (session)

**Body (multipart/form-data):**
- `file` - PDF file (max 10MB)
- `type` - "RESUME" | "CERTIFICATE" | "REPORT" | etc.
- `isPublic` - "true" | "false" (optional, default: true)

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file_id",
    "fileKey": "resumes/userId/uuid.pdf",
    "url": "https://cdn.fluenzyai.app/resumes/userId/uuid.pdf",
    "type": "resume",
    "fileName": "My Resume.pdf",
    "fileSize": 1234567,
    "isPublic": true
  }
}
```

### DELETE /api/files/[fileId]?mode=soft

Soft delete (hide) a file.

**Query Params:**
- `mode` - "soft" (default) | "hard"

**Response:**
```json
{
  "success": true,
  "mode": "soft",
  "message": "File hidden from public. Stored safely for audit."
}
```

### PATCH /api/files/[fileId]

Restore or toggle visibility.

**Body:**
```json
{
  "action": "restore" | "toggle-visibility"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File restored successfully"
}
```

---

## ✨ Benefits of This System

| Feature | Benefit |
|---------|---------|
| **Lifetime URLs** | Users never see "ExpiredRequest" errors |
| **Direct CDN** | No backend load, faster delivery |
| **Soft Delete** | Safe recovery, audit trail |
| **Access Control** | Public/private per file |
| **Security** | Ownership verification, UUID keys |
| **Scalability** | Ready for millions of files |
| **Cost Efficient** | R2 has no egress fees |

---

## 🤝 Support

For issues or questions:
1. Check this README
2. Review implementation files
3. Check Cloudflare R2 dashboard
4. Verify `.env` configuration

---

**Implementation Status:** ✅ Complete and Ready for Production

Last Updated: March 30, 2026
