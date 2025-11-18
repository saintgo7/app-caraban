#!/bin/bash

##############################################################################
# CloudFront Cache Invalidation Script
#
# Usage:
#   ./invalidate-cdn-cache.sh [OPTIONS]
#
# Options:
#   -d, --distribution-id   CloudFront Distribution ID (required)
#   -p, --paths             Paths to invalidate (comma-separated, default: /*)
#   -e, --environment       Environment name (development/staging/production)
#   -w, --wait              Wait for invalidation to complete
#   --all                   Invalidate all paths (equivalent to -p /*)
#   --images                Invalidate only images (equivalent to -p /images/*)
#   --static                Invalidate only static assets
#   -h, --help              Show this help message
#
# Examples:
#   # Invalidate all paths
#   ./invalidate-cdn-cache.sh -d E1234567890ABC --all
#
#   # Invalidate specific paths
#   ./invalidate-cdn-cache.sh -d E1234567890ABC -p /index.html,/static/css/*
#
#   # Invalidate and wait for completion
#   ./invalidate-cdn-cache.sh -d E1234567890ABC --all --wait
##############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DISTRIBUTION_ID=""
PATHS="/*"
WAIT_FOR_COMPLETION=false
ENVIRONMENT=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--distribution-id)
      DISTRIBUTION_ID="$2"
      shift 2
      ;;
    -p|--paths)
      PATHS="$2"
      shift 2
      ;;
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -w|--wait)
      WAIT_FOR_COMPLETION=true
      shift
      ;;
    --all)
      PATHS="/*"
      shift
      ;;
    --images)
      PATHS="/images/*"
      shift
      ;;
    --static)
      PATHS="/static/*"
      shift
      ;;
    -h|--help)
      sed -n '2,29p' "$0" | sed 's/^# //; s/^#//'
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [ -z "$DISTRIBUTION_ID" ]; then
  echo -e "${RED}Error: Distribution ID is required${NC}"
  echo "Use -h or --help for usage information"
  exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo -e "${RED}Error: AWS CLI is not installed${NC}"
  echo "Please install AWS CLI: https://aws.amazon.com/cli/"
  exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  echo -e "${RED}Error: AWS credentials not configured${NC}"
  echo "Please run: aws configure"
  exit 1
fi

echo -e "${GREEN}Starting CloudFront cache invalidation...${NC}"
echo "Distribution ID: $DISTRIBUTION_ID"
echo "Paths: $PATHS"

# Convert comma-separated paths to JSON array
IFS=',' read -ra PATH_ARRAY <<< "$PATHS"
PATHS_JSON=$(printf ',"%s"' "${PATH_ARRAY[@]}")
PATHS_JSON="[${PATHS_JSON:1}]"

# Create invalidation
CALLER_REFERENCE="invalidation-$(date +%s)-$$"

echo -e "${YELLOW}Creating invalidation...${NC}"

INVALIDATION_OUTPUT=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "${PATH_ARRAY[@]}" \
  --output json)

INVALIDATION_ID=$(echo "$INVALIDATION_OUTPUT" | grep -o '"Id": "[^"]*"' | cut -d'"' -f4)

if [ -z "$INVALIDATION_ID" ]; then
  echo -e "${RED}Error: Failed to create invalidation${NC}"
  exit 1
fi

echo -e "${GREEN}Invalidation created successfully!${NC}"
echo "Invalidation ID: $INVALIDATION_ID"

# Wait for completion if requested
if [ "$WAIT_FOR_COMPLETION" = true ]; then
  echo -e "${YELLOW}Waiting for invalidation to complete...${NC}"

  aws cloudfront wait invalidation-completed \
    --distribution-id "$DISTRIBUTION_ID" \
    --id "$INVALIDATION_ID"

  echo -e "${GREEN}Invalidation completed successfully!${NC}"
else
  echo -e "${YELLOW}Invalidation is in progress. You can check the status with:${NC}"
  echo "aws cloudfront get-invalidation --distribution-id $DISTRIBUTION_ID --id $INVALIDATION_ID"
fi

# Log invalidation details
LOG_FILE="/tmp/cdn-invalidations.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') | Distribution: $DISTRIBUTION_ID | Invalidation: $INVALIDATION_ID | Paths: $PATHS" >> "$LOG_FILE"

echo -e "${GREEN}Done!${NC}"
