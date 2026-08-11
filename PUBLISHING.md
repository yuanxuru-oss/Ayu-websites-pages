# Ayu-websites 网站发布手册

本项目采用单一线上发布路径：编辑 `Ayu-websites-pages-live/ayu-site/`，提交并推送 `gh-pages`。

`Ayu-websites-pages-src/` 对应 `main`，用于参考和开发。它不是当前 GitHub Pages 的发布源；即使 `main` 推送成功，也不会自动更新 `https://ayuisle.site/ayu-site/`。

## 日常操作

```powershell
cd "C:\Users\Yoselin\Documents\Ayu-websites\Ayu-websites-pages-live"
git switch gh-pages
git status
```

完成修改和本地预览后：

```powershell
git add -- ayu-site/需要发布的文件
git commit -m "更新网站内容"
git push origin gh-pages
git rev-parse --short HEAD
```

发布后打开：

```text
https://ayuisle.site/ayu-site/?v=提交号
```

不要使用 `git add .`，避免把其他未提交文件一起发布。
