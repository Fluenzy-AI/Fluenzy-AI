# PDF 404 Fix - Production Deployment Checklist

## Root Cause Analysis ✅
**Problem:** After deployment, PDFs return 404 errors (`fluenzyai.app/resumes/filename.pdf`)

**Why it happens:**
1. **Development:** PDFs saved to filesystem at `public/uploads/resumes/` → works fine locally
2. **Production:** Vercel has ephemeral filesystem → files lost on each deployment
3. **Database:** Stores R2 keys like `resumes/userId_timestamp.pdf` or filesystem paths `/uploads/resumes/file.pdf`
4. **Frontend:** Tries to access raw stored value → 404 if it's an R2 key or missing file

## Solution Implemented ✅

### 1. Created File URL Helper (`src/lib/file-url-helper.ts`)
- Converts stored file paths/keys to public URLs
- Handles 3 formats:
  - R2 keys → generates signed URLs
  - Filesystem paths → returns as-is for local dev
  - Full URLs → returns unchanged
- Batch processing function for performance

### 2. Updated Public Profile API
- Modified: `src/app/api/public-profile/[username]/route.ts`
- Now returns signed R2 URLs instead of raw keys
- Backward compatible with filesystem paths

### 3. Existing Infrastructure (already in place)
- ✅ `/resumes/[filename]/route.ts` - Dynamic route to serve PDFs from R2
- ✅ R2 service with `getSignedUrl()` function
- ✅ Resume upload already using R2

## Pre-Deployment Checklist

### Environment Variables (CRITICAL ⚠️)
Check your production environment (Vercel/Railway/etc) has these set:

```bash
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=fluenzy-ai-uploads
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
```

**How to check on Vercel:**
```bash
vercel env ls
```

**How to add if missing:**
```bash
vercel env add R2_ACCOUNT_ID
vercel env add R2_ACCESS_KEY_ID
vercel env add R2_SECRET_ACCESS_KEY
vercel env add R2_BUCKET_NAME
vercel env add R2_ENDPOINT
```

### R2 Bucket Configuration
1. **Bucket exists:** fluenzy-ai-uploads
2. **CORS enabled:**
   ```json
   [
     {
       "AllowedOrigins": ["https://fluenzyai.app", "https://*.fluenzyai.app"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. **Public access:** Disabled (using signed URLs for security)

## Deployment Steps

### Step 1: Deploy the Code
```bash
git add .
git commit -m "Fix: PDF 404 errors in production - use R2 signed URLs

- Added file-url-helper.ts to convert R2 keys to signed URLs
- Updated public-profile API to return accessible URLs
- Ensures PDFs work in production with ephemeral filesystem

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push origin main
```

### Step 2: Verify Environment Variables
```bash
# On Vercel dashboard or via CLI
vercel env ls production

# Should show:
# - R2_ACCOUNT_ID
# - R2_ACCESS_KEY_ID
# - R2_SECRET_ACCESS_KEY
# - R2_BUCKET_NAME
# - R2_ENDPOINT
```

### Step 3: Test After Deployment
1. **Test resume upload:**
   - Go to https://fluenzyai.app/profile
   - Upload a new resume
   - Check it saves successfully

2. **Test resume view:**
   - Go to https://fluenzyai.app/profile
   - Click "Preview" on an uploaded resume
   - Should display PDF (not 404)

3. **Test public profile:**
   - Go to https://fluenzyai.app/profile/your-username
   - Check resumes are visible
   - Click to view → should work

### Step 4: Check Logs
```bash
# Vercel real-time logs
vercel logs --follow

# Look for errors like:
# - "Failed to get R2 signed URL"
# - "R2_ENDPOINT is not defined"
# - S3 client errors
```

## Rollback Plan (if something breaks)
```bash
# Revert the commit
git revert HEAD
git push origin main

# Or roll back on Vercel dashboard:
# Project → Deployments → [Previous deployment] → "Promote to Production"
```

## Other APIs That Need Same Fix

These APIs also return file URLs and need similar updates:

### High Priority (user-facing):
- [ ] `/api/profile/certifications` - Certificate PDFs
- [ ] `/api/careers/applications/[id]` - Job application resumes
- [ ] `/api/ats/upload` - ATS resume checker

### Medium Priority (HR portal):
- [ ] `/api/portal/hr/certificates` - Generated certificates
- [ ] `/api/portal/hr/offer-letters/[id]` - Offer letter PDFs

### Low Priority (admin/internal):
- [ ] `/api/generate-pdf` - Interview audit PDFs
- [ ] `/api/payment-history/[id]/pdf` - Payment invoices

## Testing in Development

Before deploying, test locally with R2:

```bash
# Make sure .env.local has R2 credentials
npm run dev

# Upload a resume
# Should see in logs:
# - "Uploading to R2: resumes/userId_timestamp.pdf"
# - "File uploaded successfully to R2"

# View resume
# Should see in logs:
# - "Getting signed URL for: resumes/userId_timestamp.pdf"
# - Returns URL starting with "https://..."
```

## Expected Behavior After Fix

### Before (❌ Broken):
```
User uploads resume → Saves to R2 → DB stores "resumes/abc123.pdf"
Frontend requests → /resumes/abc123.pdf → 404 (file not in filesystem)
```

### After (✅ Fixed):
```
User uploads resume → Saves to R2 → DB stores "resumes/abc123.pdf"
API called → Converts to signed URL → Returns "https://r2.cloudflarestorage.com/..."
Frontend requests → Opens R2 signed URL → PDF displays ✓
```

## Common Issues & Solutions

### Issue 1: Still getting 404 after deployment
**Check:**
```bash
# Verify env vars are set
vercel env ls production

# Check recent deployments
vercel ls

# View logs for errors
vercel logs
```

### Issue 2: "Failed to get R2 signed URL"
**Solution:** R2 credentials not set or incorrect
```bash
# Test R2 connection
curl -X GET "$R2_ENDPOINT/$R2_BUCKET_NAME" \
  -H "Authorization: AWS4-HMAC-SHA256 ..."
```

### Issue 3: CORS errors in browser console
**Solution:** Update R2 bucket CORS rules (see above)

### Issue 4: Old PDFs still not working
**Reason:** They might be stored in old format
**Solution:** Run migration script (to be created) or users re-upload

## Success Criteria ✅

- [ ] Users can upload PDFs without errors
- [ ] Uploaded PDFs display correctly in preview
- [ ] Public profiles show resume PDFs
- [ ] No 404 errors in browser console
- [ ] Server logs show successful R2 operations
- [ ] Works on all routes: /profile, /ats, /careers

## Monitoring

After deployment, monitor:
1. **Error rate:** Should stay at 0% for PDF requests
2. **Response time:** R2 signed URLs ~100-300ms
3. **User complaints:** Check Discord/email for PDF issues

## Next Steps

Once this is stable:
1. Apply same fix to all other PDF endpoints (see list above)
2. Create migration script for old filesystem PDFs → R2
3. Add automated tests for PDF upload/download
4. Add monitoring alerts for R2 failures
