export const getGiftCadreByAmount = (amount) => {
  const value = parseFloat(amount);
  if (value < 5000) return 'Basic';
  if (value >= 5000 && value < 10000) return 'Economy';
  if (value >= 10000 && value < 25000) return 'Standard';
  if (value >= 25000 && value < 50000) return 'Premium';
  if (value >= 50000 && value < 75000) return 'Elite';
  if (value >= 75000 && value < 100000) return 'Luxury';
  return 'Platinum'; // 1L+
};
