/**
 * FX Calculator Module
 * Handles stablecoin to fiat conversion with fees and spread calculation
 * per Ripe's pricing model.
 */

const FXCalculator = (() => {
  // Configuration - Mock rates per instructions.md
  const CONFIG = {
    // Interbank rates: 1 stablecoin = X fiat (best market rate)
    interbankRates: {
      PHP: 59.0,
      USD: 1.0,
    },
    // Customer rates: after spread (what user actually gets)
    customerRates: {
      PHP: 58.5,
      USD: 0.9975,
    },
    // Ripe transaction fee: 0.5% of stablecoin amount
    ripeFeePercent: 0.005,
    // Network fee: flat $2 equivalent
    networkFeeUSD: 2.0,
    // Fiat symbols
    symbols: {
      PHP: "₱",
      USD: "$",
    },
    // Limits
    maxAmount: 100000,
    minAmount: 0,
  };

  /**
   * Sanitize and parse input amount
   * @param {string|number} input - Raw input value
   * @returns {number} - Sanitized numeric value
   */
  const sanitizeAmount = (input) => {
    if (input === null || input === undefined || input === "") {
      return 0;
    }

    // Convert to string and remove non-numeric chars except decimal
    let sanitized = String(input).replace(/[^0-9.]/g, "");

    // Handle multiple decimal points - keep only first
    const parts = sanitized.split(".");
    if (parts.length > 2) {
      sanitized = parts[0] + "." + parts.slice(1).join("");
    }

    const amount = parseFloat(sanitized);

    // Edge cases
    if (isNaN(amount) || amount < CONFIG.minAmount) {
      return 0;
    }
    if (amount > CONFIG.maxAmount) {
      return CONFIG.maxAmount;
    }

    return amount;
  };

  /**
   * Format number with locale-aware formatting
   * @param {number} value - Number to format
   * @param {number} decimals - Decimal places (default 2)
   * @returns {string} - Formatted string
   */
  const formatNumber = (value, decimals = 2) => {
    if (!isFinite(value) || isNaN(value)) {
      return "0.00";
    }
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  /**
   * Get currency symbol for a fiat code
   * @param {string} fiatCode - Currency code (PHP, USD)
   * @returns {string} - Currency symbol
   */
  const getSymbol = (fiatCode) => {
    return CONFIG.symbols[fiatCode] || "$";
  };

  /**
   * Get network fee converted to target fiat
   * @param {string} targetFiat - Target fiat currency code
   * @returns {number} - Network fee in target fiat
   */
  const getNetworkFeeInFiat = (targetFiat) => {
    // Network fee is $2 USD, convert to target fiat
    const usdToFiat = CONFIG.customerRates[targetFiat] || 1;
    // For PHP, we need the PHP rate directly
    if (targetFiat === "PHP") {
      return CONFIG.networkFeeUSD * CONFIG.customerRates.PHP;
    }
    return CONFIG.networkFeeUSD;
  };

  /**
   * Calculate full conversion breakdown
   * @param {string|number} stablecoinAmount - Amount of stablecoin to convert
   * @param {string} targetFiat - Target fiat currency (PHP, USD)
   * @returns {Object} - Conversion breakdown
   */
  const calculateConversion = (stablecoinAmount, targetFiat = "USD") => {
    const amount = sanitizeAmount(stablecoinAmount);
    const fiat = targetFiat.toUpperCase();

    // Get rates
    const interbankRate = CONFIG.interbankRates[fiat] || 1;
    const customerRate = CONFIG.customerRates[fiat] || 1;

    // Calculate gross fiat at customer rate
    const grossFiat = amount * customerRate;

    // Ripe transaction fee (0.5% of stablecoin amount, converted to fiat)
    const ripeFeeStablecoin = amount * CONFIG.ripeFeePercent;
    const ripeFee = ripeFeeStablecoin * customerRate;

    // Network fee in target fiat
    const networkFee = getNetworkFeeInFiat(fiat);

    // FX spread percentage
    const fxSpreadPercent =
      ((interbankRate - customerRate) / interbankRate) * 100;

    // Net fiat received after all deductions
    let netFiat = grossFiat - ripeFee - networkFee;

    // Edge case: net cannot be negative
    if (netFiat < 0) {
      netFiat = 0;
    }

    return {
      // Input
      stablecoinAmount: amount,
      targetFiat: fiat,

      // Rates
      interbankRate,
      customerRate,

      // Breakdown
      grossFiat,
      ripeFee,
      ripeFeePercent: CONFIG.ripeFeePercent * 100,
      networkFee,
      networkFeeUSD: CONFIG.networkFeeUSD,
      fxSpreadPercent,

      // Final result
      netFiat,

      // Formatted values for display
      formatted: {
        grossFiat: formatNumber(grossFiat),
        ripeFee: formatNumber(ripeFee),
        networkFee: formatNumber(networkFee),
        netFiat: formatNumber(netFiat),
        fxSpreadPercent: formatNumber(fxSpreadPercent, 2),
        symbol: getSymbol(fiat),
      },
    };
  };

  /**
   * Quick net fiat calculation (for small widget)
   * @param {string|number} stablecoinAmount - Amount of stablecoin
   * @param {string} targetFiat - Target fiat currency
   * @returns {string} - Formatted net fiat with symbol
   */
  const getNetFiat = (stablecoinAmount, targetFiat = "USD") => {
    const result = calculateConversion(stablecoinAmount, targetFiat);
    return `≈ ${result.formatted.symbol}${result.formatted.netFiat}`;
  };

  /**
   * Reverse calculation: Fiat to Stablecoin
   * Given a fiat amount, calculate how much stablecoin is needed
   * @param {string|number} fiatAmount - Amount of fiat to convert
   * @param {string} sourceFiat - Source fiat currency (PHP, USD)
   * @param {string} targetCoin - Target stablecoin (USDC, USDT)
   * @returns {Object} - Conversion breakdown
   */
  const calculateReverseConversion = (
    fiatAmount,
    sourceFiat = "USD",
    targetCoin = "USDC"
  ) => {
    const amount = sanitizeAmount(fiatAmount);
    const fiat = sourceFiat.toUpperCase();

    // Get rates (inverse for reverse conversion)
    const customerRate = CONFIG.customerRates[fiat] || 1;
    const interbankRate = CONFIG.interbankRates[fiat] || 1;

    // Network fee in source fiat
    const networkFee = getNetworkFeeInFiat(fiat);

    // Amount after network fee deduction
    const afterNetworkFee = Math.max(0, amount - networkFee);

    // Gross stablecoin before Ripe fee
    // fiat = stablecoin * customerRate * (1 - ripeFee)
    // stablecoin = fiat / (customerRate * (1 - ripeFee))
    const effectiveRate = customerRate * (1 - CONFIG.ripeFeePercent);
    const grossStablecoin = afterNetworkFee / effectiveRate;

    // Ripe fee in stablecoin
    const ripeFeeStablecoin = grossStablecoin * CONFIG.ripeFeePercent;
    const ripeFee = ripeFeeStablecoin * customerRate;

    // Net stablecoin received
    let netStablecoin = grossStablecoin - ripeFeeStablecoin;

    // Edge case: net cannot be negative
    if (netStablecoin < 0 || !isFinite(netStablecoin)) {
      netStablecoin = 0;
    }

    // FX spread percentage
    const fxSpreadPercent =
      ((interbankRate - customerRate) / interbankRate) * 100;

    return {
      // Input
      fiatAmount: amount,
      sourceFiat: fiat,
      targetCoin,

      // Rates
      interbankRate,
      customerRate,

      // Breakdown
      grossStablecoin,
      ripeFee,
      ripeFeeStablecoin,
      ripeFeePercent: CONFIG.ripeFeePercent * 100,
      networkFee,
      networkFeeUSD: CONFIG.networkFeeUSD,
      fxSpreadPercent,

      // Final result
      netStablecoin,

      // Formatted values for display
      formatted: {
        grossStablecoin: formatNumber(grossStablecoin),
        ripeFee: formatNumber(ripeFee),
        networkFee: formatNumber(networkFee),
        netStablecoin: formatNumber(netStablecoin),
        fxSpreadPercent: formatNumber(fxSpreadPercent, 2),
        symbol: getSymbol(fiat),
      },
    };
  };

  /**
   * Quick net stablecoin calculation (for small widget reverse mode)
   * @param {string|number} fiatAmount - Amount of fiat
   * @param {string} sourceFiat - Source fiat currency
   * @param {string} targetCoin - Target stablecoin
   * @returns {string} - Formatted net stablecoin
   */
  const getNetStablecoin = (
    fiatAmount,
    sourceFiat = "USD",
    targetCoin = "USDC"
  ) => {
    const result = calculateReverseConversion(
      fiatAmount,
      sourceFiat,
      targetCoin
    );
    return `≈ ${result.formatted.netStablecoin}`;
  };

  /**
   * Validate input string for numeric entry
   * @param {string} input - Input string to validate
   * @returns {string} - Cleaned input string
   */
  const validateInput = (input) => {
    if (!input) return "";

    // Remove non-numeric except decimal
    let cleaned = input.replace(/[^0-9.]/g, "");

    // Only allow one decimal point
    const decimalIndex = cleaned.indexOf(".");
    if (decimalIndex !== -1) {
      cleaned =
        cleaned.slice(0, decimalIndex + 1) +
        cleaned.slice(decimalIndex + 1).replace(/\./g, "");
    }

    // Limit decimal places to 6
    const parts = cleaned.split(".");
    if (parts[1] && parts[1].length > 6) {
      cleaned = parts[0] + "." + parts[1].slice(0, 6);
    }

    return cleaned;
  };

  // Public API
  return {
    calculateConversion,
    calculateReverseConversion,
    getNetFiat,
    getNetStablecoin,
    sanitizeAmount,
    formatNumber,
    validateInput,
    getSymbol,
    CONFIG,
  };
})();

// Export for module systems if available
if (typeof module !== "undefined" && module.exports) {
  module.exports = FXCalculator;
}
