document.addEventListener('DOMContentLoaded', () => {
  // 搜索功能 - 基于 search.xml
  const initSearch = () => {
    const searchButtons = document.querySelectorAll('.custom-search-btn')
    const searchModal = document.getElementById('search-modal')
    const searchClose = document.getElementById('search-close')
    const searchInput = document.getElementById('search-input')
    const searchResults = document.getElementById('search-results')

    if (!searchButtons.length || !searchModal) return

    let postsData = []
    let dataLoaded = false

    // 从 search.xml 获取全部文章数据
    const fetchPostsData = async () => {
      if (dataLoaded) return
      try {
        const response = await fetch('/search.xml')
        const text = await response.text()
        const parser = new DOMParser()
        const xml = parser.parseFromString(text, 'text/xml')
        const entries = xml.querySelectorAll('entry')
        postsData = Array.from(entries).map(entry => {
          const contentRaw = entry.querySelector('content')?.textContent || ''
          // 去除 HTML 标签，只保留纯文本
          const tmp = document.createElement('div')
          tmp.innerHTML = contentRaw
          const contentText = tmp.textContent || tmp.innerText || ''
          return {
            title: entry.querySelector('title')?.textContent || '',
            url: entry.querySelector('url')?.textContent?.trim() || '',
            content: contentText
          }
        })
        dataLoaded = true
      } catch (e) {
        console.warn('搜索数据加载失败:', e)
      }
    }

    const openSearch = () => {
      searchModal.classList.add('active')
      document.body.style.overflow = 'hidden'
      setTimeout(() => searchInput.focus(), 100)
    }

    const closeSearch = () => {
      searchModal.classList.remove('active')
      document.body.style.overflow = ''
      searchInput.value = ''
      searchResults.innerHTML = ''
    }

    // 转义正则特殊字符
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const performSearch = (keyword) => {
      if (!keyword.trim()) {
        searchResults.innerHTML = ''
        return
      }

      const lowerKeyword = keyword.toLowerCase()
      const escapedKeyword = escapeRegExp(keyword)

      const results = postsData.filter(post =>
        post.title.toLowerCase().includes(lowerKeyword) ||
        post.content.toLowerCase().includes(lowerKeyword)
      )

      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results"><p>未找到相关文章</p></div>'
        return
      }

      const highlightKeyword = (text, kw) => {
        const regex = new RegExp(`(${escapedKeyword})`, 'gi')
        return text.replace(regex, '<mark>$1</mark>')
      }

      const resultsHTML = results.map(post => {
        // 提取关键词附近的上下文片段
        let contentPreview = ''
        const idx = post.content.toLowerCase().indexOf(lowerKeyword)
        if (idx !== -1) {
          const start = Math.max(0, idx - 40)
          const end = Math.min(post.content.length, idx + keyword.length + 80)
          contentPreview = (start > 0 ? '...' : '') + post.content.substring(start, end) + (end < post.content.length ? '...' : '')
        } else {
          contentPreview = post.content.substring(0, 120) + (post.content.length > 120 ? '...' : '')
        }

        return `
          <div class="search-result-item" onclick="window.location.href='${post.url}'">
            <div class="search-result-title">${highlightKeyword(post.title, keyword)}</div>
            <div class="search-result-content">${highlightKeyword(contentPreview, keyword)}</div>
          </div>
        `
      }).join('')

      searchResults.innerHTML = resultsHTML
    }

    searchButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        await fetchPostsData()
        openSearch()
      })
    })

    searchClose.addEventListener('click', closeSearch)

    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch()
    })

    searchInput.addEventListener('input', (e) => {
      performSearch(e.target.value)
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchModal.classList.contains('active')) {
        closeSearch()
      }
    })
  }

  // 主题切换功能
  const initThemeToggle = () => {
    const themeToggles = document.querySelectorAll('.custom-theme-toggle')
    if (!themeToggles.length) return

    const updateIcons = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme')
      themeToggles.forEach(toggle => {
        const icon = toggle.querySelector('i')
        if (currentTheme === 'dark') {
          icon.className = 'fa-fw fas fa-sun'
        } else {
          icon.className = 'fa-fw fas fa-moon'
        }
      })
    }

    const toggleTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme')
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark'

      if (newTheme === 'dark') {
        btf.activateDarkMode()
        btf.saveToLocal.set('theme', 'dark', 2)
      } else {
        btf.activateLightMode()
        btf.saveToLocal.set('theme', 'light', 2)
      }

      updateIcons()
    }

    themeToggles.forEach(toggle => toggle.addEventListener('click', toggleTheme))
    updateIcons()

    const observer = new MutationObserver(updateIcon)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
  }

  initSearch()
  initThemeToggle()
})
