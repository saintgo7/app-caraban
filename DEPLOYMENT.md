# Caraban 캠핑 플랫폼 배포 가이드

## 목차
1. [로컬 개발 환경](#로컬-개발-환경)
2. [AWS EC2 서버 설정](#aws-ec2-서버-설정)
3. [CI/CD 파이프라인](#cicd-파이프라인)
4. [스테이징 환경](#스테이징-환경)
5. [프로덕션 환경](#프로덕션-환경)
6. [환경별 설정](#환경별-설정)
7. [백업 및 복구](#백업-및-복구)

## 로컬 개발 환경

### 필수 요구사항
- Docker 및 Docker Compose
- Node.js 18+
- pnpm

### 실행 방법

1. **환경 변수 설정**
```bash
cp .env.example .env
# .env 파일 편집하여 필요한 값 입력
```

2. **SQLite를 사용한 개발 환경**
```bash
# Backend 실행
cd backend
pnpm install
pnpm dev

# Web 실행 (다른 터미널에서)
cd web
pnpm install
pnpm dev
```

3. **Docker Compose로 전체 실행**
```bash
docker-compose up -d
```

4. **MariaDB를 포함한 실행**
```bash
docker-compose --profile mariadb up -d
```

### 접속 주소
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

## AWS EC2 서버 설정

### 1. EC2 인스턴스 생성

**권장 사양:**
- **인스턴스 타입**:
  - Staging: t3.small (2 vCPU, 2GB RAM)
  - Production: t3.medium (2 vCPU, 4GB RAM) 이상
- **OS**: Ubuntu 22.04 LTS
- **스토리지**: 최소 30GB (SSD)
- **보안 그룹 설정**:
  - SSH (22): 관리자 IP만 허용
  - HTTP (80): 모든 트래픽 허용
  - HTTPS (443): 모든 트래픽 허용

### 2. 자동 서버 설정

SSH로 서버에 접속한 후, 다음 스크립트를 실행하여 서버를 자동으로 설정합니다:

```bash
# 서버에 접속
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# 프로젝트 클론
git clone https://github.com/your-org/app-caraban.git
cd app-caraban

# 서버 자동 설정 스크립트 실행
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh
```

이 스크립트는 다음 작업을 자동으로 수행합니다:
- ✅ 시스템 패키지 업데이트
- ✅ Docker 및 Docker Compose 설치
- ✅ Nginx 설치 및 기본 설정
- ✅ Certbot (Let's Encrypt) 설치
- ✅ 방화벽 설정 (UFW)
- ✅ 로그 로테이션 설정
- ✅ 자동 백업 크론잡 설정
- ✅ 모니터링 도구 설치 (netdata, fail2ban)
- ✅ 시스템 최적화

### 3. SSL 인증서 발급

**도메인 DNS 설정 후** Let's Encrypt로 무료 SSL 인증서를 발급받습니다:

```bash
# DNS A 레코드가 서버 IP를 가리키는지 확인
# caraban.com -> your-ec2-public-ip
# www.caraban.com -> your-ec2-public-ip

# SSL 인증서 발급
sudo certbot --nginx -d caraban.com -d www.caraban.com
```

Certbot이 자동으로 Nginx 설정을 업데이트하고 HTTPS를 활성화합니다.

**인증서 자동 갱신 확인:**
```bash
sudo certbot renew --dry-run
```

### 4. Nginx 설정 업데이트

서버 설정 후, Nginx 설정 파일을 편집하여 도메인을 업데이트합니다:

```bash
sudo vim /etc/nginx/sites-available/caraban
```

주석 처리된 HTTPS 서버 블록의 주석을 해제하고 도메인 이름을 수정합니다:

```nginx
server {
    listen 443 ssl http2;
    server_name caraban.com www.caraban.com;  # 실제 도메인으로 변경

    # SSL 인증서 경로 확인
    ssl_certificate /etc/letsencrypt/live/caraban.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/caraban.com/privkey.pem;

    # ... 나머지 설정
}
```

설정 테스트 및 적용:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 환경 변수 설정

서버에 환경 변수 파일을 생성합니다:

```bash
cd /var/www/caraban
vim .env.production  # 또는 .env.staging
```

모든 필수 환경 변수를 설정합니다:
```bash
NODE_ENV=production
DB_TYPE=mariadb
DB_HOST=mariadb
DB_PORT=3306
DB_NAME=caraban_production
DB_USER=caraban
DB_PASSWORD=strong_password_here

JWT_SECRET=very_strong_jwt_secret_here
REFRESH_TOKEN_SECRET=very_strong_refresh_secret_here

# Kakao API
VITE_KAKAO_MAPS_API_KEY=your_kakao_maps_key
VITE_KAKAO_REST_API_KEY=your_kakao_rest_key

# Email (Gmail 예시)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Payment (PortOne)
PORTONE_API_KEY=your_portone_key
PORTONE_API_SECRET=your_portone_secret
VITE_PORTONE_IMP_CODE=your_imp_code

# CORS
CORS_ORIGIN=https://caraban.com,https://www.caraban.com

# Other settings
LOG_LEVEL=warn
RATE_LIMIT_MAX_REQUESTS=100
```

## CI/CD 파이프라인

### GitHub Actions 자동 배포

프로젝트에는 GitHub Actions를 사용한 완전 자동화된 CI/CD 파이프라인이 포함되어 있습니다.

### 파이프라인 구조

```
main 브랜치 push → 테스트 → Docker 빌드 → Production 배포
develop 브랜치 push → 테스트 → Docker 빌드 → Staging 배포
PR 생성 → 테스트만 실행
```

### 필수 GitHub Secrets 설정

GitHub 저장소 Settings > Secrets and variables > Actions에서 다음 시크릿을 추가합니다:

**Docker Hub 설정:**
- `DOCKER_USERNAME`: Docker Hub 사용자명
- `DOCKER_PASSWORD`: Docker Hub 액세스 토큰

**Staging 환경:**
- `STAGING_HOST`: Staging 서버 IP 또는 도메인
- `STAGING_USER`: SSH 사용자 (보통 `ubuntu`)
- `STAGING_SSH_KEY`: SSH 개인키 전체 내용 (PEM 파일)

**Production 환경:**
- `PRODUCTION_HOST`: Production 서버 IP 또는 도메인
- `PRODUCTION_USER`: SSH 사용자 (보통 `ubuntu`)
- `PRODUCTION_SSH_KEY`: SSH 개인키 전체 내용 (PEM 파일)

### CI/CD 파이프라인 워크플로우

1. **자동 테스트**
   - Backend: ESLint, TypeScript 체크, 유닛 테스트
   - Frontend: ESLint, TypeScript 체크, 유닛 테스트

2. **Docker 이미지 빌드**
   - Multi-stage 빌드로 최적화된 이미지 생성
   - Docker Hub에 푸시
   - 태그: `production`/`staging` 및 Git SHA

3. **자동 배포**
   - SSH로 서버 접속
   - 최신 이미지 풀
   - 무중단 재배포 (zero downtime)
   - 헬스 체크 수행
   - 실패 시 자동 롤백

### 수동 배포 스크립트

GitHub Actions 없이 로컬에서 직접 배포하려면:

```bash
# Staging 배포
export DEPLOY_HOST=staging.caraban.com
export DEPLOY_USER=ubuntu
./scripts/deploy-aws.sh staging

# Production 배포
export DEPLOY_HOST=caraban.com
export DEPLOY_USER=ubuntu
./scripts/deploy-aws.sh production
```

배포 스크립트 기능:
- ✅ SSH 연결 테스트
- ✅ 배포 전 데이터베이스 백업 (프로덕션)
- ✅ 최신 Docker 이미지 풀
- ✅ 무중단 배포
- ✅ 헬스 체크
- ✅ 자동 롤백 (실패 시)
- ✅ 이전 백업 정리

### 배포 모니터링

서버에서 헬퍼 스크립트 사용:

```bash
# 서버에 SSH 접속 후
./status.sh    # 컨테이너 상태 및 리소스 사용량 확인
./logs.sh      # 실시간 로그 보기
./deploy.sh    # 빠른 재배포
```

## 스테이징 환경

### 준비사항
1. AWS EC2 인스턴스 (Ubuntu 22.04 LTS 권장)
2. Docker 및 Docker Compose 설치
3. 도메인 설정 (예: staging.caraban.com)

### 배포 단계

1. **서버 초기 설정**
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

2. **환경 변수 설정**
```bash
cp .env.staging .env
# 실제 값으로 업데이트:
# - DB_PASSWORD
# - JWT_SECRET
# - KAKAO API KEYS
# - AWS credentials
# - Email credentials
# - Payment credentials
```

3. **배포 실행**
```bash
docker-compose -f docker-compose.yml --profile full up -d --build
```

4. **로그 확인**
```bash
docker-compose logs -f backend
docker-compose logs -f web
```

## 프로덕션 환경

### 준비사항
1. AWS EC2 인스턴스 (최소 t3.medium 권장)
2. 도메인 및 SSL 인증서
3. 백업 스토리지 (S3 또는 별도 볼륨)

### 배포 단계

1. **환경 변수 설정**
```bash
cp .env.production .env
# 모든 프로덕션 값으로 업데이트
```

2. **SSL 인증서 준비**
```bash
# Let's Encrypt 사용 예시
sudo certbot certonly --standalone -d caraban.com -d www.caraban.com
```

3. **프로덕션 배포**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

4. **헬스 체크**
```bash
curl http://localhost/health
curl http://localhost:5000/api/health
```

### 모니터링

1. **컨테이너 상태 확인**
```bash
docker-compose -f docker-compose.prod.yml ps
```

2. **로그 모니터링**
```bash
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

3. **리소스 사용량**
```bash
docker stats
```

## 환경별 설정

### Development (.env.development)
- SQLite 데이터베이스
- 느슨한 CORS 설정
- 상세한 로깅 (debug 레벨)
- 높은 rate limit

### Staging (.env.staging)
- MariaDB 데이터베이스
- 제한된 CORS
- 일반 로깅 (info 레벨)
- 중간 rate limit

### Production (.env.production)
- MariaDB 데이터베이스 (복제 권장)
- 엄격한 CORS
- 최소 로깅 (warn 레벨)
- 낮은 rate limit
- SSL/TLS 필수
- Redis 캐싱 활성화

## 백업 및 복구

### 자동 백업
프로덕션 환경에서는 매일 자동으로 데이터베이스 백업이 생성됩니다.

백업 파일 위치: `./backups/`

### 수동 백업
```bash
# 데이터베이스 백업
docker exec caraban-mariadb-prod mysqldump \
  -u caraban -p \
  caraban_production > backup_$(date +%Y%m%d).sql

# 파일 백업 (업로드된 이미지 등)
tar -czf uploads_$(date +%Y%m%d).tar.gz backend/uploads/
```

### 복구
```bash
# 데이터베이스 복구
gunzip < backups/caraban_db_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i caraban-mariadb-prod mysql -u caraban -p caraban_production

# 파일 복구
tar -xzf uploads_YYYYMMDD.tar.gz
```

## 보안 체크리스트

### 프로덕션 배포 전 필수 확인사항

- [ ] 모든 기본 비밀번호 변경
- [ ] JWT_SECRET 강력한 값으로 설정
- [ ] DB_PASSWORD 강력한 값으로 설정
- [ ] CORS_ORIGIN 실제 도메인으로 제한
- [ ] SSL/TLS 인증서 설정
- [ ] 방화벽 설정 (필요한 포트만 개방)
- [ ] 백업 자동화 확인
- [ ] 모니터링 설정
- [ ] 로그 로테이션 설정
- [ ] Rate limiting 활성화
- [ ] 민감한 정보가 .env 파일에만 있고 Git에 커밋되지 않았는지 확인

## 트러블슈팅

### 컨테이너가 시작되지 않을 때
```bash
# 로그 확인
docker-compose logs backend

# 컨테이너 재시작
docker-compose restart backend
```

### 데이터베이스 연결 오류
```bash
# MariaDB 컨테이너 상태 확인
docker-compose ps mariadb

# MariaDB 로그 확인
docker-compose logs mariadb

# Health check 확인
docker inspect caraban-mariadb-prod | grep -A 10 Health
```

### 디스크 공간 부족
```bash
# 사용하지 않는 Docker 이미지/컨테이너 정리
docker system prune -a

# 로그 파일 정리
find backend/logs -name "*.log" -mtime +30 -delete
```

## 성능 최적화

### 1. 데이터베이스 최적화
- 인덱스 추가
- 쿼리 최적화
- Connection pooling

### 2. 캐싱
- Redis 활성화
- 정적 파일 CDN 사용

### 3. 이미지 최적화
- 이미지 압축
- WebP 포맷 사용
- S3 + CloudFront 사용

### 4. 로드 밸런싱
- Nginx 리버스 프록시
- 다중 백엔드 인스턴스
- 데이터베이스 복제

## 지원

문제가 발생하면 GitHub Issues에 보고해주세요:
https://github.com/your-org/app-caraban/issues
