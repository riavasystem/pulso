import { z } from "zod";

export const categories = [
  { id: "food", label: "Alimentación", icon: "utensils", color: "#cf684f" },
  { id: "transport", label: "Transporte", icon: "bus", color: "#477c91" },
  { id: "home", label: "Hogar", icon: "house", color: "#718a35" },
  { id: "health", label: "Salud", icon: "heart-pulse", color: "#ba5d71" },
  {
    id: "entertainment",
    label: "Entretenimiento",
    icon: "ticket",
    color: "#8265a5",
  },
  { id: "shopping", label: "Compras", icon: "shopping-bag", color: "#bf813a" },
  {
    id: "supermarket",
    label: "Supermercado",
    icon: "shopping-cart",
    color: "#34785f",
  },
  { id: "fair", label: "Feria", icon: "store", color: "#c26c43" },
  { id: "education", label: "Educación", icon: "book-open", color: "#52805e" },
  { id: "services", label: "Servicios", icon: "plug", color: "#5079a0" },
  {
    id: "subscriptions",
    label: "Suscripciones",
    icon: "repeat",
    color: "#8c6d44",
  },
  {
    id: "small-expenses",
    label: "Gastos hormiga",
    icon: "coffee",
    color: "#b56545",
  },
  { id: "other", label: "Otros", icon: "shapes", color: "#66736a" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];
export type ExpenseType = "fixed" | "variable";
export type Frequency = "monthly" | "weekly" | "yearly";

const categoryIds = categories.map((category) => category.id) as [
  CategoryId,
  ...CategoryId[],
];

export const expenseSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().int().positive(),
  categoryId: z.enum(categoryIds),
  description: z.string().trim().max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["fixed", "variable"]),
  fixedExpenseId: z.string().uuid().optional(),
});

export const fixedExpenseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
  amount: z.number().int().positive(),
  categoryId: z.enum(categoryIds),
  frequency: z.enum(["monthly", "weekly", "yearly"]),
  dueDay: z.number().int().min(1).max(31).nullable(),
  active: z.boolean(),
});

export const userProfileSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio").max(50),
  lastName: z.string().trim().min(1, "El apellido es obligatorio").max(50),
  email: z.string().trim().email("Ingresa un correo electrónico válido"),
  password: z.string().max(100).optional().default(""),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z
      .string()
      .min(6, "La nueva contraseña debe tener al menos 6 caracteres")
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type UserProfile = z.infer<typeof userProfileSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const defaultUserProfile: UserProfile = {
  firstName: "Juan",
  lastName: "Pérez",
  email: "usuario@pulso.cl",
  password: "",
};

export const financeDataSchema = z.object({
  monthlyIncome: z.number().int().min(0),
  expenses: z.array(expenseSchema),
  fixedExpenses: z.array(fixedExpenseSchema),
  profile: userProfileSchema.default(defaultUserProfile),
});

export type Expense = z.infer<typeof expenseSchema>;
export type FixedExpense = z.infer<typeof fixedExpenseSchema>;
export type FinanceData = z.infer<typeof financeDataSchema>;

export const emptyFinanceData: FinanceData = {
  monthlyIncome: 0,
  expenses: [],
  fixedExpenses: [],
  profile: defaultUserProfile,
};

export function getCategoriesForExpenseType(type: ExpenseType) {
  return type === "fixed"
    ? categories.filter((category) => category.id !== "small-expenses")
    : categories;
}

export function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getRecurringPeriodKey(frequency: Frequency, date: string) {
  if (frequency === "monthly") return date.slice(0, 7);
  if (frequency === "yearly") return date.slice(0, 4);

  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const weekdayFromMonday = (utcDate.getUTCDay() + 6) % 7;
  utcDate.setUTCDate(utcDate.getUTCDate() - weekdayFromMonday + 3);

  const weekYear = utcDate.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
  const firstThursdayOffset = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - firstThursdayOffset + 3,
  );

  const weekNumber =
    1 + Math.round((utcDate.getTime() - firstThursday.getTime()) / 604_800_000);
  return `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;
}

export function getMonthlyTotals(expenses: Expense[], month: string) {
  const selectedExpenses = expenses.filter((expense) =>
    expense.date.startsWith(month),
  );
  const fixed = selectedExpenses
    .filter((expense) => expense.type === "fixed")
    .reduce((total, expense) => total + expense.amount, 0);
  const variable = selectedExpenses
    .filter((expense) => expense.type === "variable")
    .reduce((total, expense) => total + expense.amount, 0);

  return {
    fixed,
    variable,
    total: fixed + variable,
    count: selectedExpenses.length,
  };
}

export function getCategoryTotals(expenses: Expense[], month: string) {
  const totals = new Map<CategoryId, number>();

  for (const expense of expenses) {
    if (expense.date.startsWith(month)) {
      totals.set(
        expense.categoryId,
        (totals.get(expense.categoryId) ?? 0) + expense.amount,
      );
    }
  }

  return categories
    .map((category) => ({ ...category, total: totals.get(category.id) ?? 0 }))
    .filter((category) => category.total > 0)
    .sort((left, right) => right.total - left.total);
}

export function getWeekdayTotals(expenses: Expense[], month: string) {
  const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const totals = labels.map((label) => ({ label, total: 0 }));

  for (const expense of expenses) {
    if (expense.date.startsWith(month)) {
      const weekday = new Date(`${expense.date}T12:00:00`).getDay();
      totals[weekday].total += expense.amount;
    }
  }

  return [
    totals[1],
    totals[2],
    totals[3],
    totals[4],
    totals[5],
    totals[6],
    totals[0],
  ];
}

export function getMonthDayTotals(expenses: Expense[], month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const totals = Array.from({ length: daysInMonth }, (_, index) => ({
    day: index + 1,
    total: 0,
  }));

  for (const expense of expenses) {
    if (expense.date.startsWith(month)) {
      const day = Number(expense.date.slice(-2));
      totals[day - 1].total += expense.amount;
    }
  }

  return totals;
}

export function getMonthlyCommitment(fixedExpense: FixedExpense) {
  switch (fixedExpense.frequency) {
    case "weekly":
      return Math.round((fixedExpense.amount * 52) / 12);
    case "yearly":
      return Math.round(fixedExpense.amount / 12);
    default:
      return fixedExpense.amount;
  }
}

export function getDashboardCategoryTotals(
  expenses: Expense[],
  fixedExpenses: FixedExpense[],
  month: string,
) {
  const totals = new Map(
    getCategoryTotals(expenses, month).map(({ id, total }) => [id, total]),
  );

  for (const fixedExpense of fixedExpenses) {
    if (!fixedExpense.active) continue;

    const recordedAmount = expenses
      .filter(
        (expense) =>
          expense.fixedExpenseId === fixedExpense.id &&
          expense.date.startsWith(month),
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
    const pendingAmount = Math.max(
      0,
      getMonthlyCommitment(fixedExpense) - recordedAmount,
    );

    if (pendingAmount > 0) {
      totals.set(
        fixedExpense.categoryId,
        (totals.get(fixedExpense.categoryId) ?? 0) + pendingAmount,
      );
    }
  }

  return categories
    .map((category) => ({ ...category, total: totals.get(category.id) ?? 0 }))
    .filter((category) => category.total > 0)
    .sort((left, right) => right.total - left.total);
}

export function getFixedPaymentStatus(
  fixedExpenses: FixedExpense[],
  expenses: Expense[],
  month: string,
) {
  const activeFixedExpenses = fixedExpenses.filter((expense) => expense.active);
  const paidIds = activeFixedExpenses
    .filter((fixedExpense) => {
      const paymentPeriod =
        fixedExpense.frequency === "yearly" ? month.slice(0, 4) : month;
      return expenses.some(
        (expense) =>
          expense.fixedExpenseId === fixedExpense.id &&
          expense.date.startsWith(paymentPeriod),
      );
    })
    .map((expense) => expense.id);

  return {
    total: activeFixedExpenses.length,
    paid: paidIds.length,
    pending: activeFixedExpenses.length - paidIds.length,
    paidIds,
  };
}
