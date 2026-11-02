<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim();
        $extraFilter = fn (Builder $q, Request $r) => $q
        ->when($r->filled('status'), fn (Builder $q) => $q->where('status', $r->string('status')))
        ->when($r->filled('customer_id'), fn (Builder $q) => $q->where('customer_id', $r->string('customer_id')))
    ;

        $rows = Invoice::query()
            ->when($extraFilter, function (Builder $q) use ($request) { $extraFilter($q, $request); })
            ->when($search !== '', fn (Builder $q) => $q->where(function ($w) use ($search) {
                foreach (['invoice_number'] as $field) {
                    $w->orWhere($field, 'like', '%' . $search . '%');
                }
            }))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 50));

        return response()->json($rows);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(Invoice::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'invoice_number' => ['sometimes', 'string', 'max:40'],
            'customer_id' => ['nullable', 'uuid'],
            'invoice_date' => ['sometimes', 'date'],
            'status' => ['nullable', 'string', 'in:draft,issued,cancelled'],
            'subtotal' => ['sometimes', 'integer', 'min:0'],
            'item_discount_total' => ['nullable', 'integer', 'min:0'],
            'invoice_discount' => ['nullable', 'integer', 'min:0'],
            'final_amount' => ['sometimes', 'integer', 'min:0'],
            'paid_amount' => ['nullable', 'integer', 'min:0'],
            'outstanding_debt' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
            'issued_at' => ['nullable', 'date'],
            'cancelled_at' => ['nullable', 'date'],
            'cancellation_reason' => ['nullable', 'string'],
        ]);

        return response()->json(Invoice::create($data), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = Invoice::findOrFail($id);
        $data = $request->validate([
            'invoice_number' => ['sometimes', 'string', 'max:40'],
            'customer_id' => ['nullable', 'uuid'],
            'invoice_date' => ['sometimes', 'date'],
            'status' => ['nullable', 'string', 'in:draft,issued,cancelled'],
            'subtotal' => ['sometimes', 'integer', 'min:0'],
            'item_discount_total' => ['nullable', 'integer', 'min:0'],
            'invoice_discount' => ['nullable', 'integer', 'min:0'],
            'final_amount' => ['sometimes', 'integer', 'min:0'],
            'paid_amount' => ['nullable', 'integer', 'min:0'],
            'outstanding_debt' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
            'issued_at' => ['nullable', 'date'],
            'cancelled_at' => ['nullable', 'date'],
            'cancellation_reason' => ['nullable', 'string'],
        ]);

        $row->update($data);

        return response()->json($row->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        Invoice::findOrFail($id)->delete();

        return response()->json(['deleted' => true]);
    }
}
