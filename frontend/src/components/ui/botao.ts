import { cva, type VariantProps } from 'class-variance-authority'

/** Botões do design: primário verde, secundário com contorno, perigo coral, texto. Alvo mínimo de 48px. */
export const botao = cva(
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-botao px-[18px] text-[15px] whitespace-nowrap no-underline disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:size-[18px] [&_svg]:shrink-0',
  {
    variants: {
      tipo: {
        primario: 'border-0 bg-verde-700 px-5 font-bold text-branco hover:brightness-110',
        secundario: 'border-[1.5px] border-borda-botao bg-branco font-semibold text-tinta hover:bg-fundo-app',
        perigo: 'border-0 bg-despesa px-5 font-bold text-branco hover:brightness-110',
        texto: 'border-0 bg-transparent px-2 font-semibold text-despesa hover:bg-despesa-bg',
      },
    },
    defaultVariants: { tipo: 'primario' },
  },
)

export type BotaoProps = VariantProps<typeof botao>

/** Botão só com ícone, 44×44. */
export const botaoIcone =
  'inline-flex size-11 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent text-texto-3 hover:bg-fundo-app disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-[18px]'
