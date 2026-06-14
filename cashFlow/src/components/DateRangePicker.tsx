import React from "react";

type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
};

export default function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangePickerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>From</label>
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => onStartDateChange(e.target.value)}
          style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', cursor: 'pointer' }}
        />
      </div>
      <span style={{ color: '#cbd5e1' }}>|</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>To</label>
        <input 
          type="date" 
          value={endDate} 
          onChange={(e) => onEndDateChange(e.target.value)}
          min={startDate}
          style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}
