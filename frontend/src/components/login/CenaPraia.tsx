// Cena "manhã calma" do login (docs/design/telas/componentes/SceneVar.dc.html e SceneMobile.dc.html).
// Formas chapadas, sem contorno: o Papo é o único elemento com traço forte (decisoes-de-design, princípio 2).
import { Personagem } from '@/components/Personagem'
import type { Pose } from '@/lib/personagens'

const NUVEM =
  'M30 80 C 8 80 0 58 16 46 C 12 24 38 12 58 22 C 66 4 102 -2 118 18 C 132 8 160 12 162 36 C 186 34 200 56 186 72 C 182 78 176 80 168 80 Z'

/** Proporção (largura / altura) de cada PNG usado na cena. */
const PROPORCAO: Partial<Record<Pose, string>> = {
  'papo-cadeira-acenando': '608 / 576',
  'papo-animado': '511 / 570',
  'papo-preocupado': '491 / 618',
}

interface CenaProps {
  pose: Pose
  fala: string
}

function Mascote({ pose, fala, compacta }: CenaProps & { compacta: boolean }) {
  return (
    <div
      className="absolute -translate-x-1/2"
      style={
        compacta
          ? { left: '36%', bottom: '3%', height: '72%', aspectRatio: PROPORCAO[pose] }
          : { left: '28%', bottom: '6%', height: '58%', aspectRatio: PROPORCAO[pose] }
      }
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-[10%] -bottom-[3%] h-[7%] rounded-[50%]"
        style={{ background: compacta ? 'rgba(120, 90, 40, 0.18)' : 'rgba(20, 32, 40, 0.16)' }}
      />
      <Personagem pose={pose} className="relative size-full object-contain" />
      {/* A fala repete o estado que o formulário já anuncia (banner, botão): fica fora do leitor de tela. */}
      <div
        aria-hidden="true"
        className={
          compacta
            ? 'absolute left-[82%] top-0 w-max max-w-[148px] rounded-[14px] bg-branco px-3 py-2 text-sm leading-[1.3] font-bold text-tinta shadow-[0_6px_18px_rgba(20,32,40,0.16)]'
            : 'absolute left-[84%] top-[2%] w-max max-w-[220px] rounded-2xl bg-branco px-3.5 py-2.5 text-[15px] leading-[1.35] font-bold text-tinta shadow-[0_8px_24px_rgba(20,32,40,0.16)]'
        }
      >
        <div className={`absolute size-3 rotate-45 rounded-[2px] bg-branco ${compacta ? '-left-[5px] top-3.5' : '-left-1.5 top-[18px]'}`} />
        <span className="relative">{fala}</span>
      </div>
    </div>
  )
}

/** Desktop: cena em tela cheia; o sol fica à esquerda, longe do cartão. */
export function CenaPraia({ pose, fala }: CenaProps) {
  return (
    <div className="absolute inset-x-0 top-0 h-[max(100vh,760px)] overflow-hidden bg-ceu" data-testid="cena-praia">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className="absolute inset-0 block size-full">
        <defs>
          <path id="nuvem" d={NUVEM} />
        </defs>
        <rect width="1440" height="900" fill="var(--jnc-ceu)" />
        <rect y="330" width="1440" height="140" fill="var(--jnc-ceu-claro)" />
        <circle cx="230" cy="140" r="92" fill="var(--jnc-sol-halo)" fillOpacity="0.45" />
        <circle cx="230" cy="140" r="58" fill="var(--jnc-sol)" />
        <use href="#nuvem" transform="translate(400 70) scale(0.95)" fill="#FFFFFF" stroke="#EEF9FE" strokeWidth="2" />
        <use href="#nuvem" transform="translate(640 210) scale(0.6)" fill="#FFFFFF" fillOpacity="0.9" />
        <use href="#nuvem" transform="translate(40 250) scale(0.5)" fill="#FFFFFF" fillOpacity="0.85" />
        <path d="M0 470 Q 40 463 80 470 T 160 470 T 240 470 T 320 470 T 400 470 T 480 470 T 560 470 T 640 470 T 720 470 T 800 470 T 880 470 L 1440 470 V 900 H 0 Z" fill="var(--jnc-mar-1)" />
        <path d="M0 535 Q 60 524 120 535 T 240 535 T 360 535 T 480 535 T 600 535 T 720 535 T 840 535 L 1440 535 V 900 H 0 Z" fill="var(--jnc-mar-2)" />
        <path d="M0 596 Q 80 584 160 596 T 320 596 T 480 596 T 640 596 T 800 596 L 1440 596 V 900 H 0 Z" fill="var(--jnc-mar-3)" />
        <path d="M0 640 C 300 606 760 668 1440 622 V 700 H 0 Z" fill="var(--jnc-espuma)" />
        <path d="M0 652 C 300 618 760 680 1440 634 V 712 H 0 Z" fill="#FFFFFF" fillOpacity="0.75" />
        <path d="M0 664 C 300 630 760 692 1440 646 V 900 H 0 Z" fill="var(--jnc-areia)" />
        <path d="M0 676 C 300 642 760 704 1440 658" fill="none" stroke="var(--jnc-areia-risco)" strokeWidth="6" strokeLinecap="round" />
        <path d="M0 900 V 822 C 400 794 900 850 1440 804 V 900 Z" fill="var(--jnc-areia-escura)" />
      </svg>
      <Mascote pose={pose} fala={fala} compacta={false} />
    </div>
  )
}

/**
 * Mobile: cena no topo, não fixa (o teclado não esconde o formulário). Abaixo
 * da linha do mar a cena é transparente: a areia é o fundo da página inteira.
 */
export function CenaPraiaMobile({ pose, fala }: CenaProps) {
  return (
    <div className="relative h-[clamp(220px,38svh,300px)] w-full" data-testid="cena-praia-mobile">
      <svg viewBox="0 0 375 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className="absolute inset-0 block size-full">
        <defs>
          <path id="nuvem-m" d={NUVEM} />
        </defs>
        <path d="M-200 -200 H 575 V 248 C 450 238 300 254 187 248 C 80 242 0 252 -200 246 Z" fill="var(--jnc-ceu)" />
        <rect x="-200" y="110" width="775" height="42" fill="var(--jnc-ceu-claro)" />
        <circle cx="330" cy="50" r="28" fill="var(--jnc-sol-halo)" fillOpacity="0.45" />
        <circle cx="330" cy="50" r="18" fill="var(--jnc-sol)" />
        <use href="#nuvem-m" transform="translate(150 22) scale(0.5)" fill="#FFFFFF" stroke="#EEF9FE" strokeWidth="2" />
        <use href="#nuvem-m" transform="translate(4 104) scale(0.36)" fill="#FFFFFF" fillOpacity="0.9" />
        <path d="M-200 152 H 0 Q 25 148 50 152 T 100 152 T 150 152 T 200 152 T 250 152 T 300 152 T 350 152 T 400 152 H 575 V 260 H -200 Z" fill="var(--jnc-mar-1)" />
        <path d="M-200 186 H 0 Q 35 181 70 186 T 140 186 T 210 186 T 280 186 T 350 186 T 420 186 H 575 V 260 H -200 Z" fill="var(--jnc-mar-2)" />
        <path d="M-200 214 H 0 Q 45 208 90 214 T 180 214 T 270 214 T 360 214 T 450 214 H 575 V 260 H -200 Z" fill="var(--jnc-mar-3)" />
        <path d="M-200 236 H 0 C 110 228 250 244 375 232 H 575 V 252 H -200 Z" fill="var(--jnc-espuma)" />
        <path d="M-200 242 H 0 C 110 234 250 250 375 238 H 575 V 247 C 450 244 300 254 187 248 C 80 242 0 252 -200 246 Z" fill="#FFFFFF" fillOpacity="0.8" />
      </svg>
      <Mascote pose={pose} fala={fala} compacta />
    </div>
  )
}
