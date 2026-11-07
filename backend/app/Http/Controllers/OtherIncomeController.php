<?php

namespace App\Http\Controllers;

use App\Models\OtherIncome;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OtherIncomeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim();
        $rows = OtherIncome::query()
            ->when($request->filled('start_date'), fn (Builder $q) => $q->whereDate('income_date', '>=', $request->string('start_date')))
            ->when($request->filled('end_date'), fn (Builder $q) => $q->whereDate('income_date', '<=', $request->string('end_date')))
            ->when($search !== '', fn (Builder $q) => $q->where('title', 'like', '%' . $search . '%'))
            ->orderByDesc('created_at')
            ->get();

        return response()->json($rows);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(OtherIncome::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'amount' => ['required', 'integer', 'min:1'],
            'income_date' => ['required', 'date'],
            'description' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string'],
        ]);

        $income = DB::transaction(function () use ($data) {
            $row = array_merge(['payment_method' => null], $data);
            $income = OtherIncome::create($row);

            $balance = (int) (DB::table('cash_transactions')->orderByDesc('created_at')->value('balance_after') ?? 0);

            DB::table('cash_transactions')->insert([
                'id' => (string) Str::uuid(),
                'transaction_type' => 'other_income',
                'amount' => $data['amount'],
                'balance_after' => $balance + $data['amount'],
                'reference_type' => 'other_income',
                'reference_id' => $income->id,
                'description' => $data['title'],
                'transaction_date' => $data['income_date'],
                'created_at' => now(),
            ]);

            return $income;
        });

        return response()->json($income, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = OtherIncome::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'amount' => ['sometimes', 'integer', 'min:1'],
            'income_date' => ['sometimes', 'date'],
            'description' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string'],
        ]);

        $row->update($data);

        return response()->json($row->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        $row = OtherIncome::findOrFail($id);

        DB::transaction(function () use ($row) {
            $balance = (int) (DB::table('cash_transactions')->orderByDesc('created_at')->value('balance_after') ?? 0);

            DB::table('cash_transactions')->insert([
                'id' => (string) Str::uuid(),
                'transaction_type' => 'adjustment',
                'amount' => -$row->amount,
                'balance_after' => $balance - $row->amount,
                'reference_type' => 'other_income',
                'reference_id' => $row->id,
                'description' => 'حذف درآمد متفرقه: ' . $row->title,
                'transaction_date' => now()->toDateString(),
                'created_at' => now(),
            ]);

            $row->delete();
        });

        return response()->json(['deleted' => true]);
    }
}
