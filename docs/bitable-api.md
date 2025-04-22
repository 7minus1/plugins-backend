# 多维表格信息接口文档

## 目录
- [更新多维表格信息](#更新多维表格信息)
- [获取多维表格信息](#获取多维表格信息)

## 更新多维表格信息

### 接口说明
更新当前登录用户的多维表格链接和授权码信息

### 请求信息
- **接口地址**：`/users/bitable`
- **请求方式**：PUT
- **需要认证**：是（需要 JWT Token）

### 请求头
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### 请求参数
```typescript
{
  bitableUrl: string;  // 多维表格链接，必须是有效的URL格式
  bitableToken: string;  // 多维表格授权码
}
```

### 请求示例
```javascript
// 使用 fetch
fetch('/users/bitable', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bitableUrl: 'https://your-bitable-url',
    bitableToken: 'your-bitable-token'
  })
});

// 使用 axios
axios.put('/users/bitable', {
  bitableUrl: 'https://your-bitable-url',
  bitableToken: 'your-bitable-token'
}, {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
```

### 响应结果
```typescript
{
  id: number;          // 记录ID
  userId: number;      // 用户ID
  bitableUrl: string;  // 多维表格链接
  bitableToken: string;  // 多维表格授权码
  createdAt: string;   // 创建时间
  updatedAt: string;   // 更新时间
}
```

### 错误响应
| 状态码 | 说明 |
|--------|------|
| 401 | 未登录或token无效 |
| 400 | 请求参数格式错误 |
| 404 | 用户不存在 |

## 获取多维表格信息

### 接口说明
获取当前登录用户的多维表格链接和授权码信息

### 请求信息
- **接口地址**：`/users/bitable`
- **请求方式**：GET
- **需要认证**：是（需要 JWT Token）

### 请求头
```http
Authorization: Bearer <jwt_token>
```

### 请求示例
```javascript
// 使用 fetch
fetch('/users/bitable', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});

// 使用 axios
axios.get('/users/bitable', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
```

### 响应结果
```typescript
{
  id: number;          // 记录ID
  userId: number;      // 用户ID
  bitableUrl: string;  // 多维表格链接
  bitableToken: string;  // 多维表格授权码
  createdAt: string;   // 创建时间
  updatedAt: string;   // 更新时间
}
```

### 特殊说明
- 如果用户尚未设置多维表格信息，将返回 `null`
- 所有时间字段均为 ISO 格式的字符串

### 错误响应
| 状态码 | 说明 |
|--------|------|
| 401 | 未登录或token无效 |
| 404 | 用户不存在 |

## 注意事项
1. 所有请求都需要在请求头中携带有效的 JWT token
2. `bitableUrl` 必须是有效的 URL 格式
3. 每个用户只能有一个多维表格配置，更新操作会覆盖现有配置
4. 建议在前端对 `bitableUrl` 进行 URL 格式验证
5. 建议对敏感信息（如 `bitableToken`）进行适当的加密处理