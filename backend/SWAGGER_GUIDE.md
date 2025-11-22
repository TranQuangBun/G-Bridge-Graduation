# Swagger Documentation Guide

## Cách hoạt động

Hệ thống **TỰ ĐỘNG** scan tất cả routes và generate Swagger docs. Bạn **KHÔNG CẦN** làm gì khi thêm endpoint mới.

## Khi thêm endpoint mới

### 1. Chỉ cần docs cơ bản (Mặc định - 90% trường hợp)

**KHÔNG CẦN LÀM GÌ!** 

Chỉ cần:
```javascript
// src/routes/MyNewRoutes.js
router.get("/", getAllItems);
router.post("/", authRequired, createItem);
router.get("/:id", getItemById);
router.put("/:id", authRequired, updateItem);
router.delete("/:id", authRequired, deleteItem);
```

→ Swagger docs sẽ **TỰ ĐỘNG** có:
- Summary, description cơ bản
- Tags (tự động detect từ path)
- Security (tự động detect public/private)
- Path parameters
- Error responses (400, 401, 404, 500)
- Request body cho POST/PUT

### 2. Cần docs chi tiết (10% trường hợp - chỉ cho endpoints quan trọng)

Chỉ khi cần:
- Request body schemas chi tiết
- Response examples
- Query parameters cụ thể
- Custom descriptions

→ Mới cần thêm vào `src/swagger/Overrides.js`:

```javascript
export const swaggerOverrides = {
  "/api/my-new-endpoint": {
    post: createSwaggerRoute({
      method: "post",
      summary: "Create item with detailed schema",
      tags: ["MyTag"],
      security: true,
      body: sw.body({
        name: { type: "string", example: "Item name" },
        price: { type: "number", example: 100 },
      }, ["name", "price"]),
      responses: {
        201: {
          description: "Item created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Success" },
              example: { success: true, data: { id: 1 } },
            },
          },
        },
      },
    }),
  },
};
```

## Ví dụ

### Thêm endpoint mới - KHÔNG CẦN CONFIG

```javascript
// src/routes/ProductRoutes.js
router.get("/", getAllProducts);  // ✅ Tự động có docs
router.post("/", authRequired, createProduct);  // ✅ Tự động có docs
```

### Thêm endpoint quan trọng - CẦN CONFIG (tùy chọn)

```javascript
// src/swagger/Overrides.js
"/api/products": {
  post: createSwaggerRoute({
    method: "post",
    summary: "Create product",
    tags: ["Products"],
    security: true,
    body: sw.bodyRef("ProductCreate"),  // Reference schema
  }),
}
```

## Tóm tắt

| Tình huống | Cần làm gì? |
|------------|-------------|
| Thêm endpoint mới với docs cơ bản | **KHÔNG CẦN LÀM GÌ** - Tự động |
| Thêm endpoint quan trọng cần chi tiết | Thêm vào `Overrides.js` (tùy chọn) |
| Thêm schema mới | Thêm vào `Swagger.js` → `components.schemas` |

## Lưu ý

- 90% endpoints chỉ cần docs tự động
- Chỉ override các endpoints quan trọng (auth, payment, main features)
- Tất cả routes đều có docs, dù có override hay không

