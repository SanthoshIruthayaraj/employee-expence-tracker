# Employee Expense Tracker

This sample demonstrates integrating **Syncfusion Angular Grid** with a **GraphQL backend** using **Syncfusion DataManager + `GraphQLAdaptor`**.

The grid uses server-driven operations (paging, sorting, filtering, search) and CRUD (add / edit / delete) through GraphQL queries & mutations.

## Architecture

**Client (Angular)**

- Renders a Syncfusion `ejs-grid`.
- Uses `DataManager` (from `@syncfusion/ej2-data`) as the grid `dataSource`.
- Uses `GraphQLAdaptor` to translate grid operations into GraphQL requests.

**Server (Node.js + TypeScript)**

- Apollo Server that exposes a GraphQL schema.
- A single `expenses(datamanager: DataManager)` query returns `{ result, count }`.
- Mutations handle add / update / delete.
- Applies sorting/filtering/search/paging using Syncfusion `DataManager` + `Query` on the server.

High-level flow:

1. Grid triggers data actions (initial load, paging, sorting, filtering, search).
2. `GraphQLAdaptor` creates a GraphQL request with a `datamanager` variable.
3. Server resolves `Query.expenses(datamanager)` and returns `{ result, count }`.
4. Grid renders rows and uses `count` for paging.

## Prerequisites

- Node.js (LTS recommended)
- npm (or your preferred package manager)
- Angular CLI (`npm i -g @angular/cli`)
- A Syncfusion license key (or a valid trial)

> Note: Uses Angular standalone bootstrapping (`bootstrapApplication`) and Syncfusion EJ2 packages.

## Create the server from scratch

This section explains how to build a minimal Node/TypeScript GraphQL server that supports Syncfusion `GraphQLAdaptor`.

### 1) Scaffold a Node + TypeScript project

```bash
mkdir server
cd server
npm init -y

npm install graphql @apollo/server @graphql-tools/schema graphql-type-json @syncfusion/ej2-data
npm install -D typescript ts-node
```

Create a `tsconfig.json` (uses NodeNext modules):

```jsonc
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

Add scripts to `package.json`:

```jsonc
{
	"scripts": {
		"start": "ts-node src/server.ts",
		"build": "tsc",
		"start:prod": "node dist/server.js"
	}
}
```

### 2) Define the GraphQL schema

Create `src/schema.graphql`.

Key idea: the grid sends a **DataManager state** (skip/take/sort/filter/etc). Your schema must accept it, and your resolver must return the shape that the client maps in `GraphQLAdaptor.response`.

Use the following schema shape:

- `Query.expenses(datamanager: DataManager): ExpenseResult!`
- `ExpenseResult` with `result` (rows) and `count` (total rows)
- Mutations for `addExpense`, `updateExpense`, `deleteExpense`

Example (snippet from the schema used here):

```graphql
type Query {
	expenses(datamanager: DataManager): ExpenseResult!
}

type Mutation {
	addExpense(value: ExpenseInput!): Expense!
	updateExpense(key: ID!, keyColumn: String, value: ExpenseInput!): Expense!
	deleteExpense(key: ID!, keyColumn: String, value: ExpenseInput): Boolean!
}
```

### 3) Implement resolvers

Create `src/resolvers.ts`.

Implement these server-side behaviors:

- **Filtering**: translates complex `where` payload into Syncfusion `Predicate` and applies it.
- **Sorting**: applies multi-column sorting based on `sorted`.
- **Search**: optionally applies `query.search(...)` if a search payload is provided.
- **Paging**: uses `skip/take` to page results.

Reuse `@syncfusion/ej2-data` server-side to keep query semantics aligned with the grid.

Example (resolver snippet used here):

```ts
export const resolvers = {
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
		}
	},
	Mutation: {
		addExpense: (_: unknown, { value }: any) => addExpense(normalizeExpenseInput(value)),
		updateExpense: (_: unknown, { key, value }: any) => updateExpense(key, normalizeExpenseInput(value)),
		deleteExpense: (_: unknown, { key }: any) => removeExpense(key)
	}
};
```

### 4) Start Apollo Server

Create `src/server.ts` and start Apollo using `startStandaloneServer`.

The server will log a URL like:

```text
GraphQL ready at http://localhost:4000/
```

Keep that URL in mind, because the Angular client must point `DataManager.url` to the GraphQL endpoint.

### 5) Run the server

```bash
npm start
```

## Create the client from scratch

This section explains how to create an Angular app that binds Syncfusion Grid to GraphQL using `GraphQLAdaptor`.

### 1) Create an Angular app

From a parent folder:

```bash
ng new client --standalone --style=css
cd client
```

### 2) Install Syncfusion packages

Install packages:

```bash
npm install \
	@syncfusion/ej2-base \
	@syncfusion/ej2-data \
	@syncfusion/ej2-angular-base \
	@syncfusion/ej2-grids @syncfusion/ej2-angular-grids \
	@syncfusion/ej2-buttons @syncfusion/ej2-angular-buttons \
	@syncfusion/ej2-inputs @syncfusion/ej2-angular-inputs \
	@syncfusion/ej2-dropdowns @syncfusion/ej2-angular-dropdowns \
	@syncfusion/ej2-calendars @syncfusion/ej2-angular-calendars \
	@syncfusion/ej2-navigations @syncfusion/ej2-angular-navigations \
	@syncfusion/ej2-popups @syncfusion/ej2-angular-popups \
	@syncfusion/ej2-splitbuttons @syncfusion/ej2-angular-splitbuttons \
	@syncfusion/ej2-notifications @syncfusion/ej2-angular-notifications
```

### 3) Add Syncfusion theme styles

Import Syncfusion styles from `src/styles.css` using `@import`.

Example (Material theme):

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

> Alternative: you can also add these CSS files under the `styles` array in `angular.json` instead of using `@import`.

### 4) Register your Syncfusion license

In `src/main.ts`:

```ts
import { registerLicense } from '@syncfusion/ej2-base';

registerLicense('YOUR SYNCFUSION LICENSE KEY');
```

### 5) Create the Grid + DataManager wiring

Create a `DataManager` pointing to the GraphQL endpoint and configure `GraphQLAdaptor`:

```ts
this.expenseManager = new DataManager({
	url: 'http://localhost:4000/',
	adaptor: new GraphQLAdaptor({
		response: {
			result: 'expenses.result',
			count: 'expenses.count'
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
			if (action === 'insert') {
				return `
					mutation addExpense($value: ExpenseInput!) {
						addExpense(value: $value) { expenseId }
					}
				`;
			}
			if (action === 'update') {
				return `
					mutation updateExpense($key: ID!, $keyColumn: String, $value: ExpenseInput!) {
						updateExpense(key: $key, keyColumn: $keyColumn, value: $value) { expenseId }
					}
				`;
			}
			return `
				mutation deleteExpense($key: ID!, $keyColumn: String, $value: ExpenseInput) {
					deleteExpense(key: $key, keyColumn: $keyColumn, value: $value)
				}
			`;
		}
	})
});
```

### 6) Define the Grid and enable data features

Enable paging, filtering, sorting, searching, and grouping on the grid:

```html
<ejs-grid
  [dataSource]="expenseManager"
  [height]="520"
  [toolbar]="toolbar"
  [allowPaging]="true"
  [allowSorting]="true"
  [allowFiltering]="true"
  [allowGrouping]="true"
  [allowTextWrap]="true"
  [pageSettings]="pageSettings"
  [filterSettings]="filterSettings"
  [searchSettings]="searchSettings"
  [groupSettings]="groupSettings"
  [editSettings]="editSettings"
  clipMode="EllipsisWithTooltip"
  (actionBegin)="actionBegin($event)"
  (actionComplete)="actionComplete($event)"
>
	<e-columns>
		<e-column field="expenseId" headerText="Expense ID" isPrimaryKey="true"></e-column>
		<e-column field="employeeName" headerText="Employee"></e-column>
        . . . . .
	</e-columns>
</ejs-grid>
```

What each option does:

- **Paging**: `allowPaging="true"` enables the pager UI. Control page size and page-size dropdown using `pageSettings`.
- **Sorting**: `allowSorting="true"` enables sorting by clicking column headers. Sort descriptors are sent to the server through the DataManager payload.
- **Filtering**: `allowFiltering="true"` enables column filtering UI. Control filter UI style using `filterSettings` (for example, Excel-style filtering).
- **Searching**: use the toolbar `Search` item and set `searchSettings.fields` to control which fields participate in searches.
- **Grouping**: `allowGrouping="true"` enables grouping. Use `groupSettings.showDropArea` to show the group drop area above the grid.

Configure feature settings in the component:

```ts
public pageSettings = { pageSize: 20, pageSizes: true };
public filterSettings = { type: 'Excel' };
public searchSettings = {
	fields: ['expenseId', 'employeeName', 'employeeEmail', 'department', 'category', 'paymentMethod', 'reimbursementStatus', 'tags']
};
public groupSettings = { showDropArea: true };
```

Provide the required Syncfusion services for those features:

```ts
providers: [
	PageService,
	SortService,
	FilterService,
	GroupService,
	SearchService,
	ToolbarService,
	EditService,
	CommandColumnService,
]
```

### 7) Configure editing

Use dialog editing:

- `editSettings = { allowEditing: true, allowAdding: true, allowDeleting: true, mode: 'Dialog' }`
- Toolbar: `['Add','Edit','Delete','Search']`

And uses grid lifecycle events:

- `actionBegin`: initializes dialog model and injects validated data on save
- `actionComplete`: adds dialog validation rules and sizes the dialog

## Run the sample

### 1) Start the GraphQL server

From the project root:

```bash
cd server
npm install
npm start
```

The server prints the GraphQL URL when it starts.

### 2) Start the Angular client

In a second terminal:

```bash
cd client
npm install
npm start
```

Open the Angular dev server URL (usually `http://localhost:4200`).

### 3) Verify it works

- Paging: use the pager
- Sorting: click column headers
- Filtering: use Excel/Menu/Checkbox filters (depending on column)
- Search: use the toolbar search
- CRUD: Add/Edit/Delete via the grid toolbar and dialog editing

## Next steps

- Replace the in-memory data store with a real database.
- Add authentication/authorization around mutations.
- Add file storage for receipts/avatars instead of base64.
- Add GraphQL persisted queries and server-side validation for inputs.