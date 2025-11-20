/**
 * Dimensional Permit Auto-Badge (Draggable & Holographic)
 * Target: https://andeasw.github.io/holo-permit-badge
 * Features:
 *  1. Scroll to show (Bottom detection)
 *  2. Hover to expand info
 *  3. Draggable to any position (Desktop/Mobile)
 */
(function() {
    // ================= 配置区域 =================
    const CONFIG = {
        targetUrl: "https://andeasw.github.io/holo-permit-badge", // 点击跳转地址
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
                /* 初始位置：右下角 */
                top: calc(100% - 60px);
                left: calc(100% - 60px);
                z-index: 99999;
                
                display: flex;
                align-items: center;
                /* 收缩状态宽度 */
                width: 36px; 
                height: 36px;
                overflow: hidden;
                
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.4);
                border-radius: 30px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                
                color: ${CONFIG.textColor};
                font-family: ${CONFIG.font};
                font-size: 12px;
                white-space: nowrap;
                text-decoration: none;
                user-select: none; /* 禁止拖拽时选中文字 */
                touch-action: none; /* 禁止移动端拖拽时滚动页面 */
                
                /* 关键：Transform只负责缩放，位置由top/left控制，以免冲突 */
                transform: scale(0.9); 
                opacity: 0;
                transition: width 0.4s ease, opacity 0.4s ease, transform 0.4s ease, background 0.3s;
                cursor: grab; /* 提示可拖动 */
            }

            /* 拖拽中状态：鼠标变成抓紧，并移除过渡以免延迟 */
            #dim-permit-badge.dragging {
                cursor: grabbing;
                transition: none !important; /* 拖拽时必须移除过渡，否则跟手性差 */
                box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            }

            /* 显示状态 */
            #dim-permit-badge.visible {
                transform: scale(1);
                opacity: 1;
            }

            /* 悬停展开 (仅在非拖拽时生效) */
            #dim-permit-badge:hover:not(.dragging) {
                width: auto;
                padding-right: 15px;
                background: rgba(255, 255, 255, 0.65);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }

            .dp-icon-box {
                min-width: 36px; height: 36px;
                display: flex; align-items: center; justify-content: center;
            }

            .dp-shield {
                font-size: 16px;
                background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 25%, #8fd3f4 50%, #84fab0 75%, #a18cd1 100%);
                background-size: 300% 300%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                animation: holoFlow 4s linear infinite;
                pointer-events: none; /* 图标不响应点击，穿透给父元素 */
            }
            
            @keyframes holoFlow { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }

            .dp-content {
                display: flex; align-items: center; gap: 8px;
                opacity: 0; transform: translateX(-10px);
                transition: all 0.4s ease 0.1s;
                pointer-events: none;
            }
            
            #dim-permit-badge:hover:not(.dragging) .dp-content {
                opacity: 1; transform: translateX(0);
            }

            .dp-divider { width: 1px; height: 10px; background: rgba(0,0,0,0.15); }
            .dp-date { font-family: 'Courier New', monospace; font-weight: 700; opacity: 0.8; }
        `;
        document.head.appendChild(style);
    }

    // ================= 3. 核心逻辑 (拖拽 + 业务) =================
    function initBadge() {
        const domain = window.location.hostname.toUpperCase().replace('WWW.', '');
        const now = new Date();
        const icpCode = `ICP-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
        
        const badge = document.createElement('a');
        badge.id = 'dim-permit-badge';
        badge.href = CONFIG.targetUrl; // 这里不设target，在click事件里手动控制
        
        badge.innerHTML = `
            <div class="dp-icon-box"><i class="fas fa-shield-alt dp-shield"></i></div>
            <div class="dp-content">
                <span>${domain}</span>
                <span class="dp-divider"></span>
                <span class="dp-date">${icpCode}</span>
            </div>
        `;
        document.body.appendChild(badge);

        // --- A. 拖拽逻辑引擎 ---
        let isDragging = false;
        let hasMoved = false; // 标记是否发生了位移，用于区分点击和拖拽
        let startX, startY, initialLeft, initialTop;

        // 统一处理开始事件 (Mouse & Touch)
        const startDrag = (e) => {
            // 只有左键可以拖拽
            if (e.type === 'mousedown' && e.button !== 0) return;
            
            isDragging = true;
            hasMoved = false;
            badge.classList.add('dragging');
            
            // 获取当前鼠标/手指坐标
            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            
            startX = clientX;
            startY = clientY;
            
            // 获取元素当前的绝对位置
            const rect = badge.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            // 防止选中文本
            e.preventDefault();
        };

        // 统一处理移动事件
        const onDrag = (e) => {
            if (!isDragging) return;

            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            // 如果移动距离超过 2px，则视为拖拽，阻止后续的点击跳转
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                hasMoved = true;
            }

            // 计算新位置
            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            // 边界限制 (防止拖出屏幕)
            const maxLeft = window.innerWidth - badge.offsetWidth;
            const maxTop = window.innerHeight - badge.offsetHeight;
            
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            badge.style.left = newLeft + 'px';
            badge.style.top = newTop + 'px';
            badge.style.right = 'auto'; // 清除 right 属性，改用 left 控制
            badge.style.bottom = 'auto'; // 清除 bottom 属性
        };

        // 统一处理结束事件
        const stopDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            badge.classList.remove('dragging');
        };

        // 绑定事件监听
        badge.addEventListener('mousedown', startDrag);
        badge.addEventListener('touchstart', startDrag, { passive: false });

        window.addEventListener('mousemove', onDrag);
        window.addEventListener('touchmove', onDrag, { passive: false });

        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchend', stopDrag);

        // --- B. 点击跳转控制 ---
        badge.addEventListener('click', (e) => {
            // 如果刚才发生了拖拽位移，则阻止链接跳转
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                // 正常跳转
                window.open(CONFIG.targetUrl, '_blank');
            }
        });

        // --- C. 滚动显示逻辑 ---
        function checkScroll() {
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = window.scrollY || window.pageYOffset;
            
            // 触底显示 (容差 80px)
            if (scrollableHeight <= 0 || scrolled >= scrollableHeight - 80) {
                badge.classList.add('visible');
            } else {
                // 如果用户已经手动拖动过(改变了位置)，建议保持显示，或者你可以选择这里依然隐藏
                // 这里保留原逻辑：滚上去就隐藏
                badge.classList.remove('visible');
            }
        }

        window.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        setTimeout(checkScroll, 500);
    }

    // ================= 执行 =================
    loadFontAwesome();
    injectStyles();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBadge);
    } else {
        initBadge();
    }
})();
