#!/bin/bash

##############################################################################
# Deploy Frontend Assets to S3 and Invalidate CloudFront Cache
#
# Usage:
#   ./deploy-to-cdn.sh [OPTIONS]
#
# Options:
#   -b, --bucket            S3 bucket name (required)
#   -d, --distribution-id   CloudFront Distribution ID (required)
#   -s, --source            Source directory (default: web/dist)
#   -e, --environment       Environment (development/staging/production)
#   --no-cache-control      Skip setting cache-control headers
#   --no-invalidate         Skip CloudFront cache invalidation
#   --dry-run               Show what would be done without making changes
#   -h, --help              Show this help message
#
# Examples:
#   # Deploy production build
#   ./deploy-to-cdn.sh -b caraban-prod-static -d E1234567890ABC
#
#   # Dry run to preview changes
#   ./deploy-to-cdn.sh -b caraban-prod-static -d E1234567890ABC --dry-run
##############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
BUCKET_NAME=""
DISTRIBUTION_ID=""
SOURCE_DIR="web/dist"
ENVIRONMENT="production"
NO_CACHE_CONTROL=false
NO_INVALIDATE=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -b|--bucket)
      BUCKET_NAME="$2"
      shift 2
      ;;
    -d|--distribution-id)
      DISTRIBUTION_ID="$2"
      shift 2
      ;;
    -s|--source)
      SOURCE_DIR="$2"
      shift 2
      ;;
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --no-cache-control)
      NO_CACHE_CONTROL=true
      shift
      ;;
    --no-invalidate)
      NO_INVALIDATE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      sed -n '2,23p' "$0" | sed 's/^# //; s/^#//'
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [ -z "$BUCKET_NAME" ]; then
  echo -e "${RED}Error: S3 bucket name is required${NC}"
  exit 1
fi

if [ -z "$DISTRIBUTION_ID" ] && [ "$NO_INVALIDATE" = false ]; then
  echo -e "${RED}Error: CloudFront Distribution ID is required (or use --no-invalidate)${NC}"
  exit 1
fi

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo -e "${RED}Error: Source directory not found: $SOURCE_DIR${NC}"
  echo "Please build the frontend first: cd web && npm run build"
  exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo -e "${RED}Error: AWS CLI is not installed${NC}"
  exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  echo -e "${RED}Error: AWS credentials not configured${NC}"
  exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    Caraban CDN Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Environment:     $ENVIRONMENT"
echo "S3 Bucket:       $BUCKET_NAME"
echo "Distribution ID: $DISTRIBUTION_ID"
echo "Source Dir:      $SOURCE_DIR"
echo "Dry Run:         $DRY_RUN"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
  echo ""
fi

# Function to get MIME type
get_mime_type() {
  local file="$1"
  local extension="${file##*.}"

  case "$extension" in
    html) echo "text/html" ;;
    css) echo "text/css" ;;
    js) echo "application/javascript" ;;
    json) echo "application/json" ;;
    jpg|jpeg) echo "image/jpeg" ;;
    png) echo "image/png" ;;
    gif) echo "image/gif" ;;
    svg) echo "image/svg+xml" ;;
    webp) echo "image/webp" ;;
    woff) echo "font/woff" ;;
    woff2) echo "font/woff2" ;;
    ttf) echo "font/ttf" ;;
    eot) echo "application/vnd.ms-fontobject" ;;
    ico) echo "image/x-icon" ;;
    xml) echo "application/xml" ;;
    pdf) echo "application/pdf" ;;
    *) echo "application/octet-stream" ;;
  esac
}

# Function to get cache-control header
get_cache_control() {
  local file="$1"
  local path="$2"

  # HTML files - no cache
  if [[ "$file" == *.html ]]; then
    echo "public, max-age=0, must-revalidate"
  # Static assets with hash - long cache
  elif [[ "$path" == */static/* ]] || [[ "$file" =~ \.[a-f0-9]{8,}\. ]]; then
    echo "public, max-age=31536000, immutable"
  # Images - medium cache
  elif [[ "$file" =~ \.(jpg|jpeg|png|gif|svg|webp|ico)$ ]]; then
    echo "public, max-age=2592000"
  # Fonts - long cache
  elif [[ "$file" =~ \.(woff|woff2|ttf|eot)$ ]]; then
    echo "public, max-age=31536000, immutable"
  # Default - short cache
  else
    echo "public, max-age=3600"
  fi
}

# Step 1: Sync files to S3
echo -e "${GREEN}[1/3] Uploading files to S3...${NC}"

DRY_RUN_FLAG=""
if [ "$DRY_RUN" = true ]; then
  DRY_RUN_FLAG="--dryrun"
fi

# Upload with appropriate cache headers
find "$SOURCE_DIR" -type f | while read -r file; do
  relative_path="${file#$SOURCE_DIR/}"
  s3_path="s3://$BUCKET_NAME/$relative_path"

  mime_type=$(get_mime_type "$file")

  if [ "$NO_CACHE_CONTROL" = false ]; then
    cache_control=$(get_cache_control "$file" "$relative_path")

    echo "  Uploading: $relative_path (Cache: $cache_control)"

    if [ "$DRY_RUN" = false ]; then
      aws s3 cp "$file" "$s3_path" \
        --content-type "$mime_type" \
        --cache-control "$cache_control" \
        --metadata-directive REPLACE \
        --quiet
    fi
  else
    echo "  Uploading: $relative_path"

    if [ "$DRY_RUN" = false ]; then
      aws s3 cp "$file" "$s3_path" \
        --content-type "$mime_type" \
        --quiet
    fi
  fi
done

echo -e "${GREEN}✓ Files uploaded successfully${NC}"
echo ""

# Step 2: Set public-read ACL (if needed)
echo -e "${GREEN}[2/3] Setting object permissions...${NC}"

if [ "$DRY_RUN" = false ]; then
  # Note: We're using OAI, so we don't need public-read ACL
  echo "  Using CloudFront OAI - no public ACL needed"
else
  echo "  [DRY RUN] Would set object permissions"
fi

echo -e "${GREEN}✓ Permissions configured${NC}"
echo ""

# Step 3: Invalidate CloudFront cache
if [ "$NO_INVALIDATE" = false ]; then
  echo -e "${GREEN}[3/3] Invalidating CloudFront cache...${NC}"

  if [ "$DRY_RUN" = false ]; then
    INVALIDATION_OUTPUT=$(aws cloudfront create-invalidation \
      --distribution-id "$DISTRIBUTION_ID" \
      --paths "/*" \
      --output json)

    INVALIDATION_ID=$(echo "$INVALIDATION_OUTPUT" | grep -o '"Id": "[^"]*"' | cut -d'"' -f4)

    echo "  Invalidation ID: $INVALIDATION_ID"
    echo "  Status: In Progress"
    echo ""
    echo "  You can check the status with:"
    echo "  aws cloudfront get-invalidation --distribution-id $DISTRIBUTION_ID --id $INVALIDATION_ID"
  else
    echo "  [DRY RUN] Would create CloudFront invalidation for /*"
  fi

  echo -e "${GREEN}✓ Cache invalidation initiated${NC}"
else
  echo -e "${YELLOW}[3/3] Skipping cache invalidation (--no-invalidate)${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# Summary
if [ "$DRY_RUN" = false ]; then
  FILE_COUNT=$(find "$SOURCE_DIR" -type f | wc -l)
  echo ""
  echo "Summary:"
  echo "  Files uploaded: $FILE_COUNT"
  echo "  S3 Bucket: s3://$BUCKET_NAME"

  if [ "$NO_INVALIDATE" = false ]; then
    # Get CloudFront domain
    CF_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text 2>/dev/null || echo "")
    if [ -n "$CF_DOMAIN" ]; then
      echo "  CDN URL: https://$CF_DOMAIN"
    fi
  fi

  echo ""
  echo "Your application should be available shortly!"
fi
