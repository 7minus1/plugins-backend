# 用户认证 API 文档

## 发送验证码

### 请求信息
- 接口路径：`/users/send-verification-code`
- 请求方法：`POST`
- 接口描述：向指定手机号发送验证码

### 请求参数
```json
{
  "phoneNumber": "string" // 手机号码
}
```

### 响应结果
```json
{
  "message": "验证码发送成功"
}
```

### 错误码
- 400: 发送失败
- 500: 服务器内部错误

## 验证码登录/注册

### 请求信息
- 接口路径：`/users/verify-code`
- 请求方法：`POST`
- 接口描述：验证手机验证码并完成登录或注册

### 请求参数
```json
{
  "phoneNumber": "string", // 手机号码
  "code": "string"        // 验证码
}
```

### 备注说明
> **特殊情况处理**：如果系统无法发送短信或者用户未收到验证码，可以使用备用验证码 `123456` 进行登录/注册，此功能仅适用于验证码发送失败的情况。

### 响应结果
```json
{
  "access_token": "string",  // JWT token
  "user": {
    "id": "number",
    "username": "string",
    "phoneNumber": "string",
    "isActive": "boolean",
    "isVip": "boolean",
    "vipExpireDate": "string",
    "uploadCount": "number",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### 错误码
- 400: 验证码错误或已过期
- 500: 服务器内部错误

## 获取用户信息

### 请求信息
- 接口路径：`/users/profile`
- 请求方法：`GET`
- 接口描述：获取当前登录用户的信息
- 需要认证：是（需要在请求头中携带 Bearer Token）

### 请求头
```
Authorization: Bearer <access_token>
```

### 响应结果
```json
{
  "id": "number",
  "username": "string",
  "phoneNumber": "string",
  "isActive": "boolean",
  "isVip": "boolean",
  "vipExpireDate": "string",
  "uploadCount": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### 错误码
- 401: 未认证或 token 已过期
- 500: 服务器内部错误

## 获取 VIP 状态

### 请求信息
- 接口路径：`/users/vip-status`
- 请求方法：`GET`
- 接口描述：获取当前用户的 VIP 状态和到期时间
- 需要认证：是（需要在请求头中携带 Bearer Token）

### 请求头
```
Authorization: Bearer <access_token>
```

### 响应结果
```json
{
  "isVip": "boolean",
  "vipExpireDate": "string"  // ISO 格式的日期时间字符串，非 VIP 用户为 null
}
```

### 错误码
- 401: 未认证或 token 已过期
- 500: 服务器内部错误

## 获取上传次数

### 请求信息
- 接口路径：`/users/upload-count`
- 请求方法：`GET`
- 接口描述：获取当前用户的上传次数信息
- 需要认证：是（需要在请求头中携带 Bearer Token）

### 请求头
```
Authorization: Bearer <access_token>
```

### 响应结果
```json
{
  "uploadCount": "number",      // 已使用上传次数
  "remainingCount": "number",   // 剩余上传次数（VIP 用户无限制）
  "isUnlimited": "boolean"      // 是否有无限制上传权限（VIP 用户）
}
```

### 错误码
- 401: 未认证或 token 已过期
- 500: 服务器内部错误 