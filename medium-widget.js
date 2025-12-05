/**
 * Medium Widget Controller
 * Uses FXCalculator for all math; handles selects, presets, and live updates.
 */
(() => {
  // Elements
  const amountInput = document.querySelector('[data-bind="coin-value"]');
  const coinSuffix = document.querySelector('[data-bind="coin-suffix"]');
  const netFiatEl = document.querySelector('[data-bind="net-fiat"]');
  const grossEl = document.querySelector('[data-bind="gross"]');
  const ripeFeeEl = document.querySelector('[data-bind="ripe-fee"]');
  const networkFeeEl = document.querySelector('[data-bind="network-fee"]');
  const fxSpreadEl = document.querySelector('[data-bind="fx-spread"]');
  const netEl = document.querySelector('[data-bind="net"]');
  const pills = document.querySelectorAll(".pill");

  const coinSelect = document.querySelector('[data-select="coin"]');
  const fiatSelect = document.querySelector('[data-select="fiat"]');

  // State
  const state = {
    coin: "USDC",
    fiat: "PHP",
    amount: "1000",
  };

  /**
   * Toggle dropdown open/close
   */
  const toggleSelect = (select) => {
    const isOpen = select.classList.contains("open");
    select.classList.toggle("open", !isOpen);
    const trigger = select.querySelector(".select-trigger");
    trigger.setAttribute("aria-expanded", String(!isOpen));
  };

  /**
   * Close all selects
   */
  const closeAll = () => {
    document.querySelectorAll(".select.open").forEach((open) => {
      open.classList.remove("open");
      const trigger = open.querySelector(".select-trigger");
      trigger.setAttribute("aria-expanded", "false");
    });
  };

  /**
   * Bind select component behavior
   */
  const bindSelect = (select, onChange) => {
    const trigger = select.querySelector(".select-trigger");
    const label = trigger.querySelector(".select-label");
    const icon = trigger.querySelector(".select-icon");
    const options = select.querySelectorAll(".select-option");

    trigger.addEventListener("click", (evt) => {
      evt.stopPropagation();
      closeAll();
      toggleSelect(select);
    });

    options.forEach((opt) => {
      opt.addEventListener("click", (evt) => {
        evt.stopPropagation();
        const value = opt.dataset.value;
        const iconSrc = opt.dataset.icon;
        label.textContent = value;
        icon.src = iconSrc;
        icon.alt = value;
        onChange({
          value,
          icon: iconSrc,
          symbol: opt.dataset.symbol || "",
        });
        closeAll();
      });
    });
  };

  /**
   * Update UI from state
   */
  const updateView = () => {
    const cleanAmount = FXCalculator.validateInput(state.amount);
    if (cleanAmount !== state.amount) {
      state.amount = cleanAmount;
      amountInput.value = cleanAmount;
    }

    const result = FXCalculator.calculateConversion(cleanAmount, state.fiat);
    const symbol = result.formatted.symbol;

    netFiatEl.textContent = `≈ ${symbol}${result.formatted.netFiat}`;
    grossEl.textContent = `${symbol}${result.formatted.grossFiat}`;
    ripeFeeEl.textContent = `- ${symbol}${result.formatted.ripeFee}`;
    networkFeeEl.textContent = `- ${symbol}${result.formatted.networkFee}`;
    fxSpreadEl.textContent = `${result.formatted.fxSpreadPercent}% spread`;
    netEl.textContent = `≈ ${symbol}${result.formatted.netFiat}`;

    coinSuffix.textContent = state.coin;
  };

  /**
   * Bind amount input interactions
   */
  const bindAmountInput = () => {
    amountInput.addEventListener("input", () => {
      state.amount = amountInput.value;
      updateView();
    });

    amountInput.addEventListener("paste", (evt) => {
      evt.preventDefault();
      const pasted = evt.clipboardData.getData("text");
      state.amount = FXCalculator.validateInput(pasted);
      amountInput.value = state.amount;
      updateView();
    });

    amountInput.addEventListener("keydown", (evt) => {
      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
        "Home",
        "End",
      ];
      const isNumber = /^[0-9]$/.test(evt.key);
      const isDecimal = evt.key === "." && !amountInput.value.includes(".");

      if (!isNumber && !isDecimal && !allowedKeys.includes(evt.key)) {
        if (!(evt.ctrlKey || evt.metaKey)) {
          evt.preventDefault();
        }
      }
    });
  };

  // Bind selects
  bindSelect(coinSelect, ({ value }) => {
    state.coin = value;
    coinSuffix.textContent = value;
    updateView();
  });

  bindSelect(fiatSelect, ({ value }) => {
    state.fiat = value;
    updateView();
  });

  // Quick amount pills
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      state.amount = pill.dataset.amount || "0";
      amountInput.value = state.amount;
      updateView();
    });
  });

  // Close dropdowns on outside click
  window.addEventListener("click", closeAll);

  // Init
  bindAmountInput();
  updateView();
})();
