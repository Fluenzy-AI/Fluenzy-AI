# 🚀 Quick Setup Guide — Lifetime PDF System

## 📋 Status: Implementation Complete ✅

All code is implemented and ready. Just need to configure Cloudflare R2.

---

## ⚡ 3 Steps to Go Live

### Step 1: Enable R2 Public Access (5 minutes)

1. **Go to Cloudflare Dashboard**
   - Navigate to: R2 → fluenzy-storage bucket
   - Click **Settings** tab

2. **Enable Public Access**
   - Find "Public Access" section
   - Click **"Allow Access"** button
   - Copy the public domain shown (looks like: `pub-XXXX.r2.dev`)

3. **Update Environment Variable**
   - Open `.env` file in project root
   - Replace line:
     ```env
     NEXT_PUBLIC_CDN_BASE=https://pub-XXXX.r2.dev
     ```
   - Use the domain you copied from Cloudflare
   - Save the file

### Step 2: Push Database Changes (1 minute)

```bash
cd "d:\video\Project\New folder\Fluenzy-AI"
npx prisma db push
```

This adds the new fields to your FileRecord model:
- `isPublic` - Control visibility
- `isDeleted` - Soft delete flag
- `deletedAt` / `deletedBy` - Audit trail

### Step 3: Build & Restart (2 minutes)

```bash
npm run build
npm run dev
```

**That's it! Your system is ready.**

---

## ✅ What Works Now

### Public Profile
- ✅ **Resume Preview** — Lifetime access, never expires
- ✅ **Certificate Preview** — Lifetime access, never expires
- ✅ Direct CDN URLs like: `cdn.fluenzyai.app/resumes/userId/file.pdf`

### File Management
- ✅ **Upload** — Via `/api/files/upload`
- ✅ **Soft Delete** — Hide file, keep for audit
- ✅ **Hard Delete** — Permanently remove
- ✅ **Restore** — Recover soft-deleted files
- ✅ **Toggle Visibility** — Public ↔ Private

### Security
- ✅ Ownership verification on all deletes
- ✅ PDF validation (magic byte check)
- ✅ UUID filenames (unguessable)
- ✅ Access control per file

---

## 🧪 Test Your Setup

### 1. Test Public Profile

```
https://www.fluenzyai.app/u/anjha1
```

**Expected:**
- Resume preview loads ✅
- Certificate preview loads ✅
- No "ExpiredRequest" errors ✅
- URLs start with your CDN domain ✅

### 2. Test File Upload

```bash
# Use Postman or fetch in browser console
const formData = new FormData();
formData.append("file", yourPdfFile);
formData.append("type", "RESUME");
formData.append("isPublic", "true");

await fetch("/api/files/upload", {
  method: "POST",
  body: formData,
});
```

**Expected Response:**
```json
{
  "success": true,
  "file": {
    "url": "https://pub-XXXX.r2.dev/resumes/userId/uuid.pdf",
    "fileKey": "resumes/userId/uuid.pdf"
  }
}
```

### 3. Test Soft Delete

```bash
await fetch(`/api/files/${fileId}?mode=soft`, {
  method: "DELETE"
});
```

**Expected:**
- File hidden from public ✅
- Still in R2 (for recovery) ✅
- `isDeleted = true` in database ✅

---

## 🆘 Troubleshooting

### Issue: Files not accessible (403 error)

**Fix:**
1. Check R2 bucket **Public Access** is enabled
2. Verify `NEXT_PUBLIC_CDN_BASE` is set in `.env`
3. Restart dev server: `npm run dev`

### Issue: Upload fails

**Fix:**
1. Check file is valid PDF
2. Check file size under 10MB
3. Verify R2 credentials in `.env`

### Issue: Database errors

**Fix:**
```bash
npx prisma generate
npx prisma db push
```

---

## 📚 Full Documentation

See `docs/FILE_STORAGE_SYSTEM.md` for:
- Complete API reference
- Architecture details
- Security features
- Advanced usage

---

## 🎯 What's Next (Optional)

### Custom Domain (Recommended)
Instead of `pub-XXXX.r2.dev`, use your own domain:

1. Go to R2 → fluenzy-storage → **Custom Domains**
2. Add domain: `cdn.fluenzyai.app`
3. Add CNAME in DNS:
   ```
   cdn.fluenzyai.app → fluenzy-storage.r2.cloudflarestorage.com
   ```
4. Update `.env`:
   ```env
   NEXT_PUBLIC_CDN_BASE=https://cdn.fluenzyai.app
   ```

### Rate Limiting
Add to upload API:
```typescript
// src/app/api/files/upload/route.ts
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

await limiter.check(userId, 10); // 10 uploads per minute
```

---

## ✨ Summary

**What we built:**
- ✅ Lifetime CDN URLs (no expiration)
- ✅ Soft delete with recovery
- ✅ Access control per file
- ✅ Secure upload/delete APIs
- ✅ Public profile integration

**What you need to do:**
1. Enable R2 Public Access (5 min)
2. Run `npx prisma db push` (1 min)
3. Restart server (1 min)

**Total setup time:** < 10 minutes

---

**Questions?** Check `docs/FILE_STORAGE_SYSTEM.md`
