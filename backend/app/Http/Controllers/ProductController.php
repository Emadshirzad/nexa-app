<?php

namespace App\Http\Controllers;

use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim();
        $extraFilter = fn (Builder $q, Request $r) => $q
            ->when($r->boolean('include_archived') === false, fn (Builder $q) => $q->where('is_archived', false))
            ->when($r->filled('category_id'), fn (Builder $q) => $q->where('category_id', $r->string('category_id')))
            ->when($r->boolean('low_stock'), fn (Builder $q) => $q->whereColumn('stock_quantity', '<=', 'min_stock_threshold'));

        $query = Product::query()
            ->tap(fn (Builder $q) => $extraFilter($q, $request))
            ->when($search !== '', fn (Builder $q) => $q->where(function ($w) use ($search) {
                foreach (['name', 'sku'] as $field) {
                    $w->orWhere($field, 'like', '%' . $search . '%');
                }
            }))
            ->orderByDesc('created_at');

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        $rows = $query->paginate($request->integer('per_page', 50));
        return response()->json($rows);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(Product::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'category_id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:200'],
            'sku' => ['required', 'string', 'max:40'],
            'unit' => ['nullable', 'string', 'max:16'],
            'selling_price' => ['required', 'integer', 'min:0'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'min_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'is_archived' => ['nullable', 'boolean'],
        ]);

        return response()->json(Product::create($data), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = Product::findOrFail($id);
        $data = $request->validate([
            'category_id' => ['nullable', 'uuid'],
            'name' => ['sometimes', 'string', 'max:200'],
            'sku' => ['sometimes', 'string', 'max:40'],
            'unit' => ['nullable', 'string', 'max:16'],
            'selling_price' => ['sometimes', 'integer', 'min:0'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'min_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'is_archived' => ['nullable', 'boolean'],
        ]);

        $row->update($data);

        return response()->json($row->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        Product::findOrFail($id)->delete();

        return response()->json(['deleted' => true]);
    }

    public function nextSku(): JsonResponse
    {
        $skus = Product::pluck('sku');
        $maxNum = 0;
        foreach ($skus as $sku) {
            if (preg_match('/^P-1(\d+)$/', $sku, $matches)) {
                $maxNum = max($maxNum, (int) $matches[1]);
            }
        }

        $next = 'P-1' . str_pad((string) ($maxNum + 1), 3, '0', STR_PAD_LEFT);
        return response()->json(['next_sku' => $next]);
    }

    public function hasHistory(string $id): JsonResponse
    {
        $hasMovements = StockMovement::where('product_id', $id)->exists();
        $hasInvoices = InvoiceItem::where('product_id', $id)->exists();

        return response()->json(['has_history' => $hasMovements || $hasInvoices]);
    }
}
