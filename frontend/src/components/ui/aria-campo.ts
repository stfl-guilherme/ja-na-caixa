/** Atributos de acessibilidade para ligar o input à mensagem de erro do Field. */
export function ariaCampo(id: string, erros?: string[]) {
  return erros?.length ? { 'aria-invalid': true, 'aria-describedby': `${id}-erro` } : {}
}
