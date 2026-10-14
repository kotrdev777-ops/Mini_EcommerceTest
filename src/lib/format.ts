export function baht(satang: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(satang / 100);
}

export function priceFromInput(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('ราคาต้องเป็นตัวเลขไม่ติดลบ และมีทศนิยมไม่เกิน 2 ตำแหน่ง');
  const [whole, fraction = ''] = text.split('.');
  const satang = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(satang) || satang > 2_000_000_000) throw new Error('ราคาเกินขอบเขตที่รองรับ');
  return satang;
}
