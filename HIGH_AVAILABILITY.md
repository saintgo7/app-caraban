# Caraban 고가용성 (High Availability) 설정 가이드

이 문서는 Caraban 캠핑 플랫폼의 고가용성 구성 방법을 설명합니다.

## 목차

1. [고가용성 아키텍처 개요](#고가용성-아키텍처-개요)
2. [데이터베이스 복제 (Master-Slave)](#데이터베이스-복제-master-slave)
3. [Redis 복제](#redis-복제)
4. [로드 밸런서 설정](#로드-밸런서-설정)
5. [배포 및 운영](#배포-및-운영)
6. [모니터링 및 장애 복구](#모니터링-및-장애-복구)

## 고가용성 아키텍처 개요

### 구성 요소

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx Load Balancer                  │
│                   (Port 80, 443)                        │
└─────────────────┬───────────────────┬───────────────────┘
                  │                   │
    ┌─────────────┴────────┬──────────┴─────────┐
    │                      │                    │
┌───▼─────┐          ┌─────▼────┐        ┌─────▼────┐
│Backend-1│          │Backend-2 │        │Backend-3 │
│  :5001  │          │  :5002   │        │  :5003   │
└───┬─────┘          └────┬─────┘        └────┬─────┘
    │                     │                   │
    └──────────┬──────────┴────────┬──────────┘
               │                   │
        ┌──────▼────────┐   ┌──────▼─────────┐
        │ MariaDB       │   │ Redis          │
        │ Master        │   │ Master         │
        │   :3306       │   │   :6379        │
        └──────┬────────┘   └──────┬─────────┘
               │                   │
        ┌──────▼────────┐   ┌──────▼─────────┐
        │ MariaDB       │   │ Redis          │
        │ Slave         │   │ Replica        │
        │   :3307       │   │   :6380        │
        └───────────────┘   └────────────────┘
```

### 주요 기능

- ✅ **데이터베이스 복제**: Master-Slave 구성으로 읽기 부하 분산
- ✅ **Redis 복제**: 캐시 고가용성 보장
- ✅ **로드 밸런싱**: 3개의 백엔드 인스턴스로 부하 분산
- ✅ **자동 장애 복구**: 인스턴스 장애 시 자동으로 다른 인스턴스로 전환
- ✅ **헬스 체크**: 각 서비스의 상태를 지속적으로 모니터링
- ✅ **세션 유지**: Redis를 통한 세션 공유

## 데이터베이스 복제 (Master-Slave)

### 1. 복제 구성

MariaDB Master-Slave 복제는 다음과 같이 동작합니다:

- **Master**: 모든 쓰기(INSERT, UPDATE, DELETE) 작업 처리
- **Slave**: Master의 데이터를 실시간으로 복제하며, 읽기(SELECT) 작업 처리 가능

### 2. 복제 설정 방법

#### 자동 설정 (권장)

```bash
# High Availability 컨테이너 실행
docker-compose -f docker-compose.ha.yml up -d

# 복제 자동 설정 스크립트 실행
./scripts/setup-replication.sh
```

스크립트는 다음 작업을 자동으로 수행합니다:
1. Master에 복제 사용자 생성
2. Master의 바이너리 로그 위치 확인
3. Slave에서 Master 연결 설정
4. 복제 시작 및 상태 확인
5. 복제 테스트

#### 수동 설정

**Master에서 복제 사용자 생성:**

```sql
CREATE USER 'repl_user'@'%' IDENTIFIED BY 'your_replication_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl_user'@'%';
FLUSH PRIVILEGES;
```

**Master 상태 확인:**

```sql
SHOW MASTER STATUS;
```

결과:
```
+------------------+----------+--------------+------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB |
+------------------+----------+--------------+------------------+
| mysql-bin.000001 |      123 | caraban_prod |                  |
+------------------+----------+--------------+------------------+
```

**Slave 설정:**

```sql
STOP SLAVE;

CHANGE MASTER TO
    MASTER_HOST='mariadb-master',
    MASTER_USER='repl_user',
    MASTER_PASSWORD='your_replication_password',
    MASTER_LOG_FILE='mysql-bin.000001',
    MASTER_LOG_POS=123;

START SLAVE;
```

**Slave 상태 확인:**

```sql
SHOW SLAVE STATUS\G
```

확인할 주요 항목:
- `Slave_IO_Running: Yes`
- `Slave_SQL_Running: Yes`
- `Seconds_Behind_Master: 0` (또는 작은 값)

### 3. 복제 모니터링

```bash
# 복제 상태 확인
docker exec caraban-mariadb-slave mysql -u root -p \
    -e "SHOW SLAVE STATUS\G" | grep -E "Running|Behind"

# 복제 지연 시간 확인
docker exec caraban-mariadb-slave mysql -u root -p \
    -e "SHOW SLAVE STATUS\G" | grep Seconds_Behind_Master
```

### 4. 복제 문제 해결

**복제가 멈췄을 때:**

```sql
STOP SLAVE;
START SLAVE;
SHOW SLAVE STATUS\G
```

**복제를 다시 설정해야 할 때:**

```bash
# 자동 설정 스크립트 재실행
./scripts/setup-replication.sh
```

## Redis 복제

### 1. Redis Master-Replica 구성

Redis 복제는 `docker-compose.ha.yml`에 자동으로 구성되어 있습니다.

- **Master**: 모든 쓰기 작업 처리 (Port 6379)
- **Replica**: Master 데이터 복제, 읽기 전용 (Port 6380)

### 2. Redis 복제 상태 확인

```bash
# Master 정보 확인
docker exec caraban-redis-master redis-cli -a your_redis_password INFO replication

# Replica 정보 확인
docker exec caraban-redis-replica redis-cli -a your_redis_password INFO replication
```

### 3. 캐시 페일오버

Redis Replica는 자동으로 Master의 데이터를 복제합니다. Master 장애 시 Replica를 Master로 승격할 수 있습니다:

```bash
# Replica를 Master로 승격
docker exec caraban-redis-replica redis-cli -a your_redis_password REPLICAOF NO ONE
```

## 로드 밸런서 설정

### 1. Nginx 로드 밸런싱 알고리즘

`config/nginx/nginx-lb.conf`에서 다음 알고리즘 중 선택 가능:

**Least Connections (현재 설정):**
```nginx
upstream backend_servers {
    least_conn;  # 연결 수가 가장 적은 서버로 전달

    server backend-1:5000;
    server backend-2:5000;
    server backend-3:5000;
}
```

**Round Robin:**
```nginx
upstream backend_servers {
    server backend-1:5000;
    server backend-2:5000;
    server backend-3:5000;
}
```

**IP Hash (세션 유지):**
```nginx
upstream backend_servers {
    ip_hash;  # 같은 클라이언트 IP는 항상 같은 서버로

    server backend-1:5000;
    server backend-2:5000;
    server backend-3:5000;
}
```

### 2. 헬스 체크 설정

각 백엔드 서버는 자동으로 헬스 체크됩니다:

```nginx
server backend-1:5000 max_fails=3 fail_timeout=30s;
```

- **max_fails**: 3번 실패 시 서버를 비활성화
- **fail_timeout**: 30초 동안 서버를 사용하지 않음

### 3. Rate Limiting

공격 방어를 위한 요청 제한:

```nginx
# API 요청 제한: 초당 10개
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# 로그인 요청 제한: 분당 5개
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
```

### 4. SSL/TLS 설정

A+ 등급 SSL 구성:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
```

## 배포 및 운영

### 1. HA 환경 시작

```bash
# 환경 변수 설정
cp .env.production .env
vim .env  # DB_REPLICATION_PASSWORD 등 설정

# 컨테이너 시작
docker-compose -f docker-compose.ha.yml up -d

# 복제 설정
./scripts/setup-replication.sh

# 상태 확인
docker-compose -f docker-compose.ha.yml ps
```

### 2. 개별 백엔드 스케일링

```bash
# 백엔드 인스턴스 추가 (4번째 인스턴스)
docker-compose -f docker-compose.ha.yml up -d --scale backend=4

# Nginx 설정에 추가
vim config/nginx/nginx-lb.conf
# upstream에 server backend-4:5000 추가

# Nginx 재로드
docker exec caraban-nginx-lb nginx -s reload
```

### 3. 무중단 업데이트

```bash
# 1. 백엔드 하나씩 업데이트
docker-compose -f docker-compose.ha.yml up -d --no-deps backend-1
# 헬스 체크 대기
sleep 30

docker-compose -f docker-compose.ha.yml up -d --no-deps backend-2
sleep 30

docker-compose -f docker-compose.ha.yml up -d --no-deps backend-3

# 2. Nginx 설정 변경 시 (무중단)
docker exec caraban-nginx-lb nginx -t  # 설정 테스트
docker exec caraban-nginx-lb nginx -s reload  # 재로드
```

## 모니터링 및 장애 복구

### 1. 시스템 상태 모니터링

```bash
# 전체 컨테이너 상태
docker-compose -f docker-compose.ha.yml ps

# 백엔드 헬스 체크
curl http://localhost/api/health

# 각 백엔드 인스턴스 직접 체크
curl http://localhost:5001/api/health
curl http://localhost:5002/api/health
curl http://localhost:5003/api/health

# Nginx 상태
curl http://127.0.0.1:8080/nginx_status
```

### 2. 로그 모니터링

```bash
# Nginx 접속 로그
tail -f nginx/logs/access.log

# Nginx 에러 로그
tail -f nginx/logs/error.log

# 백엔드 로그
docker-compose -f docker-compose.ha.yml logs -f backend-1
docker-compose -f docker-compose.ha.yml logs -f backend-2
docker-compose -f docker-compose.ha.yml logs -f backend-3

# 데이터베이스 로그
docker logs caraban-mariadb-master
docker logs caraban-mariadb-slave
```

### 3. 장애 시나리오 및 복구

#### 시나리오 1: 백엔드 인스턴스 장애

**증상**: 특정 백엔드 인스턴스가 응답하지 않음

**자동 복구**: Nginx가 자동으로 장애 인스턴스를 제외하고 나머지로 트래픽 전달

**수동 복구**:
```bash
# 장애 인스턴스 재시작
docker-compose -f docker-compose.ha.yml restart backend-1

# 로그 확인
docker-compose -f docker-compose.ha.yml logs backend-1
```

#### 시나리오 2: 데이터베이스 Master 장애

**증상**: 쓰기 작업 실패

**복구 절차**:
```bash
# 1. Slave를 Master로 승격
docker exec caraban-mariadb-slave mysql -u root -p <<EOF
STOP SLAVE;
RESET SLAVE ALL;
SET GLOBAL read_only = 0;
EOF

# 2. 애플리케이션 DB 연결 변경
# .env 파일에서 DB_HOST=mariadb-slave로 변경

# 3. 백엔드 재시작
docker-compose -f docker-compose.ha.yml restart backend-1 backend-2 backend-3

# 4. 기존 Master 복구 후 Slave로 전환
./scripts/setup-replication.sh
```

#### 시나리오 3: Redis Master 장애

**증상**: 캐시 쓰기 실패 (읽기는 작동)

**복구 절차**:
```bash
# Replica를 Master로 승격
docker exec caraban-redis-replica redis-cli -a your_redis_password REPLICAOF NO ONE

# 애플리케이션 Redis 연결 변경
# .env에서 REDIS_HOST=redis-replica로 변경

# 백엔드 재시작
docker-compose -f docker-compose.ha.yml restart backend-1 backend-2 backend-3
```

### 4. 성능 모니터링

```bash
# 데이터베이스 쿼리 성능
docker exec cariadb-mariadb-master mysql -u root -p \
    -e "SELECT * FROM information_schema.processlist WHERE time > 2;"

# 복제 지연 확인
watch -n 1 'docker exec caraban-mariadb-slave mysql -u root -p \
    -e "SHOW SLAVE STATUS\G" | grep Seconds_Behind_Master'

# Docker 리소스 사용량
docker stats --no-stream

# Nginx 커넥션 통계
curl -s http://127.0.0.1:8080/nginx_status
```

## 권장 하드웨어 사양

### 프로덕션 환경 (HA 구성)

**최소 사양:**
- **CPU**: 8 vCPU
- **RAM**: 16GB
- **스토리지**: 100GB SSD
- **네트워크**: 1Gbps

**권장 사양:**
- **CPU**: 16 vCPU
- **RAM**: 32GB
- **스토리지**: 200GB SSD (+ 별도 백업 스토리지)
- **네트워크**: 10Gbps

### 인스턴스 배치 권장사항

고가용성을 극대화하려면 서비스를 여러 물리적 서버/가용 영역에 분산:

- **옵션 1**: 단일 서버에 모든 컨테이너 (기본)
- **옵션 2**: 데이터베이스 별도 서버 (권장)
  - Server 1: Nginx LB + Backend instances
  - Server 2: MariaDB Master + Redis Master
  - Server 3: MariaDB Slave + Redis Replica

- **옵션 3**: 완전 분리 (최고 가용성)
  - Server 1: Nginx LB
  - Server 2-4: Backend instances
  - Server 5: MariaDB Master
  - Server 6: MariaDB Slave
  - Server 7: Redis Master
  - Server 8: Redis Replica

## 보안 고려사항

1. **방화벽 설정**: 데이터베이스와 Redis는 내부 네트워크만 접근 가능하도록 설정
2. **강력한 비밀번호**: 모든 DB_PASSWORD, REDIS_PASSWORD 등을 강력하게 설정
3. **정기 백업**: 매일 자동 백업 + 주간 오프사이트 백업
4. **SSL/TLS**: 모든 외부 통신은 HTTPS를 통해서만
5. **모니터링**: 침입 탐지 시스템 (fail2ban) 활성화
6. **업데이트**: 정기적인 보안 패치 적용

## 문제 해결

문제가 발생하면 다음 순서로 확인:

1. 헬스 체크 엔드포인트 확인
2. 컨테이너 로그 확인
3. 네트워크 연결 확인
4. 리소스 사용량 확인 (CPU, 메모리, 디스크)
5. 복제 상태 확인 (DB, Redis)

추가 도움이 필요하면 GitHub Issues에 문의하세요.
