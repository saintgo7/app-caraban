# Caraban 캠핑 플랫폼 배포 가이드

## 목차
1. [로컬 개발 환경](#로컬-개발-환경)
2. [스테이징 환경](#스테이징-환경)
3. [프로덕션 환경](#프로덕션-환경)
4. [환경별 설정](#환경별-설정)
5. [백업 및 복구](#백업-및-복구)

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
