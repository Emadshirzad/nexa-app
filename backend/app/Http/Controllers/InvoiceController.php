<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim();
        $extraFilter = fn (Builder $q, Request $r) => $q
            ->when($r->filled('status'), fn (Builder $q) => $q->where('status', $r->string('status')))
            ->when($r->filled('customer_id'), fn (Builder $q) => $q->where('customer_id', $r->string('customer_id')));

        $query = Invoice::with(['items', 'customer', 'payments'])
            ->tap(fn (Builder $q) => $extraFilter($q, $request))
            ->when($search !== '', fn (Builder $q) => $q->where(function ($w) use ($search) {
                foreach (['invoice_number'] as $field) {
                    $w->orWhere($field, 'like', '%' . $search . '%');
                }
            }))
            ->orderByDesc('created_at');

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        $limit = $request->integer('limit');
        if ($limit > 0) {
            return response()->json($query->limit($limit)->get());
        }

        $rows = $query->paginate($request->integer('per_page', 50));
        return response()->json($rows);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(
            Invoice::with(['items', 'customer', 'payments'])->findOrFail($id)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'invoice_number' => ['required', 'string', 'max:40'],
            'customer_id' => ['nullable', 'uuid'],
            'invoice_date' => ['required', 'date'],
            'status' => ['nullable', 'string', 'in:draft,issued,cancelled'],
            'subtotal' => ['required', 'integer', 'min:0'],
            'item_discount_total' => ['nullable', 'integer', 'min:0'],
            'invoice_discount' => ['nullable', 'integer', 'min:0'],
            'final_amount' => ['required', 'integer', 'min:0'],
            'paid_amount' => ['nullable', 'integer', 'min:0'],
            'outstanding_debt' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
            'issued_at' => ['nullable', 'date'],
            'cancelled_at' => ['nullable', 'date'],
            'cancellation_reason' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
        ]);

        $invoice = DB::transaction(function () use ($data) {
            $itemsData = $data['items'] ?? [];
            unset($data['items']);

            $invoice = Invoice::create($data);

            foreach ($itemsData as $item) {
                $invoice->items()->create([
                    'product_id' => $item['productId'] ?? $item['product_id'] ?? null,
                    'product_name_snapshot' => $item['productNameSnapshot'] ?? $item['product_name_snapshot'] ?? $item['name'] ?? '',
                    'sku_snapshot' => $item['skuSnapshot'] ?? $item['sku_snapshot'] ?? $item['sku'] ?? '',
                    'unit_snapshot' => $item['unitSnapshot'] ?? $item['unit_snapshot'] ?? $item['unit'] ?? 'piece',
                    'unit_price_snapshot' => $item['unitPriceSnapshot'] ?? $item['unit_price_snapshot'] ?? $item['unitPrice'] ?? 0,
                    'quantity' => $item['quantity'] ?? 0,
                    'discount_amount' => $item['discountAmount'] ?? $item['discount_amount'] ?? $item['discount'] ?? 0,
                    'line_total' => $item['lineTotal'] ?? $item['line_total'] ?? 0,
                ]);
            }

            return $invoice->load(['items', 'customer', 'payments']);
        });

        return response()->json($invoice, 201);
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
            'items' => ['nullable', 'array'],
        ]);

        $updated = DB::transaction(function () use ($row, $data) {
            $itemsData = $data['items'] ?? null;
            unset($data['items']);

            $row->update($data);

            if ($itemsData !== null) {
                $row->items()->delete();
                foreach ($itemsData as $item) {
                    $row->items()->create([
                        'product_id' => $item['productId'] ?? $item['product_id'] ?? null,
                        'product_name_snapshot' => $item['productNameSnapshot'] ?? $item['product_name_snapshot'] ?? $item['name'] ?? '',
                        'sku_snapshot' => $item['skuSnapshot'] ?? $item['sku_snapshot'] ?? $item['sku'] ?? '',
                        'unit_snapshot' => $item['unitSnapshot'] ?? $item['unit_snapshot'] ?? $item['unit'] ?? 'piece',
                        'unit_price_snapshot' => $item['unitPriceSnapshot'] ?? $item['unit_price_snapshot'] ?? $item['unitPrice'] ?? 0,
                        'quantity' => $item['quantity'] ?? 0,
                        'discount_amount' => $item['discountAmount'] ?? $item['discount_amount'] ?? $item['discount'] ?? 0,
                        'line_total' => $item['lineTotal'] ?? $item['line_total'] ?? 0,
                    ]);
                }
            }

            return $row->load(['items', 'customer', 'payments']);
        });

        return response()->json($updated);
    }

    public function destroy(string $id): JsonResponse
    {
        Invoice::findOrFail($id)->delete();

        return response()->json(['deleted' => true]);
    }

    public function nextNumber(): JsonResponse
    {
        $numbers = Invoice::pluck('invoice_number');
        $maxNum = 1000;
        foreach ($numbers as $num) {
            if (preg_match('/^INV-(\d+)$/', $num, $matches)) {
                $maxNum = max($maxNum, (int) $matches[1]);
            }
        }

        $next = 'INV-' . ($maxNum + 1);
        return response()->json(['next_invoice_number' => $next]);
    }

    public function hasCancellationMovements(string $id): JsonResponse
    {
        $exists = StockMovement::where('movement_type', 'invoice_cancellation')
            ->where('reference_id', $id)
            ->exists();

        return response()->json(['has_cancellation_movements' => $exists]);
    }
}
