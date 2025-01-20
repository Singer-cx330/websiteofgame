class GameGuide {
    constructor() {
        this.menuEl = document.getElementById('menu');
        this.contentArea = document.getElementById('content-area');
        this.breadcrumb = document.getElementById('breadcrumb');
        this.searchInput = document.querySelector('.search-box input');
        this.data = null;
        this.navigationHistory = [];
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.navigationStack = [];  // 添加导航栈
        this.isAdmin = false;
        this.adminToken = localStorage.getItem('adminToken');
        if (this.adminToken) {
            this.isAdmin = true;
        }
        this.init();
        this.setupEventListeners();
        this.initSearchHistory();
        this.initScrollToTop();
        this.initProgressBar();
        this.initBubbles();
        this.initDreamEffects();
        this.initStarBackground();
        this.initInteractiveEffects();
        this.initParallaxEffect();
        this.initMagneticEffect();
        this.initDebounce();  // 添加防抖处理
    }

    async init() {
        try {
            // 加载用户设置
            const settingsResponse = await fetch(`${this.apiBaseUrl}/user/settings`);
            const settings = await settingsResponse.json();
            this.applyUserSettings(settings);

            // 加载指南数据
            this.data = await this.loadData();
            this.renderMenu(this.data);
            this.showWelcomePage();
        } catch (error) {
            console.error('加载失败:', error);
            this.showError(error);
        }
    }

    async loadData(retryCount = 3) {
        for (let i = 0; i < retryCount; i++) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/guide`);
                if (!response.ok) throw new Error('Network response was not ok');
                return await response.json();
            } catch (error) {
                if (i === retryCount - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    showLoadingProgress(percent) {
        this.progressBar.style.width = `${percent}%`;
        if (percent >= 100) {
            setTimeout(() => {
                this.progressBar.style.opacity = '0';
            }, 500);
        } else {
            this.progressBar.style.opacity = '1';
        }
    }

    setupEventListeners() {
        // 搜索功能
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // 添加卡片点击效果
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.quick-link-card');
            if (card) {
                const title = card.querySelector('h3').textContent;
                const section = Object.values(this.data).find(s => s.title === title);
                if (section) {
                    this.showContent(section);
                }
            }
        });

        // 添加加载状态
        window.addEventListener('load', () => {
            document.body.classList.remove('loading');
        });

        // 移动端菜单切换
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }

        // 点击内容区域时关闭移动端菜单
        document.querySelector('.content').addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });
    }

    renderMenu(data) {
        this.menuEl.innerHTML = '';
        const displayOrder = ['game_mechanics', 'feedback', 'game_guide'];
        
        displayOrder.forEach(key => {
            if (data[key]) {
                const section = data[key];
                const menuItem = document.createElement('li');
                menuItem.className = 'menu-item fade-in';
                
                menuItem.innerHTML = `
                    <i class="${this.getIconForSection(key)}"></i>
                    <span>${section.title}</span>
                `;
                
                menuItem.addEventListener('click', () => {
                    // 移除其他菜单项的活动状态
                    this.menuEl.querySelectorAll('.menu-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    // 添加当前菜单项的活动状态
                    menuItem.classList.add('active');
                    
                    this.showContent({...section, key});
                });
                
                this.menuEl.appendChild(menuItem);
            }
        });
    }

    getIconForSection(key) {
        const icons = {
            game_mechanics: 'fas fa-cogs',           // 游戏机制用齿轮图标
            feedback: 'fas fa-comments',             // 意见征集用对话图标
            game_guide: 'fas fa-book-open'           // 游戏攻略用书本图标
        };
        return icons[key] || 'fas fa-circle';
    }

    // 为子部分添加图标
    getSectionIcon(section) {
        const icons = {
            // 游戏机制相关图标
            '职业': 'fas fa-user',
            '负面状态': 'fas fa-skull',
            '抗性': 'fas fa-shield-alt',
            '基础属性': 'fas fa-chart-bar',
            '性格系统': 'fas fa-heart',
            '装备系统': 'fas fa-ring',
            '入梦系统': 'fas fa-moon',
            
            // 游戏攻略相关图标
            '灵具': 'fas fa-magic',
            '饰品': 'fas fa-gem',
            '梦灵': 'fas fa-ghost',
            '怪物': 'fas fa-dragon',
            'BOSS': 'fas fa-crown',
            '阵容推荐': 'fas fa-users',
            '性格': 'fas fa-smile',
            '版本更新': 'fas fa-code-branch',
            
            // 意见征集相关图标
            '职业意见': 'fas fa-user-edit',
            '怪物意见': 'fas fa-dragon',
            'BOSS意见': 'fas fa-crown'
        };
        return icons[section] || 'fas fa-circle';
    }

    showWelcomePage() {
        const displayOrder = ['game_mechanics', 'feedback', 'game_guide'];
        
        this.contentArea.innerHTML = `
            <div class="welcome-page fade-in">
                <div class="hero-section">
                    <div class="hero-content">
                        <div class="hero-badge">推荐指南</div>
                        <h1 class="hero-title">
                            <span class="title-line">欢迎来到</span>
                            <span class="title-highlight">游戏指南</span>
                        </h1>
                        <p class="hero-subtitle">探索游戏的奥秘，掌握核心玩法，成为最强大的玩家</p>
                        <div class="hero-stats">
                            <div class="stat-item">
                                <i class="fas fa-book"></i>
                                <div class="stat-info">
                                    <span class="stat-number" data-value="100">0</span>
                                    <span class="stat-label">攻略指南</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-users"></i>
                                <div class="stat-info">
                                    <span class="stat-number" data-value="50000">0</span>
                                    <span class="stat-label">活跃玩家</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-star"></i>
                                <div class="stat-info">
                                    <span class="stat-number" data-value="98">0</span>
                                    <span class="stat-label">好评率</span>
                                </div>
                            </div>
                        </div>
                        <div class="hero-features">
                            <div class="feature-item">
                                <i class="fas fa-bolt"></i>
                                <span>实时更新</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-shield-alt"></i>
                                <span>专业可靠</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-sync"></i>
                                <span>持续优化</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-decoration">
                        <div class="decoration-item">
                            <i class="fas fa-gamepad pulse"></i>
                        </div>
                        <div class="floating-elements">
                            <span class="float-item">⭐</span>
                            <span class="float-item">💫</span>
                            <span class="float-item">✨</span>
                        </div>
                    </div>
                </div>
                
                <div class="section-divider">
                    <div class="divider-line"></div>
                    <span class="divider-text">探索指南</span>
                    <div class="divider-line"></div>
                </div>
                
                <div class="guide-sections">
                    ${displayOrder.map(key => {
                        const section = this.data[key];
                        return `
                            <div class="guide-card scroll-reveal">
                                <div class="card-content">
                                    <div class="card-icon">
                                        <i class="${this.getIconForSection(key)}"></i>
                                    </div>
                                    <h3 class="card-title">${section.title}</h3>
                                    <p class="card-description">${section.content || '点击查看详情'}</p>
                                    <div class="card-action">
                                        <span class="explore-text">
                                            探索更多 <i class="fas fa-arrow-right"></i>
                                        </span>
                                    </div>
                                </div>
                                <div class="card-background"></div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="quick-access">
                    <div class="quick-access-header">
                        <h2>快速入口</h2>
                        <p>常用功能快速访问</p>
                    </div>
                    <div class="quick-links">
                        <div class="quick-link-item">
                            <i class="fas fa-graduation-cap"></i>
                            <span>新手教程</span>
                            <div class="link-hover"></div>
                        </div>
                        <div class="quick-link-item">
                            <i class="fas fa-chart-line"></i>
                            <span>数据中心</span>
                            <div class="link-hover"></div>
                        </div>
                        <div class="quick-link-item">
                            <i class="fas fa-trophy"></i>
                            <span>排行榜</span>
                            <div class="link-hover"></div>
                        </div>
                        <div class="quick-link-item">
                            <i class="fas fa-comments"></i>
                            <span>社区讨论</span>
                            <div class="link-hover"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加数字增长动画
        this.animateNumbers();
    }

    // 添加数字增长动画方法
    animateNumbers() {
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const value = parseInt(stat.dataset.value);
            let current = 0;
            const increment = value / 50;
            const duration = 1500;
            const interval = duration / 50;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= value) {
                    current = value;
                    clearInterval(timer);
                }
                stat.textContent = Math.round(current).toLocaleString() + (stat.dataset.value === "98" ? "%" : "+");
            }, interval);
        });
    }

    updateBreadcrumb(path) {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = `
            <a href="#" class="breadcrumb-home">首页</a>
            ${path.map((item, index) => `
                <i class="fas fa-chevron-right"></i>
                <span class="breadcrumb-item ${index === path.length - 1 ? 'active' : ''}">${item}</span>
            `).join('')}
        `;

        // 添加点击事件
        breadcrumb.querySelector('.breadcrumb-home').addEventListener('click', () => {
            this.showWelcomePage();
        });
    }

    async showContent(section) {
        try {
            this.progressBar.classList.add('loading');
            this.updateBreadcrumb([section.title]);
            this.saveNavigation([section.title]);
            
            // 为不同部分定义描述文本
            const sectionDescriptions = {
                game_mechanics: {
                    '职业': '了解不同职业的特点和玩法',
                    '负面状态': '各种负面状态的效果及应对方法',
                    '抗性': '不同类型的抗性机制详解',
                    '基础属性': '角色基础属性说明及加点建议',
                    '性格系统': '性格对角色属性的影响',
                    '装备系统': '装备类型及效果详细说明',
                    '入梦系统': '入梦机制及玩法攻略'
                },
                // ... 其他描述
            };
            
            const descriptions = sectionDescriptions[section.key] || {};
            
            this.contentArea.innerHTML = `
                <div class="content-section fade-in">
                    <header class="section-header">
                        <i class="${this.getIconForSection(section.key)} section-icon"></i>
                        <h2>${section.title}</h2>
                    </header>
                    ${section.content ? `
                        <p class="section-description">${section.content}</p>
                    ` : ''}
                    <div class="mechanics-grid">
                        ${section.sections.map(item => `
                            <div class="mechanics-item" data-section="${item}">
                                <div class="mechanics-icon">
                                    <i class="${this.getSectionIcon(item)}"></i>
                                </div>
                                <div class="mechanics-content">
                                    <h3 class="mechanics-title">${item}</h3>
                                    <p class="mechanics-description">
                                        ${descriptions[item] || '点击查看详情'}
                                    </p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            // 添加卡片点击事件监听
            this.contentArea.querySelectorAll('.mechanics-item').forEach(card => {
                card.addEventListener('click', () => {
                    const sectionTitle = card.getAttribute('data-section');
                    this.showSectionDetail(section.title, sectionTitle);
                });
            });
            
            this.navigationStack.push({
                type: 'section',
                title: section.title,
                data: section
            });
            this.updateNavigationButtons();
        } catch (error) {
            console.error('显示内容失败:', error);
            this.showError();
        } finally {
            this.progressBar.classList.remove('loading');
        }
    }

    // 添加一个获取描述的辅助方法
    getSectionDescription(sectionKey, item) {
        const descriptions = {
            game_mechanics: {
                '职业': '了解不同职业的特点和玩法',
                '负面状态': '各种负面状态的效果及应对方法',
                '抗性': '不同类型的抗性机制详解',
                '基础属性': '角色基础属性说明及加点建议',
                '性格系统': '性格对角色属性的影响',
                '装备系统': '装备类型及效果详细说明',
                '入梦系统': '入梦机制及玩法攻略'
            },
            game_guide: {
                '职业': '各职业详细攻略',
                '灵具': '灵具获取与使用指南',
                '饰品': '饰品搭配推荐',
                '梦灵': '梦灵相关攻略',
                '怪物': '怪物图鉴与应对策略',
                'BOSS': 'BOSS战斗攻略',
                '阵容推荐': '最优阵容搭配推荐',
                '性格': '性格选择指南',
                '版本更新': '版本更新内容汇总'
            },
            feedback: {
                '职业意见': '提供职业相关建议',
                '怪物意见': '提供怪物相关建议',
                'BOSS意见': '提供BOSS相关建议'
            }
        };
        
        return descriptions[sectionKey]?.[item] || '点击查看详情';
    }

    // 修改 showSectionDetail 方法
    async showSectionDetail(mainTitle, sectionTitle) {
        try {
            // 添加加载状态
            this.contentArea.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>正在加载 ${sectionTitle} 内容...</p>
                </div>
            `;
            
            this.progressBar.classList.add('loading');
            this.updateBreadcrumb([mainTitle, sectionTitle]);
            
            // 模拟加载延迟，实际项目中替换为真实API调用
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const detail = await this.retryOperation(async () => {
                // 这里是实际的API调用
                return {
                    title: sectionTitle,
                    content: `这是 ${mainTitle} 中 ${sectionTitle} 的详细内容...`,
                    subsections: [
                        {
                            title: '概述',
                            content: '详细的概述内容...'
                        },
                        {
                            title: '详细说明',
                            content: '更多详细说明...'
                        }
                    ]
                };
            });

            // 使用淡入效果显示内容
            this.contentArea.innerHTML = `
                <div class="section-detail fade-in">
                    <header class="detail-header">
                        <i class="${this.getSectionIcon(sectionTitle)} detail-icon"></i>
                        <h2>${detail.title}</h2>
                        <div class="header-actions">
                            <button class="back-btn" onclick="window.history.back()">
                                <i class="fas fa-arrow-left"></i> 返回
                            </button>
                        </div>
                    </header>
                    <div class="detail-content">
                        <div class="content-card">
                            <h3>内容概述</h3>
                            <p class="main-content">${detail.content}</p>
                        </div>
                        ${detail.subsections ? `
                            <div class="subsections">
                                ${detail.subsections.map(sub => `
                                    <div class="subsection-card">
                                        <h3>${sub.title}</h3>
                                        <p>${sub.content}</p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            // 更新导航历史
            this.navigationStack.push({
                type: 'detail',
                mainTitle,
                sectionTitle
            });
            this.updateNavigationButtons();
            
        } catch (error) {
            console.error('加载详细内容失败:', error);
            this.showError('内容加载失败', 
                `无法加载 ${sectionTitle} 的内容，请稍后重试或联系管理员。`, 
                true // 添加重试按钮
            );
        } finally {
            this.progressBar.classList.remove('loading');
        }
    }

    async searchGuide(query) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            return await response.json();
        } catch (error) {
            console.error('搜索失败:', error);
            return [];
        }
    }

    async handleSearch(query) {
        try {
            if (!query) {
                this.renderMenu(this.data);
                return;
            }
            
            const response = await fetch(`${this.apiBaseUrl}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('搜索失败');
            const data = await response.json();
            this.renderMenu(data);
            
            // 保存搜索历史
            if (query && !this.searchHistory.includes(query)) {
                this.searchHistory.push(query);
                if (this.searchHistory.length > 10) {
                    this.searchHistory.shift();
                }
                localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
            }
        } catch (error) {
            console.error('搜索失败:', error);
        }
    }

    showSearchResults(results) {
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">没有找到相关内容</p>';
        } else {
            resultsContainer.innerHTML = results.map(result => `
                <div class="search-result-item" data-section="${result.section}" data-path="${result.path}">
                    <i class="${this.getIconForSection(result.section)}"></i>
                    <div class="result-content">
                        <h4>${result.title}</h4>
                        <p>${result.path}</p>
                    </div>
                </div>
            `).join('');
        }

        // 替换现有的搜索结果
        const existingResults = document.querySelector('.search-results');
        if (existingResults) {
            existingResults.replaceWith(resultsContainer);
        } else {
            this.searchInput.parentElement.appendChild(resultsContainer);
        }
    }

    showError(title, message, showRetry = false) {
        this.contentArea.innerHTML = `
            <div class="error-state fade-in">
                <i class="fas fa-exclamation-circle"></i>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="error-actions">
                    ${showRetry ? `
                        <button onclick="location.reload()" class="retry-button">
                            <i class="fas fa-redo"></i> 重试
                        </button>
                    ` : ''}
                    <button onclick="window.history.back()" class="back-button">
                        <i class="fas fa-arrow-left"></i> 返回
                    </button>
                </div>
            </div>
        `;
    }

    addLoadingEffect(element) {
        element.classList.add('loading');
        setTimeout(() => {
            element.classList.remove('loading');
        }, 1000);
    }

    initSearchHistory() {
        const searchBox = document.querySelector('.search-box');
        const historyList = document.createElement('div');
        historyList.className = 'search-history';
        searchBox.appendChild(historyList);

        this.searchInput.addEventListener('focus', () => {
            this.showSearchHistory();
        });
    }

    showSearchHistory() {
        const historyList = document.querySelector('.search-history');
        if (this.searchHistory.length === 0) return;

        historyList.innerHTML = `
            <div class="history-title">
                搜索历史
                <span class="clear-history">清除</span>
            </div>
            ${this.searchHistory.slice(-5).map(term => `
                <div class="history-item">
                    <i class="fas fa-history"></i>
                    <span>${term}</span>
                </div>
            `).join('')}
        `;

        // 添加点击事件
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                this.searchInput.value = item.querySelector('span').textContent;
                this.handleSearch(this.searchInput.value);
            });
        });

        historyList.querySelector('.clear-history')?.addEventListener('click', () => {
            this.searchHistory = [];
            localStorage.removeItem('searchHistory');
            historyList.innerHTML = '';
        });
    }

    applyUserSettings(settings) {
        // 加载搜索历史
        this.searchHistory = settings.search_history || [];
    }

    async saveUserSettings(settings) {
        try {
            await fetch(`${this.apiBaseUrl}/user/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    async updateUserSettings(settings) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });
            if (!response.ok) throw new Error('Failed to update settings');
            return await response.json();
        } catch (error) {
            console.error('更新设置失败:', error);
            throw error;
        }
    }

    async clearSearchHistory() {
        try {
            await fetch(`${this.apiBaseUrl}/user/search-history`, {
                method: 'DELETE'
            });
            this.searchHistory = [];
            this.showSearchHistory();
        } catch (error) {
            console.error('清除搜索历史失败:', error);
        }
    }

    async saveNavigation(path) {
        try {
            await fetch(`${this.apiBaseUrl}/user/navigation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path })
            });
        } catch (error) {
            console.error('保存导航历史失败:', error);
        }
    }

    initScrollToTop() {
        const scrollButton = document.createElement('div');
        scrollButton.className = 'scroll-top';
        scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        document.body.appendChild(scrollButton);

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollButton.classList.add('visible');
            } else {
                scrollButton.classList.remove('visible');
            }
        });

        scrollButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    updateNavigationButtons() {
        // 如果不存在导航栏，创建一个
        let navBar = document.querySelector('.navigation-bar');
        if (!navBar) {
            navBar = document.createElement('div');
            navBar.className = 'navigation-bar';
            this.contentArea.insertBefore(navBar, this.contentArea.firstChild);
        }

        navBar.innerHTML = `
            <div class="nav-buttons fade-in">
                <button class="nav-btn home-btn" ${this.navigationStack.length === 0 ? 'disabled' : ''}>
                    <i class="fas fa-home"></i>
                    <span>首页</span>
                </button>
                <button class="nav-btn back-btn" ${this.navigationStack.length <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-left"></i>
                    <span>返回</span>
                </button>
            </div>
        `;

        // 添加点击事件
        const homeBtn = navBar.querySelector('.home-btn');
        const backBtn = navBar.querySelector('.back-btn');

        homeBtn.addEventListener('click', () => {
            if (this.navigationStack.length > 0) {
                this.goHome();
            }
        });

        backBtn.addEventListener('click', () => {
            if (this.navigationStack.length > 1) {
                this.goBack();
            }
        });
    }

    goBack() {
        if (this.navigationStack.length <= 1) return;
        
        // 添加过渡动画
        this.contentArea.classList.add('fade-out');
        
        setTimeout(() => {
            this.navigationStack.pop();
            const previous = this.navigationStack[this.navigationStack.length - 1];
            
            if (previous.type === 'section') {
                this.showContent(previous.data);
            } else if (previous.type === 'detail') {
                this.showSectionDetail(previous.mainTitle, previous.sectionTitle);
            } else {
                this.showWelcomePage();
            }
            
            this.contentArea.classList.remove('fade-out');
            this.contentArea.classList.add('fade-in');
        }, 300);
    }

    goHome() {
        // 添加过渡动画
        this.contentArea.classList.add('fade-out');
        
        setTimeout(() => {
            this.navigationStack = [];
            this.showWelcomePage();
            this.updateBreadcrumb(['首页']);
            this.updateNavigationButtons();
            this.contentArea.classList.remove('fade-out');
            this.contentArea.classList.add('fade-in');
        }, 300);
    }

    initProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        document.body.appendChild(progressBar);
        this.progressBar = progressBar;
    }

    // 添加提交反馈的方法
    async submitFeedback(feedback) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedback)
            });

            if (!response.ok) {
                throw new Error('提交反馈失败');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('提交反馈失败:', error);
            throw error;
        }
    }

    // 添加管理员登录方法
    async adminLogin(username, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.isAdmin = true;
                this.adminToken = data.token;
                localStorage.setItem('adminToken', data.token);
                return true;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    }

    // 添加编辑内容的方法
    async editContent(mainTitle, sectionTitle) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/section-detail?main=${mainTitle}&section=${sectionTitle}`);
            const detail = await response.json();
            
            this.contentArea.innerHTML = `
                <div class="edit-content fade-in">
                    <h2>编辑内容</h2>
                    <form id="editForm">
                        <div class="form-group">
                            <label>标题</label>
                            <input type="text" name="title" value="${detail.title}" required>
                        </div>
                        <div class="form-group">
                            <label>主要内容</label>
                            <textarea name="content" required>${detail.content}</textarea>
                        </div>
                        <div class="subsections-editor">
                            <h3>子部分</h3>
                            ${detail.subsections ? detail.subsections.map((sub, index) => `
                                <div class="subsection-item">
                                    <input type="text" name="sub_title_${index}" value="${sub.title}" placeholder="子标题">
                                    <textarea name="sub_content_${index}" placeholder="子内容">${sub.content}</textarea>
                                </div>
                            `).join('') : ''}
                            <button type="button" onclick="gameGuide.addSubsection()">添加子部分</button>
                        </div>
                        <div class="form-actions">
                            <button type="submit">保存</button>
                            <button type="button" onclick="gameGuide.showSectionDetail('${mainTitle}', '${sectionTitle}')">取消</button>
                        </div>
                    </form>
                </div>
            `;

            document.getElementById('editForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveContent(mainTitle, sectionTitle, e.target);
            });
        } catch (error) {
            console.error('加载编辑界面失败:', error);
            this.showError('加载失败', '无法加载编辑界面');
        }
    }

    // 保存内容的方法
    async saveContent(mainTitle, sectionTitle, form) {
        try {
            const formData = new FormData(form);
            const content = {
                title: formData.get('title'),
                content: formData.get('content'),
                subsections: []
            };

            // 收集子部分数据
            let index = 0;
            while (formData.get(`sub_title_${index}`)) {
                content.subsections.push({
                    title: formData.get(`sub_title_${index}`),
                    content: formData.get(`sub_content_${index}`)
                });
                index++;
            }

            const response = await fetch(`${this.apiBaseUrl}/admin/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: JSON.stringify({
                    main_section: mainTitle,
                    section_name: sectionTitle,
                    content: content
                })
            });

            if (response.ok) {
                this.showSectionDetail(mainTitle, sectionTitle);
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存内容失败:', error);
            this.showError('保存失败', '无法保存内容更改');
        }
    }

    // 添加子部分的方法
    addSubsection() {
        const container = document.querySelector('.subsections-editor');
        const index = container.querySelectorAll('.subsection-item').length;
        
        const newSubsection = document.createElement('div');
        newSubsection.className = 'subsection-item';
        newSubsection.innerHTML = `
            <input type="text" name="sub_title_${index}" placeholder="子标题">
            <textarea name="sub_content_${index}" placeholder="子内容"></textarea>
        `;
        
        container.insertBefore(newSubsection, container.lastElementChild);
    }

    initBubbles() {
        const bubbleContainer = document.querySelector('.bubble-container');
        
        // 创建泡泡函数
        const createBubble = () => {
            const bubble = document.createElement('div');
            bubble.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}vw;
                bottom: -20px;
                width: ${Math.random() * 30 + 10}px;
                height: ${Math.random() * 30 + 10}px;
                border-radius: 50%;
                background: radial-gradient(
                    circle at 30% 30%,
                    rgba(255, 255, 255, 0.8),
                    rgba(155, 89, 182, 0.4)
                );
                animation: float ${Math.random() * 5 + 3}s linear infinite;
                z-index: 0;
            `;
            
            bubbleContainer.appendChild(bubble);
            
            // 动画结束后移除泡泡
            bubble.addEventListener('animationend', () => {
                bubble.remove();
            });
        };

        // 定期创建泡泡
        setInterval(createBubble, 1000);
        
        // 初始创建一些泡泡
        for (let i = 0; i < 10; i++) {
            setTimeout(createBubble, i * 300);
        }
    }

    initDreamEffects() {
        // 添加梦境光效
        const createDreamLight = () => {
            const light = document.createElement('div');
            light.className = 'dream-light';
            light.style.left = `${Math.random() * 100}%`;
            light.style.top = `${Math.random() * 100}%`;
            document.body.appendChild(light);
            
            setTimeout(() => light.remove(), 8000);
        };

        setInterval(createDreamLight, 3000);

        // 添加星星效果
        const createStar = () => {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.cssText = `
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                width: ${Math.random() * 3}px;
                height: ${Math.random() * 3}px;
                opacity: ${Math.random()};
            `;
            document.body.appendChild(star);
            
            setTimeout(() => star.remove(), 5000);
        };

        setInterval(createStar, 1000);

        // 鼠标移动光效
        document.addEventListener('mousemove', (e) => {
            const light = document.createElement('div');
            light.className = 'dream-light';
            light.style.cssText = `
                left: ${e.clientX - 50}px;
                top: ${e.clientY - 50}px;
                opacity: 0.3;
                transition: all 1s ease-out;
            `;
            document.body.appendChild(light);
            
            requestAnimationFrame(() => {
                light.style.transform = 'scale(2)';
                light.style.opacity = '0';
            });
            
            setTimeout(() => light.remove(), 1000);
        });
    }

    // 修改泡泡样式
    createBubble() {
        const bubble = document.createElement('div');
        const size = Math.random() * 30 + 10;
        bubble.className = 'bubble';
        bubble.style.cssText = `
            left: ${Math.random() * 100}vw;
            bottom: -${size}px;
            width: ${size}px;
            height: ${size}px;
            animation: float ${Math.random() * 5 + 3}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        return bubble;
    }

    initStarBackground() {
        const starContainer = document.createElement('div');
        starContainer.className = 'star-background';
        document.body.appendChild(starContainer);

        const createStar = () => {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 2 + 1;
            star.style.cssText = `
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                --duration: ${Math.random() * 2 + 1}s;
                --opacity: ${Math.random() * 0.5 + 0.3};
            `;
            starContainer.appendChild(star);
            
            setTimeout(() => star.remove(), 5000);
        };

        // 初始创建一些星星
        for (let i = 0; i < 50; i++) {
            createStar();
        }

        // 定期创建新星星
        setInterval(createStar, 200);
    }

    initInteractiveEffects() {
        // 添加流星效果
        const createMeteor = () => {
            const meteor = document.createElement('div');
            meteor.className = 'meteor';
            meteor.style.top = `${Math.random() * 100}%`;
            meteor.style.left = `${Math.random() * 100}%`;
            document.body.appendChild(meteor);
            
            meteor.addEventListener('animationend', () => meteor.remove());
        };

        setInterval(createMeteor, 4000);

        // 添加滚动显示效果
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

        // 添加卡片悬浮光效
        document.querySelectorAll('.guide-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                card.style.setProperty('--mouse-x', `${x}%`);
                card.style.setProperty('--mouse-y', `${y}%`);
            });
        });
    }

    initParallaxEffect() {
        const parallaxBg = document.createElement('div');
        parallaxBg.className = 'parallax-bg';
        
        // 创建多层视差背景
        for (let i = 1; i <= 3; i++) {
            const layer = document.createElement('div');
            layer.className = `parallax-layer layer-${i}`;
            parallaxBg.appendChild(layer);
        }
        
        document.body.appendChild(parallaxBg);
        
        // 添加鼠标移动监听
        document.addEventListener('mousemove', (e) => {
            const layers = document.querySelectorAll('.parallax-layer');
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            
            layers.forEach((layer, index) => {
                const speed = (index + 1) * 0.02;
                const x = deltaX * speed;
                const y = deltaY * speed;
                layer.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }

    initMagneticEffect() {
        document.querySelectorAll('.guide-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;
                
                const rotateX = deltaY * 10;
                const rotateY = -deltaX * 10;
                
                card.style.setProperty('--rotateX', `${rotateX}deg`);
                card.style.setProperty('--rotateY', `${rotateY}deg`);
                
                // 添加视差效果到卡片内容
                const content = card.querySelector('.card-content');
                content.style.transform = `
                    translateX(${deltaX * 10}px)
                    translateY(${deltaY * 10}px)
                `;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--rotateX', '0deg');
                card.style.setProperty('--rotateY', '0deg');
                
                const content = card.querySelector('.card-content');
                content.style.transform = '';
            });
        });
    }

    // 添加防抖优化
    initDebounce() {
        this.debouncedMouseMove = this.debounce((e) => {
            this.handleMouseMove(e);
        }, 16);  // 约60fps

        document.addEventListener('mousemove', (e) => {
            this.debouncedMouseMove(e);
        });
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 优化动画性能
    initAnimations() {
        // 使用 requestAnimationFrame 代替 setInterval
        const animate = () => {
            this.createBubble();
            this.createStar();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    // 添加加载状态提示
    showLoadingState() {
        this.contentArea.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>正在加载精彩内容...</p>
            </div>
        `;
    }

    // 添加错误提示
    showError(error) {
        this.contentArea.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>加载失败</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()">重试</button>
            </div>
        `;
    }

    // 添加重试机制的工具方法
    async retryOperation(operation, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new GameGuide();
});