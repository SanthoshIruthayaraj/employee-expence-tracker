import { Component, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  GridModule,
  PageService,
  SortService,
  FilterService,
  GroupService,
  SearchService,
  ToolbarService,
  EditService,
  CommandColumnService,
  CommandModel,
  IEditCell,
  SaveEventArgs,
  DialogEditEventArgs,
} from "@syncfusion/ej2-angular-grids";
import { DataManager, GraphQLAdaptor, Query } from "@syncfusion/ej2-data";
import { MultiSelect } from "@syncfusion/ej2-dropdowns";
import {
  TextBoxModule,
  NumericTextBoxModule,
  UploaderModule,
  SelectedEventArgs,
} from "@syncfusion/ej2-angular-inputs";
import {
  DropDownListModule,
  MultiSelectModule,
} from "@syncfusion/ej2-angular-dropdowns";
import { DatePickerModule } from "@syncfusion/ej2-angular-calendars";
import { CheckBoxModule } from "@syncfusion/ej2-angular-buttons";
import { ReactiveFormsModule, FormsModule, FormGroup } from "@angular/forms";

import { ExpenseRecord } from "./models/transaction-record";
import {
  TAG_OPTIONS,
  STATUS_BADGES,
  DEPARTMENTS,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  CURRENCIES,
  STATUS_OPTIONS,
} from "./constants/lookups";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    GridModule,
    TextBoxModule,
    NumericTextBoxModule,
    DropDownListModule,
    MultiSelectModule,
    DatePickerModule,
    CheckBoxModule,
    UploaderModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  providers: [
    PageService,
    SortService,
    FilterService,
    GroupService,
    SearchService,
    ToolbarService,
    EditService,
    CommandColumnService,
  ],
})
export class AppComponent {
  @ViewChild("expenseForm") public expenseForm?: FormGroup | any;
  public expenseData!: ExpenseRecord;
  public avatarPreview: string | null = null;

  // DataManager + GraphQL adaptor
  public expenseManager: DataManager;

  // Grid configs
  public pageSettings = { pageSize: 20, pageSizes: true };
  public filterSettings = { type: "Excel" };
  public menuFilter = { type: "Menu" };
  public checkboxFilter = { type: "CheckBox" };

  public searchSettings = {
    fields: [
      "expenseId",
      "employeeName",
      "employeeEmail",
      "department",
      "category",
      "paymentMethod",
      "tags",
    ],
  };
  public groupSettings = { showDropArea: true };
  public toolbar: string[] = ["Add", "Edit", "Delete", "Search"];
  public editSettings = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    mode: "Dialog",
  };

  // Dropdown options + status map
  public statusBadges = STATUS_BADGES;
  public departmentOptions = DEPARTMENTS;
  public categoryOptions = EXPENSE_CATEGORIES;
  public paymentOptions = PAYMENT_METHODS;
  public currencyOptions = CURRENCIES;
  public tagOptions = TAG_OPTIONS;
  public statusOptions = STATUS_OPTIONS;

  // Command buttons for each row
  public rowCommands: CommandModel[] = [
    {
      type: "Edit",
      buttonOption: { cssClass: "e-flat e-primary", content: "Edit" },
    },
    {
      type: "Delete",
      buttonOption: { cssClass: "e-flat e-danger", content: "Delete" },
    },
    {
      type: "Save",
      buttonOption: { cssClass: "e-flat e-success", content: "Save" },
    },
    { type: "Cancel", buttonOption: { cssClass: "e-flat", content: "Cancel" } },
  ];

  // Dropdown edit params (no foreign keys, values stored as text)
  public departmentEditParams: IEditCell = {
    params: { dataSource: this.departmentOptions, query: new Query() },
  };
  public categoryEditParams: IEditCell = {
    params: { dataSource: this.categoryOptions, query: new Query() },
  };
  public paymentEditParams: IEditCell = {
    params: { dataSource: this.paymentOptions, query: new Query() },
  };
  public currencyEditParams: IEditCell = {
    params: { dataSource: this.currencyOptions, query: new Query() },
  };
  public statusEditParams: IEditCell = {
    params: { dataSource: this.statusOptions, query: new Query() },
  };

  // Tags MultiSelect editor
  private tagEditor?: MultiSelect;
  public tagEditParams: IEditCell = {
    create: () => document.createElement("input"),
    read: () => this.tagEditor?.value ?? [],
    destroy: () => this.tagEditor?.destroy(),
    write: (args: any) => {
      this.tagEditor = new MultiSelect({
        dataSource: this.tagOptions,
        value: (args.rowData as ExpenseRecord)?.tags ?? [],
        mode: "Box",
        allowFiltering: true,
        placeholder: "Select tags",
      });
      this.tagEditor.appendTo(args.element as HTMLElement);
    },
  };

  constructor() {
    this.expenseManager = new DataManager({
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
              mutation addExpense($value: ExpenseInput!) {
                addExpense(value: $value) {
                  expenseId
                }
              }
            `;
          }
          if (action === "update") {
            return `
              mutation updateExpense($key: ID!, $keyColumn: String, $value: ExpenseInput!) {
                updateExpense(key: $key, keyColumn: $keyColumn, value: $value) {
                  expenseId
                }
              }
            `;
          }
          return `
            mutation deleteExpense($key: ID!, $keyColumn: String, $value: ExpenseInput) {
              deleteExpense(key: $key, keyColumn: $keyColumn, value: $value)
            }
          `;
        },
      }),
    });
  }

  public formatCurrency(amount: number, currencyLabel: string): string {
    const currencyCode = currencyLabel?.split("-")[0].trim() || "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount ?? 0);
  }

  actionBegin(args: SaveEventArgs): void {
    if (args.requestType === "beginEdit" || args.requestType === "add") {
      const source = (args.rowData as ExpenseRecord) || ({} as ExpenseRecord);
      this.expenseData = { ...source };
      this.avatarPreview = this.expenseData.employeeAvatarUrl ?? null;
    }

    if (args.requestType === "save") {
      if (this.expenseForm.valid) {
        const amount = this.expenseData.amount ?? 0;
        const taxPct = this.expenseData.taxPct ?? 0;
        this.expenseData.totalAmount = amount + amount * taxPct;
        args.data = this.expenseData;
      } else {
        args.cancel = true;
      }
    }
  }

  actionComplete(args: DialogEditEventArgs): void {
    if (args.requestType === "beginEdit" || args.requestType === "add") {
      const formObj = (args.form as HTMLFormElement)["ej2_instances"][0];

      formObj.addRules("expenseId", {
        required: [true, "Expense ID is required."],
      });

      formObj.addRules("employeeName", {
        required: [true, "Employee name is required."],
        minLength: [5, "Employee name must be at least 5 characters."],
        maxLength: [30, "Employee name cannot exceed 30 characters."],
      });

      formObj.addRules("employeeEmail", {
        required: [true, "Email is required."],
        email: [true, "Enter a valid email address."],
      });

      formObj.addRules("amount", {
        required: [true, "Amount is required."],
        min: [1, "Amount must be greater than 0."],
      });

      formObj.addRules("taxPct", {
        required: [true, "Tax % is required."],
        min: [0.02, "Tax % cannot be less than 2%."],
        max: [0.12, "Tax % cannot exceed 12%."],
      });

      if (args.dialog) {
        args.dialog.width = 600;
      }
    }
  }

  public onAvatarSelected(args: SelectedEventArgs): void {
    const file = args.filesData[0]?.rawFile as File | undefined;
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
      this.expenseData.employeeAvatarUrl = this.avatarPreview;
    };
    reader.readAsDataURL(file);
  }

  public clearAvatar(): void {
    this.avatarPreview = null;
    this.expenseData.employeeAvatarUrl = "";
  }
}
