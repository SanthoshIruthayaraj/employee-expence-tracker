import GraphQLJSON from 'graphql-type-json';
import { DataManager, Query as SfQuery, DataUtil, Predicate } from '@syncfusion/ej2-data';
import { expenses, addExpense, updateExpense, removeExpense } from './data';
import { ExpenseInput, ExpenseRecord } from './types';

DataUtil.serverTimezoneOffset = 0;

// ---------- Normalization helper ----------
function normalizeExpenseInput(
  value: Partial<ExpenseRecord>,
  existing?: ExpenseRecord
): ExpenseRecord {
  if (!existing && (!value.employeeName || !value.employeeEmail)) {
    throw new Error('employeeName and employeeEmail are required');
  }

  const base: ExpenseRecord = existing ?? {
    expenseId: value.expenseId ?? `EXP${Date.now()}`,
    employeeName: value.employeeName ?? '',
    employeeEmail: value.employeeEmail ?? '',
    employeeAvatarUrl: value.employeeAvatarUrl,
    department: value.department ?? '',
    category: value.category ?? '',
    description: value.description,
    amount: value.amount ?? 0,
    taxPct: value.taxPct ?? 0,
    totalAmount: value.totalAmount ?? 0,
    ExpenseDate: value.ExpenseDate ?? new Date().toISOString(),
    paymentMethod: value.paymentMethod ?? '',
    currency: value.currency ?? '',
    reimbursementStatus: value.reimbursementStatus ?? 'Submitted',
    isPolicyCompliant: value.isPolicyCompliant ?? false,
    tags: value.tags ?? [],
  };

  return {
    ...base,
    ...value,
    tags: value.tags ?? base.tags ?? [],
  };
}

// ---------- Utility helpers ----------
function parseArg<T = any>(arg?: string | T): T | undefined {
  if (arg === undefined || arg === null) return undefined;
  if (typeof arg === 'string') {
    try {
      return JSON.parse(arg);
    } catch {
      return undefined;
    }
  }
  return arg;
}

function buildPredicate(node: any): Predicate | null {
  if (!node) return null;

  if (node.isComplex && Array.isArray(node.predicates)) {
    const children = node.predicates
      .map((child: any) => buildPredicate(child))
      .filter(Boolean) as Predicate[];

    if (!children.length) return null;

    return children.reduce((acc, curr, idx) => {
      if (idx === 0) return curr;
      return node.condition?.toLowerCase() === 'or' ? acc.or(curr) : acc.and(curr);
    });
  }

  if (node.field) {
    return new Predicate(node.field, node.operator, node.value, node.ignoreCase, node.ignoreAccent);
  }

  return null;
}

// ---------- Feature-specific helpers ----------
function performFiltering(query: SfQuery, datamanager: any) {
  const whereArg = parseArg<any[]>(datamanager?.where);
  if (Array.isArray(whereArg) && whereArg.length) {
    const rootPredicate = buildPredicate(whereArg[0]);
    if (rootPredicate) {
      query.where(rootPredicate);
    }
  }
}

function performSearching(query: SfQuery, datamanager: any) {
  const searchArg = parseArg<any[]>(datamanager?.search);
  if (Array.isArray(searchArg) && searchArg.length) {
    const { fields, key, operator, ignoreCase } = searchArg[0];
    if (key && Array.isArray(fields) && fields.length) {
      query.search(key, fields, operator, ignoreCase);
    }
  }
}

function performSorting(query: SfQuery, datamanager: any) {
  const sortedArg = datamanager?.sorted;
  if (Array.isArray(sortedArg)) {
    sortedArg.forEach(({ name, direction }) => {
      query.sortBy(name, direction);
    });
  }
}

function performPaging(data: ExpenseRecord[], datamanager: any): ExpenseRecord[] {
  if (typeof datamanager?.skip === 'number' && typeof datamanager?.take === 'number') {
    const pageQuery = new SfQuery().page(
      datamanager.skip / datamanager.take + 1,
      datamanager.take
    );
    return new DataManager(data).executeLocal(pageQuery) as ExpenseRecord[];
  }
  if (datamanager?.take) {
    const pageQuery = new SfQuery().page(1, datamanager.take);
    return new DataManager(data).executeLocal(pageQuery) as ExpenseRecord[];
  }
  return data;
}

// ---------- Resolvers ----------
export const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    expenses: (_: unknown, { datamanager }: any) => {
      let data: ExpenseRecord[] = [...expenses];
      const query = new SfQuery();

      performFiltering(query, datamanager);
      performSearching(query, datamanager);
      performSorting(query, datamanager);

      data = new DataManager(data).executeLocal(query) as ExpenseRecord[];
      const count = data.length;

      data = performPaging(data, datamanager);

      return { result: data, count };
    },
  },
  Mutation: {
    addExpense: (_: unknown, { value }: any) => {
      const normalized = normalizeExpenseInput(value);
      return addExpense(normalized as ExpenseInput);
    },
    updateExpense: (_: unknown, { key, value }: any) => {
      const existing = expenses.find((item) => item.expenseId === key);
      if (!existing) throw new Error('Expense not found');
      const normalized = normalizeExpenseInput(value, existing);
      return updateExpense(key, normalized) as ExpenseRecord;
    },
    deleteExpense: (_: unknown, { key }: any) => removeExpense(key),
  },
};