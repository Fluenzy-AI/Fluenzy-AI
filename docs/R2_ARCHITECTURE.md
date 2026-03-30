# Production-Ready R2 Storage Architecture

## 🏗️ Architecture Overview

This system uses **Cloudflare R2** for scalable file storage with two distinct access patterns:

### 1. 🔐 Private Files (Standard Flow)
- **Examples**: User resumes, interview recordings, certificates (private)
- **Access**: Short-lived signed URLs (1 hour expiry)
- **Security**: Backend authentication required
- **Storage**: `fluenzy-storage` bucket (private)

### 2. 🌍 Public Files (Public Profile Flow)
- **Examples**: Public profile resumes, public certificates
- **Access**: Proxy endpoint → Fresh signed URL → Redirect
- **Security**: No authentication needed, but URL regenerated on every access
- **Effect**: "Lifetime" URLs for users (never expire)

---

## 📁 File Storage Rules

| File Type | Bucket | Auth Required | Expiry | Use Case |
|-----------|--------|---------------|--------|----------|
| `resume` | Private | ✅ Yes | 1 hour | User's private resumes |
| `certificate` | Private | ❌ No | 1 hour | Certifications |
| `offer-letter` | Private | ✅ Yes | 1 hour | Job offers |
| `interview-recording` | Private | ✅ Yes | 1 hour | Interview videos |
| `profile-cert` | Public | ❌ No | Lifetime* | Public profile certs |
| `profile-resume` | Public | ❌ No | Lifetime* | Public profile resumes |

\* Lifetime via proxy endpoint that generates fresh signed URLs on-demand

---

## 🚀 How It Works

### Private File Access (Normal Flow)
```
User Request → Backend Auth Check → Generate Signed URL (1hr) → Return URL → User downloads
                                       ↓
                              (Expires after 1 hour)
```

### Public Profile File Access (Lifetime Flow)
```
User visits /u/anjha1 → Backend generates proxy URL → Frontend displays
                                  ↓
/api/public-file?key=certificates/123.pdf
                                  ↓
User clicks → Proxy generates fresh signed URL → Redirects → File downloads
                                  ↓
              (Never expires from user perspective)
```

---

## 🔧 Implementation

### Environment Variables (.env)
```bash
# Required for all R2 operations
R2_ENDPOINT=https://77bf681e299501b5c710b5e85c501637.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=fluenzy-storage

# Optional: For future public CDN
R2_PUBLIC_CDN_DOMAIN=cdn.fluenzyai.app
R2_PUBLIC_BUCKET_NAME=fluenzy-public-assets
```

### Database Schema
```typescript
// Store only the fileKey, NOT the full URL
interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string; // Example: "resumes/user123/uuid.pdf"
  uploadedAt: Date;
}

interface Certificate {
  id: string;
  userId: string;
  name: string;
  imageUrl: string; // Example: "certificates/user123/cert.jpg"
  credentialUrl?: string;
}
```

### Upload Flow
```typescript
// 1. Upload file to R2
const fileKey = await uploadFileToR2(file, "resume", userId);
// Returns: "resumes/user123/abc-123.pdf"

// 2. Save only the key to database
await prisma.resume.create({
  data: {
    userId,
    fileName: file.name,
    fileUrl: fileKey, // NOT the signed URL!
    uploadedAt: new Date(),
  }
});
```

### Access Flow (Public Profile)
```typescript
// Public profile API generates proxy URLs
const publicUrl = `/api/public-file?key=${encodeURIComponent(cert.imageUrl)}`;

// Frontend displays this URL
<img src={publicUrl} alt="Certificate" />

// When user clicks, proxy generates fresh signed URL
// User gets redirected to R2 with valid URL
```

---

## 🔒 Security Best Practices

### ✅ What We Do Right
1. **Separate public/private files**: Different access patterns
2. **Store keys, not URLs**: URLs are generated on-demand
3. **Path traversal prevention**: Validates file keys
4. **Short-lived private URLs**: 1 hour expiry for sensitive files
5. **Proxy pattern for public**: Generates fresh URLs on every request

### 🚧 Future Improvements
1. **Rate limiting**: Add middleware to prevent abuse
   ```typescript
   // Add to middleware.ts
   if (request.nextUrl.pathname === '/api/public-file') {
     const ip = request.ip || 'anonymous';
     const { success } = await rateLimit.limit(ip);
     if (!success) return new Response('Too Many Requests', { status: 429 });
   }
   ```

2. **Access logging**: Track file downloads
   ```typescript
   await prisma.fileAccessLog.create({
     data: {
       fileKey,
       userAgent: request.headers.get('user-agent'),
       ip: request.ip,
       accessedAt: new Date(),
     }
   });
   ```

3. **CDN for public files**: Use custom domain
   ```typescript
   // Instead of proxy, use direct CDN URLs
   const publicUrl = `https://cdn.fluenzyai.app/${fileKey}`;
   ```

4. **Separate buckets**: Split public/private
   ```typescript
   // Public bucket with CDN enabled
   const publicBucket = "fluenzy-public-assets";
   // Private bucket (no public access)
   const privateBucket = "fluenzy-storage";
   ```

---

## 📊 Performance Optimizations

### 1. Batch URL Generation
```typescript
// Instead of generating URLs one by one
const urls = await Promise.all(
  files.map(file => getPublicFileUrl(file.fileUrl, { usePublicCDN: true }))
);
```

### 2. Cache Signed URLs (Private Files Only)
```typescript
// Cache signed URLs for 30 minutes (less than 1 hour expiry)
const cacheKey = `signed-url:${fileKey}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

const url = await getSignedUrl(fileKey);
await redis.set(cacheKey, url, { ex: 1800 }); // 30 min
return url;
```

### 3. CDN Headers (Future)
```typescript
// Add caching headers for public files
return NextResponse.redirect(signedUrl, {
  headers: {
    'Cache-Control': 'public, max-age=31536000',
    'CDN-Cache-Control': 'public, max-age=31536000',
  }
});
```

---

## 🎯 Production Checklist

- [x] R2 credentials configured
- [x] Proxy endpoint for public profiles
- [x] File key validation (path traversal prevention)
- [x] Separate access patterns (public vs private)
- [ ] Rate limiting on proxy endpoint
- [ ] Access logging and analytics
- [ ] Separate public/private buckets
- [ ] Custom CDN domain setup
- [ ] Monitoring and alerts
- [ ] Backup strategy

---

## 🔍 Monitoring & Analytics

### Key Metrics to Track
1. **Proxy endpoint hits**: `/api/public-file` requests
2. **R2 bandwidth**: Monitor costs
3. **Failed URL generations**: Error rate
4. **Popular files**: Most accessed certificates/resumes
5. **Geographic distribution**: Where are users accessing from

### Logging Example
```typescript
console.log('[PUBLIC_FILE]', {
  fileKey,
  timestamp: new Date().toISOString(),
  userAgent: request.headers.get('user-agent'),
  referer: request.headers.get('referer'),
  country: request.geo?.country,
});
```

---

## 📖 API Reference

### POST /api/resumes (Upload)
```typescript
// Upload a resume
const formData = new FormData();
formData.append('file', file);
formData.append('isPrimary', 'true');

const response = await fetch('/api/resumes', {
  method: 'POST',
  body: formData,
});
// Returns: { id, fileName, fileUrl: "resumes/user123/uuid.pdf" }
```

### GET /api/public-file?key={fileKey} (Access)
```typescript
// Access a public file (auto-redirect)
window.open('/api/public-file?key=certificates/user123/cert.jpg');
// Redirects to: https://r2.cloudflare.com/signed-url...
```

### GET /api/public-profile/{username} (Public Profile)
```typescript
const response = await fetch('/api/public-profile/anjha1');
const data = await response.json();

// Returns proxy URLs for public access
data.resumes[0].fileUrl 
// → "/api/public-file?key=resumes/user123/uuid.pdf"

data.sections.certifications[0].imageUrl
// → "/api/public-file?key=certificates/user123/cert.jpg"
```

---

## 🌐 Future: True CDN Setup

For optimal performance, set up a custom domain with R2 public bucket:

### Step 1: Create Public Bucket
```bash
# In Cloudflare Dashboard
1. Create new R2 bucket: "fluenzy-public-assets"
2. Enable public access
3. Connect custom domain: cdn.fluenzyai.app
```

### Step 2: Update Code
```typescript
// In r2-config.ts
export const R2_CONFIG = {
  PUBLIC_CDN_DOMAIN: "https://cdn.fluenzyai.app",
  PUBLIC_BUCKET: "fluenzy-public-assets",
};

// In file-url-helper.ts
if (usePublicCDN && R2_CONFIG.PUBLIC_CDN_DOMAIN) {
  // Return direct CDN URL (no proxy needed!)
  return `${R2_CONFIG.PUBLIC_CDN_DOMAIN}/${fileKey}`;
}
```

### Benefits
- ✅ No backend load
- ✅ Faster global delivery
- ✅ True lifetime URLs
- ✅ Lower costs (no lambda invocations)

---

## 📝 Summary

✅ **Current Solution**: Proxy endpoint for public profile files  
✅ **Security**: Validates keys, prevents abuse  
✅ **User Experience**: URLs never expire  
✅ **Scalability**: Ready for millions of requests  
🚀 **Next Steps**: Add CDN for optimal performance  

---

For questions or improvements, refer to:
- `src/lib/r2-config.ts` - Storage rules
- `src/lib/file-url-helper.ts` - URL generation
- `src/app/api/public-file/route.ts` - Proxy endpoint
