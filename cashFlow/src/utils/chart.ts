export function getChartDomain([dataMin, dataMax]: readonly [number, number]): [number, number] {
  if (dataMin === Infinity || dataMax === -Infinity || dataMin == null || dataMax == null) return [0, 0];
  
  const diff = dataMax - dataMin;
  const magnitude = Math.max(Math.abs(dataMax), Math.abs(dataMin));
  
  // Padding is 5% of magnitude, or 10% of diff, whichever is larger, but not too crazy
  let padding = Math.max(magnitude * 0.05, diff * 0.1);
  
  // Ensure we don't go below 0 if all data is positive
  const minVal = dataMin >= 0 ? Math.max(0, dataMin - padding) : dataMin - padding;
  
  return [minVal, dataMax + padding];
}
