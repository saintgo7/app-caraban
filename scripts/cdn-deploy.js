#!/usr/bin/env node

/**
 * CDN Deployment Script
 *
 * Automates the deployment of static assets to S3 and CloudFront cache invalidation.
 * Can be integrated into CI/CD pipelines.
 *
 * Usage:
 *   node scripts/cdn-deploy.js [options]
 *
 * Environment Variables:
 *   AWS_REGION                AWS region (default: ap-northeast-2)
 *   S3_BUCKET                 S3 bucket name
 *   CLOUDFRONT_DISTRIBUTION   CloudFront distribution ID
 *   SOURCE_DIR                Source directory (default: web/dist)
 */

const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand, GetInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const mime = require('mime-types');
const crypto = require('crypto');

// Configuration
const config = {
  region: process.env.AWS_REGION || 'ap-northeast-2',
  bucket: process.env.S3_BUCKET,
  distributionId: process.env.CLOUDFRONT_DISTRIBUTION,
  sourceDir: process.env.SOURCE_DIR || 'web/dist',
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
};

// Validate configuration
if (!config.bucket) {
  console.error('Error: S3_BUCKET environment variable is required');
  process.exit(1);
}

if (!config.distributionId) {
  console.error('Error: CLOUDFRONT_DISTRIBUTION environment variable is required');
  process.exit(1);
}

// Initialize AWS clients
const s3Client = new S3Client({ region: config.region });
const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront is always us-east-1

// MIME type mapping for common extensions
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.ico': 'image/x-icon',
};

// Cache control headers based on file type and path
const getCacheControl = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const relativePath = path.relative(config.sourceDir, filePath);

  // HTML files - no cache
  if (ext === '.html') {
    return 'public, max-age=0, must-revalidate';
  }

  // Static assets with hash - long cache (1 year)
  if (relativePath.includes('/static/') || /\.[a-f0-9]{8,}\./.test(filePath)) {
    return 'public, max-age=31536000, immutable';
  }

  // Images - medium cache (30 days)
  if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico'].includes(ext)) {
    return 'public, max-age=2592000';
  }

  // Fonts - long cache (1 year)
  if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
    return 'public, max-age=31536000, immutable';
  }

  // Default - short cache (1 hour)
  return 'public, max-age=3600';
};

// Get content type
const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || mime.lookup(filePath) || 'application/octet-stream';
};

// Calculate file hash
const calculateFileHash = async (filePath) => {
  const content = await readFile(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
};

// Recursively get all files in directory
const getAllFiles = async (dir, fileList = []) => {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
};

// Upload file to S3
const uploadFile = async (filePath) => {
  const relativePath = path.relative(config.sourceDir, filePath);
  const s3Key = relativePath.replace(/\\/g, '/'); // Convert Windows paths

  const fileContent = await readFile(filePath);
  const contentType = getContentType(filePath);
  const cacheControl = getCacheControl(filePath);

  if (config.verbose) {
    console.log(`  Uploading: ${s3Key}`);
    console.log(`    Content-Type: ${contentType}`);
    console.log(`    Cache-Control: ${cacheControl}`);
  } else {
    console.log(`  ↑ ${s3Key}`);
  }

  if (!config.dryRun) {
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: {
        'uploaded-at': new Date().toISOString(),
      },
    });

    await s3Client.send(command);
  }

  return {
    path: s3Key,
    size: fileContent.length,
  };
};

// Invalidate CloudFront cache
const invalidateCache = async (paths = ['/*']) => {
  console.log('\n[3/3] Invalidating CloudFront cache...');

  if (config.dryRun) {
    console.log(`  [DRY RUN] Would invalidate paths: ${paths.join(', ')}`);
    return null;
  }

  const callerReference = `invalidation-${Date.now()}`;

  const command = new CreateInvalidationCommand({
    DistributionId: config.distributionId,
    InvalidationBatch: {
      CallerReference: callerReference,
      Paths: {
        Quantity: paths.length,
        Items: paths,
      },
    },
  });

  const response = await cloudFrontClient.send(command);
  const invalidationId = response.Invalidation.Id;

  console.log(`  ✓ Invalidation created: ${invalidationId}`);
  console.log(`    Status: ${response.Invalidation.Status}`);

  return invalidationId;
};

// Wait for invalidation to complete
const waitForInvalidation = async (invalidationId) => {
  console.log('\n  Waiting for invalidation to complete...');

  let status = 'InProgress';
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max

  while (status === 'InProgress' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const command = new GetInvalidationCommand({
      DistributionId: config.distributionId,
      Id: invalidationId,
    });

    const response = await cloudFrontClient.send(command);
    status = response.Invalidation.Status;
    attempts++;

    process.stdout.write('.');
  }

  console.log('');

  if (status === 'Completed') {
    console.log('  ✓ Invalidation completed successfully!');
  } else {
    console.log(`  ⚠ Invalidation status: ${status} (after ${attempts * 5} seconds)`);
  }
};

// Main deployment function
const deploy = async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('    Caraban CDN Deployment');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`S3 Bucket:   ${config.bucket}`);
  console.log(`Distribution: ${config.distributionId}`);
  console.log(`Source Dir:  ${config.sourceDir}`);
  console.log(`Dry Run:     ${config.dryRun}\n`);

  if (config.dryRun) {
    console.log('⚠ DRY RUN MODE - No changes will be made\n');
  }

  // Check if source directory exists
  if (!fs.existsSync(config.sourceDir)) {
    console.error(`Error: Source directory not found: ${config.sourceDir}`);
    console.error('Please build the frontend first: cd web && npm run build');
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    // Step 1: Get all files
    console.log('[1/3] Collecting files...');
    const files = await getAllFiles(config.sourceDir);
    console.log(`  Found ${files.length} files\n`);

    // Step 2: Upload files to S3
    console.log('[2/3] Uploading files to S3...');
    let totalSize = 0;

    for (const file of files) {
      const result = await uploadFile(file);
      totalSize += result.size;
    }

    console.log(`  ✓ Uploaded ${files.length} files (${(totalSize / 1024 / 1024).toFixed(2)} MB)\n`);

    // Step 3: Invalidate CloudFront cache
    const invalidationId = await invalidateCache();

    // Optionally wait for invalidation to complete
    if (invalidationId && process.argv.includes('--wait')) {
      await waitForInvalidation(invalidationId);
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✓ Deployment completed successfully!');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('Summary:');
    console.log(`  Files uploaded: ${files.length}`);
    console.log(`  Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Duration: ${duration}s`);
    console.log(`  S3 Bucket: s3://${config.bucket}`);

    if (!config.dryRun) {
      console.log('\nYour application should be available shortly!');
    }

  } catch (error) {
    console.error('\n✗ Deployment failed:');
    console.error(error.message);

    if (config.verbose) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
};

// Run deployment
if (require.main === module) {
  deploy().catch(console.error);
}

module.exports = { deploy, uploadFile, invalidateCache };
