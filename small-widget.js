/**
 * Small Widget UI Controller
 * Handles dropdown interactions, swap direction, and conversion display
 */
(() => {
  // DOM Elements
  const widget = document.querySelector(".widget");
  const swapButton = document.querySelector(".swap");
  const coinTile = document
    .querySelector('[data-select="coin"]')
    .closest(".tile");
  const fiatTile = document
    .querySelector('[data-select="fiat"]')
    .closest(".tile");

  // Input elements
  const coinInput = document.querySelector('[data-bind="coin-value"]');
  const fiatInput = document.querySelector('[data-bind="fiat-value"]');
  const coinSuffix = document.querySelector('[data-bind="coin-suffix"]');
  const fiatSuffix = document.querySelector('[data-bind="fiat-suffix"]');

  // Select elements
  const coinSelect = document.querySelector('[data-select="coin"]');
  const fiatSelect = document.querySelector('[data-select="fiat"]');

  // State
  let selectedCoin = "USDC";
  let selectedFiat = "USD";
  let direction = "coinToFiat"; // "coinToFiat" or "fiatToCoin"

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
   * Close all open dropdowns
   */
  const closeAll = () => {
    document.querySelectorAll(".select.open").forEach((open) => {
      open.classList.remove("open");
      const trigger = open.querySelector(".select-trigger");
      trigger.setAttribute("aria-expanded", "false");
    });
  };

  /**
   * Get source and target based on direction
   */
  const getSourceInput = () => {
    return direction === "coinToFiat" ? coinInput : fiatInput;
  };

  const getTargetInput = () => {
    return direction === "coinToFiat" ? fiatInput : coinInput;
  };

  const getSourceSuffix = () => {
    return direction === "coinToFiat" ? coinSuffix : fiatSuffix;
  };

  const getTargetSuffix = () => {
    return direction === "coinToFiat" ? fiatSuffix : coinSuffix;
  };

  /**
   * Update conversion based on current direction
   */
  const updateConversion = () => {
    const sourceInput = getSourceInput();
    const targetInput = getTargetInput();
    const targetSuffix = getTargetSuffix();

    // Validate and sanitize input
    const rawValue = sourceInput.value;
    const cleanValue = FXCalculator.validateInput(rawValue);

    // Only update input if it changed (avoid cursor jump)
    if (rawValue !== cleanValue) {
      sourceInput.value = cleanValue;
    }

    if (direction === "coinToFiat") {
      // Stablecoin → Fiat
      const result = FXCalculator.calculateConversion(cleanValue, selectedFiat);
      targetInput.value = `≈ ${result.formatted.symbol}${result.formatted.netFiat}`;
      targetSuffix.textContent = selectedFiat;
    } else {
      // Fiat → Stablecoin
      const result = FXCalculator.calculateReverseConversion(
        cleanValue,
        selectedFiat,
        selectedCoin
      );
      targetInput.value = `≈ ${result.formatted.netStablecoin}`;
      targetSuffix.textContent = selectedCoin;
    }
  };

  /**
   * Swap tiles visually in the DOM
   */
  const swapTilesInDOM = () => {
    const tiles = widget.querySelectorAll(".tile");
    const firstTile = tiles[0];
    const secondTile = tiles[1];

    // Swap the tiles by moving the second tile before the swap button
    // and the first tile after the swap button
    swapButton.parentNode.insertBefore(secondTile, swapButton);
    swapButton.after(firstTile);
  };

  /**
   * Swap direction between coinToFiat and fiatToCoin
   */
  const swapDirection = () => {
    // Toggle direction
    direction = direction === "coinToFiat" ? "fiatToCoin" : "coinToFiat";

    // Perform visual swap in DOM
    swapTilesInDOM();

    // Update input states based on new direction
    if (direction === "coinToFiat") {
      // After swap: Coin is now on top (source, editable), fiat is bottom (target, readonly)
      coinInput.readOnly = false;
      coinInput.removeAttribute("readonly");
      fiatInput.readOnly = true;
      fiatInput.setAttribute("readonly", "");

      // Reset to 0
      coinInput.value = "0";
      coinSuffix.textContent = selectedCoin;

      // Update tile styles
      coinTile.classList.remove("output-tile");
      fiatTile.classList.add("output-tile");
    } else {
      // After swap: Fiat is now on top (source, editable), coin is bottom (target, readonly)
      fiatInput.readOnly = false;
      fiatInput.removeAttribute("readonly");
      coinInput.readOnly = true;
      coinInput.setAttribute("readonly", "");

      // Reset to 0
      fiatInput.value = "0";
      fiatSuffix.textContent = selectedFiat;

      // Update tile styles
      fiatTile.classList.remove("output-tile");
      coinTile.classList.add("output-tile");
    }

    // Recalculate with new direction
    updateConversion();
  };

  /**
   * Bind dropdown select behavior
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
        const symbol = opt.dataset.symbol || "";
        label.textContent = value;
        icon.src = iconSrc;
        icon.alt = value;
        onChange({ value, icon: iconSrc, symbol });
        closeAll();
      });
    });
  };

  /**
   * Bind input events for validation and calculation
   */
  const bindInputEvents = (input) => {
    input.addEventListener("input", () => {
      if (!input.readOnly) {
        updateConversion();
      }
    });

    input.addEventListener("paste", (evt) => {
      if (input.readOnly) return;
      evt.preventDefault();
      const pastedText = evt.clipboardData.getData("text");
      const cleaned = FXCalculator.validateInput(pastedText);
      input.value = cleaned;
      updateConversion();
    });

    input.addEventListener("keydown", (evt) => {
      if (input.readOnly) return;

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
      const isDecimal = evt.key === "." && !input.value.includes(".");

      if (!isNumber && !isDecimal && !allowedKeys.includes(evt.key)) {
        if (!(evt.ctrlKey || evt.metaKey)) {
          evt.preventDefault();
        }
      }
    });
  };

  // Bind coin select
  bindSelect(coinSelect, ({ value }) => {
    selectedCoin = value;
    // Update suffix based on direction
    if (direction === "coinToFiat") {
      coinSuffix.textContent = value;
    } else {
      // In fiatToCoin mode, coin is the output
      // Suffix will be updated in updateConversion
    }
    updateConversion();
  });

  // Bind fiat select
  bindSelect(fiatSelect, ({ value }) => {
    selectedFiat = value;
    // Update suffix based on direction
    if (direction === "fiatToCoin") {
      fiatSuffix.textContent = value;
    } else {
      // In coinToFiat mode, fiat is the output
      // Suffix will be updated in updateConversion
    }
    updateConversion();
  });

  // Bind input events to both inputs
  bindInputEvents(coinInput);
  bindInputEvents(fiatInput);

  // Swap button click handler
  swapButton.addEventListener("click", (evt) => {
    evt.stopPropagation();
    swapDirection();
  });

  // Close dropdowns on outside click
  window.addEventListener("click", closeAll);

  // Initialize
  fiatTile.classList.add("output-tile");
  coinInput.value = "0";
  coinSuffix.textContent = selectedCoin;
  updateConversion();
})();
