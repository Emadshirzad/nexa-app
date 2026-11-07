<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StockMovementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rows = StockMovement::query()
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->string('product_id')))
            ->when($request->filled('reference_type'), fn ($q) => $q->where('reference_type', $request->string('reference_type')))
            ->when($request->filled('reference_id'), fn ($q) => $q->where('reference_id', $request->string('reference_id')))
            ->orderByDesc('created_at')
            ->get();

        return response()->json($rows);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'movement_type' => ['required', 'string', 'in:initial,addition,deduction,adjustment,invoice_sale,invoice_cancellation'],
            'quantity' => ['required', 'integer'],
            'reference_type' => ['nullable', 'string', 'max:255'],
            'reference_id' => ['nullable', 'string', 'max:255'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $movement = DB::transaction(function () use ($data) {
            $movement = StockMovement::create([
                'product_id' => $data['product_id'],
                'movement_type' => $data['movement_type'],
                'quantity' => abs($data['quantity']),
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'reason' => $data['reason'],
                'created_at' => now(),
            ]);

            return $movement;
        });

        return response()->json($movement, 201);
    }

    public function reconciled(string $productId): JsonResponse
    {
        Product::findOrFail($productId);

        $movements = StockMovement::where('product_id', $productId)->get();
        $positiveTypes = ['initial', 'addition', 'invoice_cancellation', 'adjustment'];

        $totalScaled = 0;
        foreach ($movements as $m) {
            $qty = (int) $m->quantity;
            if (in_array($m->movement_type, $positiveTypes, true)) {
                $totalScaled += $qty;
            } else {
                $totalScaled -= $qty;
            }
        }

        return response()->json([
            'product_id' => $productId,
            'reconciled_stock' => $totalScaled,
        ]);
    }
}
