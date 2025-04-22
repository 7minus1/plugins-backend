# 用户管理 API 文档

## 目录
- [用户注册](#用户注册)
- [用户登录](#用户登录)
- [获取用户信息](#获取用户信息)
- [VIP状态](#vip状态)
- [上传次数](#上传次数)
- [飞书多维表格配置](#飞书多维表格配置)
- [短信验证码](#短信验证码)

## 用户注册

### 请求信息
- **接口**: `POST /users/register`
- **描述**: 使用手机号和密码注册新用户
- **请求体**:
  ```json
  {
    "phoneNumber": "13800138000",
    "password": "123456",
    "username": "testuser"  // 可选，不提供则自动生成
  }
  ```

### 响应信息
- **成功响应** (201):
  ```json
  {
    "id": 1,
    "username": "testuser",
    "phoneNumber": "13800138000",
    "isActive": true,
    "uploadCount": 5,  // 新用户默认有5次上传机会
    "createdAt": "2024-04-21T10:00:00.000Z",
    "updatedAt": "2024-04-21T10:00:00.000Z"
  }
  ```
- **错误响应** (409):
  ```json
  {
    "statusCode": 409,
    "message": "手机号已被注册或用户名已存在"
  }
  ```

## 用户登录

### 请求信息
- **接口**: `POST /users/login`
- **描述**: 使用手机号和密码登录
- **请求体**:
  ```json
  {
    "phoneNumber": "13800138000",
    "password": "123456"
  }
  ```

### 响应信息
- **成功响应** (200):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "phoneNumber": "13800138000",
      "username": "testuser"
    }
  }
  ```
- **错误响应** (401):
  ```json
  {
    "statusCode": 401,
    "message": "手机号或密码错误"
  }
  ```

## 获取用户信息

### 请求信息
- **接口**: `GET /users/profile`
- **描述**: 获取当前登录用户的详细信息
- **认证**: 需要 Bearer Token
- **请求头**:
  ```
  Authorization: Bearer <access_token>
  ```

### 响应信息
- **成功响应** (200):
  ```json
  {
    "id": 1,
    "username": "testuser",
    "phoneNumber": "13800138000",
    "isActive": true,
    "createdAt": "2024-04-21T10:00:00.000Z",
    "updatedAt": "2024-04-21T10:00:00.000Z"
  }
  ```
- **错误响应** (401):
  ```json
  {
    "statusCode": 401,
    "message": "未授权"
  }
  ```

## VIP状态

### 请求信息
- **接口**: `GET /users/vip-status`
- **描述**: 获取当前用户的VIP状态和到期时间
- **认证**: 需要 Bearer Token
- **请求头**:
  ```
  Authorization: Bearer <access_token>
  ```

### 响应信息
- **成功响应** (200):
  ```json
  {
    "isVip": true,
    "vipExpireDate": "2024-05-21T10:00:00.000Z"
  }
  ```
- **非VIP用户响应** (200):
  ```json
  {
    "isVip": false,
    "vipExpireDate": null
  }
  ```

## 上传次数

### 请求信息
- **接口**: `GET /users/upload-count`
- **描述**: 获取当前用户的上传次数信息
- **认证**: 需要 Bearer Token
- **请求头**:
  ```
  Authorization: Bearer <access_token>
  ```

### 响应信息
- **成功响应** (200):
  ```json
  {
    "uploadCount": 0,      // 已使用上传次数（新用户默认为0次）
    "remainingCount": 5,   // 剩余上传次数（免费用户总共5次机会，可通过环境变量 FREE_UPLOAD_LIMIT 配置）
    "isUnlimited": false   // 是否有无限制上传权限（VIP用户）
  }
  ```
- **VIP用户响应** (200):
  ```json
  {
    "uploadCount": 0,
    "remainingCount": -1,  // -1表示无限制
    "isUnlimited": true
  }
  ```

### 说明
- 新用户注册时默认已使用0次上传机会（`DEFAULT_UPLOAD_COUNT`）
- 免费用户总上传次数限制可通过环境变量 `FREE_UPLOAD_LIMIT` 配置（默认为5次）
- VIP用户拥有无限制上传权限
- 每次上传文件时，`uploadCount` 会增加1
- 当 `uploadCount` 达到配置的上传限制时，免费用户将无法继续上传

## 飞书多维表格配置

### 获取配置

#### 请求信息
- **接口**: `GET /users/bitable`
- **描述**: 获取用户的飞书多维表格相关配置
- **认证**: 需要 Bearer Token
- **请求头**:
  ```
  Authorization: Bearer <access_token>
  ```

#### 响应信息
- **成功响应** (200):
  ```json
  {
    "appToken": "your-app-token",
    "tableId": "your-table-id"
  }
  ```

### 更新配置

#### 请求信息
- **接口**: `PUT /users/bitable`
- **描述**: 更新用户的飞书多维表格相关配置
- **认证**: 需要 Bearer Token
- **请求头**:
  ```
  Authorization: Bearer <access_token>
  ```
- **请求体**:
  ```json
  {
    "appToken": "your-app-token",
    "tableId": "your-table-id"
  }
  ```

#### 响应信息
- **成功响应** (200):
  ```json
  {
    "appToken": "your-app-token",
    "tableId": "your-table-id"
  }
  ```

## 短信验证码

### 发送验证码

#### 请求信息
- **接口**: `POST /users/send-verification-code`
- **描述**: 发送短信验证码
- **请求体**:
  ```json
  {
    "phoneNumber": "13800138000"
  }
  ```

#### 响应信息
- **成功响应** (200):
  ```json
  {
    "message": "验证码发送成功"
  }
  ```
- **错误响应** (400):
  ```json
  {
    "statusCode": 400,
    "message": "验证码发送失败"
  }
  ```

### 验证码登录

#### 请求信息
- **接口**: `POST /users/verify-code`
- **描述**: 使用验证码登录
- **请求体**:
  ```json
  {
    "phoneNumber": "13800138000",
    "code": "123456"
  }
  ```

#### 响应信息
- **成功响应** (200):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "phoneNumber": "13800138000",
      "username": "testuser"
    }
  }
  ```
- **错误响应** (400):
  ```json
  {
    "statusCode": 400,
    "message": "验证码错误或已过期"
  }
  ```

## 测试短信发送

### 请求信息
- **接口**: `POST /users/test-sms`
- **描述**: 测试短信发送功能（仅用于开发测试）
- **请求体**:
  ```json
  {
    "phoneNumber": "13800138000"
  }
  ```

### 响应信息
- **成功响应** (200):
  ```json
  {
    "message": "短信发送成功",
    "phoneNumber": "13800138000",
    "code": "123456"  // 仅测试环境返回验证码
  }
  ```
- **错误响应** (400):
  ```json
  {
    "statusCode": 400,
    "message": "短信发送失败，请检查配置"
  }
  ``` 