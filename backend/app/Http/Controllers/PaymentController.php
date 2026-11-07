<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function store(Request $request, string $invoiceId): JsonResponse
    {
        $invoice = Invoice::findOrFail($invoiceId);

        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'amount' => ['required', 'integer', 'min:1'],
            'payment_method' => ['required', 'string', 'in:cash,card_transfer,pos,bank_transfer,other'],
            'payment_date' => ['required', 'date'],
            'reference_number' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string'],
        ]);

        $payment = DB::transaction(function () use ($invoice, $data) {
            $newPaid = $invoice->paid_amount + $data['amount'];
            $newDebt = max(0, $invoice->final_amount - $newPaid);

            $payment = Payment::create([
                'id' => $data['id'] ?? null,
                'invoice_id' => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'],
                'payment_date' => $data['payment_date'],
                'reference_number' => $data['reference_number'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $invoice->update([
                'paid_amount' => $newPaid,
                'outstanding_debt' => $newDebt,
            ]);

            $balance = (int) (DB::table('cash_transactions')
                ->orderByDesc('created_at')
                ->value('balance_after') ?? 0);

            DB::table('cash_transactions')->insert([
                'id' => (string) Str::uuid(),
                'transaction_type' => 'invoice_payment',
                'amount' => $data['amount'],
                'balance_after' => $balance + $data['amount'],
                'reference_type' => 'invoice',
                'reference_id' => $invoice->id,
                'description' => 'وصول فاکتور ' . $invoice->invoice_number,
                'transaction_date' => $data['payment_date'],
                'created_at' => now(),
            ]);

            return $payment;
        });

        return response()->json($payment, 201);
    }

    public function index(string $invoiceId): JsonResponse
    {
        return response()->json(
            Payment::where('invoice_id', $invoiceId)
                ->where('is_voided', false)
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function listByCustomer(string $customerId): JsonResponse
    {
        return response()->json(
            Payment::where('customer_id', $customerId)
                ->where('is_voided', false)
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function listAll(Request $request): JsonResponse
    {
        $query = Payment::query()
            ->when($request->filled('invoice_id'), fn ($q) => $q->where('invoice_id', $request->string('invoice_id')))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->string('customer_id')))
            ->when(!$request->boolean('include_voided'), fn ($q) => $q->where('is_voided', false))
            ->orderByDesc('created_at');

        return response()->json($query->get());
    }

    public function void(Request $request, string $paymentId): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:200']]);
        $payment = Payment::findOrFail($paymentId);

        DB::transaction(function () use ($payment, $data) {
            if ($payment->is_voided) {
                return;
            }

            $invoice = $payment->invoice;
            if ($invoice) {
                $newPaid = max(0, $invoice->paid_amount - $payment->amount);
                $invoice->update([
                    'paid_amount' => $newPaid,
                    'outstanding_debt' => max(0, $invoice->final_amount - $newPaid),
                ]);
            }

            $balance = (int) (DB::table('cash_transactions')
                ->orderByDesc('created_at')
                ->value('balance_after') ?? 0);

            DB::table('cash_transactions')->insert([
                'id' => (string) Str::uuid(),
                'transaction_type' => 'adjustment',
                'amount' => -$payment->amount,
                'balance_after' => $balance - $payment->amount,
                'reference_type' => 'payment',
                'reference_id' => $payment->id,
                'description' => 'ابطال پرداخت: ' . $data['reason'],
                'transaction_date' => now()->toDateString(),
                'created_at' => now(),
            ]);

            $payment->update([
                'is_voided' => true,
                'voided_at' => now(),
                'void_reason' => $data['reason'],
            ]);
        });

        return response()->json($payment);
    }
}
