# Ayu-websites 发布规则

## 线上发布源

- 线上地址：`https://ayuisle.site/ayu-site/`
- GitHub Pages 发布分支：`gh-pages`
- 网站实际目录：`Ayu-websites-pages-live/ayu-site/`
- `Ayu-websites-pages-src/` 的 `main` 仅作为参考和开发源，不直接作为线上发布源。

所有会影响线上网站的改动，最终都必须同步到 `gh-pages` 的 `ayu-site/`，并推送到远端。

## 固定发布流程

```powershell
cd "C:\Users\Yoselin\Documents\Ayu-websites\Ayu-websites-pages-live"
git switch gh-pages
git status
python -m http.server 8000
```

本地确认后，在另一个终端执行：

```powershell
cd "C:\Users\Yoselin\Documents\Ayu-websites\Ayu-websites-pages-live"
git add -- ayu-site/index.html ayu-site/site-data.json
git commit -m "描述本次网站更新"
git push origin gh-pages
git rev-parse --short HEAD
```

如有其他修改文件，只把本次确认过的文件加入 `git add`，不要使用 `git add .`。

## 发布后检查

1. 等待 GitHub Pages 完成部署。
2. 使用新的查询参数绕过缓存，例如：`https://ayuisle.site/ayu-site/?v=最新提交号#competitions`。
3. 确认页面标题、数据卡片和入口链接已更新。
4. 若页面仍显示旧内容，先强制刷新，再核对远端提交：

```powershell
git ls-remote origin refs/heads/gh-pages
```

## 分支同步原则

- 不要把 `main` 当作线上发布分支直接推送。
- 从 `main` 参考或复制功能时，必须检查路径是否适配 `gh-pages/ayu-site/`。
- 发布前保留其他未提交用户修改，不覆盖、不回滚。
