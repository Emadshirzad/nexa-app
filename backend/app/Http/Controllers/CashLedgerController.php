<?php

namespace App\Http\Controllers;

use App\Models\CashTransaction;
use App\Models\Expense;
use App\Models\OtherIncome;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CashLedgerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $limit = $request->integer('limit', 100);
        $rows = CashTransaction::query()
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return response()->json($rows);
    }

    public function balance(): JsonResponse
    {
        $balance = (int) (DB::table('cash_transactions')
            ->orderByDesc('created_at')
            ->value('balance_after') ?? 0);

        return response()->json(['balance' => $balance]);
    }

    public function summary(Request $request): JsonResponse
    {
        $startDate = $request->string('start_date')->trim()->toString();
        $endDate = $request->string('end_date')->trim()->toString();

        $currentBalance = (int) (DB::table('cash_transactions')
            ->orderByDesc('created_at')
            ->value('balance_after') ?? 0);

        $totalReceipts = (int) Payment::query()
            ->where('is_voided', false)
            ->when($startDate !== '', fn ($q) => $q->whereDate('payment_date', '>=', $startDate))
            ->when($endDate !== '', fn ($q) => $q->whereDate('payment_date', '<=', $endDate))
            ->sum('amount');

        $totalExpenses = (int) Expense::query()
            ->when($startDate !== '', fn ($q) => $q->whereDate('expense_date', '>=', $startDate))
            ->when($endDate !== '', fn ($q) => $q->whereDate('expense_date', '<=', $endDate))
            ->sum('amount');

        $totalOtherIncomes = (int) OtherIncome::query()
            ->when($startDate !== '', fn ($q) => $q->whereDate('income_date', '>=', $startDate))
            ->when($endDate !== '', fn ($q) => $q->whereDate('income_date', '<=', $endDate))
            ->sum('amount');

        $netSurplus = $totalReceipts + $totalOtherIncomes - $totalExpenses;

        return response()->json([
            'current_cash_balance' => $currentBalance,
            'total_receipts' => $totalReceipts,
            'total_expenses' => $totalExpenses,
            'total_other_incomes' => $totalOtherIncomes,
            'net_surplus' => $netSurplus,
        ]);
    }
}
