export function normalizeLogin(value:string){
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9._-]/g,'').slice(0,32);
}
export function isValidLogin(value:string){
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(normalizeLogin(value));
}
export function syntheticAuthEmail(id:string){
  return `u.${id}@auth.conexaopaulista.invalid`;
}
