"use client";

import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  Banknote,
  BookOpen,
  Bus,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CreditCard,
  Droplets,
  Eye,
  EyeOff,
  Flame,
  Flower2,
  Fuel,
  HeartPulse,
  House,
  KeyRound,
  Lightbulb,
  Lock,
  LogIn,
  Mail,
  PencilLine,
  PiggyBank,
  Plug,
  Plus,
  ReceiptText,
  Repeat2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Shapes,
  Smartphone,
  Sparkles,
  Store,
  Ticket,
  Trash2,
  Tv,
  Undo2,
  User,
  UserPlus,
  Utensils,
  Wallet,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useState,
  useSyncExternalStore,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { formatAmountInput, formatCurrency } from "@/lib/utils/currency";
import {
  categories,
  defaultUserProfile,
  emptyFinanceData,
  financeDataSchema,
  fixedExpenseSchema,
  getCategoriesForExpenseType,
  getDashboardCategoryTotals,
  getCategoryTotals,
  getFixedPaymentStatus,
  getLocalDateValue,
  getMonthKey,
  getMonthDayTotals,
  getMonthlyCommitment,
  getMonthlyTotals,
  getRecurringPeriodKey,
  getWeekdayTotals,
  passwordChangeSchema,
  userProfileSchema,
  type CategoryId,
  type Expense,
  type ExpenseType,
  type FinanceData,
  type FixedExpense,
  type Frequency,
  type UserProfile,
} from "./model";

type View = "home" | "expenses" | "fixed" | "profile";
type Modal = "expense" | "fixed" | "income" | null;
type HistoryDateMode = "month" | "range";
type SortOrder = "desc" | "asc";
type FixedPaymentFilter = "all" | "paid" | "pending";

const historyPageSize = 20;

const storageKey = "pulso-plus:finance:v1";
const financeDataListeners = new Set<() => void>();
let cachedStorageValue: string | null | undefined;
let cachedFinanceData = emptyFinanceData;

function getFinanceDataSnapshot() {
  if (typeof window === "undefined") return emptyFinanceData;

  let saved: string | null;
  try {
    saved = window.localStorage.getItem(storageKey);
  } catch {
    return cachedFinanceData;
  }
  if (saved === cachedStorageValue) return cachedFinanceData;

  cachedStorageValue = saved;
  let parsed = null;
  try {
    parsed = saved ? financeDataSchema.safeParse(JSON.parse(saved)) : null;
  } catch {
    parsed = null;
  }
  cachedFinanceData = parsed?.success ? parsed.data : emptyFinanceData;
  return cachedFinanceData;
}

function subscribeToFinanceData(listener: () => void) {
  financeDataListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      cachedStorageValue = undefined;
      listener();
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    financeDataListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function updateFinanceData(updater: (current: FinanceData) => FinanceData) {
  const nextData = updater(getFinanceDataSnapshot());
  const serialized = JSON.stringify(nextData);
  cachedStorageValue = serialized;
  cachedFinanceData = nextData;

  try {
    window.localStorage.setItem(storageKey, serialized);
  } catch {
    // Keep the current session usable when browser storage is unavailable.
  }

  financeDataListeners.forEach((listener) => listener());
}

const iconByName: Record<(typeof categories)[number]["icon"], LucideIcon> = {
  utensils: Utensils,
  bus: Bus,
  house: House,
  "heart-pulse": HeartPulse,
  ticket: Ticket,
  "shopping-bag": ShoppingBag,
  "book-open": BookOpen,
  plug: Plug,
  repeat: Repeat2,
  "shopping-cart": ShoppingCart,
  store: Store,
  coffee: Coffee,
  shapes: Shapes,
};

const fixedSuggestions: {
  name: string;
  categoryId: CategoryId;
  icon: LucideIcon;
  description?: string;
}[] = [
  { name: "Arriendo", categoryId: "home", icon: House },
  { name: "Electricidad", categoryId: "services", icon: Zap },
  { name: "Agua", categoryId: "services", icon: Droplets },
  { name: "Gas", categoryId: "services", icon: Flame },
  { name: "Internet", categoryId: "services", icon: Wifi },
  { name: "Celular", categoryId: "services", icon: Smartphone },
  { name: "Streaming", categoryId: "subscriptions", icon: Tv },
  { name: "Seguro", categoryId: "other", icon: Shield },
  { name: "Tarjeta de Crédito", categoryId: "other", icon: CreditCard },
  {
    name: "Combustible",
    categoryId: "transport",
    icon: Fuel,
    description: "Bencina, petróleo o parafina.",
  },
  { name: "Ahorro", categoryId: "other", icon: PiggyBank },
  { name: "Cementerio", categoryId: "other", icon: Flower2 },
  { name: "Suscripción", categoryId: "subscriptions", icon: Repeat2 },
];

const navigation: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Inicio", icon: Activity },
  { id: "fixed", label: "Gastos fijos", icon: CalendarClock },
  { id: "expenses", label: "Historial de Gastos", icon: ReceiptText },
  { id: "profile", label: "Mi Perfil", icon: User },
];

const frequencyOptions: {
  id: Frequency;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "monthly",
    label: "Mensual",
    description: "Pago realizado una vez al mes.",
    icon: CalendarDays,
  },
  {
    id: "weekly",
    label: "Semanal",
    description: "Pago realizado una vez por semana.",
    icon: CalendarRange,
  },
  {
    id: "yearly",
    label: "Anual",
    description: "Pago realizado una vez al año.",
    icon: CalendarClock,
  },
];

function IconButton({
  label,
  onClick,
  children,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      className={`inline-flex size-10 items-center justify-center rounded-md border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] ${className}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
      <Icon aria-hidden="true" className="size-4 text-[var(--muted)]" />
      {children}
    </span>
  );
}

function MoneyInput({
  ariaLabel,
  className,
  onChange,
  value,
  autoFocus = false,
  required = false,
}: {
  ariaLabel: string;
  className: string;
  onChange: (value: string) => void;
  value: string;
  autoFocus?: boolean;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const cursorPosition = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = input.value
      .slice(0, cursorPosition)
      .replace(/\D/g, "").length;
    const nextValue = input.value.replace(/\D/g, "");
    const formattedValue = formatAmountInput(nextValue);

    onChange(nextValue);
    requestAnimationFrame(() => {
      const currentInput = inputRef.current;
      if (!currentInput) return;

      let nextCursor = 0;
      let digitsSeen = 0;
      while (
        nextCursor < formattedValue.length &&
        digitsSeen < digitsBeforeCursor
      ) {
        if (/\d/.test(formattedValue[nextCursor])) digitsSeen += 1;
        nextCursor += 1;
      }
      currentInput.setSelectionRange(nextCursor, nextCursor);
    });
  }

  return (
    <input
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      className={className}
      inputMode="numeric"
      onChange={handleChange}
      placeholder="0"
      ref={inputRef}
      required={required}
      type="text"
      value={formatAmountInput(value)}
    />
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-5 py-9 text-center">
      <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-[var(--paper)] text-[var(--muted)]">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
        {detail}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function SectionHeading({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Icon aria-hidden="true" className="size-[18px] text-[var(--muted)]" />
        {title}
      </h2>
      {action}
    </div>
  );
}

function SortDirectionToggle({
  label,
  order,
  onChange,
}: {
  label: string;
  order: SortOrder;
  onChange: (order: SortOrder) => void;
}) {
  return (
    <div
      aria-label={label}
      className="inline-flex items-center gap-1"
      role="group"
    >
      <button
        aria-label="Mayor a menor"
        aria-pressed={order === "desc"}
        className={`inline-flex size-9 items-center justify-center rounded-md border ${order === "desc" ? "border-[var(--accent-border)] bg-[var(--accent)] text-[var(--ink)]" : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"}`}
        onClick={() => onChange("desc")}
        title="Mayor a menor"
        type="button"
      >
        <ArrowDown aria-hidden="true" className="size-4" />
      </button>
      <button
        aria-label="Menor a mayor"
        aria-pressed={order === "asc"}
        className={`inline-flex size-9 items-center justify-center rounded-md border ${order === "asc" ? "border-[var(--accent-border)] bg-[var(--accent)] text-[var(--ink)]" : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"}`}
        onClick={() => onChange("asc")}
        title="Menor a mayor"
        type="button"
      >
        <ArrowUp aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

function Dashboard() {
  const data = useSyncExternalStore(
    subscribeToFinanceData,
    getFinanceDataSnapshot,
    () => emptyFinanceData,
  );
  const [view, setView] = useState<View>("home");
  const [modal, setModal] = useState<Modal>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingFixedExpenseId, setEditingFixedExpenseId] = useState<
    string | null
  >(null);
  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("food");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseType, setExpenseType] = useState<ExpenseType>("variable");
  const [expenseTypeLocked, setExpenseTypeLocked] = useState(false);
  const [fixedName, setFixedName] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [fixedCategory, setFixedCategory] = useState<CategoryId>("home");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [hasDueDay, setHasDueDay] = useState(false);
  const [dueDay, setDueDay] = useState("5");
  const [incomeInput, setIncomeInput] = useState("");
  const [formError, setFormError] = useState("");
  const [expenseFilter, setExpenseFilter] = useState<
    "all" | "fixed" | "variable"
  >("all");
  const [historyDateMode, setHistoryDateMode] =
    useState<HistoryDateMode>("month");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [categorySortOrder, setCategorySortOrder] = useState<SortOrder>("desc");
  const [fixedSortOrder, setFixedSortOrder] = useState<SortOrder>("desc");
  const [fixedPaymentFilter, setFixedPaymentFilter] =
    useState<FixedPaymentFilter>("all");

  const userProfile: UserProfile = data.profile ?? defaultUserProfile;

  const selectedMonth = month || getMonthKey(new Date());
  const totals = getMonthlyTotals(data.expenses, selectedMonth);
  const categoryTotals = getDashboardCategoryTotals(
    data.expenses,
    data.fixedExpenses,
    selectedMonth,
  );
  const fixedPaymentStatus = getFixedPaymentStatus(
    data.fixedExpenses,
    data.expenses,
    selectedMonth,
  );
  const weekdayTotals = getWeekdayTotals(data.expenses, selectedMonth);
  const monthDayTotals = getMonthDayTotals(data.expenses, selectedMonth);
  const maxMonthDay = Math.max(0, ...monthDayTotals.map(({ total }) => total));
  const sortedCategoryTotals = [...categoryTotals].sort((left, right) =>
    categorySortOrder === "desc"
      ? right.total - left.total
      : left.total - right.total,
  );
  const topFixedExpenses = data.fixedExpenses
    .filter((expense) => expense.active)
    .filter((expense) => {
      const isPaid = fixedPaymentStatus.paidIds.includes(expense.id);
      return (
        fixedPaymentFilter === "all" ||
        (fixedPaymentFilter === "paid" && isPaid) ||
        (fixedPaymentFilter === "pending" && !isPaid)
      );
    })
    .sort((left, right) => {
      const difference =
        getMonthlyCommitment(left) - getMonthlyCommitment(right);
      return fixedSortOrder === "desc" ? -difference : difference;
    })
    .slice(0, 5);
  const historyExpenses = data.expenses
    .filter((expense) =>
      historyDateMode === "month"
        ? expense.date.startsWith(selectedMonth)
        : (!historyStartDate || expense.date >= historyStartDate) &&
          (!historyEndDate || expense.date <= historyEndDate),
    )
    .filter(
      (expense) => expenseFilter === "all" || expense.type === expenseFilter,
    )
    .sort((left, right) => right.date.localeCompare(left.date));
  const historyPageCount = Math.max(
    1,
    Math.ceil(historyExpenses.length / historyPageSize),
  );
  const currentHistoryPage = Math.min(historyPage, historyPageCount);
  const pagedHistoryExpenses = historyExpenses.slice(
    (currentHistoryPage - 1) * historyPageSize,
    currentHistoryPage * historyPageSize,
  );
  const historyTotal = historyExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const invalidHistoryRange =
    historyDateMode === "range" &&
    historyStartDate.length > 0 &&
    historyEndDate.length > 0 &&
    historyStartDate > historyEndDate;
  const monthlyCommitment = data.fixedExpenses
    .filter((expense) => expense.active)
    .reduce((sum, expense) => sum + getMonthlyCommitment(expense), 0);
  const spentPercent =
    data.monthlyIncome > 0
      ? Math.round((totals.total / data.monthlyIncome) * 100)
      : 0;
  const maxWeekday = Math.max(0, ...weekdayTotals.map(({ total }) => total));
  const maxCategory = Math.max(0, ...categoryTotals.map(({ total }) => total));
  const pageTitle =
    navigation.find((item) => item.id === view)?.label ?? "Inicio";

  function openExpense(
    initialCategory: CategoryId = "food",
    lockExpenseType = false,
  ) {
    setEditingExpenseId(null);
    setAmount("");
    setDescription("");
    setSelectedCategory(initialCategory);
    setExpenseDate(getLocalDateValue());
    setExpenseType("variable");
    setExpenseTypeLocked(lockExpenseType);
    setFormError("");
    setModal("expense");
  }

  function openExpenseForEdit(expense: Expense) {
    setEditingExpenseId(expense.id);
    setAmount(String(expense.amount));
    setDescription(expense.description);
    setSelectedCategory(
      getCategoriesForExpenseType(expense.type).some(
        (category) => category.id === expense.categoryId,
      )
        ? expense.categoryId
        : "other",
    );
    setExpenseDate(expense.date);
    setExpenseType(expense.type);
    setExpenseTypeLocked(false);
    setFormError("");
    setModal("expense");
  }

  function openFixed() {
    setEditingFixedExpenseId(null);
    setFixedName("");
    setFixedAmount("");
    setFixedCategory("home");
    setFrequency("monthly");
    setHasDueDay(false);
    setDueDay("5");
    setFormError("");
    setModal("fixed");
  }

  function openFixedForEdit(expense: FixedExpense) {
    setEditingFixedExpenseId(expense.id);
    setFixedName(expense.name);
    setFixedAmount(String(expense.amount));
    setFixedCategory(expense.categoryId);
    setFrequency(expense.frequency);
    setHasDueDay(expense.dueDay !== null);
    setDueDay(String(expense.dueDay ?? 5));
    setFormError("");
    setModal("fixed");
  }

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentExpense = data.expenses.find(
      (expense) => expense.id === editingExpenseId,
    );
    const result = financeDataSchema.shape.expenses.element.safeParse({
      id: editingExpenseId ?? crypto.randomUUID(),
      amount: Number(amount),
      categoryId: selectedCategory,
      description: description.trim(),
      date: expenseDate,
      type: expenseType,
      ...(currentExpense?.fixedExpenseId
        ? { fixedExpenseId: currentExpense.fixedExpenseId }
        : {}),
    });

    if (!result.success) {
      setFormError("Revisa el monto, la fecha y la categoría del gasto.");
      return;
    }

    updateFinanceData((current) => ({
      ...current,
      expenses: editingExpenseId
        ? current.expenses.map((expense) =>
            expense.id === editingExpenseId ? result.data : expense,
          )
        : [result.data, ...current.expenses],
    }));
    setEditingExpenseId(null);
    setModal(null);
    setView("expenses");
  }

  function addFixed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentExpense = data.fixedExpenses.find(
      (expense) => expense.id === editingFixedExpenseId,
    );
    const result = fixedExpenseSchema.safeParse({
      id: editingFixedExpenseId ?? crypto.randomUUID(),
      name: fixedName,
      amount: Number(fixedAmount),
      categoryId: fixedCategory,
      frequency,
      dueDay: hasDueDay ? Number(dueDay) : null,
      active: currentExpense?.active ?? true,
    });

    if (!result.success) {
      setFormError("Completa un nombre y un monto válidos.");
      return;
    }

    updateFinanceData((current) => ({
      ...current,
      fixedExpenses: editingFixedExpenseId
        ? current.fixedExpenses.map((expense) =>
            expense.id === editingFixedExpenseId ? result.data : expense,
          )
        : [result.data, ...current.fixedExpenses],
    }));
    setEditingFixedExpenseId(null);
    setModal(null);
    setView("fixed");
  }

  function recordFixedPayment(fixedExpense: FixedExpense) {
    const paymentDate = getLocalDateValue();
    const currentPeriod = getRecurringPeriodKey(
      fixedExpense.frequency,
      paymentDate,
    );
    const paymentsInCurrentPeriod = data.expenses.filter(
      (expense) =>
        expense.fixedExpenseId === fixedExpense.id &&
        getRecurringPeriodKey(fixedExpense.frequency, expense.date) ===
          currentPeriod,
    );
    if (paymentsInCurrentPeriod.length > 0) {
      const paymentIds = new Set(
        paymentsInCurrentPeriod.map((expense) => expense.id),
      );
      updateFinanceData((current) => ({
        ...current,
        expenses: current.expenses.filter(
          (expense) => !paymentIds.has(expense.id),
        ),
      }));
      return;
    }

    const result = financeDataSchema.shape.expenses.element.safeParse({
      id: crypto.randomUUID(),
      amount: fixedExpense.amount,
      categoryId: fixedExpense.categoryId,
      description: fixedExpense.name,
      date: paymentDate,
      type: "fixed",
      fixedExpenseId: fixedExpense.id,
    });

    if (!result.success) return;
    updateFinanceData((current) => ({
      ...current,
      expenses: [result.data, ...current.expenses],
    }));
  }

  function saveIncome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIncome = Number(incomeInput);
    if (!Number.isSafeInteger(nextIncome) || nextIncome < 0) {
      setFormError("Ingresa un monto válido en pesos.");
      return;
    }
    updateFinanceData((current) => ({ ...current, monthlyIncome: nextIncome }));
    setModal(null);
  }

  function deleteFixed(id: string) {
    updateFinanceData((current) => ({
      ...current,
      fixedExpenses: current.fixedExpenses.filter(
        (expense) => expense.id !== id,
      ),
    }));
  }

  function showModal(nextModal: Modal) {
    setFormError("");
    setModal(nextModal);
  }


  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[var(--line)] bg-[var(--paper)] px-5 py-6 lg:flex">
        <Link
          aria-label="Pulso+, inicio"
          className="mb-12 flex items-center gap-3 px-2"
          href="/"
        >
          <span className="flex size-9 items-center justify-center rounded-md bg-[var(--ink)] text-sm font-bold text-white">
            P+
          </span>
          <span className="text-xl font-semibold">
            Pulso<span className="text-[#718a35]">+</span>
          </span>
        </Link>
        <p className="mb-3 px-3 text-[11px] font-semibold text-[var(--muted)] uppercase">
          Tu espacio
        </p>
        <nav aria-label="Navegación principal" className="flex flex-col gap-1">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              aria-current={view === id ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${view === id ? "bg-[var(--lime)] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"}`}
              key={id}
              onClick={() => setView(id)}
              type="button"
            >
              <Icon aria-hidden="true" className="size-[18px]" />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-[var(--line)] pt-5">
          <button
            className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-white"
            onClick={() => {
              setIncomeInput(String(data.monthlyIncome || ""));
              showModal("income");
            }}
            type="button"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-[var(--sky)] text-[var(--ink)]">
              <Wallet aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                Mi presupuesto
              </span>
              <span className="block text-xs text-[var(--muted)]">
                {formatCurrency(data.monthlyIncome)}
              </span>
            </span>
            <PencilLine
              aria-hidden="true"
              className="ml-auto size-4 text-[var(--muted)]"
            />
          </button>
          <p className="mt-3 flex items-center gap-2 px-3 text-xs text-[var(--muted)]">
            <Check aria-hidden="true" className="size-3.5" />
            Guardado en este dispositivo
          </p>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <div className="mx-auto max-w-[1440px] px-5 pt-5 pb-28 sm:px-8 sm:pt-7 lg:px-10 lg:pb-12">
          <header className="mb-8 flex items-center justify-between border-b border-[var(--line)] pb-5">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="flex size-9 items-center justify-center rounded-md bg-[var(--ink)] text-sm font-bold text-white">
                P+
              </span>
              <span className="text-lg font-semibold max-[400px]:hidden">
                Pulso<span className="text-[#718a35]">+</span>
              </span>
            </div>
            <p className="hidden text-sm text-[var(--muted)] lg:block">
              Finanzas personales <span className="px-1">/</span> {pageTitle}
            </p>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Link
                aria-label="Acceder a tu cuenta"
                className="hidden h-10 items-center gap-1.5 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] sm:inline-flex"
                href="/login"
                title="Acceder a tu cuenta"
              >
                <LogIn aria-hidden="true" className="size-4 text-[var(--muted)]" />
                <span>Acceder</span>
              </Link>
              <label className="relative flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm max-[360px]:gap-1 max-[360px]:px-2">
                <CalendarDays
                  aria-hidden="true"
                  className="size-4 text-[var(--muted)]"
                />
                <span className="sr-only">
                  {view === "expenses"
                    ? "Mes del historial"
                    : "Mes del dashboard"}
                </span>
                <input
                  aria-label={
                    view === "expenses"
                      ? "Mes del historial"
                      : "Mes del dashboard"
                  }
                  className="w-36 bg-transparent text-sm outline-none max-[360px]:w-[4.5rem]"
                  onChange={(event) => {
                    setMonth(event.target.value);
                    setHistoryPage(1);
                  }}
                  type="month"
                  value={month || getMonthKey(new Date())}
                />
              </label>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Agregar gasto hormiga"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] max-[359px]:size-10 max-[359px]:px-0 sm:px-4"
                  onClick={() => openExpense("small-expenses", true)}
                  title="Agregar gasto hormiga"
                  type="button"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  <span className="hidden min-[480px]:inline sm:hidden">
                    Hormiga
                  </span>
                  <span className="hidden sm:inline">
                    Agregar gasto hormiga
                  </span>
                </button>
                <button
                  aria-label="Agregar gasto fijo"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--accent-border)] bg-white px-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] max-[359px]:size-10 max-[359px]:px-0 sm:px-4"
                  onClick={openFixed}
                  title="Agregar gasto fijo"
                  type="button"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  <span className="hidden min-[480px]:inline sm:hidden">
                    Fijo
                  </span>
                  <span className="hidden sm:inline">Agregar gasto fijo</span>
                </button>
              </div>
            </div>
          </header>

          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm text-[var(--muted)]">
                {view === "profile"
                  ? "Configuración de cuenta"
                  : new Intl.DateTimeFormat("es-CL", {
                      month: "long",
                      year: "numeric",
                    }).format(new Date(`${selectedMonth}-15T12:00:00`))}
              </p>
              <h1 className="text-3xl font-semibold">
                {view === "home" ? "Hola, este es tu pulso." : pageTitle}
              </h1>
            </div>
          </div>

          {view === "expenses" ? (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div
                aria-label="Filtrar por fecha"
                className="inline-flex rounded-md border border-[var(--line)] bg-white p-1"
                role="group"
              >
                <button
                  aria-pressed={historyDateMode === "month"}
                  className={`inline-flex h-9 items-center gap-1.5 rounded px-3 text-sm font-medium ${historyDateMode === "month" ? "bg-[var(--accent)] text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                  onClick={() => {
                    setHistoryDateMode("month");
                    setHistoryPage(1);
                  }}
                  type="button"
                >
                  <CalendarDays aria-hidden="true" className="size-4" />
                  Mes completo
                </button>
                <button
                  aria-pressed={historyDateMode === "range"}
                  className={`inline-flex h-9 items-center gap-1.5 rounded px-3 text-sm font-medium ${historyDateMode === "range" ? "bg-[var(--accent)] text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                  onClick={() => {
                    setHistoryDateMode("range");
                    setHistoryPage(1);
                    if (!historyStartDate)
                      setHistoryStartDate(`${selectedMonth}-01`);
                    if (!historyEndDate) setHistoryEndDate(getLocalDateValue());
                  }}
                  type="button"
                >
                  <CalendarRange aria-hidden="true" className="size-4" />
                  Rango
                </button>
              </div>
              {historyDateMode === "range" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3">
                    <CalendarDays
                      aria-hidden="true"
                      className="size-4 text-[var(--muted)]"
                    />
                    <span className="sr-only">Fecha desde</span>
                    <input
                      aria-label="Fecha desde"
                      className="w-32 bg-transparent text-sm outline-none"
                      onChange={(event) => {
                        setHistoryStartDate(event.target.value);
                        setHistoryPage(1);
                      }}
                      type="date"
                      value={historyStartDate}
                    />
                  </label>
                  <span className="text-xs text-[var(--muted)]">hasta</span>
                  <label className="flex h-10 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3">
                    <CalendarDays
                      aria-hidden="true"
                      className="size-4 text-[var(--muted)]"
                    />
                    <span className="sr-only">Fecha hasta</span>
                    <input
                      aria-label="Fecha hasta"
                      className="w-32 bg-transparent text-sm outline-none"
                      onChange={(event) => {
                        setHistoryEndDate(event.target.value);
                        setHistoryPage(1);
                      }}
                      type="date"
                      value={historyEndDate}
                    />
                  </label>
                  {invalidHistoryRange ? (
                    <p className="text-xs text-[#ad3e35]" role="alert">
                      La fecha inicial debe ser anterior o igual a la final.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {view === "home" ? (
            <>
              <section
                aria-label="Resumen del mes"
                className="grid overflow-hidden rounded-md border border-[var(--line)] bg-white sm:grid-cols-2 xl:grid-cols-4"
              >
                <Metric
                  icon={Wallet}
                  label="Ingresos del mes"
                  value={formatCurrency(data.monthlyIncome)}
                  tint="sky"
                >
                  <button
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]"
                    onClick={() => {
                      setIncomeInput(String(data.monthlyIncome || ""));
                      showModal("income");
                    }}
                    type="button"
                  >
                    <PencilLine aria-hidden="true" className="size-3.5" />
                    {data.monthlyIncome ? "Editar ingreso" : "Definir ingresos"}
                  </button>
                </Metric>
                <Metric
                  icon={ReceiptText}
                  label="Gastos del mes"
                  value={formatCurrency(totals.total)}
                  tint="coral"
                  detail={`${totals.count} ${totals.count === 1 ? "movimiento" : "movimientos"}`}
                />
                <Metric
                  icon={Banknote}
                  label="Disponible"
                  value={formatCurrency(
                    data.monthlyIncome ? data.monthlyIncome - totals.total : 0,
                  )}
                  tint="lime"
                  detail={
                    data.monthlyIncome
                      ? "Ingresos menos gastos"
                      : "Configura tus ingresos"
                  }
                />
                <Metric
                  icon={Activity}
                  label="Del ingreso utilizado"
                  value={`${spentPercent}%`}
                  tint="sky"
                  detail={
                    data.monthlyIncome
                      ? "Este mes"
                      : "Sin ingresos configurados"
                  }
                />
              </section>

              <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
                <div className="rounded-md border border-[var(--line)] bg-white p-5 sm:p-6">
                  <SectionHeading title="Fijos y variables" icon={Activity} />
                  {totals.count ? (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
                      <div
                        aria-label={`Distribución: gastos fijos ${formatCurrency(totals.fixed)} y variables ${formatCurrency(totals.variable)}`}
                        className="size-40 shrink-0 rounded-full"
                        role="img"
                        style={{
                          background: `conic-gradient(#718a35 0 ${(totals.fixed / totals.total) * 100}%, #df8367 ${(totals.fixed / totals.total) * 100}% 100%)`,
                        }}
                      />
                      <div className="flex min-w-48 flex-col gap-5">
                        <Breakdown
                          label="Fijos"
                          value={totals.fixed}
                          color="bg-[#718a35]"
                          total={totals.total}
                          icon={CalendarClock}
                        />
                        <Breakdown
                          label="Variables"
                          value={totals.variable}
                          color="bg-[#df8367]"
                          total={totals.total}
                          icon={ArrowDownRight}
                        />
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={ReceiptText}
                      title="Todavía no hay gastos"
                      detail="Cuando registres un gasto, aquí verás cómo se distribuye entre fijos y variables."
                      action={
                        <ActionButton icon={Plus} onClick={openExpense}>
                          Registrar primer gasto
                        </ActionButton>
                      }
                    />
                  )}
                </div>

                <div className="rounded-md border border-[var(--line)] bg-white p-5 sm:p-6">
                  <SectionHeading
                    title="Gastos por categoría"
                    icon={Shapes}
                    action={
                      categoryTotals.length ? (
                        <SortDirectionToggle
                          label="Orden categorías"
                          order={categorySortOrder}
                          onChange={setCategorySortOrder}
                        />
                      ) : undefined
                    }
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Incluye gastos registrados y compromisos fijos pendientes.
                  </p>
                  {categoryTotals.length ? (
                    <div className="mt-5 space-y-4">
                      {sortedCategoryTotals.map((category) => {
                        const Icon = iconByName[category.icon];
                        return (
                          <div
                            className="flex items-center gap-3"
                            key={category.id}
                          >
                            <span
                              className="flex size-9 shrink-0 items-center justify-center rounded-md"
                              style={{
                                backgroundColor: `${category.color}18`,
                                color: category.color,
                              }}
                            >
                              <Icon aria-hidden="true" className="size-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                <span className="truncate">
                                  {category.label}
                                </span>
                                <span className="shrink-0 font-medium tabular-nums">
                                  {formatCurrency(category.total)}
                                </span>
                              </div>
                              <div
                                aria-label={`${category.label}: ${formatCurrency(category.total)}`}
                                className="h-2 overflow-hidden rounded-full bg-[var(--paper)]"
                              >
                                <div
                                  className="h-full rounded-full transition-[width]"
                                  style={{
                                    width: `${maxCategory ? (category.total / maxCategory) * 100 : 0}%`,
                                    backgroundColor: category.color,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Shapes}
                      title="Sin categorías aún"
                      detail="Las categorías aparecerán cuando registres tus primeros gastos."
                    />
                  )}
                </div>
              </section>

              <section className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="rounded-md border border-[var(--line)] bg-white p-5 sm:p-6">
                  <SectionHeading
                    title="Ritmo de la semana"
                    icon={CalendarRange}
                  />
                  {totals.count ? (
                    <div className="mt-6 grid h-40 grid-cols-7 items-end gap-2 sm:gap-4">
                      {weekdayTotals.map(({ label, total }) => (
                        <div
                          className="flex h-full flex-col items-center justify-end gap-2"
                          key={label}
                        >
                          <span className="text-[10px] text-[var(--muted)] sm:text-xs">
                            {total ? formatCompact(total) : ""}
                          </span>
                          <div
                            aria-label={`${label}: ${formatCurrency(total)}`}
                            className="flex h-24 w-full items-end overflow-hidden rounded-t-sm bg-[var(--paper)]"
                          >
                            <div
                              className={`w-full rounded-t-sm transition-[height] ${total ? "bg-[var(--ink)]" : "bg-transparent"}`}
                              style={{
                                height: maxWeekday
                                  ? `${Math.max((total / maxWeekday) * 100, total ? 7 : 0)}%`
                                  : "0%",
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-[var(--muted)] sm:text-xs">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={CalendarRange}
                      title="Tu semana todavía está en blanco"
                      detail="El gráfico se llenará con la fecha de cada gasto que registres."
                    />
                  )}
                </div>

                <div className="rounded-md border border-[var(--line)] bg-white p-5 sm:p-6">
                  <SectionHeading title="Ritmo mensual" icon={CalendarDays} />
                  {totals.count ? (
                    <div className="mt-6 grid grid-cols-[repeat(31,minmax(0,1fr))] items-end gap-1 overflow-x-auto">
                      {monthDayTotals.map(({ day, total }) => (
                        <div
                          className="flex min-w-0 flex-col items-center gap-2"
                          key={day}
                        >
                          <div
                            aria-label={`Día ${day}: ${formatCurrency(total)}`}
                            className="flex h-32 w-full items-end rounded-t-sm bg-[var(--paper)]"
                            title={`${day}: ${formatCurrency(total)}`}
                          >
                            <div
                              className="w-full rounded-t-sm bg-[#7196aa] transition-[height]"
                              style={{
                                height: maxMonthDay
                                  ? `${Math.max((total / maxMonthDay) * 100, total ? 6 : 0)}%`
                                  : "0%",
                              }}
                            />
                          </div>
                          <span className="text-[9px] text-[var(--muted)]">
                            {day === 1 ||
                            day % 5 === 0 ||
                            day === monthDayTotals.length
                              ? day
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={CalendarDays}
                      title="Tu mes todavía está en blanco"
                      detail="El gráfico mostrará el gasto de cada día del mes seleccionado."
                    />
                  )}
                </div>
              </section>

              <section className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="rounded-md border border-[var(--line)] bg-white p-5 sm:p-6">
                  <SectionHeading
                    title="Gastos fijos"
                    icon={CalendarClock}
                    action={
                      <div className="flex items-center gap-3">
                        {topFixedExpenses.length ? (
                          <SortDirectionToggle
                            label="Orden gastos fijos"
                            order={fixedSortOrder}
                            onChange={setFixedSortOrder}
                          />
                        ) : null}
                        <button
                          className="text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]"
                          onClick={() => setView("fixed")}
                          type="button"
                        >
                          Ver todos
                        </button>
                      </div>
                    }
                  />
                  <div className="mt-5 flex items-center justify-between border-b border-[var(--line)] pb-4">
                    <span className="text-sm text-[var(--muted)]">
                      Compromiso mensual estimado
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(monthlyCommitment)}
                    </span>
                  </div>
                  {fixedPaymentStatus.total > 0 ? (
                    <div
                      aria-label="Filtrar cuentas por pago"
                      className="mt-4 flex flex-wrap items-center gap-2"
                      role="group"
                    >
                      {(
                        [
                          {
                            id: "all",
                            label: "Todas",
                            count: fixedPaymentStatus.total,
                            icon: ListIcon,
                          },
                          {
                            id: "paid",
                            label: "Pagadas",
                            count: fixedPaymentStatus.paid,
                            icon: Check,
                          },
                          {
                            id: "pending",
                            label: "Pendientes",
                            count: fixedPaymentStatus.pending,
                            icon: CalendarClock,
                          },
                        ] as const
                      ).map(({ id, label, count, icon: Icon }) => (
                        <button
                          aria-pressed={fixedPaymentFilter === id}
                          className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium ${fixedPaymentFilter === id ? "border-[var(--accent-border)] bg-[var(--accent)] text-[var(--ink)]" : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"}`}
                          key={id}
                          onClick={() => setFixedPaymentFilter(id)}
                          type="button"
                        >
                          <Icon aria-hidden="true" className="size-3.5" />
                          {label} ({count})
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {topFixedExpenses.length ? (
                    <ul className="divide-y divide-[var(--line)]">
                      {topFixedExpenses.map((expense) => {
                        const Icon =
                          iconByName[
                            categories.find(
                              (category) => category.id === expense.categoryId,
                            )?.icon ?? "shapes"
                          ];
                        return (
                          <li
                            className="flex items-center gap-3 py-3"
                            key={expense.id}
                          >
                            <span className="flex size-9 items-center justify-center rounded-md bg-[var(--paper)]">
                              <Icon aria-hidden="true" className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {expense.name}
                            </span>
                            <span className="text-sm font-medium tabular-nums">
                              {formatCurrency(getMonthlyCommitment(expense))}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="py-5 text-sm text-[var(--muted)]">
                      {fixedPaymentStatus.total === 0
                        ? "Aún no configuras compromisos fijos."
                        : fixedPaymentFilter === "paid"
                          ? "Aún no hay cuentas pagadas en este mes."
                          : "No hay cuentas pendientes en este mes."}
                    </div>
                  )}
                </div>

                <Insight
                  expensesCount={totals.count}
                  categoryTotals={categoryTotals}
                  weekdayTotals={weekdayTotals}
                />
              </section>
            </>
          ) : null}

          {view === "expenses" ? (
            <section className="rounded-md border border-[var(--line)] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-5 sm:px-6">
                <p className="text-sm text-[var(--muted)]">
                  {historyExpenses.length} registros ·{" "}
                  {formatCurrency(historyTotal)}
                </p>
                <div className="flex items-center gap-2">
                  {(["all", "fixed", "variable"] as const).map((filter) => {
                    const label =
                      filter === "all"
                        ? "Todos"
                        : filter === "fixed"
                          ? "Fijos"
                          : "Variables";
                    const Icon =
                      filter === "all"
                        ? ListIcon
                        : filter === "fixed"
                          ? CalendarClock
                          : ArrowDownRight;
                    return (
                      <button
                        aria-pressed={expenseFilter === filter}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium sm:px-3 ${expenseFilter === filter ? "border-[var(--accent-border)] bg-[var(--accent)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"}`}
                        key={filter}
                        onClick={() => {
                          setExpenseFilter(filter);
                          setHistoryPage(1);
                        }}
                        type="button"
                      >
                        <Icon aria-hidden="true" className="size-3.5" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {pagedHistoryExpenses.length > 0 && !invalidHistoryRange ? (
                <ul className="divide-y divide-[var(--line)] px-5 max-[360px]:px-3 sm:px-6">
                  {pagedHistoryExpenses.map((expense) => {
                    const category = categories.find(
                      (item) => item.id === expense.categoryId,
                    )!;
                    const Icon = iconByName[category.icon];
                    return (
                      <li
                        className="flex items-center gap-3 py-4"
                        key={expense.id}
                      >
                        <span
                          className="flex size-10 shrink-0 items-center justify-center rounded-md"
                          style={{
                            color: category.color,
                            backgroundColor: `${category.color}18`,
                          }}
                        >
                          <Icon aria-hidden="true" className="size-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {expense.description || category.label}
                          </span>
                          <span className="mt-1 block text-xs text-[var(--muted)]">
                            {category.label} ·{" "}
                            {new Intl.DateTimeFormat("es-CL", {
                              day: "numeric",
                              month: "short",
                            }).format(new Date(`${expense.date}T12:00:00`))}
                          </span>
                        </span>
                        <span className="hidden rounded-full bg-[var(--paper)] px-2.5 py-1 text-[11px] text-[var(--muted)] sm:inline">
                          {expense.type === "fixed" ? "Fijo" : "Variable"}
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(expense.amount)}
                        </span>
                        <IconButton
                          className="size-9 shrink-0"
                          label={`Editar ${expense.description || category.label}`}
                          onClick={() => openExpenseForEdit(expense)}
                        >
                          <PencilLine aria-hidden="true" className="size-4" />
                        </IconButton>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={ReceiptText}
                  title={
                    invalidHistoryRange
                      ? "El rango de fechas no es válido"
                      : expenseFilter === "all"
                        ? "Sin gastos para este período"
                        : `Sin gastos ${expenseFilter === "fixed" ? "fijos" : "variables"} para este período`
                  }
                  detail={
                    invalidHistoryRange
                      ? "Ajusta las fechas para que la fecha inicial no sea posterior a la fecha final."
                      : "Prueba otro mes o rango de fechas, o agrega un gasto nuevo."
                  }
                  action={
                    <ActionButton icon={Plus} onClick={openExpense}>
                      Agregar gasto
                    </ActionButton>
                  }
                />
              )}
              {historyExpenses.length > 0 && !invalidHistoryRange ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-4 text-sm sm:px-6">
                  <span className="text-[var(--muted)]">
                    Mostrando {(currentHistoryPage - 1) * historyPageSize + 1}–
                    {Math.min(
                      currentHistoryPage * historyPageSize,
                      historyExpenses.length,
                    )}{" "}
                    de {historyExpenses.length}
                  </span>
                  {historyPageCount > 1 ? (
                    <div className="flex items-center gap-2">
                      <IconButton
                        label="Página anterior"
                        className="size-9 disabled:cursor-default disabled:opacity-40"
                        onClick={() =>
                          setHistoryPage((page) => Math.max(1, page - 1))
                        }
                      >
                        <ChevronLeft aria-hidden="true" className="size-4" />
                      </IconButton>
                      <span
                        aria-live="polite"
                        className="min-w-16 text-center text-xs text-[var(--muted)]"
                      >
                        {currentHistoryPage} de {historyPageCount}
                      </span>
                      <IconButton
                        label="Página siguiente"
                        className="size-9 disabled:cursor-default disabled:opacity-40"
                        onClick={() =>
                          setHistoryPage((page) =>
                            Math.min(historyPageCount, page + 1),
                          )
                        }
                      >
                        <ChevronRight aria-hidden="true" className="size-4" />
                      </IconButton>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {view === "fixed" ? (
            <section className="rounded-md border border-[var(--line)] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] p-5 sm:px-6">
                <div>
                  <h2 className="font-semibold">Compromisos recurrentes</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {
                      data.fixedExpenses.filter((expense) => expense.active)
                        .length
                    }{" "}
                    gastos fijos activos
                  </p>
                </div>
                <div className="flex min-w-56 items-center gap-3 rounded-md bg-[var(--accent)] px-4 py-3">
                  <CalendarClock
                    aria-hidden="true"
                    className="size-5 shrink-0 text-[var(--ink)]"
                  />
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)]">
                      Total mensual estimado
                    </p>
                    <p className="text-xl font-semibold tabular-nums">
                      {formatCurrency(monthlyCommitment)}
                    </p>
                  </div>
                </div>
              </div>
              {data.fixedExpenses.length ? (
                <ul className="divide-y divide-[var(--line)] px-5 max-[360px]:px-3 sm:px-6">
                  {data.fixedExpenses.map((expense) => {
                    const category = categories.find(
                      (item) => item.id === expense.categoryId,
                    )!;
                    const Icon = iconByName[category.icon];
                    const frequencyLabel = frequencyOptions.find(
                      (item) => item.id === expense.frequency,
                    )?.label;
                    const currentPeriod = getRecurringPeriodKey(
                      expense.frequency,
                      getLocalDateValue(),
                    );
                    const paymentRecorded = data.expenses.some(
                      (payment) =>
                        payment.fixedExpenseId === expense.id &&
                        getRecurringPeriodKey(
                          expense.frequency,
                          payment.date,
                        ) === currentPeriod,
                    );
                    return (
                      <li
                        className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-4"
                        key={expense.id}
                      >
                        <span
                          className="flex size-10 shrink-0 items-center justify-center rounded-md"
                          style={{
                            color: category.color,
                            backgroundColor: `${category.color}18`,
                          }}
                        >
                          <Icon aria-hidden="true" className="size-[18px]" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {expense.name}
                          </span>
                          <span className="mt-1 block text-xs text-[var(--muted)]">
                            {category.label} · {frequencyLabel}
                            {expense.dueDay !== null
                              ? ` · vence el ${expense.dueDay}`
                              : ""}
                          </span>
                        </span>
                        <div className="col-start-2 flex min-w-0 items-center justify-between gap-2 max-[360px]:flex-col max-[360px]:items-start max-[360px]:gap-2 sm:contents">
                          <span className="shrink-0 text-sm font-semibold tabular-nums">
                            {formatCurrency(expense.amount)}
                            <span className="ml-1 text-xs font-normal text-[var(--muted)]">
                              /
                              {frequencyLabel === "Mensual"
                                ? "mes"
                                : frequencyLabel === "Semanal"
                                  ? "sem"
                                  : "año"}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <button
                              aria-label={
                                paymentRecorded
                                  ? `Revertir pago de ${expense.name} en este período`
                                  : `Registrar pago de ${expense.name}`
                              }
                              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition sm:px-3 ${paymentRecorded ? "border-[var(--accent-border)] bg-[var(--accent)] text-[var(--ink)] hover:bg-[var(--accent-hover)]" : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--ink)] hover:text-[var(--ink)]"}`}
                              onClick={() => recordFixedPayment(expense)}
                              type="button"
                            >
                              {paymentRecorded ? (
                                <Undo2
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                              ) : (
                                <Plus aria-hidden="true" className="size-3.5" />
                              )}
                              <span className="hidden sm:inline">
                                {paymentRecorded
                                  ? "Revertir pago"
                                  : "Registrar pago"}
                              </span>
                              <span className="sm:hidden">
                                {paymentRecorded ? "Revertir" : "Pagar"}
                              </span>
                            </button>
                            <IconButton
                              className="size-9 shrink-0"
                              label={`Editar gasto fijo ${expense.name}`}
                              onClick={() => openFixedForEdit(expense)}
                            >
                              <PencilLine
                                aria-hidden="true"
                                className="size-4"
                              />
                            </IconButton>
                            <IconButton
                              label={`Eliminar ${expense.name}`}
                              onClick={() => deleteFixed(expense.id)}
                            >
                              <Trash2 aria-hidden="true" className="size-4" />
                            </IconButton>
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={CalendarClock}
                  title="Tus gastos fijos comienzan aquí"
                  detail="Agrega arriendo, cuentas, servicios o cualquier compromiso recurrente. Las sugerencias se pueden editar."
                  action={
                    <ActionButton icon={Plus} onClick={openFixed}>
                      Configurar primer gasto fijo
                    </ActionButton>
                  }
                />
              )}
            </section>
          ) : null}

          {view === "profile" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-6 rounded-md border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--lime)] text-xl font-bold text-[var(--ink)] shadow-sm">
                    {(userProfile.firstName[0] || "P").toUpperCase()}
                    {(userProfile.lastName[0] || "U").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-semibold">
                        {userProfile.firstName} {userProfile.lastName}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0db] px-2.5 py-0.5 text-xs font-medium text-[#536824]">
                        <CheckCircle2 aria-hidden="true" className="size-3.5" />
                        Cuenta activa
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-[var(--muted)]">
                      <Mail aria-hidden="true" className="size-3.5 shrink-0" />
                      {userProfile.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)] sm:border-t-0 sm:pt-0">
                  <div className="rounded-md bg-[var(--paper)] px-3 py-2">
                    <span className="block font-semibold text-[var(--ink)]">
                      Moneda activa
                    </span>
                    <span>Pesos Chilenos (CLP)</span>
                  </div>
                  <div className="rounded-md bg-[var(--paper)] px-3 py-2">
                    <span className="block font-semibold text-[var(--ink)]">
                      Seguridad
                    </span>
                    <span>
                      {data.profile?.password
                        ? "Contraseña configurada"
                        : "Sin contraseña definida"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <PersonalProfileForm
                  key={`${userProfile.firstName}-${userProfile.lastName}-${userProfile.email}`}
                  onSave={(updated) => {
                    updateFinanceData((current) => ({
                      ...current,
                      profile: {
                        ...current.profile,
                        ...updated,
                      },
                    }));
                  }}
                  profile={userProfile}
                />

                <PasswordSecurityForm
                  existingPassword={userProfile.password}
                  hasExistingPassword={Boolean(userProfile.password)}
                  onSave={(nextPassword) => {
                    updateFinanceData((current) => ({
                      ...current,
                      profile: {
                        ...current.profile,
                        password: nextPassword,
                      },
                    }));
                  }}
                />
              </div>

              <div className="rounded-md border border-[var(--line)] bg-[#f8faf6] p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--lime)] text-[var(--ink)]">
                    <Shield aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-[var(--ink)]">
                      Privacidad y persistencia
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      Tu información de perfil se almacena de forma segura en este dispositivo.
                      Al iniciar sesión con tu cuenta, podrás respaldar tus movimientos en la nube y sincronizarlos con cualquier equipo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-[var(--line)] bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--ink)]">
                      Acceso y cuentas
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Inicia sesión con tu correo o crea una nueva cuenta en Pulso+.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-hover)]"
                      href="/login"
                    >
                      <LogIn aria-hidden="true" className="size-4" />
                      Iniciar sesión
                    </Link>
                    <Link
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--paper)]"
                      href="/register"
                    >
                      <UserPlus aria-hidden="true" className="size-4" />
                      Crear cuenta
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <footer className="mt-8 flex items-center justify-center gap-2 text-xs text-[var(--muted)] lg:hidden">
            <Check aria-hidden="true" className="size-3.5" />
            Guardado en este dispositivo
          </footer>
        </div>
      </main>

      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--paper)]/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
      >
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            aria-current={view === id ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-medium ${view === id ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}
            key={id}
            onClick={() => setView(id)}
            type="button"
          >
            <Icon
              aria-hidden="true"
              className={`size-[18px] ${view === id ? "text-[#718a35]" : ""}`}
            />
            {label}
          </button>
        ))}
      </nav>

      {modal ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <section
            aria-labelledby="modal-title"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-lg bg-[var(--paper)] p-5 shadow-2xl sm:rounded-lg sm:p-7"
            role="dialog"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="mb-2 flex size-9 items-center justify-center rounded-md bg-[var(--lime)]">
                  <ModalIcon modal={modal} />
                </span>
                <h2 className="text-xl font-semibold" id="modal-title">
                  {modal === "expense"
                    ? editingExpenseId
                      ? "Editar gasto"
                      : "Registrar gasto"
                    : modal === "fixed"
                      ? editingFixedExpenseId
                        ? "Editar gasto fijo"
                        : "Nuevo gasto fijo"
                      : "Ingreso mensual"}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {modal === "expense"
                    ? editingExpenseId
                      ? "Actualiza los datos de este movimiento."
                      : "Un movimiento y listo."
                    : modal === "fixed"
                      ? editingFixedExpenseId
                        ? "Actualiza los datos de este compromiso."
                        : "Elige una sugerencia o escribe tu propio nombre."
                      : "Define el ingreso que usarás en tu resumen."}
                </p>
              </div>
              <IconButton label="Cerrar" onClick={() => setModal(null)}>
                <X aria-hidden="true" className="size-4" />
              </IconButton>
            </div>

            {modal === "expense" ? (
              <form className="space-y-5" onSubmit={addExpense}>
                <label className="block">
                  <FieldLabel icon={Banknote}>Monto en pesos</FieldLabel>
                  <div className="flex h-12 items-center rounded-md border border-[var(--line)] bg-white px-3 focus-within:border-[var(--ink)]">
                    <span className="mr-2 text-sm text-[var(--muted)]">$</span>
                    <MoneyInput
                      ariaLabel="Monto en pesos"
                      autoFocus
                      className="w-full bg-transparent text-lg font-semibold tabular-nums outline-none"
                      onChange={setAmount}
                      required
                      value={amount}
                    />
                  </div>
                </label>
                <label className="block">
                  <FieldLabel icon={PencilLine}>Descripción</FieldLabel>
                  <input
                    className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--ink)]"
                    maxLength={80}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Ej. compra de la semana"
                    spellCheck={true}
                    value={description}
                  />
                </label>
                <div>
                  <FieldLabel icon={Activity}>Tipo de gasto</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: "variable",
                        label: "Variable",
                        icon: ArrowDownRight,
                      },
                      {
                        id: "fixed",
                        label: "Fijo",
                        icon: CalendarClock,
                      },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        aria-pressed={expenseType === id}
                        className={`flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${expenseType === id ? "border-[var(--accent-border)] bg-[var(--accent)] text-[var(--ink)]" : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"}`}
                        disabled={expenseTypeLocked}
                        key={id}
                        onClick={() => {
                          const nextType = id as ExpenseType;
                          setExpenseType(nextType);
                          if (
                            nextType === "fixed" &&
                            selectedCategory === "small-expenses"
                          ) {
                            setSelectedCategory("other");
                          }
                        }}
                        type="button"
                      >
                        <Icon aria-hidden="true" className="size-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel icon={Shapes}>Categoría</FieldLabel>
                  <CategoryPicker
                    selected={selectedCategory}
                    onSelect={setSelectedCategory}
                    type={expenseType}
                  />
                </div>
                <label className="block">
                  <FieldLabel icon={CalendarDays}>Fecha</FieldLabel>
                  <input
                    className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--ink)]"
                    onChange={(event) => setExpenseDate(event.target.value)}
                    required
                    type="date"
                    value={expenseDate}
                  />
                </label>
                {formError ? (
                  <p className="text-sm text-[#ad3e35]" role="alert">
                    {formError}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
                  <button
                    className="h-10 rounded-md px-4 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
                    onClick={() => setModal(null)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--ink)] hover:bg-[var(--accent-hover)]"
                    type="submit"
                  >
                    {editingExpenseId ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : (
                      <Plus aria-hidden="true" className="size-4" />
                    )}
                    {editingExpenseId ? "Guardar cambios" : "Guardar gasto"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "fixed" ? (
              <form className="space-y-5" onSubmit={addFixed}>
                <div>
                  <FieldLabel icon={Sparkles}>Nombres sugeridos</FieldLabel>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {fixedSuggestions.map(
                      ({ name, categoryId, icon: Icon, description }) => (
                        <button
                          aria-pressed={fixedName === name}
                          aria-describedby={
                            description
                              ? "fixed-suggestion-combustible-tooltip"
                              : undefined
                          }
                          className={`group relative flex min-h-10 items-center gap-2 rounded-md border px-2.5 text-left text-xs font-medium transition ${fixedName === name ? "border-[var(--ink)] bg-[var(--lime)]" : "border-[var(--line)] bg-white hover:border-[var(--ink)]"}`}
                          key={name}
                          onClick={() => {
                            setFixedName(name);
                            setFixedCategory(categoryId);
                          }}
                          type="button"
                        >
                          <Icon
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                          {name}
                          {description ? (
                            <span
                              className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-48 -translate-x-1/2 rounded-md bg-[var(--ink)] px-3 py-2 text-left text-xs leading-5 text-white shadow-lg group-hover:block group-focus-visible:block"
                              id="fixed-suggestion-combustible-tooltip"
                              role="tooltip"
                            >
                              {description}
                            </span>
                          ) : null}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <label className="block">
                  <FieldLabel icon={PencilLine}>Nombre del gasto</FieldLabel>
                  <input
                    autoFocus={!fixedName}
                    className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--ink)]"
                    maxLength={60}
                    onChange={(event) => setFixedName(event.target.value)}
                    placeholder="Escribe un nombre"
                    required
                    spellCheck={true}
                    value={fixedName}
                  />
                </label>
                <label className="block">
                  <FieldLabel icon={Banknote}>Monto</FieldLabel>
                  <div className="flex h-11 items-center rounded-md border border-[var(--line)] bg-white px-3 focus-within:border-[var(--ink)]">
                    <span className="mr-2 text-sm text-[var(--muted)]">$</span>
                    <MoneyInput
                      ariaLabel="Monto"
                      className="w-full bg-transparent text-sm font-medium outline-none"
                      onChange={setFixedAmount}
                      required
                      value={fixedAmount}
                    />
                  </div>
                </label>
                <div>
                  <FieldLabel icon={Shapes}>Categoría</FieldLabel>
                  <CategoryPicker
                    selected={fixedCategory}
                    onSelect={setFixedCategory}
                    type="fixed"
                  />
                </div>
                <div>
                  <FieldLabel icon={Repeat2}>Frecuencia</FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {frequencyOptions.map(
                      ({ id, label, description, icon: Icon }) => (
                        <button
                          aria-pressed={frequency === id}
                          aria-label={`${label}: ${description}`}
                          aria-describedby={`frequency-${id}-tooltip`}
                          className={`group relative flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-medium ${frequency === id ? "border-[var(--accent-border)] bg-[var(--accent)] text-[var(--ink)]" : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"}`}
                          key={id}
                          onClick={() => setFrequency(id)}
                          title={description}
                          type="button"
                        >
                          <Icon aria-hidden="true" className="size-4" />
                          {label}
                          <span
                            className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-48 -translate-x-1/2 rounded-md bg-[var(--ink)] px-3 py-2 text-left text-xs leading-5 text-white shadow-lg group-hover:block group-focus-visible:block"
                            id={`frequency-${id}-tooltip`}
                            role="tooltip"
                          >
                            {description}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-medium">
                    <input
                      checked={hasDueDay}
                      className="size-4 accent-[#718a35]"
                      onChange={(event) => setHasDueDay(event.target.checked)}
                      type="checkbox"
                    />
                    <CalendarClock
                      aria-hidden="true"
                      className="size-4 text-[var(--muted)]"
                    />
                    <span>Agregar día de vencimiento</span>
                  </label>
                  {hasDueDay ? (
                    <label className="mt-4 block">
                      <FieldLabel icon={CalendarClock}>
                        Día de vencimiento
                      </FieldLabel>
                      <input
                        className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--ink)]"
                        max="31"
                        min="1"
                        onChange={(event) => setDueDay(event.target.value)}
                        required
                        type="number"
                        value={dueDay}
                      />
                    </label>
                  ) : null}
                </div>
                {formError ? (
                  <p className="text-sm text-[#ad3e35]" role="alert">
                    {formError}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
                  <button
                    className="h-10 rounded-md px-4 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
                    onClick={() => setModal(null)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--ink)] hover:bg-[var(--accent-hover)]"
                    type="submit"
                  >
                    {editingFixedExpenseId ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : (
                      <Plus aria-hidden="true" className="size-4" />
                    )}
                    {editingFixedExpenseId
                      ? "Guardar cambios"
                      : "Guardar gasto fijo"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "income" ? (
              <form className="space-y-5" onSubmit={saveIncome}>
                <label className="block">
                  <FieldLabel icon={Wallet}>
                    Ingreso mensual en pesos
                  </FieldLabel>
                  <div className="flex h-12 items-center rounded-md border border-[var(--line)] bg-white px-3 focus-within:border-[var(--ink)]">
                    <span className="mr-2 text-sm text-[var(--muted)]">$</span>
                    <MoneyInput
                      ariaLabel="Ingreso mensual en pesos"
                      autoFocus
                      className="w-full bg-transparent text-lg font-semibold outline-none"
                      onChange={setIncomeInput}
                      value={incomeInput}
                    />
                  </div>
                </label>
                {formError ? (
                  <p className="text-sm text-[#ad3e35]" role="alert">
                    {formError}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
                  <button
                    className="h-10 rounded-md px-4 text-sm font-medium text-[var(--muted)]"
                    onClick={() => setModal(null)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--ink)] hover:bg-[var(--accent-hover)]"
                    type="submit"
                  >
                    <Check aria-hidden="true" className="size-4" />
                    Guardar ingreso
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ListIcon({ className }: { className?: string }) {
  return <ReceiptText aria-hidden="true" className={className} />;
}

function Metric({
  icon: Icon,
  label,
  value,
  tint,
  detail,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tint: "sky" | "coral" | "lime";
  detail?: string;
  children?: ReactNode;
}) {
  const tintClass =
    tint === "sky"
      ? "bg-[var(--sky)]"
      : tint === "coral"
        ? "bg-[var(--coral)]"
        : "bg-[var(--lime)]";
  return (
    <article className="min-h-36 border-b border-[var(--line)] p-5 last:border-r-0 sm:border-r sm:px-6 sm:py-5 xl:border-b-0">
      <span
        className={`mb-4 flex size-9 items-center justify-center rounded-md ${tintClass}`}
      >
        <Icon aria-hidden="true" className="size-[18px]" />
      </span>
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
      ) : null}
      {children}
    </article>
  );
}

function Breakdown({
  label,
  value,
  color,
  total,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  total: number;
  icon: LucideIcon;
}) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-md ${color} text-white`}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-[var(--muted)]">
          {label} · {percent}%
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold tabular-nums">
          {formatCurrency(value)}
        </span>
      </span>
    </div>
  );
}

function CategoryPicker({
  selected,
  onSelect,
  type,
}: {
  selected: CategoryId;
  onSelect: (category: CategoryId) => void;
  type: ExpenseType;
}) {
  const availableCategories = getCategoriesForExpenseType(type);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {availableCategories.map((category) => {
        const Icon = iconByName[category.icon];
        return (
          <button
            aria-pressed={selected === category.id}
            className={`flex min-h-10 items-center gap-2 rounded-md border px-2.5 text-left text-xs font-medium transition ${selected === category.id ? "border-[var(--ink)] bg-[var(--lime)] text-[var(--ink)]" : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--ink)] hover:text-[var(--ink)]"}`}
            key={category.id}
            onClick={() => onSelect(category.id)}
            type="button"
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  onClick,
  children,
}: {
  icon: LucideIcon;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-hover)]"
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
      {children}
    </button>
  );
}

function Insight({
  expensesCount,
  categoryTotals,
  weekdayTotals,
}: {
  expensesCount: number;
  categoryTotals: ReturnType<typeof getCategoryTotals>;
  weekdayTotals: ReturnType<typeof getWeekdayTotals>;
}) {
  const topCategory = categoryTotals[0];
  const topDay = [...weekdayTotals].sort(
    (left, right) => right.total - left.total,
  )[0];
  return (
    <section className="mt-5 flex gap-4 rounded-md border border-[var(--line)] bg-[#e8f0db] p-5 sm:p-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--lime)]">
        <Lightbulb aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h2 className="font-semibold">Una pista de tu mes</h2>
        {expensesCount >= 3 && topCategory && topDay?.total ? (
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            Tu categoría con más movimiento es{" "}
            <strong className="font-semibold text-[var(--ink)]">
              {topCategory.label}
            </strong>{" "}
            y el día con mayor gasto es{" "}
            <strong className="font-semibold text-[var(--ink)]">
              {topDay.label}
            </strong>
            .
          </p>
        ) : (
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {expensesCount
              ? "Cuando haya más movimientos podremos mostrarte patrones de gasto con mayor contexto."
              : "Aún no hay suficientes movimientos para identificar patrones. Tus gastos aparecerán aquí al registrarlos."}
          </p>
        )}
      </div>
    </section>
  );
}

function ModalIcon({ modal }: { modal: Exclude<Modal, null> }) {
  if (modal === "expense")
    return <ReceiptText aria-hidden="true" className="size-4" />;
  if (modal === "fixed")
    return <CalendarClock aria-hidden="true" className="size-4" />;
  return <Wallet aria-hidden="true" className="size-4" />;
}

function PersonalProfileForm({
  profile,
  onSave,
}: {
  profile: UserProfile;
  onSave: (updated: Omit<UserProfile, "password">) => void;
}) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const parsed = userProfileSchema.safeParse({
      firstName,
      lastName,
      email,
      password: profile.password || "",
    });

    if (!parsed.success) {
      const issue =
        parsed.error.issues[0]?.message ?? "Revisa los campos del perfil.";
      setStatus({ type: "error", message: issue });
      return;
    }

    onSave({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
    });

    setStatus({
      type: "success",
      message: "¡Datos personales actualizados correctamente!",
    });
  }

  return (
    <div className="flex flex-col justify-between rounded-md border border-[var(--line)] bg-white p-5 sm:p-6">
      <div>
        <SectionHeading icon={User} title="Datos personales" />
        <p className="mt-1 text-sm text-[var(--muted)]">
          Modifica tu nombre, apellido y correo de contacto.
        </p>

        <form
          className="mt-6 space-y-4"
          id="profile-form"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <FieldLabel icon={User}>Nombre</FieldLabel>
              <input
                className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--ink)]"
                maxLength={50}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Tu nombre"
                required
                type="text"
                value={firstName}
              />
            </label>
            <label className="block">
              <FieldLabel icon={User}>Apellido</FieldLabel>
              <input
                className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--ink)]"
                maxLength={50}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Tu apellido"
                required
                type="text"
                value={lastName}
              />
            </label>
          </div>

          <label className="block">
            <FieldLabel icon={Mail}>Correo electrónico</FieldLabel>
            <input
              className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--ink)]"
              maxLength={80}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              required
              type="email"
              value={email}
            />
          </label>

          {status ? (
            <div
              className={`flex items-center gap-2 rounded-md p-3 text-sm ${status.type === "success" ? "bg-[#e8f0db] text-[#3e5519]" : "bg-[#fde8e4] text-[#ad3e35]"}`}
              role="alert"
            >
              {status.type === "success" ? (
                <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
              ) : (
                <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          ) : null}
        </form>
      </div>

      <div className="mt-6 border-t border-[var(--line)] pt-4">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
          form="profile-form"
          type="submit"
        >
          <Check aria-hidden="true" className="size-4" />
          Guardar datos personales
        </button>
      </div>
    </div>
  );
}

function PasswordSecurityForm({
  hasExistingPassword,
  existingPassword,
  onSave,
}: {
  hasExistingPassword: boolean;
  existingPassword?: string;
  onSave: (newPassword: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (hasExistingPassword && currentPassword !== (existingPassword || "")) {
      setStatus({
        type: "error",
        message: "La contraseña actual no es correcta.",
      });
      return;
    }

    const parsed = passwordChangeSchema.safeParse({
      currentPassword: currentPassword || "",
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const issue =
        parsed.error.issues[0]?.message ?? "Error al validar la contraseña.";
      setStatus({ type: "error", message: issue });
      return;
    }

    onSave(parsed.data.newPassword);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus({
      type: "success",
      message: "¡Tu contraseña ha sido actualizada con éxito!",
    });
  }

  return (
    <div className="flex flex-col justify-between rounded-md border border-[var(--line)] bg-white p-5 sm:p-6">
      <div>
        <SectionHeading icon={ShieldCheck} title="Seguridad y contraseña" />
        <p className="mt-1 text-sm text-[var(--muted)]">
          Gestiona tu clave de acceso para proteger tu información.
        </p>

        <form
          className="mt-6 space-y-4"
          id="password-form"
          onSubmit={handleSubmit}
        >
          {hasExistingPassword ? (
            <label className="block">
              <FieldLabel icon={Lock}>Contraseña actual</FieldLabel>
              <div className="relative">
                <input
                  className="h-11 w-full rounded-md border border-[var(--line)] bg-white pr-10 pl-3 text-sm outline-none focus:border-[var(--ink)]"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  required
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                />
                <button
                  aria-label={
                    showCurrentPassword ? "Ocultar contraseña" : "Ver contraseña"
                  }
                  className="absolute top-0 right-0 flex h-11 w-10 items-center justify-center text-[var(--muted)] transition hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  type="button"
                >
                  {showCurrentPassword ? (
                    <EyeOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4" />
                  )}
                </button>
              </div>
            </label>
          ) : null}

          <label className="block">
            <FieldLabel icon={KeyRound}>Nueva contraseña</FieldLabel>
            <div className="relative">
              <input
                className="h-11 w-full rounded-md border border-[var(--line)] bg-white pr-10 pl-3 text-sm outline-none focus:border-[var(--ink)]"
                minLength={6}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
              />
              <button
                aria-label={
                  showNewPassword ? "Ocultar contraseña" : "Ver contraseña"
                }
                className="absolute top-0 right-0 flex h-11 w-10 items-center justify-center text-[var(--muted)] transition hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
                onClick={() => setShowNewPassword((prev) => !prev)}
                type="button"
              >
                {showNewPassword ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          </label>

          <label className="block">
            <FieldLabel icon={KeyRound}>Confirmar nueva contraseña</FieldLabel>
            <div className="relative">
              <input
                className="h-11 w-full rounded-md border border-[var(--line)] bg-white pr-10 pl-3 text-sm outline-none focus:border-[var(--ink)]"
                minLength={6}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la nueva contraseña"
                required
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
              />
              <button
                aria-label={
                  showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"
                }
                className="absolute top-0 right-0 flex h-11 w-10 items-center justify-center text-[var(--muted)] transition hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                type="button"
              >
                {showConfirmPassword ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          </label>

          {status ? (
            <div
              className={`flex items-center gap-2 rounded-md p-3 text-sm ${status.type === "success" ? "bg-[#e8f0db] text-[#3e5519]" : "bg-[#fde8e4] text-[#ad3e35]"}`}
              role="alert"
            >
              {status.type === "success" ? (
                <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
              ) : (
                <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          ) : null}
        </form>
      </div>

      <div className="mt-6 border-t border-[var(--line)] pt-4">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
          form="password-form"
          type="submit"
        >
          <Lock aria-hidden="true" className="size-4" />
          Actualizar contraseña
        </button>
      </div>
    </div>
  );
}

function formatCompact(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export default Dashboard;
