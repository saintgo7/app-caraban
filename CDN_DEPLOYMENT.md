# CloudFront CDN Deployment Guide

Complete guide for deploying Caraban's static assets to AWS S3 with CloudFront CDN distribution for optimized global content delivery.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Detailed Setup](#detailed-setup)
6. [Deployment Process](#deployment-process)
7. [Cache Invalidation](#cache-invalidation)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
10. [Cost Optimization](#cost-optimization)

## Overview

The CDN deployment strategy uses:
- **AWS S3** for static asset storage
- **CloudFront** for global content delivery
- **Origin Access Identity (OAI)** for secure S3 access
- **AWS WAF** for security protection
- **Automated deployment** via scripts and CI/CD

### Benefits

- ⚡ **60-90% faster load times** globally
- 🌍 **Global edge locations** (225+ locations worldwide)
- 💰 **Reduced origin server costs** (S3 + CDN cheaper than EC2 for static files)
- 🔒 **Enhanced security** with WAF and DDoS protection
- 📊 **Better caching** with granular TTL control
- 🚀 **HTTP/2 and HTTP/3** support

## Architecture

```
┌─────────────────┐
│   End Users     │
│ (Global)        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   CloudFront Distribution (CDN)         │
│   - 225+ Edge Locations                 │
│   - HTTP/2 & HTTP/3                     │
│   - SSL/TLS with ACM                    │
│   - WAF Protection                      │
└──────┬──────────────────────────────────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────────┐  ┌────────────────────┐
│  S3 Bucket   │  │  API Origin        │
│  (Static     │  │  (Backend Server)  │
│   Assets)    │  │                    │
│              │  │  /api/*            │
│  /static/*   │  │                    │
│  /images/*   │  │                    │
│  /*.html     │  │                    │
└──────────────┘  └────────────────────┘
```

### Cache Behavior Strategy

| Path Pattern | Origin | Cache TTL | Use Case |
|--------------|--------|-----------|----------|
| `/*.html` | S3 | 0 (no cache) | SPA routing, always fresh |
| `/static/*` | S3 | 1 year | Hashed assets, immutable |
| `/images/*` | S3 | 30 days | User uploads, images |
| `/fonts/*` | S3 | 1 year | Web fonts, immutable |
| `/api/*` | Backend | 0 (no cache) | Dynamic API calls |
| `/*` (default) | S3 | 1 hour | Everything else |

## Prerequisites

### 1. AWS Account & Credentials

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: ap-northeast-2
# Default output format: json
```

### 2. Required IAM Permissions

Create an IAM user/role with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutBucketPolicy",
        "s3:PutBucketVersioning",
        "s3:PutLifecycleConfiguration",
        "s3:PutBucketCORS"
      ],
      "Resource": [
        "arn:aws:s3:::caraban-*",
        "arn:aws:s3:::caraban-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListDistributions",
        "cloudfront:CreateCloudFrontOriginAccessIdentity",
        "cloudfront:GetCloudFrontOriginAccessIdentity"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "acm:ListCertificates",
        "acm:DescribeCertificate"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "wafv2:CreateWebACL",
        "wafv2:GetWebACL",
        "wafv2:AssociateWebACL"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Domain & SSL Certificate (Optional)

If using a custom domain:

1. **Request ACM Certificate** (must be in `us-east-1` for CloudFront):
   ```bash
   aws acm request-certificate \
     --domain-name cdn.caraban.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Validate Certificate** via DNS or Email

3. **Note the Certificate ARN** for CloudFormation deployment

## Quick Start

### Option 1: Using CloudFormation (Recommended)

```bash
# 1. Deploy CDN infrastructure
aws cloudformation create-stack \
  --stack-name caraban-cdn-production \
  --template-body file://infrastructure/cloudformation-cdn.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=caraban \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=ApiDomainName,ParameterValue=api.caraban.com \
    ParameterKey=DomainName,ParameterValue=cdn.caraban.com \
    ParameterKey=ACMCertificateArn,ParameterValue=arn:aws:acm:us-east-1:123456789:certificate/abc \
  --capabilities CAPABILITY_IAM \
  --region ap-northeast-2

# 2. Wait for stack creation (10-15 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name caraban-cdn-production \
  --region ap-northeast-2

# 3. Get outputs
aws cloudformation describe-stacks \
  --stack-name caraban-cdn-production \
  --query 'Stacks[0].Outputs' \
  --region ap-northeast-2

# 4. Update environment variables
export S3_BUCKET=$(aws cloudformation describe-stacks --stack-name caraban-cdn-production --query 'Stacks[0].Outputs[?OutputKey==`StaticAssetsBucketName`].OutputValue' --output text)
export CLOUDFRONT_DISTRIBUTION=$(aws cloudformation describe-stacks --stack-name caraban-cdn-production --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' --output text)

# 5. Build frontend
cd web
npm install
npm run build

# 6. Deploy to CDN
cd ..
./scripts/deploy-to-cdn.sh -b $S3_BUCKET -d $CLOUDFRONT_DISTRIBUTION
```

### Option 2: Manual Deployment

```bash
# 1. Create S3 bucket
aws s3 mb s3://caraban-production-static-assets --region ap-northeast-2

# 2. Enable versioning
aws s3api put-bucket-versioning \
  --bucket caraban-production-static-assets \
  --versioning-configuration Status=Enabled

# 3. Create CloudFront OAI
OAI_ID=$(aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
    CallerReference=$(date +%s),Comment="Caraban Production OAI" \
  --query 'CloudFrontOriginAccessIdentity.Id' \
  --output text)

# 4. Apply bucket policy
# (See infrastructure/s3-bucket-policy.json, replace ${OAI_ID} and ${S3_BUCKET_NAME})
aws s3api put-bucket-policy \
  --bucket caraban-production-static-assets \
  --policy file://infrastructure/s3-bucket-policy.json

# 5. Create CloudFront distribution
# (Use AWS Console or infrastructure/cloudfront-config.json)

# 6. Deploy assets
./scripts/deploy-to-cdn.sh -b caraban-production-static-assets -d E1234567890ABC
```

## Detailed Setup

### Step 1: CloudFormation Deployment

The CloudFormation template (`infrastructure/cloudformation-cdn.yaml`) creates:

- ✅ S3 bucket for static assets with encryption
- ✅ S3 bucket for CloudFront logs
- ✅ CloudFront Origin Access Identity (OAI)
- ✅ CloudFront distribution with optimized cache behaviors
- ✅ WAF Web ACL with rate limiting and AWS managed rules
- ✅ CloudWatch alarms for monitoring
- ✅ Lifecycle policies for cost optimization

**Parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `ProjectName` | No | `caraban` | Project name for resource naming |
| `Environment` | No | `production` | Environment (development/staging/production) |
| `DomainName` | No | - | Custom domain for CloudFront (e.g., cdn.caraban.com) |
| `ACMCertificateArn` | No | - | ACM certificate ARN (must be in us-east-1) |
| `ApiDomainName` | No | `api.caraban.com` | API backend domain |
| `EnableWAF` | No | `true` | Enable AWS WAF protection |

### Step 2: Update DNS (If Using Custom Domain)

After CloudFront distribution is created:

1. **Get CloudFront domain name:**
   ```bash
   aws cloudfront get-distribution \
     --id E1234567890ABC \
     --query 'Distribution.DomainName' \
     --output text
   ```

2. **Create CNAME record** in your DNS:
   ```
   Type: CNAME
   Name: cdn.caraban.com
   Value: d1234567890abc.cloudfront.net
   TTL: 300
   ```

3. **Wait for DNS propagation** (5-30 minutes)

### Step 3: Configure Environment Variables

Update `.env.production`:

```bash
# CloudFront CDN Configuration
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
VITE_CDN_URL=https://cdn.caraban.com  # or https://d1234567890abc.cloudfront.net
S3_BUCKET=caraban-production-static-assets
```

### Step 4: Update CI/CD Pipeline

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Deploy to CDN
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_REGION: ap-northeast-2
    S3_BUCKET: caraban-production-static-assets
    CLOUDFRONT_DISTRIBUTION: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
  run: |
    cd web
    npm run build
    cd ..
    chmod +x scripts/deploy-to-cdn.sh
    ./scripts/deploy-to-cdn.sh -b $S3_BUCKET -d $CLOUDFRONT_DISTRIBUTION
```

## Deployment Process

### Manual Deployment

```bash
# Build frontend
cd web
npm run build

# Deploy to S3 and invalidate cache
cd ..
./scripts/deploy-to-cdn.sh \
  --bucket caraban-production-static-assets \
  --distribution-id E1234567890ABC

# Or with dry-run to preview changes
./scripts/deploy-to-cdn.sh \
  --bucket caraban-production-static-assets \
  --distribution-id E1234567890ABC \
  --dry-run
```

### Using Node.js Script

```bash
# Set environment variables
export S3_BUCKET=caraban-production-static-assets
export CLOUDFRONT_DISTRIBUTION=E1234567890ABC
export AWS_REGION=ap-northeast-2

# Deploy
node scripts/cdn-deploy.js

# Deploy and wait for invalidation to complete
node scripts/cdn-deploy.js --wait

# Verbose output
node scripts/cdn-deploy.js --verbose

# Dry run
node scripts/cdn-deploy.js --dry-run
```

## Cache Invalidation

### Full Cache Invalidation

```bash
# Invalidate all paths
./scripts/invalidate-cdn-cache.sh \
  --distribution-id E1234567890ABC \
  --all

# Wait for invalidation to complete
./scripts/invalidate-cdn-cache.sh \
  --distribution-id E1234567890ABC \
  --all \
  --wait
```

### Selective Invalidation

```bash
# Invalidate specific paths
./scripts/invalidate-cdn-cache.sh \
  --distribution-id E1234567890ABC \
  --paths "/index.html,/static/css/*,/static/js/*"

# Invalidate only images
./scripts/invalidate-cdn-cache.sh \
  --distribution-id E1234567890ABC \
  --images

# Invalidate only static assets
./scripts/invalidate-cdn-cache.sh \
  --distribution-id E1234567890ABC \
  --static
```

### Invalidation Best Practices

1. **Use versioned assets** - Hash filenames instead of invalidating (e.g., `app.abc123.js`)
2. **Invalidate strategically** - Only invalidate what changed
3. **Free tier** - First 1,000 invalidations per month are free
4. **Wildcards count** - Each wildcard path (`/*`) counts as 1 invalidation
5. **Batch invalidations** - Combine multiple paths in one invalidation

## Performance Optimization

### 1. Asset Optimization

```bash
# Frontend build already includes:
# - Terser minification (JS)
# - CSS minification
# - Image optimization
# - Tree shaking
# - Code splitting

# Additional optimizations:
cd web
npm run build
```

### 2. Compression

CloudFront automatically compresses:
- JavaScript (`.js`)
- CSS (`.css`)
- HTML (`.html`)
- JSON (`.json`)
- SVG (`.svg`)

Configure in `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': ['react', 'react-dom'],
        'ui': ['axios'],
      },
    },
  },
}
```

### 3. Cache Control Headers

Automatically set by deployment scripts:

| File Type | Cache-Control | Duration |
|-----------|---------------|----------|
| HTML | `public, max-age=0, must-revalidate` | No cache |
| Hashed assets | `public, max-age=31536000, immutable` | 1 year |
| Images | `public, max-age=2592000` | 30 days |
| Fonts | `public, max-age=31536000, immutable` | 1 year |
| Others | `public, max-age=3600` | 1 hour |

### 4. HTTP/2 & HTTP/3

Already enabled in CloudFront distribution:
```json
{
  "HttpVersion": "http2and3",
  "IPV6Enabled": true
}
```

## Monitoring & Troubleshooting

### CloudWatch Metrics

```bash
# View CloudFront metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=E1234567890ABC \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum

# Key metrics to monitor:
# - Requests: Total number of requests
# - BytesDownloaded: Total bytes served
# - 4xxErrorRate: Client error rate
# - 5xxErrorRate: Server error rate
# - OriginLatency: Time to fetch from origin
```

### CloudFront Logs

Logs are stored in S3 bucket: `caraban-production-cdn-logs/cloudfront/`

```bash
# Download recent logs
aws s3 sync s3://caraban-production-cdn-logs/cloudfront/ ./logs/

# Analyze with CloudWatch Insights or Athena
```

### Common Issues

#### 1. **403 Forbidden on S3 objects**

**Solution:** Check OAI permissions
```bash
# Verify bucket policy allows CloudFront OAI
aws s3api get-bucket-policy --bucket caraban-production-static-assets

# Update if needed
aws s3api put-bucket-policy \
  --bucket caraban-production-static-assets \
  --policy file://infrastructure/s3-bucket-policy.json
```

#### 2. **Stale content after deployment**

**Solution:** Invalidate cache
```bash
./scripts/invalidate-cdn-cache.sh -d E1234567890ABC --all --wait
```

#### 3. **SSL/TLS errors with custom domain**

**Solution:** Verify ACM certificate
```bash
# Certificate must be in us-east-1
aws acm list-certificates --region us-east-1

# Check certificate status
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:123:certificate/abc \
  --region us-east-1
```

#### 4. **High costs**

**Solution:** Review cache hit ratio
```bash
# Check cache statistics
aws cloudfront get-distribution-config --id E1234567890ABC
```

## Cost Optimization

### Expected Costs (Monthly)

For 100,000 visitors, 1M requests, 100GB data transfer:

| Service | Cost | Details |
|---------|------|---------|
| S3 Storage | $2-5 | 20GB storage + requests |
| CloudFront | $8-15 | Data transfer out + requests |
| WAF | $6-10 | Web ACL + rules |
| **Total** | **$16-30/month** | |

Compare to serving from EC2: $50-100/month

### Cost Reduction Strategies

1. **Enable Origin Shield** (already configured)
   - Reduces origin requests by 50-90%
   - Saves on S3 data transfer costs

2. **Use Price Class 200** (already configured)
   - Excludes most expensive edge locations
   - Still covers 99% of users

3. **Optimize cache hit ratio**
   - Use versioned filenames (automatic with Vite)
   - Set appropriate TTLs
   - Target 80%+ cache hit ratio

4. **Lifecycle policies** (already configured)
   - Transition old logs to Glacier after 30 days
   - Delete old versions after 90 days

5. **Compress responses** (already enabled)
   - Reduces data transfer by 60-80%

### Monitor Costs

```bash
# AWS Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

## Security Checklist

- ✅ SSL/TLS encryption (TLS 1.2+)
- ✅ Origin Access Identity (OAI) - prevents direct S3 access
- ✅ AWS WAF enabled with managed rules
- ✅ Rate limiting (2000 requests per IP per 5 minutes)
- ✅ S3 bucket versioning enabled
- ✅ S3 bucket encryption (AES-256)
- ✅ CloudFront access logs enabled
- ✅ CORS headers configured
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Block public S3 access

## Next Steps

1. **Set up monitoring alerts** - Configure CloudWatch alarms
2. **Implement A/B testing** - Use CloudFront Functions
3. **Add custom headers** - Lambda@Edge for advanced logic
4. **Enable real user monitoring (RUM)** - CloudWatch RUM
5. **Optimize images** - Add WebP support with Lambda@Edge

## Resources

- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/best-practices.html)
- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/)
- [CloudFormation Templates](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)

---

**Need Help?**
- Check [HIGH_AVAILABILITY.md](./HIGH_AVAILABILITY.md) for HA deployment
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for general deployment
- See [README.md](./README.md) for project overview
