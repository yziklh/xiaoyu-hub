# 代码签名配置指南

本文档说明如何为 Tauri Vue Template 配置代码签名，以便在 GitHub Actions 中自动签名发布的应用程序。

## 目录

- [macOS 代码签名](#macos-代码签名)
- [Windows 代码签名](#windows-代码签名)
- [配置 GitHub Secrets](#配置-github-secrets)

---

## macOS 代码签名

### 前提条件

1. **Apple Developer 账号**：需要付费的 Apple Developer Program 会员资格
2. **开发者证书**：在 Apple Developer 网站创建证书

### 步骤

#### 1. 创建证书

1. 登录 [Apple Developer](https://developer.apple.com/account)
2. 进入 **Certificates, Identifiers & Profiles**
3. 创建新证书：
   - 选择 **Developer ID Application**（用于分发到 Mac App Store 之外）
   - 或选择 **Mac App Distribution**（用于 Mac App Store）
4. 下载证书并导入到钥匙串

#### 2. 导出证书为 .p12 文件

1. 打开 **钥匙串访问**（Keychain Access）
2. 找到您的开发者证书
3. 右键点击证书 → **导出**
4. 选择 **.p12** 格式
5. 设置密码（记住此密码，稍后需要）

#### 3. 转换为 Base64

```bash
base64 -i certificate.p12 -o certificate-base64.txt
```

#### 4. 获取 App-Specific Password

1. 登录 [appleid.apple.com](https://appleid.apple.com)
2. 进入 **安全** → **App-Specific Passwords**
3. 生成新密码（用于 notarization）

### 需要的 GitHub Secrets

| Secret 名称 | 说明 | 如何获取 |
|------------|------|---------|
| `APPLE_CERTIFICATE` | Base64 编码的 .p12 证书 | 步骤 3 生成的内容 |
| `APPLE_CERTIFICATE_PASSWORD` | .p12 证书密码 | 步骤 2 设置的密码 |
| `APPLE_SIGNING_IDENTITY` | 证书名称 | 例如：`Developer ID Application: Your Name (TEAM_ID)` |
| `APPLE_ID` | Apple ID 邮箱 | 您的 Apple Developer 账号邮箱 |
| `APPLE_PASSWORD` | App-Specific Password | 步骤 4 生成的密码 |
| `APPLE_TEAM_ID` | Team ID | 在 Apple Developer 网站的 Membership 页面查看 |

---

## Windows 代码签名

### 前提条件

1. **代码签名证书**：从受信任的证书颁发机构（CA）购买
   - 推荐：DigiCert, Sectigo, GlobalSign
2. **证书文件**：.pfx 或 .p12 格式

### 步骤

#### 1. 获取代码签名证书

从证书颁发机构购买 Windows 代码签名证书。

#### 2. 使用 Tauri 的签名方式

Tauri 使用自己的签名机制，需要生成密钥对：

```bash
# 安装 Tauri CLI（如果还没有）
npm install -g @tauri-apps/cli

# 生成签名密钥对
tauri signer generate -w ~/.tauri/myapp.key
```

这将生成：
- 私钥文件（需要保密）
- 公钥（可以公开）

#### 3. 转换私钥为 Base64（可选）

如果需要在 CI/CD 中使用：

```bash
base64 -i ~/.tauri/myapp.key -o signing-key-base64.txt
```

### 需要的 GitHub Secrets

| Secret 名称 | 说明 | 如何获取 |
|------------|------|---------|
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri 签名私钥 | 步骤 2 生成的私钥内容 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 私钥密码（如果设置了） | 生成密钥时设置的密码 |

**注意**：Tauri 的签名主要用于更新验证，不是 Windows 的 Authenticode 签名。如果需要 Authenticode 签名，需要额外配置。

---

## 配置 GitHub Secrets

### 添加 Secrets 到 GitHub 仓库

1. 进入 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加上述所需的 secrets

### 验证配置

配置完成后，推送一个 tag 触发发布工作流：

```bash
git tag v1.0.0
git push origin v1.0.0
```

检查 GitHub Actions 的运行日志，确保签名步骤成功。

---

## 常见问题

### macOS 签名失败

**问题**：`errSecInternalComponent` 错误

**解决方案**：
- 确保证书已正确导入到钥匙串
- 检查证书是否过期
- 验证 Team ID 是否正确

### Windows 签名失败

**问题**：找不到签名密钥

**解决方案**：
- 确保私钥格式正确
- 检查密钥密码是否正确
- 验证 Base64 编码是否完整

### Notarization 失败

**问题**：Apple notarization 超时或失败

**解决方案**：
- 检查 App-Specific Password 是否正确
- 确保 Apple ID 有效
- 查看 Apple 的 notarization 日志获取详细错误

---

## 参考资源

- [Tauri 代码签名文档](https://tauri.app/v1/guides/distribution/sign-macos)
- [Apple 代码签名指南](https://developer.apple.com/support/code-signing/)
- [Windows 代码签名最佳实践](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)

---

## 安全提示

⚠️ **重要**：
- 永远不要将证书、私钥或密码提交到 Git 仓库
- 使用 GitHub Secrets 安全存储敏感信息
- 定期轮换 App-Specific Passwords
- 限制对 GitHub Secrets 的访问权限

