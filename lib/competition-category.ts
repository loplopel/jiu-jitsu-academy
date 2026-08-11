export type Sex = 'Masculino' | 'Feminino' | string;

export function calculateAge(birthDate?: string | null, reference = new Date()): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  let age = reference.getFullYear() - y;
  const month = reference.getMonth() + 1;
  const day = reference.getDate();
  if (month < m || (month === m && day < d)) age--;
  return age >= 0 ? age : null;
}

export function ageDivision(age: number | null): string | null {
  if (age === null) return null;
  if (age >= 4 && age <= 5) return 'Pré Mirim';
  if (age >= 6 && age <= 7) return 'Mirim';
  if (age >= 8 && age <= 9) return 'Infantil A';
  if (age >= 10 && age <= 11) return 'Infantil B';
  if (age >= 12 && age <= 13) return 'Infanto A';
  if (age >= 14 && age <= 15) return 'Infanto B';
  if (age >= 16 && age <= 17) return 'Juvenil';
  if (age >= 18 && age <= 29) return 'Adulto';
  if (age >= 30 && age <= 35) return 'Master 1';
  if (age >= 36 && age <= 40) return 'Master 2';
  if (age >= 41 && age <= 45) return 'Master 3';
  if (age >= 46 && age <= 50) return 'Master 4';
  if (age >= 51 && age <= 55) return 'Master 5';
  if (age >= 56) return 'Master 6';
  return null;
}

type WeightLimit = [label: string, max: number | null];
const MALE_JUVENILE: WeightLimit[] = [['Galo',53.5],['Pluma',59],['Pena',64],['Leve',69],['Médio',74.3],['Meio-pesado',79.3],['Pesado',84.3],['Super-pesado',89.5],['Pesadíssimo',null]];
const MALE_ADULT: WeightLimit[] = [['Galo',57.5],['Pluma',64],['Pena',70],['Leve',76],['Médio',82.3],['Meio-pesado',88.3],['Pesado',94.3],['Super-pesado',100.5],['Pesadíssimo',null]];
const FEMALE_JUVENILE: WeightLimit[] = [['Galo',44],['Pluma',48],['Pena',52],['Leve',56],['Médio',60],['Meio-pesado',64],['Pesado',68],['Super-pesado',72.5],['Pesadíssimo',null]];
const FEMALE_ADULT: WeightLimit[] = [['Galo',48.5],['Pluma',53.5],['Pena',58.5],['Leve',64],['Médio',69],['Meio-pesado',74],['Pesado',79.3],['Super-pesado',84.3],['Pesadíssimo',null]];

export function weightDivision(age: number | null, sex?: Sex | null, weight?: number | null): string | null {
  if (age === null || age < 16 || weight === null || weight === undefined || !Number.isFinite(weight)) return null;
  const female = String(sex || '').toLowerCase().startsWith('f');
  const male = String(sex || '').toLowerCase().startsWith('m');
  if (!female && !male) return null;
  const juvenile = age <= 17;
  const limits = female ? (juvenile ? FEMALE_JUVENILE : FEMALE_ADULT) : (juvenile ? MALE_JUVENILE : MALE_ADULT);
  return limits.find(([, max]) => max === null || weight <= max)?.[0] || null;
}

export function competitionCategory(birthDate?: string | null, sex?: Sex | null, weight?: number | null, reference = new Date()): {age: number | null; ageGroup: string | null; weightClass: string | null; label: string | null} {
  const age = calculateAge(birthDate, reference);
  const ageGroup = ageDivision(age);
  const weightClass = weightDivision(age, sex, weight);
  return { age, ageGroup, weightClass, label: ageGroup ? (weightClass ? `${ageGroup} - ${weightClass}` : ageGroup) : null };
}

export function allowedBelts(age: number | null): string[] {
  if (age === null) return [];
  if (age >= 4 && age <= 7) return ['Branca','Cinza'];
  if (age >= 8 && age <= 15) return ['Branca','Cinza','Amarela','Laranja','Verde'];
  if (age >= 16 && age <= 17) return ['Branca','Azul','Roxa'];
  if (age >= 18) return ['Branca','Azul','Roxa','Marrom','Preta'];
  return [];
}
