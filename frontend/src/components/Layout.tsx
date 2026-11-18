// Layout das telas internas: menu lateral (≥ 720px) ou barra inferior + "+" (< 720px),
// mês global na URL, modal de transação e aviso disponíveis em qualquer tela.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import type { Transacao } from '@/api/types'
import { useLogout, useUsuario } from '@/auth/useAuth'
import { Aviso } from '@/components/Aviso'
import { CategoriaModal } from '@/components/CategoriaModal'
import { ExcluirTransacaoDialog } from '@/components/ExcluirTransacaoDialog'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { InterfaceContext, type InterfaceApp } from '@/components/layout/contexto'
import { TransacaoModal } from '@/components/TransacaoModal'
import { useTelaLarga } from '@/hooks/useTelaLarga'

const DURACAO_AVISO_MS = 5000

export function Layout() {
  const larga = useTelaLarga()
  const { data: usuario } = useUsuario()
  const logout = useLogout()
  const navigate = useNavigate()

  const [modal, setModal] = useState<{ aberto: boolean; transacao?: Transacao }>({ aberto: false })
  const [excluindo, setExcluindo] = useState<Transacao | null>(null)
  const [criandoCategoria, setCriandoCategoria] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocultarPapoDoMenu, setOcultarPapoDoMenu] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined)

  const avisar = useCallback((mensagem: string) => {
    clearTimeout(temporizador.current)
    setAviso(mensagem)
    temporizador.current = setTimeout(() => setAviso(null), DURACAO_AVISO_MS)
  }, [])
  useEffect(() => () => clearTimeout(temporizador.current), [])

  const contexto = useMemo<InterfaceApp>(
    () => ({
      // Abrir um modal fecha o aviso anterior, para ele não cobrir os campos no celular.
      abrirTransacao: (transacao) => {
        setAviso(null)
        setModal({ aberto: true, transacao })
      },
      abrirCategoria: () => {
        setAviso(null)
        setCriandoCategoria(true)
      },
      pedirExclusao: setExcluindo,
      avisar,
      avisoAberto: aviso !== null,
      setOcultarPapoDoMenu,
    }),
    [avisar, aviso],
  )

  const sair = () => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })
  const nova = () => contexto.abrirTransacao()

  return (
    <InterfaceContext.Provider value={contexto}>
      <div className={larga ? 'flex min-h-screen flex-row bg-fundo-app' : 'flex min-h-screen flex-col bg-fundo-app'}>
        {larga && (
          <AppSidebar
            usuario={usuario?.username ?? ''}
            mostrarPapo={!ocultarPapoDoMenu}
            onNova={nova}
            onSair={sair}
            saindo={logout.isPending}
          />
        )}
        <main className={larga ? 'min-w-0 flex-1 px-10 pt-4 pb-12' : 'min-w-0 flex-1 px-4 pt-1 pb-[104px]'}>
          <Outlet />
        </main>
        {!larga && <BottomNav onNova={nova} onSair={sair} saindo={logout.isPending} />}
      </div>

      <TransacaoModal
        aberto={modal.aberto}
        transacao={modal.transacao}
        onFechar={() => setModal({ aberto: false })}
        onSalvo={(editou) => {
          setModal({ aberto: false })
          avisar(editou ? 'Transação atualizada.' : 'Transação salva.')
        }}
        onPedirExcluir={(transacao) => {
          setModal({ aberto: false })
          setExcluindo(transacao)
        }}
      />
      <ExcluirTransacaoDialog
        transacao={excluindo}
        onFechar={() => setExcluindo(null)}
        onExcluida={() => {
          setExcluindo(null)
          avisar('Transação excluída.')
        }}
      />
      <CategoriaModal
        aberto={criandoCategoria}
        onFechar={() => setCriandoCategoria(false)}
        onSalva={() => {
          setCriandoCategoria(false)
          avisar('Categoria salva.')
        }}
      />
      {aviso && <Aviso mensagem={aviso} onFechar={() => setAviso(null)} />}
    </InterfaceContext.Provider>
  )
}
