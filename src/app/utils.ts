export const termToSortableInteger: (term: string) => number = (term) => {
  const [semester, year] = term.split(' ');
  const yearNum = parseInt(year);
  const semesterNum = semester === 'Spring' ? 1 : semester === 'Summer' ? 2 : 3;
  return yearNum * 10 + semesterNum;
}

export const hexToRgba: (hex: string, opacity: number) => string = (hex, opacity) => {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}