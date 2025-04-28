# 简历上传 API 文档

## 接口信息

- **接口路径**: `/resume/upload`
- **请求方式**: POST
- **接口描述**: 上传简历文件并记录投递信息
- **需要认证**: 是 (需要在请求头中携带 JWT Token)

## 请求参数

### 请求头
```
Content-Type: multipart/form-data
Authorization: Bearer <your_jwt_token>
```

### 表单参数

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|---------|
| file | File | 是 | 简历文件 | - |
| deliveryChannel | string | 是 | 投递渠道 | "BOSS直聘" |
| deliveryPosition | string | 是 | 投递岗位 | "前端开发工程师" |

### 文件要求
- 支持格式：PDF、Word文档(doc/docx)、图片(png/jpg/jpeg)
- 文件大小限制：5MB

## 响应结果

### 成功响应
```json
{
  "message": "简历上传成功",
  "data": {
    "recordId": "recxxxxxxxxxxxx",
    "fileName": "简历.pdf",
    "deliveryChannel": "BOSS直聘",
    "deliveryPosition": "前端开发工程师"
  },
  "remainingUploads": "无限" // 或剩余次数，如 "3"
}
```

### 错误响应

#### 1. 未认证
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 2. 文件格式错误
```json
{
  "statusCode": 400,
  "message": "支持格式：PDF/Word/图片"
}
```

#### 3. 超出上传限制
```json
{
  "statusCode": 403,
  "message": "非会员用户上传次数已达上限，请升级为会员继续使用"
}
```

#### 4. 未配置多维表格
```json
{
  "statusCode": 400,
  "message": "请先配置多维表格信息"
}
```

## 调用示例

### 使用 curl
```bash
curl -X POST \
  http://your-api-domain/resume/upload \
  -H 'Authorization: Bearer your_jwt_token' \
  -F 'file=@/path/to/your/resume.pdf' \
  -F 'deliveryChannel=BOSS直聘' \
  -F 'deliveryPosition=前端开发工程师'
```

### 使用 JavaScript/TypeScript
```typescript
const formData = new FormData();
formData.append('file', file); // file 是 File 对象
formData.append('deliveryChannel', 'BOSS直聘');
formData.append('deliveryPosition', '前端开发工程师');

const response = await fetch('http://your-api-domain/resume/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token'
  },
  body: formData
});

const result = await response.json();
```

## 注意事项

1. 上传前请确保已配置好飞书多维表格信息
2. 非会员用户每月有 5 次免费上传机会
3. 文件大小不能超过 5MB
4. 请确保文件格式符合要求
5. 投递渠道和岗位信息为必填项 