/**
 * Pricing Logic Service
 * @param {Object} params
 * @param {number} params.pageCount
 * @param {number} params.copies
 * @param {string} params.colorMode - 'bw' or 'color'
 * @param {string} params.paperSize - 'A4', 'A3', 'Letter'
 * @param {boolean} params.binding
 * @param {string} params.printSides - 'single' or 'double'
 * @param {string} params.paperType - 'standard' or 'glossy'
 * @returns {number} calculated amount
 */
exports.calculatePrice = ({ pageCount, copies, colorMode, paperSize, binding, printSides, paperType }) => {
  // Base rate per page
  let baseRate = colorMode === 'color' ? 5 : 1; 

  // Glossy paper adds extra base cost per page
  if (paperType === 'glossy') {
    baseRate += 3;
  }
  
  // Paper size multiplier
  let sizeMultiplier = 1;
  if (paperSize === 'A3') sizeMultiplier = 2;
  else if (paperSize === 'Letter') sizeMultiplier = 1.1;

  // Double sided discount (saves physical paper)
  let sidesMultiplier = 1;
  if (printSides === 'double') {
    // Discount the total by 20% since we use half the paper
    sidesMultiplier = 0.8;
  }

  let totalAmount = pageCount * copies * baseRate * sizeMultiplier * sidesMultiplier;

  // Binding cost (optional feature)
  if (binding) {
    totalAmount += 20; // 20 rupees flat rate for binding
  }

  return Math.round(totalAmount);
};
