/**
 * Pricing Logic Service
 * @param {Object} params
 * @param {number} params.pageCount
 * @param {number} params.copies
 * @param {string} params.colorMode - 'bw' or 'color'
 * @param {string} params.paperSize - 'A4', 'A3', 'Letter'
 * @param {boolean} params.binding
 * @returns {number} calculated amount
 */
exports.calculatePrice = ({ pageCount, copies, colorMode, paperSize, binding }) => {
  // Base rate per page
  const baseRate = colorMode === 'color' ? 5 : 1; 
  
  // Paper size multiplier
  let sizeMultiplier = 1;
  if (paperSize === 'A3') sizeMultiplier = 2;
  else if (paperSize === 'Letter') sizeMultiplier = 1.1;

  let totalAmount = pageCount * copies * baseRate * sizeMultiplier;

  // Binding cost (optional feature)
  if (binding) {
    totalAmount += 20; // 20 rupees flat rate for binding
  }

  return Math.round(totalAmount);
};
