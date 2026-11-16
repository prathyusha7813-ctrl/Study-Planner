// Turn a 'YYYY-MM-DD' string into a Date at UTC midnight.
const toUtcDate = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const todayYmd = () => new Date().toISOString().slice(0, 10);

const addDays = (date, days) => new Date(date.getTime() + days * 86400000);

module.exports = { toUtcDate, todayYmd, addDays };
