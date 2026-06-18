export function getChartDomain(dataMin: number, dataMax: number) {
  if (dataMin === Infinity || dataMax === -Infinity) return [0, 'auto'];
  
  const diff = dataMax - dataMin;
  const magnitude = Math.max(Math.abs(dataMax), Math.abs(dataMin));
  
  const padding = diff < magnitude * 0.05 ? magnitude * 0.1 : diff * 0.5;
  
  const minVal = dataMin >= 0 ? Math.max(0, dataMin - padding) : dataMin - padding;
  
  return [minVal, dataMax + padding];
}
