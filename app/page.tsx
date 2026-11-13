import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  BriefcaseBusiness,
  CalendarRange,
  Check,
  Coins,
  FileUp,
  Flag,
  Gift,
  GraduationCap,
  Lock,
  MessagesSquare,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
  Code2,
  Download,
  Globe,
  Linkedin,
  LockOpen,
  Medal,
  UserSearch,
} from "lucide-react"
import { RANK_BONUS_LINKS, RANK_BONUS_RESUME } from "@/lib/users/roles"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"
import { HomeHeader } from "@/components/home/home-header"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  CREDIT_COSTS,
  CANDIDATE_UNLOCK_DAYS,
  CREDIT_PACKAGES,
  PLANS,
  RECRUITER_PLANS,
  VACANCY_FREE_REFRESH_DAYS,
  WELCOME_CREDITS,
  formatCredits,
  formatPrice,
} from "@/lib/credits/config"
import {
  QUIZ_MIN_CORRECT_TO_PASS,
  QUIZ_QUESTIONS_PER_LEVEL,
  SECTION_META,
  XP_PER_CORRECT_ANSWER,
} from "@/lib/utils/studyLevels"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "EduCarrer AI | Estude para a vaga que você quer",
  description:
    "A IA cruza seu perfil com vagas reais, mostra o que falta e transforma cada vaga em uma trilha de estudo com níveis, quiz e um tutor sempre disponível.",
}

const steps = [
  {
    icon: FileUp,
    title: "Monte seu perfil",
    text: "Importe seu currículo e a IA preenche suas habilidades e experiências. Depois é só revisar.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Receba vagas compatíveis",
    text: `Cruzamos seu perfil com vagas reais e mostramos as que combinam com você, atualizadas a cada ${VACANCY_FREE_REFRESH_DAYS} dias.`,
  },
  {
    icon: BookOpenCheck,
    title: "Gere o estudo da vaga",
    text: "Escolha uma vaga e receba um diagnóstico do que você já tem e do que precisa aprender.",
  },
  {
    icon: Trophy,
    title: "Suba de nível",
    text: "Estude cada lacuna, passe no quiz e libere o próximo nível até ficar pronto para a vaga.",
  },
]

const features = [
  {
    icon: FileUp,
    title: "Currículo lido por IA",
    text: "Envie seu currículo e as habilidades e experiências entram no seu perfil automaticamente.",
  },
  {
    icon: Target,
    title: "Vagas que combinam com você",
    text: "Nada de rolar centenas de anúncios: a IA seleciona as vagas mais aderentes ao seu perfil.",
  },
  {
    icon: BookOpenCheck,
    title: "Estudo feito para a vaga",
    text: "Diagnóstico, pontos fortes, lacunas, plano semanal e a dica final, tudo baseado na vaga real.",
  },
  {
    icon: GraduationCap,
    title: "Trilha gamificada",
    text: "Cada lacuna vira um nível com quiz. Acumule XP, conclua níveis e conquiste novas patentes.",
  },
  {
    icon: Bot,
    title: "Tutor de IA em cada estudo",
    text: "Travou em um tópico? O tutor conhece o seu estudo e explica do jeito que você precisa.",
  },
  {
    icon: MessagesSquare,
    title: "Agente de carreira",
    text: "Tire dúvidas sobre carreira, entrevistas e seu perfil com um agente disponível a qualquer hora.",
  },
  {
    icon: UserSearch,
    title: "Seja encontrado por recrutadores",
    text: "Seu desempenho nas trilhas vira pontos em um ranking que recrutadores consultam por área e stack.",
  },
]

const studySections = ["resume", "strengths", "lacunasaDevelop", "studyPlans", "finalTip"] as const

const studySectionIcons: Record<string, typeof Target> = {
  resume: Target,
  strengths: Star,
  lacunasaDevelop: GraduationCap,
  studyPlans: CalendarRange,
  finalTip: Flag,
}

const ranks = ["Recruta", "Aprendiz", "Analista", "Especialista", "Estrategista", "Mestre"]

// Exemplo ilustrativo de trilha mostrado na apresentação
const demoLevels = [
  { skill: "Fundamentos de TypeScript", state: "done", score: 5 },
  { skill: "Testes automatizados", state: "done", score: 4 },
  { skill: "Docker e deploy", state: "current", score: 0 },
  { skill: "Arquitetura de APIs", state: "locked", score: 0 },
]

const creditUsage = [
  { icon: BookOpenCheck, label: "Gerar um estudo para uma vaga", cost: CREDIT_COSTS.STUDY },
  { icon: MessagesSquare, label: "Mensagem para o agente ou tutor", cost: CREDIT_COSTS.AGENT_MESSAGE },
  { icon: RefreshCw, label: `Atualizar vagas antes de ${VACANCY_FREE_REFRESH_DAYS} dias`, cost: CREDIT_COSTS.VACANCY_REFRESH },
  { icon: BriefcaseBusiness, label: `Vagas recomendadas a cada ${VACANCY_FREE_REFRESH_DAYS} dias`, cost: 0 },
  { icon: GraduationCap, label: "Quiz, XP e progresso nos níveis", cost: 0 },
]

const faq = [
  {
    q: "Preciso pagar para começar?",
    a: `Não. Toda conta nova ganha ${formatCredits(WELCOME_CREDITS)} créditos de boas-vindas, o suficiente para gerar seu primeiro estudo ou conversar com o agente. Depois você escolhe um plano ou compra créditos avulsos.`,
  },
  {
    q: "O que acontece se meus créditos acabarem?",
    a: "As ações que usam IA ficam bloqueadas até você recarregar. Seus estudos, níveis e progresso continuam disponíveis. Você pode comprar um pacote avulso ou assinar um plano na hora.",
  },
  {
    q: "Os créditos expiram?",
    a: "Os créditos do plano são renovados a cada mês pago e valem durante aquele ciclo. Os créditos avulsos não expiram. Sempre usamos primeiro os créditos do plano.",
  },
  {
    q: "E se a IA falhar no meio de uma ação?",
    a: "Os créditos da ação são devolvidos automaticamente para o seu saldo. Você só paga pelo que a IA entregou.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Os pagamentos são processados pelo Asaas, com PIX, cartão de crédito ou boleto. A assinatura pode ser cancelada quando você quiser.",
  },
  {
    q: "Recrutadores conseguem me encontrar?",
    a: `Sim. Recrutadores veem um ranking por área e stack com o seu nome e pontuação (XP dos desafios + ${RANK_BONUS_LINKS} pontos com LinkedIn ou portfólio + ${RANK_BONUS_RESUME} pontos com o currículo liberado). Seus links, currículo, habilidades, experiências e estudos só aparecem para o recrutador que desbloquear o seu perfil. O currículo só é compartilhado se você autorizar.`,
  },
  {
    q: "Sou recrutador. Como funciona?",
    a: `Você assina o plano Recrutador (${formatPrice(RECRUITER_PLANS[0].price)}/mês com ${formatCredits(RECRUITER_PLANS[0].credits)} créditos), filtra candidatos por área ou stack e desbloqueia quem interessar por ${formatCredits(CREDIT_COSTS.CANDIDATE_UNLOCK)} créditos. O acesso vale ${CANDIDATE_UNLOCK_DAYS} dias. O perfil de recrutador é liberado pela nossa equipe.`,
  },
  {
    q: "Como a plataforma sabe o que eu preciso estudar?",
    a: "A IA compara suas habilidades e experiências com os requisitos da vaga. O que você já domina vira ponto forte, e o que falta vira um nível da sua trilha, com tópicos, recursos e tempo estimado.",
  },
]

function SectionHeading({ eyebrow, title, text, light }: { eyebrow: string; title: React.ReactNode; text?: string; light?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className={cn("eyebrow", light ? "text-gold" : "text-brand")}>{eyebrow}</p>
      <h2 className={cn("mt-3 font-display text-4xl leading-[1.05] sm:text-5xl", light ? "text-white" : "text-ink")}>{title}</h2>
      {text && <p className={cn("mt-4 leading-relaxed", light ? "text-white/60" : "text-muted-foreground")}>{text}</p>}
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-gradient text-white">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-28 lg:pt-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/70">
              <Sparkles className="size-3.5 text-gold" /> Preparação para vagas com IA
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              Estude para a vaga que você <em className="text-gold-gradient">quer</em>, não para uma vaga qualquer.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              A EduCarrer cruza seu perfil com vagas reais, mostra exatamente o que falta e transforma cada vaga em uma trilha de estudo com níveis, quiz e um tutor de IA ao seu lado.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <Link href="/singup">Começar com {formatCredits(WELCOME_CREDITS)} créditos grátis <ArrowRight /></Link>
              </Button>
              <Button asChild variant="sidebar" size="lg" className="border border-white/15">
                <a href="#ensino">Ver como funciona</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/45">Sem cartão para criar a conta.</p>
          </div>

          {/* Prévia de um estudo */}
          <div className="animate-rise [animation-delay:120ms]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-lift backdrop-blur-md sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-gold">Estudo gerado</p>
                  <p className="mt-1 text-lg font-bold">Desenvolvedor(a) Full Stack Pleno</p>
                  <p className="text-xs text-white/50">Match inicial com a vaga: 62%</p>
                </div>
                <span className="rounded-xl bg-gold/15 px-3 py-2 text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gold">Patente</span>
                  <span className="block text-sm font-bold">Analista</span>
                </span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-brand to-gold" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-white/45">
                <span>2 de 4 níveis</span>
                <span>180 XP</span>
              </div>

              <ol className="mt-5 flex flex-col gap-2">
                {demoLevels.map((l, i) => (
                  <li
                    key={l.skill}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3",
                      l.state === "current" ? "border-brand/60 bg-brand/15" : "border-white/10 bg-white/[0.03]"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold",
                        l.state === "done" && "bg-success text-white",
                        l.state === "current" && "bg-brand text-white animate-pulse-ring",
                        l.state === "locked" && "bg-white/5 text-white/40"
                      )}
                    >
                      {l.state === "done" ? <Check className="size-4" /> : l.state === "locked" ? <Lock className="size-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-semibold", l.state === "locked" && "text-white/45")}>{l.skill}</p>
                      <p className="text-[11px] text-white/45">
                        {l.state === "done" && `Quiz: ${l.score}/${QUIZ_QUESTIONS_PER_LEVEL} acertos`}
                        {l.state === "current" && "Em andamento"}
                        {l.state === "locked" && "Conclua o nível anterior"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-white/[0.06] p-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand">
                  <Bot className="size-4" />
                </span>
                <p className="text-xs leading-relaxed text-white/70">
                  <strong className="text-white">Tutor:</strong> Para o nível de Docker, comece por imagens e containers. Quer um exemplo com o projeto da vaga?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-sky py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Como funciona"
            title={<>Do perfil à vaga em <em className="text-brand">quatro passos</em></>}
          />
          <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="surface relative p-6">
                <span className="font-display text-5xl text-brand/15">{String(i + 1).padStart(2, "0")}</span>
                <span className="absolute right-6 top-6 grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                  <s.icon className="size-4" />
                </span>
                <p className="mt-3 text-base font-bold text-ink">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Funcionalidades"
            title="Tudo o que você precisa para chegar pronto"
            text="Ferramentas de IA que trabalham juntas: do currículo à entrevista."
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-3xl border border-border bg-white p-7 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift">
                <span className="grid size-12 place-items-center rounded-2xl bg-ink text-gold transition-colors group-hover:bg-brand group-hover:text-white">
                  <f.icon className="size-5" />
                </span>
                <p className="mt-5 text-lg font-bold text-ink">{f.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como ensinamos */}
      <section id="ensino" className="scroll-mt-20 bg-ink-gradient py-20 text-white lg:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <SectionHeading
            light
            eyebrow="Como ensinamos"
            title={<>Cada vaga vira uma <em className="text-gold-gradient">trilha</em> de níveis</>}
            text="Você não estuda tudo de novo: estuda só o que falta para aquela vaga, em ordem, e prova que aprendeu antes de avançar."
          />

          {/* Anatomia do estudo */}
          <div className="mt-14 grid gap-3 md:grid-cols-5">
            {studySections.map((type, i) => {
              const Icon = studySectionIcons[type]
              return (
                <div key={type} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="text-[11px] font-bold text-white/35">ETAPA {i + 1}</span>
                  <Icon className="mt-3 size-5 text-gold" />
                  <p className="mt-3 font-bold">{SECTION_META[type].title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/55">{SECTION_META[type].subtitle}</p>
                </div>
              )
            })}
          </div>

          {/* Regras da trilha */}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <GraduationCap className="size-6 text-gold" />
              <p className="mt-4 text-lg font-bold">Um nível por lacuna</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Cada habilidade que falta vira um nível com explicação, tópicos, recursos de estudo, prioridade e tempo estimado.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <BookOpenCheck className="size-6 text-gold" />
              <p className="mt-4 text-lg font-bold">Quiz para avançar</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Ao final de cada nível há um quiz de {QUIZ_QUESTIONS_PER_LEVEL} perguntas. Com {QUIZ_MIN_CORRECT_TO_PASS} acertos o próximo nível é liberado. Errou? Revise com o tutor e tente de novo.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <Trophy className="size-6 text-gold" />
              <p className="mt-4 text-lg font-bold">XP e patentes</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Cada acerto vale {XP_PER_CORRECT_ANSWER} XP. Conforme a trilha avança, sua patente sobe até você estar pronto para a vaga.
              </p>
            </div>
          </div>

          {/* Patentes */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7">
            <p className="eyebrow text-gold">Sua evolução na trilha</p>
            <ol className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {ranks.map((r, i) => (
                <li key={r} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className={cn(
                      "grid size-11 place-items-center rounded-full border text-sm font-bold",
                      i === ranks.length - 1 ? "border-gold bg-gold text-ink" : "border-white/15 bg-white/[0.06] text-white/80"
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold">{r}</span>
                  <span className="text-[10px] text-white/40">{Math.round((i / (ranks.length - 1)) * 100)}% da trilha</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Planos"
            title="Escolha o ritmo da sua preparação"
            text={`Comece grátis com ${formatCredits(WELCOME_CREDITS)} créditos. Quando quiser ir além, assine um plano mensal e cancele quando quiser.`}
          />

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-3xl border p-7",
                  plan.highlight ? "border-ink bg-ink text-white shadow-lift" : "border-border bg-white"
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-ink">Mais escolhido</span>
                )}
                <p className={cn("eyebrow", plan.highlight ? "text-gold" : "text-brand")}>{plan.name}</p>
                <p className="mt-4 font-display text-5xl tabular-nums">{formatPrice(plan.price)}</p>
                <p className={cn("text-xs", plan.highlight ? "text-white/50" : "text-muted-foreground")}>por mês</p>

                <p className="mt-6 text-3xl font-extrabold tabular-nums">{formatCredits(plan.credits)}</p>
                <p className={cn("text-sm", plan.highlight ? "text-white/60" : "text-muted-foreground")}>créditos de IA por mês</p>

                <ul className={cn("mt-6 flex flex-col gap-2.5 text-sm", plan.highlight ? "text-white/80" : "text-ink/80")}>
                  <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> Até {Math.floor(plan.credits / CREDIT_COSTS.STUDY)} estudos por mês</li>
                  <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> Ou até {formatCredits(Math.floor(plan.credits / CREDIT_COSTS.AGENT_MESSAGE))} mensagens com o tutor</li>
                  <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> Vagas recomendadas a cada {VACANCY_FREE_REFRESH_DAYS} dias</li>
                  <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> Trilhas, quiz e patentes ilimitados</li>
                </ul>

                <Button asChild variant={plan.highlight ? "gold" : "default"} className="mt-8 w-full">
                  <Link href="/singup">Começar agora</Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-5 rounded-3xl border border-border bg-sky p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 font-bold text-ink"><Coins className="size-4 text-gold" /> Créditos avulsos</p>
              <p className="mt-1 text-sm text-muted-foreground">Acabaram os créditos antes do fim do mês? Recarregue na hora. Avulsos não expiram.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CREDIT_PACKAGES.map((pack) => (
                <div key={pack.id} className="rounded-2xl border border-border bg-white px-4 py-3 text-center">
                  <p className="text-lg font-extrabold text-ink tabular-nums">{formatCredits(pack.credits)}</p>
                  <p className="text-xs font-semibold text-brand">{formatPrice(pack.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Créditos */}
      <section id="creditos" className="scroll-mt-20 bg-sky py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow text-brand">Créditos</p>
            <h2 className="mt-3 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
              Você paga só pelo que a IA <em className="text-brand">faz</em> por você
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Cada ação com IA consome uma quantidade fixa de créditos. Estudar os níveis, responder quiz e acompanhar seu progresso não custa nada.
            </p>

            <ul className="mt-8 flex flex-col gap-4">
              <li className="flex gap-3">
                <Gift className="size-5 shrink-0 text-gold" />
                <p className="text-sm text-ink/80"><strong className="text-ink">{formatCredits(WELCOME_CREDITS)} créditos de boas-vindas</strong> em toda conta nova.</p>
              </li>
              <li className="flex gap-3">
                <Coins className="size-5 shrink-0 text-gold" />
                <p className="text-sm text-ink/80"><strong className="text-ink">Créditos do plano são usados primeiro</strong>, os avulsos ficam guardados.</p>
              </li>
              <li className="flex gap-3">
                <RotateCcw className="size-5 shrink-0 text-gold" />
                <p className="text-sm text-ink/80"><strong className="text-ink">Devolução automática</strong> se a IA não concluir a ação.</p>
              </li>
              <li className="flex gap-3">
                <Lock className="size-5 shrink-0 text-gold" />
                <p className="text-sm text-ink/80"><strong className="text-ink">Sem créditos, as ações de IA pausam</strong> até você recarregar. Seu progresso continua salvo.</p>
              </li>
            </ul>
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <p className="text-sm font-bold text-ink">Quanto custa cada ação</p>
            </div>
            <ul className="divide-y divide-border">
              {creditUsage.map((u) => (
                <li key={u.label} className="flex items-center gap-4 px-6 py-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <u.icon className="size-4" />
                  </span>
                  <p className="flex-1 text-sm font-semibold text-ink">{u.label}</p>
                  <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-bold tabular-nums", u.cost ? "bg-gold-soft text-gold" : "bg-success-soft text-success")}>
                    {u.cost ? `${formatCredits(u.cost)} créditos` : "Grátis"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="bg-ink px-6 py-4 text-sm text-white/70">
              Exemplo: com o plano <strong className="text-white">{PLANS[1].name}</strong> você gera {Math.floor(PLANS[1].credits / 2 / CREDIT_COSTS.STUDY)} estudos e ainda envia {formatCredits(Math.floor(PLANS[1].credits / 2 / CREDIT_COSTS.AGENT_MESSAGE))} mensagens ao tutor no mês.
            </div>
          </div>
        </div>
      </section>

      {/* Recrutadores */}
      <section id="recrutadores" className="scroll-mt-20 bg-ink-gradient py-20 text-white lg:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <SectionHeading
            light
            eyebrow="Para recrutadores"
            title={<>Encontre quem <em className="text-gold-gradient">provou</em> que aprende</>}
            text="Um ranking de candidatos ordenado pelo desempenho real nas trilhas de estudo, filtrado pela área e pela stack que a sua vaga precisa."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-start">
            <div className="flex flex-col gap-4">
              {[
                {
                  icon: Code2,
                  title: "Filtre por área ou stack",
                  text: "Backend, Frontend, FullStack, Dados e mais, ou busque pela tecnologia: React, Node, Python...",
                },
                {
                  icon: Lock,
                  title: "Veja o ranking",
                  text: "Nome, patente e pontuação de cada candidato ficam visíveis para você comparar.",
                },
                {
                  icon: LockOpen,
                  title: `Desbloqueie por ${formatCredits(CREDIT_COSTS.CANDIDATE_UNLOCK)} créditos`,
                  text: `Acesso por ${CANDIDATE_UNLOCK_DAYS} dias a LinkedIn, portfólio, currículo, habilidades, experiências e estudos concluídos.`,
                },
              ].map((step, i) => (
                <div key={step.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                    <step.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-white/35">PASSO {i + 1}</p>
                    <p className="font-bold">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">{step.text}</p>
                  </div>
                </div>
              ))}

              {RECRUITER_PLANS.map((plan) => (
                <div key={plan.id} className="flex flex-col gap-4 rounded-3xl bg-white p-6 text-ink sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="eyebrow text-brand">Plano {plan.name}</p>
                    <p className="mt-1 font-display text-4xl tabular-nums">
                      {formatPrice(plan.price)}<span className="text-base text-muted-foreground">/mês</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCredits(plan.credits)} créditos · até {Math.floor(plan.credits / CREDIT_COSTS.CANDIDATE_UNLOCK)} candidatos desbloqueados por mês
                    </p>
                  </div>
                  <Button asChild variant="gold" className="shrink-0">
                    <Link href="/singup">Quero recrutar</Link>
                  </Button>
                </div>
              ))}
              <p className="text-xs text-white/45">O perfil de recrutador é liberado pela nossa equipe depois do cadastro.</p>
            </div>

            {/* Prévia do ranking */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-lift backdrop-blur-md sm:p-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow text-gold">Ranking · Backend · Node</p>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70">exemplo</span>
              </div>
              <ol className="mt-5 flex flex-col gap-2">
                {[
                  { name: "Marina Alves", rank: "Especialista", points: 1240, unlocked: true },
                  { name: "Rafael Costa", rank: "Analista", points: 980, unlocked: false },
                  { name: "Juliana Prado", rank: "Analista", points: 860, unlocked: false },
                ].map((c, i) => (
                  <li key={c.name} className={cn("flex items-center gap-3 rounded-2xl border p-3", c.unlocked ? "border-success/40 bg-success/10" : "border-white/10 bg-white/[0.03]")}>
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", i === 0 ? "bg-gold text-white" : "bg-white/10 text-white/80")}>
                      <Medal className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <p className="text-[11px] text-white/50">{c.rank} · {c.points.toLocaleString("pt-BR")} pontos</p>
                    </div>
                    {c.unlocked ? (
                      <span className="flex gap-1.5 text-white/80">
                        <Linkedin className="size-4" /><Globe className="size-4" /><Download className="size-4" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-lg bg-gold/20 px-2 py-1 text-[11px] font-bold text-gold">
                        <Lock className="size-3" /> {formatCredits(CREDIT_COSTS.CANDIDATE_UNLOCK)}
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              {/* Para candidatos */}
              <div className="mt-5 rounded-2xl bg-white/[0.06] p-4">
                <p className="text-sm font-bold">É candidato? Suba no ranking</p>
                <ul className="mt-2 flex flex-col gap-1.5 text-xs text-white/65">
                  <li className="flex gap-2"><Trophy className="size-4 shrink-0 text-gold" /> Cada acerto nos desafios vale {XP_PER_CORRECT_ANSWER} pontos</li>
                  <li className="flex gap-2"><Linkedin className="size-4 shrink-0 text-gold" /> +{RANK_BONUS_LINKS} pontos ao cadastrar LinkedIn ou portfólio no perfil</li>
                  <li className="flex gap-2"><Download className="size-4 shrink-0 text-gold" /> +{RANK_BONUS_RESUME} pontos ao liberar o currículo para recrutadores</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="Dúvidas frequentes" title="Perguntas que sempre aparecem" />
          <Accordion type="single" collapsible className="mt-10">
            {faq.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-bold text-ink">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] bg-ink-gradient px-6 py-14 text-center text-white sm:px-12 lg:py-20">
          <h2 className="mx-auto max-w-2xl font-display text-4xl leading-[1.05] sm:text-6xl">
            Sua próxima vaga começa com o <em className="text-gold-gradient">próximo nível</em>.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-white/60">
            Crie sua conta, importe seu currículo e gere seu primeiro estudo com os créditos de boas-vindas.
          </p>
          <Button asChild variant="gold" size="lg" className="mt-8">
            <Link href="/singup">Criar conta grátis <ArrowRight /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <BrandMark tone="dark" className="h-10 ml-0" />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} EduCarrer AI. Pagamentos processados pelo Asaas.</p>
        </div>
      </footer>
    </div>
  )
}
