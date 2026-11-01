# Nexa CRM — Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    categories ||--o{ products : classifies
    products ||--o{ stock_movements : logs
    products ||--o{ invoice_items : referenced_in

    customers ||--o{ invoices : receives
    customers ||--o{ customer_tags : tagged_with
    tags ||--o{ customer_tags : applies_to
    customers ||--o{ customer_notes : has
    customers ||--o{ payments : makes
    leads ||--o| customers : converts_to
    leads ||--o{ lead_activities : logs

    invoices ||--|{ invoice_items : contains
    invoices ||--o{ payments : settled_by

    expense_categories ||--o{ expenses : classifies

    payments ||--o| cash_transactions : impacts
    expenses ||--o| cash_transactions : impacts
    other_incomes ||--o| cash_transactions : impacts

    tasks }o--o| customers : references
    tasks }o--o| leads : references
    tasks }o--o| invoices : references
```

## Relationship Cardinalities & Cascade Policies

1. **Category -> Products (`1:N`):**
   - `ON DELETE SET NULL`: Archiving or deleting a category leaves the product intact with null category.
2. **Product -> Stock Movements (`1:N`):**
   - `ON DELETE RESTRICT`: Products with stock history cannot be hard deleted.
3. **Invoice -> Invoice Items (`1:N`):**
   - `ON DELETE CASCADE` (only applicable for drafts; issued invoices are never deleted).
4. **Customer -> Invoices (`1:N`):**
   - `ON DELETE RESTRICT`: Customers with issued invoices cannot be hard deleted.
5. **Customer -> Notes & Tags (`1:N`, `N:M`):**
   - `ON DELETE CASCADE`: Deleting an unlinked test customer cleans up associated tags and notes.
6. **Lead -> Customer (`1:1` optional):**
   - When converted, `leads.converted_customer_id` links to the generated customer ID.
