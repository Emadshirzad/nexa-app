<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $today = $request->string('today')->trim()->toString();
        if ($today === '') {
            $today = now()->toDateString();
        }

        $issuedInvoices = Invoice::where('status', 'issued');

        $todaySales = (int) (clone $issuedInvoices)->whereDate('invoice_date', $today)->sum('final_amount');
        $todaySalesCount = (int) (clone $issuedInvoices)->whereDate('invoice_date', $today)->count();

        $todayReceipts = (int) Payment::where('is_voided', false)
            ->whereDate('payment_date', $today)
            ->sum('amount');

        $totalOutstandingDebt = (int) (clone $issuedInvoices)->sum('outstanding_debt');

        $pendingTasksTodayCount = Task::where('status', '!=', 'completed')
            ->whereDate('due_date', '<=', $today)
            ->count();

        $cashBalance = (int) (DB::table('cash_transactions')->orderByDesc('created_at')->value('balance_after') ?? 0);

        $lowStockCount = Product::where('is_archived', false)
            ->whereColumn('stock_quantity', '<=', 'min_stock_threshold')
            ->count();

        $recentInvoices = Invoice::with('customer')
            ->where('status', 'issued')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn ($inv) => [
                'id' => $inv->id,
                'invoiceNumber' => $inv->invoice_number,
                'customerName' => $inv->customer?->name ?? 'مشتری عمومی',
                'totalAmount' => (int) $inv->final_amount,
                'status' => $inv->status,
                'createdAt' => $inv->created_at?->toISOString() ?? now()->toISOString(),
            ]);

        $todayTasks = Task::whereDate('due_date', '<=', $today)
            ->orderByDesc('due_date')
            ->limit(5)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'priority' => $t->priority,
                'dueDate' => $t->due_date?->toDateString() ?? $today,
                'isCompleted' => $t->status === 'completed',
            ]);

        return response()->json([
            'todaySales' => $todaySales,
            'todaySalesCount' => $todaySalesCount,
            'todayReceipts' => $todayReceipts,
            'totalOutstandingDebt' => $totalOutstandingDebt,
            'pendingTasksTodayCount' => $pendingTasksTodayCount,
            'cashBalance' => $cashBalance,
            'lowStockCount' => $lowStockCount,
            'recentInvoices' => $recentInvoices,
            'todayTasks' => $todayTasks,
        ]);
    }

    public function monthlyTrends(Request $request): JsonResponse
    {
        $limit = $request->integer('limit', 6);

        $invoices = Invoice::where('status', 'issued')
            ->orderByDesc('invoice_date')
            ->get();

        $monthMap = [];
        foreach ($invoices as $inv) {
            $date = $inv->invoice_date;
            if (!$date) continue;
            $key = substr($date->toDateString(), 0, 7); // YYYY-MM

            if (!isset($monthMap[$key])) {
                $monthMap[$key] = [
                    'monthKey' => $key,
                    'jalaliLabel' => $key,
                    'invoiceCount' => 0,
                    'totalSales' => 0,
                    'totalCollected' => 0,
                ];
            }

            $monthMap[$key]['invoiceCount']++;
            $monthMap[$key]['totalSales'] += (int) $inv->final_amount;
            $monthMap[$key]['totalCollected'] += (int) $inv->paid_amount;
        }

        krsort($monthMap);
        $result = array_values(array_slice($monthMap, 0, $limit));

        return response()->json($result);
    }

    public function topProducts(Request $request): JsonResponse
    {
        $limit = $request->integer('limit', 5);

        $items = InvoiceItem::query()
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->where('invoices.status', 'issued')
            ->select(
                'invoice_items.product_id',
                'invoice_items.product_name_snapshot as productName',
                'invoice_items.unit_snapshot as unit',
                DB::raw('SUM(invoice_items.quantity) as totalQuantityScaled'),
                DB::raw('SUM(invoice_items.line_total) as totalRevenue')
            )
            ->groupBy('invoice_items.product_id', 'invoice_items.product_name_snapshot', 'invoice_items.unit_snapshot')
            ->orderByDesc('totalRevenue')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'productId' => $r->product_id ?? $r->productName,
                'productName' => $r->productName,
                'unit' => $r->unit,
                'totalQuantityScaled' => (int) $r->totalQuantityScaled,
                'totalRevenue' => (int) $r->totalRevenue,
            ]);

        return response()->json($items);
    }

    public function debtors(): JsonResponse
    {
        $invoices = Invoice::with('customer')
            ->where('status', 'issued')
            ->where('outstanding_debt', '>', 0)
            ->get();

        $debtMap = [];
        foreach ($invoices as $inv) {
            $cid = $inv->customer_id;
            if (!$cid || !$inv->customer) continue;

            if (!isset($debtMap[$cid])) {
                $debtMap[$cid] = [
                    'customerId' => $cid,
                    'fullName' => $inv->customer->name,
                    'mobile' => $inv->customer->mobile,
                    'totalDebt' => 0,
                    'lastInvoiceDate' => $inv->invoice_date?->toDateString(),
                ];
            }

            $debtMap[$cid]['totalDebt'] += (int) $inv->outstanding_debt;
            $debtDate = $inv->invoice_date?->toDateString();
            if ($debtDate && (!$debtMap[$cid]['lastInvoiceDate'] || $debtDate > $debtMap[$cid]['lastInvoiceDate'])) {
                $debtMap[$cid]['lastInvoiceDate'] = $debtDate;
            }
        }

        uasort($debtMap, fn ($a, $b) => $b['totalDebt'] <=> $a['totalDebt']);

        return response()->json(array_values($debtMap));
    }

    public function lowStock(): JsonResponse
    {
        $products = Product::where('is_archived', false)
            ->whereColumn('stock_quantity', '<=', 'min_stock_threshold')
            ->get()
            ->map(fn ($p) => [
                'productId' => $p->id,
                'productName' => $p->name,
                'sku' => $p->sku,
                'currentStockScaled' => (int) $p->stock_quantity,
                'minThresholdScaled' => (int) $p->min_stock_threshold,
                'unit' => $p->unit,
                'deficitScaled' => max(0, (int) $p->min_stock_threshold - (int) $p->stock_quantity),
            ]);

        return response()->json($products);
    }

    public function globalSearch(Request $request): JsonResponse
    {
        $q = $request->string('q')->trim()->toString();
        if ($q === '') {
            return response()->json([]);
        }

        $limit = $request->integer('limit', 5);
        $results = [];

        // Customers
        Customer::where(fn ($w) => $w->where('name', 'like', "%{$q}%")->orWhere('mobile', 'like', "%{$q}%"))
            ->limit($limit)
            ->get()
            ->each(function ($c) use (&$results) {
                $results[] = [
                    'id' => $c->id,
                    'type' => 'customer',
                    'title' => $c->name,
                    'subtitle' => $c->mobile,
                    'route' => "/customers/{$c->id}",
                    'badge' => 'مشتری',
                ];
            });

        // Products
        Product::where(fn ($w) => $w->where('name', 'like', "%{$q}%")->orWhere('sku', 'like', "%{$q}%"))
            ->limit($limit)
            ->get()
            ->each(function ($p) use (&$results) {
                $results[] = [
                    'id' => $p->id,
                    'type' => 'product',
                    'title' => $p->name,
                    'subtitle' => "{$p->sku} — " . number_format($p->selling_price) . ' تومان',
                    'route' => "/products/{$p->id}",
                    'badge' => 'کالا',
                ];
            });

        // Invoices
        Invoice::where('invoice_number', 'like', "%{$q}%")
            ->limit($limit)
            ->get()
            ->each(function ($inv) use (&$results) {
                $results[] = [
                    'id' => $inv->id,
                    'type' => 'invoice',
                    'title' => "فاکتور {$inv->invoice_number}",
                    'subtitle' => number_format($inv->final_amount) . ' تومان',
                    'route' => "/invoices/{$inv->id}",
                    'badge' => 'فاکتور',
                ];
            });

        // Leads
        Lead::where(fn ($w) => $w->where('name', 'like', "%{$q}%")->orWhere('mobile', 'like', "%{$q}%"))
            ->limit($limit)
            ->get()
            ->each(function ($l) use (&$results) {
                $results[] = [
                    'id' => $l->id,
                    'type' => 'lead',
                    'title' => $l->name,
                    'subtitle' => $l->mobile,
                    'route' => "/leads/{$l->id}",
                    'badge' => 'سرنخ',
                ];
            });

        // Tasks
        Task::where('title', 'like', "%{$q}%")
            ->limit($limit)
            ->get()
            ->each(function ($t) use (&$results) {
                $results[] = [
                    'id' => $t->id,
                    'type' => 'task',
                    'title' => $t->title,
                    'subtitle' => $t->due_date?->toDateString() ?? '',
                    'route' => '/tasks',
                    'badge' => 'وظیفه',
                ];
            });

        return response()->json($results);
    }
}
