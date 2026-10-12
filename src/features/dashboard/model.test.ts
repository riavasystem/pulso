import { describe, expect, it } from "vitest";
import {
  emptyFinanceData,
  financeDataSchema,
  fixedExpenseSchema,
  getDashboardCategoryTotals,
  getFixedPaymentStatus,
  getCategoriesForExpenseType,
  getCategoryTotals,
  getMonthDayTotals,
  getMonthlyTotals,
  getRecurringPeriodKey,
  getWeekdayTotals,
  passwordChangeSchema,
  userProfileSchema,
  type Expense,
} from "./model";

const expense = (overrides: Partial<Expense>): Expense => ({
  id: crypto.randomUUID(),
  amount: 0,
  categoryId: "other",
  description: "",
  date: "2026-10-05",
  type: "variable",
  ...overrides,
});

describe("dashboard calculations", () => {
  it("offers supermarket and fair categories for fixed and variable expenses", () => {
    for (const type of ["fixed", "variable"] as const) {
      const categoryIds = getCategoriesForExpenseType(type).map(
        (category) => category.id,
      );

      expect(categoryIds).toContain("supermarket");
      expect(categoryIds).toContain("fair");
    }
  });

  it("only offers small expenses for variable expenses", () => {
    expect(
      getCategoriesForExpenseType("fixed").map((category) => category.id),
    ).not.toContain("small-expenses");
    expect(
      getCategoriesForExpenseType("variable").map((category) => category.id),
    ).toContain("small-expenses");
  });

  it("starts with zero totals and no chart data", () => {
    expect(getMonthlyTotals(emptyFinanceData.expenses, "2026-10")).toEqual({
      fixed: 0,
      variable: 0,
      total: 0,
      count: 0,
    });
    expect(getCategoryTotals(emptyFinanceData.expenses, "2026-10")).toEqual([]);
  });

  it("separates fixed and variable expenses for the selected month", () => {
    const expenses = [
      expense({ amount: 25000, categoryId: "home", type: "fixed" }),
      expense({ amount: 7500, categoryId: "transport" }),
      expense({ amount: 30000, date: "2026-09-05" }),
    ];

    expect(getMonthlyTotals(expenses, "2026-10")).toEqual({
      fixed: 25000,
      variable: 7500,
      total: 32500,
      count: 2,
    });
    expect(
      getCategoryTotals(expenses, "2026-10").map(({ id, total }) => [
        id,
        total,
      ]),
    ).toEqual([
      ["home", 25000],
      ["transport", 7500],
    ]);
  });

  it("includes unpaid fixed commitments by category without duplicating payments", () => {
    const paidFixed = {
      id: crypto.randomUUID(),
      name: "Internet",
      amount: 25000,
      categoryId: "services",
      frequency: "monthly",
      dueDay: null,
      active: true,
    } as const;
    const pendingFixed = {
      ...paidFixed,
      id: crypto.randomUUID(),
      name: "Luz",
      amount: 40000,
      categoryId: "home",
    } as const;
    const expenses = [
      expense({
        amount: 25000,
        categoryId: "services",
        type: "fixed",
        fixedExpenseId: paidFixed.id,
      }),
      expense({ amount: 5000, categoryId: "food" }),
    ];

    const totals = getDashboardCategoryTotals(
      expenses,
      [paidFixed, pendingFixed],
      "2026-10",
    );

    expect(totals.find(({ id }) => id === "services")?.total).toBe(25000);
    expect(totals.find(({ id }) => id === "home")?.total).toBe(40000);
    expect(totals.find(({ id }) => id === "food")?.total).toBe(5000);
  });

  it("counts active fixed accounts as paid or pending for the selected month", () => {
    const internet = {
      id: crypto.randomUUID(),
      name: "Internet",
      amount: 25000,
      categoryId: "services",
      frequency: "monthly",
      dueDay: null,
      active: true,
    } as const;
    const rent = { ...internet, id: crypto.randomUUID(), name: "Arriendo" };
    const inactive = { ...internet, id: crypto.randomUUID(), active: false };
    const expenses = [
      expense({
        amount: 25000,
        categoryId: "services",
        type: "fixed",
        fixedExpenseId: internet.id,
      }),
    ];

    expect(
      getFixedPaymentStatus([internet, rent, inactive], expenses, "2026-10"),
    ).toEqual({
      total: 2,
      paid: 1,
      pending: 1,
      paidIds: [internet.id],
    });
  });

  it("returns more than five categories when they have expenses", () => {
    const expenses = [
      expense({ amount: 7000, categoryId: "food" }),
      expense({ amount: 6000, categoryId: "transport" }),
      expense({ amount: 5000, categoryId: "home" }),
      expense({ amount: 4000, categoryId: "health" }),
      expense({ amount: 3000, categoryId: "entertainment" }),
      expense({ amount: 2000, categoryId: "shopping" }),
    ];

    expect(getCategoryTotals(expenses, "2026-10")).toHaveLength(6);
  });

  it("groups actual expenses by local weekday", () => {
    const weekdays = getWeekdayTotals(
      [expense({ amount: 5000, date: "2026-10-05" })],
      "2026-10",
    );

    expect(weekdays.find(({ label }) => label === "Lun")?.total).toBe(5000);
    expect(weekdays.find(({ label }) => label === "Vie")?.total).toBe(0);
  });

  it("groups expenses by day of the selected month", () => {
    const days = getMonthDayTotals(
      [
        expense({ amount: 5000, date: "2026-10-01" }),
        expense({ amount: 2500, date: "2026-10-31" }),
        expense({ amount: 10000, date: "2026-09-30" }),
      ],
      "2026-10",
    );

    expect(days).toHaveLength(31);
    expect(days[0].total).toBe(5000);
    expect(days[30].total).toBe(2500);
    expect(days[1].total).toBe(0);
  });

  it("uses the recurring expense frequency as its idempotency period", () => {
    expect(getRecurringPeriodKey("weekly", "2026-10-05")).toBe("2026-W41");
    expect(getRecurringPeriodKey("weekly", "2026-10-11")).toBe("2026-W41");
    expect(getRecurringPeriodKey("weekly", "2026-10-12")).toBe("2026-W42");
    expect(getRecurringPeriodKey("monthly", "2026-10-31")).toBe("2026-10");
    expect(getRecurringPeriodKey("yearly", "2026-12-31")).toBe("2026");
  });

  it("accepts a fixed expense with no due day or a valid due day", () => {
    const fixedExpense = {
      id: crypto.randomUUID(),
      name: "Internet",
      amount: 25000,
      categoryId: "services",
      frequency: "monthly",
      active: true,
    };

    expect(
      fixedExpenseSchema.safeParse({ ...fixedExpense, dueDay: null }).success,
    ).toBe(true);
    expect(
      fixedExpenseSchema.safeParse({ ...fixedExpense, dueDay: 10 }).success,
    ).toBe(true);
  });

  it("validates user profile fields correctly", () => {
    const validProfile = {
      firstName: "Richard",
      lastName: "Pulso",
      email: "richard@pulso.cl",
      password: "secretpassword",
    };

    expect(userProfileSchema.safeParse(validProfile).success).toBe(true);
    expect(
      userProfileSchema.safeParse({ ...validProfile, firstName: "" }).success,
    ).toBe(false);
    expect(
      userProfileSchema.safeParse({ ...validProfile, lastName: "" }).success,
    ).toBe(false);
    expect(
      userProfileSchema.safeParse({ ...validProfile, email: "invalid-email" })
        .success,
    ).toBe(false);
  });

  it("validates password change logic with match check and minimum length", () => {
    const validChange = {
      currentPassword: "oldpassword",
      newPassword: "newpassword123",
      confirmPassword: "newpassword123",
    };

    expect(passwordChangeSchema.safeParse(validChange).success).toBe(true);

    expect(
      passwordChangeSchema.safeParse({
        ...validChange,
        newPassword: "123",
        confirmPassword: "123",
      }).success,
    ).toBe(false);

    expect(
      passwordChangeSchema.safeParse({
        ...validChange,
        confirmPassword: "mismatchpassword",
      }).success,
    ).toBe(false);
  });

  it("provides default profile when parsing legacy finance data without profile", () => {
    const legacyData = {
      monthlyIncome: 1200000,
      expenses: [],
      fixedExpenses: [],
    };

    const parsed = financeDataSchema.safeParse(legacyData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.profile.firstName).toBe("Richard");
      expect(parsed.data.profile.email).toBe("usuario@pulso.cl");
    }
  });
});
