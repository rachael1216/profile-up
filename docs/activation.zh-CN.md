# 需要项目所有者完成的开通工作

本文件用于把公开 demo 的邮箱和手机号注册真正开通。目前注册页和服务端验证码流程已实现，发送服务尚未配置。界面会显示“暂未开通”，不会生成可用于登录的模拟验证码。网页和简历编辑、模板预览与文件导出可免注册试用；已按用户要求移除 ChatGPT 登录。邮箱和短信发送服务开通前，无法创建或登录独立云端账号；免注册制作与导出功能正常。

## 1. 认证服务连接状态

2026-10-18 已完成 Supabase 插件授权，并在 R.M.L 组织下创建 [Profile Up 项目](https://supabase.com/dashboard/project/mtmwjiaqxbyjowpwmonp)，地区为新加坡。创建时查询的项目报价为 0 美元/月；邮件、短信及超出套餐的使用费用不包含在该报价中。

项目地址和 publishable key 已保存到 Sites 云端运行配置，未写入源码。无需提供 `service_role` 管理密钥。邮箱与短信通道暂时关闭，待发送服务配置和真实收码验收完成后分别启用。不要在聊天或 GitHub 中粘贴密钥。

## 2. 开通邮件发送

准备可以向任意用户发信的 SMTP 服务，按供应商要求验证发件地址或域名。在 [Supabase 邮件发送设置](https://supabase.com/dashboard/project/mtmwjiaqxbyjowpwmonp/auth/smtp)中配置以下字段；验证码正文在 [邮件模板](https://supabase.com/dashboard/project/mtmwjiaqxbyjowpwmonp/auth/templates)中设置：

| 字段 | 内容 |
|---|---|
| 发件人名称 | Profile Up |
| 发件地址 | 经供应商验证的地址 |
| SMTP host / port | 服务商提供的服务器与端口 |
| SMTP user / password | 保存到服务后台的发送凭据 |
| 登录邮件模板 | 包含 `{{ .Token }}` 的六位验证码邮件 |
| 验证码有效期 | 10 分钟 |

Supabase 默认邮件服务仅用于受限测试，不能向所有公众用户开放。公开 demo 同样需要自己的 SMTP 发送服务。发件域名验证需使用你有 DNS 管理权限的域名，不能修改 `chatgpt.site` 的 DNS。详见 [Supabase 官方 SMTP 说明](https://supabase.com/docs/guides/auth/auth-smtp)。

## 3. 开通短信发送

手机号以中国大陆 `+86` 为主，同时支持国际号码输入。短信是否能送达某个地区，取决于发送服务账号开通的地区和发送能力。

准备支持目标地区的短信服务，在 [Supabase 认证方式设置](https://supabase.com/dashboard/project/mtmwjiaqxbyjowpwmonp/auth/providers)的 Phone 中配置供应商凭据与验证码模板。若采用 Supabase 直接支持的供应商，按其后台字段填写；若使用国内供应商且未获原生支持，需要额外配置 [Send SMS hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook)。开通短信账号、付款、发件人或模板审核需由你本人完成。仅可向指定测试号码发送的试用账号不能作为“所有人可注册”的验收依据。

为 demo 设置发送预算：应用默认每天最多接受 25 次短信请求，单个号码每分钟一次、每小时六次；供应商余额和限额也会生效。

## 4. 启用与验收

项目地址与 publishable key 已配置。发送服务准备好后，确认验证码为六位数字，并将邮箱验证码有效期设为 10 分钟，再分别启用 Sites 中的 `AUTH_EMAIL_ENABLED` 和 `AUTH_SMS_ENABLED` 并部署。SMTP 密码、短信密钥保存在认证服务后台，不进入仓库。当前 Supabase 插件不提供 Auth 设置修改接口，这些后台字段需要项目所有者填写，或在已登录的浏览器中协助操作。

需要你提供或亲自操作的测试收件方：一个邮箱、一个大陆手机号、一个国际手机号。分别验证收码、首次注册、再次登录、验证码过期、退出后不能继续访问私有资料。完成真实收码后，才将注册功能标记为已开通。

开发实现、限流和会话细节见 [authentication.md](authentication.md)。
