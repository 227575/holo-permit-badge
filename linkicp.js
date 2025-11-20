/**
 * Dimensional Permit Auto-Badge (Holographic Docking Edition)
 * Target: https://xxx.mibo.im/
 * Behavior: 
 *  1. Auto-hide to edge (Docked Mode)
 *  2. Hover to expand (Slide-out)
 *  3. Multi-color flowing gradient shield
 */
(function() {
    // ================= 配置 =================
    const CONFIG = {
        targetUrl: "https://xxx.mibo.im/", 
        textColor: "#1d1d1f", 
        font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    };

    // ================= 1. 资源注入 =================
    function loadFontAwesome() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(link);
        }
    }

    // ================= 2. 样式注入 =================
    function injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            #dim-permit-badge {
                position: fixed;
                bottom: 20px; 
                right: 20px;
                z-index: 99999;
                
                /* --- 核心布局：收缩态 --- */
                display: flex;
                align-items: center;
                /* 默认宽度只够放图标，实现"贴边隐藏"效果 */
                width: 36px; 
                height: 36px;
                overflow: hidden; /* 隐藏溢出的文字 */
                
                /* --- 材质：磨砂玻璃 --- */
                background: rgba(255, 255, 255, 0.15); /* 极低透明度 */
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.4);
                border-radius: 30px;
                
                /* 阴影 */
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                
                /* 字体 */
                color: ${CONFIG.textColor};
                font-family: ${CONFIG.font};
                font-size: 12px;
                white-space: nowrap; /* 防止文字换行 */
                text-decoration: none;
                
                /* --- 动画：丝滑伸缩 --- */
                transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                
                /* 初始位移：隐藏 */
                transform: translateY(20px) scale(0.9);
                opacity: 0;
                pointer-events: none;
            }

            /* 滚动触底后显示 */
            #dim-permit-badge.visible {
                transform: translateY(0) scale(1);
                opacity: 1;
                pointer-events: auto;
            }

            /* --- 交互：悬停展开 (Slide Out) --- */
            #dim-permit-badge:hover {
                width: auto; /* 宽度自动撑开 */
                padding-right: 15px; /* 展开后右侧补白 */
                background: rgba(255, 255, 255, 0.65); /* 展开时背景变实一点方便阅读 */
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }

            /* --- 图标容器 --- */
            .dp-icon-box {
                min-width: 36px; /* 也就是收缩状态下的总宽度 */
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }

            /* --- 全息渐变盾牌 --- */
            .dp-shield {
                font-size: 16px;
                /* 炫彩渐变：紫 -> 蓝 -> 青 -> 绿 -> 黄 */
                background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 25%, #8fd3f4 50%, #84fab0 75%, #a18cd1 100%);
                background-size: 300% 300%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                
                /* 实时流动动画 */
                animation: holoFlow 4s linear infinite;
                filter: drop-shadow(0 2px 3px rgba(161, 140, 209, 0.3));
            }

            @keyframes holoFlow {
                0% { background-position: 0% 50%; }
                100% { background-position: 100% 50%; }
            }

            /* --- 文字区域（默认隐藏） --- */
            .dp-content {
                display: flex;
                align-items: center;
                gap: 8px;
                opacity: 0; /* 默认透明 */
                transform: translateX(-10px);
                transition: all 0.4s ease 0.1s; /* 稍微延迟一点显示文字 */
            }

            /* 悬停时显示文字 */
            #dim-permit-badge:hover .dp-content {
                opacity: 1;
                transform: translateX(0);
            }

            .dp-divider {
                width: 1px; height: 10px;
                background: rgba(0,0,0,0.15);
            }
            
            .dp-date {
                font-family: 'Courier New', monospace;
                font-weight: 700;
                opacity: 0.8;
            }

            @media (max-width: 768px) {
                #dim-permit-badge {
                    bottom: 15px; right: 15px;
                }
                /* 手机端点击才展开，或者保持常亮 */
            }
        `;
        document.head.appendChild(style);
    }

    // ================= 3. 逻辑构建 =================
    function initBadge() {
        const domain = window.location.hostname.toUpperCase().replace('WWW.', '');
        const now = new Date();
        const icpCode = `ICP-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
        const targetLink = `${CONFIG.targetUrl}?target=${encodeURIComponent(window.location.href)}`;

        const badge = document.createElement('a');
        badge.id = 'dim-permit-badge';
        badge.href = targetLink;
        badge.target = '_blank';
        
        // 结构：图标盒子(常驻) + 内容盒子(悬停显示)
        badge.innerHTML = `
            <div class="dp-icon-box">
                <i class="fas fa-shield-alt dp-shield"></i>
            </div>
            <div class="dp-content">
                <span>${domain}</span>
                <span class="dp-divider"></span>
                <span class="dp-date">${icpCode}</span>
            </div>
        `;
        document.body.appendChild(badge);

        function checkScroll() {
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = window.scrollY || window.pageYOffset;
            
            // 只有在页面最底部 80px 范围内才出现
            if (scrollableHeight <= 0 || scrolled >= scrollableHeight - 80) {
                badge.classList.add('visible');
            } else {
                badge.classList.remove('visible');
            }
        }

        window.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        setTimeout(checkScroll, 500);
    }

    loadFontAwesome();
    injectStyles();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBadge);
    } else {
        initBadge();
    }
})();