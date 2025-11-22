# Docker Setup với Scribe API Documentation

## Tự động Generate API Docs trong Docker

Hệ thống đã được tích hợp để tự động generate API documentation khi build và chạy Docker container.

## Production Build

Khi build production image, docs sẽ được tự động generate:

```bash
docker build -t gbridge-backend:production --target production .
```

Docs sẽ được generate trong quá trình build và có sẵn khi container start.

## Development Build

Khi chạy development container, docs sẽ được tự động generate khi container start (nếu chưa có):

```bash
docker build -t gbridge-backend:dev --target development .
docker run -p 4000:4000 gbridge-backend:dev
```

## Truy cập API Documentation

Sau khi container chạy, truy cập:
- **API Docs**: http://localhost:4000/docs
- **Health Check**: http://localhost:4000/

## Environment Variables

Có thể set `API_URL` để docs sử dụng đúng base URL:

```bash
docker run -p 4000:4000 -e API_URL=http://your-domain.com gbridge-backend:production
```

## Manual Regeneration

Nếu cần regenerate docs trong running container:

```bash
docker exec <container-id> npm run docs:generate
```

## Notes

- Docs được generate trong build time cho production (nhanh hơn)
- Docs được generate trong runtime cho development (luôn cập nhật)
- Docs được serve tại `/docs` endpoint
- Scribe packages được cài đặt trong cả production và development builds

