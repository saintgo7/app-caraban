# Caraban 배포 스크립트

이 디렉토리는 Caraban 캠핑 플랫폼의 배포 및 운영을 위한 자동화 스크립트를 포함하고 있습니다.

## 📋 스크립트 목록

### 1. `setup-server.sh` - 서버 초기 설정

AWS EC2 인스턴스에서 처음 실행하는 스크립트입니다. 서버를 프로덕션 배포에 필요한 상태로 자동 설정합니다.

**실행 방법:**
```bash
# 서버에 SSH 접속 후
./scripts/setup-server.sh
```

**수행 작업:**
- ✅ 시스템 패키지 업데이트
- ✅ Docker 및 Docker Compose 설치
- ✅ Nginx 설치 및 리버스 프록시 설정
- ✅ Certbot (Let's Encrypt SSL) 설치
- ✅ UFW 방화벽 설정
- ✅ 로그 로테이션 설정
- ✅ 자동 백업 크론잡 설정
- ✅ Netdata, fail2ban 모니터링 도구 설치
- ✅ 시스템 성능 최적화
- ✅ 헬퍼 스크립트 생성 (deploy.sh, logs.sh, status.sh)

**요구사항:**
- Ubuntu 22.04 LTS
- sudo 권한
- 인터넷 연결

### 2. `deploy-aws.sh` - 자동 배포

로컬 머신에서 실행하여 AWS EC2 서버에 애플리케이션을 배포합니다.

**실행 방법:**
```bash
# Staging 환경 배포
export DEPLOY_HOST=staging.caraban.com
export DEPLOY_USER=ubuntu
./scripts/deploy-aws.sh staging

# Production 환경 배포
export DEPLOY_HOST=caraban.com
export DEPLOY_USER=ubuntu
./scripts/deploy-aws.sh production
```

**수행 작업:**
- ✅ SSH 연결 테스트
- ✅ 환경별 설정 검증
- ✅ 배포 패키지 생성
- ✅ 서버로 파일 전송
- ✅ 데이터베이스 백업 (프로덕션만)
- ✅ Docker 이미지 풀
- ✅ 무중단 컨테이너 재시작
- ✅ 헬스 체크 수행
- ✅ 실패 시 자동 롤백
- ✅ 이전 백업 정리

**필수 환경 변수:**
- `DEPLOY_HOST`: 배포 대상 서버 주소
- `DEPLOY_USER`: SSH 사용자명 (기본값: ubuntu)

**요구사항:**
- SSH 키가 ssh-agent에 추가되어 있어야 함
- 서버에서 `setup-server.sh` 실행이 완료되어 있어야 함

### 3. `backup.sh` - 데이터베이스 백업

MariaDB 데이터베이스를 백업하는 스크립트입니다. 서버의 크론잡으로 매일 자동 실행됩니다.

**자동 실행:**
- 매일 새벽 2시에 크론잡으로 자동 실행
- `setup-server.sh` 실행 시 자동으로 크론잡 등록

**수동 실행:**
```bash
# Docker 컨테이너 내부에서 실행
docker compose -f docker-compose.prod.yml exec mariadb sh /backup.sh

# 또는 호스트에서 직접 실행
cd /var/www/caraban/current
./scripts/backup.sh
```

**수행 작업:**
- ✅ 데이터베이스 전체 덤프 (mysqldump)
- ✅ Gzip 압축
- ✅ 타임스탬프가 포함된 파일명으로 저장
- ✅ 30일 이상 된 백업 자동 삭제

**백업 파일 위치:**
- `/backups/caraban_db_backup_YYYYMMDD_HHMMSS.sql.gz`

**환경 변수 (필수):**
- `MYSQL_HOST`: MariaDB 호스트 (기본값: mariadb)
- `MYSQL_USER`: 데이터베이스 사용자 (기본값: caraban)
- `MYSQL_PASSWORD`: 데이터베이스 비밀번호
- `MYSQL_DATABASE`: 데이터베이스 이름 (기본값: caraban_production)
- `BACKUP_DIR`: 백업 저장 디렉토리 (기본값: /backups)

## 🛠️ 서버 헬퍼 스크립트

`setup-server.sh` 실행 후 서버 홈 디렉토리에 자동 생성되는 편의 스크립트입니다.

### `~/deploy.sh` - 빠른 재배포

```bash
./deploy.sh
```

최신 Docker 이미지를 풀하고 무중단으로 컨테이너를 재시작합니다.

### `~/logs.sh` - 로그 보기

```bash
./logs.sh
```

모든 컨테이너의 실시간 로그를 출력합니다 (최근 100줄).

### `~/status.sh` - 상태 확인

```bash
./status.sh
```

다음 정보를 한눈에 확인:
- Docker 컨테이너 상태
- 디스크 사용량
- 메모리 사용량
- Docker 리소스 통계

## 📚 사용 예시

### 전체 배포 프로세스

```bash
# 1. 새 EC2 인스턴스 설정
ssh -i key.pem ubuntu@new-server-ip
git clone https://github.com/your-org/app-caraban.git
cd app-caraban
./scripts/setup-server.sh
# 로그아웃 후 다시 로그인 (Docker 그룹 적용)

# 2. SSL 인증서 발급
sudo certbot --nginx -d your-domain.com

# 3. Nginx 설정 업데이트
sudo vim /etc/nginx/sites-available/caraban
# HTTPS 블록 주석 해제 및 도메인 수정
sudo nginx -t && sudo systemctl reload nginx

# 4. 환경 변수 설정
cd /var/www/caraban
vim .env.production
# 모든 환경 변수 설정

# 5. 로컬 머신에서 배포
export DEPLOY_HOST=your-domain.com
./scripts/deploy-aws.sh production

# 6. 배포 확인
ssh ubuntu@your-domain.com './status.sh'
```

### 일상 운영 작업

```bash
# 애플리케이션 재배포
./scripts/deploy-aws.sh production

# 서버에서 로그 확인
ssh ubuntu@server './logs.sh'

# 서버 상태 확인
ssh ubuntu@server './status.sh'

# 수동 백업
ssh ubuntu@server 'cd /var/www/caraban/current && docker compose -f docker-compose.prod.yml exec mariadb sh /backup.sh'

# 백업 복원
scp ubuntu@server:/backups/caraban_db_backup_20250117_020000.sql.gz .
gunzip caraban_db_backup_20250117_020000.sql.gz
cat caraban_db_backup_20250117_020000.sql | ssh ubuntu@server 'docker compose -f /var/www/caraban/current/docker-compose.prod.yml exec -T mariadb mysql -u caraban -p caraban_production'
```

### 트러블슈팅

```bash
# 컨테이너 재시작
ssh ubuntu@server 'cd /var/www/caraban/current && docker compose -f docker-compose.prod.yml restart'

# 컨테이너 로그 확인
ssh ubuntu@server 'cd /var/www/caraban/current && docker compose -f docker-compose.prod.yml logs backend --tail=200'

# 이전 버전으로 롤백
ssh ubuntu@server 'cd /var/www/caraban && rm -rf current && mv backup_* current && cd current && docker compose -f docker-compose.prod.yml up -d'

# 디스크 공간 정리
ssh ubuntu@server 'docker system prune -af'
```

## 🔒 보안 고려사항

1. **SSH 키 관리**
   - SSH 개인키는 안전하게 보관
   - GitHub Secrets에 저장 시 전체 내용 복사
   - 정기적으로 키 로테이션

2. **환경 변수**
   - `.env` 파일은 절대 Git에 커밋하지 않음
   - 강력한 비밀번호 사용 (최소 32자)
   - 프로덕션과 스테이징은 다른 키 사용

3. **방화벽**
   - SSH는 관리자 IP만 허용 권장
   - 불필요한 포트는 차단
   - fail2ban으로 brute-force 공격 방지

4. **백업**
   - 백업 파일도 암호화 권장
   - 정기적으로 복원 테스트 수행
   - 오프사이트 백업 (S3 등) 고려

## 📞 지원

문제가 발생하면:
1. `DEPLOYMENT.md` 참조
2. GitHub Issues에 보고
3. 로그 파일 확인 (`./logs.sh`)

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
