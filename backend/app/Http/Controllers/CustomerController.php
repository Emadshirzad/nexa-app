<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim();
        $extraFilter = fn (Builder $q, Request $r) => $q
            ->when($r->boolean('include_archived') === false, fn (Builder $q) => $q->where('is_archived', false))
            ->when($r->filled('tag'), fn (Builder $q) => $q->whereJsonContains('tags', $r->string('tag')));

        $query = Customer::query()
            ->tap(fn (Builder $q) => $extraFilter($q, $request))
            ->when($search !== '', fn (Builder $q) => $q->where(function ($w) use ($search) {
                foreach (['name', 'mobile'] as $field) {
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
        return response()->json(Customer::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:120'],
            'mobile' => ['required', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:250'],
            'notes' => ['nullable', 'string'],
            'follow_up_date' => ['nullable', 'date'],
            'is_archived' => ['nullable', 'boolean'],
            'tags' => ['nullable', 'array'],
        ]);

        return response()->json(Customer::create($data), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = Customer::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'mobile' => ['sometimes', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:250'],
            'notes' => ['nullable', 'string'],
            'follow_up_date' => ['nullable', 'date'],
            'is_archived' => ['nullable', 'boolean'],
            'tags' => ['nullable', 'array'],
        ]);

        $row->update($data);

        return response()->json($row->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        Customer::findOrFail($id)->delete();

        return response()->json(['deleted' => true]);
    }

    public function financialSummary(string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $issuedInvoices = Invoice::where('customer_id', $customer->id)
            ->where('status', 'issued')
            ->get();

        $totalPurchases = (int) $issuedInvoices->sum('final_amount');
        $invoiceCount = $issuedInvoices->count();

        $totalPayments = (int) Payment::where('customer_id', $customer->id)
            ->where('is_voided', false)
            ->sum('amount');

        $outstandingDebt = $totalPurchases - $totalPayments;

        return response()->json([
            'totalPurchases' => $totalPurchases,
            'totalPayments' => $totalPayments,
            'outstandingDebt' => $outstandingDebt,
            'invoiceCount' => $invoiceCount,
        ]);
    }

    public function tags(): JsonResponse
    {
        $customers = Customer::whereNotNull('tags')->get(['tags']);
        $tagsSet = [];
        foreach ($customers as $c) {
            if (is_array($c->tags)) {
                foreach ($c->tags as $t) {
                    if (is_string($t) && $t !== '') {
                        $tagsSet[$t] = true;
                    }
                }
            }
        }
        $tags = array_keys($tagsSet);
        sort($tags);

        return response()->json($tags);
    }
}
