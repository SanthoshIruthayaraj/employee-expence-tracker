# Syncfusion Angular Grid with GraphQL Integration using Apollo-client

This sample demonstrates integrating **Syncfusion Angular Grid** with a **GraphQL backend** using **Syncfusion DataManager + GraphQLAdaptor**.

The grid uses server-driven operations (paging, sorting, filtering, search) and CRUD (add / edit / delete) through GraphQL queries & mutations.

## Introduction

This comprehensive guide explains how to integrate the **Syncfusion EJ2 Angular Grid** with a **GraphQL backend** using the official **GraphQLAdaptor**.

The key to success in this integration lies in one fundamental rule:

**The server must always return exactly this structure for every data read request:**

```json
{
  "expenses": {
    "result": [
      /* only the records visible on the current page */
    ],
    "count": 487
  }
}
```

- **result** → contains only the current page of records (e.g. 10, 15 or 20 rows depending on page size)
- **count** → contains the total number of matching records after all filters, sorts and searches (before any paging is applied)
  This pattern is what enables true on-demand loading (server-side paging), allowing the grid to handle thousands or even millions of rows efficiently.

## What is GraphQL?

GraphQL is a modern query language for APIs that gives clients exactly the data they request nothing more, nothing less.

### Main advantages:

- Single endpoint for all operations
- typed schema
- over-fetching or under-fetching
- Ideal for dynamic UIs like data grids

In this project, GraphQL handles both data retrieval (queries) and modifications (mutations) while processing complex grid states sent by the adaptor.

## What is Syncfusion Angular Grid?

The **Syncfusion Angular Grid** (also called EJ2 Grid or ejs-grid) is a high-performance, feature-rich data table component for Angular applications.

### Key built-in features:

- Paging & virtual scrolling
- Multi-column sorting
- Excel-style filtering
- Global & column search
- Grouping
- Dialog (CRUD)

It uses DataManager + adaptors to communicate with any backend — in this case, GraphQLAdaptor connects it seamlessly to GraphQL.

## How GraphQLAdaptor Enables Server-Side On-Demand Loading

**GraphQLAdaptor** translates all grid actions (page change, sort, filter, search, etc.) into a special DataManager variable that is sent to your GraphQL server.

### How on-demand loading actually works:

1. The grid needs to display page 1 (first 15 rows) → sends query with skip: 0, take: 15

2. Server:
   - Applies all filters, sorts, searches
   - Finds there are 487 matching records in total
   - Returns only the requested slice (rows 1–15)
3. Response structure:

   ```JSON
   {
   	"expenses": {
   		"result": [ /* exactly 15 expense records */ ],
   		"count": 487
   	}
   }
   ```

4. Grid:
   - Renders the 15 rows
   - Builds pager showing "1–15 of 487" (33 pages total)
5. When user goes to page 4: → new request with skip: 45, take: 15 → server returns different 15 rows + same count 487

This mechanism is called on-demand loading, server-side paging, or virtual paging. The browser never receives the entire dataset, only what's needed right now → excellent performance even with very large data.

### Core rule:

result = data for current screen/viewport only count = total number of records after filtering/sorting (never equals result.length!)

## Application Overview – Employee Expense Tracker

**Goal** Build a modern, responsive expense management interface with excellent performance on large datasets.

### Main Features

- True server-side paging, sorting, filtering & search
- Dialog-based CRUD operations (Add, Edit, Delete)
- Optimized for thousands to millions of records
  Sample Fields
  - expenseId
  - employeeName
  - amount
  - category
  - date

---

### Prerequisites

- Node.js ≥ 20.x LTS
- Angular CLI ≥ 18 (standalone components recommended)
- Valid Syncfusion license key (trial or commercial)
- Basic understanding of GraphQL schema & resolvers
- Terminal / command line familiarity

## Project Structure

```text
expense-tracker/
├── server/                           # GraphQL Backend
│   ├── src/
│   │   ├── schema.graphql
│   │   ├── resolvers.ts
│   │   ├── server.ts
│   │   └── data.ts
│   ├── tsconfig.json
│   └── package.json
│
└── client/                           # Angular Frontend
    ├── src/
    │   ├── app/
    │   │   ├── app.component.ts
    │   │   └── app.component.html
    │   ├── styles.css                # Syncfusion theme imports
    │   └── main.ts                   # license registration
    ├── angular.json
    └── package.json
```

## Step-by-Step Server Setup (GraphQL Backend)

(Detailed code for schema, resolvers, and server startup can be found in the full implementation guide or Syncfusion/Apollo official documentation)

### Critical requirement:

Every expenses query must return:

```graphql
type ExpenseResult {
  result: [Expense!]!
  count: Int!
}
```

### 1. Create Server Folder:

```bash
mkdir server
cd server
npm init -y
```

### 2. Install Dependencies:

```bash
npm install graphql @apollo/server @graphql-tools/schema graphql-type-json @syncfusion/ej2-data
npm install -D typescript ts-node @types/node
```

### 3. Configure TypeScript (tsconfig.json):

```JSON
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2020"],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "strict": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### 4. Update package.json Scripts:

```JSON
{
  "scripts": {
    "start": "ts-node src/server.ts"
  }
}
```

### 5. Define Schema (src/schema.graphql):

```graphql
scalar JSON

type Expense {
  expenseId: ID!
  employeeName: String!
  employeeEmail: String!
  employeeAvatarUrl: String
  department: String!
  category: String!
  description: String
  receiptUrl: String
  amount: Float!
  taxPct: Float!
  totalAmount: Float!
  ExpenseDate: String!
  paymentMethod: String!
  currency: String!
  reimbursementStatus: String!
  isPolicyCompliant: Boolean!
  tags: [String!]!
}

input ExpenseInput {
  expenseId: ID
  employeeName: String
  employeeEmail: String
  employeeAvatarUrl: String
  department: String
  category: String
  description: String
  receiptUrl: String
  amount: Float
  taxPct: Float
  totalAmount: Float
  ExpenseDate: String
  paymentMethod: String
  currency: String
  reimbursementStatus: String
  isPolicyCompliant: Boolean
  tags: [String!]
}

input DataManager {
  skip: Int
  take: Int
  requiresCounts: Boolean
  sorted: [SortInput!]
  filtered: [FilterInput!]
  where: JSON
  search: String
  params: JSON
}

type ExpenseResult {
  result: [Expense!]!
  count: Int!
}

input SortInput {
  name: String!
  direction: String!
}

input FilterInput {
  field: String!
  operator: String!
  value: String
  predicate: String
  matchCase: Boolean
}

type Query {
  expenses(datamanager: DataManager): ExpenseResult!
}

type Mutation {
  addExpense(value: ExpenseInput!): Expense!
  updateExpense(key: ID!, keyColumn: String, value: ExpenseInput!): Expense!
  deleteExpense(key: ID!, keyColumn: String, value: ExpenseInput): Boolean!
}
```

### 6. Implement Resolvers (src/resolvers.ts):

```ts
import { DataManager, Query } from "@syncfusion/ej2-data";

// Sample in-memory data (replace with DB)
let expenses = [
  {
    expenseId: "1",
    employeeName: "John",
    amount: 100,
    category: "Travel",
    date: "2026-01-01",
  },
];

export const resolvers = {
  Query: {
    expenses: (
      _: unknown,
      { datamanager }: { datamanager: DataStateChangeEventArgs }
    ): { result: ExpenseRecord[]; count: number } => {
      let data: ExpenseRecord[] = [...expenses];
      const query = new Query();

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
    addExpense: (_: unknown, { value }: AddExpenseArgs) => {
      const normalized = normalizeExpenseInput(value);
      return addExpense(normalized as ExpenseInput);
    },

    updateExpense: (_: unknown, { key, value }: UpdateExpenseArgs) => {
      const existing = expenses.find((item) => item.expenseId === key);
      if (!existing) throw new Error('Expense not found');
      const normalized = normalizeExpenseInput(value, existing);
      return updateExpense(key, normalized) as ExpenseRecord;
    },

    deleteExpense: (_: unknown, { key }: { key: string }) =>
      removeExpense(key),
  },
};
```
### 7. Apollo Server (src/server.ts):
```ts
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolvers } from './resolvers';

const typeDefs = readFileSync(join(__dirname, 'schema.graphql'), 'utf8');

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

async function start() {
  const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    cache: 'bounded',
  });

  const port = Number(process.env.PORT) || 4000;

  const { url } = await startStandaloneServer(server, {
    listen: { port },
  });

  console.log(`GraphQL ready at ${url}`);
}

start().catch((err) => {
  console.error('Failed to start Apollo Server', err);
  process.exit(1);
});
```

## Step-by-Step Client Setup (Angular + GraphQLAdaptor)

### Most important part – DataManager configuration:

```ts
    this.expenseManager = new DataManager({
      crossDomain: true,
      url: "http://localhost:4000/",
      adaptor: new GraphQLAdaptor({
        response: {
          result: "expenses.result",
          count: "expenses.count",
        },
        query: `
          query expenses($datamanager: DataManager) {
            expenses(datamanager: $datamanager) {
              count
              result {
                expenseId
                employeeName
                employeeEmail
                employeeAvatarUrl
                department
                category
                description
                receiptUrl
                amount
                taxPct
                totalAmount
                ExpenseDate
                paymentMethod
                currency
                reimbursementStatus
                isPolicyCompliant
                tags
              }
            }
          }
        `,
        getMutation: (action: string) => {
          if (action === "insert") {
            return `
              mutation addExpense($value: Expense!) {
                addExpense(value: $value) {
                  expenseId
                }
              }
            `;
          }
          if (action === "update") {
            return `
              mutation updateExpense($key: ID!, $keyColumn: String, $value: Expense!) {
                updateExpense(key: $key, keyColumn: $keyColumn, value: $value) {
                  expenseId
                }
              }
            `;
          }
          return `
            mutation deleteExpense($key: ID!, $keyColumn: String, $value: Expense) {
              deleteExpense(key: $key, keyColumn: $keyColumn, value: $value)
            }
          `;
        },
      }),
    });
```

### 1. Create Angular App:

```bash
ng new client --standalone --style=css
cd client
```
### 2. Install Syncfusion Packages:
```bash
npm install @syncfusion/ej2-angular-grids @syncfusion/ej2-data @syncfusion/ej2-base @syncfusion/ej2-angular-buttons @syncfusion/ej2-angular-inputs @syncfusion/ej2-angular-dropdowns @syncfusion/ej2-angular-calendars @syncfusion/ej2-angular-navigations @syncfusion/ej2-angular-popups
```
### 3. Add Styles (src/styles.css):
```css
@import '../node_modules/@syncfusion/ej2-base/styles/material.css';  
@import '../node_modules/@syncfusion/ej2-buttons/styles/material.css';  
@import '../node_modules/@syncfusion/ej2-calendars/styles/material.css';  
@import '../node_modules/@syncfusion/ej2-dropdowns/styles/material.css';  
@import '../node_modules/@syncfusion/ej2-inputs/styles/material.css';  
@import '../node_modules/@syncfusion/ej2-navigations/styles/material.css';
@import '../node_modules/@syncfusion/ej2-popups/styles/material.css';
@import '../node_modules/@syncfusion/ej2-splitbuttons/styles/material.css';
@import '../node_modules/@syncfusion/ej2-notifications/styles/material.css';
@import '../node_modules/@syncfusion/ej2-angular-grids/styles/material.css';
```
### 4. Register License (src/main.ts):
```ts
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense('YOUR_LICENSE_KEY');
```
### 5. Create Grid Component (src/app/components/expense-grid/expense-grid.component.ts):
```ts
import { Component } from '@angular/core';
import { DataManager, GraphQLAdaptor } from '@syncfusion/ej2-data';
import { PageService, SortService, FilterService, ToolbarService, EditService } from '@syncfusion/ej2-angular-grids';

@Component({
  selector: 'app-expense-grid',
  templateUrl: './expense-grid.component.html',
  providers: [PageService, SortService, FilterService, ToolbarService, EditService]
})
export class ExpenseGridComponent {
  public dataManager: DataManager = new DataManager({
    url: 'http://localhost:4000/',
    adaptor: new GraphQLAdaptor({
      response: { result: 'expenses.result', count: 'expenses.count' },
      query: `query GetExpenses($datamanager: DataManagerInput!) { expenses(datamanager: $datamanager) { result { expenseId employeeName amount category date } count } }`,
      getMutation: (action) => {
        if (action === 'insert') return `mutation AddExpense($value: ExpenseInput!) { addExpense(value: $value) { expenseId employeeName amount category date } }`;
        if (action === 'update') return `mutation UpdateExpense($key: ID!, $keyColumn: String!, $value: ExpenseInput!) { updateExpense(key: $key, keyColumn: $keyColumn, value: $value) { expenseId employeeName amount category date } }`;
        if (action === 'delete') return `mutation DeleteExpense($key: ID!, $keyColumn: String!) { deleteExpense(key: $key, keyColumn: $keyColumn) }`;
        return '';
      }
    })
  });

  public editSettings = { allowEditing: true, allowAdding: true, allowDeleting: true, mode: 'Dialog' };
  public pageSettings = { pageSize: 10 };
  public filterSettings = { type: 'Excel' };
  public toolbar = ['Add', 'Edit', 'Delete', 'Search'];
}
```
### 6. Grid Template (expense-grid.component.html):
```html
<ejs-grid [dataSource]="dataManager" [allowPaging]="true" [allowSorting]="true" [allowFiltering]="true" [toolbar]="toolbar" [editSettings]="editSettings" [pageSettings]="pageSettings" [filterSettings]="filterSettings">
  <e-columns>
    <e-column field="expenseId" headerText="ID" isPrimaryKey="true"></e-column>
    <e-column field="employeeName" headerText="Name"></e-column>
    <e-column field="amount" headerText="Amount" format="C2"></e-column>
    <e-column field="category" headerText="Category"></e-column>
    <e-column field="date" headerText="Date" type="date" format="yMd"></e-column>
  </e-columns>
</ejs-grid>
```


## How to Run the Server and Client Application
### Run the Server:
- Run the below commands to install the depency packages of server and run the sevrer
	```bash
	cd server
	npm install
	npm start
	```
- Access at `http://localhost:4000/`.

### Run the Client:
- Execute the below commands to install the depencies of client application and run it
	```bash
	cd client
	npm install
	npm start
	```
- Open `http://localhost:4200/` in your browser.
- Verify: Load data, page/sort/filter, add/edit/delete expenses.


# Quick Reference for Syncfusion **React Grid** – Server Response Expectations

> A concise guide to structuring your server responses so the **Syncfusion React Grid** can page, sort, filter, virtualize, and mutate data correctly without extra round trips.

---

## Quick Reference

| Operation | **Required Response Format** | **Purpose / Importance** |
|---|---|---|
| **Read / Load** | `{ result: [/* current page only */], count: /* total */ }` | Enables true on-demand loading & correct pager |
| **Insert (Create)** | **Full newly created record** | Grid adds row instantly without extra fetch |
| **Update** | **Full updated record** | Grid refreshes row in place |
| **Delete** | **Boolean** or **deleted identifier** | Grid removes row locally |
---
## FAQ
**Q: Why can't I just return all data and set count = result.length?**\
**A:** Paging would be completely broken, the grid would think there’s only one page because count equals the visible slice, not the total.

**Q: Why do mutations need to return full objects?**\
**A:** So the grid can immediately update the UI without making an additional GET request. This keeps interactions snappy and reduces load.

**Q: Does this support virtual scrolling / infinite scroll?**\
**A:** Yes. When enableVirtualization = true and the server always returns correct count for the current filter/sort. The grid fetches windows on demand.

**Q: Can I use Apollo Client caching with GraphQLAdaptor?**\
**A:** Not directly. For Apollo features (cache, links, auth), use a custom UrlAdaptor wired to Apollo Client instead of GraphQLAdaptor.

## Common Mistakes & How to Fix Them
1. Returning count = result.length → Pager always shows only 1 page → Fix: Always return the total filtered count
2. Mutation returns only ID → Added/edited row appears empty or broken → Fix: Return all fields displayed in the grid
3. Wrong path in response property → "No records to display" error → Fix: Use exact match e.g. 'expenses.result', 'expenses.count'
4. Complex filters don't work → Fix: Implement filtering on server using @syncfusion/ej2-data Query + Predicate