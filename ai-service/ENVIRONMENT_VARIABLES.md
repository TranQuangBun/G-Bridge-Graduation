# Biến Môi Trường - AI Matching Service

## Tổng Quan

Tài liệu này mô tả tất cả các biến môi trường cần thiết cho AI Matching Service, cách cấu hình và sử dụng chúng.

## 1. Biến Môi Trường Bắt Buộc

### 1.1. OPENAI_API_KEY

**Mô tả:** API key để authenticate với OpenAI API.

**Type:** String (secret)

**Format:** `sk-...` (OpenAI API key format)

**Ví dụ:**
```bash
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

**Cách lấy:**
1. Đăng ký tài khoản tại https://platform.openai.com/
2. Tạo API key trong API Keys section
3. Copy key (chỉ hiển thị một lần, lưu cẩn thận)

**Bảo mật:**
- ⚠️ **KHÔNG BAO GIỜ** commit vào git
- ⚠️ **KHÔNG BAO GIỜ** share publicly
- ✅ Sử dụng `.env` file (đã có trong `.gitignore`)
- ✅ Sử dụng secrets management trong production

**Validation:**
- Service sẽ fail nếu không có key này
- Key phải valid và có credits/quota

### 1.2. OPENAI_MODEL

**Mô tả:** Model name để sử dụng cho OpenAI API.

**Type:** String

**Default:** `gpt-4-turbo-preview`

**Giá trị hợp lệ:**
- `gpt-4-turbo-preview` (Recommended - best quality)
- `gpt-4-0125-preview` (Latest GPT-4)
- `gpt-3.5-turbo` (Cost-effective alternative)

**Ví dụ:**
```bash
OPENAI_MODEL=gpt-4-turbo-preview
```

**Lưu ý:**
- Model names có thể thay đổi theo thời gian
- Check OpenAI documentation cho latest models
- GPT-4 tốt hơn nhưng đắt hơn GPT-3.5

## 2. Biến Môi Trường Tùy Chọn

### 2.1. API_PORT

**Mô tả:** Port mà AI service sẽ listen.

**Type:** Integer

**Default:** `5000`

**Ví dụ:**
```bash
API_PORT=5000
```

**Lưu ý:**
- Phải match với port trong docker-compose.yml
- Đảm bảo port không bị conflict với services khác

### 2.2. API_HOST

**Mô tả:** Host address để bind service.

**Type:** String

**Default:** `0.0.0.0`

**Ví dụ:**
```bash
API_HOST=0.0.0.0
```

**Giải thích:**
- `0.0.0.0`: Listen trên tất cả interfaces (recommended cho Docker)
- `127.0.0.1`: Chỉ listen trên localhost
- `localhost`: Tương tự `127.0.0.1`

**Recommendation:** Giữ `0.0.0.0` cho Docker deployment.

### 2.3. LOG_LEVEL

**Mô tả:** Logging level cho service.

**Type:** String

**Default:** `INFO`

**Giá trị hợp lệ:**
- `DEBUG`: Chi tiết nhất, include debug info
- `INFO`: Thông tin chung (recommended)
- `WARNING`: Chỉ warnings và errors
- `ERROR`: Chỉ errors
- `CRITICAL`: Chỉ critical errors

**Ví dụ:**
```bash
LOG_LEVEL=INFO
```

**Recommendation:**
- Development: `DEBUG` hoặc `INFO`
- Production: `INFO` hoặc `WARNING`

### 2.4. ALLOWED_ORIGINS

**Mô tả:** CORS allowed origins (comma-separated).

**Type:** String (comma-separated list)

**Default:** `http://localhost:4000,http://localhost:3333`

**Ví dụ:**
```bash
# Single origin
ALLOWED_ORIGINS=http://localhost:4000

# Multiple origins
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3333,https://app.example.com
```

**Lưu ý:**
- Phải match với frontend URLs
- Include protocol (`http://` hoặc `https://`)
- No trailing slashes
- Comma-separated, no spaces

**Production Example:**
```bash
ALLOWED_ORIGINS=https://gbridge.com,https://www.gbridge.com
```

## 3. File Cấu Hình

### 3.1. .env File

**Location:** `/ai-service/.env`

**Format:**
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-abc123xyz789...
OPENAI_MODEL=gpt-4-turbo-preview

# Service Configuration
API_PORT=5000
API_HOST=0.0.0.0
LOG_LEVEL=INFO

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3333
```

**Lưu ý:**
- File này đã có trong `.gitignore`
- Không commit vào git
- Copy từ `.env.example` và điền values

### 3.2. .env.example

**Location:** `/ai-service/.env.example`

**Purpose:** Template file với placeholder values

**Content:**
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview

# Service Configuration
API_PORT=5000
API_HOST=0.0.0.0
LOG_LEVEL=INFO

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3333
```

## 4. Docker Environment Variables

### 4.1. docker-compose.yml Configuration

**Location:** `/docker-compose.yml`

**Example:**
```yaml
ai-service:
  environment:
    - OPENAI_API_KEY=${OPENAI_API_KEY:-your_openai_api_key_here}
    - OPENAI_MODEL=${OPENAI_MODEL:-gpt-4-turbo-preview}
    - API_PORT=5000
    - API_HOST=0.0.0.0
    - LOG_LEVEL=INFO
    - ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3333
```

**Syntax:**
- `${VARIABLE:-default}`: Use environment variable hoặc default value
- Variables từ `.env` file hoặc system environment

### 4.2. Setting Variables

**Option 1: .env file (Recommended)**
```bash
# Create .env file in project root
OPENAI_API_KEY=sk-proj-...
```

**Option 2: System Environment**
```bash
export OPENAI_API_KEY=sk-proj-...
docker-compose up
```

**Option 3: docker-compose.override.yml**
```yaml
# Create docker-compose.override.yml (gitignored)
services:
  ai-service:
    environment:
      - OPENAI_API_KEY=sk-proj-...
```

## 5. Development Setup

### 5.1. Local Development

**Steps:**
1. Copy `.env.example` to `.env`:
   ```bash
   cp ai-service/.env.example ai-service/.env
   ```

2. Edit `.env` và điền values:
   ```bash
   nano ai-service/.env
   ```

3. Set OPENAI_API_KEY:
   ```bash
   OPENAI_API_KEY=sk-proj-your-key-here
   ```

4. Run service:
   ```bash
   cd ai-service
   uvicorn app.main:app --reload
   ```

### 5.2. Docker Development

**Steps:**
1. Create `.env` file ở project root:
   ```bash
   OPENAI_API_KEY=sk-proj-your-key-here
   ```

2. Start service:
   ```bash
   docker-compose up ai-service
   ```

3. Check logs:
   ```bash
   docker-compose logs ai-service
   ```

## 6. Production Setup

### 6.1. Environment Variables

**Best Practices:**
1. **Use Secrets Management:**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets
   - Docker Secrets

2. **Never Hardcode:**
   - ❌ Don't put keys in code
   - ❌ Don't commit to git
   - ✅ Use environment variables
   - ✅ Use secrets management

3. **Rotate Keys:**
   - Rotate API keys regularly
   - Have backup keys ready
   - Monitor usage và alerts

### 6.2. Production .env Example

```bash
# Production Environment Variables
OPENAI_API_KEY=sk-proj-production-key-here
OPENAI_MODEL=gpt-4-turbo-preview
API_PORT=5000
API_HOST=0.0.0.0
LOG_LEVEL=WARNING
ALLOWED_ORIGINS=https://gbridge.com,https://www.gbridge.com
```

## 7. Validation và Error Handling

### 7.1. Startup Validation

Service sẽ validate các biến môi trường khi start:

```python
# app/core/config.py
class Settings(BaseSettings):
    openai_api_key: str  # Required, no default
    openai_model: str = "gpt-4-turbo-preview"  # Has default
    
    class Config:
        env_file = ".env"
```

**Errors:**
- Missing `OPENAI_API_KEY`: Service sẽ fail to start
- Invalid model name: Service start nhưng API calls sẽ fail
- Invalid port: Service sẽ fail to bind

### 7.2. Runtime Validation

```python
# Check API key validity
try:
    response = client.chat.completions.create(...)
except AuthenticationError:
    # Invalid API key
    logger.error("Invalid OpenAI API key")
except RateLimitError:
    # Rate limit exceeded
    logger.warning("Rate limit exceeded")
```

## 8. Troubleshooting

### 8.1. Common Issues

**Issue 1: Service không start**
```
Error: OPENAI_API_KEY is required
```
**Solution:** Set `OPENAI_API_KEY` trong `.env` file

**Issue 2: API calls fail**
```
Error: Invalid API key
```
**Solution:** 
- Check API key có đúng không
- Check API key có credits/quota không
- Check API key có bị revoke không

**Issue 3: CORS errors**
```
Error: CORS policy blocked
```
**Solution:** 
- Check `ALLOWED_ORIGINS` có match với frontend URL không
- Include protocol (`http://` hoặc `https://`)

**Issue 4: Port already in use**
```
Error: Address already in use
```
**Solution:** 
- Change `API_PORT` trong `.env`
- Hoặc stop service đang dùng port đó

### 8.2. Debug Mode

**Enable debug logging:**
```bash
LOG_LEVEL=DEBUG
```

**Check environment variables:**
```python
# In Python
import os
print(os.getenv("OPENAI_API_KEY"))  # Should not print in production!
print(os.getenv("OPENAI_MODEL"))
```

## 9. Security Best Practices

### 9.1. API Key Security

1. **Never Commit:**
   - ✅ `.env` trong `.gitignore`
   - ✅ Check `.gitignore` có `.env`
   - ❌ Never commit `.env` file

2. **Access Control:**
   - Limit who can access `.env` file
   - Use file permissions: `chmod 600 .env`
   - Don't share keys via email/chat

3. **Rotation:**
   - Rotate keys regularly
   - Revoke old keys
   - Monitor usage

### 9.2. Production Security

1. **Secrets Management:**
   - Use dedicated secrets management
   - Encrypt at rest
   - Encrypt in transit

2. **Network Security:**
   - Use HTTPS trong production
   - Restrict CORS origins
   - Use firewall rules

3. **Monitoring:**
   - Monitor API usage
   - Set up alerts cho unusual activity
   - Log access (không log keys!)

## 10. Environment Variables Summary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key |
| `OPENAI_MODEL` | ❌ No | `gpt-4-turbo-preview` | Model to use |
| `API_PORT` | ❌ No | `5000` | Service port |
| `API_HOST` | ❌ No | `0.0.0.0` | Host address |
| `LOG_LEVEL` | ❌ No | `INFO` | Logging level |
| `ALLOWED_ORIGINS` | ❌ No | `http://localhost:4000,http://localhost:3333` | CORS origins |

## 11. Quick Start Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Get OpenAI API key từ https://platform.openai.com/
- [ ] Set `OPENAI_API_KEY` trong `.env`
- [ ] (Optional) Adjust other variables
- [ ] Test service: `uvicorn app.main:app --reload`
- [ ] Check health: `curl http://localhost:5000/api/v1/health`
- [ ] Verify API key: Check logs for errors

## 12. Example Configurations

### 12.1. Minimal Configuration

```bash
# .env (minimum required)
OPENAI_API_KEY=sk-proj-abc123...
```

### 12.2. Full Configuration

```bash
# .env (all options)
OPENAI_API_KEY=sk-proj-abc123...
OPENAI_MODEL=gpt-4-turbo-preview
API_PORT=5000
API_HOST=0.0.0.0
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3333
```

### 12.3. Production Configuration

```bash
# .env.production
OPENAI_API_KEY=sk-proj-production-key...
OPENAI_MODEL=gpt-4-turbo-preview
API_PORT=5000
API_HOST=0.0.0.0
LOG_LEVEL=WARNING
ALLOWED_ORIGINS=https://gbridge.com,https://www.gbridge.com
```

## Kết Luận

Environment variables là cách an toàn và linh hoạt để cấu hình AI Matching Service:

1. **Required:** `OPENAI_API_KEY` (must have)
2. **Optional:** Tất cả variables khác có defaults
3. **Security:** Never commit `.env` file
4. **Flexibility:** Dễ dàng change config cho different environments

Luôn validate và test configuration trước khi deploy production!

