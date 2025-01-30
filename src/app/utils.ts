export const termToSortableInteger: (term: string) => number = (term) => {
  const [semester, year] = term.split(' ');
  const yearNum = parseInt(year);
  const semesterNum = semester === 'Spring' ? 1 : semester === 'Summer' ? 2 : 3;
  return yearNum * 10 + semesterNum;
}