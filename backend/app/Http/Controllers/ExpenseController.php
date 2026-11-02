<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim();
        $extraFilter = fn (Builder $q, Request $r) => $q
        ->when($r->filled('start_date'), fn (Builder $q) => $q->whereDate('expense_date', '>=', $r->string('start_date')))
        ->when($r->filled('end_date'), fn (Builder $q) => $q->whereDate('expense_date', '<=', $r->string('end_date')))
    ;

        $rows = Expense::query()
            ->when($extraFilter, function (Builder $q) use ($request) { $extraFilter($q, $request); })
            ->when($search !== '', fn (Builder $q) => $q->where(function ($w) use ($search) {
                foreach (['title'] as $field) {
                    $w->orWhere($field, 'like', '%' . $search . '%');
                }
            }))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 50));

        return response()->json($rows);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(Expense::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id' => ['nullable', 'uuid'],
            'title' => ['sometimes', 'string', 'max:200'],
            'amount' => ['sometimes', 'integer', 'min:1'],
            'expense_date' => ['sometimes', 'date'],
            'description' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string', 'in:cash,card_transfer,pos,bank_transfer,other'],
        ]);

        return response()->json(Expense::create($data), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = Expense::findOrFail($id);
        $data = $request->validate([
            'category_id' => ['nullable', 'uuid'],
            'title' => ['sometimes', 'string', 'max:200'],
            'amount' => ['sometimes', 'integer', 'min:1'],
            'expense_date' => ['sometimes', 'date'],
            'description' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string', 'in:cash,card_transfer,pos,bank_transfer,other'],
        ]);

        $row->update($data);

        return response()->json($row->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        Expense::findOrFail($id)->delete();

        return response()->json(['deleted' => true]);
    }
}
