# 🚀 Go-Live Checklist

## ✅ Completed (By AI)

- [x] Core CDN utility implemented
- [x] Upload service with PDF validation
- [x] Access control layer
- [x] Upload API route
- [x] Delete/restore API route
- [x] Database schema enhanced
- [x] Public profile updated to use CDN URLs
- [x] Build successful (TypeScript + Next.js)
- [x] Prisma client generated
- [x] Documentation created

---

## 📋 Your Action Items (< 10 minutes)

### Step 1: Configure Cloudflare R2 (5 minutes)

1. **Open Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com
   - Navigate to: R2 → fluenzy-storage

2. **Enable Public Access**
   - Click **Settings** tab
   - Scroll to **"Public Access"** section
   - Click **"Allow Access"** button
   - **IMPORTANT:** Copy the public domain that appears
     - It will look like: `pub-XXXXXXXXXXXX.r2.dev`

3. **Update Environment Variable**
   - Open: `d:\video\Project\New folder\Fluenzy-AI\.env`
   - Find this line:
     ```env
     NEXT_PUBLIC_CDN_BASE=https://pub-XXXX.r2.dev
     ```
   - Replace `pub-XXXX.r2.dev` with YOUR actual public domain
   - Save the file

### Step 2: Apply Database Changes (1 minute)

Open terminal and run:
```bash
cd "d:\video\Project\New folder\Fluenzy-AI"
npx prisma db push
```

This adds the new fields to your FileRecord collection:
- `isPublic` (visibility control)
- `isDeleted` (soft delete flag)
- `deletedAt` / `deletedBy` (audit trail)

### Step 3: Restart Your Server (1 minute)

If server is running:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

If deploying to production:
```bash
npm run build
# Deploy as usual
```

### Step 4: Test Everything (3 minutes)

**Test 1: Public Profile**
```
Visit: https://www.fluenzyai.app/u/anjha1
```
Expected:
- ✅ Resume preview loads without errors
- ✅ Certificate preview loads without errors
- ✅ No "ExpiredRequest" messages

**Test 2: Check URL Format**
Right-click on certificate/resume → Copy link address

Expected URL format:
```
https://pub-XXXXXXXXXXXX.r2.dev/certificates/userId/uuid.pdf
```

NOT:
```
https://...X-Amz-Signature=... (this would be a signed URL - bad!)
```

**Test 3: Verify Lifetime Access**
1. Open certificate/resume preview
2. Copy the URL
3. Wait 5 minutes
4. Open the URL in a new incognito window
5. ✅ Should still work (not expired)

---

## 🆘 Troubleshooting

### Issue: Files return 403 Forbidden

**Cause:** R2 bucket not set to public

**Fix:**
1. Double-check R2 Settings → Public Access is "Allowed"
2. Verify the public domain is correct in `.env`
3. Restart dev server

### Issue: URLs still showing "ExpiredRequest"

**Cause:** Using old signed URLs instead of CDN

**Fix:**
1. Check `.env` has `NEXT_PUBLIC_CDN_BASE` set
2. Restart dev server (required after .env changes)
3. Clear browser cache
4. Hard refresh page (Ctrl+Shift+R)

### Issue: Certificate preview not showing at all

**Cause:** FileRecord might not exist in database

**Fix:**
1. Check database for certificate FileRecord entry
2. Upload certificate again if needed
3. Ensure `isPublic=true` and `isDeleted=false`

### Issue: Build fails

**Cause:** Prisma client out of sync

**Fix:**
```bash
npx prisma generate
npm run build
```

---

## 🎯 Success Criteria

You'll know it's working when:

1. ✅ Public profile loads without errors
2. ✅ Certificate preview shows PDF content
3. ✅ Resume preview shows PDF content  
4. ✅ URLs contain your CDN domain (pub-XXX.r2.dev)
5. ✅ URLs work even hours later (no expiration)
6. ✅ URLs work in incognito/private windows
7. ✅ No "ExpiredRequest" or "AccessDenied" errors

---

## 📞 If You Get Stuck

### Check These Files

1. **`.env`** — Verify NEXT_PUBLIC_CDN_BASE is set correctly
2. **Cloudflare R2 Dashboard** — Verify Public Access is enabled
3. **Browser Console** — Check for any JavaScript errors
4. **Network Tab** — Check actual URL being requested

### Verify Environment Variable

In your code, temporarily add this to any page:
```typescript
console.log('CDN Base:', process.env.NEXT_PUBLIC_CDN_BASE);
```

Should print:
```
CDN Base: https://pub-XXXXXXXXXXXX.r2.dev
```

If it prints `undefined`, the env var isn't loaded.

---

## 🎉 After Success

### Optional: Custom Domain (Production)

Instead of `pub-XXX.r2.dev`, use your own domain:

1. **In Cloudflare R2:**
   - Go to: fluenzy-storage → Settings → Custom Domains
   - Add: `cdn.fluenzyai.app`

2. **In Cloudflare DNS:**
   - Add CNAME record:
     ```
     cdn.fluenzyai.app → fluenzy-storage.r2.cloudflarestorage.com
     ```
   - Enable proxy (orange cloud)

3. **Update `.env`:**
   ```env
   NEXT_PUBLIC_CDN_BASE=https://cdn.fluenzyai.app
   ```

4. **Rebuild and deploy**

### Optional: Migrate Existing Files

If you have old files with signed URLs in database:

1. Create migration script to extract fileKey from old URLs
2. Update FileRecord entries
3. Set isPublic and isDeleted defaults

---

## 📚 Reference Documents

- `IMPLEMENTATION_COMPLETE.md` — What was built
- `QUICK_SETUP.md` — Setup instructions
- `docs/FILE_STORAGE_SYSTEM.md` — Full documentation
- `docs/R2_ARCHITECTURE.md` — Architecture details

---

## ✨ Final Notes

### What Changed

**Database:**
- FileRecord model now has: isPublic, isDeleted, deletedAt, deletedBy

**File URLs:**
- Old: Signed URLs that expire after 1 hour
- New: Direct CDN URLs that never expire

**Public Profile:**
- Old: Generated signed URLs at page load
- New: Generates CDN URLs at page load (lifetime valid)

### Golden Rules

1. **Never store full URLs** — Only store fileKey in database
2. **Never use signed URLs for public files** — Use cdnUrl() instead
3. **Always verify ownership** — Backend checks before delete/update

---

**Current Status:** ✅ Code Complete, Ready for R2 Configuration

**Time to Go Live:** < 10 minutes

Good luck! 🚀
