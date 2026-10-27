/**
 * VORTEX BANK — КЛИЕНТСКАЯ ЛОГИКА ЛЕНДИНГА
 * Включает:
 * - Глобальный стеклянный поповер подсказок «Простыми словами» (?) при наведении и клике
 * - Кастомные стеклянные выпадающие списки (Custom Liquid Glass Select)
 * - Переключатель тем Dark/Light
 * - 3D-Tilt эффект карт с бликом
 * - Конфигуратор карт, калькулятор вкладов/стейкинга, конвертер валют и модалки
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ========================================================================
     1. TOAST-УВЕДОМЛЕНИЯ И ФОРМАТИРОВАНИЕ ЧИСЕЛ
     ======================================================================== */
  const toastEl = document.getElementById('toast');
  const toastMessageEl = document.getElementById('toastMessage');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl || !toastMessageEl) return;
    toastMessageEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3000);
  }

  function formatNumber(num, decimals = 0) {
    return Number(num).toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /* ========================================================================
     2. ДВИЖОК СТЕКЛЯННЫХ ПОДСКАЗОК «ПРОСТЫМИ СЛОВАМИ» (?)
     ======================================================================== */
  const tooltipPortal = document.getElementById('glassTooltipPortal');
  const tooltipTitleEl = document.getElementById('tooltipPortalTitle');
  const tooltipTextEl = document.getElementById('tooltipPortalText');
  const tooltipExampleEl = document.getElementById('tooltipPortalExample');
  let activeTipBtn = null;

  function positionTooltip(btn) {
    if (!tooltipPortal || !btn) return;
    const rect = btn.getBoundingClientRect();
    const portalWidth = Math.min(330, window.innerWidth - 24);
    tooltipPortal.style.width = `${portalWidth}px`;

    const portalRect = tooltipPortal.getBoundingClientRect();
    const portalHeight = portalRect.height || 180;

    // Позиционируем по центру кнопки, но не даём выйти за края экрана
    let left = rect.left + rect.width / 2 - portalWidth / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - portalWidth - 12));

    // Если сверху достаточно места — показываем над иконкой, иначе под ней
    let top = rect.top - portalHeight - 12;
    if (top < 14) {
      top = rect.bottom + 12;
    }

    tooltipPortal.style.left = `${Math.round(left)}px`;
    tooltipPortal.style.top = `${Math.round(top)}px`;
  }

  function showHelpTip(btn) {
    if (!tooltipPortal || !btn) return;
    activeTipBtn?.classList.remove('active-tip');
    activeTipBtn = btn;
    btn.classList.add('active-tip');

    tooltipTitleEl.textContent = btn.getAttribute('data-tip-title') || 'Пояснение';
    tooltipTextEl.textContent = btn.getAttribute('data-tip-text') || '';
    tooltipExampleEl.textContent = btn.getAttribute('data-tip-example') || '';

    tooltipPortal.classList.add('visible');
    tooltipPortal.setAttribute('aria-hidden', 'false');
    positionTooltip(btn);
  }

  function hideHelpTip() {
    if (!tooltipPortal) return;
    activeTipBtn?.classList.remove('active-tip');
    activeTipBtn = null;
    tooltipPortal.classList.remove('visible');
    tooltipPortal.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('.help-tip').forEach(btn => {
    btn.addEventListener('mouseenter', () => showHelpTip(btn));
    btn.addEventListener('mouseleave', () => hideHelpTip());
    btn.addEventListener('focus', () => showHelpTip(btn));
    btn.addEventListener('blur', () => hideHelpTip());
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeTipBtn === btn && tooltipPortal.classList.contains('visible')) {
        hideHelpTip();
      } else {
        showHelpTip(btn);
      }
    });
  });

  window.addEventListener('scroll', () => {
    if (activeTipBtn) positionTooltip(activeTipBtn);
  }, { passive: true });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.help-tip')) hideHelpTip();
  });

  /* ========================================================================
     3. КАСТОМНЫЕ ЗАДЕКОРИРОВАННЫЕ СТЕКЛЯННЫЕ ВЫПАДАЮЩИЕ МЕНЮ (GLASS SELECT)
     ======================================================================== */
  const customSelectUpdaters = new Map();

  function initCustomGlassSelects() {
    document.querySelectorAll('select.custom-glass-select').forEach(selectEl => {
      if (selectEl.dataset.customized === 'true') return;
      selectEl.dataset.customized = 'true';
      selectEl.classList.add('custom-select-native-hidden');

      const container = document.createElement('div');
      container.className = 'custom-select-container';
      selectEl.parentNode.insertBefore(container, selectEl);
      container.appendChild(selectEl);

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'custom-select-trigger';
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');

      const menu = document.createElement('div');
      menu.className = 'custom-select-menu';
      menu.setAttribute('role', 'listbox');

      container.appendChild(trigger);
      container.appendChild(menu);

      function renderSelectState() {
        const selectedOpt = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
        const icon = selectedOpt?.getAttribute('data-icon') || '✦';
        const label = selectedOpt?.textContent || '';

        trigger.innerHTML = `
          <span class="cs-trigger-left">
            <span class="cs-icon">${icon}</span>
            <span class="cs-label">${label}</span>
          </span>
          <span class="cs-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        `;

        menu.innerHTML = '';
        Array.from(selectEl.options).forEach((opt, idx) => {
          const optIcon = opt.getAttribute('data-icon') || '✦';
          const optSub = opt.getAttribute('data-sub') || '';
          const item = document.createElement('div');
          item.className = 'custom-select-option' + (idx === selectEl.selectedIndex ? ' selected' : '');
          item.setAttribute('role', 'option');
          item.innerHTML = `
            <div class="cs-opt-main">
              <span class="cs-icon">${optIcon}</span>
              <div class="cs-opt-text">
                <span class="cs-opt-title">${opt.textContent}</span>
                ${optSub ? `<span class="cs-opt-sub">${optSub}</span>` : ''}
              </div>
            </div>
            <span class="cs-opt-check">✓</span>
          `;

          item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectEl.selectedIndex = idx;
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            renderSelectState();
            container.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
          });

          menu.appendChild(item);
        });
      }

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = container.classList.contains('open');
        document.querySelectorAll('.custom-select-container.open').forEach(c => {
          c.classList.remove('open');
          c.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          container.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      renderSelectState();
      customSelectUpdaters.set(selectEl, renderSelectState);
    });
  }

  initCustomGlassSelects();

  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-container.open').forEach(c => {
      c.classList.remove('open');
      c.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
    });
  });

  function syncCustomSelect(selectEl) {
    const updater = customSelectUpdaters.get(selectEl);
    if (updater) updater();
  }

  /* ========================================================================
     4. ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ (DARK / LIGHT)
     ======================================================================== */
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('vortex_theme') || 'dark';
  htmlEl.setAttribute('data-theme', savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      htmlEl.setAttribute('data-theme', next);
      localStorage.setItem('vortex_theme', next);
      showToast(next === 'light' ? 'Включена светлая тема Vision Light' : 'Включена тёмная тема Liquid Dark');
    });
  }

  /* ========================================================================
     5. МОБИЛЬНОЕ БУРГЕР-МЕНЮ
     ======================================================================== */
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');

  if (burgerBtn && mobileDrawer) {
    burgerBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      burgerBtn.classList.toggle('active', isOpen);
      burgerBtn.setAttribute('aria-expanded', String(isOpen));
    });

    mobileDrawer.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        burgerBtn.classList.remove('active');
        burgerBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ========================================================================
     6. 3D-TILT ЭФФЕКТ КАРТ И СВЕТОВОЙ БЛИК
     ======================================================================== */
  function attachCardTilt(stageEl, cardEl, glareEl) {
    if (!stageEl || !cardEl) return;

    stageEl.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 768) return;
      const rect = cardEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 12;

      cardEl.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

      if (glareEl) {
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        glareEl.style.opacity = '1';
        glareEl.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.32), transparent 60%)`;
      }
    });

    stageEl.addEventListener('mouseleave', () => {
      cardEl.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      if (glareEl) glareEl.style.opacity = '0';
    });
  }

  attachCardTilt(
    document.getElementById('heroCardScene'),
    document.getElementById('heroCard3D'),
    document.getElementById('heroCardGlare')
  );

  attachCardTilt(
    document.getElementById('configCardStage'),
    document.getElementById('configCard'),
    document.getElementById('configCardGlare')
  );

  /* ========================================================================
     7. ВИДЖЕТ БАЛАНСА В HERO И КОПИРОВАНИЕ РЕКВИЗИТОВ/ПРОМОКОДА
     ======================================================================== */
  const toggleBalanceBtn = document.getElementById('toggleBalanceCurrency');
  const liveHeroBalance = document.getElementById('liveHeroBalance');
  let balanceInUsdt = false;

  if (toggleBalanceBtn && liveHeroBalance) {
    toggleBalanceBtn.addEventListener('click', () => {
      balanceInUsdt = !balanceInUsdt;
      liveHeroBalance.textContent = balanceInUsdt ? '5 040,66 USDT' : '485 920,00 ₽';
      showToast(balanceInUsdt ? 'Баланс пересчитан в цифровые доллары USDT' : 'Баланс отображается в рублях ₽');
    });
  }

  document.getElementById('copyCardBtn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText('4276 8801 9420 7719').catch(() => {});
    showToast('Номер демонстрационной карты скопирован');
  });

  document.getElementById('copyPromoBtn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText('VORTEX2026').catch(() => {});
    showToast('Промокод VORTEX2026 скопирован в буфер обмена!');
  });

  /* ========================================================================
     8. ИНТЕРАКТИВНЫЙ 3D-КОНФИГУРАТОР КАРТЫ И ТАРИФОВ
     ======================================================================== */
  const TARIFF_DATA = {
    standard: {
      title: 'VORTEX STANDARD',
      badge: 'CASHBACK 5%',
      price: '0 ₽ навсегда без условий',
      cashback: 'до 5% в 4 категориях (₽ / USDT)',
      limit: 'до 500 000 ₽ / мес без комиссии',
      selectVal: 'Standard'
    },
    pro: {
      title: 'VORTEX PRO',
      badge: 'CASHBACK 10%',
      price: '0 ₽ (при обороте от 30 000 ₽)',
      cashback: 'до 10% в 5 категориях + Web3',
      limit: 'до 1 500 000 ₽ / мес без комиссии',
      selectVal: 'Vortex Pro'
    },
    black: {
      title: 'VORTEX PRIVATE BLACK',
      badge: 'CASHBACK 15%',
      price: '0 ₽ (при остатке от 500 000 ₽)',
      cashback: 'до 15% + Бизнес-залы + Консьерж',
      limit: 'Безлимитные переводы и снятие',
      selectVal: 'Private Black'
    }
  };

  const configCard = document.getElementById('configCard');
  const previewTariffTitle = document.getElementById('previewTariffTitle');
  const previewMaterialBadge = document.getElementById('previewMaterialBadge');
  const previewCashbackBadge = document.getElementById('previewCashbackBadge');
  const previewHolderName = document.getElementById('previewHolderName');
  const previewNetwork = document.getElementById('previewNetwork');

  const specPrice = document.getElementById('specPrice');
  const specCashback = document.getElementById('specCashback');
  const specLimit = document.getElementById('specLimit');

  const holderNameInput = document.getElementById('holderNameInput');
  const networkSelect = document.getElementById('networkSelect');
  const modalTariffSelect = document.getElementById('modalTariffSelect');
  const modalStyleSelect = document.getElementById('modalStyleSelect');

  let currentTariffKey = 'pro';
  let currentStyleName = 'Obsidian Dark';

  document.querySelectorAll('#tariffSelector .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tariffSelector .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const key = btn.getAttribute('data-tariff');
      const info = TARIFF_DATA[key];
      if (!info) return;
      currentTariffKey = key;

      previewTariffTitle.textContent = info.title;
      previewCashbackBadge.textContent = info.badge;
      specPrice.textContent = info.price;
      specCashback.textContent = info.cashback;
      specLimit.textContent = info.limit;
    });
  });

  document.querySelectorAll('#styleSelector .swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#styleSelector .swatch-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const style = btn.getAttribute('data-style');
      const label = btn.getAttribute('data-label');
      currentStyleName = btn.innerText.trim();

      if (configCard) configCard.setAttribute('data-style', style);
      if (previewMaterialBadge) previewMaterialBadge.textContent = label;
    });
  });

  if (holderNameInput && previewHolderName) {
    holderNameInput.addEventListener('input', () => {
      const cleaned = holderNameInput.value.toUpperCase().replace(/[^A-Z\s-]/g, '');
      holderNameInput.value = cleaned;
      previewHolderName.textContent = cleaned.trim() || 'YOUR NAME';
    });
  }

  if (networkSelect && previewNetwork) {
    networkSelect.addEventListener('change', () => {
      previewNetwork.textContent = networkSelect.value;
    });
  }

  document.getElementById('orderConfiguredCardBtn')?.addEventListener('click', () => {
    if (modalTariffSelect && TARIFF_DATA[currentTariffKey]) {
      modalTariffSelect.value = TARIFF_DATA[currentTariffKey].selectVal;
      syncCustomSelect(modalTariffSelect);
    }
    if (modalStyleSelect) {
      Array.from(modalStyleSelect.options).forEach(opt => {
        if (opt.value.includes(currentStyleName)) {
          modalStyleSelect.value = opt.value;
        }
      });
      syncCustomSelect(modalStyleSelect);
    }
    openModal('orderModal');
  });

  /* ========================================================================
     9. ДВУХРЕЖИМНЫЙ ФИНАНСОВЫЙ КАЛЬКУЛЯТОР (ВКЛАД В ₽ + КРИПТО-СТЕЙКИНГ)
     ======================================================================== */
  let calcMode = 'fiat';
  let selectedCrypto = { symbol: 'USDT', apy: 16.0, rubRate: 96.4 };

  const calcAmountRange = document.getElementById('calcAmountRange');
  const calcTermRange = document.getElementById('calcTermRange');
  const calcMonthlyRange = document.getElementById('calcMonthlyRange');
  const calcCompoundCheck = document.getElementById('calcCompoundCheck');

  const calcAmountDisplay = document.getElementById('calcAmountDisplay');
  const calcTermDisplay = document.getElementById('calcTermDisplay');
  const calcMonthlyDisplay = document.getElementById('calcMonthlyDisplay');
  const calcMinLabel = document.getElementById('calcMinLabel');
  const calcMaxLabel = document.getElementById('calcMaxLabel');
  const calcMonthlyMaxLabel = document.getElementById('calcMonthlyMaxLabel');

  const calcTotalOutput = document.getElementById('calcTotalOutput');
  const calcSecondaryOutput = document.getElementById('calcSecondaryOutput');
  const calcInvestedOutput = document.getElementById('calcInvestedOutput');
  const calcProfitOutput = document.getElementById('calcProfitOutput');
  const barPrincipal = document.getElementById('barPrincipal');
  const barInterest = document.getElementById('barInterest');
  const cryptoAssetPicker = document.getElementById('cryptoAssetPicker');

  function recalculateFinance() {
    if (!calcAmountRange || !calcTermRange || !calcMonthlyRange) return;

    const principal = parseFloat(calcAmountRange.value);
    const months = parseInt(calcTermRange.value, 10);
    const monthlyAdd = parseFloat(calcMonthlyRange.value);
    const isCompound = calcCompoundCheck ? calcCompoundCheck.checked : true;

    const annualRate = calcMode === 'fiat' ? 18.5 : selectedCrypto.apy;
    const monthlyRate = annualRate / 100 / 12;

    let total = principal;
    const totalInvested = principal + monthlyAdd * months;

    if (isCompound) {
      for (let m = 1; m <= months; m++) {
        total = total * (1 + monthlyRate) + monthlyAdd;
      }
    } else {
      const simpleProfit =
        principal * (annualRate / 100) * (months / 12) +
        monthlyAdd * months * (annualRate / 100) * ((months + 1) / 24);
      total = totalInvested + simpleProfit;
    }

    const profit = Math.max(0, total - totalInvested);
    const unit = calcMode === 'fiat' ? '₽' : selectedCrypto.symbol;
    const decimals = calcMode === 'fiat' ? 0 : (selectedCrypto.symbol === 'BTC' || selectedCrypto.symbol === 'ETH' ? 2 : 0);

    calcAmountDisplay.textContent = `${formatNumber(principal, decimals)} ${unit}`;
    calcTermDisplay.textContent = `${months} мес.`;
    calcMonthlyDisplay.textContent = `${formatNumber(monthlyAdd, decimals)} ${unit}`;

    calcTotalOutput.textContent = `${formatNumber(total, decimals)} ${unit}`;
    calcInvestedOutput.textContent = `${formatNumber(totalInvested, decimals)} ${unit}`;
    calcProfitOutput.textContent = `+${formatNumber(profit, decimals)} ${unit}`;

    if (calcMode === 'fiat') {
      calcSecondaryOutput.textContent = `Ставка: ${annualRate}% годовых • Доход застрахован`;
    } else {
      const profitRub = profit * selectedCrypto.rubRate;
      calcSecondaryOutput.textContent = `≈ +${formatNumber(profitRub, 0)} ₽ в рублёвом эквиваленте (${annualRate}% APY)`;
    }

    const principalPercent = total > 0 ? Math.min(92, Math.max(15, (totalInvested / total) * 100)) : 80;
    const interestPercent = 100 - principalPercent;
    if (barPrincipal) barPrincipal.style.width = `${principalPercent.toFixed(1)}%`;
    if (barInterest) barInterest.style.width = `${interestPercent.toFixed(1)}%`;
  }

  function configureCryptoSliders(symbol) {
    if (symbol === 'USDT' || symbol === 'TON') {
      calcAmountRange.min = '100';
      calcAmountRange.max = '100000';
      calcAmountRange.step = '100';
      calcAmountRange.value = '5000';

      calcMonthlyRange.min = '0';
      calcMonthlyRange.max = '5000';
      calcMonthlyRange.step = '50';
      calcMonthlyRange.value = '250';

      calcMinLabel.textContent = `100 ${symbol}`;
      calcMaxLabel.textContent = `100 000 ${symbol}`;
      calcMonthlyMaxLabel.textContent = `5 000 ${symbol} / мес`;
    } else {
      calcAmountRange.min = '1';
      calcAmountRange.max = '50';
      calcAmountRange.step = '1';
      calcAmountRange.value = '5';

      calcMonthlyRange.min = '0';
      calcMonthlyRange.max = '5';
      calcMonthlyRange.step = '1';
      calcMonthlyRange.value = '1';

      calcMinLabel.textContent = `1 ${symbol}`;
      calcMaxLabel.textContent = `50 ${symbol}`;
      calcMonthlyMaxLabel.textContent = `5 ${symbol} / мес`;
    }
  }

  document.querySelectorAll('.calc-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.calc-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      calcMode = tab.getAttribute('data-calc-mode');

      if (calcMode === 'crypto') {
        cryptoAssetPicker?.classList.remove('hidden');
        configureCryptoSliders(selectedCrypto.symbol);
      } else {
        cryptoAssetPicker?.classList.add('hidden');
        calcAmountRange.min = '10000';
        calcAmountRange.max = '5000000';
        calcAmountRange.step = '10000';
        calcAmountRange.value = '300000';

        calcMonthlyRange.min = '0';
        calcMonthlyRange.max = '300000';
        calcMonthlyRange.step = '5000';
        calcMonthlyRange.value = '15000';

        calcMinLabel.textContent = '10 000 ₽';
        calcMaxLabel.textContent = '5 000 000 ₽';
        calcMonthlyMaxLabel.textContent = '300 000 ₽ / мес';
      }
      recalculateFinance();
    });
  });

  document.querySelectorAll('.asset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.asset-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      selectedCrypto = {
        symbol: pill.getAttribute('data-asset'),
        apy: parseFloat(pill.getAttribute('data-apy')),
        rubRate: parseFloat(pill.getAttribute('data-rate'))
      };
      configureCryptoSliders(selectedCrypto.symbol);
      recalculateFinance();
    });
  });

  [calcAmountRange, calcTermRange, calcMonthlyRange, calcCompoundCheck].forEach(el => {
    el?.addEventListener('input', recalculateFinance);
    el?.addEventListener('change', recalculateFinance);
  });

  recalculateFinance();

  /* ========================================================================
     10. ЖИВОЙ КОНВЕРТЕР ВАЛЮТ (VORTEX SWAP)
     ======================================================================== */
  const RATES_IN_RUB = {
    RUB: 1,
    USDT: 96.4,
    TON: 524.0,
    BTC: 9140000.0
  };

  const swapFromInput = document.getElementById('swapFromInput');
  const swapFromCurrency = document.getElementById('swapFromCurrency');
  const swapToOutput = document.getElementById('swapToOutput');
  const swapToCurrency = document.getElementById('swapToCurrency');
  const swapReverseBtn = document.getElementById('swapReverseBtn');
  const swapLiveRate = document.getElementById('swapLiveRate');

  function updateSwap() {
    if (!swapFromInput || !swapFromCurrency || !swapToOutput || !swapToCurrency) return;
    const amount = Math.max(0, parseFloat(swapFromInput.value) || 0);
    const fromCur = swapFromCurrency.value;
    const toCur = swapToCurrency.value;

    const amountInRub = amount * (RATES_IN_RUB[fromCur] || 1);
    const result = amountInRub / (RATES_IN_RUB[toCur] || 1);

    const decimals = toCur === 'BTC' ? 6 : 2;
    swapToOutput.value = result.toFixed(decimals);

    const singleRate = (RATES_IN_RUB[fromCur] || 1) / (RATES_IN_RUB[toCur] || 1);
    const rateDecimals = singleRate < 0.01 ? 6 : 2;
    if (swapLiveRate) {
      swapLiveRate.textContent = `1 ${fromCur} = ${singleRate.toFixed(rateDecimals)} ${toCur}`;
    }
  }

  [swapFromInput, swapFromCurrency, swapToCurrency].forEach(el => {
    el?.addEventListener('input', updateSwap);
    el?.addEventListener('change', updateSwap);
  });

  if (swapReverseBtn) {
    swapReverseBtn.addEventListener('click', () => {
      const temp = swapFromCurrency.value;
      swapFromCurrency.value = swapToCurrency.value;
      swapToCurrency.value = temp;
      syncCustomSelect(swapFromCurrency);
      syncCustomSelect(swapToCurrency);
      updateSwap();
    });
  }

  updateSwap();

  /* ========================================================================
     11. АККОРДЕОН FAQ
     ======================================================================== */
  document.querySelectorAll('#faqAccordion .faq-item').forEach(item => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    btn?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('#faqAccordion .faq-item').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        const otherAns = other.querySelector('.faq-answer');
        if (otherAns) otherAns.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        if (answer) answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });

  /* ========================================================================
     12. МОДАЛЬНЫЕ ОКНА И ФОРМА ЗАЯВКИ
     ======================================================================== */
  function openModal(modalId) {
    hideHelpTip();
    document.querySelectorAll('.modal-backdrop.open').forEach(m => {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    });

    const target = document.getElementById(modalId);
    if (!target) return;
    target.classList.add('open');
    target.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(trigger.getAttribute('data-open-modal'));
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(closeBtn => {
    closeBtn.addEventListener('click', closeAllModals);
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeAllModals();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideHelpTip();
      closeAllModals();
    }
  });

  document.getElementById('switchToOrderModalBtn')?.addEventListener('click', () => openModal('orderModal'));

  /* Маска телефона и отправка заявки */
  const phoneInput = document.getElementById('clientPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let digits = e.target.value.replace(/\D/g, '');
      if (digits.startsWith('8')) digits = '7' + digits.slice(1);
      if (!digits.startsWith('7') && digits.length > 0) digits = '7' + digits;
      digits = digits.slice(0, 11);

      let formatted = '';
      if (digits.length > 0) formatted = '+7';
      if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
      if (digits.length >= 4) formatted += ') ' + digits.slice(4, 7);
      if (digits.length >= 7) formatted += '-' + digits.slice(7, 9);
      if (digits.length >= 9) formatted += '-' + digits.slice(9, 11);

      e.target.value = formatted;
    });
  }

  const cardOrderForm = document.getElementById('cardOrderForm');
  const orderFormContainer = document.getElementById('orderFormContainer');
  const orderSuccessScreen = document.getElementById('orderSuccessScreen');
  const orderSuccessMeta = document.getElementById('orderSuccessMeta');

  if (cardOrderForm) {
    cardOrderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameEl = document.getElementById('clientName');
      const emailEl = document.getElementById('clientEmail');

      const nameValid = nameEl.value.trim().length >= 3;
      const phoneValid = phoneInput.value.replace(/\D/g, '').length === 11;
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());

      nameEl.parentElement.classList.toggle('invalid', !nameValid);
      phoneInput.parentElement.classList.toggle('invalid', !phoneValid);
      emailEl.parentElement.classList.toggle('invalid', !emailValid);

      if (!nameValid || !phoneValid || !emailValid) {
        showToast('Пожалуйста, проверьте корректность заполнения полей');
        return;
      }

      const orderPayload = {
        id: 'VX-' + Math.floor(100000 + Math.random() * 900000),
        name: nameEl.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailEl.value.trim(),
        tariff: modalTariffSelect?.value || 'Vortex Pro',
        style: modalStyleSelect?.value || 'Obsidian Dark',
        createdAt: new Date().toLocaleString('ru-RU')
      };

      localStorage.setItem('vortex_last_application', JSON.stringify(orderPayload));

      orderFormContainer.classList.add('hidden');
      orderSuccessScreen.classList.remove('hidden');
      orderSuccessMeta.innerHTML = `
        <div><strong>Номер заявки:</strong> ${orderPayload.id}</div>
        <div><strong>Клиент:</strong> ${orderPayload.name}</div>
        <div><strong>Тариф и дизайн:</strong> ${orderPayload.tariff} • ${orderPayload.style}</div>
        <div><strong>Статус:</strong> Виртуальная карта готова к выпуску</div>
      `;

      const heroHolder = document.getElementById('heroCardHolder');
      if (heroHolder) {
        heroHolder.textContent = orderPayload.name.toUpperCase().slice(0, 22);
      }

      showToast(`Заявка ${orderPayload.id} успешно зарегистрирована!`);
    });
  }

  /* ========================================================================
     13. ПЛАВНОЕ ПОЯВЛЕНИЕ СЕКЦИЙ ПРИ СКРОЛЛЕ
     ======================================================================== */
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('visible'));
  }
});