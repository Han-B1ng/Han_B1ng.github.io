# hanb1ng.com 部署与维护

## 部署方案

复用 GitHub Actions → GitHub Pages，主域名为 https://hanb1ng.com/，www.hanb1ng.com 跳转到主域名。无需新增服务器。此文档是实施步骤，不是上线验收证明。

## 上线顺序

1. 保存 GitHub Pages 原配置及 Cloudflare 现有网站 DNS，保留所有邮件记录。
2. 在仓库 Settings → Pages 设置 Custom domain 为 hanb1ng.com。
3. 合并本次配置变更，等待 Deploy Dk Connect 成功。
4. 在 Cloudflare 为 @ 添加 GitHub Pages 的四条 A 记录：185.199.108.153、185.199.109.153、185.199.110.153、185.199.111.153；www 添加 CNAME 指向 han-b1ng.github.io。初期均使用 DNS only。若已有 @ 或 www 的冲突网站记录，先保存后按实际情况调整，不能盲目叠加。
5. 等待 GitHub DNS 检查和证书签发，开启 Enforce HTTPS。不得通过跳过证书校验来验收。
6. 实测根域名和 www 的 HTTP/HTTPS、最终跳转地址、JS/CSS、头像、二维码、分享链接；用浏览器检查桌面与移动视口，记录证据到 HAN-121。

仓库通过 Actions 发布，无需依赖 CNAME 文件来设置自定义域名；以 Pages 后台设置为准。

## 维护与回滚

- 日常更新推送 main 后查看 Actions 构建发布结果，并检查线上页面和分享二维码。
- GitHub Pages 管理证书；持续保留正确 DNS，关注签发异常及域名续费。
- MX、SPF、DKIM、DMARC 不属于此次变更范围。
- 回滚域名切换时，移除 Pages 自定义域名，恢复原网站 DNS，并撤销本次配置提交，使构建路径回到 /Han_B1ng.github.io/、分享地址回到原 GitHub Pages 地址。重新部署后验证旧站再确认回滚完成。
- 避免添加通配符解析；www CNAME 不能包含协议、路径或仓库名。

## 参考

https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
