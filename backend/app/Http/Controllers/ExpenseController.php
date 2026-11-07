<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim();
        $extraFilter = fn (Builder $q, Request $r) => $q
            ->when($r->filled('start_date'), fn (Builder $q) => $q->whereDate('expense_date', '>=', $r->string('start_date')))
            ->when($r->filled('end_date'), fn (Builder $q) => $q->whereDate('expense_date', '<=', $r->string('end_date')))
            ->when($r->filled('category_id'), fn (Builder $q) => $q->where('category_id', $r->string('category_id')));

        $query = Expense::query()
            ->tap(fn (Builder $q) => $extraFilter($q, $request))
            ->when($search !== '', fn (Builder $q) => $q->where(function ($w) use ($search) {
                foreach (['title'] as $field) {
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
        return response()->json(Expense::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id' => ['nullable', 'uuid'],
            'title' => ['required', 'string', 'max:200'],
            'amount' => ['required', 'integer', 'min:1'],
            'expense_date' => ['required', 'date'],
            'description' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string', 'in:cash,card_transfer,pos,bank_transfer,other'],
        ]);

        $expense = DB::transaction(function () use ($data) {
            $expense = Expense::create($data);

            $balance = (int) (DB::table('cash_transactions')->orderByDesc('created_at')->value('balance_after') ?? 0);

            DB::table('cash_transactions')->insert([
                'id' => (string) Str::uuid(),
                'transaction_type' => 'expense',
                'amount' => -$data['amount'],
                'balance_after' => $balance - $data['amount'],
                'reference_type' => 'expense',
                'reference_id' => $expense->id,
                'description' => $data['title'],
                'transaction_date' => $data['expense_date'],
                'created_at' => now(),
            ]);

            return $expense;
        });

        return response()->json($expense, 201);
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
        $row = Expense::findOrFail($id);

        DB::transaction(function () use ($row) {
            $balance = (int) (DB::table('cash_transactions')->orderByDesc('created_at')->value('balance_after') ?? 0);

            DB::table('cash_transactions')->insert([
                'id' => (string) Str::uuid(),
                'transaction_type' => 'adjustment',
                'amount' => $row->amount,
                'balance_after' => $balance + $row->amount,
                'reference_type' => 'expense',
                'reference_id' => $row->id,
                'description' => 'حذف هزینه: ' . $row->title,
                'transaction_date' => now()->toDateString(),
                'created_at' => now(),
            ]);

            $row->delete();
        });

        return response()->json(['deleted' => true]);
    }
}
